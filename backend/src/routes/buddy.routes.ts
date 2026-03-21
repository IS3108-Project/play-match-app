import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getPotentialMatches } from "../controllers/buddy.controller";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get potential buddy matches
router.get("/matches", getPotentialMatches);

export default router;
