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

    const { text, type, mediaUrl, timeLimit, points, explanation, templateRoundId, options } = parsed.data;

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

    const { text, type, mediaUrl, timeLimit, points, explanation, templateRoundId, options } = parsed.data;

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

    const count = await prisma.$transaction(async (tx) => {
      let importedCount = 0;

      for (const item of questionsData) {
        if (!item.text) continue;

        // Try to find or create template round if roundNumber is provided
        let templateRoundId: string | null = null;
        if (item.roundNumber !== undefined) {
          const roundNum = parseInt(item.roundNumber) || 1;
          const roundTitle = item.roundTitle || `Round ${roundNum}`;
          const roundType = item.roundType || "MCQ";

          let tr = await tx.quizTemplateRound.findFirst({
            where: { quizId, roundNumber: roundNum },
          });

          if (!tr) {
            tr = await tx.quizTemplateRound.create({
              data: {
                quizId,
                roundNumber: roundNum,
                title: roundTitle,
                type: roundType,
                timeLimit: item.roundTimeLimit !== undefined ? parseInt(item.roundTimeLimit) : 30,
                pointsPerQuestion: item.roundPoints !== undefined ? parseInt(item.roundPoints) : 10,
              },
            });
          }
          templateRoundId = tr.id;
        }

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

      return importedCount;
    });

    revalidatePath(`/admin/quizzes/${quizId}`);
    return { success: true, data: { count } };
  } catch (error: any) {
    console.error("Failed to import questions:", error);
    return { success: false, error: error.message || "Failed to import questions" };
  }
}
