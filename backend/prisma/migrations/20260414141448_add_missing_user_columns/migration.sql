-- CreateEnum
CREATE TYPE "ParticipantSource" AS ENUM ('REQUESTED', 'INVITED');

-- AlterTable
ALTER TABLE "activity" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "discussion" ADD COLUMN     "linkedActivityId" TEXT;

-- AlterTable
ALTER TABLE "participant" ADD COLUMN     "source" "ParticipantSource" NOT NULL DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE "report" ADD COLUMN     "adminNote" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "lastLatitude" DOUBLE PRECISION,
ADD COLUMN     "lastLocationAt" TIMESTAMP(3),
ADD COLUMN     "lastLongitude" DOUBLE PRECISION,
ADD COLUMN     "locationSharingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchRadius" INTEGER NOT NULL DEFAULT 25;

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_log_adminId_idx" ON "admin_audit_log"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_targetType_targetId_idx" ON "admin_audit_log"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "discussion" ADD CONSTRAINT "discussion_linkedActivityId_fkey" FOREIGN KEY ("linkedActivityId") REFERENCES "activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
