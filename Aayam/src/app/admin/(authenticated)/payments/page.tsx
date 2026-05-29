import { getPendingPayments, getPaymentStats } from "@/actions/payment.actions";
import { PaymentReviewActions } from "../registrations/[id]/payment-review-actions";
import { CreditCard, AlertCircle, ExternalLink, Calendar, CheckSquare, XSquare, PlusSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminPaymentsVerificationPage() {
  const [pendingPayments, stats] = await Promise.all([
    getPendingPayments(),
    getPaymentStats(),
  ]);

  const statItems = [
    {
      label: "Pending Verification",
      value: stats.pending,
      icon: AlertCircle,
      colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
    {
      label: "Approved Payments",
      value: stats.approved,
      icon: CheckSquare,
      colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    },
    {
      label: "Rejected Payments",
      value: stats.rejected,
      icon: XSquare,
      colorClass: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    },
    {
      label: "Total Registrations",
      value: stats.total,
      icon: PlusSquare,
      colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-indigo-400" />
          <span>Payment Verification</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Review pending transaction screenshots, match UTR numbers, and approve registrations.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-5 backdrop-blur-md shadow-md flex items-center justify-between ${item.colorClass}`}
          >
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider opacity-85">
                {item.label}
              </span>
              <span className="mt-2 block font-heading text-3xl font-bold text-white">
                {item.value}
              </span>
            </div>
            <item.icon className="h-8 w-8 opacity-75" />
          </div>
        ))}
      </div>

      {/* Grid List */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-white mb-6">
          Pending Approvals ({pendingPayments.length})
        </h3>

        {pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-16 text-center backdrop-blur-md">
            <CheckSquare className="h-12 w-12 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-sm">
              There are no pending registrations requiring payment verification at this moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingPayments.map((reg) => {
              const fee = reg.event.registrationFee
                ? Number(reg.event.registrationFee)
                : 0;
              return (
                <div
                  key={reg.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-white/5 pb-3">
                      <div>
                        <h4 className="font-semibold text-white text-base">
                          {reg.participantName}
                        </h4>
                        <span className="text-xs text-gray-500 font-mono">
                          {reg.registrationId}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-400">
                        {reg.event.name}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="text-xs space-y-2 text-gray-400">
                      <div className="flex justify-between">
                        <span>Submitted on:</span>
                        <span className="text-gray-300 font-medium">
                          {formatDate(reg.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reference / UTR:</span>
                        <span className="font-mono text-gray-200 font-semibold">
                          {reg.paymentReference || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2">
                        <span>Due Amount:</span>
                        <span className="text-white font-bold">₹{fee}</span>
                      </div>
                    </div>

                    {/* Screenshot thumbnail */}
                    {reg.paymentScreenshot ? (
                      <div className="relative group rounded-xl border border-white/10 overflow-hidden bg-black h-44">
                        <img
                          src={reg.paymentScreenshot}
                          alt="Receipt Proof"
                          className="w-full h-full object-contain"
                        />
                        <a
                          href={reg.paymentScreenshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded bg-black/85 px-2 py-1 text-[10px] text-white hover:bg-black"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Verify receipt</span>
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 py-6 text-center text-xs text-rose-400">
                        No receipt screenshot uploaded
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4">
                    <PaymentReviewActions
                      registrationId={reg.id}
                      currentPaymentStatus={reg.paymentStatus}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
