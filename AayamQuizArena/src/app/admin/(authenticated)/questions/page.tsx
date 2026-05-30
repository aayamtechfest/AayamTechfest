import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HelpCircle, BookOpen, Clock, Award, ExternalLink, ArrowRight, PlusCircle, AlertCircle } from "lucide-react";
import { AutoSubmitSelect } from "@/components/shared/auto-submit-select";

export const dynamic = "force-dynamic";

interface QuestionsPageProps {
  searchParams: Promise<{ quizId?: string }>;
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const quizId = resolvedSearchParams.quizId;

  try {
    // Fetch all quizzes for the filter
    const quizzes = await prisma.quiz.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // If no quizzes exist at all, show a nice empty/onboarding state
    if (quizzes.length === 0) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
              Question Bank
            </h1>
            <p className="mt-1 text-gray-400">
              Global repository of all competition questions across active quizzes.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 px-6 text-center backdrop-blur-xl max-w-2xl mx-auto shadow-xl">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse-glow" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                <BookOpen className="h-8 w-8 animate-float" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white font-heading">No Quizzes Created Yet</h2>
            <p className="mt-3 text-sm text-gray-400 max-w-md leading-relaxed">
              The Question Bank stores questions linked to specific quizzes. Since you haven't created any quizzes yet, you cannot add or view questions.
            </p>
            <div className="mt-8">
              <Link
                href="/admin/quizzes/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/40"
              >
                <PlusCircle className="h-4 w-4" />
                Create First Quiz
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Fetch questions
    const questions = await prisma.quizQuestion.findMany({
      where: quizId ? { quizId } : {},
      include: {
        quiz: { select: { name: true, mode: true } },
        options: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

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

        {/* Filter and Overview */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex flex-1 items-center gap-3">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-medium text-gray-300">Filter by Quiz:</span>
            <form method="GET" className="flex-1 max-w-xs">
              <AutoSubmitSelect
                name="quizId"
                defaultValue={quizId || ""}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a2e] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="">All Quizzes</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </AutoSubmitSelect>
              {/* Fallback button if JavaScript fails */}
              <noscript>
                <button type="submit" className="ml-2 text-xs bg-indigo-600 px-2 py-1 rounded text-white">Filter</button>
              </noscript>
            </form>
          </div>

          <div className="text-xs text-gray-400 font-medium">
            Showing {questions.length} questions
          </div>
        </div>

        {/* Questions list */}
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
            <HelpCircle className="mb-4 h-12 w-12 text-gray-600" />
            <h2 className="text-lg font-semibold text-white">No questions found</h2>
            <p className="mt-2 text-sm text-gray-400 max-w-sm">
              {quizId
                ? "This quiz does not have any questions yet. Navigate to the quiz manager to populate it."
                : "No questions exist in the database. Open a Quiz and populate questions from the editor."}
            </p>
            {quizId && (
              <Link
                href={`/admin/quizzes/${quizId}`}
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
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4 hover:border-white/15 transition-colors"
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
                    {q.options.map((opt) => (
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
  } catch (error) {
    console.error("Database error in Question Bank page:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
            Question Bank
          </h1>
          <p className="mt-1 text-gray-400">
            Global repository of all competition questions across active quizzes.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 py-16 px-6 text-center backdrop-blur-xl max-w-2xl mx-auto shadow-xl">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400 animate-pulse" />
          <h2 className="text-lg font-semibold text-white font-heading">Database connection issue</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-md">
            We are unable to connect to the database to fetch quizzes and questions. This usually happens if the server is still starting or environment variables are being updated.
          </p>
        </div>
      </div>
    );
  }
}
