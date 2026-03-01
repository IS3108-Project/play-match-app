-- AlterEnum
ALTER TYPE "ParticipantStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "participant" ADD COLUMN     "rejectionNote" TEXT;
