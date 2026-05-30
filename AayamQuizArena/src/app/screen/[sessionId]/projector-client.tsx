"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Trophy, Clock, Zap, Volume2, Key, Users, Activity, Flame } from "lucide-react";
import { RealtimeQuizState } from "@/types";

interface ProjectorScreenClientProps {
  session: any;
}

export function ProjectorScreenClient({ session }: ProjectorScreenClientProps) {
  const [state, setState] = useState<RealtimeQuizState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [revealedOptionId, setRevealedOptionId] = useState<string | null>(null);
  const [buzzerCountdown, setBuzzerCountdown] = useState<number | null>(null);

  // Sound effects or flash states
  const [lastBuzzerName, setLastBuzzerName] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.on("connect", () => {
      socket.emit("admin:join-session", { sessionId: session.id });
    });

    socket.on("state-sync", (updatedState: RealtimeQuizState) => {
      setState((prevState) => {
        if (prevState?.activeQuestion?.id !== updatedState.activeQuestion?.id) {
          setRevealedOptionId(null);
          setBuzzerCountdown(null); // Reset countdown on new question
        }
        return updatedState;
      });
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

    socket.on("projector:reveal-answer", ({ correctOptionId }) => {
      setRevealedOptionId(correctOptionId);
    });

    socket.on("buzzer-countdown", ({ count }) => {
      setBuzzerCountdown(count > 0 ? count : null);
    });

    return () => {
      socket.off("connect");
      socket.off("state-sync");
      socket.off("buzzer-hit");
      socket.off("reveal-answer");
      socket.off("buzzer-countdown");
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

  const isCompleted = state ? state.status === "COMPLETED" : session.status === "COMPLETED";

  const isTeam = state ? state.quizMode === "TEAM" : session.quiz?.mode === "TEAM";

  // Get sorted list of ranks with fallback to static session database scores
  const sortedEntities = isTeam
    ? (state
        ? [...(state.teams || [])].sort((a, b) => b.score - a.score)
        : [...(session.teams || [])].map((t: any) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            score: t.totalScore || 0
          })).sort((a: any, b: any) => b.score - a.score)).slice(0, 8)
    : (state
        ? [...(state.participants || [])].sort((a, b) => b.score - a.score)
        : [...(session.participants || [])].map((p: any) => ({
            id: p.id,
            displayName: p.displayName,
            registrationNumber: p.registration?.registrationId || "Solo",
            score: p.totalScore || 0
          })).sort((a: any, b: any) => b.score - a.score)).slice(0, 8);

  const currentRound = isCompleted
    ? "Competition Finished"
    : state?.currentRoundTitle
    ? `Round ${state.currentRoundNumber}: ${state.currentRoundTitle}`
    : "Live Competition";

  const podium = sortedEntities.slice(0, 3);

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
        <div className="lg:col-span-2 flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0c0c1e]/60 p-8 backdrop-blur-xl min-h-[450px]">
          {isCompleted ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-4 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-400 font-extrabold tracking-wider uppercase animate-pulse">
                <Trophy className="h-4 w-4" />
                Final Standings
              </div>
              
              <h2 className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-4xl sm:text-5xl font-black tracking-tight text-transparent font-heading uppercase leading-none">
                Championship Podium
              </h2>
              
              {/* Podium display (Top 3) */}
              <div className="grid gap-6 grid-cols-3 w-full max-w-xl mx-auto pt-8 items-end relative min-h-[240px]">
                {/* 2nd Place (Left) */}
                {podium[1] && (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute -inset-1 rounded-full bg-slate-400/20 blur-sm" />
                      <div className="h-14 w-14 rounded-full bg-[#1e1e38] border-2 border-slate-400 flex items-center justify-center text-slate-400 font-bold text-sm">
                        2
                      </div>
                    </div>
                    <div className="w-full text-center rounded-2xl border border-white/5 bg-[#121225]/40 p-4 backdrop-blur-md">
                      <p className="text-sm font-bold text-slate-300 truncate font-heading">
                        {(podium[1] as any).name || (podium[1] as any).displayName}
                      </p>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                        {isTeam ? "Team" : "Contestant"}
                      </p>
                      <p className="text-base font-mono font-extrabold text-indigo-300 mt-2">
                        {(podium[1] as any).score} pts
                      </p>
                    </div>
                  </div>
                )}

                {/* 1st Place (Center) */}
                {podium[0] && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative flex items-center justify-center animate-bounce-slow">
                      <div className="absolute -inset-2 rounded-full bg-amber-500/20 blur-md animate-pulse" />
                      <Trophy className="absolute -top-7 h-7 w-7 text-amber-400 animate-bounce" />
                      <div className="h-18 w-18 rounded-full bg-[#1e1e38] border-4 border-amber-400 flex items-center justify-center text-amber-400 font-extrabold text-lg">
                        1
                      </div>
                    </div>
                    <div className="w-full text-center rounded-2xl border border-amber-500/20 bg-indigo-500/10 p-5 backdrop-blur-md shadow-xl shadow-amber-500/5">
                      <p className="text-base font-extrabold text-white truncate font-heading">
                        {(podium[0] as any).name || (podium[0] as any).displayName}
                      </p>
                      <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                        {isTeam ? "Team" : "Contestant"}
                      </p>
                      <p className="text-lg font-mono font-extrabold text-amber-400 mt-2">
                        {(podium[0] as any).score} pts
                      </p>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {podium[2] && (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute -inset-1 rounded-full bg-amber-700/20 blur-sm" />
                      <div className="h-12 w-12 rounded-full bg-[#1e1e38] border-2 border-amber-700 flex items-center justify-center text-amber-700 font-bold text-xs">
                        3
                      </div>
                    </div>
                    <div className="w-full text-center rounded-2xl border border-white/5 bg-[#121225]/40 p-4 backdrop-blur-md">
                      <p className="text-sm font-bold text-amber-600 truncate font-heading">
                        {(podium[2] as any).name || (podium[2] as any).displayName}
                      </p>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                        {isTeam ? "Team" : "Contestant"}
                      </p>
                      <p className="text-base font-mono font-extrabold text-indigo-300 mt-2">
                        {(podium[2] as any).score} pts
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : state?.status === "WAITING" ? (
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
                  Go to <span className="text-indigo-300 font-bold">{process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"}/join</span> on your device to connect.
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Watch Live Rankings: <span className="text-indigo-400 font-mono font-bold">{(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002").replace(/^https?:\/\//, "")}/l/{session.accessCode}</span>
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
                  Fastest finger registered!
                </p>
              </div>
            </div>
          ) : state?.currentRoundType === "RAPID_FIRE" ? (
            /* ─────────── RAPID FIRE PROJECTOR VIEW ─────────── */
            <div className="flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4 border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 tracking-wider">
                    Rapid Fire Round
                  </span>
                  {state.rapidFireState?.isRunning && (
                    <div className="flex items-center gap-3">
                      {/* Round Timer */}
                      <div className={`flex items-center gap-2 bg-red-500/10 border px-3.5 py-1.5 rounded-xl text-red-400 font-mono font-black text-sm transition-colors duration-250 ${state.rapidFireState.pausedForSelection ? "border-amber-500/40 text-amber-400" : "border-red-500/30"}`}>
                        <Clock className="h-4 w-4 animate-pulse" />
                        <span>Round: {state.rapidFireState.timeLeft}s {state.rapidFireState.pausedForSelection && "(Paused)"}</span>
                      </div>
                      {/* Question Timer */}
                      <div className={`flex items-center gap-2 bg-amber-500/10 border px-3.5 py-1.5 rounded-xl text-amber-400 font-mono font-black text-sm transition-colors duration-250 ${state.rapidFireState.pausedForSelection ? "border-amber-500/40 text-amber-400 animate-pulse" : "border-amber-500/30"}`}>
                        <Clock className="h-4 w-4" />
                        <span>Question: {state.rapidFireState.questionTimeLeft}s {state.rapidFireState.pausedForSelection && "(Paused)"}</span>
                      </div>
                    </div>
                  )}
                </div>

                <h2 className="text-3xl font-extrabold font-heading text-white">
                  Active Contestant: <span className="text-amber-400 font-black">
                    {state.rapidFireState?.activeTeamId 
                      ? state.teams.find(t => t.id === state.rapidFireState?.activeTeamId)?.name 
                      : (state.rapidFireState?.activeParticipantId 
                          ? state.participants.find(p => p.id === state.rapidFireState?.activeParticipantId)?.displayName 
                          : "Not Configured")}
                  </span>
                </h2>
              </div>

              {state.rapidFireState?.isRunning ? (
                <div className="flex-1 flex flex-col justify-center space-y-6 animate-fade-in">
                  {state.activeQuestion ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">
                          Question #{state.rapidFireState.questionIndex + 1}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed font-heading">
                          {state.activeQuestion.text}
                        </h3>
                      </div>

                      {/* Render question options if any */}
                      {state.activeQuestion.options && state.activeQuestion.options.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {state.activeQuestion.options.map((opt, idx) => {
                             const prefix = String.fromCharCode(65 + idx);
                             const isSelected = state.rapidFireState?.selectedOptionId === opt.id;
                             
                             let optionStyle = "bg-white/5 border-white/10 text-gray-300";
                             let badgeStyle = "bg-amber-500/10 text-amber-300 border border-amber-500/20";
                             
                             if (isSelected) {
                               optionStyle = "bg-amber-500/15 border-amber-500 text-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse";
                               badgeStyle = "bg-amber-500 text-black border border-amber-500";
                             }

                             return (
                               <div
                                 key={opt.id}
                                 className={`flex items-center gap-3 border px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${optionStyle}`}
                               >
                                 <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${badgeStyle}`}>
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
                    <div className="text-center py-12">
                      <Zap className="h-10 w-10 text-gray-600 animate-pulse mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading round questions...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center space-y-6 bg-black/25 border border-white/5 rounded-3xl p-8">
                  <Flame className="h-16 w-16 text-amber-500 animate-pulse" />
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white font-heading">Ready for Rapid Fire</h3>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Setup complete. Once the host starts, questions will auto-timeout and cycle sequentially.
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold text-gray-400 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                    <span>Round time: {state.rapidFireState?.config?.totalRoundTime || 60}s</span>
                    <span>&bull;</span>
                    <span>Per question: {state.rapidFireState?.config?.questionTimeLimit || 10}s</span>
                    {state.rapidFireState?.config?.negativeMarking && (
                      <>
                        <span>&bull;</span>
                        <span className="text-red-400 font-bold uppercase">Negative Marking Enabled</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : state?.currentRoundType === "PASS_ROUND" ? (
            /* ─────────── PASS ROUND PROJECTOR VIEW ─────────── */
            <div className="flex-1 flex flex-col justify-between space-y-6 text-center">
              <div className="space-y-2 border-b border-white/5 pb-4">
                <span className="text-xs uppercase font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20 tracking-wider">
                  Pass Round (Circular Turn)
                </span>
                <h2 className="text-4xl font-extrabold font-heading text-white mt-3">
                  Current Turn: <span className="text-yellow-400 font-black">{state.passRoundState?.activeTeamId ? state.teams.find(t => t.id === state.passRoundState?.activeTeamId)?.name : "Not Configured"}</span>
                </h2>
                {state.passRoundState?.passCount && state.passRoundState.passCount > 0 ? (
                  <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest mt-1">
                    Passed x{state.passRoundState.passCount} &bull; Points slashed to 50%!
                  </p>
                ) : null}
              </div>

              {state.activeQuestion ? (
                <div className="flex-1 flex flex-col justify-center">
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-relaxed font-heading max-w-xl mx-auto">
                    {state.activeQuestion.text}
                  </h1>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <Zap className="h-12 w-12 text-gray-600 animate-pulse" />
                  <p className="text-sm text-gray-500 mt-2">Waiting for host to push next pass question.</p>
                </div>
              )}
            </div>
          ) : state?.activeQuestion ? (
            /* ─────────── MCQ / BUZZER ROUND VIEW ─────────── */
            <div className="flex-1 flex flex-col justify-between space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">
                    Question Box ({state.activeQuestion.type})
                  </span>
                  
                  {state.currentRoundType === "MCQ" && timeRemaining > 0 && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-1.5 rounded-2xl text-red-400 font-mono font-black text-xl">
                      <Clock className="h-5 w-5 animate-pulse" />
                      <span>{timeRemaining}s</span>
                    </div>
                  )}
                  {state.currentRoundType === "MCQ" && timeRemaining <= 0 && (
                    <div className="bg-white/5 border border-white/5 px-4 py-1 rounded-xl text-gray-500 text-xs font-bold uppercase tracking-wider">
                      Timer Expired
                    </div>
                  )}

                  {state.currentRoundType === "BUZZER" && (
                    <div className={`border px-4 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${state.buzzerOpen ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse" : "bg-red-500/20 border-red-500 text-red-400"}`}>
                      Buzzers: {state.buzzerOpen ? "Open" : "Locked"}
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
                    const isRevealedCorrect = revealedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 border px-5 py-4 rounded-2xl text-base font-bold transition-all duration-200 ${
                          isRevealedCorrect
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse"
                            : "bg-white/5 border-white/10 text-gray-300"
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold ${
                          isRevealedCorrect
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        }`}>
                          {prefix}
                        </span>
                        <span className="truncate">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Buzzer Rankings Display */}
              {state.currentRoundType === "BUZZER" && (
                <div className="space-y-3 pt-6 border-t border-white/5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Buzzer Registration Queue:</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {state.buzzerQueue && state.buzzerQueue.length > 0 ? (
                      state.buzzerQueue.map((buzzer, idx) => {
                        const rank = idx + 1;
                        return (
                          <div
                            key={buzzer.id}
                            className={`flex items-center justify-between p-3.5 border rounded-2xl text-sm font-bold ${
                              buzzer.status === "ACCEPTED"
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : buzzer.status === "REJECTED"
                                ? "bg-red-500/20 border-red-500 text-red-400"
                                : "bg-white/5 border-white/10 text-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono">
                                #{rank}
                              </span>
                              <span>{buzzer.displayName}</span>
                            </div>
                            <span className="text-xs font-mono text-gray-500 uppercase">{buzzer.status}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-6 border border-dashed border-white/5 rounded-2xl text-xs text-gray-500">
                        Wait for contestants to buzz...
                      </div>
                    )}
                  </div>
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
                  Host is setting up the next round questions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right 30%: Live scoreboard (Top 8) OR Rapid Fire details */}
        <div className="rounded-3xl border border-white/10 bg-[#0c0c1e]/60 p-6 backdrop-blur-xl flex flex-col justify-between min-h-[450px]">
          {state?.currentRoundType === "RAPID_FIRE" && state.rapidFireState && !isCompleted ? (
            <div className="flex-1 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                  <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
                  Rapid Fire Performance
                </h2>

                {/* Score Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Attempted</span>
                    <span className="text-lg font-black text-white">{state.rapidFireState.stats?.attempted || 0}</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center">
                    <span className="text-[9px] text-emerald-400/70 uppercase block font-bold">Correct</span>
                    <span className="text-lg font-black text-emerald-400">{state.rapidFireState.stats?.correct || 0}</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl text-center">
                    <span className="text-[9px] text-indigo-400/70 uppercase block font-bold">Points</span>
                    <span className="text-lg font-black text-indigo-300">{state.rapidFireState.stats?.score || 0}</span>
                  </div>
                </div>

                {/* History Log */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Question Log:</h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {state.rapidFireState.stats?.history && state.rapidFireState.stats.history.length > 0 ? (
                      state.rapidFireState.stats.history.map((h, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 border p-3 rounded-xl text-xs ${
                            h.isCorrect
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                              : "bg-red-500/5 border-red-500/20 text-red-300"
                          }`}
                        >
                          <span className="mt-0.5 text-base leading-none">
                            {h.isCorrect ? "✅" : "❌"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate text-white">{h.questionText}</p>
                            <span className="text-[10px] opacity-60">
                              {h.pointsAwarded >= 0 ? `+${h.pointsAwarded}` : h.pointsAwarded} pts
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 border border-dashed border-white/5 rounded-xl text-xs text-gray-500">
                        No responses logged yet...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 text-center pt-2 border-t border-white/5">
                Rapid Fire scores are synchronized instantly
              </div>
            </div>
          ) : (
            <>
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
                        className="flex items-center justify-between border border-white/5 bg-[#121225]/45 hover:bg-[#1c1c38]/45 p-3 rounded-xl text-sm transition-all duration-200"
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
                          {item.score} pts
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

              <div className="text-[10px] text-gray-500 text-center pt-4 border-t border-white/5">
                Top ranks update dynamically in real time
              </div>
            </>
          )}
        </div>
    </div>
      {/* Buzzer Countdown Overlay */}
      {buzzerCountdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="text-center space-y-4">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-400">Get Ready to Buzz!</span>
            <div className="text-9xl font-black font-heading text-white animate-ping">
              {buzzerCountdown}
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block mt-4">
              Buzzers open in {buzzerCountdown}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
