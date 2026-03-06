// src/controllers/user.controller.ts
import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { AuthRequest } from "../middleware/auth.middleware";

/** GET /api/users/:id/profile — public profile + stats */
export async function getUserProfile(req: AuthRequest, res: Response) {
  try {
    const viewerId = req.user?.id ?? "";
    const profile = await userService.getUserProfile(
      viewerId,
      req.params.id as string,
    );
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(profile);
  } catch (error) {
    console.error("Failed to get user profile:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
}

/** PATCH /api/users/me — update own profile fields */
export async function updateMyProfile(req: AuthRequest, res: Response) {
  try {
    const updated = await userService.updateUserProfile(req.user.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}
