"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Trophy, Star, Award, Shield, User, Users, Key } from "lucide-react";
import { RealtimeQuizState } from "@/types";

interface LeaderboardClientProps {
  session: any;
}

export function LeaderboardClient({ session }: LeaderboardClientProps) {
  const [state, setState] = useState<RealtimeQuizState | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.on("connect", () => {
      socket.emit("join-session", { sessionId: session.id });
    });

    socket.on("state-sync", (updatedState: RealtimeQuizState) => {
      setState(updatedState);
    });

    return () => {
      socket.off("connect");
      socket.off("state-sync");
      socket.disconnect();
    };
  }, [session.id]);

  const isTeam = state?.quizMode === "TEAM";

  // Get sorted list of ranks
  const sortedEntities = isTeam
    ? [...(state?.teams || [])].sort((a, b) => b.score - a.score)
    : [...(state?.participants || [])].sort((a, b) => b.score - a.score);

  const podium = sortedEntities.slice(0, 3);
  const remaining = sortedEntities.slice(3);

  // Position mappings for podium cards
  // Index 0 -> 1st (center), Index 1 -> 2nd (left), Index 2 -> 3rd (right)
  const podiumOrder = [
    podium[1] || null, // 2nd place
    podium[0] || null, // 1st place
    podium[2] || null, // 3rd place
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0b0b1e] text-white">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[150px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[150px]" />
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 space-y-12 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-400 font-semibold tracking-wider uppercase">
            <Trophy className="h-4 w-4 animate-bounce" />
            Live Rankings Board
          </div>
          <h1 className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent font-heading leading-tight">
            {state?.sessionName || session.name}
          </h1>
          <p className="text-sm text-gray-400">
            Competition: {state?.quizName || session.quiz.name} &bull; Mode: {state?.quizMode || session.quiz.mode}
          </p>
        </div>

        {/* Podium Display (Top 3) */}
        {podium.length > 0 && (
          <div className="grid gap-6 grid-cols-3 max-w-2xl mx-auto pt-8 items-end relative min-h-[280px]">
            {/* 2nd Place (Left) */}
            {podiumOrder[0] && (
              <div className="flex flex-col items-center space-y-3 animate-slide-up [animation-delay:0.3s]">
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-1 rounded-full bg-slate-400/20 blur-sm" />
                  <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-slate-400 font-bold">
                    2
                  </div>
                </div>
                <div className="w-full text-center rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                  <p className="text-sm font-bold text-slate-300 truncate">
                    {isTeam ? (podiumOrder[0] as any).name : (podiumOrder[0] as any).displayName}
                  </p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                    {isTeam ? "Team" : (podiumOrder[0] as any).registrationNumber}
                  </p>
                  <p className="text-lg font-mono font-extrabold text-indigo-300 mt-2">
                    {podiumOrder[0].score} pts
                  </p>
                </div>
              </div>
            )}

            {/* 1st Place (Center - taller) */}
            {podiumOrder[1] && (
              <div className="flex flex-col items-center space-y-4 animate-slide-up">
                <div className="relative flex items-center justify-center">
                  {/* Glow circle */}
                  <div className="absolute -inset-2 rounded-full bg-amber-500/20 blur-md animate-pulse" />
                  <Trophy className="absolute -top-8 h-8 w-8 text-amber-400 animate-bounce" />
                  <div className="h-20 w-20 rounded-full bg-slate-800 border-4 border-amber-400 flex items-center justify-center text-amber-400 font-extrabold text-xl">
                    1
                  </div>
                </div>
                <div className="w-full text-center rounded-2xl border border-amber-500/20 bg-indigo-500/10 p-6 backdrop-blur-md shadow-xl shadow-amber-500/5">
                  <p className="text-base font-extrabold text-white truncate">
                    {isTeam ? (podiumOrder[1] as any).name : (podiumOrder[1] as any).displayName}
                  </p>
                  <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                    {isTeam ? "Team" : (podiumOrder[1] as any).registrationNumber}
                  </p>
                  <p className="text-xl font-mono font-extrabold text-amber-400 mt-3">
                    {podiumOrder[1].score} pts
                  </p>
                </div>
              </div>
            )}

            {/* 3rd Place (Right) */}
            {podiumOrder[2] && (
              <div className="flex flex-col items-center space-y-3 animate-slide-up [animation-delay:0.6s]">
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-1 rounded-full bg-amber-700/20 blur-sm" />
                  <div className="h-14 w-14 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-amber-700 font-bold">
                    3
                  </div>
                </div>
                <div className="w-full text-center rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                  <p className="text-sm font-bold text-amber-600 truncate">
                    {isTeam ? (podiumOrder[2] as any).name : (podiumOrder[2] as any).displayName}
                  </p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                    {isTeam ? "Team" : (podiumOrder[2] as any).registrationNumber}
                  </p>
                  <p className="text-lg font-mono font-extrabold text-indigo-300 mt-2">
                    {podiumOrder[2].score} pts
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extended Leaderboard List (Rank 4+) */}
        {remaining.length > 0 && (
          <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">
              Contenders Pool
            </h3>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {remaining.map((item, index) => {
                const rank = index + 4;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border border-white/5 bg-black/20 p-3.5 rounded-xl text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-500 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded text-xs">
                        #{rank}
                      </span>
                      <div>
                        <p className="font-semibold text-white">
                          {isTeam ? (item as any).name : (item as any).displayName}
                        </p>
                        {!isTeam && (
                          <p className="text-[10px] text-gray-500 font-mono">
                            ID: {(item as any).registrationNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="font-mono font-bold text-indigo-400">
                      {item.score} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sortedEntities.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            Waiting for players to join the lobby and earn points.
          </div>
        )}
      </main>
    </div>
  );
}
