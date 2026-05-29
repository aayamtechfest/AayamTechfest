import { z } from "zod";

export const sessionSchema = z.object({
  name: z.string().min(3, "Session name must be at least 3 characters"),
  quizId: z.string().min(1, "Quiz is required"),
});

export type SessionInput = z.infer<typeof sessionSchema>;
