/*
  Warnings:

  - You are about to drop the `AboutCard` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "questionSet" TEXT DEFAULT 'A';

-- DropTable
DROP TABLE "AboutCard";
