// community.routes.ts
// All routes prefixed with /api/community (registered in routes/index.ts).

import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as ctrl from "../controllers/community.controller";

const router = Router();

router.use(requireAuth as any);

// Groups
router.get("/groups", ctrl.listGroups as any);
router.post("/groups", ctrl.createGroup as any);
router.get("/groups/:id", ctrl.getGroup as any);
router.put("/groups/:id", ctrl.updateGroup as any);
router.delete("/groups/:id", ctrl.deleteGroup as any);
router.post("/groups/:id/join", ctrl.joinGroup as any);
router.delete("/groups/:id/leave", ctrl.leaveGroup as any);

// Discussions
router.get("/discussions", ctrl.listDiscussions as any);
router.post("/discussions", ctrl.createDiscussion as any);
router.get("/discussions/:id", ctrl.getDiscussion as any);
router.put("/discussions/:id", ctrl.updateDiscussion as any);
router.delete("/discussions/:id", ctrl.deleteDiscussion as any);
router.post("/discussions/:id/like", ctrl.toggleDiscussionLike as any);
router.post("/discussions/:id/comments", ctrl.addComment as any);

// Comments
router.delete("/comments/:id", ctrl.deleteComment as any);
router.post("/comments/:id/like", ctrl.toggleCommentLike as any);

export default router;
