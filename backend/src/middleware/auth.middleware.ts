import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../config/prisma";

export interface AuthRequest extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Check if user is banned
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true },
  });

  if (dbUser?.banned) {
    res.status(403).json({ error: "Your account has been banned. Please contact support." });
    return;
  }

  (req as AuthRequest).user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role ?? "USER",
  };

  next();
}
