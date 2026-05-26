"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleEventPublish, toggleEventRegistration, deleteEvent } from "@/actions/event.actions";
import { toast } from "sonner";
import { Eye, EyeOff, Edit, Trash2, ShieldAlert } from "lucide-react";

interface AdminEventActionsProps {
  eventId: string;
  isPublished: boolean;
  isRegistrationOpen: boolean;
  eventName: string;
  registrationsCount: number;
}

export function AdminEventActions({
  eventId,
  isPublished,
  isRegistrationOpen,
  eventName,
  registrationsCount,
}: AdminEventActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    startTransition(async () => {
      try {
        const res = await toggleEventPublish(eventId);
        if (res.success) {
          toast.success(`Published status updated for ${eventName}`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update publish status");
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  }

  function handleToggleRegistration() {
    startTransition(async () => {
      try {
        const res = await toggleEventRegistration(eventId);
        if (res.success) {
          toast.success(`Registration status updated for ${eventName}`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update registration status");
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  }

  function handleDelete() {
    if (registrationsCount > 0) {
      alert(`Cannot delete "${eventName}" because it has ${registrationsCount} active registrations. You must delete the registrations first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${eventName}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteEvent(eventId);
        if (res.success) {
          toast.success(`Deleted event ${eventName}`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to delete event");
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {/* Toggle Publish */}
      <button
        onClick={handleTogglePublish}
        disabled={isPending}
        title={isPublished ? "Unpublish Event" : "Publish Event"}
        className={`rounded-lg p-2 transition-all ${
          isPublished
            ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
            : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
        }`}
      >
        {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      {/* Toggle Reg Status */}
      <button
        onClick={handleToggleRegistration}
        disabled={isPending}
        title={isRegistrationOpen ? "Close Registration" : "Open Registration"}
        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all border ${
          isRegistrationOpen
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
        }`}
      >
        {isRegistrationOpen ? "Open" : "Closed"}
      </button>

      {/* Edit Link */}
      <Link
        href={`/admin/events/${eventId}/edit`}
        className="rounded-lg p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        title="Edit Event"
      >
        <Edit className="h-4 w-4" />
      </Link>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Delete Event"
        className="rounded-lg p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
