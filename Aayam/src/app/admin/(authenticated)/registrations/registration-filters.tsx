"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface EventItem {
  id: string;
  name: string;
}

interface RegistrationFiltersClientProps {
  events: EventItem[];
}

export function RegistrationFiltersClient({ events }: RegistrationFiltersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [eventId, setEventId] = useState(searchParams.get("eventId") || "ALL");
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") || "ALL");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");

  function applyFilters(newSearch = search, newEvent = eventId, newPayment = paymentStatus, newStatus = status) {
    startTransition(() => {
      const params = new URLSearchParams();
      if (newSearch) params.set("search", newSearch);
      if (newEvent && newEvent !== "ALL") params.set("eventId", newEvent);
      if (newPayment && newPayment !== "ALL") params.set("paymentStatus", newPayment);
      if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
      params.set("page", "1"); // Reset to page 1 on filter change

      router.push(`/admin/registrations?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-lg space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            placeholder="Search by name, email, phone, or Registration ID..."
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Search</span>
        </button>
      </form>

      {/* Select Dropdowns */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {/* Event filter */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Competition
          </label>
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              applyFilters(search, e.target.value, paymentStatus, status);
            }}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-3 py-2.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Competitions</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status filter */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              applyFilters(search, eventId, e.target.value, status);
            }}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-3 py-2.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Registration status filter */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Reg Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters(search, eventId, paymentStatus, e.target.value);
            }}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-3 py-2.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All States</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_VERIFICATION">Verification Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
