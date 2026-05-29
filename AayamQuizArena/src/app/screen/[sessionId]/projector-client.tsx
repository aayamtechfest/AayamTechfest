"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Trophy, Clock, Zap, Volume2, Key, Users, Activity } from "lucide-react";
import { RealtimeQuizState } from "@/types";

interface ProjectorScreenClientProps {
  session: any;
}

export function ProjectorScreenClient({ session }: ProjectorScreenClientProps) {
  const [state, setState] = useState<RealtimeQuizState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Sound effects or flash states
  const [lastBuzzerName, setLastBuzzerName] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.on("connect", () => {
      socket.emit("admin:join-session", { sessionId: session.id });
    });

    socket.on("state-sync", (updatedState: RealtimeQuizState) => {
      setState(updatedState);
    });

    socket.on("buzzer-hit", ({ displayName, rank }) => {
      if (rank === 1) {
        setLastBuzzerName(displayName);
        // Reset flash name after 4 seconds
        setTimeout(() => {
          setLastBuzzerName(null);
        }, 4000);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("state-sync");
      socket.off("buzzer-hit");
      socket.disconnect();
    };
  }, [session.id]);

  // Synchronized countdown timer
  useEffect(() => {
    if (!state?.questionEndsAt) {
      setTimeRemaining(0);
      return;
    }

    const calculateTime = () => {
      const ends = new Date(state.questionEndsAt!).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.ceil((ends - now) / 1000));
      setTimeRemaining(diff);
      return diff;
    };

    calculateTime();
    const timer = setInterval(() => {
      const remaining = calculateTime();
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [state?.questionEndsAt]);

  const isTeam = state?.quizMode === "TEAM";
  const sortedEntities = isTeam
    ? [...(state?.teams || [])].sort((a, b) => b.score - a.score).slice(0, 8)
    : [...(state?.participants || [])].sort((a, b) => b.score - a.score).slice(0, 8);

  const currentRound = state?.currentRoundTitle
    ? `Round ${state.currentRoundNumber}: ${state.currentRoundTitle}`
    : "Live Competition";

  return (
    <div className="relative flex min-h-screen flex-col bg-[#060613] text-white overflow-hidden p-6 select-none">
      {/* Background blurs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-10 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[200px]" />
        <div className="absolute right-10 bottom-10 h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[200px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-black/40">
            <img src="/Logo.png" alt="AAYAM Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-heading leading-none">
              AAYAM QUIZ ARENA
            </h1>
            <span className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mt-1 block">
              {currentRound}
            </span>
          </div>
        </div>

        {/* Access Code and Player Count */}
        <div className="flex items-center gap-6">
          <div className="bg-white/5 border border-white/15 rounded-xl px-4 py-1 flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Join Code:</span>
            <span className="text-lg font-mono font-bold tracking-widest text-white">{session.accessCode}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 font-semibold">
            <Users className="h-4.5 w-4.5 text-purple-400" />
            <span>{state?.participants.length || 0} Joined</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 min-h-0">
        
        {/* Left 70%: Question details / Buzzer flash */}
        <div className="lg:col-span-2 flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl min-h-[450px]">
          {state?.status === "WAITING" ? (
            /* Lobby Waiting Room Layout */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Key className="h-10 w-10 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white font-heading tracking-tight">
                  Enter Join Code: <span className="text-indigo-400 font-mono tracking-widest">{session.accessCode}</span>
                </h2>
                <p className="text-base text-gray-400 max-w-md mx-auto">
                  Go to <span className="text-indigo-300 font-bold">http://localhost:3002/join</span> on your device to connect.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold uppercase tracking-wider bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
                <Activity className="h-4 w-4 animate-ping text-emerald-400" />
                waiting for players to connect
              </div>
            </div>
          ) : lastBuzzerName ? (
            /* Flash Buzzer Hit Announcement */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 bg-red-950/20 border border-red-500/20 rounded-2xl animate-fade-in">
              <Volume2 className="h-20 w-20 text-red-500 animate-bounce" />
              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold text-red-400 tracking-widest">
                  Buzzer Hit!
                </span>
                <h2 className="text-5xl font-black text-white font-heading tracking-tight uppercase px-4 py-2 bg-gradient-to-r from-red-600/30 to-red-800/30 border border-red-500/30 rounded-2xl animate-pulse-glow">
                  {lastBuzzerName}
                </h2>
                <p className="text-sm text-gray-400 mt-2 font-semibold">
                  First arrival registered on the queue
                </p>
              </div>
            </div>
          ) : state?.activeQuestion ? (
            /* Active Question Layout */
            <div className="flex-1 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">
                    Question Box ({state.activeQuestion.type})
                  </span>
                  
                  {/* Big ticking timer */}
                  {timeRemaining > 0 && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-1.5 rounded-2xl text-red-400 font-mono font-black text-xl">
                      <Clock className="h-5 w-5 animate-pulse" />
                      <span>{timeRemaining}s</span>
                    </div>
                  )}
                  {timeRemaining <= 0 && (
                    <div className="bg-white/5 border border-white/5 px-4 py-1 rounded-xl text-gray-500 text-xs font-bold uppercase tracking-wider">
                      Timer Expired
                    </div>
                  )}
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed font-heading">
                  {state.activeQuestion.text}
                </h2>
              </div>

              {/* MCQ Options Display */}
              {state.activeQuestion.options.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 pt-6">
                  {state.activeQuestion.options.map((opt, idx) => {
                    const prefix = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-base font-bold text-gray-300"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-sm">
                          {prefix}
                        </span>
                        <span className="truncate">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Active round awaiting question push */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <Zap className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-heading">Prepare for the next challenge</h2>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  The coordinator is organizing the round questions. Stand by.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right 30%: Live scoreboard (Top 8) */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between min-h-[450px]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2 mb-4">
              <Trophy className="h-4 w-4 text-amber-400" />
              Leaderboard (Top Ranks)
            </h2>

            <div className="space-y-2">
              {sortedEntities.map((item, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const badgeColor =
                  rank === 1
                    ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                    : rank === 2
                    ? "bg-slate-400/10 border-slate-400/30 text-slate-400"
                    : "bg-amber-700/10 border-amber-700/30 text-amber-700";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border border-white/5 bg-black/35 p-3 rounded-xl text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isTop3 ? badgeColor : "bg-white/5 border border-white/5 text-gray-500"
                        }`}
                      >
                        {rank}
                      </span>
                      <span className="font-semibold text-white truncate max-w-[150px]">
                        {isTeam ? (item as any).name : (item as any).displayName}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-indigo-400 shrink-0">
                      {item.score} pt
                    </span>
                  </div>
                );
              })}

              {sortedEntities.length === 0 && (
                <div className="text-center py-12 text-xs text-gray-500">
                  Lobby is empty. Connect players to start scoring.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
