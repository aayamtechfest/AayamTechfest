import { getRegistrationById } from "@/actions/registration.actions";
import { PaymentReviewActions } from "./payment-review-actions";
import { DeleteRegistrationButton } from "./delete-registration-button";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Users,
  CreditCard,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminRegistrationDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const registration = await getRegistrationById(resolvedParams.id);

  if (!registration) {
    notFound();
  }

  const fee = registration.event.registrationFee
    ? Number(registration.event.registrationFee)
    : 0;

  const paymentBadgeStyles: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  };

  const statusBadgeStyles: Record<string, string> = {
    SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    PENDING_VERIFICATION: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/registrations"
            className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="font-mono text-xs text-indigo-400 uppercase tracking-wider font-bold">
              Registration Detail
            </span>
            <h1 className="font-heading text-2xl font-bold text-white mt-1">
              {registration.participantName}
            </h1>
          </div>
        </div>
        <DeleteRegistrationButton
          registrationId={registration.id}
          participantName={registration.participantName}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Participant Info */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              <span>Participant Details</span>
            </h3>

            <div className="grid gap-6 sm:grid-cols-2 text-sm">
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider">Email Address</span>
                <span className="font-medium text-white">{registration.email}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider">Phone Number</span>
                <span className="font-medium text-white">{registration.phone}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider">College/University</span>
                <span className="font-medium text-white">{registration.collegeName}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider">Department</span>
                <span className="font-medium text-white">
                  {registration.department || <span className="text-gray-600 italic">Not specified</span>}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider">Year / Semester</span>
                <span className="font-medium text-white">
                  {registration.yearOrSemester || <span className="text-gray-600 italic">Not specified</span>}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider">Registered On</span>
                <span className="font-medium text-white">{formatDateTime(registration.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Team Members Info */}
          {(registration.event.participationType !== "SOLO" || registration.teamName) && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  <span>Team: {registration.teamName || <span className="text-gray-500 italic">Not set</span>}</span>
                </h3>
                <span className="text-xs text-gray-500 font-semibold">
                  Total Size: {registration.teamMembers.length + 1} Members
                </span>
              </div>

              {registration.teamMembers.length === 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead>
                        <tr className="text-gray-500 border-b border-white/5">
                          <th className="pb-3 font-semibold uppercase tracking-wider">Name</th>
                          <th className="pb-3 font-semibold uppercase tracking-wider">Email</th>
                          <th className="pb-3 font-semibold uppercase tracking-wider">Phone</th>
                          <th className="pb-3 font-semibold uppercase tracking-wider">College</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/5">
                          <td className="py-3 font-semibold text-white">
                            {registration.participantName} <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5 ml-1">Leader</span>
                          </td>
                          <td className="py-3">{registration.email}</td>
                          <td className="py-3">{registration.phone}</td>
                          <td className="py-3">{registration.collegeName}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 italic">No additional team members listed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead>
                      <tr className="text-gray-500 border-b border-white/5">
                        <th className="pb-3 font-semibold uppercase tracking-wider">Name</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Email</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Phone</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">College</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {/* Leader Row */}
                      <tr className="hover:bg-white/5">
                        <td className="py-3 font-semibold text-white">
                          {registration.participantName} <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5 ml-1">Leader</span>
                        </td>
                        <td className="py-3">{registration.email}</td>
                        <td className="py-3">{registration.phone}</td>
                        <td className="py-3">{registration.collegeName}</td>
                      </tr>
                      {/* Members */}
                      {registration.teamMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-white/5">
                          <td className="py-3 font-semibold text-white">{member.name}</td>
                          <td className="py-3">{member.email || "-"}</td>
                          <td className="py-3">{member.phone || "-"}</td>
                          <td className="py-3">{member.collegeName || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Status and Payment verification */}
        <div className="space-y-6">
          {/* Status Box */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-white/5 pb-2">
              Registration Status
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Payment</span>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider mt-1 ${
                    paymentBadgeStyles[registration.paymentStatus]
                  }`}
                >
                  {registration.paymentStatus}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider">State</span>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider mt-1 ${
                    statusBadgeStyles[registration.status]
                  }`}
                >
                  {registration.status}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Registration ID</span>
              <span className="font-mono text-lg font-bold text-white uppercase tracking-wider mt-0.5 block">
                {registration.registrationId}
              </span>
            </div>

            <div className="pt-2">
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Competition</span>
              <span className="text-sm font-semibold text-white block mt-0.5">
                {registration.event.name}
              </span>
            </div>
          </div>

          {/* Payment Card details */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-4">
            <h3 className="font-heading text-lg font-semibold text-white border-b border-white/5 pb-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              <span>Payment Proof</span>
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Due Amount</span>
                <span className="font-semibold text-white">₹{fee}</span>
              </div>

              {fee > 0 ? (
                <>
                  <div className="text-sm">
                    <span className="text-gray-400 block">Transaction Reference / UTR</span>
                    <span className="font-mono font-semibold text-white bg-black/40 px-3 py-1.5 rounded-lg mt-1 block">
                      {registration.paymentReference || <span className="text-gray-600 italic">None provided</span>}
                    </span>
                  </div>

                  {registration.paymentScreenshot ? (
                    <div>
                      <span className="text-gray-400 block text-sm mb-2">Screenshot proof</span>
                      <div className="relative group rounded-xl border border-white/10 overflow-hidden bg-black max-h-[300px]">
                        <img
                          src={registration.paymentScreenshot}
                          alt="Screenshot Proof"
                          className="w-full object-contain h-64 mx-auto"
                        />
                        <a
                          href={registration.paymentScreenshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-lg bg-black/75 px-3 py-1.5 text-xs text-white hover:bg-black/90"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View Fullscreen</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center text-xs text-rose-400">
                      No screenshot uploaded.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-xs text-emerald-400">
                  Free Registration. No transaction needed.
                </div>
              )}

              {/* Review Buttons */}
              {registration.paymentStatus === "PENDING" && (
                <PaymentReviewActions
                  registrationId={registration.id}
                  currentPaymentStatus={registration.paymentStatus}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
