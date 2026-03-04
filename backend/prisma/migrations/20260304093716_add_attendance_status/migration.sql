/*
  Warnings:

  - You are about to drop the column `attended` on the `participant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'ATTENDED', 'NO_SHOW', 'LATE_CANCEL', 'CANCELLED');

-- AlterTable
ALTER TABLE "participant" DROP COLUMN "attended",
ADD COLUMN     "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'PENDING';
