"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyPayment } from "@/actions/payment.actions";
import { toast } from "sonner";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";

interface PaymentReviewActionsProps {
  registrationId: string;
  currentPaymentStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export function PaymentReviewActions({
  registrationId,
  currentPaymentStatus,
}: PaymentReviewActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  function handleVerify(status: "APPROVED" | "REJECTED") {
    if (status === "REJECTED" && !notes.trim()) {
      toast.error("Please provide rejection notes or a reason.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await verifyPayment(registrationId, status, notes);
        if (res.success) {
          toast.success(`Payment verified as ${status}!`);
          setShowRejectForm(false);
          setNotes("");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to verify payment");
        }
      } catch (error) {
        toast.error("Something went wrong during verification");
      }
    });
  }

  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Payment Actions</h4>
        <span className="text-xs text-gray-500">Current Status: {currentPaymentStatus}</span>
      </div>

      {currentPaymentStatus === "PENDING" ? (
        <div className="space-y-4">
          {showRejectForm ? (
            <div className="space-y-3 rounded-xl bg-rose-500/5 border border-rose-500/10 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-rose-400">
                Reason for Rejection
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-[#16213e] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="e.g., Transaction ID / UTR does not match screenshot, amount is incorrect, etc."
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(false);
                    setNotes("");
                  }}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleVerify("REJECTED")}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Confirm Reject</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify("APPROVED")}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/15 transition-all"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Approve Payment</span>
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600/10 border border-rose-500/20 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-600/20 transition-all"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reject Payment</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center">
          <p className="text-xs text-gray-400">
            This payment has already been verified and cannot be changed.
          </p>
          {notes && (
            <div className="mt-2 text-left">
              <span className="block text-[10px] uppercase text-gray-500">Verification Notes</span>
              <p className="text-xs text-gray-300 font-mono mt-0.5">{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
