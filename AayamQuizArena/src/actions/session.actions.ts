"use server";

import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/schemas/session.schema";
import { generateAccessCode } from "@/lib/quiz-utils";
import { revalidatePath } from "next/cache";
import type { ActionResponse, QuizSessionWithDetails } from "@/types";

export async function getSessions(): Promise<QuizSessionWithDetails[]> {
  try {
    return await prisma.quizSession.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        quiz: true,
        _count: {
          select: { participants: true, rounds: true },
        },
      },
    }) as QuizSessionWithDetails[];
  } catch (error) {
    console.error("Failed to get sessions:", error);
    return [];
  }
}

export async function getSessionById(id: string): Promise<any | null> {
  try {
    return await prisma.quizSession.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { sortOrder: "asc" },
              include: {
                options: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        rounds: {
          orderBy: { roundNumber: "asc" },
        },
        participants: {
          orderBy: { totalScore: "desc" },
          include: {
            registration: {
              select: { registrationId: true },
            },
          },
        },
        teams: {
          orderBy: { totalScore: "desc" },
        },
      },
    });
  } catch (error) {
    console.error(`Failed to get session ${id}:`, error);
    return null;
  }
}

export async function createSession(data: Record<string, any>): Promise<ActionResponse<string>> {
  try {
    const parsed = sessionSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, quizId } = parsed.data;

    // Generate unique 6-character access code
    let accessCode = generateAccessCode();
    let codeExists = await prisma.quizSession.findUnique({
      where: { accessCode },
    });

    while (codeExists) {
      accessCode = generateAccessCode();
      codeExists = await prisma.quizSession.findUnique({
        where: { accessCode },
      });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    const session = await prisma.$transaction(async (tx) => {
      // Create session
      const sess = await tx.quizSession.create({
        data: {
          name,
          quizId,
          accessCode,
          status: "WAITING",
        },
      });

      // Group questions by roundId if they have it, or create a default Round 1 for all questions
      const roundQuestionsMap: Record<string, any[]> = {};
      const poolQuestions: any[] = [];

      quiz.questions.forEach((q) => {
        if (q.roundId) {
          if (!roundQuestionsMap[q.roundId]) roundQuestionsMap[q.roundId] = [];
          roundQuestionsMap[q.roundId].push(q);
        } else {
          poolQuestions.push(q);
        }
      });

      // For simplicity, create a default "Round 1" and link all pool questions to it
      if (poolQuestions.length > 0) {
        const defaultRound = await tx.quizRound.create({
          data: {
            sessionId: sess.id,
            roundNumber: 1,
            title: "Round 1: General MCQ",
            type: "MCQ",
            status: "PENDING",
            timeLimit: 30,
            pointsPerQuestion: 10,
          },
        });

        // Update questions round link
        await tx.quizQuestion.updateMany({
          where: { id: { in: poolQuestions.map((q) => q.id) } },
          data: { roundId: defaultRound.id },
        });

        // Set currentRoundId
        await tx.quizSession.update({
          where: { id: sess.id },
          data: { currentRoundId: defaultRound.id },
        });
      }

      return sess;
    });

    revalidatePath("/admin/sessions");
    return { success: true, data: session.id };
  } catch (error) {
    console.error("Failed to create session:", error);
    return { success: false, error: "Failed to create session" };
  }
}

export async function updateSessionStatus(
  id: string,
  status: "WAITING" | "ACTIVE" | "PAUSED" | "COMPLETED"
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, any> = { status };
    if (status === "ACTIVE") {
      updateData.startedAt = new Date();
    } else if (status === "COMPLETED") {
      updateData.endedAt = new Date();
    }

    await prisma.quizSession.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/admin/sessions/${id}`);
    revalidatePath("/admin/sessions");
    return { success: true };
  } catch (error) {
    console.error(`Failed to update session status to ${status}:`, error);
    return { success: false, error: `Failed to update status` };
  }
}

export async function updateRoundStatus(
  roundId: string,
  status: "PENDING" | "ACTIVE" | "COMPLETED"
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, any> = { status };
    if (status === "ACTIVE") {
      updateData.startedAt = new Date();
    } else if (status === "COMPLETED") {
      updateData.endedAt = new Date();
    }

    const round = await prisma.quizRound.update({
      where: { id: roundId },
      data: updateData,
    });

    if (status === "ACTIVE") {
      // Set currentRoundId of session
      await prisma.quizSession.update({
        where: { id: round.sessionId },
        data: { currentRoundId: roundId },
      });
    }

    revalidatePath(`/admin/sessions/${round.sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update round status:", error);
    return { success: false, error: "Failed to update round" };
  }
}

export async function deleteSession(id: string): Promise<ActionResponse> {
  try {
    await prisma.quizSession.delete({
      where: { id },
    });
    revalidatePath("/admin/sessions");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete session:", error);
    return { success: false, error: "Failed to delete session" };
  }
}
