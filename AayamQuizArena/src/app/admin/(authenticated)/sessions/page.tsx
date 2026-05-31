import Link from "next/link";
import { getSessions, deleteSession } from "@/actions/session.actions";
import { getQuizzes } from "@/actions/quiz.actions";
import { Play, Trash, ExternalLink, Activity, Users, Key, Clock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

import { DeleteConfirmForm } from "@/components/shared/delete-confirm-form";
import { SpawnSessionForm } from "./spawn-session-form";

export const dynamic = "force-dynamic";

const sessionStatusStyles: Record<string, string> = {
  WAITING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse",
  PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  COMPLETED: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

interface SessionsPageProps {
  searchParams: Promise<{ createFromQuiz?: string }>;
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const autoQuizId = resolvedSearchParams.createFromQuiz;
  const [sessions, quizzes] = await Promise.all([
    getSessions(),
    getQuizzes(),
  ]);

  // Session creation is now handled client-side in SpawnSessionForm component

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteSession(id);
      revalidatePath("/admin/sessions");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
          Live Sessions & Lobbies
        </h1>
        <p className="mt-1 text-gray-400">
          Spawn new game environments and guide participants through live rounds.
        </p>
      </div>

      {/* Main Grid: Create session & active list */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Spawn Session Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl h-fit space-y-4">
          <h2 className="text-lg font-bold text-white font-heading">Spawn New Live Session</h2>
          {/* Sanitize quizzes to only pass primitive values to the client component */}
          <SpawnSessionForm 
            quizzes={quizzes.map((q) => ({
              id: q.id,
              name: q.name,
              mode: q.mode,
              status: q.status,
            }))} 
            autoQuizId={autoQuizId} 
          />
        </div>

        {/* Sessions list */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-bold text-white font-heading">Current Sessions</h2>

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">No sessions spawn histories found</p>
              <p className="mt-1 text-xs text-gray-500">
                Use the setup panel on the left to spawn your first live quiz lobby.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-white/10 bg-white/5 p-4 rounded-xl hover:border-indigo-500/20 transition-all duration-200 gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">
                        {session.name}
                      </h3>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${
                          sessionStatusStyles[session.status] ?? "bg-gray-500/10"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="text-indigo-400 font-medium">
                        {session.quiz.name} ({session.quiz.mode})
                      </span>
                      <span className="flex items-center gap-1 font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        <Key className="h-3 w-3 text-indigo-500/70" />
                        Code: {session.accessCode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-purple-500/70" />
                        {session._count.participants} players
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/[0.02] px-2 py-0.5 rounded border border-white/5">
                        <Clock className="h-3 w-3 text-indigo-500/50" />
                        {formatDateTime(session.createdAt)} ({formatRelativeTime(session.createdAt)})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Live Control
                    </Link>
                    <DeleteConfirmForm 
                      action={handleDelete} 
                      message="Delete this session, its logs, and and scoring entries?"
                    >
                      <input type="hidden" name="id" value={session.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-1.5 text-red-400 transition-colors hover:bg-red-500/10 hover:border-red-500/40"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </DeleteConfirmForm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
