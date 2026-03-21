import { Router } from "express";
import { getUser, getUsers, updateLocationSharing, updateProfile } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.patch("/location-sharing", requireAuth, updateLocationSharing);
router.patch("/profile", requireAuth, updateProfile);

export default router;
