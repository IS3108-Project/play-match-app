import { prisma } from "../config/prisma";
import { ReportStatus } from "../generated/prisma/client";

// ── Users ──────────────────────────────────────────────────────────────

export async function listUsers(filters?: {
  search?: string;
  banned?: boolean;
}) {
  return prisma.user.findMany({
    where: {
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters?.banned !== undefined ? { banned: filters.banned } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      bannedAt: true,
      createdAt: true,
      _count: {
        select: {
          reportsReceived: true,
          hostedActivities: true,
          participations: true,
          authoredDiscussions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      bannedAt: true,
      bio: true,
      sportInterests: true,
      skillLevel: true,
      createdAt: true,
      _count: {
        select: {
          reportsReceived: true,
          reportsFiled: true,
          hostedActivities: true,
          participations: true,
          authoredDiscussions: true,
          authoredComments: true,
        },
      },
    },
  });

  if (!user) throw new Error("NOT_FOUND");

  const reportsAgainst = await prisma.report.findMany({
    where: { reportedUserId: userId },
    include: {
      reporter: { select: { id: true, name: true, image: true } },
      activity: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { ...user, reportsAgainst };
}

export async function banUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("NOT_FOUND");
  if (user.role === "ADMIN") throw new Error("CANNOT_BAN_ADMIN");

  return prisma.user.update({
    where: { id: userId },
    data: { banned: true, bannedAt: new Date() },
  });
}

export async function unbanUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("NOT_FOUND");

  return prisma.user.update({
    where: { id: userId },
    data: { banned: false, bannedAt: null },
  });
}

// ── Reports ────────────────────────────────────────────────────────────

export async function listReports(filters?: { status?: ReportStatus }) {
  return prisma.report.findMany({
    ...(filters?.status ? { where: { status: filters.status } } : {}),
    include: {
      reporter: { select: { id: true, name: true, email: true, image: true } },
      reportedUser: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          banned: true,
        },
      },
      activity: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveReport(
  reportId: string,
  status: "REVIEWED" | "DISMISSED",
  adminNote?: string
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("NOT_FOUND");

  return prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      adminNote: adminNote ?? null,
      resolvedAt: new Date(),
    },
  });
}

// ── Activities (admin moderation) ──────────────────────────────────────

export async function listActivities(filters?: { search?: string }) {
  return prisma.activity.findMany({
    ...(filters?.search
      ? {
          where: {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" as const } },
              { description: { contains: filters.search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    select: {
      id: true,
      title: true,
      activityType: true,
      date: true,
      status: true,
      createdAt: true,
      host: { select: { id: true, name: true, image: true } },
      _count: { select: { participants: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function deleteActivity(activityId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");

  return prisma.activity.delete({ where: { id: activityId } });
}

// ── Discussions (admin moderation) ─────────────────────────────────────

export async function listDiscussions(filters?: { search?: string }) {
  return prisma.discussion.findMany({
    ...(filters?.search
      ? {
          where: {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" as const } },
              { content: { contains: filters.search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function deleteDiscussion(discussionId: string) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
  });
  if (!discussion) throw new Error("NOT_FOUND");

  return prisma.discussion.delete({ where: { id: discussionId } });
}

// ── Dashboard stats ────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    totalUsers,
    bannedUsers,
    totalActivities,
    activeActivities,
    pendingReports,
    totalReports,
    totalDiscussions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { banned: true } }),
    prisma.activity.count(),
    prisma.activity.count({ where: { status: "ACTIVE" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.count(),
    prisma.discussion.count(),
  ]);

  return {
    totalUsers,
    bannedUsers,
    totalActivities,
    activeActivities,
    pendingReports,
    totalReports,
    totalDiscussions,
  };
}
