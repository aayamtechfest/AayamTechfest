import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  sortOrder: z.number(),
});

export const questionSchema = z.object({
  text: z.string().min(3, "Question text must be at least 3 characters"),
  type: z.enum(["MCQ", "TRUE_FALSE", "NUMERIC", "TEXT"]),
  mediaUrl: z.string().nullable().optional(),
  timeLimit: z.number().int().nonnegative().nullable().optional(),
  points: z.number().int().nonnegative().nullable().optional(),
  explanation: z.string().nullable().optional(),
  templateRoundId: z.string().nullable().optional(),
  options: z.array(questionOptionSchema),
});

export type QuestionInput = z.infer<typeof questionSchema>;
