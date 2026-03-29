import { prisma } from "../config/prisma";
import { ReportType } from "../generated/prisma/client";

interface CreateReportInput {
  reportedUserId: string;
  activityId?: string;
  discussionId?: string;
  type: ReportType;
  details: string;
  anonymous: boolean;
}

export async function createReport(reporterId: string, data: CreateReportInput) {
  return prisma.report.create({
    data: {
      id: crypto.randomUUID(),
      reporterId,
      reportedUserId: data.reportedUserId,
      activityId: data.activityId ?? null,
      type: data.type,
      details: data.details,
      anonymous: data.anonymous,
    },
  });
}

export async function getMyReports(userId: string) {
  return prisma.report.findMany({
    where: { reporterId: userId },
    include: {
      reportedUser: { select: { id: true, name: true, image: true } },
      activity: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
