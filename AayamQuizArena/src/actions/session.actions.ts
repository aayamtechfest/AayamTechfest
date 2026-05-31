"use server";

import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/schemas/session.schema";
import { generateAccessCode } from "@/lib/quiz-utils";
import { revalidatePath } from "next/cache";
import type { ActionResponse, QuizSessionWithDetails } from "@/types";
import { sendSessionLiveEmails, sendSessionResultEmails } from "@/lib/email";

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
    const isCode = id.length <= 12 && !id.includes("-");
    return await prisma.quizSession.findUnique({
      where: isCode ? { accessCode: id.toUpperCase() } : { id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { sortOrder: "asc" },
              include: {
                options: {
                  orderBy: { sortOrder: "asc" },
                },
                usages: {
                  where: {
                    session: {
                      status: "COMPLETED",
                    },
                  },
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
          include: {
            participants: true,
          },
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
      include: {
        questions: true,
        templateRounds: {
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    if (quiz.status !== "PUBLISHED") {
      return {
        success: false,
        error: `Cannot create a session from a ${quiz.status.toLowerCase()} quiz. Please publish the quiz first.`,
      };
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

      const templateRounds = quiz.templateRounds;

      if (templateRounds.length > 0) {
        const roundIdMapping: Record<string, string> = {};
        let firstRoundId: string | null = null;

        for (const tr of templateRounds) {
          const newRound = await tx.quizRound.create({
            data: {
              sessionId: sess.id,
              roundNumber: tr.roundNumber,
              title: tr.title,
              type: tr.type,
              status: "PENDING",
              timeLimit: tr.timeLimit,
              pointsPerQuestion: tr.pointsPerQuestion,
              settings: {
                ...(tr.settings as Record<string, any> || {}),
                templateRoundId: tr.id,
              },
            },
          });

          roundIdMapping[tr.id] = newRound.id;
          if (!firstRoundId) {
            firstRoundId = newRound.id;
          }
        }

        // Now link each question to its corresponding session round
        for (const q of quiz.questions) {
          if (q.templateRoundId && roundIdMapping[q.templateRoundId]) {
            await tx.quizQuestion.update({
              where: { id: q.id },
              data: { roundId: roundIdMapping[q.templateRoundId] },
            });
          } else {
            // Unlink if it doesn't belong to any valid round in this session
            await tx.quizQuestion.update({
              where: { id: q.id },
              data: { roundId: null },
            });
          }
        }

        if (firstRoundId) {
          await tx.quizSession.update({
            where: { id: sess.id },
            data: { currentRoundId: firstRoundId },
          });
        }
      } else {
        // Fallback: create a default "Round 1" and link all questions to it
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
          where: { id: { in: quiz.questions.map((q) => q.id) } },
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

    // Non-blocking trigger of live invite emails when the lobby is spawned
    sendSessionLiveEmails(session.id).catch((error) => {
      console.error("[Email] Failed to send live session invite emails:", error);
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

    if (status === "ACTIVE") {
      // Send invitation emails to all registered participants (non-blocking)
      sendSessionLiveEmails(id).catch((err) => {
        console.error("[Email] Error in sendSessionLiveEmails background task:", err);
      });
    } else if (status === "COMPLETED") {
      // Send results emails to all session participants (non-blocking)
      sendSessionResultEmails(id).catch((err) => {
        console.error("[Email] Error in sendSessionResultEmails background task:", err);
      });
    }

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
