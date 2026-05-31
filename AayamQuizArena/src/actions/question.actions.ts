"use server";

import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/schemas/question.schema";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function createQuestion(
  quizId: string,
  data: Record<string, any>
): Promise<ActionResponse<string>> {
  try {
    const parsed = questionSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { text, type, mediaUrl, timeLimit, points, explanation, templateRoundId, options, questionSet } = parsed.data;

    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.quizQuestion.create({
        data: {
          quizId,
          text,
          type,
          mediaUrl,
          timeLimit,
          points,
          explanation,
          templateRoundId,
          questionSet: questionSet || "A",
        },
      });

      if (options && options.length > 0) {
        await tx.quizQuestionOption.createMany({
          data: options.map((opt, index) => ({
            questionId: q.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder ?? index,
          })),
        });
      }

      return q;
    });

    revalidatePath(`/admin/quizzes/${quizId}`);
    return { success: true, data: question.id };
  } catch (error) {
    console.error("Failed to create question:", error);
    return { success: false, error: "Failed to create question" };
  }
}

export async function updateQuestion(
  questionId: string,
  data: Record<string, any>
): Promise<ActionResponse> {
  try {
    const parsed = questionSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { text, type, mediaUrl, timeLimit, points, explanation, templateRoundId, options, questionSet } = parsed.data;

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.quizQuestion.update({
        where: { id: questionId },
        data: {
          text,
          type,
          mediaUrl,
          timeLimit,
          points,
          explanation,
          templateRoundId,
          questionSet: questionSet || "A",
        },
      });

      // Clear old options and rebuild
      await tx.quizQuestionOption.deleteMany({
        where: { questionId },
      });

      if (options && options.length > 0) {
        await tx.quizQuestionOption.createMany({
          data: options.map((opt, index) => ({
            questionId,
            text: opt.text,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder ?? index,
          })),
        });
      }
    });

    revalidatePath(`/admin/quizzes/${question.quizId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update question:", error);
    return { success: false, error: "Failed to update question" };
  }
}

export async function deleteQuestion(questionId: string): Promise<ActionResponse> {
  try {
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    await prisma.quizQuestion.delete({
      where: { id: questionId },
    });

    revalidatePath(`/admin/quizzes/${question.quizId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete question:", error);
    return { success: false, error: "Failed to delete question" };
  }
}

export async function getEvents(): Promise<{ id: string; name: string }[]> {
  try {
    return await prisma.event.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to get events list:", error);
    return [];
  }
}

export async function importQuestions(
  quizId: string,
  questionsData: any[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    if (!Array.isArray(questionsData)) {
      return { success: false, error: "Invalid JSON format. Expected an array of questions." };
    }

    console.log(`Starting bulk import of ${questionsData.length} questions for quiz ${quizId}`);

    // 1. Pre-resolve unique template rounds mentioned in the question import
    const uniqueRoundsMap = new Map<number, { title: string; type: string; timeLimit: number; points: number }>();
    for (const item of questionsData) {
      if (item.roundNumber !== undefined) {
        const roundNum = parseInt(item.roundNumber) || 1;
        if (!uniqueRoundsMap.has(roundNum)) {
          uniqueRoundsMap.set(roundNum, {
            title: item.roundTitle || `Round ${roundNum}`,
            type: item.roundType || "MCQ",
            timeLimit: item.roundTimeLimit !== undefined ? parseInt(item.roundTimeLimit) : 30,
            points: item.roundPoints !== undefined ? parseInt(item.roundPoints) : 10,
          });
        }
      }
    }

    // 2. Fetch existing template rounds for this quiz
    const existingRounds = await prisma.quizTemplateRound.findMany({
      where: { quizId },
    });
    const roundIdMap = new Map<number, string>();
    for (const r of existingRounds) {
      roundIdMap.set(r.roundNumber, r.id);
    }

    // 3. Create missing template rounds upfront (outside the main question insert loops)
    for (const [roundNum, info] of uniqueRoundsMap.entries()) {
      if (!roundIdMap.has(roundNum)) {
        const rawType = info.type ? info.type.toUpperCase() : "MCQ";
        const validTypes = ["MCQ", "BUZZER", "HAND_RAISE", "RAPID_FIRE", "TEAM_ANSWER", "PASS_TO_MEMBER", "PASS_ROUND"];
        const roundType = validTypes.includes(rawType) ? rawType : "MCQ";

        try {
          const newRound = await prisma.quizTemplateRound.create({
            data: {
              quizId,
              roundNumber: roundNum,
              title: info.title,
              type: roundType as any,
              timeLimit: info.timeLimit,
              pointsPerQuestion: info.points,
            },
          });
          roundIdMap.set(roundNum, newRound.id);
          console.log(`Created template round ${roundNum} (ID: ${newRound.id}) for import`);
        } catch (err) {
          console.error(`Failed to create template round ${roundNum}:`, err);
          throw new Error(`Failed to initialize template round ${roundNum} for import`);
        }
      }
    }

    // 4. Batch process question insertions in chunks of 25
    let importedCount = 0;
    const batchSize = 25;

    for (let i = 0; i < questionsData.length; i += batchSize) {
      const batch = questionsData.slice(i, i + batchSize);

      await prisma.$transaction(async (tx) => {
        for (const item of batch) {
          if (!item.text) continue;

          const roundNum = item.roundNumber !== undefined ? parseInt(item.roundNumber) : null;
          const templateRoundId = roundNum !== null ? roundIdMap.get(roundNum) || null : null;

          // Create the question
          const q = await tx.quizQuestion.create({
            data: {
              quizId,
              templateRoundId,
              text: item.text,
              type: item.type || "MCQ",
              mediaUrl: item.mediaUrl || null,
              timeLimit: item.timeLimit !== undefined ? parseInt(item.timeLimit) : 30,
              points: item.points !== undefined ? parseInt(item.points) : 10,
              explanation: item.explanation || null,
              questionSet: item.questionSet || "A",
            },
          });

          // Add options if any
          if (Array.isArray(item.options) && item.options.length > 0) {
            await tx.quizQuestionOption.createMany({
              data: item.options.map((opt: any, index: number) => ({
                questionId: q.id,
                text: opt.text,
                isCorrect: opt.isCorrect === true || opt.isCorrect === "true",
                sortOrder: opt.sortOrder !== undefined ? parseInt(opt.sortOrder) : index,
              })),
            });
          }

          importedCount++;
        }
      }, {
        timeout: 15000, // 15s timeout per batch transaction
      });

      console.log(`Successfully imported batch ${Math.floor(i / batchSize) + 1}. Total imported questions: ${importedCount}`);
    }

    revalidatePath(`/admin/quizzes/${quizId}`);
    return { success: true, data: { count: importedCount } };
  } catch (error: any) {
    console.error("Failed to import questions:", error);
    return { success: false, error: error.message || "Failed to import questions" };
  }
}

export async function getFilteredQuestions(filters: {
  quizId?: string;
  type?: string;
  roundId?: string;
  questionSet?: string;
}) {
  try {
    const where: any = {};
    if (filters.quizId) where.quizId = filters.quizId;
    if (filters.type) where.type = filters.type;
    if (filters.roundId) where.templateRoundId = filters.roundId;
    if (filters.questionSet) where.questionSet = filters.questionSet;

    const questions = await prisma.quizQuestion.findMany({
      where,
      include: {
        quiz: { select: { name: true, mode: true } },
        options: { orderBy: { sortOrder: "asc" } },
        templateRound: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rounds = filters.quizId
      ? await prisma.quizTemplateRound.findMany({
          where: { quizId: filters.quizId },
          select: { id: true, title: true },
          orderBy: { roundNumber: "asc" },
        })
      : [];

    let roundSummary: { name: string; count: number }[] = [];
    if (filters.quizId) {
      const quizRounds = await prisma.quizTemplateRound.findMany({
        where: { quizId: filters.quizId },
        select: {
          id: true,
          title: true,
          questions: { select: { id: true } },
        },
        orderBy: { roundNumber: "asc" },
      });
      roundSummary = quizRounds.map((r) => ({
        name: r.title,
        count: r.questions.length,
      }));
    }

    return {
      success: true,
      data: {
        questions,
        rounds: rounds.map((r) => ({ id: r.id, name: r.title })),
        roundSummary,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch filtered questions:", error);
    return { success: false, error: "Failed to fetch questions" };
  }
}
