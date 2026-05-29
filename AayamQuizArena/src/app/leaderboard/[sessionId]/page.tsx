import { getSessionById } from "@/actions/session.actions";
import { LeaderboardClient } from "./leaderboard-client";
import { notFound } from "next/navigation";
import { serializePrisma } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface LeaderboardPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const resolvedParams = await params;
  const session = await getSessionById(resolvedParams.sessionId);

  if (!session) {
    notFound();
  }

  return <LeaderboardClient session={serializePrisma(session)} />;
}
