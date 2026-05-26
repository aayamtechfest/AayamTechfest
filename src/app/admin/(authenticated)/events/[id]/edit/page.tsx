import { getEventById } from "@/actions/event.actions";
import { EditEventForm } from "./edit-form";
import { notFound } from "next/navigation";
import { serializePrisma } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminEditEventPage({ params }: PageProps) {
  const resolvedParams = await params;
  const event = await getEventById(resolvedParams.id);

  if (!event) {
    notFound();
  }

  const serializedEvent = serializePrisma(event);

  return <EditEventForm event={serializedEvent} />;
}
