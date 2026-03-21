// src/controllers/user.controller.ts
import { Request, Response } from "express";
import * as userService from "../services/user.service";

export const getUsers = async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.json(users);
};

export const getUser = async (req: Request, res: Response) => {
  const user = await userService.getUserById(Number(req.params.id));

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
};

export const updateLocationSharing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "enabled must be a boolean" });
    }

    const result = await userService.updateLocationSharing(userId, enabled);
    res.json(result);
  } catch (error) {
    console.error("Error updating location sharing:", error);
    res.status(500).json({ error: "Failed to update location sharing" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      preferredAreas,
      skillLevel,
      sportInterests,
      preferredTimes,
      locationSharingEnabled,
      image,
      bio,
    } = req.body;

    const result = await userService.updateProfile(userId, {
      name,
      preferredAreas,
      skillLevel,
      sportInterests,
      preferredTimes,
      locationSharingEnabled,
      image,
      bio,
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
