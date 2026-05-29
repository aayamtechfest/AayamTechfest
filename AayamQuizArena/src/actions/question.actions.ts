"use server";

import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/schemas/question.schema";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export async function createQuestion(
  quizId: string,
  data: Record<string, any>
): Promise<ActionResponse<string>> {
  try {
    const parsed = questionSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { text, type, mediaUrl, timeLimit, points, explanation, options } = parsed.data;

    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.quizQuestion.create({
        data: {
          quizId,
          text,
          type,
          mediaUrl,
          timeLimit,
          points,
          explanation,
        },
      });

      if (options && options.length > 0) {
        await tx.quizQuestionOption.createMany({
          data: options.map((opt, index) => ({
            questionId: q.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder ?? index,
          })),
        });
      }

      return q;
    });

    revalidatePath(`/admin/quizzes/${quizId}`);
    return { success: true, data: question.id };
  } catch (error) {
    console.error("Failed to create question:", error);
    return { success: false, error: "Failed to create question" };
  }
}

export async function updateQuestion(
  questionId: string,
  data: Record<string, any>
): Promise<ActionResponse> {
  try {
    const parsed = questionSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { text, type, mediaUrl, timeLimit, points, explanation, options } = parsed.data;

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.quizQuestion.update({
        where: { id: questionId },
        data: {
          text,
          type,
          mediaUrl,
          timeLimit,
          points,
          explanation,
        },
      });

      // Clear old options and rebuild
      await tx.quizQuestionOption.deleteMany({
        where: { questionId },
      });

      if (options && options.length > 0) {
        await tx.quizQuestionOption.createMany({
          data: options.map((opt, index) => ({
            questionId,
            text: opt.text,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder ?? index,
          })),
        });
      }
    });

    revalidatePath(`/admin/quizzes/${question.quizId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update question:", error);
    return { success: false, error: "Failed to update question" };
  }
}

export async function deleteQuestion(questionId: string): Promise<ActionResponse> {
  try {
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    await prisma.quizQuestion.delete({
      where: { id: questionId },
    });

    revalidatePath(`/admin/quizzes/${question.quizId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete question:", error);
    return { success: false, error: "Failed to delete question" };
  }
}

export async function getEvents(): Promise<{ id: string; name: string }[]> {
  try {
    return await prisma.event.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to get events list:", error);
    return [];
  }
}
