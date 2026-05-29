import { getSessionById } from "@/actions/session.actions";
import { SessionControlClient } from "./session-control-client";
import { notFound } from "next/navigation";
import { serializePrisma } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const resolvedParams = await params;
  const session = await getSessionById(resolvedParams.id);

  if (!session) {
    notFound();
  }

  return <SessionControlClient session={serializePrisma(session)} />;
}
