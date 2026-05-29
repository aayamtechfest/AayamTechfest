"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function adjustParticipantScore(
  sessionId: string,
  participantId: string,
  pointsDelta: number,
  note?: string
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(async (tx) => {
      // Log manual correction record
      await tx.quizScore.create({
        data: {
          sessionId,
          participantId,
          points: pointsDelta,
          isManualCorrection: true,
          note: note || "Manual score adjustment",
        },
      });

      // Atomically update participant aggregate score
      const p = await tx.quizParticipant.update({
        where: { id: participantId },
        data: {
          totalScore: {
            increment: pointsDelta,
          },
        },
        select: { teamId: true },
      });

      // Update team aggregate score if team exists
      if (p.teamId) {
        await tx.quizTeam.update({
          where: { id: p.teamId },
          data: {
            totalScore: {
              increment: pointsDelta,
            },
          },
        });
      }
    });

    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath(`/admin/sessions`);
    return { success: true };
  } catch (error) {
    console.error("Score correction failed:", error);
    return { success: false, error: "Failed to apply score adjustment" };
  }
}
