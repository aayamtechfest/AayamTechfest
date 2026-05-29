import { QuizMode } from "@prisma/client";

export interface ScoreBreakdown {
  points: number;
  bonus: number;
  penalty: number;
}

/**
 * Calculates the score breakdown for an answer submission.
 */
export function calculatePoints(
  isCorrect: boolean,
  basePoints: number,
  timeRemaining?: number,
  timeLimit?: number,
  settings?: any
): ScoreBreakdown {
  if (!isCorrect) {
    const penalty = settings?.incorrectPenalty || 0;
    return { points: 0, bonus: 0, penalty };
  }

  let bonus = 0;
  // Dynamic time bonus if enabled
  if (settings?.timeBonusEnabled && timeRemaining && timeLimit && timeLimit > 0) {
    const timeRatio = Math.max(0, Math.min(1, timeRemaining / timeLimit));
    // E.g., up to 50% extra points for answering immediately
    const maxBonus = Math.round(basePoints * (settings?.maxTimeBonusMultiplier || 0.5));
    bonus = Math.round(maxBonus * timeRatio);
  }

  return { points: basePoints, bonus, penalty: 0 };
}

/**
 * Generates a 6-character alphanumeric lobby code.
 */
export function generateAccessCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
