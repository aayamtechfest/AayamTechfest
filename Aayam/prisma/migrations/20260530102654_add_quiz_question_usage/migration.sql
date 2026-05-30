-- AlterEnum
DO $$ BEGIN
  ALTER TYPE "RoundType" ADD VALUE 'PASS_ROUND';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='QuizQuestion' AND column_name='templateRoundId') THEN
    ALTER TABLE "QuizQuestion" ADD COLUMN "templateRoundId" TEXT;
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizTemplateRound" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "RoundType" NOT NULL DEFAULT 'MCQ',
    "timeLimit" INTEGER NOT NULL DEFAULT 30,
    "pointsPerQuestion" INTEGER NOT NULL DEFAULT 10,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizTemplateRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuizQuestionUsage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizQuestionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizTemplateRound_quizId_idx" ON "QuizTemplateRound"("quizId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizQuestionUsage_sessionId_idx" ON "QuizQuestionUsage"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizQuestionUsage_roundId_idx" ON "QuizQuestionUsage"("roundId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizQuestionUsage_questionId_idx" ON "QuizQuestionUsage"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QuizQuestionUsage_sessionId_questionId_key" ON "QuizQuestionUsage"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuizQuestion_templateRoundId_idx" ON "QuizQuestion"("templateRoundId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizTemplateRound_quizId_fkey') THEN
    ALTER TABLE "QuizTemplateRound" ADD CONSTRAINT "QuizTemplateRound_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizQuestion_templateRoundId_fkey') THEN
    ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_templateRoundId_fkey" FOREIGN KEY ("templateRoundId") REFERENCES "QuizTemplateRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizQuestionUsage_sessionId_fkey') THEN
    ALTER TABLE "QuizQuestionUsage" ADD CONSTRAINT "QuizQuestionUsage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizQuestionUsage_roundId_fkey') THEN
    ALTER TABLE "QuizQuestionUsage" ADD CONSTRAINT "QuizQuestionUsage_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuizQuestionUsage_questionId_fkey') THEN
    ALTER TABLE "QuizQuestionUsage" ADD CONSTRAINT "QuizQuestionUsage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
