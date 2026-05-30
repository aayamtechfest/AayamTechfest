export const ROUND_TYPES = {
  MCQ: "MCQ",
  BUZZER: "BUZZER",
  HAND_RAISE: "HAND_RAISE",
  RAPID_FIRE: "RAPID_FIRE",
  TEAM_ANSWER: "TEAM_ANSWER",
  PASS_TO_MEMBER: "PASS_TO_MEMBER",
  PASS_ROUND: "PASS_ROUND",
} as const;

export type RoundType = typeof ROUND_TYPES[keyof typeof ROUND_TYPES];

export const QUIZ_MODES = {
  SOLO: "SOLO",
  TEAM: "TEAM",
} as const;

export type QuizMode = typeof QUIZ_MODES[keyof typeof QUIZ_MODES];

export const SESSION_STATUS = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

export const ROUND_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type RoundStatus = typeof ROUND_STATUS[keyof typeof ROUND_STATUS];

export const QUESTION_TYPES = {
  MCQ: "MCQ",
  TRUE_FALSE: "TRUE_FALSE",
  NUMERIC: "NUMERIC",
  TEXT: "TEXT",
} as const;

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];

export const BUZZER_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

export type BuzzerStatus = typeof BUZZER_STATUS[keyof typeof BUZZER_STATUS];
