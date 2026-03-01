import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../public/uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.use(requireAuth as any);

router.post("/image", upload.single("image"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No image uploaded" });
    return;
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

export default router;
