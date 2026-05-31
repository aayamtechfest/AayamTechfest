import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, PlusCircle, AlertCircle } from "lucide-react";
import QuestionsClient from "./questions-client";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
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

    // Fetch initial questions
    const initialQuestions = await prisma.quizQuestion.findMany({
      include: {
        quiz: { select: { name: true, mode: true } },
        options: { orderBy: { sortOrder: "asc" } },
        templateRound: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <QuestionsClient
        quizzes={quizzes}
        initialRounds={[]}
        initialQuestions={initialQuestions}
        initialRoundSummary={[]}
      />
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
