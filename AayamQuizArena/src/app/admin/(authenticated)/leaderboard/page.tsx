import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trophy, BookOpen, ExternalLink, ArrowRight, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface LeaderboardPageProps {
  searchParams: Promise<{ sessionId?: string }>;
}

export default async function AdminLeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const sessionId = resolvedSearchParams.sessionId;

  // Fetch all sessions for selection
  const sessions = await prisma.quizSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { quiz: { select: { name: true } } },
  });

  // Fetch participants if session selected
  const participants = sessionId
    ? await prisma.quizParticipant.findMany({
        where: { sessionId },
        orderBy: { totalScore: "desc" },
        include: { registration: { select: { registrationId: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
          Standings & Leaderboards
        </h1>
        <p className="mt-1 text-gray-400">
          Inspect participant scoreboard ranks and results across all spawned sessions.
        </p>
      </div>

      {/* Select Session filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-3">
          <Trophy className="h-5 w-5 text-indigo-400" />
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

        {sessionId && (
          <div className="flex items-center gap-2">
            <Link
              href={`/leaderboard/${sessionId}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Public Link
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Standings table */}
      {!sessionId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
          <Trophy className="mb-4 h-12 w-12 text-gray-600 animate-pulse" />
          <h2 className="text-lg font-semibold text-white">Select a session</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xs">
            Choose a live or completed quiz session above to inspect participant standings.
          </p>
        </div>
      ) : participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
          <UserCheck className="mb-4 h-12 w-12 text-gray-600" />
          <h2 className="text-lg font-semibold text-white">Lobby is empty</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xs">
            No contestants have joined this session yet. Provide the lobby access code to students.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4 font-medium">Rank</th>
                  <th className="px-6 py-4 font-medium">Player Name</th>
                  <th className="px-6 py-4 font-medium">Registration ID</th>
                  <th className="px-6 py-4 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {participants.map((p, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const badgeColor =
                    rank === 1
                      ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                      : rank === 2
                      ? "bg-slate-400/10 border-slate-400/30 text-slate-400"
                      : "bg-amber-700/10 border-amber-700/30 text-amber-700";

                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                            isTop3
                              ? badgeColor
                              : "bg-white/5 border border-white/5 text-gray-500"
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="text-sm font-semibold text-white">
                          {p.displayName}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-mono text-gray-400">
                        {p.registration.registrationId}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-mono font-bold text-indigo-400 text-sm">
                        {p.totalScore} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
