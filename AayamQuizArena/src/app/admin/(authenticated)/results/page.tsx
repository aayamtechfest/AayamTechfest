import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BarChart3, Trophy, CheckCircle, Percent, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface ResultsPageProps {
  searchParams: Promise<{ sessionId?: string }>;
}

export default async function AdminResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedSearchParams = await searchParams;
  const sessionId = resolvedSearchParams.sessionId;

  // Fetch all sessions
  const sessions = await prisma.quizSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { quiz: { select: { name: true } } },
  });

  // Calculate analytical stats if session selected
  let participants: any[] = [];
  let stats = {
    highestScore: 0,
    averageScore: 0,
    totalAnswers: 0,
    accuracyRate: 0,
  };

  if (sessionId) {
    participants = await prisma.quizParticipant.findMany({
      where: { sessionId },
      orderBy: { totalScore: "desc" },
      include: { registration: { select: { registrationId: true } } },
    });

    const [totalAnswers, correctAnswers] = await Promise.all([
      prisma.quizAnswer.count({ where: { sessionId } }),
      prisma.quizAnswer.count({ where: { sessionId, isCorrect: true } }),
    ]);

    const highestScore = participants.length > 0 ? participants[0].totalScore : 0;
    const averageScore =
      participants.length > 0
        ? Math.round(participants.reduce((acc, curr) => acc + curr.totalScore, 0) / participants.length)
        : 0;
    const accuracyRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    stats = {
      highestScore,
      averageScore,
      totalAnswers,
      accuracyRate,
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
          Competition Results
        </h1>
        <p className="mt-1 text-gray-400">
          Analyze answer accuracies, averages, and compile final podium listings.
        </p>
      </div>

      {/* Select Session filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-3">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-medium text-gray-300">Select Session:</span>
          <form method="GET" className="flex-1 max-w-xs">
            <select
              name="sessionId"
              defaultValue={sessionId || ""}
              // @ts-ignore - native form submit helper
              onchange="this.form.submit()"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a2e] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="" disabled>-- Select a session --</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.quiz.name})
                </option>
              ))}
            </select>
          </form>
        </div>
      </div>

      {!sessionId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
          <BarChart3 className="mb-4 h-12 w-12 text-gray-600" />
          <h2 className="text-lg font-semibold text-white">Select a session</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xs">
            Choose a session from the dropdown above to load analytical stats and final scores.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analytical Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <Trophy className="h-5 w-5 text-amber-400 mb-2" />
              <span className="text-xs text-gray-500 uppercase tracking-widest block font-semibold">Highest Score</span>
              <span className="text-2xl font-bold text-white block mt-1">{stats.highestScore} pts</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <BarChart3 className="h-5 w-5 text-indigo-400 mb-2" />
              <span className="text-xs text-gray-500 uppercase tracking-widest block font-semibold">Average Score</span>
              <span className="text-2xl font-bold text-white block mt-1">{stats.averageScore} pts</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <CheckCircle className="h-5 w-5 text-emerald-400 mb-2" />
              <span className="text-xs text-gray-500 uppercase tracking-widest block font-semibold">Answers Logged</span>
              <span className="text-2xl font-bold text-white block mt-1">{stats.totalAnswers} items</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <Percent className="h-5 w-5 text-purple-400 mb-2" />
              <span className="text-xs text-gray-500 uppercase tracking-widest block font-semibold">Accuracy Rate</span>
              <span className="text-2xl font-bold text-white block mt-1">{stats.accuracyRate}% correct</span>
            </div>
          </div>

          {/* Results Details */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 font-heading">Final Outcomes</h3>
            {participants.length === 0 ? (
              <p className="text-sm text-gray-400">No contestants logged scores.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                      <th className="py-2 font-medium">Rank</th>
                      <th className="py-2 font-medium">Player</th>
                      <th className="py-2 font-medium">Reg ID</th>
                      <th className="py-2 font-medium text-right">Final Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {participants.map((p, index) => (
                      <tr key={p.id}>
                        <td className="py-3 text-sm font-semibold text-gray-400">#{index + 1}</td>
                        <td className="py-3 text-sm font-semibold text-white">{p.displayName}</td>
                        <td className="py-3 text-xs font-mono text-gray-500">{p.registration.registrationId}</td>
                        <td className="py-3 text-right font-mono font-bold text-indigo-400">{p.totalScore} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
