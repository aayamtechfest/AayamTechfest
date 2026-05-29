import { getRegistrations } from "@/actions/registration.actions";
import { getEvents } from "@/actions/event.actions";
import { RegistrationFiltersClient } from "./registration-filters";
import Link from "next/link";
import { Users, Eye, ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    eventId?: string;
    paymentStatus?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminRegistrationsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search;
  const eventId = resolvedSearchParams.eventId === "ALL" ? undefined : resolvedSearchParams.eventId;
  const paymentStatus = resolvedSearchParams.paymentStatus === "ALL" ? undefined : resolvedSearchParams.paymentStatus;
  const status = resolvedSearchParams.status === "ALL" ? undefined : resolvedSearchParams.status;
  const page = Number(resolvedSearchParams.page) || 1;

  const [registrationsData, events] = await Promise.all([
    getRegistrations({
      search,
      eventId,
      paymentStatus,
      status,
      page,
      pageSize: 10,
    }),
    getEvents(),
  ]);

  const { registrations, total, pages, currentPage } = registrationsData;

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
    CLOSED: "bg-gray-500/10 text-gray-400 border-gray-500/25",
    EXPIRED: "bg-gray-500/10 text-gray-400 border-gray-500/25",
  };

  // Helper to build URL with page index
  function getPageUrl(pageNum: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (resolvedSearchParams.eventId) params.set("eventId", resolvedSearchParams.eventId);
    if (resolvedSearchParams.paymentStatus) params.set("paymentStatus", resolvedSearchParams.paymentStatus);
    if (resolvedSearchParams.status) params.set("status", resolvedSearchParams.status);
    params.set("page", String(pageNum));
    return `/admin/registrations?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Users className="h-8 w-8 text-indigo-400" />
          <span>Manage Registrations</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Search, filter, view registration details, and verify transaction screenshot proofs.
        </p>
      </div>

      {/* Filters Client component */}
      <RegistrationFiltersClient events={events.map((e) => ({ id: e.id, name: e.name }))} />

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-16 text-center backdrop-blur-md">
          <ClipboardList className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-bold text-white">No Registrations Found</h3>
          <p className="mt-1 text-sm text-gray-400 max-w-sm">
            We couldn't find any registrations matching your current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-gray-300">
                <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Reg ID / Date</th>
                    <th className="px-6 py-4">Participant</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registrations.map((reg) => (
                    <tr
                      key={reg.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-indigo-400 uppercase">
                            {reg.registrationId}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {formatDate(reg.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {reg.participantName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {reg.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {reg.event.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            paymentBadgeStyles[reg.paymentStatus] || "bg-white/5 border-white/10 text-gray-400"
                          }`}
                        >
                          {reg.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            statusBadgeStyles[reg.status] || "bg-white/5 border-white/10 text-gray-400"
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/registrations/${reg.id}`}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white transition-all hover:bg-white/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <span className="text-xs text-gray-400">
                Showing page <strong className="text-white">{currentPage}</strong> of{" "}
                <strong className="text-white">{pages}</strong> (Total: {total} records)
              </span>

              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={getPageUrl(currentPage - 1)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </Link>
                ) : (
                  <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/5 bg-white/0 px-3 text-xs font-semibold text-gray-600 cursor-not-allowed">
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </div>
                )}

                {currentPage < pages ? (
                  <Link
                    href={getPageUrl(currentPage + 1)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/5 bg-white/0 px-3 text-xs font-semibold text-gray-600 cursor-not-allowed">
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
