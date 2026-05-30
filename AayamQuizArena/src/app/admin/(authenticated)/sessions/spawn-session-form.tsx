"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { createSession } from "@/actions/session.actions";

interface QuizTemplate {
  id: string;
  name: string;
  mode: string;
  status: string;
}

interface SpawnSessionFormProps {
  quizzes: QuizTemplate[];
  autoQuizId?: string;
}

export function SpawnSessionForm({ quizzes, autoQuizId }: SpawnSessionFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState(`Session - ${new Date().toLocaleDateString()}`);
  const [quizId, setQuizId] = useState(autoQuizId || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quizId) {
      toast.error("Please fill in all fields.");
      return;
    }

    // Client-side quick check of selected quiz status
    const selectedQuiz = quizzes.find((q) => q.id === quizId);
    if (selectedQuiz && selectedQuiz.status !== "PUBLISHED") {
      toast.error(`Cannot create a session from a ${selectedQuiz.status.toLowerCase()} quiz. Please publish the quiz first.`);
      return;
    }

    setIsPending(true);
    try {
      const res = await createSession({ name, quizId });
      if (res.success && res.data) {
        toast.success("Session launched successfully!");
        router.push(`/admin/sessions/${res.data}`);
      } else {
        toast.error(res.error || "Failed to launch session.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CodeQuest Finals"
          disabled={isPending}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 disabled:opacity-50"
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
          value={quizId}
          onChange={(e) => setQuizId(e.target.value)}
          disabled={isPending}
          className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
        >
          <option value="" disabled>-- Select a template --</option>
          {quizzes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name} ({q.mode}) {q.status !== "PUBLISHED" ? `[${q.status}]` : ""}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlusCircle className="h-4 w-4" />
        {isPending ? "Launching..." : "Launch Session"}
      </button>
    </form>
  );
}
