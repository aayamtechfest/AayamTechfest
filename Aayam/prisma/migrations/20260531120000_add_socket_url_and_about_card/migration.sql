-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "socketUrl" TEXT;

-- CreateTable
CREATE TABLE "AboutCard" (
    "id" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutCard_pkey" PRIMARY KEY ("id")
);
