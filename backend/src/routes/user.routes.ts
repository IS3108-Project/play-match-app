import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getUserProfile,
  updateMyProfile,
} from "../controllers/user.controller";

const router = Router();

// All user routes require auth
router.use(requireAuth as any);

// GET /api/users/:id/profile  — works for own profile and other users
router.get("/:id/profile", getUserProfile as any);

// PATCH /api/users/me  — update own editable profile fields (bio, etc.)
router.patch("/me", updateMyProfile as any);

export default router;
