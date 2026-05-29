"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import {
  Trophy,
  Zap,
  Volume2,
  Clock,
  Award,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { RealtimeQuizState } from "@/types";

interface QuizClientProps {
  session: any;
  participantId?: string;
}

export function QuizClient({ session, participantId }: QuizClientProps) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<RealtimeQuizState | null>(null);

  // Participant specific inputs
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(null);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzerRank, setBuzzerRank] = useState<number | null>(null);

  // Time tracking
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Resolve participantId from localStorage if not provided in URL
    let resolvedParticipantId = participantId;
    if (!resolvedParticipantId) {
      resolvedParticipantId = localStorage.getItem(`session_${session.id}_player`) || undefined;
    }

    if (!resolvedParticipantId) {
      toast.error("Contestant ID not found. Redirecting to join page.");
      router.push("/join");
      return;
    }

    const socket = getSocket();
    socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-session", {
        sessionId: session.id,
        participantId: resolvedParticipantId,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("state-sync", (updatedState: RealtimeQuizState) => {
      setState((prevState) => {
        // Reset inputs if the question has transitioned
        if (prevState?.activeQuestion?.id !== updatedState.activeQuestion?.id) {
          setSubmittedOptionId(null);
          setHasBuzzed(false);
          setBuzzerRank(null);
        }
        return updatedState;
      });

      // Redirect if session status becomes COMPLETED or goes back to WAITING
      if (updatedState.status === "COMPLETED") {
        toast.info("Quiz has completed. Loading results!");
        router.push(`/leaderboard/${session.id}`);
      } else if (updatedState.status === "WAITING") {
        router.push(`/lobby/${session.id}`);
      }
    });

    socket.on("answer-feedback", (res: { success: boolean; isCorrect?: boolean; error?: string }) => {
      if (res.success) {
        toast.success(res.isCorrect ? "Correct answer! Nice job!" : "Answer logged.");
      } else {
        toast.error(res.error || "Failed to log answer.");
      }
    });

    socket.on("buzzer-hit", ({ participantId: hitPid, rank }) => {
      if (hitPid === resolvedParticipantId) {
        setBuzzerRank(rank);
        toast.success(`You buzzed! Rank #${rank}`);
      }
    });

    socket.on("buzzer-reset", () => {
      setHasBuzzed(false);
      setBuzzerRank(null);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("state-sync");
      socket.off("answer-feedback");
      socket.off("buzzer-hit");
      socket.off("buzzer-reset");
      socket.disconnect();
    };
  }, [session.id, participantId, router]);

  // Synchronized Client countdown ticker
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

  const handleOptionSelect = (optionId: string) => {
    if (submittedOptionId || timeRemaining <= 0) return;
    
    setSubmittedOptionId(optionId);
    
    getSocket().emit("submit-answer", {
      sessionId: session.id,
      participantId,
      questionId: state?.activeQuestion?.id,
      selectedOptionId: optionId,
    });
  };

  const handleBuzzerPress = () => {
    if (hasBuzzed) return;
    setHasBuzzed(true);
    getSocket().emit("buzzer-pressed", {
      sessionId: session.id,
      participantId,
    });
  };

  const currentPlayer = state?.participants.find((p) => p.id === participantId);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0f0f23]">
      {/* Background Blurs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-[300px] w-[300px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute -right-20 top-40 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      {/* Header bar */}
      <header className="border-b border-white/10 py-3.5 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-black/20">
              <img src="/Logo.png" alt="AAYAM Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none">
                {state?.sessionName || "Active Game"}
              </span>
              {state?.currentRoundTitle && (
                <h2 className="text-sm font-bold text-indigo-400 font-heading leading-none mt-0.5">
                  Round {state.currentRoundNumber}: {state.currentRoundTitle}
                </h2>
              )}
            </div>
          </div>

          {/* Current Score Indicator */}
          <div className="flex items-center gap-3">
            {currentPlayer && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-xl text-center">
                <span className="text-[8px] text-indigo-400 uppercase font-bold tracking-wider block">Your Score</span>
                <span className="text-sm font-mono font-bold text-white block">{currentPlayer.score} pts</span>
              </div>
            )}
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center relative z-10">
        {state?.status === "PAUSED" ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-4 backdrop-blur-xl">
            <Loader2 className="mx-auto h-12 w-12 text-amber-500 animate-spin" />
            <h2 className="text-xl font-bold text-amber-400 font-heading">Quiz Paused</h2>
            <p className="text-sm text-gray-400">
              The coordinator has paused the game. Please stand by.
            </p>
          </div>
        ) : state?.activeQuestion ? (
          <div className="space-y-6">
            {/* Round info card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4 relative overflow-hidden">
              {/* Question timer / Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest block">
                  Question Box
                </span>
                
                {/* Countdown Timer */}
                {timeRemaining > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-xl text-red-400 font-mono font-bold text-xs">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    <span>{timeRemaining}s</span>
                  </div>
                )}

                {timeRemaining <= 0 && (
                  <div className="flex items-center gap-1.5 bg-gray-500/10 border border-white/5 px-2.5 py-1 rounded-xl text-gray-400 text-xs font-semibold">
                    <span>Timer Expired</span>
                  </div>
                )}
              </div>

              {/* Question Text */}
              <h1 className="text-lg sm:text-xl font-bold text-white leading-relaxed font-heading">
                {state.activeQuestion.text}
              </h1>
            </div>

            {/* MCQ Options / Buzzer area */}
            {state.currentRoundType === "BUZZER" ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                {/* Mega Buzzer Button */}
                <button
                  onClick={handleBuzzerPress}
                  disabled={hasBuzzed}
                  className={`relative flex h-48 w-48 items-center justify-center rounded-full border-8 font-heading text-lg font-extrabold uppercase tracking-wider text-white shadow-2xl transition-all duration-300 active:scale-95 ${
                    hasBuzzed
                      ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-br from-red-500 to-red-700 border-red-400 hover:brightness-110 shadow-red-500/20 hover:shadow-red-500/40 animate-pulse-glow"
                  }`}
                >
                  <Volume2 className="absolute top-10 h-6 w-6 opacity-60" />
                  <span className="mt-4">{hasBuzzed ? "Buzzed" : "Buzzer"}</span>
                </button>

                {/* Rank display */}
                {hasBuzzed && (
                  <div className="text-center space-y-1">
                    <p className="text-sm text-gray-400">Buzzer registered!</p>
                    {buzzerRank !== null ? (
                      <h3 className="text-lg font-bold text-indigo-400">
                        Rank Arrival: #{buzzerRank}
                      </h3>
                    ) : (
                      <p className="text-xs text-gray-500 animate-pulse">Calculating order...</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* MCQ Option Grid */
              <div className="grid gap-3 sm:grid-cols-2">
                {state.activeQuestion.options.map((opt, index) => {
                  const isSelected = submittedOptionId === opt.id;
                  const prefix = String.fromCharCode(65 + index); // A, B, C, D...

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(opt.id)}
                      disabled={!!submittedOptionId || timeRemaining <= 0}
                      className={`flex items-center gap-3 w-full border text-left p-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-white"
                          : submittedOptionId
                          ? "bg-white/5 border-white/5 text-gray-500 cursor-not-allowed"
                          : "bg-white/5 border-white/10 text-gray-300 hover:border-indigo-500/30 hover:bg-white/[0.08]"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isSelected ? "bg-indigo-500 text-white" : "bg-white/10 text-gray-400"
                      }`}>
                        {prefix}
                      </span>
                      <span className="truncate">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4 backdrop-blur-xl">
            <Zap className="mx-auto h-12 w-12 text-indigo-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white font-heading">Get Ready!</h2>
            <p className="text-sm text-gray-400">
              The round is active. Stand by for the coordinator to push the next question.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
