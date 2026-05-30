-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuizMode') THEN
    CREATE TYPE "QuizMode" AS ENUM ('SOLO', 'TEAM');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuizStatus') THEN
    CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionStatus') THEN
    CREATE TYPE "SessionStatus" AS ENUM ('WAITING', 'ACTIVE', 'PAUSED', 'COMPLETED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoundType') THEN
    CREATE TYPE "RoundType" AS ENUM ('MCQ', 'BUZZER', 'HAND_RAISE', 'RAPID_FIRE', 'TEAM_ANSWER', 'PASS_TO_MEMBER');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoundStatus') THEN
    CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionType') THEN
    CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'NUMERIC', 'TEXT');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BuzzerStatus') THEN
    CREATE TYPE "BuzzerStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Quiz" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventId" TEXT,
    "mode" "QuizMode" NOT NULL DEFAULT 'SOLO',
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizSession" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'WAITING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "currentRoundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizRound" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "RoundType" NOT NULL DEFAULT 'MCQ',
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "timeLimit" INTEGER NOT NULL DEFAULT 30,
    "pointsPerQuestion" INTEGER NOT NULL DEFAULT 10,
    "settings" JSONB,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "QuizRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "roundId" TEXT,
    "text" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "timeLimit" INTEGER,
    "points" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizQuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "teamId" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizTeam" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "totalScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "textAnswer" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizBuzzerEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "buzzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rank" INTEGER NOT NULL,
    "status" "BuzzerStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "QuizBuzzerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "roundId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "penaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "isManualCorrection" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizLeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundId" TEXT,
    "rankings" JSONB NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizLeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizAuditLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Quiz_eventId_idx" ON "Quiz"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QuizSession_accessCode_key" ON "QuizSession"("accessCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizSession_quizId_idx" ON "QuizSession"("quizId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizRound_sessionId_idx" ON "QuizRound"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizQuestion_roundId_idx" ON "QuizQuestion"("roundId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizQuestionOption_questionId_idx" ON "QuizQuestionOption"("questionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizParticipant_sessionId_idx" ON "QuizParticipant"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizParticipant_registrationId_idx" ON "QuizParticipant"("registrationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizParticipant_teamId_idx" ON "QuizParticipant"("teamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizTeam_sessionId_idx" ON "QuizTeam"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAnswer_sessionId_idx" ON "QuizAnswer"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAnswer_roundId_idx" ON "QuizAnswer"("roundId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAnswer_questionId_idx" ON "QuizAnswer"("questionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAnswer_participantId_idx" ON "QuizAnswer"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAnswer_selectedOptionId_idx" ON "QuizAnswer"("selectedOptionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizBuzzerEvent_sessionId_idx" ON "QuizBuzzerEvent"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizBuzzerEvent_roundId_idx" ON "QuizBuzzerEvent"("roundId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizBuzzerEvent_questionId_idx" ON "QuizBuzzerEvent"("questionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizBuzzerEvent_participantId_idx" ON "QuizBuzzerEvent"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizScore_sessionId_idx" ON "QuizScore"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizScore_participantId_idx" ON "QuizScore"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizScore_roundId_idx" ON "QuizScore"("roundId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizLeaderboardSnapshot_sessionId_idx" ON "QuizLeaderboardSnapshot"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizLeaderboardSnapshot_roundId_idx" ON "QuizLeaderboardSnapshot"("roundId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAuditLog_sessionId_idx" ON "QuizAuditLog"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizAuditLog_adminId_idx" ON "QuizAuditLog"("adminId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quiz_eventId_fkey') THEN
    ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizSession_quizId_fkey') THEN
    ALTER TABLE "QuizSession" ADD CONSTRAINT "QuizSession_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizRound_sessionId_fkey') THEN
    ALTER TABLE "QuizRound" ADD CONSTRAINT "QuizRound_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizQuestion_quizId_fkey') THEN
    ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizQuestion_roundId_fkey') THEN
    ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizQuestionOption_questionId_fkey') THEN
    ALTER TABLE "QuizQuestionOption" ADD CONSTRAINT "QuizQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizParticipant_sessionId_fkey') THEN
    ALTER TABLE "QuizParticipant" ADD CONSTRAINT "QuizParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizParticipant_registrationId_fkey') THEN
    ALTER TABLE "QuizParticipant" ADD CONSTRAINT "QuizParticipant_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizParticipant_teamId_fkey') THEN
    ALTER TABLE "QuizParticipant" ADD CONSTRAINT "QuizParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "QuizTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizTeam_sessionId_fkey') THEN
    ALTER TABLE "QuizTeam" ADD CONSTRAINT "QuizTeam_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizAnswer_sessionId_fkey') THEN
    ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizAnswer_roundId_fkey') THEN
    ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizAnswer_questionId_fkey') THEN
    ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizAnswer_participantId_fkey') THEN
    ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "QuizParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizAnswer_selectedOptionId_fkey') THEN
    ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "QuizQuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizBuzzerEvent_sessionId_fkey') THEN
    ALTER TABLE "QuizBuzzerEvent" ADD CONSTRAINT "QuizBuzzerEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizBuzzerEvent_roundId_fkey') THEN
    ALTER TABLE "QuizBuzzerEvent" ADD CONSTRAINT "QuizBuzzerEvent_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizBuzzerEvent_questionId_fkey') THEN
    ALTER TABLE "QuizBuzzerEvent" ADD CONSTRAINT "QuizBuzzerEvent_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizBuzzerEvent_participantId_fkey') THEN
    ALTER TABLE "QuizBuzzerEvent" ADD CONSTRAINT "QuizBuzzerEvent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "QuizParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizScore_sessionId_fkey') THEN
    ALTER TABLE "QuizScore" ADD CONSTRAINT "QuizScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizScore_participantId_fkey') THEN
    ALTER TABLE "QuizScore" ADD CONSTRAINT "QuizScore_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "QuizParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizScore_roundId_fkey') THEN
    ALTER TABLE "QuizScore" ADD CONSTRAINT "QuizScore_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizLeaderboardSnapshot_sessionId_fkey') THEN
    ALTER TABLE "QuizLeaderboardSnapshot" ADD CONSTRAINT "QuizLeaderboardSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizLeaderboardSnapshot_roundId_fkey') THEN
    ALTER TABLE "QuizLeaderboardSnapshot" ADD CONSTRAINT "QuizLeaderboardSnapshot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizAuditLog_sessionId_fkey') THEN
    ALTER TABLE "QuizAuditLog" ADD CONSTRAINT "QuizAuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizAuditLog_adminId_fkey') THEN
    ALTER TABLE "QuizAuditLog" ADD CONSTRAINT "QuizAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
