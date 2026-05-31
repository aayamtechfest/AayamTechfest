import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Trophy, Zap, Users, BarChart3, ArrowRight } from "lucide-react";
import { SocketStatusIndicator } from "@/components/shared/status-indicator";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Fetch active/recent quiz sessions to allow public spectators
  const activeSessions = await prisma.quizSession.findMany({
    where: {
      status: { in: ["ACTIVE", "PAUSED", "WAITING", "COMPLETED"] },
    },
    include: {
      quiz: { select: { name: true, mode: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  }).catch(() => []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f23]">
      <Header />

      {/* Hero Section */}
      <main className="flex-1 pt-24 md:pt-32 relative overflow-hidden">
        {/* Glowing background radial blur */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
          <div className="absolute -right-20 top-40 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
        </div>

        {/* Hero Content */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 font-medium">
            <Trophy className="h-4 w-4" />
            University Live Competition Portal
          </div>

          <h1 className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent font-heading leading-tight max-w-4xl mx-auto">
            Welcome to the <br />
            <span className="gradient-text">AAYAM Quiz Arena</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-400 leading-relaxed">
            Participate in real-time solo or team quiz battles. Watch live questions, trigger fast buzzers, and check your rank on the live screen instantly.
          </p>

          <div className="flex justify-center pt-2">
            <SocketStatusIndicator />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/join"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:scale-[1.02]"
            >
              Enter Game Lobby
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              Check Live Sessions
            </Link>
          </div>
        </section>

        {/* Live Sessions Section */}
        {activeSessions.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/5 space-y-10">
            <div className="text-center space-y-3">
              <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
                Live & Recent Event Matches
              </h2>
              <p className="max-w-xl mx-auto text-sm text-gray-400">
                Spectate active rounds on the auditorium screen or check final standings on the leaderboard.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {activeSessions.map((session) => {
                const isLive = session.status === "ACTIVE" || session.status === "PAUSED";
                return (
                  <div
                    key={session.id}
                    className={`rounded-2xl border bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between hover:scale-[1.01] ${
                      isLive 
                        ? "border-indigo-500/30 shadow-lg shadow-indigo-500/5 hover:border-indigo-500/50 bg-indigo-950/5" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded font-bold">
                          {session.accessCode}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isLive 
                            ? "bg-emerald-500/10 text-emerald-400 animate-pulse border border-emerald-500/20" 
                            : session.status === "WAITING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-white/5 text-gray-400 border border-white/10"
                        }`}>
                          {isLive ? "● Live Match" : session.status.toLowerCase()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white font-heading truncate">
                          {session.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          Quiz: {session.quiz.name} ({session.quiz.mode})
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-center text-xs">
                      <Link
                        href={`/screen/${session.accessCode}`}
                        target="_blank"
                        className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 font-semibold text-white transition-all flex items-center justify-center gap-1 hover:border-white/25"
                      >
                        🖥️ Auditorium Screen
                      </Link>
                      <Link
                        href={`/leaderboard/${session.accessCode}`}
                        target="_blank"
                        className="rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 py-2.5 font-semibold text-indigo-300 hover:text-white transition-all flex items-center justify-center gap-1"
                      >
                        🏆 Leaderboard
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Features list */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/5">
          <h2 className="text-center font-heading text-2xl font-bold text-white mb-12">
            Engineered for Real-Time Event Hosting
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <Zap className="h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Instant Buzzers
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Server-side millisecond timestamp queue guarantees fair buzz orders for rapid-fire rounds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Live Leaderboard
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Watch point tallies update live on the central projector as players submit choices.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Team Aggregates
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Supports team dynamics. Members score points which accumulate automatically for their team.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-200">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">
                Verified Identity
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Contestants authenticate using their unique AAYAM Event Registration ID for security.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
