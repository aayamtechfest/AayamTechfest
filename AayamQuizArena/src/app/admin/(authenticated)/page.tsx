import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { SocketStatusIndicator } from "@/components/shared/status-indicator";
import {
  BookOpen,
  Activity,
  HelpCircle,
  Users,
  Play,
  Settings,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Award,
  Server,
  Terminal,
  Key,
  Database,
  RefreshCw,
} from "lucide-react";

async function getDashboardData() {
  try {
    const [
      totalQuizzes,
      activeSessionsCount,
      totalQuestions,
      totalParticipants,
      recentSessions,
    ] = await Promise.all([
      prisma.quiz.count(),
      prisma.quizSession.count({ where: { status: "ACTIVE" } }),
      prisma.quizQuestion.count(),
      prisma.quizParticipant.count(),
      prisma.quizSession.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          quiz: { select: { name: true, mode: true } },
          _count: { select: { participants: true } },
        },
      }),
    ]);

    return {
      totalQuizzes,
      activeSessionsCount,
      totalQuestions,
      totalParticipants,
      recentSessions,
    };
  } catch (error) {
    console.warn("⚠️ [Prisma] Database is not reachable. Using fallback dashboard data.");
    return {
      totalQuizzes: 0,
      activeSessionsCount: 0,
      totalQuestions: 0,
      totalParticipants: 0,
      recentSessions: [],
    };
  }
}

const sessionStatusStyles: Record<string, string> = {
  WAITING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse",
  PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  COMPLETED: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const statCards = [
    {
      title: "Total Quizzes",
      value: data.totalQuizzes,
      icon: BookOpen,
      gradient: "from-indigo-600 to-indigo-800",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-300",
    },
    {
      title: "Active Live Sessions",
      value: data.activeSessionsCount,
      icon: Activity,
      gradient: "from-emerald-600 to-emerald-800",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-300",
    },
    {
      title: "Questions Pool",
      value: data.totalQuestions,
      icon: HelpCircle,
      gradient: "from-purple-600 to-purple-800",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-300",
    },
    {
      title: "Total Participants Joined",
      value: data.totalParticipants,
      icon: Users,
      gradient: "from-amber-600 to-amber-800",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-300",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
            Quiz Arena Dashboard
          </h1>
          <p className="mt-1 text-gray-400">
            Monitor your live quiz competitions and coordinate rounds in real-time.
          </p>
        </div>
        <div className="shrink-0">
          <SocketStatusIndicator isAdmin={true} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg border border-white/5`}
          >
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-white/5" />

            <div className="relative">
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="text-sm font-medium text-white/70">{card.title}</p>
              <p className="mt-1 text-3xl font-bold text-white font-heading">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Sessions */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Live Sessions
              </h2>
              <p className="text-xs text-gray-400">
                Lobbies created and currently operating
              </p>
            </div>
            <Link
              href="/admin/sessions"
              className="flex items-center gap-1 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {data.recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">No active lobby sessions found</p>
              <p className="mt-1 text-sm text-gray-500">
                Start a session from the Quick Actions panel below.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3 font-medium">Session Name / Quiz</th>
                    <th className="px-6 py-3 font-medium">Lobby Code</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {session.name}
                          </p>
                          <p className="text-xs text-indigo-400">
                            {session.quiz.name} ({session.quiz.mode})
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-sm bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-200">
                          {session.accessCode}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                        {session._count.participants} players
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                            sessionStatusStyles[session.status] ??
                            "bg-gray-500/10 text-gray-400 border-gray-500/30"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-300">
                            {formatDateTime(session.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(session.createdAt)}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Quick Links / Resources */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Quiz Quick Setup</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              To host a live competition:
            </p>
            <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2 mb-6">
              <li>Create a new Quiz structure.</li>
              <li>Add questions & options to your quiz.</li>
              <li>Spawn a Session lobby & distribute the code.</li>
              <li>Wait for participants and launch!</li>
            </ol>
            <Link
              href="/admin/quizzes"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500"
            >
              <PlusCircle className="h-4 w-4" />
              Create Quiz
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-md font-semibold text-white mb-2">Participant Portal</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Distribute the URL below to students so they can join live games on their mobile devices:
              </p>
              <div className="bg-black/30 border border-white/10 px-3 py-2 rounded-lg font-mono text-xs text-indigo-300 truncate">
                {process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"}/join
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Quick Navigation
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/quizzes"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 transition-colors group-hover:bg-indigo-500/20">
              <BookOpen className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Manage Quizzes</p>
              <p className="text-xs text-gray-500">Edit and publish quizzes</p>
            </div>
          </Link>

          <Link
            href="/admin/questions"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-purple-500/30 hover:bg-purple-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
              <HelpCircle className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Question Bank
              </p>
              <p className="text-xs text-gray-500">Create global questions</p>
            </div>
          </Link>

          <Link
            href="/admin/sessions"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
              <Play className="h-5 w-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Live Lobbies
              </p>
              <p className="text-xs text-gray-500">Launch a live game session</p>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
              <Settings className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Platform Settings</p>
              <p className="text-xs text-gray-500">Configure global timers</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Local Server Setup Instructions for Admins */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
            <Server className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Local Server Run Guide</h2>
            <p className="text-xs text-gray-400">Step-by-step instructions for running the Quiz Arena locally</p>
          </div>
        </div>

        <div className="space-y-4">
          <details className="group border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden transition-all duration-200 open:border-indigo-500/30 open:bg-indigo-500/[0.02]" name="setup-guide">
            <summary className="flex items-center justify-between cursor-pointer p-4 select-none">
              <span className="flex items-center gap-3 text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                <Terminal className="h-4 w-4 text-indigo-400" />
                1. Initial Setup (After Cloning)
              </span>
              <span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">↓</span>
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-white/5 bg-black/10 leading-relaxed space-y-3">
              <p>Install project dependencies for both the frontend client and the real-time WebSocket socket-server:</p>
              <div>
                <p className="font-semibold text-white text-xs mb-1">A. Install main Quiz Arena dependencies:</p>
                <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-xs text-indigo-300">
                  npm install
                </div>
              </div>
              <div>
                <p className="font-semibold text-white text-xs mb-1">B. Install real-time socket-server dependencies:</p>
                <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-xs text-indigo-300">
                  cd socket-server && npm install
                </div>
              </div>
              <p className="text-xs text-gray-500">Note: Ensure you are using Node.js version 18.x or later.</p>
            </div>
          </details>

          <details className="group border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden transition-all duration-200 open:border-indigo-500/30 open:bg-indigo-500/[0.02]" name="setup-guide">
            <summary className="flex items-center justify-between cursor-pointer p-4 select-none">
              <span className="flex items-center gap-3 text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                <Key className="h-4 w-4 text-indigo-400" />
                2. Environment Variables (.env)
              </span>
              <span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">↓</span>
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-white/5 bg-black/10 leading-relaxed space-y-3">
              <p>Copy the template <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded text-xs">.env.example</code> to a new file named <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded text-xs">.env</code> in the project root directory and set the values:</p>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-gray-300 font-mono">DATABASE_URL</span> &amp; <span className="font-semibold text-gray-300 font-mono">DIRECT_URL</span>
                  <p className="text-gray-500">PostgreSQL database connection strings (see Database guide below).</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300 font-mono">SESSION_SECRET</span>
                  <p className="text-gray-500">Set a unique 32-character string for administration session security.</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300 font-mono">NEXT_PUBLIC_SOCKET_URL</span>
                  <p className="text-gray-500">WebSocket URL pointing to local server: <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-[10px]">http://localhost:3001</code></p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300 font-mono">NEXT_PUBLIC_SITE_URL</span>
                  <p className="text-gray-500">Frontend server URL: <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-[10px]">http://localhost:3002</code></p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300 font-mono">NEXT_PUBLIC_AAYAM_URL</span>
                  <p className="text-gray-500">Point back to main Aayam portal for integration: <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-[10px]">http://localhost:3000</code></p>
                </div>
              </div>
            </div>
          </details>

          <details className="group border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden transition-all duration-200 open:border-indigo-500/30 open:bg-indigo-500/[0.02]" name="setup-guide">
            <summary className="flex items-center justify-between cursor-pointer p-4 select-none">
              <span className="flex items-center gap-3 text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                <Database className="h-4 w-4 text-indigo-400" />
                3. Database Config (Supabase vs Local PG)
              </span>
              <span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">↓</span>
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-white/5 bg-black/10 leading-relaxed space-y-3">
              <p>You can use a <span className="text-white font-medium">local PostgreSQL instance</span> (e.g., Docker, Postgres.app) or a <span className="text-white font-medium">Supabase database</span>.</p>
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">⚠️ What if you use a different or local database?</p>
                <p>If you connect to a new database (local or a different Supabase project) by changing <code className="text-amber-200 font-mono">DATABASE_URL</code> in your env:</p>
                <p>You must run database migrations to create the required tables and structures before starting the server.</p>
              </div>
              <p>Apply migrations using the following command:</p>
              <div className="bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-xs text-indigo-300">
                npx prisma db push
              </div>
            </div>
          </details>

          <details className="group border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden transition-all duration-200 open:border-indigo-500/30 open:bg-indigo-500/[0.02]" name="setup-guide">
            <summary className="flex items-center justify-between cursor-pointer p-4 select-none">
              <span className="flex items-center gap-3 text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                <RefreshCw className="h-4 w-4 text-indigo-400" />
                4. Running the Servers
              </span>
              <span className="text-gray-400 transition-transform duration-200 group-open:rotate-180">↓</span>
            </summary>
            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-white/5 bg-black/10 leading-relaxed space-y-3">
              <p>Running the Quiz Arena locally requires running **both** the WebSocket server and the Next.js client.</p>
              <div>
                <p className="font-semibold text-white text-xs mb-1">A. Start the Socket.IO server (Port 3001):</p>
                <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-xs text-indigo-300">
                  cd socket-server && npm start
                </div>
              </div>
              <div>
                <p className="font-semibold text-white text-xs mb-1">B. Start the Next.js Client (Port 3002):</p>
                <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-xs text-indigo-300">
                  npm run dev
                </div>
              </div>
              <p>Verify that both servers are online. The Next.js frontend is accessible at <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">http://localhost:3002</a>.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
