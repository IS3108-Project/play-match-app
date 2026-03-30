import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/requireAdmin";
import * as ctrl from "../controllers/admin.controller";

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth as any, requireAdmin as any);

router.get("/stats", ctrl.getDashboardStats as any);

// Users
router.get("/users", ctrl.listUsers as any);
router.get("/users/:id", ctrl.getUserDetail as any);
router.post("/users/:id/ban", ctrl.banUser as any);
router.post("/users/:id/unban", ctrl.unbanUser as any);

// Reports
router.get("/reports", ctrl.listReports as any);
router.patch("/reports/:id", ctrl.resolveReport as any);

// Activities
router.get("/activities", ctrl.listActivities as any);
router.delete("/activities/:id", ctrl.deleteActivity as any);

// Discussions
router.get("/discussions", ctrl.listDiscussions as any);
router.delete("/discussions/:id", ctrl.deleteDiscussion as any);

export default router;
