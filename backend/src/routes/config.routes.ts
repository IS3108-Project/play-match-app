import { Router, Request, Response } from "express";

const router = Router();

// Public endpoint — no auth required.
// The Maps API key is already public (browser-visible, restricted by HTTP referrer).
router.get("/", (_req: Request, res: Response) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null,
  });
});

export default router;
