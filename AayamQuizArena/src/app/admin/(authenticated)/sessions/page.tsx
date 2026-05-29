import Link from "next/link";
import { getSessions, createSession, deleteSession } from "@/actions/session.actions";
import { getQuizzes } from "@/actions/quiz.actions";
import { Play, PlusCircle, Trash, ExternalLink, Activity, Users, Key } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  async function handleCreate(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const quizId = formData.get("quizId") as string;

    if (!name || !quizId) return;

    const res = await createSession({ name, quizId });
    if (res.success && res.data) {
      redirect(`/admin/sessions/${res.data}`);
    }
  }

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
          <form action={handleCreate} className="space-y-4">
            {/* Session Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Session Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={`Session - ${new Date().toLocaleDateString()}`}
                placeholder="e.g. CodeQuest Finals"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quiz Choice */}
            <div className="space-y-1">
              <label htmlFor="quizId" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Select Quiz Template
              </label>
              <select
                id="quizId"
                name="quizId"
                required
                defaultValue={autoQuizId || ""}
                className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="" disabled>-- Select a template --</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} ({q.mode})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500"
            >
              <PlusCircle className="h-4 w-4" />
              Launch Session
            </button>
          </form>
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
                    <form 
                      action={handleDelete} 
                      // @ts-ignore
                      onsubmit="return confirm('Delete this session, its logs, and and scoring entries?')"
                      className="inline-flex"
                    >
                      <input type="hidden" name="id" value={session.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-1.5 text-red-400 transition-colors hover:bg-red-500/10 hover:border-red-500/40"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </form>
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
