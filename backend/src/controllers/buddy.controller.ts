import { Request, Response } from "express";
import * as buddyService from "../services/buddy.service";

export const getPotentialMatches = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matches = await buddyService.getPotentialMatches(userId);
    res.json(matches);
  } catch (error) {
    console.error("Failed to get potential matches:", error);
    res.status(500).json({ error: "Failed to get matches" });
  }
};
