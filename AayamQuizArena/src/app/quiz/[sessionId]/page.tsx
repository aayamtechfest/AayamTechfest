import { getSessionById } from "@/actions/session.actions";
import { QuizClient } from "./quiz-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface QuizPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ participantId?: string }>;
}

export default async function QuizPage({ params, searchParams }: QuizPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const session = await getSessionById(resolvedParams.sessionId);
  const participantId = resolvedSearchParams.participantId;

  if (!session) {
    notFound();
  }

  return <QuizClient session={session} participantId={participantId} />;
}
