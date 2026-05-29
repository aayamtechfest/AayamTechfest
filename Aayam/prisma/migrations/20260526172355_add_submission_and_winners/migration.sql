/*
  Warnings:

  - You are about to drop the column `heroBannerUrl` on the `Settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isSubmissionOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "winner1Id" TEXT,
ADD COLUMN     "winner2Id" TEXT,
ADD COLUMN     "winner3Id" TEXT;

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "heroBannerUrl";

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "projectLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_registrationId_key" ON "Submission"("registrationId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_winner1Id_fkey" FOREIGN KEY ("winner1Id") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_winner2Id_fkey" FOREIGN KEY ("winner2Id") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_winner3Id_fkey" FOREIGN KEY ("winner3Id") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
