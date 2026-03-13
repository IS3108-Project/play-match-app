-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'ATTENDED', 'NO_SHOW', 'LATE_CANCEL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('NO_SHOW', 'RUDE_UNSAFE', 'MISREPRESENTED', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- AlterTable: replace attended boolean with attendanceStatus enum
ALTER TABLE "participant" DROP COLUMN "attended";
ALTER TABLE "participant" ADD COLUMN "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable: add bio to user
ALTER TABLE "user" ADD COLUMN "bio" TEXT;

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "activityId" TEXT,
    "type" "ReportType" NOT NULL,
    "details" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_createdAt_idx" ON "report"("createdAt");

-- CreateIndex
CREATE INDEX "report_reportedUserId_idx" ON "report"("reportedUserId");

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
