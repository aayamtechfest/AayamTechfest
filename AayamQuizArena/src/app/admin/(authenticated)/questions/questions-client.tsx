"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { HelpCircle, BookOpen, Clock, Award, ExternalLink, ArrowRight, PlusCircle, AlertCircle } from "lucide-react";
import { getFilteredQuestions } from "@/actions/question.actions";
import { toast } from "sonner";

interface QuestionsClientProps {
  quizzes: { id: string; name: string }[];
  initialRounds: { id: string; name: string }[];
  initialQuestions: any[];
  initialRoundSummary: { name: string; count: number }[];
}

function ShimmerQuestionSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4 animate-pulse">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-10 bg-white/10 rounded" />
            <div className="h-5 w-12 bg-white/10 rounded" />
            <div className="h-5 w-16 bg-white/10 rounded" />
            <div className="h-5 w-32 bg-white/10 rounded" />
          </div>
          <div className="h-6 w-3/4 bg-white/10 rounded mt-2" />
        </div>
        <div className="flex items-center gap-4 text-xs shrink-0">
          <div className="h-4 w-16 bg-white/10 rounded" />
          <div className="h-4 w-16 bg-white/10 rounded" />
          <div className="h-4 w-6 bg-white/10 rounded" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 border-t border-white/5 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-white/5 border border-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function QuestionsClient({
  quizzes,
  initialRounds,
  initialQuestions,
  initialRoundSummary,
}: QuestionsClientProps) {
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedSet, setSelectedSet] = useState("");

  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [rounds, setRounds] = useState<{ id: string; name: string }[]>(initialRounds);
  const [roundSummary, setRoundSummary] = useState<{ name: string; count: number }[]>(initialRoundSummary);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (quizId: string, type: string, roundId: string, set = "") => {
    setSelectedQuizId(quizId);
    setSelectedType(type);
    setSelectedRoundId(roundId);
    setSelectedSet(set);

    setIsLoading(true);
    startTransition(async () => {
      const res = await getFilteredQuestions({ quizId, type, roundId, questionSet: set });
      if (res.success && res.data) {
        setQuestions(res.data.questions);
        setRounds(res.data.rounds);
        setRoundSummary(res.data.roundSummary);
      } else {
        toast.error("Failed to load questions");
      }
      setIsLoading(false);
    });
  };

  const handleClearFilters = () => {
    setSelectedQuizId("");
    setSelectedType("");
    setSelectedRoundId("");
    setSelectedSet("");
    
    setIsLoading(true);
    startTransition(async () => {
      const res = await getFilteredQuestions({});
      if (res.success && res.data) {
        setQuestions(res.data.questions);
        setRounds([]);
        setRoundSummary([]);
      }
      setIsLoading(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
          Question Bank
        </h1>
        <p className="mt-1 text-gray-400">
          Global repository of all competition questions across active quizzes.
        </p>
      </div>

      {/* Filter Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-5">
          {/* Quiz filter */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-300">Quiz:</span>
            <select
              value={selectedQuizId}
              onChange={(e) => handleFilterChange(e.target.value, selectedType, "", selectedSet)}
              className="rounded-lg border border-white/10 bg-[#1a1a2e] px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 min-w-[150px]"
            >
              <option value="">All Quizzes</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => handleFilterChange(selectedQuizId, e.target.value, selectedRoundId, selectedSet)}
              className="rounded-lg border border-white/10 bg-[#1a1a2e] px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 min-w-[120px]"
            >
              <option value="">All Types</option>
              <option value="MCQ">MCQ</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="NUMERIC">Numeric</option>
              <option value="TEXT">Text</option>
            </select>
          </div>

          {/* Round filter */}
          {selectedQuizId && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-300">Round:</span>
              <select
                value={selectedRoundId}
                onChange={(e) => handleFilterChange(selectedQuizId, selectedType, e.target.value, selectedSet)}
                className="rounded-lg border border-white/10 bg-[#1a1a2e] px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 min-w-[120px]"
              >
                <option value="">All Rounds</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Set filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">Set:</span>
            <select
              value={selectedSet}
              onChange={(e) => handleFilterChange(selectedQuizId, selectedType, selectedRoundId, e.target.value)}
              className="rounded-lg border border-white/10 bg-[#1a1a2e] px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 min-w-[100px]"
            >
              <option value="">All Sets</option>
              <option value="A">Set A</option>
              <option value="B">Set B</option>
              <option value="C">Set C</option>
              <option value="D">Set D</option>
            </select>
          </div>

          {/* Reset Filters Link */}
          {(selectedQuizId || selectedType || selectedRoundId || selectedSet) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors border-b border-indigo-400/20 hover:border-indigo-300/40 pb-0.5"
            >
              Clear Filters
            </button>
          )}

          {/* Total Count */}
          <div className="ml-auto text-xs text-gray-400 font-medium">
            {(isLoading || isPending) ? "Updating..." : `Showing ${questions.length} questions`}
          </div>
        </div>
      </div>

      {/* Round Summary Bar */}
      {!isPending && roundSummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-4 text-xs animate-fade-in">
          <span className="font-bold text-indigo-400 uppercase tracking-wider block">Round Summary:</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {roundSummary.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-gray-300">
                <span className="font-semibold text-white">{item.name}:</span>
                <span className="rounded-full bg-white/5 border border-white/5 px-2 py-0.5 font-mono text-[10px] text-indigo-300">
                  {item.count} qs
                </span>
                {index < roundSummary.length - 1 && <span className="text-gray-600 pl-2">|</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions list / Loading state */}
      {(isLoading || isPending) ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <ShimmerQuestionSkeleton key={n} />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
          <HelpCircle className="mb-4 h-12 w-12 text-gray-600" />
          <h2 className="text-lg font-semibold text-white">No questions found</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-sm">
            {selectedQuizId
              ? "This quiz does not have any questions matching the filters. Navigate to the quiz manager to populate it."
              : "No questions exist matching the filters. Open a Quiz and populate questions from the editor."}
          </p>
          {selectedQuizId && (
            <Link
              href={`/admin/quizzes/${selectedQuizId}`}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 shadow-md shadow-indigo-500/10"
            >
              Go to Quiz Editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4 hover:border-white/15 transition-colors animate-fade-in"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                      Q{index + 1}
                    </span>
                    <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                      {q.type}
                    </span>
                    <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                      Set {q.questionSet || "A"}
                    </span>
                    {q.templateRound && (
                      <span className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                        {q.templateRound.title}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                      <BookOpen className="h-3 w-3 text-indigo-400" />
                      {q.quiz.name} ({q.quiz.mode})
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white leading-relaxed">
                    {q.text}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{q.timeLimit || 30}s limit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    <span>{q.points || 10} points</span>
                  </div>
                  <Link
                    href={`/admin/quizzes/${q.quizId}`}
                    className="p-1 text-gray-400 hover:text-indigo-400 transition-colors"
                    title="Manage in Quiz Details"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Options */}
              {q.options.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 border-t border-white/5 pt-4">
                  {q.options.map((opt: any) => (
                    <div
                      key={opt.id}
                      className={`flex items-center justify-between border px-3.5 py-2 rounded-xl text-sm ${
                        opt.isCorrect
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 border-white/5 text-gray-400"
                      }`}
                    >
                      <span className="truncate">{opt.text}</span>
                      {opt.isCorrect && (
                        <span className="text-[9px] uppercase font-bold bg-emerald-500/20 px-1 rounded shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
