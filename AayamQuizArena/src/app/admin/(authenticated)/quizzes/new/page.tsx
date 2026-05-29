import { getEvents } from "@/actions/question.actions";
import { QuizFormClient } from "./quiz-form-client";

export const dynamic = "force-dynamic";

export default async function NewQuizPage() {
  const events = await getEvents();

  return <QuizFormClient events={events} />;
}
