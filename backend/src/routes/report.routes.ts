import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as ctrl from "../controllers/report.controller";

const router = Router();

router.use(requireAuth as any);

// POST   /api/reports          — submit a new report
router.post("/", ctrl.createReport as any);

// GET    /api/reports/admin    — admin queue (role checked in controller)
router.get("/admin", ctrl.getAdminReports as any);

// PATCH  /api/reports/:id      — resolve / dismiss a report (role checked in controller)
router.patch("/:id", ctrl.resolveReport as any);

export default router;
