// community.controller.ts
// Reads request data, calls community service, sends response.

import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as communityService from "../services/community.service";

// GET /api/community/groups
export async function listGroups(req: AuthRequest, res: Response) {
  try {
    const groups = await communityService.getGroups(req.user.id);
    res.json(groups);
  } catch (err) {
    console.error("listGroups error:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
}

// POST /api/community/groups
export async function createGroup(req: AuthRequest, res: Response) {
  const { name, description, icon, iconBgColor, profileImageUrl } = req.body;
  if (!name || !description || !icon || !iconBgColor) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const group = await communityService.createGroup(req.user.id, {
      name,
      description,
      icon,
      iconBgColor,
      profileImageUrl,
    });
    res.status(201).json(group);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return res.status(409).json({ error: "A group with that name already exists" });
    }
    console.error("createGroup error:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
}

// GET /api/community/groups/:id
export async function getGroup(req: AuthRequest, res: Response) {
  try {
    const group = await communityService.getGroupById(String(req.params.id), req.user.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    console.error("getGroup error:", err);
    res.status(500).json({ error: "Failed to fetch group" });
  }
}

// POST /api/community/groups/:id/join
export async function joinGroup(req: AuthRequest, res: Response) {
  try {
    await communityService.joinGroup(String(req.params.id), req.user.id);
    res.status(200).json({ message: "Joined group" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return res.status(409).json({ error: "Already a member" });
    }
    console.error("joinGroup error:", err);
    res.status(500).json({ error: "Failed to join group" });
  }
}

// PUT /api/community/groups/:id
export async function updateGroup(req: AuthRequest, res: Response) {
  const { name, description, icon, iconBgColor, profileImageUrl } = req.body;
  try {
    const group = await communityService.updateGroup(String(req.params.id), req.user.id, {
      name, description, icon, iconBgColor, profileImageUrl,
    });
    res.json(group);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return res.status(404).json({ error: "Group not found" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "Not the group owner" });
    console.error("updateGroup error:", err);
    res.status(500).json({ error: "Failed to update group" });
  }
}

// DELETE /api/community/groups/:id
export async function deleteGroup(req: AuthRequest, res: Response) {
  try {
    await communityService.deleteGroup(String(req.params.id), req.user.id);
    res.status(200).json({ message: "Group deleted" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return res.status(404).json({ error: "Group not found" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "Not the group owner" });
    console.error("deleteGroup error:", err);
    res.status(500).json({ error: "Failed to delete group" });
  }
}

// DELETE /api/community/groups/:id/leave
export async function leaveGroup(req: AuthRequest, res: Response) {
  try {
    await communityService.leaveGroup(String(req.params.id), req.user.id);
    res.status(200).json({ message: "Left group" });
  } catch (err) {
    console.error("leaveGroup error:", err);
    res.status(500).json({ error: "Failed to leave group" });
  }
}

// GET /api/community/discussions
export async function listDiscussions(req: AuthRequest, res: Response) {
  const myGroups = req.query.myGroups === "true";
  try {
    const discussions = await communityService.getDiscussions(req.user.id, myGroups);
    res.json(discussions);
  } catch (err) {
    console.error("listDiscussions error:", err);
    res.status(500).json({ error: "Failed to fetch discussions" });
  }
}

// POST /api/community/discussions
export async function createDiscussion(req: AuthRequest, res: Response) {
  const { title, content, imageUrl, groupId, isPublic } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  try {
    const discussion = await communityService.createDiscussion(req.user.id, {
      title,
      content,
      imageUrl,
      groupId,
      isPublic,
    });
    res.status(201).json(discussion);
  } catch (err) {
    console.error("createDiscussion error:", err);
    res.status(500).json({ error: "Failed to create discussion" });
  }
}

// GET /api/community/discussions/:id
export async function getDiscussion(req: AuthRequest, res: Response) {
  try {
    const discussion = await communityService.getDiscussionById(String(req.params.id), req.user.id);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    res.json(discussion);
  } catch (err) {
    console.error("getDiscussion error:", err);
    res.status(500).json({ error: "Failed to fetch discussion" });
  }
}

// POST /api/community/discussions/:id/like
export async function toggleDiscussionLike(req: AuthRequest, res: Response) {
  try {
    const result = await communityService.toggleDiscussionLike(String(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    console.error("toggleDiscussionLike error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
}

// POST /api/community/discussions/:id/comments
export async function addComment(req: AuthRequest, res: Response) {
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ error: "Comment content is required" });
  }
  try {
    const comment = await communityService.addComment(String(req.params.id), req.user.id, content.trim());
    res.status(201).json(comment);
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
}

// PUT /api/community/discussions/:id
export async function updateDiscussion(req: AuthRequest, res: Response) {
  const { title, content, imageUrl, isPublic } = req.body;
  try {
    const discussion = await communityService.updateDiscussion(String(req.params.id), req.user.id, {
      title, content, imageUrl, isPublic,
    });
    res.json(discussion);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return res.status(404).json({ error: "Discussion not found" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "Not the discussion author" });
    console.error("updateDiscussion error:", err);
    res.status(500).json({ error: "Failed to update discussion" });
  }
}

// DELETE /api/community/discussions/:id
export async function deleteDiscussion(req: AuthRequest, res: Response) {
  try {
    await communityService.deleteDiscussion(String(req.params.id), req.user.id);
    res.status(200).json({ message: "Discussion deleted" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return res.status(404).json({ error: "Discussion not found" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "Not the discussion author" });
    console.error("deleteDiscussion error:", err);
    res.status(500).json({ error: "Failed to delete discussion" });
  }
}

// DELETE /api/community/comments/:id
export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    await communityService.deleteComment(String(req.params.id), req.user.id);
    res.status(200).json({ message: "Comment deleted" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return res.status(404).json({ error: "Comment not found" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "Not the comment author" });
    console.error("deleteComment error:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
}

// POST /api/community/comments/:id/like
export async function toggleCommentLike(req: AuthRequest, res: Response) {
  try {
    const result = await communityService.toggleCommentLike(String(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    console.error("toggleCommentLike error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
}
