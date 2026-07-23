-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "backgroundPattern" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Event" ADD COLUMN "fontSize" TEXT NOT NULL DEFAULT 'normal';
