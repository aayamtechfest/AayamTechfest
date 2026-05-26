"use client";

import { useState, useTransition, useEffect } from "react";
import { setEventWinners } from "@/actions/winner.actions";
import { toast } from "sonner";
import { Trophy, Medal, Award, Save, Loader2 } from "lucide-react";

interface RegistrationItem {
  id: string;
  registrationId: string;
  participantName: string;
  teamName: string | null;
  email: string;
}

interface EventItem {
  id: string;
  name: string;
  winner1Id: string | null;
  winner2Id: string | null;
  winner3Id: string | null;
  registrations: RegistrationItem[];
}

interface WinnersFormProps {
  events: EventItem[];
}

export function WinnersForm({ events }: WinnersFormProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const [winner1, setWinner1] = useState<string>("");
  const [winner2, setWinner2] = useState<string>("");
  const [winner3, setWinner3] = useState<string>("");

  const currentEvent = events.find((e) => e.id === selectedEventId);

  useEffect(() => {
    if (currentEvent) {
      setWinner1(currentEvent.winner1Id || "");
      setWinner2(currentEvent.winner2Id || "");
      setWinner3(currentEvent.winner3Id || "");
    } else {
      setWinner1("");
      setWinner2("");
      setWinner3("");
    }
  }, [selectedEventId, currentEvent]);

  // Set default event if none is selected
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const handleSave = () => {
    if (!selectedEventId) return;

    startTransition(async () => {
      const res = await setEventWinners(
        selectedEventId,
        winner1 || null,
        winner2 || null,
        winner3 || null
      );

      if (res.success) {
        toast.success("Winners updated successfully!");
        // Update local state
        const evt = events.find((e) => e.id === selectedEventId);
        if (evt) {
          evt.winner1Id = winner1 || null;
          evt.winner2Id = winner2 || null;
          evt.winner3Id = winner3 || null;
        }
      } else {
        toast.error(res.error || "Failed to update winners.");
      }
    });
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-16 text-center backdrop-blur-md">
        <Trophy className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-lg font-bold text-white">No Events Found</h3>
        <p className="mt-1 text-sm text-gray-400">Please create events in the Events tab first.</p>
      </div>
    );
  }

  const approvedRegistrations = currentEvent?.registrations || [];

  return (
    <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto w-full">
      {/* Event Selection List */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Select Competition</h3>
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2">
          {events.map((evt) => {
            const hasWinners = evt.winner1Id || evt.winner2Id || evt.winner3Id;
            const isSelected = evt.id === selectedEventId;

            return (
              <button
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`w-full text-left rounded-xl p-3.5 border transition-all duration-200 flex items-start justify-between gap-3 ${
                  isSelected
                    ? "bg-indigo-600/15 border-indigo-500 text-white"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{evt.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {evt.registrations.length} Approved Participants
                  </p>
                </div>
                {hasWinners && (
                  <span className="shrink-0 text-amber-400" title="Winners set">
                    🏆
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Winners Editor */}
      <div className="lg:col-span-2">
        {currentEvent ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <span>Configure Winners for</span>
                <span className="text-indigo-400">{currentEvent.name}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Assign placement positions. Leave blank to clear.
              </p>
            </div>

            {approvedRegistrations.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-sm text-gray-400">
                  There are no <strong className="text-white">APPROVED</strong> registrations for this competition yet.
                </p>
                <p className="text-xs text-gray-500">
                  Only registrations with approved payment status can be selected as winners.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1st Place */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>1st Place (Winner)</span>
                  </label>
                  <select
                    value={winner1}
                    onChange={(e) => setWinner1(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Winner --</option>
                    {approvedRegistrations.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.teamName 
                          ? `${reg.teamName} (${reg.registrationId}) - ${reg.participantName}` 
                          : `${reg.participantName} (${reg.registrationId})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2nd Place */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Medal className="h-4 w-4 text-slate-300" />
                    <span>2nd Place (Runner up)</span>
                  </label>
                  <select
                    value={winner2}
                    onChange={(e) => setWinner2(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Runner up --</option>
                    {approvedRegistrations.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.teamName 
                          ? `${reg.teamName} (${reg.registrationId}) - ${reg.participantName}` 
                          : `${reg.participantName} (${reg.registrationId})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3rd Place */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>3rd Place</span>
                  </label>
                  <select
                    value={winner3}
                    onChange={(e) => setWinner3(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select 3rd Place --</option>
                    {approvedRegistrations.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.teamName 
                          ? `${reg.teamName} (${reg.registrationId}) - ${reg.participantName}` 
                          : `${reg.participantName} (${reg.registrationId})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Placement</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-gray-400">
            Select a competition to manage its winners.
          </div>
        )}
      </div>
    </div>
  );
}
