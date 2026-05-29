"use client";

import { useRouter } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { createEvent } from "@/actions/event.actions";
import { toast } from "sonner";

export default function NewEventPage() {
  const router = useRouter();

  async function handleCreateEvent(data: any) {
    try {
      const res = await createEvent(data);
      if (res.success) {
        toast.success("Competition created successfully!");
        router.push("/admin/events");
        return { success: true };
      } else {
        toast.error(res.error || "Failed to create event");
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
      title="Create New Competition"
      description="Add a new competition to the AAYAM festival list."
      onSubmit={handleCreateEvent}
    />
  );
}
