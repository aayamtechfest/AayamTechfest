"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRegistration } from "@/actions/registration.actions";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteRegistrationButtonProps {
  registrationId: string;
  participantName: string;
}

export function DeleteRegistrationButton({
  registrationId,
  participantName,
}: DeleteRegistrationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Are you sure you want to delete the registration for "${participantName}"? This will delete all team members and clean up any uploaded payment screenshots from Cloudinary. This action cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteRegistration(registrationId);
        if (res.success) {
          toast.success("Registration deleted successfully!");
          router.push("/admin/registrations");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to delete registration");
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600/10 border border-rose-500/25 px-5 text-sm font-semibold text-rose-400 shadow-md transition-all hover:bg-rose-600 hover:text-white disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span>Delete Registration</span>
    </button>
  );
}
