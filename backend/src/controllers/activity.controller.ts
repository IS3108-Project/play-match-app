import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as activityService from "../services/activity.service";

export async function createActivity(req: AuthRequest, res: Response) {
  try {
    const activity = await activityService.createActivity(req.user.id, req.body);
    res.status(201).json(activity);
  } catch (error) {
    console.error("Failed to create activity:", error);
    res.status(500).json({ error: "Failed to create activity" });
  }
}

export async function getActivities(req: AuthRequest, res: Response) {
  try {
    const { activityType, skillLevel, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
    const activities = await activityService.getActivities(req.user.id, {
      ...(activityType ? { activityType: activityType.split(",") } : {}),
      ...(skillLevel ? { skillLevel } : {}),
      ...(dateFrom ? { dateFrom: new Date(dateFrom) } : {}),
      ...(dateTo ? { dateTo: new Date(dateTo) } : {}),
    });
    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
}

export async function getMyActivities(req: AuthRequest, res: Response) {
  try {
    const tab = (req.query as Record<string, string | undefined>).tab || "upcoming";
    const activities = await activityService.getMyActivities(
      req.user.id,
      tab as "upcoming" | "past" | "hosted",
    );
    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch my activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
}

export async function getActivity(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const activity = await activityService.getActivityById(id, req.user.id);
    if (!activity) {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    res.json(activity);
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
}

export async function updateActivity(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const activity = await activityService.updateActivity(id, req.user.id, req.body);
    res.json(activity);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not the host" });
      return;
    }
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    if (error.message === "PAST_ACTIVITY") {
      res.status(400).json({ error: "Cannot edit past activities" });
      return;
    }
    console.error("Failed to update activity:", error);
    res.status(500).json({ error: "Failed to update activity" });
  }
}

export async function getCancelInfo(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const info = await activityService.getCancelInfo(id, req.user.id);
    res.json(info);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not the host" });
      return;
    }
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    console.error("Failed to get cancel info:", error);
    res.status(500).json({ error: "Failed to get cancel info" });
  }
}

export async function cancelActivity(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { transferToUserId } = req.body ?? {};
    const result = await activityService.cancelActivity(id, req.user.id, transferToUserId);
    res.json(result);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not the host" });
      return;
    }
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    if (error.message === "INVALID_TRANSFER_TARGET") {
      res.status(400).json({ error: "Invalid transfer target" });
      return;
    }
    console.error("Failed to cancel activity:", error);
    res.status(500).json({ error: "Failed to cancel activity" });
  }
}

export async function joinActivity(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const result = await activityService.joinActivity(
      id,
      req.user.id,
      req.user.name,
      req.user.email,
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === "ALREADY_JOINED") {
      res.status(409).json({ error: "Already joined" });
      return;
    }
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Activity not found" });
      return;
    }
    if (error.message === "ACTIVITY_CANCELLED") {
      res.status(400).json({ error: "Activity is cancelled" });
      return;
    }
    console.error("Failed to join activity:", error);
    res.status(500).json({ error: "Failed to join activity" });
  }
}

export async function leaveActivity(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    await activityService.leaveActivity(id, req.user.id);
    res.json({ message: "Left activity" });
  } catch (error: any) {
    if (error.message === "NOT_PARTICIPANT") {
      res.status(404).json({ error: "Not a participant" });
      return;
    }
    if (error.message === "HOST_CANNOT_LEAVE") {
      res.status(400).json({ error: "Host cannot leave their own activity" });
      return;
    }
    console.error("Failed to leave activity:", error);
    res.status(500).json({ error: "Failed to leave activity" });
  }
}

export async function approveParticipant(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const participantId = req.params.participantId as string;
    const result = await activityService.approveParticipant(id, req.user.id, participantId);
    res.json(result);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not the host" });
      return;
    }
    if (error.message === "NOT_PENDING") {
      res.status(400).json({ error: "Participant is not pending" });
      return;
    }
    console.error("Failed to approve:", error);
    res.status(500).json({ error: "Failed to approve" });
  }
}

export async function rejectParticipant(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const participantId = req.params.participantId as string;
    const { rejectionNote } = req.body ?? {};
    await activityService.rejectParticipant(id, req.user.id, participantId, rejectionNote);
    res.json({ message: "Participant rejected" });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not the host" });
      return;
    }
    console.error("Failed to reject:", error);
    res.status(500).json({ error: "Failed to reject" });
  }
}

export async function addGuest(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const guest = await activityService.addGuest(id, req.user.id, req.body);
    res.status(201).json(guest);
  } catch (error: any) {
    if (error.message === "NOT_CONFIRMED") {
      res.status(403).json({ error: "Must be a confirmed participant" });
      return;
    }
    if (error.message === "ACTIVITY_FULL") {
      res.status(400).json({ error: "Activity is full — no room for guests" });
      return;
    }
    console.error("Failed to add guest:", error);
    res.status(500).json({ error: "Failed to add guest" });
  }
}

export async function removeGuest(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const guestId = req.params.guestId as string;
    await activityService.removeGuest(id, req.user.id, guestId);
    res.json({ message: "Guest removed" });
  } catch (error: any) {
    console.error("Failed to remove guest:", error);
    res.status(500).json({ error: "Failed to remove guest" });
  }
}

export async function markAttendance(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    await activityService.markAttendance(id, req.user.id, req.body.participantIds);
    res.json({ message: "Attendance marked" });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      res.status(403).json({ error: "Not the host" });
      return;
    }
    if (error.message === "TOO_EARLY") {
      res.status(400).json({ error: "Activity has not started yet" });
      return;
    }
    console.error("Failed to mark attendance:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
}
