import Link from "next/link";
import { getQuizzes } from "@/actions/quiz.actions";
import { BookOpen, PlusCircle, Trash, ExternalLink, Calendar, Users } from "lucide-react";
import { deleteQuiz } from "@/actions/quiz.actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const quizStatusStyles: Record<string, string> = {
  DRAFT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  ARCHIVED: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default async function QuizzesListPage() {
  const quizzes = await getQuizzes();

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteQuiz(id);
      revalidatePath("/admin/quizzes");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl font-heading">
            Quizzes Manager
          </h1>
          <p className="mt-1 text-gray-400">
            Create structure for your competitions. Quizzes contain rounds and questions.
          </p>
        </div>
        <Link
          href="/admin/quizzes/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/40"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Quiz
        </Link>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
          <BookOpen className="mb-4 h-12 w-12 text-gray-600" />
          <h2 className="text-lg font-semibold text-white">No quizzes yet</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-sm">
            Create your first quiz to define mode (Solo/Team), and link it to an AAYAM event.
          </p>
          <Link
            href="/admin/quizzes/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Get Started
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-200 hover:border-indigo-500/30 hover:bg-white/[0.07]"
            >
              <div>
                {/* Mode & Status badges */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    <Users className="h-3 w-3" />
                    {quiz.mode} Mode
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                      quizStatusStyles[quiz.status] ?? "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {quiz.status}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 font-heading">
                  {quiz.name}
                </h3>

                {/* Description */}
                <p className="mt-1 text-sm text-gray-400 line-clamp-2 h-10">
                  {quiz.description || "No description provided."}
                </p>

                {/* Info summary */}
                <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500/70" />
                    <span>{quiz._count.questions} Questions</span>
                  </div>
                  {quiz.event && (
                    <div className="flex items-center gap-1 max-w-[150px] truncate">
                      <Calendar className="h-3.5 w-3.5 text-purple-500/70" />
                      <span className="truncate" title={quiz.event.name}>
                        {quiz.event.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/quizzes/${quiz.id}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View & Edit
                </Link>
                <form action={handleDelete} className="inline-flex">
                  <input type="hidden" name="id" value={quiz.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition-colors hover:bg-red-500/10 hover:border-red-500/40"
                    title="Delete Quiz"
                    onClick={(e) => {
                      if (!confirm("Are you sure you want to delete this quiz? This will delete all associated rounds and sessions.")) {
                        e.preventDefault();
                      }
                    }}
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
  );
}
