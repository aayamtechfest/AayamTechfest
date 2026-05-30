"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function getTemplateRounds(quizId: string): Promise<any[]> {
  try {
    return await prisma.quizTemplateRound.findMany({
      where: { quizId },
      orderBy: { roundNumber: "asc" },
    });
  } catch (error) {
    console.error("Failed to get template rounds:", error);
    return [];
  }
}

export async function createTemplateRound(
  quizId: string,
  data: {
    roundNumber: number;
    title: string;
    type: "MCQ" | "BUZZER" | "HAND_RAISE" | "RAPID_FIRE" | "TEAM_ANSWER" | "PASS_TO_MEMBER" | "PASS_ROUND";
    timeLimit: number;
    pointsPerQuestion: number;
    settings?: any;
  }
): Promise<ActionResponse<string>> {
  try {
    const round = await prisma.quizTemplateRound.create({
      data: {
        quizId,
        roundNumber: data.roundNumber,
        title: data.title,
        type: data.type,
        timeLimit: data.timeLimit,
        pointsPerQuestion: data.pointsPerQuestion,
        settings: data.settings || {},
      },
    });

    revalidatePath(`/admin/quizzes/${quizId}`);
    return { success: true, data: round.id };
  } catch (error) {
    console.error("Failed to create template round:", error);
    return { success: false, error: "Failed to create template round" };
  }
}

export async function updateTemplateRound(
  roundId: string,
  data: {
    roundNumber?: number;
    title?: string;
    type?: "MCQ" | "BUZZER" | "HAND_RAISE" | "RAPID_FIRE" | "TEAM_ANSWER" | "PASS_TO_MEMBER" | "PASS_ROUND";
    timeLimit?: number;
    pointsPerQuestion?: number;
    settings?: any;
  }
): Promise<ActionResponse> {
  try {
    const round = await prisma.quizTemplateRound.update({
      where: { id: roundId },
      data: {
        roundNumber: data.roundNumber,
        title: data.title,
        type: data.type,
        timeLimit: data.timeLimit,
        pointsPerQuestion: data.pointsPerQuestion,
        settings: data.settings,
      },
    });

    revalidatePath(`/admin/quizzes/${round.quizId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update template round:", error);
    return { success: false, error: "Failed to update template round" };
  }
}

export async function deleteTemplateRound(roundId: string): Promise<ActionResponse> {
  try {
    const round = await prisma.quizTemplateRound.findUnique({
      where: { id: roundId },
      select: { quizId: true },
    });

    if (!round) {
      return { success: false, error: "Round not found" };
    }

    // Set any questions linked to this template round to null
    await prisma.quizQuestion.updateMany({
      where: { templateRoundId: roundId },
      data: { templateRoundId: null },
    });

    await prisma.quizTemplateRound.delete({
      where: { id: roundId },
    });

    revalidatePath(`/admin/quizzes/${round.quizId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete template round:", error);
    return { success: false, error: "Failed to delete template round" };
  }
}
