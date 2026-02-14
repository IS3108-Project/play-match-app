-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "completedSteps" TEXT,
ADD COLUMN     "preferredAreas" TEXT[],
ADD COLUMN     "preferredTimes" TEXT[],
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "shouldOnboard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "skillLevel" TEXT,
ADD COLUMN     "sportInterests" TEXT[];
