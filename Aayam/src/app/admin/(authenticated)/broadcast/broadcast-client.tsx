"use client";

import { useState, useTransition, useMemo } from "react";
import { sendBroadcastEmail, type BroadcastRecipient } from "@/actions/broadcast.actions";
import { toast } from "sonner";
import {
  Send,
  Search,
  CheckSquare,
  Square,
  Loader2,
  Users,
  Mail,
  FileText,
  AlertCircle,
} from "lucide-react";

interface BroadcastEmailClientProps {
  initialRecipients: BroadcastRecipient[];
}

export function BroadcastEmailClient({ initialRecipients }: BroadcastEmailClientProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return initialRecipients;
    return initialRecipients.filter(
      (r) =>
        r.participantName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.eventName.toLowerCase().includes(q) ||
        r.registrationId.toLowerCase().includes(q)
    );
  }, [initialRecipients, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSend = () => {
    if (!subject.trim()) { toast.error("Please enter a subject."); return; }
    if (!body.trim()) { toast.error("Please enter email content."); return; }
    if (selectedIds.size === 0) { toast.error("Please select at least one recipient."); return; }

    setResult(null);
    startTransition(async () => {
      try {
        const res = await sendBroadcastEmail(
          Array.from(selectedIds),
          subject,
          body
        );
        if (res.success && res.data) {
          setResult(res.data);
          toast.success(
            `Email sent! ✅ ${res.data.sent} delivered${res.data.failed > 0 ? `, ${res.data.failed} failed` : ""}.`
          );
        } else {
          toast.error(res.error || "Failed to send emails.");
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* ─── Compose Panel (3/5) ────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Mail className="h-5 w-5 text-indigo-400" />
            <h2 className="font-heading text-base font-semibold text-white">Compose Email</h2>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
              placeholder="Important Update from AAYAM Team"
              disabled={isSending}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Content (Markdown or HTML supported)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm font-mono resize-y"
              placeholder={`## Dear Participant,

We have an important update regarding the event...

**Key Points:**
- Point 1
- Point 2

Best Regards,
**AAYAM Team**`}
              disabled={isSending}
            />
            <p className="mt-1.5 text-xs text-gray-600 flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Supports **bold**, *italic*, # headers, - bullet points, [links](url). Or paste raw HTML.
            </p>
          </div>

          {/* Result Banner */}
          {result && (
            <div className={`rounded-xl border px-4 py-3 text-sm flex items-center gap-3 ${
              result.failed === 0
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                <strong>{result.sent}</strong> email{result.sent !== 1 ? "s" : ""} delivered successfully
                {result.failed > 0 && `, ${result.failed} failed`}.
              </span>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isSending || selectedIds.size === 0}
            className="flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending to {selectedIds.size} recipient{selectedIds.size !== 1 ? "s" : ""}...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {selectedIds.size} selected recipient{selectedIds.size !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Recipients Panel (2/5) ─────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4 h-full">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Users className="h-5 w-5 text-indigo-400" />
            <h2 className="font-heading text-base font-semibold text-white">Recipients</h2>
            <span className="ml-auto rounded-full bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
              {selectedIds.size} / {initialRecipients.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, event..."
              className="w-full rounded-xl border border-white/10 bg-[#16213e] pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Select All */}
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all"
            >
              {allFilteredSelected ? (
                <CheckSquare className="h-4 w-4 text-indigo-400" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
              {allFilteredSelected ? "Deselect All Visible" : `Select All Visible (${filtered.length})`}
            </button>
          )}

          {/* Recipient List */}
          <div className="overflow-y-auto space-y-2 max-h-[480px] pr-1">
            {initialRecipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600 gap-3">
                <Users className="h-8 w-8" />
                <p className="text-sm">No registrations found</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
                <Search className="h-6 w-6" />
                <p className="text-sm">No results for "{search}"</p>
              </div>
            ) : (
              filtered.map((r) => {
                const selected = selectedIds.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleOne(r.id)}
                    className={`w-full flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-indigo-500/40 bg-indigo-500/10"
                        : "border-white/5 bg-white/3 hover:bg-white/8 hover:border-white/15"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {selected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-400" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{r.participantName}</p>
                      <p className="text-xs text-gray-500 truncate">{r.email}</p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400 truncate max-w-full">
                          {r.eventName}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono">{r.registrationId}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
