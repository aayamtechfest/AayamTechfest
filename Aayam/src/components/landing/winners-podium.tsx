"use client";

import { useState } from "react";
import { Trophy, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationData {
  id: string;
  registrationId: string;
  participantName: string;
  teamName: string | null;
  collegeName: string;
}

interface EventWithWinners {
  id: string;
  slug: string;
  name: string;
  winner1: RegistrationData | null;
  winner2: RegistrationData | null;
  winner3: RegistrationData | null;
}

interface WinnersPodiumProps {
  events: EventWithWinners[];
}

export function WinnersPodium({ events }: WinnersPodiumProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events[0]?.id || ""
  );

  if (events.length === 0) return null;

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const getWinnerDisplayName = (winner: RegistrationData | null) => {
    if (!winner) return "To Be Announced";
    return winner.teamName || winner.participantName;
  };



  const getWinnerRegId = (winner: RegistrationData | null) => {
    if (!winner) return "";
    return `ID: ${winner.registrationId}`;
  };

  return (
    <section className="relative bg-[#0f0f23] py-24 border-t border-white/5">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[600px] rounded-full bg-indigo-600/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-400">
            <Trophy className="h-3.5 w-3.5" />
            <span>Champions Wall</span>
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tournament Winners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400">
            Celebrating the outstanding performances and technical excellence of our event champions.
          </p>
        </div>

        {/* Event Tabs / Selector */}
        {events.length > 1 && (
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 border",
                  selectedEventId === event.id
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10 hover:text-white"
                )}
              >
                {event.name}
              </button>
            ))}
          </div>
        )}

        {/* Podium Layout */}
        <div className="mt-16 flex flex-col items-center justify-center md:flex-row md:items-end gap-6 md:gap-4 max-w-4xl mx-auto">
          {/* 2nd Place (Silver) */}
          <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 group">
            {/* Winner Card */}
            <div className="mb-4 text-center px-4 py-6 rounded-2xl bg-white/5 border border-white/10 w-full hover:border-slate-400/40 hover:bg-white/8 transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-400/10 text-slate-400 mb-3">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="font-heading text-lg font-bold text-white truncate max-w-full">
                {getWinnerDisplayName(currentEvent.winner2)}
              </h4>
              <p className="text-xs text-indigo-400 font-semibold mt-1">
                {getWinnerRegId(currentEvent.winner2)}
              </p>
              {currentEvent.winner2 && currentEvent.winner2.teamName && (
                <p className="text-xs text-gray-400 mt-2 truncate max-w-full">
                  Leader: {currentEvent.winner2.participantName}
                </p>
              )}
            </div>
            {/* Podium Base */}
            <div className="hidden md:flex flex-col items-center justify-center w-full h-32 bg-gradient-to-t from-indigo-950/40 to-slate-800/40 border-t border-x border-slate-500/20 rounded-t-2xl shadow-xl shadow-black/40">
              <span className="text-5xl font-extrabold text-slate-400 font-heading">2</span>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mt-1">Silver</span>
            </div>
            <div className="md:hidden flex items-center justify-center gap-2 mt-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-400/20 text-slate-300 border border-slate-400/30">
                2nd Place (Silver)
              </span>
            </div>
          </div>

          {/* 1st Place (Gold) */}
          <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 group z-10">
            {/* Winner Card */}
            <div className="mb-4 text-center px-4 py-8 rounded-2xl bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/30 w-full hover:border-yellow-400/50 hover:bg-yellow-500/5 transition-all duration-300 shadow-lg shadow-yellow-500/5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 mb-3 animate-pulse">
                <Trophy className="h-7 w-7" />
              </div>
              <h4 className="font-heading text-xl font-bold text-white truncate max-w-full">
                {getWinnerDisplayName(currentEvent.winner1)}
              </h4>
              <p className="text-xs text-yellow-400 font-semibold mt-1">
                {getWinnerRegId(currentEvent.winner1)}
              </p>
              {currentEvent.winner1 && currentEvent.winner1.teamName && (
                <p className="text-xs text-gray-300 mt-2 truncate max-w-full">
                  Leader: {currentEvent.winner1.participantName}
                </p>
              )}
            </div>
            {/* Podium Base */}
            <div className="hidden md:flex flex-col items-center justify-center w-full h-44 bg-gradient-to-t from-indigo-950/40 to-yellow-600/20 border-t border-x border-yellow-500/30 rounded-t-2xl shadow-2xl shadow-black/50">
              <span className="text-6xl font-extrabold text-yellow-400 font-heading">1</span>
              <span className="text-xs uppercase font-bold text-yellow-400 tracking-wider mt-1">Gold</span>
            </div>
            <div className="md:hidden flex items-center justify-center gap-2 mt-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-500/30">
                1st Place (Gold)
              </span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="order-3 flex flex-col items-center w-full md:w-1/3 group">
            {/* Winner Card */}
            <div className="mb-4 text-center px-4 py-6 rounded-2xl bg-white/5 border border-white/10 w-full hover:border-amber-700/40 hover:bg-white/8 transition-all duration-300">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-700/10 text-amber-600 mb-3">
                <Award className="h-6 w-6" />
              </div>
              <h4 className="font-heading text-lg font-bold text-white truncate max-w-full">
                {getWinnerDisplayName(currentEvent.winner3)}
              </h4>
              <p className="text-xs text-indigo-400 font-semibold mt-1">
                {getWinnerRegId(currentEvent.winner3)}
              </p>
              {currentEvent.winner3 && currentEvent.winner3.teamName && (
                <p className="text-xs text-gray-400 mt-2 truncate max-w-full">
                  Leader: {currentEvent.winner3.participantName}
                </p>
              )}
            </div>
            {/* Podium Base */}
            <div className="hidden md:flex flex-col items-center justify-center w-full h-24 bg-gradient-to-t from-indigo-950/40 to-amber-900/30 border-t border-x border-amber-800/20 rounded-t-2xl shadow-xl shadow-black/40">
              <span className="text-4xl font-extrabold text-amber-600 font-heading">3</span>
              <span className="text-xs uppercase font-bold text-amber-600 tracking-wider mt-1">Bronze</span>
            </div>
            <div className="md:hidden flex items-center justify-center gap-2 mt-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-700/20 text-amber-300 border border-amber-700/30">
                3rd Place (Bronze)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
