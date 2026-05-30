import { prisma } from "@/lib/prisma";
import { LeaderboardClient } from "@/app/leaderboard/[sessionId]/leaderboard-client";
import { notFound } from "next/navigation";
import { serializePrisma } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SimpleLeaderboardPageProps {
  params: Promise<{ accessCode: string }>;
}

export default async function SimpleLeaderboardPage({ params }: SimpleLeaderboardPageProps) {
  const resolvedParams = await params;
  const accessCode = resolvedParams.accessCode.trim().toUpperCase();

  const session = await prisma.quizSession.findUnique({
    where: { accessCode },
    include: {
      quiz: { select: { name: true, mode: true } },
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
      buzzerEvents: {
        orderBy: { buzzedAt: "asc" },
        include: {
          participant: { select: { displayName: true } },
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  // Render the exact same live leaderboard client under this short URL path
  return <LeaderboardClient session={serializePrisma(session)} />;
}
