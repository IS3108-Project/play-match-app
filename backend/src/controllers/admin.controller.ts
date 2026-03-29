import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as adminService from "../services/admin.service";

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
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const bannedParam = typeof req.query.banned === "string" ? req.query.banned : undefined;
    const banned =
      bannedParam === "true" ? true : bannedParam === "false" ? false : undefined;

    const filters: { search?: string; banned?: boolean } = {};
    if (search) filters.search = search;
    if (banned !== undefined) filters.banned = banned;

    const users = await adminService.listUsers(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    res.json(users);
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
    await adminService.banUser(req.params.id as string);
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
    await adminService.unbanUser(req.params.id as string);
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

// ── Reports ────────────────────────────────────────────────────────────

export async function listReports(req: AuthRequest, res: Response) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const reports = await adminService.listReports(
      status ? { status: status as any } : undefined
    );
    res.json(reports);
  } catch (error) {
    console.error("Failed to list reports:", error);
    res.status(500).json({ error: "Failed to list reports" });
  }
}

export async function resolveReport(req: AuthRequest, res: Response) {
  try {
    const { status, adminNote } = req.body;
    await adminService.resolveReport(req.params.id as string, status, adminNote);
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

// ── Activities ─────────────────────────────────────────────────────────

export async function listActivities(req: AuthRequest, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const activities = await adminService.listActivities(
      search ? { search } : undefined
    );
    res.json(activities);
  } catch (error) {
    console.error("Failed to list activities:", error);
    res.status(500).json({ error: "Failed to list activities" });
  }
}

export async function deleteActivity(req: AuthRequest, res: Response) {
  try {
    await adminService.deleteActivity(req.params.id as string);
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

// ── Discussions ────────────────────────────────────────────────────────

export async function listDiscussions(req: AuthRequest, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const discussions = await adminService.listDiscussions(
      search ? { search } : undefined
    );
    res.json(discussions);
  } catch (error) {
    console.error("Failed to list discussions:", error);
    res.status(500).json({ error: "Failed to list discussions" });
  }
}

export async function deleteDiscussion(req: AuthRequest, res: Response) {
  try {
    await adminService.deleteDiscussion(req.params.id as string);
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
