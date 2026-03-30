-- AlterTable
ALTER TABLE "user" ADD COLUMN     "activityRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
