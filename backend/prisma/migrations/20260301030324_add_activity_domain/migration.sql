-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('CONFIRMED', 'PENDING', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" "ActivityStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageSrc" TEXT,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'CONFIRMED',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_hostId_idx" ON "activity"("hostId");

-- CreateIndex
CREATE INDEX "activity_date_idx" ON "activity"("date");

-- CreateIndex
CREATE INDEX "activity_status_idx" ON "activity"("status");

-- CreateIndex
CREATE INDEX "participant_activityId_status_idx" ON "participant"("activityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "participant_userId_activityId_key" ON "participant"("userId", "activityId");

-- CreateIndex
CREATE INDEX "guest_activityId_idx" ON "guest"("activityId");

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
