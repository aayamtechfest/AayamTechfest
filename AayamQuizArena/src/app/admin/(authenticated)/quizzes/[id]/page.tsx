import { getQuizById } from "@/actions/quiz.actions";
import { getEvents } from "@/actions/question.actions";
import { QuizDetailClient } from "./quiz-detail-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface QuizDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const resolvedParams = await params;
  const [quiz, events] = await Promise.all([
    getQuizById(resolvedParams.id),
    getEvents(),
  ]);

  if (!quiz) {
    notFound();
  }

  return <QuizDetailClient quiz={quiz} events={events} />;
}
