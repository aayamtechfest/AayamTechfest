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
  Layers,
  Zap,
  ChevronRight,
  Clock,
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
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Manual score correction modal states
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [scoreDelta, setScoreDelta] = useState(10);
  const [correctionNote, setCorrectionNote] = useState("");

  // Rapid Fire and Pass Round admin inputs
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");

  // Show used questions checkbox state
  const [showUsedQuestions, setShowUsedQuestions] = useState(false);

  // Rapid Fire config state
  const [rfTotalTime, setRfTotalTime] = useState(60);
  const [rfQuestionTime, setRfQuestionTime] = useState(10);
  const [rfPoints, setRfPoints] = useState(10);
  const [rfNegativeMarking, setRfNegativeMarking] = useState(false);

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
      setQuizState((prevState) => {
        if (prevState?.activeQuestion?.id !== state.activeQuestion?.id) {
          setIsAnswerRevealed(false);
        }
        return state;
      });
    });

    socket.on("reveal-answer", () => {
      setIsAnswerRevealed(true);
    });

    socket.on("error", (err: string) => {
      toast.error(err);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("state-sync");
      socket.off("reveal-answer");
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
        // Auto-activate first round
        if (session.rounds.length > 0) {
          handleStartRound(session.rounds[0].id);
        }
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
        toast.success("Round activated!");
        router.refresh();
      }
    });
  };

  const handleEndRound = (roundId: string) => {
    startTransition(async () => {
      const res = await updateRoundStatus(roundId, "COMPLETED");
      if (res.success) {
        getSocket().emit("admin:end-round", { sessionId: session.id, roundId });
        toast.success("Round completed!");
        router.refresh();
      }
    });
  };

  const handlePushQuestion = (questionId: string) => {
    getSocket().emit("admin:push-question", { sessionId: session.id, questionId });
    toast.success("Question pushed to projector and players!");
  };

  const handleShowAnswer = () => {
    getSocket().emit("admin:reveal-answer", { sessionId: session.id });
    toast.success("Correct answer revealed!");
  };

  // Buzzer Round Controls
  const handleOpenBuzzer = () => {
    getSocket().emit("admin:open-buzzer", { sessionId: session.id });
    toast.success("Buzzers are now open!");
  };

  const handleCloseBuzzer = () => {
    getSocket().emit("admin:close-buzzer", { sessionId: session.id });
    toast.success("Buzzers are closed.");
  };

  const handleResetBuzzer = () => {
    getSocket().emit("admin:reset-buzzer", { sessionId: session.id });
    toast.success("Buzzer queue reset!");
  };

  const handleResolveBuzzer = (buzzerEventId: string, status: "ACCEPTED" | "REJECTED") => {
    getSocket().emit("admin:resolve-buzzer", {
      sessionId: session.id,
      buzzerEventId,
      status,
    });
    toast.success(`Buzzer marked as ${status.toLowerCase()}!`);
  };

  // Rapid Fire controls
  const handleSetRapidFireTeam = () => {
    if (!selectedTeamId && !selectedParticipantId) {
      toast.error("Please select a team or participant first");
      return;
    }
    getSocket().emit("admin:set-rapid-fire-team", {
      sessionId: session.id,
      teamId: selectedTeamId,
      participantId: selectedParticipantId,
      config: {
        totalRoundTime: rfTotalTime,
        questionTimeLimit: rfQuestionTime,
        pointsPerQuestion: rfPoints,
        negativeMarking: rfNegativeMarking,
      }
    });
    toast.success("Rapid Fire team configured!");
  };

  const handleStartRapidFireTimer = () => {
    getSocket().emit("admin:start-rapid-fire-timer", { sessionId: session.id });
    toast.success("60s Rapid Fire timer started!");
  };

  const handleEvaluateRapidFire = (questionId: string, status: "CORRECT" | "WRONG" | "SKIP") => {
    getSocket().emit("admin:evaluate-rapid-fire", {
      sessionId: session.id,
      questionId,
      status,
    });
    toast.info(`Question marked as ${status}`);
  };

  // Pass Round controls
  const handleSetPassRoundTeam = () => {
    if (!selectedTeamId && !selectedParticipantId) {
      toast.error("Please select a team or participant first");
      return;
    }
    getSocket().emit("admin:set-pass-round-team", {
      sessionId: session.id,
      teamId: selectedTeamId,
      participantId: selectedParticipantId,
    });
    toast.success("Pass Round active team configured!");
  };

  const handleEvaluatePassRound = (questionId: string, status: "CORRECT" | "WRONG" | "PASS") => {
    // Determine next team in circular order
    let nextTId = "";
    if (quizState?.teams && quizState.teams.length > 0) {
      const currentIndex = quizState.teams.findIndex((t) => t.id === quizState.passRoundState?.activeTeamId);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % quizState.teams.length;
        nextTId = quizState.teams[nextIndex].id;
      } else {
        nextTId = quizState.teams[0].id;
      }
    }

    getSocket().emit("admin:evaluate-pass-round", {
      sessionId: session.id,
      questionId,
      status,
      nextTeamId: nextTId,
    });
    toast.info(`Evaluated: ${status}`);
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
        getSocket().emit("admin:trigger-score-sync", { sessionId: session.id });
        router.refresh();
      } else {
        toast.error(res.error || "Failed to adjust score");
      }
    });
  };

  // State mapping helper
  const activeRound = session.rounds.find((r: any) => r.id === quizState?.currentRoundId) || session.rounds[0];
  const templateRoundId = activeRound?.settings?.templateRoundId;

  // Load round settings into config state when round changes
  useEffect(() => {
    if (activeRound) {
      const settings = activeRound.settings as any;
      if (activeRound.type === "RAPID_FIRE") {
        if (settings && typeof settings.totalRoundTime === "number") {
          setRfTotalTime(settings.totalRoundTime);
        } else {
          setRfTotalTime(60);
        }
        if (settings && typeof settings.negativeMarking === "boolean") {
          setRfNegativeMarking(settings.negativeMarking);
        } else {
          setRfNegativeMarking(false);
        }
      }
      if (typeof activeRound.timeLimit === "number") {
        setRfQuestionTime(activeRound.timeLimit);
      }
      if (typeof activeRound.pointsPerQuestion === "number") {
        setRfPoints(activeRound.pointsPerQuestion);
      }
    }
  }, [activeRound]);

  // Filter questions that belong to the active round
  const roundQuestions = session.quiz.questions.filter((q: any) => {
    if (templateRoundId && q.templateRoundId !== templateRoundId) {
      return false;
    }
    if (!showUsedQuestions && q.usages && q.usages.length > 0) {
      return false;
    }
    return true;
  });

  const fullActiveQuestion = quizState?.activeQuestion
    ? session.quiz.questions.find((q: any) => q.id === quizState.activeQuestion?.id)
    : null;

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
              Host Panel: {session.name}
            </h1>
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-ping" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? "Connected to Server" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Live Screens CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href={`/screen/${session.accessCode}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-600 hover:text-white"
          >
            <Tv className="h-4 w-4 text-indigo-400" />
            Auditorium Projector (/screen/{session.accessCode})
          </Link>
          <Link
            href={`/leaderboard/${session.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Tv className="h-4 w-4 text-purple-400" />
            Live Leaderboard
          </Link>
        </div>
      </div>

      {/* Control Panel state buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bg-black/20 border border-white/5 p-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Lobby/Projection Code</span>
            <span className="text-lg font-mono font-bold text-indigo-400 tracking-wider block px-2 mt-0.5">
              {session.accessCode}
            </span>
          </div>

          <div className="hidden sm:block">
            <span className="text-xs text-gray-500 block">Round Strategy</span>
            <span className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
              {activeRound ? `${activeRound.title} (${activeRound.type === "MCQ" ? "Simultaneous" : activeRound.type})` : "General Round"}
            </span>
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

      {/* Main Grid: Control panel */}
      <div className="grid gap-6 lg:grid-cols-4">
        
        {/* Sidebar Left: Rounds tracker */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl space-y-4 h-fit">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
            <Layers className="h-4.5 w-4.5 text-indigo-400" />
            Tournament Rounds
          </h2>
          <div className="space-y-2">
            {session.rounds.map((r: any) => {
              const isActive = quizState?.currentRoundId === r.id;
              const isCompleted = r.status === "COMPLETED";

              return (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isActive
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-md shadow-indigo-500/5"
                      : "bg-black/25 border-white/5 text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="truncate">R{r.roundNumber}: {r.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isActive ? "bg-indigo-500/20 text-indigo-300" : isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-500"
                    }`}>
                      {isActive ? "Active" : isCompleted ? "Done" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                    Mode: {r.type === "MCQ" ? "Simultaneous" : r.type}
                  </p>

                  {quizState?.status === "ACTIVE" && !isActive && (
                    <button
                      onClick={() => handleStartRound(r.id)}
                      className="mt-2 w-full text-center font-bold bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white py-1 rounded border border-indigo-500/20 transition-all text-[10px] flex items-center justify-center gap-1"
                    >
                      Activate Round
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}

                  {isActive && !isCompleted && (
                    <button
                      onClick={() => handleEndRound(r.id)}
                      className="mt-2 w-full text-center font-bold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white py-1 rounded border border-emerald-500/20 transition-all text-[10px]"
                    >
                      Complete Round
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mid: Active Round Controller */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Active Question & Scoring controls */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Active Controller: {activeRound?.title}
            </h2>

            {/* Pushed Question box */}
            {quizState?.activeQuestion ? (
              <div className="space-y-4 bg-black/20 p-5 border border-white/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">
                    Pushed Question ({quizState.activeQuestion.type})
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

                <h3 className="text-base font-semibold text-white leading-relaxed">
                  {quizState.activeQuestion.text}
                </h3>

                {/* MCQ Options (Only displayed for Simultaneous Round) */}
                {activeRound?.type === "MCQ" && quizState.activeQuestion.options.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2 pt-2">
                    {quizState.activeQuestion.options.map((opt) => {
                      const fullOpt = fullActiveQuestion?.options.find((o: any) => o.id === opt.id);
                      const isCorrect = fullOpt?.isCorrect;

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center justify-between border px-4 py-2 rounded-lg text-sm ${
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold"
                              : "bg-white/5 border-white/5 text-gray-300"
                          }`}
                        >
                          <span>{opt.text}</span>
                          {isCorrect && (
                            <span className="text-[9px] uppercase font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400">
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Score Controls for MCQ (Reveal Correct) */}
                {activeRound?.type === "MCQ" && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    <button
                      onClick={handleShowAnswer}
                      disabled={isAnswerRevealed}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all ${
                        isAnswerRevealed
                          ? "bg-emerald-600/50 border border-emerald-500/20 text-emerald-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500"
                      }`}
                    >
                      {isAnswerRevealed ? "Answer Revealed" : "Reveal Correct Answer"}
                    </button>
                  </div>
                )}

                {/* Buzzer Round controller */}
                {activeRound?.type === "BUZZER" && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Buzzer Control Locks</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${quizState.buzzerOpen ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : "bg-red-500/20 text-red-400"}`}>
                        Buzzers: {quizState.buzzerOpen ? "Open" : "Locked"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleOpenBuzzer}
                        disabled={quizState.buzzerOpen}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg text-xs"
                      >
                        Open Buzzer
                      </button>
                      <button
                        onClick={handleCloseBuzzer}
                        disabled={!quizState.buzzerOpen}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg text-xs"
                      >
                        Lock/Close Buzzer
                      </button>
                      <button
                        onClick={handleResetBuzzer}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2 px-3 rounded-lg text-xs"
                      >
                        Clear/Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* Standardized Turn / Pass Controller */}
                {activeRound?.type !== "MCQ" && activeRound?.type !== "RAPID_FIRE" && activeRound?.type !== "BUZZER" && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Question Turn Controls</span>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded">
                        Active Turn: {quizState.passRoundState?.activeTeamId ? quizState.teams.find(t => t.id === quizState.passRoundState?.activeTeamId)?.name : "None"} 
                        {quizState.passRoundState?.passCount && quizState.passRoundState.passCount > 0 ? ` (Passed x${quizState.passRoundState.passCount})` : ""}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEvaluatePassRound(quizState.activeQuestion!.id, "CORRECT")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Correct
                      </button>
                      <button
                        onClick={() => handleEvaluatePassRound(quizState.activeQuestion!.id, "WRONG")}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Wrong / No Points
                      </button>
                      <button
                        onClick={() => handleEvaluatePassRound(quizState.activeQuestion!.id, "PASS")}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Pass Turn
                      </button>
                    </div>

                    {/* Set turn if not set */}
                    {(!quizState.passRoundState || !quizState.passRoundState.activeTeamId) && (
                      <div className="flex flex-col gap-2 sm:flex-row mt-2">
                        <select
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="flex-1 rounded-lg border border-white/10 bg-[#121225] px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Set Active Turn Team --</option>
                          {quizState?.teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleSetPassRoundTeam}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs"
                        >
                          Set Turn
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-black/10 border border-dashed border-white/10 rounded-xl">
                <Zap className="h-8 w-8 text-gray-600 mb-2 animate-pulse" />
                <p className="text-sm text-gray-400">Question is currently hidden from screen.</p>
                <p className="text-xs text-gray-500 mt-1">Select a question from the list below to push.</p>
              </div>
            )}

            {/* Rapid Fire Config & Ticker (Only for Rapid Fire Round) */}
            {activeRound?.type === "RAPID_FIRE" && (
              <div className="bg-black/35 p-5 border border-white/5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-300 flex items-center gap-1.5">
                    <Flame className="h-4.5 w-4.5 text-amber-500" />
                    Rapid Fire Active Console
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${quizState?.rapidFireState?.isRunning ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/5 text-gray-500"}`}>
                    Timer: {quizState?.rapidFireState?.timeLeft || 60}s
                  </span>
                </div>

                {/* Rapid Fire Configuration Inputs */}
                {(!quizState?.rapidFireState || !quizState.rapidFireState.isRunning) && (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Total Time (s)</label>
                      <input
                        type="number"
                        value={rfTotalTime}
                        onChange={(e) => setRfTotalTime(Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-[#121225] px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Q Limit (s)</label>
                      <input
                        type="number"
                        value={rfQuestionTime}
                        onChange={(e) => setRfQuestionTime(Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-[#121225] px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Points/Q</label>
                      <input
                        type="number"
                        value={rfPoints}
                        onChange={(e) => setRfPoints(Number(e.target.value))}
                        className="w-full rounded-lg border border-white/10 bg-[#121225] px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col justify-end pb-1">
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={rfNegativeMarking}
                          onChange={(e) => setRfNegativeMarking(e.target.checked)}
                          className="rounded border-white/10 bg-[#121225] text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Negative Mark
                      </label>
                    </div>
                  </div>
                )}

                 {/* Team / Participant selection */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {session.quiz.mode === "TEAM" ? (
                    <select
                      value={selectedTeamId}
                      onChange={(e) => {
                        setSelectedTeamId(e.target.value);
                        setSelectedParticipantId("");
                      }}
                      className="flex-1 rounded-xl border border-white/10 bg-[#121225] px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Active Team --</option>
                      {quizState?.teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedParticipantId}
                      onChange={(e) => {
                        setSelectedParticipantId(e.target.value);
                        setSelectedTeamId("");
                      }}
                      className="flex-1 rounded-xl border border-white/10 bg-[#121225] px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Active Participant --</option>
                      {quizState?.participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName} ({p.registrationNumber || "Solo"})
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={handleSetRapidFireTeam}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs"
                  >
                    Configure Team
                  </button>

                  {quizState?.rapidFireState && !quizState.rapidFireState.isRunning && (
                    <button
                      onClick={handleStartRapidFireTimer}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Start Timer
                    </button>
                  )}
                </div>

                {quizState?.rapidFireState && (
                  <div className="border-t border-white/5 pt-3 space-y-2 text-xs">
                    <p className="text-gray-400 font-semibold">
                      Playing: <span className="text-white font-bold">
                        {quizState.rapidFireState?.activeTeamId 
                          ? (quizState.teams.find(t => t.id === quizState.rapidFireState?.activeTeamId)?.name)
                          : (quizState.rapidFireState?.activeParticipantId 
                              ? (quizState.participants.find(p => p.id === quizState.rapidFireState?.activeParticipantId)?.displayName)
                              : "Not Set")}
                      </span>
                    </p>
                    <p className="text-gray-500">
                      Currently at Question #{quizState.rapidFireState.questionIndex + 1}
                    </p>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div className="bg-white/5 border border-white/5 p-2 rounded-lg text-center">
                        <span className="text-[9px] text-gray-500 uppercase block">Attempted</span>
                        <span className="text-sm font-bold text-white">{quizState.rapidFireState.stats?.attempted || 0}</span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/10 p-2 rounded-lg text-center">
                        <span className="text-[9px] text-emerald-500/50 uppercase block">Correct</span>
                        <span className="text-sm font-bold text-emerald-400">{quizState.rapidFireState.stats?.correct || 0}</span>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/10 p-2 rounded-lg text-center">
                        <span className="text-[9px] text-red-500/50 uppercase block">Wrong</span>
                        <span className="text-sm font-bold text-red-400">{quizState.rapidFireState.stats?.wrong || 0}</span>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/10 p-2 rounded-lg text-center">
                        <span className="text-[9px] text-indigo-500/50 uppercase block">Score</span>
                        <span className="text-sm font-bold text-indigo-400">{quizState.rapidFireState.stats?.score || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Turn Setup for non-MCQ / non-Rapid Fire rounds when no active question */}
            {activeRound?.type !== "MCQ" && activeRound?.type !== "RAPID_FIRE" && activeRound?.type !== "BUZZER" && !quizState?.activeQuestion && (
              <div className="bg-black/35 p-5 border border-white/5 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-gray-300">Active Turn Setup</h3>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-[#121225] px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Turn Team --</option>
                    {quizState?.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSetPassRoundTeam}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs"
                  >
                    Set Turn
                  </button>
                </div>
              </div>
            )}

            {/* Round Questions list */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Round Question Pool:</h3>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={showUsedQuestions}
                    onChange={(e) => setShowUsedQuestions(e.target.checked)}
                    className="rounded border-white/10 bg-[#121225] text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  Show Used Questions
                </label>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {roundQuestions.map((q: any, idx: number) => {
                  const isCurrent = quizState?.activeQuestion?.id === q.id;
                  
                  // Rapid fire evaluation helper
                  const isRapidFirePlaying = activeRound?.type === "RAPID_FIRE" && quizState?.rapidFireState?.isRunning;
                  const isRfActiveQuestion = quizState?.rapidFireState?.questionIndex === idx;

                  return (
                    <div
                      key={q.id}
                      className={`flex flex-col gap-3 p-3 rounded-xl border text-sm transition-all duration-200 ${
                        isCurrent || (isRapidFirePlaying && isRfActiveQuestion)
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-semibold"
                          : "bg-white/5 border-white/5 text-gray-300 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-xs text-gray-500">Q{idx + 1}</span>
                          <span className="truncate max-w-[200px]" title={q.text}>{q.text}</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-white/10 px-1 rounded">
                            {q.type}
                          </span>
                        </div>

                        {!isRapidFirePlaying ? (
                          <button
                            onClick={() => handlePushQuestion(q.id)}
                            disabled={isCurrent || quizState?.status !== "ACTIVE"}
                            className="inline-flex items-center gap-1 rounded bg-indigo-600/15 border border-indigo-500/30 px-2.5 py-1 text-[11px] text-indigo-400 hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:hover:bg-indigo-600/15 disabled:hover:text-indigo-400"
                          >
                            Push Screen
                          </button>
                        ) : (
                          isRfActiveQuestion && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEvaluateRapidFire(q.id, "CORRECT")}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-1 rounded"
                                title="Correct"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEvaluateRapidFire(q.id, "WRONG")}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold p-1 rounded"
                                title="Wrong"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEvaluateRapidFire(q.id, "SKIP")}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white p-1 rounded"
                                title="Skip"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}

                {roundQuestions.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-500">
                    No questions are assigned to this round.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buzzer log queues (Only displayed if current round is BUZZER) */}
          {activeRound?.type === "BUZZER" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                <Volume2 className="h-5 w-5 text-indigo-400 animate-pulse" />
                Live Buzzer Registration Queue
              </h2>

              {quizState?.buzzerQueue && quizState.buzzerQueue.length > 0 ? (
                <div className="space-y-2">
                  {quizState.buzzerQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 border rounded-xl text-sm ${
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
                          <p className="font-semibold text-white">{item.displayName}</p>
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
                  <p className="text-xs text-gray-500">Wait for contestants to buzz...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Right: contestants scoreboard */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-indigo-400" />
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
                  <span className="font-mono font-bold text-indigo-400 text-sm">
                    {p.score} pt
                  </span>

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
                Lobby is empty. Distribute code.
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
              Enter points offset to apply manual correction.
            </p>

            <div className="space-y-4">
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reason / Note
                </label>
                <input
                  type="text"
                  placeholder="Reason for change..."
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>

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
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
