"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetSystemAction } from "@/actions/reset.actions";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

export default function AdminResetPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReset(e: React.FormEvent) {
    e.preventDefault();

    if (confirmText !== "RESET SYSTEM FOR NEW YEAR") {
      toast.error("Please enter the correct verification text.");
      return;
    }

    if (!confirm("⚠️ DANGER ZONE: This operation CANNOT BE UNDONE. All registrations, team members, payment logs, images, announcements, and contact messages will be permanently deleted. Are you absolutely sure?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await resetSystemAction(confirmText);
        if (res.success) {
          toast.success("System reset successful! Settings have been reverted to default.");
          setConfirmText("");
          router.push("/admin");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to reset system.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong during system reset.");
      }
    });
  }

  const matchesVerification = confirmText === "RESET SYSTEM FOR NEW YEAR";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          System Reset
        </h1>
        <p className="mt-1 text-gray-400">
          Prepare the AAYAM portal for a new season or academic year by purging old database entries and resetting settings.
        </p>
      </div>

      {/* Danger Zone Info */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h2 className="text-lg font-bold">DANGER ZONE: Permanent System Purge</h2>
        </div>
        
        <p className="text-sm text-gray-300 leading-relaxed">
          Executing a system reset will perform the following actions:
        </p>
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-2 pl-2">
          <li>Delete <strong className="text-white">all event listings</strong> and their corresponding form configurations.</li>
          <li>Delete <strong className="text-white">all participant registrations</strong> and team member details.</li>
          <li>Purge <strong className="text-white">all payment proofs</strong> and verification logs.</li>
          <li>Delete <strong className="text-white">all uploaded assets</strong> (screenshots, logos, banners) from <strong className="text-white">Cloudinary</strong>.</li>
          <li>Purge <strong className="text-white">all public inbox messages</strong>.</li>
          <li>Reset <strong className="text-white">website settings</strong> (Site name, logo, countdown, social links, about content) to default presets.</li>
        </ul>
        <div className="rounded-xl bg-black/30 p-4 border border-red-500/10">
          <p className="text-xs text-red-300 font-semibold uppercase tracking-wider">Note:</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Admin account credentials and basic login details are preserved so you do not lose dashboard access.
          </p>
        </div>
      </div>

      {/* Confirmation Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300">
              Double-Confirmation Verification
            </label>
            <p className="text-xs text-gray-400 mt-1">
              To proceed, please type the exact words: <strong className="text-indigo-400 font-mono select-all">RESET SYSTEM FOR NEW YEAR</strong>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-3 block w-full font-mono rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Type confirmation here..."
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={!matchesVerification || isPending}
            className={`flex w-full h-12 items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white transition-all shadow-lg ${
              matchesVerification && !isPending
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20 cursor-pointer"
                : "bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed shadow-none"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Executing Full Reset...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete All Data & Reset Presets</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
