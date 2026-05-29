import { z } from "zod";

export const quizSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().nullable().optional(),
  eventId: z.string().nullable().optional(),
  mode: z.enum(["SOLO", "TEAM"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  settings: z.any().optional(),
});

export type QuizInput = z.infer<typeof quizSchema>;
