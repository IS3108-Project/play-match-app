import { prisma } from "../config/prisma";

// ── Create Report ─────────────────────────────────────────────────────────────

export async function createReport(
  reporterId: string,
  input: {
    reportedUserId: string;
    activityId?: string;
    type: string;
    details: string;
    anonymous: boolean;
  },
) {
  // Can't report yourself
  if (reporterId === input.reportedUserId)
    throw new Error("CANNOT_REPORT_SELF");

  // Validate report type
  const validTypes = [
    "NO_SHOW",
    "RUDE_UNSAFE",
    "MISREPRESENTED",
    "SPAM",
    "OTHER",
  ];
  if (!validTypes.includes(input.type)) throw new Error("INVALID_TYPE");

  // Check reported user exists
  const reportedUser = await prisma.user.findUnique({
    where: { id: input.reportedUserId },
  });
  if (!reportedUser) throw new Error("USER_NOT_FOUND");

  return prisma.report.create({
    data: {
      reporterId,
      reportedUserId: input.reportedUserId,
      activityId: input.activityId ?? null,
      type: input.type as any,
      details: input.details,
      anonymous: input.anonymous,
    },
  });
}

// ── Admin: list reports ───────────────────────────────────────────────────────

export async function getAdminReports(filter?: { status?: string }) {
  return prisma.report.findMany({
    ...(filter?.status && { where: { status: filter.status as any } }),
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, name: true, image: true },
      },
      reportedUser: {
        select: {
          id: true,
          name: true,
          image: true,
          _count: { select: { reportsReceived: true } },
        },
      },
      activity: {
        select: { id: true, title: true },
      },
    },
  });
}

// ── Admin: update report status ───────────────────────────────────────────────

export async function resolveReport(
  reportId: string,
  status: "REVIEWED" | "DISMISSED",
) {
  return prisma.report.update({
    where: { id: reportId },
    data: { status, resolvedAt: new Date() },
  });
}
