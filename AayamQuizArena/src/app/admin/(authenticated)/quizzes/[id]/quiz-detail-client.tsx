"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSchema, QuestionInput } from "@/schemas/question.schema";
import { createQuestion, updateQuestion, deleteQuestion } from "@/actions/question.actions";
import { deleteQuiz } from "@/actions/quiz.actions";
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
} from "lucide-react";

interface QuizDetailClientProps {
  quiz: any;
  events: { id: string; name: string }[];
}

export function QuizDetailClient({ quiz, events }: QuizDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "settings">("overview");
  const [isPending, startTransition] = useTransition();

  // Questions tab states
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

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
    startTransition(async () => {
      let res;
      if (editingQuestion) {
        res = await updateQuestion(editingQuestion.id, data);
      } else {
        res = await createQuestion(quiz.id, data);
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

  // Quick launch session helper
  const handleLaunchSession = async () => {
    try {
      // Import createSession action dynamically or use a server action.
      // Let's implement session launch inside session actions and call it.
      // For now, redirect to sessions section to spawn
      router.push(`/admin/sessions?createFromQuiz=${quiz.id}`);
    } catch (err) {
      toast.error("Failed to launch lobby");
    }
  };

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
              {quiz.name}
            </h1>
            <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {quiz.mode}
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:brightness-110 hover:shadow-emerald-500/40"
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

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex gap-6">
          {(["overview", "questions", "settings"] as const).map((tab) => (
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
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Questions Loaded</span>
                  <span className="text-md font-bold text-white block mt-1">{quiz.questions.length} Questions</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Publishing Status</span>
                  <span className="text-md font-bold text-white block mt-1">{quiz.status}</span>
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
                <li>Load questions with correct choices.</li>
                <li>Launch the Live Lobby and prompt projector view.</li>
                <li>Wait for contestants to join before pushing the first MCQ.</li>
                <li>Ensure the Socket.IO server is active on port 3001!</li>
              </ul>
            </div>
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

                <div className="grid gap-6 sm:grid-cols-3">
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
              <button
                onClick={handleOpenAddQuestion}
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 border border-white/10"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>
          )}

          {/* Questions list */}
          <div className="space-y-3">
            {quiz.questions.map((q: any, idx: number) => {
              const isExpanded = expandedQuestionId === q.id;
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
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-white truncate max-w-lg">
                        {q.text}
                      </p>
                      <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                        {q.type}
                      </span>
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
                    </div>
                  )}
                </div>
              );
            })}

            {quiz.questions.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl text-center">
                <HelpCircle className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">This quiz doesn&apos;t have any questions yet.</p>
                <button
                  onClick={handleOpenAddQuestion}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-1"
                >
                  Click here to add one.
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <QuizFormClient events={events} initialData={quiz} />
      )}
    </div>
  );
}
