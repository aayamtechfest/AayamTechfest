"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quizSchema, QuizInput } from "@/schemas/quiz.schema";
import { createQuiz, updateQuiz } from "@/actions/quiz.actions";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface QuizFormClientProps {
  events: { id: string; name: string }[];
  initialData?: any;
}

export function QuizFormClient({ events, initialData }: QuizFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizInput>({
    resolver: zodResolver(quizSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          eventId: initialData.eventId || null,
          mode: initialData.mode,
          status: initialData.status,
          settings: initialData.settings || {},
        }
      : {
          name: "",
          description: "",
          eventId: null,
          mode: "SOLO",
          status: "DRAFT",
          settings: {},
        },
  });

  const onSubmit = async (data: QuizInput) => {
    startTransition(async () => {
      let res;
      if (isEdit) {
        res = await updateQuiz(initialData.id, data);
      } else {
        res = await createQuiz(data);
      }

      if (res.success) {
        toast.success(isEdit ? "Quiz updated successfully!" : "Quiz created successfully!");
        router.push(isEdit ? `/admin/quizzes/${initialData.id}` : "/admin/quizzes");
        router.refresh();
      } else {
        toast.error(res.error || "An error occurred");
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back button */}
      <Link
        href={isEdit ? `/admin/quizzes/${initialData.id}` : "/admin/quizzes"}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white font-heading">
          {isEdit ? "Edit Quiz Structure" : "Create New Quiz"}
        </h1>
        <p className="text-sm text-gray-400">
          {isEdit ? "Modify configuration details of the quiz." : "Define name, mode, and link to an existing event."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">
            Quiz Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. CodeQuest Round 1"
            disabled={isPending}
            {...register("name")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500"
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Introduce the quiz rules, themes, or structure..."
            disabled={isPending}
            {...register("description")}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-colors focus:border-indigo-500 resize-none"
          />
          {errors.description && (
            <p className="text-xs text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Mode */}
          <div className="space-y-1.5">
            <label htmlFor="mode" className="block text-sm font-medium text-gray-300">
              Quiz Mode
            </label>
            <select
              id="mode"
              disabled={isPending}
              {...register("mode")}
              className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-white outline-none transition-colors focus:border-indigo-500"
            >
              <option value="SOLO">Solo (Individual players)</option>
              <option value="TEAM">Team (Aggregated registration teams)</option>
            </select>
            {errors.mode && (
              <p className="text-xs text-red-400">{errors.mode.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium text-gray-300">
              Publishing Status
            </label>
            <select
              id="status"
              disabled={isPending}
              {...register("status")}
              className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-white outline-none transition-colors focus:border-indigo-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            {errors.status && (
              <p className="text-xs text-red-400">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Link to Event */}
        <div className="space-y-1.5">
          <label htmlFor="eventId" className="block text-sm font-medium text-gray-300">
            Associated event (optional)
          </label>
          <select
            id="eventId"
            disabled={isPending}
            {...register("eventId")}
            className="w-full rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-white outline-none transition-colors focus:border-indigo-500"
          >
            <option value="">No associated event (Standalone Quiz)</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
          {errors.eventId && (
            <p className="text-xs text-red-400">{errors.eventId.message}</p>
          )}
        </div>

        {/* Action button */}
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>{isEdit ? "Update Quiz" : "Create Quiz"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
