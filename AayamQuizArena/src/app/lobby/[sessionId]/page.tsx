import { getSessionById } from "@/actions/session.actions";
import { LobbyClient } from "./lobby-client";
import { notFound } from "next/navigation";
import { serializePrisma } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface LobbyPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ participantId?: string }>;
}

export default async function LobbyPage({ params, searchParams }: LobbyPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const session = await getSessionById(resolvedParams.sessionId);
  const participantId = resolvedSearchParams.participantId;

  if (!session) {
    notFound();
  }

  return <LobbyClient session={serializePrisma(session)} participantId={participantId} />;
}
