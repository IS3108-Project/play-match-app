import { Router, Request, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware";
import multer from "multer";
import { uploadToR2, deleteFromR2, UploadFolder } from "../config/storage";
import { prisma } from "../config/prisma";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const VALID_FOLDERS: UploadFolder[] = [
  "profiles",
  "activities",
  "groups",
  "discussions",
];

const router = Router();

router.use(requireAuth as any);

router.post("/image", upload.single("image"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No image uploaded" });
    return;
  }

  const folder = (req.query.folder as string) || "activities";
  if (!VALID_FOLDERS.includes(folder as UploadFolder)) {
    res.status(400).json({ error: "Invalid folder" });
    return;
  }

  try {
    const url = await uploadToR2(req.file, folder as UploadFolder);
    res.json({ url });
  } catch (err) {
    console.error("R2 upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Clean up old profile image from R2 when user uploads a new one
router.delete("/profile-image", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (user?.image) {
    await deleteFromR2(user.image).catch((err) =>
      console.error("Failed to delete old profile image from R2:", err)
    );
  }

  res.json({ ok: true });
});

export default router;
