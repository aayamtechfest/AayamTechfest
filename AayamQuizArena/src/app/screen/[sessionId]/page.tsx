import { getSessionById } from "@/actions/session.actions";
import { ProjectorScreenClient } from "./projector-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProjectorPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ProjectorPage({ params }: ProjectorPageProps) {
  const resolvedParams = await params;
  const session = await getSessionById(resolvedParams.sessionId);

  if (!session) {
    notFound();
  }

  return <ProjectorScreenClient session={session} />;
}
