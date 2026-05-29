"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Sparkles, Filter, Layers } from "lucide-react";

interface EventItem {
  id: string;
  name: string;
}

interface ExportPanelProps {
  events: EventItem[];
}

export function ExportPanel({ events }: ExportPanelProps) {
  const [exportType, setExportType] = useState("registrations");
  const [eventId, setEventId] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");

  // Dynamically build export URL
  const getDownloadUrl = () => {
    const params = new URLSearchParams();
    params.set("type", exportType);
    if (eventId && eventId !== "ALL") params.set("eventId", eventId);
    if (exportType === "registrations" && paymentStatus && paymentStatus !== "ALL") {
      params.set("paymentStatus", paymentStatus);
    }
    return `/api/export?${params.toString()}`;
  };

  return (
    <div className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl sm:p-10 space-y-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 mx-auto border border-indigo-500/20">
        <FileSpreadsheet className="h-6 w-6" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="font-heading text-xl font-bold text-white">Generate Excel Export</h2>
        <p className="text-sm text-gray-400">
          Select filters below to download a flattened spreadsheet containing registrations, team details, or project submissions.
        </p>
      </div>

      {/* Selects */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span>Export Data Type</span>
          </label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white focus:outline-none"
          >
            <option value="registrations">Registrations (Default)</option>
            <option value="submissions">Project Submissions</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Filter by Competition</span>
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white focus:outline-none"
          >
            <option value="ALL">All Competitions (Export everything)</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>

        {exportType === "registrations" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
              <CreditCardIcon className="h-3 w-3" />
              <span>Filter by Payment Status</span>
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white focus:outline-none"
            >
              <option value="ALL">All Payment States</option>
              <option value="PENDING">Pending Verification</option>
              <option value="APPROVED">Approved / Confirmed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Download Action */}
      <div className="pt-4 border-t border-white/5">
        <a
          href={getDownloadUrl()}
          download={exportType === "registrations" ? "aayam-registrations.xlsx" : "aayam-submissions.xlsx"}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] hover:shadow-indigo-500/35"
        >
          <Download className="h-4 w-4" />
          <span>Download Excel File</span>
        </a>
      </div>
    </div>
  );
}

// Inline mini icon
function CreditCardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
