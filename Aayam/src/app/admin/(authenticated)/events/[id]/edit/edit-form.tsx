"use client";

import { useRouter } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { updateEvent } from "@/actions/event.actions";
import { toast } from "sonner";

interface EditEventFormProps {
  event: any;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();

  async function handleUpdateEvent(data: any) {
    try {
      const res = await updateEvent(event.id, data);
      if (res.success) {
        toast.success("Competition updated successfully!");
        router.push("/admin/events");
        return { success: true };
      } else {
        toast.error(res.error || "Failed to update event");
        return { success: false, error: res.error };
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      return { success: false, error: "Something went wrong" };
    }
  }

  return (
    <EventForm
      title={`Edit Competition: ${event.name}`}
      description="Update rules, pricing, deadlines, or problem statements."
      initialData={event}
      onSubmit={handleUpdateEvent}
    />
  );
}
