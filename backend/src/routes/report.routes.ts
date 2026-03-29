import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as ctrl from "../controllers/report.controller";

const router = Router();

router.use(requireAuth as any);

router.post("/", ctrl.createReport as any);
router.get("/mine", ctrl.getMyReports as any);

export default router;
