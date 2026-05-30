-- AlterEnum
ALTER TYPE "RoundType" ADD VALUE 'PASS_ROUND';

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "templateRoundId" TEXT;

-- CreateTable
CREATE TABLE "QuizTemplateRound" (
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
CREATE TABLE "QuizQuestionUsage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizQuestionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizTemplateRound_quizId_idx" ON "QuizTemplateRound"("quizId");

-- CreateIndex
CREATE INDEX "QuizQuestionUsage_sessionId_idx" ON "QuizQuestionUsage"("sessionId");

-- CreateIndex
CREATE INDEX "QuizQuestionUsage_roundId_idx" ON "QuizQuestionUsage"("roundId");

-- CreateIndex
CREATE INDEX "QuizQuestionUsage_questionId_idx" ON "QuizQuestionUsage"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestionUsage_sessionId_questionId_key" ON "QuizQuestionUsage"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "QuizQuestion_templateRoundId_idx" ON "QuizQuestion"("templateRoundId");

-- AddForeignKey
ALTER TABLE "QuizTemplateRound" ADD CONSTRAINT "QuizTemplateRound_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_templateRoundId_fkey" FOREIGN KEY ("templateRoundId") REFERENCES "QuizTemplateRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestionUsage" ADD CONSTRAINT "QuizQuestionUsage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestionUsage" ADD CONSTRAINT "QuizQuestionUsage_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "QuizRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestionUsage" ADD CONSTRAINT "QuizQuestionUsage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
