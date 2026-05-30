"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionInput } from "@/schemas/question.schema";
import { createQuestion, updateQuestion, deleteQuestion, importQuestions } from "@/actions/question.actions";
import { deleteQuiz, updateQuizStatus } from "@/actions/quiz.actions";
import { createTemplateRound, updateTemplateRound, deleteTemplateRound } from "@/actions/round.actions";
import { QuizFormClient } from "../new/quiz-form-client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  HelpCircle,
  Play,
  Plus,
  Trash,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  Layers,
  Sparkles,
  FileJson,
  Upload,
  Check,
  Archive,
  FilePen,
  Lock,
  ShieldAlert,
} from "lucide-react";

interface QuizDetailClientProps {
  quiz: any;
  events: { id: string; name: string }[];
}

const quizStatusConfig = {
  DRAFT: {
    label: "Draft",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: FilePen,
    description: "This quiz is in draft mode. You can edit everything freely. Publish when ready.",
  },
  PUBLISHED: {
    label: "Published",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: Check,
    description: "This quiz is live and can be used to create sessions.",
  },
  ARCHIVED: {
    label: "Archived",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: Archive,
    description: "This quiz is archived. It is read-only and cannot be used for new sessions.",
  },
} as const;

export function QuizDetailClient({ quiz, events }: QuizDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "rounds" | "questions" | "settings">("overview");
  const isArchived = quiz.status === "ARCHIVED";
  const isPublished = quiz.status === "PUBLISHED";
  const statusInfo = quizStatusConfig[quiz.status as keyof typeof quizStatusConfig] || quizStatusConfig.DRAFT;
  const [isPending, startTransition] = useTransition();

  // Questions tab states
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Rounds tab states
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [editingRound, setEditingRound] = useState<any | null>(null);
  const [roundNumberInput, setRoundNumberInput] = useState(1);
  const [roundTitleInput, setRoundTitleInput] = useState("");
  const [roundTypeInput, setRoundTypeInput] = useState<any>("MCQ");
  const [roundTimeLimitInput, setRoundTimeLimitInput] = useState(30);
  const [roundPointsInput, setRoundPointsInput] = useState(10);
  const [roundTotalTimeInput, setRoundTotalTimeInput] = useState(60);
  const [roundNegativeMarkingInput, setRoundNegativeMarkingInput] = useState(false);

  // JSON Import States
  const [showJsonImportModal, setShowJsonImportModal] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  // Question Form Setup
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: "",
      type: "MCQ",
      mediaUrl: "",
      timeLimit: 30,
      points: 10,
      explanation: "",
      templateRoundId: "",
      options: [
        { text: "", isCorrect: false, sortOrder: 0 },
        { text: "", isCorrect: false, sortOrder: 1 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const questionType = watch("type");

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    reset({
      text: "",
      type: "MCQ",
      mediaUrl: "",
      timeLimit: 30,
      points: 10,
      explanation: "",
      templateRoundId: quiz.templateRounds?.[0]?.id || "",
      options: [
        { text: "Option A", isCorrect: true, sortOrder: 0 },
        { text: "Option B", isCorrect: false, sortOrder: 1 },
        { text: "Option C", isCorrect: false, sortOrder: 2 },
        { text: "Option D", isCorrect: false, sortOrder: 3 },
      ],
    });
    setShowQuestionForm(true);
  };

  const handleOpenEditQuestion = (q: any) => {
    setEditingQuestion(q);
    reset({
      text: q.text,
      type: q.type,
      mediaUrl: q.mediaUrl || "",
      timeLimit: q.timeLimit ?? 30,
      points: q.points ?? 10,
      explanation: q.explanation || "",
      templateRoundId: q.templateRoundId || "",
      options: q.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        sortOrder: opt.sortOrder,
      })),
    });
    setShowQuestionForm(true);
  };

  const onQuestionSubmit = async (data: QuestionInput) => {
    // Convert empty templateRoundId to null
    const cleanedData = {
      ...data,
      templateRoundId: data.templateRoundId || null,
    };

    startTransition(async () => {
      let res;
      if (editingQuestion) {
        res = await updateQuestion(editingQuestion.id, cleanedData);
      } else {
        res = await createQuestion(quiz.id, cleanedData);
      }

      if (res.success) {
        toast.success(editingQuestion ? "Question updated!" : "Question added!");
        setShowQuestionForm(false);
        setEditingQuestion(null);
        router.refresh();
      } else {
        toast.error(res.error || "Something went wrong");
      }
    });
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    startTransition(async () => {
      const res = await deleteQuestion(qId);
      if (res.success) {
        toast.success("Question deleted!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete question");
      }
    });
  };

  const handleDeleteQuiz = async () => {
    if (!confirm("CRITICAL: Delete this quiz, its questions, and database structure? This is irreversible.")) return;
    startTransition(async () => {
      const res = await deleteQuiz(quiz.id);
      if (res.success) {
        toast.success("Quiz deleted successfully!");
        router.push("/admin/quizzes");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete quiz");
      }
    });
  };

  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  const handleLaunchSession = async () => {
    if (!isPublished) {
      toast.error("You must publish this quiz before launching a live session.");
      return;
    }
    router.push(`/admin/sessions?createFromQuiz=${quiz.id}`);
  };

  const handleStatusChange = async (newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    if (newStatus === quiz.status) return;

    if (newStatus === "PUBLISHED" && quiz.questions.length === 0) {
      toast.error("Cannot publish a quiz with no questions. Add questions first.");
      return;
    }

    if (newStatus === "ARCHIVED") {
      if (!confirm("Archive this quiz? It will become read-only and you won't be able to create new sessions from it.")) return;
    }

    startTransition(async () => {
      const res = await updateQuizStatus(quiz.id, newStatus);
      if (res.success) {
        toast.success(`Quiz status changed to ${newStatus.toLowerCase()}.`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  // Rounds Handler
  const handleOpenAddRound = () => {
    setEditingRound(null);
    setRoundNumberInput((quiz.templateRounds?.length || 0) + 1);
    setRoundTitleInput("");
    setRoundTypeInput("MCQ");
    setRoundTimeLimitInput(30);
    setRoundPointsInput(10);
    setRoundTotalTimeInput(60);
    setRoundNegativeMarkingInput(false);
    setShowRoundForm(true);
  };

  const handleOpenEditRound = (r: any) => {
    setEditingRound(r);
    setRoundNumberInput(r.roundNumber);
    setRoundTitleInput(r.title);
    setRoundTypeInput(r.type);
    setRoundTimeLimitInput(r.timeLimit);
    setRoundPointsInput(r.pointsPerQuestion);
    const settings = r.settings as any;
    setRoundTotalTimeInput(settings?.totalRoundTime || 60);
    setRoundNegativeMarkingInput(!!settings?.negativeMarking);
    setShowRoundForm(true);
  };

  const handleRoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let res;
      const data = {
        roundNumber: roundNumberInput,
        title: roundTitleInput,
        type: roundTypeInput,
        timeLimit: roundTimeLimitInput,
        pointsPerQuestion: roundPointsInput,
        settings: roundTypeInput === "RAPID_FIRE" ? {
          totalRoundTime: roundTotalTimeInput,
          negativeMarking: roundNegativeMarkingInput,
        } : {},
      };

      if (editingRound) {
        res = await updateTemplateRound(editingRound.id, data);
      } else {
        res = await createTemplateRound(quiz.id, data);
      }

      if (res.success) {
        toast.success(editingRound ? "Round updated!" : "Round added!");
        setShowRoundForm(false);
        setEditingRound(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save round");
      }
    });
  };

  const handleDeleteRound = async (rId: string) => {
    if (!confirm("Are you sure you want to delete this round? Questions assigned to it will be unassigned.")) return;
    startTransition(async () => {
      const res = await deleteTemplateRound(rId);
      if (res.success) {
        toast.success("Round deleted!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete round");
      }
    });
  };

  // JSON Import Handler
  const handleImportJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedData;
      if (jsonFile) {
        const text = await jsonFile.text();
        parsedData = JSON.parse(text);
      } else {
        if (!jsonText.trim()) {
          toast.error("Please paste some JSON data first");
          return;
        }
        parsedData = JSON.parse(jsonText);
      }

      startTransition(async () => {
        const res = await importQuestions(quiz.id, parsedData);
        if (res.success) {
          toast.success(`Imported ${res.data?.count} questions successfully!`);
          setShowJsonImportModal(false);
          setJsonText("");
          setJsonFile(null);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to import questions");
        }
      });
    } catch (err: any) {
      toast.error(`Invalid JSON: ${err.message}`);
    }
  };

  const sampleJsonTemplate = `[
  {
    "text": "Identify the primary programming language of Next.js.",
    "type": "MCQ",
    "timeLimit": 20,
    "points": 10,
    "explanation": "TypeScript/JavaScript are used for Next.js applications.",
    "roundNumber": 1,
    "roundTitle": "Simultaneous Answer",
    "roundType": "MCQ",
    "options": [
      { "text": "TypeScript", "isCorrect": true },
      { "text": "Python", "isCorrect": false },
      { "text": "C++", "isCorrect": false },
      { "text": "Go", "isCorrect": false }
    ]
  },
  {
    "text": "Which of the following is a client-side React Hook?",
    "type": "MCQ",
    "timeLimit": 15,
    "points": 10,
    "roundNumber": 2,
    "roundTitle": "Buzzer Round",
    "roundType": "BUZZER",
    "options": [
      { "text": "useState", "isCorrect": true },
      { "text": "useServerAction", "isCorrect": false },
      { "text": "fs.readFile", "isCorrect": false }
    ]
  },
  {
    "text": "React 19 was released in 2024.",
    "type": "TRUE_FALSE",
    "timeLimit": 15,
    "points": 10,
    "roundNumber": 2,
    "roundTitle": "Buzzer Round",
    "roundType": "BUZZER",
    "options": [
      { "text": "True", "isCorrect": true },
      { "text": "False", "isCorrect": false }
    ]
  },
  {
    "text": "Is HTTP/3 based on UDP?",
    "type": "TRUE_FALSE",
    "timeLimit": 10,
    "points": 10,
    "roundNumber": 3,
    "roundTitle": "Rapid Fire Round",
    "roundType": "RAPID_FIRE",
    "options": [
      { "text": "True", "isCorrect": true },
      { "text": "False", "isCorrect": false }
    ]
  }
]`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <Link
            href="/admin/quizzes"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
              {quiz.name}
            </h1>
            <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {quiz.mode}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
              <statusInfo.icon className="h-3 w-3" />
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {quiz.description || "No description provided."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleLaunchSession}
            title={!isPublished ? "Publish the quiz to launch sessions" : "Launch a live session"}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 ${
              isPublished
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25 hover:brightness-110 hover:shadow-emerald-500/40"
                : "bg-gray-700 hover:bg-gray-600 shadow-none cursor-pointer opacity-70 hover:opacity-100"
            }`}
          >
            <Play className="h-4 w-4" />
            Launch Live Lobby
          </button>
          <button
            onClick={handleDeleteQuiz}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:border-red-500/45"
          >
            <Trash className="h-4 w-4" />
            Delete Quiz
          </button>
        </div>
      </div>

      {/* Status Management Bar */}
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 ${statusInfo.color.replace('text-', 'border-').split(' ')[2] || 'border-white/10'} bg-white/5 backdrop-blur-xl`}>
        <div className="flex items-center gap-2 text-sm">
          <statusInfo.icon className={`h-4 w-4 ${statusInfo.color.split(' ')[1]}`} />
          <span className="text-gray-300">{statusInfo.description}</span>
        </div>
        <div className="flex gap-2">
          {quiz.status !== "DRAFT" && (
            <button
              onClick={() => handleStatusChange("DRAFT")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
            >
              <FilePen className="h-3.5 w-3.5" />
              Revert to Draft
            </button>
          )}
          {quiz.status !== "PUBLISHED" && (
            <button
              onClick={() => handleStatusChange("PUBLISHED")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Publish
            </button>
          )}
          {quiz.status !== "ARCHIVED" && (
            <button
              onClick={() => handleStatusChange("ARCHIVED")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex gap-6">
          {(["overview", "rounds", "questions", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-lg font-bold text-white font-heading">Quiz Specifications</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Competition Mode</span>
                  <span className="text-md font-bold text-white block mt-1">{quiz.mode === "SOLO" ? "Individual (Solo)" : "Team Play"}</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Rounds Configured</span>
                  <span className="text-md font-bold text-white block mt-1">{quiz.templateRounds?.length || 0} Rounds</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Questions Loaded</span>
                  <span className="text-md font-bold text-white block mt-1">{quiz.questions.length} Questions</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Associated Event</span>
                  <span className="text-md font-bold text-white block mt-1 truncate">{quiz.event?.name || "None (Standalone)"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats / Tips */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-md font-bold text-indigo-400 flex items-center gap-1.5 font-heading">
                <Sparkles className="h-4 w-4" />
                Live Hosting Instructions
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-2">
                To run a successful game show:
              </p>
              <ul className="list-disc pl-4 text-xs text-gray-400 space-y-1.5 mt-2">
                <li>Load questions into rounds using the Round Builder.</li>
                <li>Publish the quiz when ready.</li>
                <li>Launch the Live Lobby and open the Projector view.</li>
                <li>Round types: Simultaneous, Buzzer, or Pass Round.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Rounds Tab */}
      {activeTab === "rounds" && (
        <div className="space-y-6">
          {showRoundForm ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-heading">
                  {editingRound ? "Edit Round" : "Add Quiz Round"}
                </h3>
                <button
                  onClick={() => setShowRoundForm(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleRoundSubmit} className="space-y-5">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Round Number</label>
                    <input
                      type="number"
                      required
                      value={roundNumberInput}
                      onChange={(e) => setRoundNumberInput(parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Round Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Round 1: Buzzer Madness"
                      value={roundTitleInput}
                      onChange={(e) => setRoundTitleInput(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Round Type</label>
                    <select
                      value={roundTypeInput}
                      onChange={(e) => setRoundTypeInput(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="MCQ">Simultaneous Answer</option>
                      <option value="BUZZER">Buzzer Round</option>
                      <option value="RAPID_FIRE">Rapid Fire Round</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Time Limit per Question (secs)</label>
                    <input
                      type="number"
                      required
                      value={roundTimeLimitInput}
                      onChange={(e) => setRoundTimeLimitInput(parseInt(e.target.value) || 30)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Points per Question</label>
                    <input
                      type="number"
                      required
                      value={roundPointsInput}
                      onChange={(e) => setRoundPointsInput(parseInt(e.target.value) || 10)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {roundTypeInput === "RAPID_FIRE" && (
                  <div className="grid gap-6 sm:grid-cols-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-300">Total Round Time (secs)</label>
                      <input
                        type="number"
                        required
                        value={roundTotalTimeInput}
                        onChange={(e) => setRoundTotalTimeInput(parseInt(e.target.value) || 60)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center h-full pt-6">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roundNegativeMarkingInput}
                          onChange={(e) => setRoundNegativeMarkingInput(e.target.checked)}
                          className="rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Enable Negative Marking (-Points/Q on wrong answer)
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Round
                </button>
              </form>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white font-heading">
                Rounds Configuration ({quiz.templateRounds?.length || 0} rounds)
              </h2>
              {!isArchived && (
                <button
                  onClick={handleOpenAddRound}
                  className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 border border-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Round
                </button>
              )}
            </div>
          )}

          {/* List of rounds */}
          <div className="grid gap-4">
            {quiz.templateRounds?.map((r: any) => {
              const questionCount = quiz.questions.filter((q: any) => q.templateRoundId === r.id).length;
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl hover:border-white/15 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold">
                        Round {r.roundNumber}
                      </span>
                      <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase">
                        {r.type === "MCQ" ? "Simultaneous MCQ" : r.type === "RAPID_FIRE" ? "Rapid Fire Round" : r.type}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-relaxed font-heading">
                      {r.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {questionCount} Questions &bull; {r.timeLimit}s time limit &bull; {r.pointsPerQuestion} base points
                    </p>
                  </div>

                  {!isArchived && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditRound(r)}
                        className="p-2 rounded bg-white/5 border border-white/10 hover:text-indigo-400 transition-colors"
                        title="Edit Round"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRound(r.id)}
                        className="p-2 rounded bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Round"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {(!quiz.templateRounds || quiz.templateRounds.length === 0) && (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl text-center">
                <Layers className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">No rounds are defined yet. Standard flow runs on default single round.</p>
                {!isArchived && (
                  <button
                    onClick={handleOpenAddRound}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-1"
                  >
                    Create Round 1
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "questions" && (
        <div className="space-y-6">
          {/* Question Form */}
          {showQuestionForm ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-heading">
                  {editingQuestion ? "Edit Question" : "Add Question to Pool"}
                </h3>
                <button
                  onClick={() => setShowQuestionForm(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit(onQuestionSubmit)} className="space-y-5">
                {/* Text */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Question Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter question text..."
                    {...register("text")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                  />
                  {errors.text && <p className="text-xs text-red-400">{errors.text.message}</p>}
                </div>

                <div className="grid gap-6 sm:grid-cols-4">
                  {/* Round Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Quiz Round</label>
                    <select
                      {...register("templateRoundId")}
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="">Unassigned / General</option>
                      {quiz.templateRounds?.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          R{r.roundNumber}: {r.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Question Type</label>
                    <select
                      {...register("type")}
                      className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="MCQ">Multiple Choice (MCQ)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="NUMERIC">Numerical Answer</option>
                      <option value="TEXT">Short text response</option>
                    </select>
                  </div>

                  {/* Time limit */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Time Limit (secs)</label>
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      {...register("timeLimit", { valueAsNumber: true })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Points */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Base Points</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      {...register("points", { valueAsNumber: true })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Explanation (shown after timer finishes)</label>
                  <textarea
                    rows={2}
                    placeholder="Provide context or explanation for the correct answer..."
                    {...register("explanation")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Options Panel (Only relevant for MCQ / TRUE_FALSE) */}
                {(questionType === "MCQ" || questionType === "TRUE_FALSE") && (
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">Choices / Options</h4>
                      {questionType === "MCQ" && (
                        <button
                          type="button"
                          onClick={() => append({ text: "", isCorrect: false, sortOrder: fields.length })}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          <Plus className="h-3 w-3" />
                          Add Option
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">
                          <input
                             type="checkbox"
                             {...register(`options.${index}.isCorrect`)}
                             className="h-4 w-4 rounded border-white/15 bg-white/5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Option ${index + 1}`}
                            {...register(`options.${index}.text`)}
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                          />
                          {questionType === "MCQ" && fields.length > 2 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Question
                </button>
              </form>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white font-heading">
                Question Bank ({quiz.questions.length} items)
              </h2>
              {!isArchived && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowJsonImportModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/25 bg-indigo-500/5 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <FileJson className="h-4 w-4" />
                    Import JSON
                  </button>
                  <button
                    onClick={handleOpenAddQuestion}
                    className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 border border-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </button>
                </div>
              )}
              {isArchived && (
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <Lock className="h-3.5 w-3.5" />
                  Read-only (Archived)
                </div>
              )}
            </div>
          )}

          {/* Questions list */}
          <div className="space-y-3">
            {quiz.questions.map((q: any, idx: number) => {
              const isExpanded = expandedQuestionId === q.id;
              const belongsToRound = quiz.templateRounds?.find((r: any) => r.id === q.templateRoundId);

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all duration-200 hover:border-indigo-500/20"
                >
                  {/* Collapsed Header */}
                  <div
                    onClick={() => toggleExpandQuestion(q.id)}
                    className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-wrap">
                      <span className="font-mono text-xs text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-white truncate max-w-[250px] sm:max-w-lg">
                        {q.text}
                      </p>
                      <div className="flex gap-1.5">
                        <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                          {q.type}
                        </span>
                        {belongsToRound && (
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                            R{belongsToRound.roundNumber}: {belongsToRound.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="hidden sm:flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{q.timeLimit || 30}s</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        <span>{q.points || 10} pts</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Expanded choices */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-black/20 p-5 space-y-4">
                      {/* Option details */}
                      {(q.type === "MCQ" || q.type === "TRUE_FALSE") && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Options / Choices:</h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt: any) => (
                              <div
                                key={opt.id}
                                className={`flex items-center justify-between border px-4 py-2.5 rounded-lg text-sm ${
                                  opt.isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                    : "bg-white/5 border-white/5 text-gray-300"
                                }`}
                              >
                                <span>{opt.text}</span>
                                {opt.isCorrect && (
                                  <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                    Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Explanation:</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}

                      {/* Question controls */}
                      {!isArchived && (
                        <div className="flex gap-2 justify-end border-t border-white/5 pt-3">
                          <button
                            onClick={() => handleOpenEditQuestion(q)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit Question
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                          >
                            <Trash className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {quiz.questions.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl text-center">
                <HelpCircle className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">This quiz doesn&apos;t have any questions yet.</p>
                {!isArchived && (
                  <button
                    onClick={handleOpenAddQuestion}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-1"
                  >
                    Click here to add one.
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <QuizFormClient events={events} initialData={quiz} />
      )}

      {/* JSON Import Modal */}
      {showJsonImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f0f23] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <FileJson className="h-5 w-5 text-indigo-400" />
                Bulk Question JSON Import
              </h3>
              <button
                onClick={() => {
                  setShowJsonImportModal(false);
                  setJsonText("");
                  setJsonFile(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleImportJsonSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* JSON Input Area */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Paste JSON Array
                    </label>
                    <textarea
                      rows={12}
                      placeholder="Paste JSON structure here..."
                      value={jsonText}
                      onChange={(e) => {
                        setJsonText(e.target.value);
                        setJsonFile(null);
                      }}
                      className="w-full font-mono text-xs rounded-xl border border-white/10 bg-black/30 p-3 text-white placeholder-gray-600 outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-white/5" />
                    <span className="text-xs text-gray-500 font-semibold uppercase">Or</span>
                    <div className="flex-1 border-t border-white/5" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 cursor-pointer rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-center hover:bg-white/[0.08] transition-colors">
                      <Upload className="h-5 w-5 text-gray-400 mx-auto" />
                      <span className="text-xs font-medium text-gray-300 block">
                        {jsonFile ? jsonFile.name : "Upload .json question file"}
                      </span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setJsonFile(e.target.files[0]);
                            setJsonText("");
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Example Template Area */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Template Format Example
                  </span>
                  <p className="text-[11px] text-gray-400">
                    Your JSON must be a list (array) of question objects. Specifying `roundNumber` will auto-create and link that question to the round.
                  </p>
                  <pre className="w-full font-mono text-[9px] leading-tight text-indigo-300 bg-indigo-950/20 border border-indigo-500/10 p-3.5 rounded-xl overflow-x-auto max-h-[300px]">
                    {sampleJsonTemplate}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowJsonImportModal(false);
                    setJsonText("");
                    setJsonFile(null);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Importing..." : "Start Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
