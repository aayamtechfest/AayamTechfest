export const APP_NAME = "AAYAM";
export const APP_DESCRIPTION = "AAYAM - University Event Management & Registration Platform";

export const EVENT_CODE_MAP: Record<string, string> = {
  "fast-coding": "CODE",
  "quiz": "QUIZ",
  "ui-ux": "UIUX",
  "hackathon": "HACK",
  "problem-solving": "PROB",
  "web-dev": "WDEV",
  "app-dev": "ADEV",
  "ai-ml": "AIML",
  "cyber-security": "CYBR",
  "robotics": "ROBO",
  "gaming": "GAME",
  "photography": "PHTO",
  "debate": "DEBT",
  "poster": "PSTR",
};

export const PAYMENT_STATUSES = {
  PENDING: { label: "Pending", color: "yellow" },
  APPROVED: { label: "Approved", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
} as const;

export const REGISTRATION_STATUSES = {
  SUBMITTED: { label: "Submitted", color: "blue" },
  PENDING_VERIFICATION: { label: "Pending Verification", color: "yellow" },
  APPROVED: { label: "Approved", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
  CLOSED: { label: "Closed", color: "gray" },
  EXPIRED: { label: "Expired", color: "gray" },
} as const;

export const PARTICIPATION_TYPES = {
  SOLO: { label: "Solo", description: "Individual participation" },
  TEAM: { label: "Team", description: "Team participation required" },
  BOTH: { label: "Solo / Team", description: "Individual or team participation" },
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const ITEMS_PER_PAGE = 10;
