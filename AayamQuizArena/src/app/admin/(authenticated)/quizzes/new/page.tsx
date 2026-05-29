import { getEvents } from "@/actions/question.actions";
import { QuizFormClient } from "./quiz-form-client";
import { serializePrisma } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewQuizPage() {
  const events = await getEvents();

  return <QuizFormClient events={serializePrisma(events)} />;
}
