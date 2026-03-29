import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as reportService from "../services/report.service";

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const report = await reportService.createReport(req.user.id, req.body);
    res.status(201).json(report);
  } catch (error) {
    console.error("Failed to create report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
}

export async function getMyReports(req: AuthRequest, res: Response) {
  try {
    const reports = await reportService.getMyReports(req.user.id);
    res.json(reports);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
}
