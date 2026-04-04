import { prisma } from "../config/prisma";
import { ReportStatus, Prisma } from "../generated/prisma/client";

// ── Types ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserFilters extends PaginationParams, SortParams {
  search?: string;
  banned?: boolean;
  hasReports?: boolean;
  role?: "USER" | "ADMIN";
}

export interface ActivityFilters extends PaginationParams, SortParams {
  search?: string;
  status?: string;
}

export interface DiscussionFilters extends PaginationParams, SortParams {
  search?: string;
}

export interface ReportFilters extends PaginationParams, SortParams {
  status?: ReportStatus;
}

// ── Audit Log ──────────────────────────────────────────────────────────

export async function createAuditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  return prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      ...(details && { details: details as Prisma.InputJsonValue }),
    },
  });
}

export async function listAuditLogs(filters?: PaginationParams & { adminId?: string }) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
  const skip = (page - 1) * limit;

  const where = filters?.adminId ? { adminId: filters.adminId } : {};

  const [items, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  // Fetch admin user info for each log
  const adminIds = [...new Set(items.map(i => i.adminId))];
  const admins = await prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, name: true, image: true },
  });
  const adminMap = new Map(admins.map(a => [a.id, a]));

  const itemsWithAdmin = items.map(item => ({
    ...item,
    admin: adminMap.get(item.adminId) || null,
  }));

  return {
    items: itemsWithAdmin,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Users ──────────────────────────────────────────────────────────────

export async function listUsers(filters?: UserFilters) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
  const skip = (page - 1) * limit;
  const sortBy = filters?.sortBy ?? "createdAt";
  const sortOrder = filters?.sortOrder ?? "desc";

  // Build where clause
  const where: any = {};
  
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  
  if (filters?.banned !== undefined) {
    where.banned = filters.banned;
  }
  
  if (filters?.role) {
    where.role = filters.role;
  }
  
  if (filters?.hasReports) {
    where.reportsReceived = { some: {} };
  }

  // Build orderBy
  let orderBy: any = { [sortBy]: sortOrder };
  if (sortBy === "reportsCount") {
    orderBy = { reportsReceived: { _count: sortOrder } };
  } else if (sortBy === "activitiesCount") {
    orderBy = { hostedActivities: { _count: sortOrder } };
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

export async function banUser(userId: string, adminId: string, reason?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("NOT_FOUND");
  if (user.role === "ADMIN") throw new Error("CANNOT_BAN_ADMIN");

  const result = await prisma.user.update({
    where: { id: userId },
    data: { banned: true, bannedAt: new Date() },
  });

  // Audit log with user name
  await createAuditLog(adminId, "BAN_USER", "USER", userId, { 
    targetName: user.name,
    reason,
  });

  return result;
}

export async function unbanUser(userId: string, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("NOT_FOUND");

  const result = await prisma.user.update({
    where: { id: userId },
    data: { banned: false, bannedAt: null },
  });

  // Audit log with user name
  await createAuditLog(adminId, "UNBAN_USER", "USER", userId, {
    targetName: user.name,
  });

  return result;
}

// Bulk ban users
export async function bulkBanUsers(userIds: string[], adminId: string, reason?: string) {
  // Filter out admins
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, role: { not: "ADMIN" } },
    select: { id: true, name: true },
  });
  
  const validIds = users.map(u => u.id);
  const userMap = new Map(users.map(u => [u.id, u.name]));
  
  const result = await prisma.user.updateMany({
    where: { id: { in: validIds } },
    data: { banned: true, bannedAt: new Date() },
  });

  // Audit logs with user names
  for (const id of validIds) {
    await createAuditLog(adminId, "BAN_USER", "USER", id, { 
      targetName: userMap.get(id),
      reason, 
      bulk: true,
    });
  }

  return { count: result.count, skipped: userIds.length - validIds.length };
}

// Bulk unban users
export async function bulkUnbanUsers(userIds: string[], adminId: string) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map(u => [u.id, u.name]));

  const result = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { banned: false, bannedAt: null },
  });

  for (const id of userIds) {
    await createAuditLog(adminId, "UNBAN_USER", "USER", id, { 
      targetName: userMap.get(id),
      bulk: true,
    });
  }

  return { count: result.count };
}

// ── Reports ────────────────────────────────────────────────────────────

export async function listReports(filters?: ReportFilters) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
  const skip = (page - 1) * limit;
  const sortBy = filters?.sortBy ?? "createdAt";
  const sortOrder = filters?.sortOrder ?? "desc";

  const where = filters?.status ? { status: filters.status } : {};

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
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
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function resolveReport(
  reportId: string,
  status: "REVIEWED" | "DISMISSED",
  adminId: string,
  adminNote?: string
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("NOT_FOUND");

  const result = await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      adminNote: adminNote ?? null,
      resolvedAt: new Date(),
    },
  });

  // Audit log
  await createAuditLog(adminId, "RESOLVE_REPORT", "REPORT", reportId, { status, adminNote });

  return result;
}

// Bulk resolve reports
export async function bulkResolveReports(
  reportIds: string[],
  status: "REVIEWED" | "DISMISSED",
  adminId: string,
  adminNote?: string
) {
  const result = await prisma.report.updateMany({
    where: { id: { in: reportIds }, status: "PENDING" },
    data: {
      status,
      adminNote: adminNote ?? null,
      resolvedAt: new Date(),
    },
  });

  for (const id of reportIds) {
    await createAuditLog(adminId, "RESOLVE_REPORT", "REPORT", id, { status, adminNote, bulk: true });
  }

  return { count: result.count };
}

// ── Activities (admin moderation) ──────────────────────────────────────

export async function listActivities(filters?: ActivityFilters) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
  const skip = (page - 1) * limit;
  const sortBy = filters?.sortBy ?? "createdAt";
  const sortOrder = filters?.sortOrder ?? "desc";

  const where: any = {};
  
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" as const } },
      { description: { contains: filters.search, mode: "insensitive" as const } },
    ];
  }
  
  if (filters?.status) {
    where.status = filters.status;
  }

  // Build orderBy
  let orderBy: any = { [sortBy]: sortOrder };
  if (sortBy === "participantsCount") {
    orderBy = { participants: { _count: sortOrder } };
  } else if (sortBy === "reportsCount") {
    orderBy = { reports: { _count: sortOrder } };
  }

  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function deleteActivity(activityId: string, adminId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");

  const result = await prisma.activity.delete({ where: { id: activityId } });

  // Audit log
  await createAuditLog(adminId, "DELETE_ACTIVITY", "ACTIVITY", activityId, { title: activity.title });

  return result;
}

// Bulk delete activities
export async function bulkDeleteActivities(activityIds: string[], adminId: string) {
  const activities = await prisma.activity.findMany({
    where: { id: { in: activityIds } },
    select: { id: true, title: true },
  });

  const result = await prisma.activity.deleteMany({
    where: { id: { in: activityIds } },
  });

  for (const activity of activities) {
    await createAuditLog(adminId, "DELETE_ACTIVITY", "ACTIVITY", activity.id, { title: activity.title, bulk: true });
  }

  return { count: result.count };
}

// ── Discussions (admin moderation) ─────────────────────────────────────

export async function listDiscussions(filters?: DiscussionFilters) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
  const skip = (page - 1) * limit;
  const sortBy = filters?.sortBy ?? "createdAt";
  const sortOrder = filters?.sortOrder ?? "desc";

  const where: any = {};
  
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" as const } },
      { content: { contains: filters.search, mode: "insensitive" as const } },
    ];
  }

  // Build orderBy
  let orderBy: any = { [sortBy]: sortOrder };
  if (sortBy === "likesCount") {
    orderBy = { likes: { _count: sortOrder } };
  } else if (sortBy === "commentsCount") {
    orderBy = { comments: { _count: sortOrder } };
  }

  const [items, total] = await Promise.all([
    prisma.discussion.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
        group: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.discussion.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function deleteDiscussion(discussionId: string, adminId: string) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
  });
  if (!discussion) throw new Error("NOT_FOUND");

  const result = await prisma.discussion.delete({ where: { id: discussionId } });

  // Audit log
  await createAuditLog(adminId, "DELETE_DISCUSSION", "DISCUSSION", discussionId, { title: discussion.title });

  return result;
}

// Bulk delete discussions
export async function bulkDeleteDiscussions(discussionIds: string[], adminId: string) {
  const discussions = await prisma.discussion.findMany({
    where: { id: { in: discussionIds } },
    select: { id: true, title: true },
  });

  const result = await prisma.discussion.deleteMany({
    where: { id: { in: discussionIds } },
  });

  for (const discussion of discussions) {
    await createAuditLog(adminId, "DELETE_DISCUSSION", "DISCUSSION", discussion.id, { title: discussion.title, bulk: true });
  }

  return { count: result.count };
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

// ── Export functions ───────────────────────────────────────────────────

export async function exportUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
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
          hostedActivities: true,
          participations: true,
          authoredDiscussions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
}

export async function exportActivities() {
  const activities = await prisma.activity.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      activityType: true,
      date: true,
      startTime: true,
      endTime: true,
      location: true,
      skillLevel: true,
      maxParticipants: true,
      status: true,
      createdAt: true,
      host: { select: { id: true, name: true, email: true } },
      _count: { select: { participants: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return activities;
}

export async function exportReports() {
  const reports = await prisma.report.findMany({
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      reportedUser: { select: { id: true, name: true, email: true } },
      activity: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return reports;
}

export async function exportAuditLogs() {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
  });

  return logs;
}
