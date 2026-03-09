import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as reportService from "../services/report.service";

/** POST /api/reports — submit a report */
export async function createReport(req: AuthRequest, res: Response) {
  try {
    const { reportedUserId, activityId, type, details, anonymous } = req.body;

    if (!reportedUserId || !type || !details) {
      res
        .status(400)
        .json({ error: "reportedUserId, type, and details are required" });
      return;
    }

    await reportService.createReport(req.user.id, {
      reportedUserId,
      activityId,
      type,
      details,
      anonymous: anonymous ?? false,
    });

    res.status(201).json({ message: "Report submitted" });
  } catch (error: any) {
    if (error.message === "CANNOT_REPORT_SELF") {
      res.status(400).json({ error: "You cannot report yourself" });
      return;
    }
    if (error.message === "INVALID_TYPE") {
      res.status(400).json({ error: "Invalid report type" });
      return;
    }
    if (error.message === "USER_NOT_FOUND") {
      res.status(404).json({ error: "Reported user not found" });
      return;
    }
    console.error("Failed to create report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
}

/** GET /api/reports/admin — admin queue (ADMIN role only) */
export async function getAdminReports(req: AuthRequest, res: Response) {
  try {
    if (req.user.role !== "ADMIN") {
      res.status(403).json({ error: "Admins only" });
      return;
    }

    const { status } = req.query;
    const reports = await reportService.getAdminReports(
      status ? { status: status as string } : undefined,
    );
    res.json(reports);
  } catch (error) {
    console.error("Failed to get reports:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
}

/** PATCH /api/reports/:id — resolve a report (ADMIN role only) */
export async function resolveReport(req: AuthRequest, res: Response) {
  try {
    if (req.user.role !== "ADMIN") {
      res.status(403).json({ error: "Admins only" });
      return;
    }

    const { status } = req.body;
    if (!["REVIEWED", "DISMISSED"].includes(status)) {
      res.status(400).json({ error: "Status must be REVIEWED or DISMISSED" });
      return;
    }

    const updated = await reportService.resolveReport(
      req.params.id as string,
      status,
    );
    res.json(updated);
  } catch (error) {
    console.error("Failed to resolve report:", error);
    res.status(500).json({ error: "Failed to resolve report" });
  }
}
