import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as adminService from "../services/admin.service";

// Helper to parse common query params
function parsePaginationAndSort(query: any) {
  return {
    page: query.page ? parseInt(query.page as string, 10) : undefined,
    limit: query.limit ? parseInt(query.limit as string, 10) : undefined,
    sortBy: typeof query.sortBy === "string" ? query.sortBy : undefined,
    sortOrder: query.sortOrder === "asc" || query.sortOrder === "desc" ? query.sortOrder : undefined,
  };
}

export async function getDashboardStats(_req: AuthRequest, res: Response) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}

// ── Users ──────────────────────────────────────────────────────────────

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const { page, limit, sortBy, sortOrder } = parsePaginationAndSort(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const bannedParam = typeof req.query.banned === "string" ? req.query.banned : undefined;
    const banned = bannedParam === "true" ? true : bannedParam === "false" ? false : undefined;
    const hasReports = req.query.hasReports === "true" ? true : undefined;
    const role = req.query.role === "USER" || req.query.role === "ADMIN" ? req.query.role : undefined;

    const result = await adminService.listUsers({
      ...(page && { page }),
      ...(limit && { limit }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...(search && { search }),
      ...(banned !== undefined && { banned }),
      ...(hasReports && { hasReports }),
      ...(role && { role }),
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to list users:", error);
    res.status(500).json({ error: "Failed to list users" });
  }
}

export async function getUserDetail(req: AuthRequest, res: Response) {
  try {
    const user = await adminService.getUserDetail(req.params.id as string);
    res.json(user);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("Failed to fetch user detail:", error);
    res.status(500).json({ error: "Failed to fetch user detail" });
  }
}

export async function banUser(req: AuthRequest, res: Response) {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;
    await adminService.banUser(req.params.id as string, req.user!.id, reason);
    res.json({ message: "User banned" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (error.message === "CANNOT_BAN_ADMIN") {
      res.status(400).json({ error: "Cannot ban an admin user" });
      return;
    }
    console.error("Failed to ban user:", error);
    res.status(500).json({ error: "Failed to ban user" });
  }
}

export async function unbanUser(req: AuthRequest, res: Response) {
  try {
    await adminService.unbanUser(req.params.id as string, req.user!.id);
    res.json({ message: "User unbanned" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("Failed to unban user:", error);
    res.status(500).json({ error: "Failed to unban user" });
  }
}

// Bulk ban users
export async function bulkBanUsers(req: AuthRequest, res: Response) {
  try {
    const { userIds, reason } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: "userIds array is required" });
      return;
    }
    const result = await adminService.bulkBanUsers(userIds, req.user!.id, reason);
    res.json(result);
  } catch (error) {
    console.error("Failed to bulk ban users:", error);
    res.status(500).json({ error: "Failed to bulk ban users" });
  }
}

// Bulk unban users
export async function bulkUnbanUsers(req: AuthRequest, res: Response) {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: "userIds array is required" });
      return;
    }
    const result = await adminService.bulkUnbanUsers(userIds, req.user!.id);
    res.json(result);
  } catch (error) {
    console.error("Failed to bulk unban users:", error);
    res.status(500).json({ error: "Failed to bulk unban users" });
  }
}

// ── Reports ────────────────────────────────────────────────────────────

export async function listReports(req: AuthRequest, res: Response) {
  try {
    const { page, limit, sortBy, sortOrder } = parsePaginationAndSort(req.query);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const result = await adminService.listReports({
      ...(page && { page }),
      ...(limit && { limit }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...(status && { status: status as any }),
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to list reports:", error);
    res.status(500).json({ error: "Failed to list reports" });
  }
}

export async function resolveReport(req: AuthRequest, res: Response) {
  try {
    const { status, adminNote } = req.body;
    await adminService.resolveReport(req.params.id as string, status, req.user!.id, adminNote);
    res.json({ message: "Report updated" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    console.error("Failed to resolve report:", error);
    res.status(500).json({ error: "Failed to resolve report" });
  }
}

// Bulk resolve reports
export async function bulkResolveReports(req: AuthRequest, res: Response) {
  try {
    const { reportIds, status, adminNote } = req.body;
    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      res.status(400).json({ error: "reportIds array is required" });
      return;
    }
    if (status !== "REVIEWED" && status !== "DISMISSED") {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const result = await adminService.bulkResolveReports(reportIds, status, req.user!.id, adminNote);
    res.json(result);
  } catch (error) {
    console.error("Failed to bulk resolve reports:", error);
    res.status(500).json({ error: "Failed to bulk resolve reports" });
  }
}

// ── Activities ─────────────────────────────────────────────────────────

export async function listActivities(req: AuthRequest, res: Response) {
  try {
    const { page, limit, sortBy, sortOrder } = parsePaginationAndSort(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const result = await adminService.listActivities({
      ...(page && { page }),
      ...(limit && { limit }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...(search && { search }),
      ...(status && { status }),
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to list activities:", error);
    res.status(500).json({ error: "Failed to list activities" });
  }
}

export async function deleteActivity(req: AuthRequest, res: Response) {
  try {
    await adminService.deleteActivity(req.params.id as string, req.user!.id);
    res.json({ message: "Activity deleted" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    console.error("Failed to delete activity:", error);
    res.status(500).json({ error: "Failed to delete activity" });
  }
}

// Bulk delete activities
export async function bulkDeleteActivities(req: AuthRequest, res: Response) {
  try {
    const { activityIds } = req.body;
    if (!Array.isArray(activityIds) || activityIds.length === 0) {
      res.status(400).json({ error: "activityIds array is required" });
      return;
    }
    const result = await adminService.bulkDeleteActivities(activityIds, req.user!.id);
    res.json(result);
  } catch (error) {
    console.error("Failed to bulk delete activities:", error);
    res.status(500).json({ error: "Failed to bulk delete activities" });
  }
}

// ── Discussions ────────────────────────────────────────────────────────

export async function listDiscussions(req: AuthRequest, res: Response) {
  try {
    const { page, limit, sortBy, sortOrder } = parsePaginationAndSort(req.query);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const result = await adminService.listDiscussions({
      ...(page && { page }),
      ...(limit && { limit }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...(search && { search }),
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to list discussions:", error);
    res.status(500).json({ error: "Failed to list discussions" });
  }
}

export async function deleteDiscussion(req: AuthRequest, res: Response) {
  try {
    await adminService.deleteDiscussion(req.params.id as string, req.user!.id);
    res.json({ message: "Discussion deleted" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Discussion not found" });
      return;
    }
    console.error("Failed to delete discussion:", error);
    res.status(500).json({ error: "Failed to delete discussion" });
  }
}

// Bulk delete discussions
export async function bulkDeleteDiscussions(req: AuthRequest, res: Response) {
  try {
    const { discussionIds } = req.body;
    if (!Array.isArray(discussionIds) || discussionIds.length === 0) {
      res.status(400).json({ error: "discussionIds array is required" });
      return;
    }
    const result = await adminService.bulkDeleteDiscussions(discussionIds, req.user!.id);
    res.json(result);
  } catch (error) {
    console.error("Failed to bulk delete discussions:", error);
    res.status(500).json({ error: "Failed to bulk delete discussions" });
  }
}

// ── Audit Logs ─────────────────────────────────────────────────────────

export async function listAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { page, limit } = parsePaginationAndSort(req.query);
    const adminId = typeof req.query.adminId === "string" ? req.query.adminId : undefined;
    const result = await adminService.listAuditLogs({
      ...(page && { page }),
      ...(limit && { limit }),
      ...(adminId && { adminId }),
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to list audit logs:", error);
    res.status(500).json({ error: "Failed to list audit logs" });
  }
}

// ── Export ─────────────────────────────────────────────────────────────

export async function exportUsers(_req: AuthRequest, res: Response) {
  try {
    const users = await adminService.exportUsers();
    
    // Convert to CSV
    const headers = ["ID", "Name", "Email", "Role", "Banned", "Banned At", "Bio", "Sport Interests", "Skill Level", "Created At", "Reports Received", "Activities Hosted", "Participations", "Discussions"];
    const rows = users.map(u => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      u.email,
      u.role,
      u.banned,
      u.bannedAt ?? "",
      `"${(u.bio ?? "").replace(/"/g, '""')}"`,
      `"${u.sportInterests.join(", ")}"`,
      u.skillLevel ?? "",
      u.createdAt,
      u._count.reportsReceived,
      u._count.hostedActivities,
      u._count.participations,
      u._count.authoredDiscussions,
    ].join(","));
    
    const csv = [headers.join(","), ...rows].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="users-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Failed to export users:", error);
    res.status(500).json({ error: "Failed to export users" });
  }
}

export async function exportActivities(_req: AuthRequest, res: Response) {
  try {
    const activities = await adminService.exportActivities();
    
    const headers = ["ID", "Title", "Description", "Type", "Date", "Start Time", "End Time", "Location", "Skill Level", "Max Participants", "Status", "Created At", "Host ID", "Host Name", "Host Email", "Participants", "Reports"];
    const rows = activities.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      a.activityType,
      a.date,
      a.startTime,
      a.endTime,
      `"${a.location.replace(/"/g, '""')}"`,
      a.skillLevel,
      a.maxParticipants,
      a.status,
      a.createdAt,
      a.host.id,
      `"${a.host.name.replace(/"/g, '""')}"`,
      a.host.email,
      a._count.participants,
      a._count.reports,
    ].join(","));
    
    const csv = [headers.join(","), ...rows].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="activities-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Failed to export activities:", error);
    res.status(500).json({ error: "Failed to export activities" });
  }
}

export async function exportReports(_req: AuthRequest, res: Response) {
  try {
    const reports = await adminService.exportReports();
    
    const headers = ["ID", "Type", "Details", "Anonymous", "Status", "Admin Note", "Created At", "Resolved At", "Reporter ID", "Reporter Name", "Reporter Email", "Reported User ID", "Reported User Name", "Reported User Email", "Activity ID", "Activity Title"];
    const rows = reports.map(r => [
      r.id,
      r.type,
      `"${r.details.replace(/"/g, '""')}"`,
      r.anonymous,
      r.status,
      `"${(r.adminNote ?? "").replace(/"/g, '""')}"`,
      r.createdAt,
      r.resolvedAt ?? "",
      r.reporter.id,
      `"${r.reporter.name.replace(/"/g, '""')}"`,
      r.reporter.email,
      r.reportedUser.id,
      `"${r.reportedUser.name.replace(/"/g, '""')}"`,
      r.reportedUser.email,
      r.activity?.id ?? "",
      r.activity ? `"${r.activity.title.replace(/"/g, '""')}"` : "",
    ].join(","));
    
    const csv = [headers.join(","), ...rows].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="reports-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Failed to export reports:", error);
    res.status(500).json({ error: "Failed to export reports" });
  }
}

export async function exportAuditLogs(_req: AuthRequest, res: Response) {
  try {
    const logs = await adminService.exportAuditLogs();
    
    const headers = ["ID", "Admin ID", "Action", "Target Type", "Target ID", "Details", "Created At"];
    const rows = logs.map(l => [
      l.id,
      l.adminId,
      l.action,
      l.targetType,
      l.targetId,
      `"${JSON.stringify(l.details ?? {}).replace(/"/g, '""')}"`,
      l.createdAt,
    ].join(","));
    
    const csv = [headers.join(","), ...rows].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Failed to export audit logs:", error);
    res.status(500).json({ error: "Failed to export audit logs" });
  }
}
