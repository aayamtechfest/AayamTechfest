import { Prisma } from "@prisma/client";

// Action response
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Prisma relations payloads
export type QuizWithDetails = Prisma.QuizGetPayload<{
  include: {
    event: true;
    _count: { select: { questions: true; sessions: true } };
  };
}>;

export type QuizSessionWithDetails = Prisma.QuizSessionGetPayload<{
  include: {
    quiz: true;
    _count: { select: { participants: true; rounds: true } };
  };
}>;

export type QuizQuestionWithDetails = Prisma.QuizQuestionGetPayload<{
  include: {
    options: {
      orderBy: { sortOrder: "asc" };
    };
  };
}>;

export type QuizRoundWithDetails = Prisma.QuizRoundGetPayload<{
  include: {
    questions: {
      include: {
        options: {
          orderBy: { sortOrder: "asc" };
        };
      };
      orderBy: { sortOrder: "asc" };
    };
  };
}>;

export type QuizParticipantWithDetails = Prisma.QuizParticipantGetPayload<{
  include: {
    registration: true;
    team: true;
  };
}>;

// Realtime states (used by Socket.IO)
export interface RealtimeParticipant {
  id: string;
  displayName: string;
  registrationId: string;
  registrationNumber: string; // The human-readable registrationId
  teamId: string | null;
  teamName: string | null;
  isConnected: boolean;
  score: number;
}

export interface RealtimeTeam {
  id: string;
  name: string;
  color: string | null;
  score: number;
  members: string[]; // participantIds
}

export interface RealtimeBuzzerQueueItem {
  id: string;
  participantId: string;
  displayName: string;
  teamName: string | null;
  buzzedAt: string; // ISO string or timestamp
  rank: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
}

export interface RealtimeQuizState {
  sessionId: string;
  sessionName: string;
  quizId: string;
  quizName: string;
  quizMode: "SOLO" | "TEAM";
  status: "WAITING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  currentRoundId: string | null;
  currentRoundNumber: number | null;
  currentRoundTitle: string | null;
  currentRoundType: "MCQ" | "BUZZER" | "HAND_RAISE" | "RAPID_FIRE" | "TEAM_ANSWER" | "PASS_TO_MEMBER" | "PASS_ROUND" | null;
  buzzerOpen?: boolean;
  questionCompleted?: boolean;
  rapidFireState?: {
    activeTeamId: string | null;
    activeParticipantId: string | null;
    timeLeft: number;
    questionTimeLeft: number;
    isRunning: boolean;
    questionIndex: number;
    config?: {
      totalRoundTime: number;
      questionTimeLimit: number;
      pointsPerQuestion: number;
      negativeMarking: boolean;
    };
    stats?: {
      attempted: number;
      correct: number;
      wrong: number;
      score: number;
    };
  };
  passRoundState?: {
    activeTeamId: string | null;
    activeParticipantId: string | null;
    passCount: number;
    passHistory: string[];
  };
  
  // Active Question Info (null if not running/showing)
  activeQuestion: {
    id: string;
    text: string;
    mediaUrl: string | null;
    type: "MCQ" | "TRUE_FALSE" | "NUMERIC" | "TEXT";
    timeLimit: number; // in seconds
    points: number;
    options: { id: string; text: string }[]; // hides isCorrect from client
  } | null;

  questionStartedAt: string | null; // ISO string timestamp
  questionEndsAt: string | null; // ISO string timestamp
  
  // Real-time lists
  participants: RealtimeParticipant[];
  teams: RealtimeTeam[];
  buzzerQueue: RealtimeBuzzerQueueItem[];
}
