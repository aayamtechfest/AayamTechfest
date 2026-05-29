"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResponse } from "@/types";

interface JoinSessionInput {
  registrationCode: string;
  accessCode: string;
}

export async function joinSessionAction(
  data: JoinSessionInput
): Promise<ActionResponse<{ sessionId: string; participantId: string }>> {
  try {
    const { registrationCode, accessCode } = data;

    // 1. Validate active session access code
    const session = await prisma.quizSession.findUnique({
      where: { accessCode: accessCode.trim().toUpperCase() },
      include: { quiz: true },
    });

    if (!session || session.status === "COMPLETED") {
      return {
        success: false,
        error: "Active quiz session not found. Please verify the 6-character code.",
      };
    }

    // 2. Validate participant registration code (matches the cuid or registrationId field in Registration table)
    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { id: registrationCode.trim() },
          { registrationId: registrationCode.trim() },
        ],
      },
    });

    if (!registration) {
      return {
        success: false,
        error: "Event registration ID not found. Please verify your registration confirmation.",
      };
    }

    // 3. Process join/reconnect in a transaction
    const participant = await prisma.$transaction(async (tx) => {
      // Check if participant already exists in this session
      const existing = await tx.quizParticipant.findFirst({
        where: {
          sessionId: session.id,
          registrationId: registration.id,
        },
      });

      if (existing) {
        // Return existing player to reconnect
        return existing;
      }

      // If team mode, find or create the team
      let teamId: string | null = null;
      if (session.quiz.mode === "TEAM" && registration.teamName) {
        let team = await tx.quizTeam.findFirst({
          where: {
            sessionId: session.id,
            name: registration.teamName.trim(),
          },
        });

        if (!team) {
          team = await tx.quizTeam.create({
            data: {
              sessionId: session.id,
              name: registration.teamName.trim(),
            },
          });
        }
        teamId = team.id;
      }

      // Create new participant
      return await tx.quizParticipant.create({
        data: {
          sessionId: session.id,
          registrationId: registration.id,
          displayName: registration.participantName,
          teamId,
          isConnected: true,
        },
      });
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        participantId: participant.id,
      },
    };
  } catch (error) {
    console.error("Participant join error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please verify your connection.",
    };
  }
}
