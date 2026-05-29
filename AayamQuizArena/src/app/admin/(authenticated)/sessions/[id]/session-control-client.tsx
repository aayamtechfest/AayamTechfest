"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import { adjustParticipantScore } from "@/actions/score.actions";
import { updateSessionStatus, updateRoundStatus } from "@/actions/session.actions";
import { toast } from "sonner";
import {
  ArrowLeft,
  Tv,
  Users,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  List,
  Flame,
  Check,
  X,
  Plus,
  Minus,
  MessageSquare,
  Sparkles,
  Loader2,
  Settings,
} from "lucide-react";
import { RealtimeQuizState } from "@/types";

interface SessionControlClientProps {
  session: any;
}

export function SessionControlClient({ session }: SessionControlClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Socket state
  const [isConnected, setIsConnected] = useState(false);
  const [quizState, setQuizState] = useState<RealtimeQuizState | null>(null);

  // Manual score correction modal states
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [scoreDelta, setScoreDelta] = useState(10);
  const [correctionNote, setCorrectionNote] = useState("");

  useEffect(() => {
    const socket = getSocket();

    socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("admin:join-session", { sessionId: session.id });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("state-sync", (state: RealtimeQuizState) => {
      setQuizState(state);
    });

    socket.on("error", (err: string) => {
      toast.error(err);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("state-sync");
      socket.off("error");
      socket.disconnect();
    };
  }, [session.id]);

  // Controls helper emitters
  const handleStartSession = () => {
    startTransition(async () => {
      const res = await updateSessionStatus(session.id, "ACTIVE");
      if (res.success) {
        getSocket().emit("admin:start-session", { sessionId: session.id });
        toast.success("Quiz session active!");
      }
    });
  };

  const handlePauseSession = () => {
    startTransition(async () => {
      const res = await updateSessionStatus(session.id, "PAUSED");
      if (res.success) {
        getSocket().emit("admin:pause-session", { sessionId: session.id });
        toast.success("Quiz session paused.");
      }
    });
  };

  const handleResumeSession = () => {
    startTransition(async () => {
      const res = await updateSessionStatus(session.id, "ACTIVE");
      if (res.success) {
        getSocket().emit("admin:resume-session", { sessionId: session.id });
        toast.success("Quiz session resumed!");
      }
    });
  };

  const handleEndSession = () => {
    if (!confirm("Are you sure you want to end this session? This will finalize scores.")) return;
    startTransition(async () => {
      const res = await updateSessionStatus(session.id, "COMPLETED");
      if (res.success) {
        getSocket().emit("admin:end-session", { sessionId: session.id });
        toast.success("Quiz session completed!");
      }
    });
  };

  const handleStartRound = (roundId: string) => {
    startTransition(async () => {
      const res = await updateRoundStatus(roundId, "ACTIVE");
      if (res.success) {
        getSocket().emit("admin:start-round", { sessionId: session.id, roundId });
        toast.success("Round started!");
      }
    });
  };

  const handleEndRound = (roundId: string) => {
    startTransition(async () => {
      const res = await updateRoundStatus(roundId, "COMPLETED");
      if (res.success) {
        getSocket().emit("admin:end-round", { sessionId: session.id, roundId });
        toast.success("Round completed!");
      }
    });
  };

  const handlePushQuestion = (questionId: string) => {
    getSocket().emit("admin:push-question", { sessionId: session.id, questionId });
    toast.success("Question pushed to players!");
  };

  const handleShowAnswer = () => {
    getSocket().emit("admin:reveal-answer", { sessionId: session.id });
    toast.success("Correct answer revealed!");
  };

  const handleResetBuzzer = () => {
    getSocket().emit("admin:reset-buzzer", { sessionId: session.id });
    toast.success("Buzzer reset!");
  };

  const handleResolveBuzzer = (buzzerEventId: string, status: "ACCEPTED" | "REJECTED") => {
    getSocket().emit("admin:resolve-buzzer", {
      sessionId: session.id,
      buzzerEventId,
      status,
    });
    toast.success(`Buzzer marked as ${status.toLowerCase()}!`);
  };

  const handleApplyScoreCorrection = async () => {
    if (!selectedParticipant) return;

    startTransition(async () => {
      const res = await adjustParticipantScore(
        session.id,
        selectedParticipant.id,
        scoreDelta,
        correctionNote
      );

      if (res.success) {
        toast.success("Score updated successfully!");
        setSelectedParticipant(null);
        setCorrectionNote("");
        // Notify socket server to refresh states
        getSocket().emit("admin:trigger-score-sync", { sessionId: session.id });
        router.refresh();
      } else {
        toast.error(res.error || "Failed to adjust score");
      }
    });
  };

  const activeRound = session.rounds.find((r: any) => r.id === quizState?.currentRoundId) || session.rounds[0];

  return (
    <div className="space-y-6">
      {/* Session Controls Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-heading">
              Live Session: {session.name}
            </h1>
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-ping" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? "Connected to Socket Server" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Live Screens CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href={`/screen/${session.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Tv className="h-4 w-4 text-indigo-400" />
            Projector Screen
          </Link>
          <Link
            href={`/leaderboard/${session.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Tv className="h-4 w-4 text-purple-400" />
            Public Leaderboard
          </Link>
        </div>
      </div>

      {/* Control Panel state buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bg-black/20 border border-white/5 p-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Lobby Code</span>
            <span className="text-lg font-mono font-bold text-indigo-400 tracking-wider block px-2 mt-0.5">
              {session.accessCode}
            </span>
          </div>

          <div className="hidden sm:block">
            <span className="text-xs text-gray-500 block">Game Mode</span>
            <span className="text-sm font-semibold text-white">{session.quiz.mode} competition</span>
          </div>
        </div>

        {/* Session Status Actions */}
        <div className="flex items-center gap-3">
          {quizState?.status === "WAITING" && (
            <button
              onClick={handleStartSession}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
            >
              <Play className="h-4 w-4" />
              Start Competition
            </button>
          )}

          {quizState?.status === "ACTIVE" && (
            <button
              onClick={handlePauseSession}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-500"
            >
              <Pause className="h-4 w-4" />
              Pause Game
            </button>
          )}

          {quizState?.status === "PAUSED" && (
            <button
              onClick={handleResumeSession}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500"
            >
              <Play className="h-4 w-4" />
              Resume Game
            </button>
          )}

          {quizState?.status !== "COMPLETED" && quizState?.status !== "WAITING" && (
            <button
              onClick={handleEndSession}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600/15 border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
            >
              Finish Competition
            </button>
          )}

          {quizState?.status === "COMPLETED" && (
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest px-4 py-2 border border-white/5 rounded-xl bg-black/20">
              Quiz Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: control questions on left, participant listing on right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Live Controls, Active Question, and Buzzer logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Question panel */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Active Question Controller
            </h2>

            {quizState?.activeQuestion ? (
              <div className="space-y-4 bg-black/20 p-5 border border-white/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">
                    Live Question ({quizState.activeQuestion.type})
                  </span>
                  <div className="flex gap-2">
                    <span className="bg-white/5 px-2 py-0.5 rounded text-xs text-gray-400">
                      Points: {quizState.activeQuestion.points}
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-xs text-gray-400">
                      Timer: {quizState.activeQuestion.timeLimit}s
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white leading-relaxed">
                  {quizState.activeQuestion.text}
                </h3>

                {/* Show Choices */}
                {quizState.activeQuestion.options.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quizState.activeQuestion.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="bg-white/5 border border-white/5 px-4 py-2 rounded-lg text-sm text-gray-300"
                      >
                        {opt.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Controls for current question */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                  <button
                    onClick={handleShowAnswer}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Reveal Correct Answer
                  </button>

                  {activeRound?.type === "BUZZER" && (
                    <button
                      onClick={handleResetBuzzer}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 border border-white/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Buzzer
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-black/10 border border-dashed border-white/10 rounded-xl">
                <Play className="h-8 w-8 text-gray-600 mb-2 animate-bounce" />
                <p className="text-sm text-gray-400">No active question pushed to screen.</p>
                <p className="text-xs text-gray-500 mt-1">Select a question from the bank below to push.</p>
              </div>
            )}

            {/* Questions Bank list */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-sm font-semibold text-gray-300">Question Pool for this session:</h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {session.quiz.questions.map((q: any, idx: number) => {
                  const isCurrent = quizState?.activeQuestion?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all duration-200 ${
                        isCurrent
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                          : "bg-white/5 border-white/5 text-gray-300 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs text-gray-500">Q{idx + 1}</span>
                        <span className="truncate max-w-[280px]" title={q.text}>{q.text}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-white/10 px-1 rounded">
                          {q.type}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePushQuestion(q.id)}
                        disabled={isCurrent || quizState?.status !== "ACTIVE"}
                        className="inline-flex items-center gap-1 rounded bg-indigo-600/15 border border-indigo-500/30 px-2.5 py-1 text-xs text-indigo-400 hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:hover:bg-indigo-600/15 disabled:hover:text-indigo-400"
                      >
                        Push Question
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Buzzer log queues (Only displayed if current round is BUZZER) */}
          {activeRound?.type === "BUZZER" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-indigo-400 animate-pulse" />
                Live Buzzer Registration Queue
              </h2>

              {quizState?.buzzerQueue && quizState.buzzerQueue.length > 0 ? (
                <div className="space-y-2">
                  {quizState.buzzerQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3.5 border rounded-xl text-sm ${
                        item.status === "ACCEPTED"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : item.status === "REJECTED"
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-white/5 border-white/5 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono bg-white/10 px-2 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{item.displayName}</p>
                          {item.teamName && <p className="text-xs text-gray-500">{item.teamName}</p>}
                        </div>
                      </div>

                      {item.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveBuzzer(item.id, "ACCEPTED")}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Correct
                          </button>
                          <button
                            onClick={() => handleResolveBuzzer(item.id, "REJECTED")}
                            className="inline-flex items-center gap-1 rounded bg-red-600/10 border border-red-500/25 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                            Incorrect
                          </button>
                        </div>
                      )}

                      {item.status !== "PENDING" && (
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {item.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-black/10 border border-dashed border-white/10 rounded-xl">
                  <Volume2 className="h-6 w-6 text-gray-600 mb-1" />
                  <p className="text-xs text-gray-500">Wait for participants to press the buzzer...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: participants connected list and scoreboard */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-1.5">
              <Users className="h-5 w-5 text-indigo-400" />
              Contestants
            </h2>
            <span className="text-xs text-gray-400 font-semibold">
              {quizState?.participants.length || 0} active
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {quizState?.participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-black/20 border border-white/5 px-3 py-2 rounded-xl text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.isConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-600"
                      }`}
                    />
                    <p className="font-semibold text-white truncate" title={p.displayName}>
                      {p.displayName}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono">ID: {p.registrationNumber}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-indigo-400 text-base">
                    {p.score} pt
                  </span>

                  {/* Manual correction button */}
                  <button
                    onClick={() => {
                      setSelectedParticipant(p);
                      setScoreDelta(10);
                    }}
                    className="p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Manual correction"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {(!quizState || quizState.participants.length === 0) && (
              <div className="text-center py-8 text-xs text-gray-500">
                Lobby is empty. Distribute the access code to join.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Score Adjustment Overlay Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16162a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 font-heading">
              Adjust Score: {selectedParticipant.displayName}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter a positive or negative number to adjust the aggregate points score for this participant.
            </p>

            <div className="space-y-4">
              {/* Score Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Points Adjustment
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScoreDelta((prev) => prev - 5)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={scoreDelta}
                    onChange={(e) => setScoreDelta(parseInt(e.target.value) || 0)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-bold text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setScoreDelta((prev) => prev + 5)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reason / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Correct answer on pass"
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyScoreCorrection}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
