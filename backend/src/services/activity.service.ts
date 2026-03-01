import { prisma } from "../config/prisma";
import { ParticipantStatus, ActivityStatus } from "../generated/prisma/client";
import * as notificationService from "./notification.service";
import { format } from "date-fns";

// ── Types ───────────────────────────────────────────────────────────────

interface CreateActivityInput {
  title: string;
  description: string;
  activityType: string;
  date: string; // "2026-03-15"
  startTime: string; // "07:00"
  endTime: string; // "08:30"
  location: string;
  skillLevel: string;
  maxParticipants: number;
  requireApproval: boolean;
  imageSrc?: string;
}

interface UpdateActivityInput {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  skillLevel?: string;
  maxParticipants?: number;
  requireApproval?: boolean;
  imageSrc?: string;
}

interface GuestInput {
  name: string;
  contactType: "email" | "telegram";
  contact: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function activityToNotification(
  activity: { title: string; date: Date; startTime: string; location: string; id: string },
): notificationService.ActivityDetails {
  return {
    name: activity.title,
    date: format(activity.date, "EEEE, d MMM yyyy") + ", " + activity.startTime,
    location: activity.location,
    url: `http://localhost:5173/explore?activity=${activity.id}`,
  };
}

// ── Create ──────────────────────────────────────────────────────────────

export async function createActivity(hostId: string, input: CreateActivityInput) {
  const activity = await prisma.activity.create({
    data: {
      title: input.title,
      description: input.description,
      activityType: input.activityType,
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      skillLevel: input.skillLevel,
      maxParticipants: input.maxParticipants,
      requireApproval: input.requireApproval,
      imageSrc: input.imageSrc ?? null,
      hostId,
      // Auto-add host as confirmed participant
      participants: {
        create: { userId: hostId, status: "CONFIRMED" },
      },
    },
    include: { host: { select: { id: true, name: true, image: true } } },
  });

  return activity;
}

// ── List (Explore) ──────────────────────────────────────────────────────

export async function getActivities(
  userId: string,
  filters: {
    activityType?: string[];
    skillLevel?: string;
    dateFrom?: Date;
    dateTo?: Date;
  },
) {
  const where: any = { status: "ACTIVE" as ActivityStatus };

  if (filters.activityType?.length) {
    where.activityType = { in: filters.activityType };
  }
  if (filters.skillLevel) {
    where.skillLevel = filters.skillLevel;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      host: { select: { id: true, name: true, image: true } },
      participants: {
        select: { id: true, userId: true, status: true },
      },
      _count: { select: { guests: true } },
    },
  });

  // Map to response shape with counts + current user's status
  return activities.map((a) => {
    const confirmed = a.participants.filter(
      (p) => p.status === "CONFIRMED",
    ).length;
    const guestCount = a._count.guests;
    const myParticipant = a.participants.find((p) => p.userId === userId);

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      activityType: a.activityType,
      date: a.date.toISOString(),
      startTime: a.startTime,
      endTime: a.endTime,
      location: a.location,
      skillLevel: a.skillLevel,
      maxParticipants: a.maxParticipants,
      requireApproval: a.requireApproval,
      status: a.status,
      imageSrc: a.imageSrc,
      hostId: a.hostId,
      host: a.host,
      _count: { confirmed },
      slotsLeft: a.maxParticipants - confirmed - guestCount,
      myStatus: myParticipant?.status ?? null,
      createdAt: a.createdAt.toISOString(),
    };
  });
}

// ── My Activities ───────────────────────────────────────────────────────

export async function getMyActivities(
  userId: string,
  tab: "upcoming" | "past" | "hosted",
) {
  const now = new Date();

  if (tab === "hosted") {
    const activities = await prisma.activity.findMany({
      where: { hostId: userId, status: { not: "CANCELLED" } },
      orderBy: { date: "asc" },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: {
          select: { id: true, userId: true, status: true },
        },
        _count: { select: { guests: true } },
      },
    });
    return activities.map((a) => mapActivityResponse(a, userId));
  }

  // upcoming or past — find via participation, both sorted ASC
  const activities = await prisma.activity.findMany({
    where: {
      status: "ACTIVE",
      participants: {
        some: {
          userId,
          status: { in: ["CONFIRMED", "PENDING", "WAITLISTED"] },
        },
      },
      date: tab === "upcoming" ? { gte: now } : { lt: now },
    },
    orderBy: { date: "asc" },
    include: {
      host: { select: { id: true, name: true, image: true } },
      participants: {
        select: { id: true, userId: true, status: true },
      },
      _count: { select: { guests: true } },
    },
  });

  return activities.map((a) => mapActivityResponse(a, userId));
}

function mapActivityResponse(a: any, userId: string) {
  const confirmed = a.participants.filter(
    (p: any) => p.status === "CONFIRMED",
  ).length;
  const guestCount = a._count?.guests ?? 0;
  const myParticipant = a.participants.find((p: any) => p.userId === userId);

  return {
    id: a.id,
    title: a.title,
    description: a.description,
    activityType: a.activityType,
    date: a.date.toISOString(),
    startTime: a.startTime,
    endTime: a.endTime,
    location: a.location,
    skillLevel: a.skillLevel,
    maxParticipants: a.maxParticipants,
    requireApproval: a.requireApproval,
    status: a.status,
    imageSrc: a.imageSrc,
    hostId: a.hostId,
    host: a.host,
    _count: { confirmed },
    slotsLeft: a.maxParticipants - confirmed - guestCount,
    myStatus: myParticipant?.status ?? null,
    pendingCount: a.participants.filter((p: any) => p.status === "PENDING").length,
    createdAt: a.createdAt.toISOString(),
  };
}

// ── Get By ID (Detail) ──────────────────────────────────────────────────

export async function getActivityById(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      host: { select: { id: true, name: true, image: true, email: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      guests: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!activity) return null;

  const confirmed = activity.participants.filter(
    (p) => p.status === "CONFIRMED",
  ).length;
  const myParticipant = activity.participants.find((p) => p.userId === userId);

  return {
    ...activity,
    date: activity.date.toISOString(),
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
    _count: { confirmed },
    slotsLeft: activity.maxParticipants - confirmed - activity.guests.length,
    myStatus: myParticipant?.status ?? null,
  };
}

// ── Update ──────────────────────────────────────────────────────────────

export async function updateActivity(
  activityId: string,
  hostId: string,
  input: UpdateActivityInput,
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      participants: {
        where: { status: "CONFIRMED" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");
  if (activity.date < new Date()) throw new Error("PAST_ACTIVITY");

  const data: any = { ...input };
  if (input.date) data.date = new Date(input.date);

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data,
    include: { host: { select: { id: true, name: true, image: true } } },
  });

  // Send change alerts
  const users = activity.participants.map((p) => ({
    name: p.user.name,
    email: p.user.email,
  }));
  const activityDetails = activityToNotification(updated);

  if (input.location && input.location !== activity.location) {
    notificationService
      .sendChangeAlert(users, activityDetails, "location", activity.location, input.location)
      .catch(console.error);
  }
  if (
    (input.date && input.date !== activity.date.toISOString().split("T")[0]) ||
    (input.startTime && input.startTime !== activity.startTime)
  ) {
    const oldTime = `${activity.date.toISOString().split("T")[0]} ${activity.startTime}`;
    const newTime = `${input.date ?? activity.date.toISOString().split("T")[0]} ${input.startTime ?? activity.startTime}`;
    notificationService
      .sendChangeAlert(users, activityDetails, "time", oldTime, newTime)
      .catch(console.error);
  }

  // If maxParticipants increased, auto-promote from waitlist
  if (input.maxParticipants && input.maxParticipants > activity.maxParticipants) {
    const currentConfirmed = activity.participants.length;
    const newSlots = input.maxParticipants - currentConfirmed;
    if (newSlots > 0) {
      await promoteFromWaitlist(activityId, newSlots, activity.requireApproval);
    }
  }

  return updated;
}

// ── Cancel ──────────────────────────────────────────────────────────────

export async function getCancelInfo(activityId: string, hostId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      participants: {
        where: { status: "CONFIRMED", userId: { not: hostId } },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");

  return {
    hasOtherParticipants: activity.participants.length > 0,
    confirmedParticipants: activity.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      image: p.user.image,
    })),
  };
}

export async function cancelActivity(
  activityId: string,
  hostId: string,
  transferToUserId?: string,
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      participants: {
        where: { status: { in: ["CONFIRMED", "PENDING", "WAITLISTED"] } },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");

  // Transfer host path
  if (transferToUserId) {
    const newHost = activity.participants.find(
      (p) => p.userId === transferToUserId && p.status === "CONFIRMED",
    );
    if (!newHost) throw new Error("INVALID_TRANSFER_TARGET");

    await prisma.$transaction([
      prisma.guest.deleteMany({ where: { activityId, invitedById: hostId } }),
      prisma.participant.delete({
        where: { userId_activityId: { userId: hostId, activityId } },
      }),
      prisma.activity.update({
        where: { id: activityId },
        data: { hostId: transferToUserId },
      }),
    ]);

    return { action: "transferred" as const, newHostName: newHost.user.name };
  }

  // Cancel path
  await prisma.activity.update({
    where: { id: activityId },
    data: { status: "CANCELLED" },
  });

  // Notify all participants
  const users = activity.participants.map((p) => ({
    name: p.user.name,
    email: p.user.email,
  }));
  const activityDetails = activityToNotification(activity);
  notificationService
    .sendChangeAlert(users, activityDetails, "cancelled")
    .catch(console.error);

  return { action: "cancelled" as const };
}

// ── Join ─────────────────────────────────────────────────────────────────

export async function joinActivity(
  activityId: string,
  userId: string,
  userName: string,
  userEmail: string,
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) throw new Error("NOT_FOUND");
  if (activity.status !== "ACTIVE") throw new Error("ACTIVITY_CANCELLED");

  // Check if already a participant
  const existing = await prisma.participant.findUnique({
    where: { userId_activityId: { userId, activityId } },
  });

  // Allow re-join after rejection
  if (existing && existing.status === "REJECTED") {
    await prisma.participant.delete({
      where: { userId_activityId: { userId, activityId } },
    });
  } else if (existing) {
    throw new Error("ALREADY_JOINED");
  }

  // Use transaction for race-condition safety
  const result = await prisma.$transaction(async (tx) => {
    const confirmedCount = await tx.participant.count({
      where: { activityId, status: "CONFIRMED" },
    });
    const guestCount = await tx.guest.count({
      where: { activityId },
    });

    let status: ParticipantStatus;
    if (confirmedCount + guestCount >= activity.maxParticipants) {
      status = "WAITLISTED";
    } else if (activity.requireApproval) {
      status = "PENDING";
    } else {
      status = "CONFIRMED";
    }

    const participant = await tx.participant.create({
      data: { userId, activityId, status },
    });

    return { status: participant.status };
  });

  // Send RSVP email if confirmed immediately
  if (result.status === "CONFIRMED") {
    const activityDetails = activityToNotification(activity);
    notificationService
      .sendRsvpConfirmation({ name: userName, email: userEmail }, activityDetails)
      .catch(console.error);
  }

  return result;
}

// ── Leave ────────────────────────────────────────────────────────────────

export async function leaveActivity(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");

  const participant = await prisma.participant.findUnique({
    where: { userId_activityId: { userId, activityId } },
  });
  if (!participant) throw new Error("NOT_PARTICIPANT");

  // Can't leave if host
  if (activity.hostId === userId) throw new Error("HOST_CANNOT_LEAVE");

  const wasConfirmed = participant.status === "CONFIRMED";

  // Delete participant + their guests
  await prisma.$transaction([
    prisma.guest.deleteMany({ where: { activityId, invitedById: userId } }),
    prisma.participant.delete({
      where: { userId_activityId: { userId, activityId } },
    }),
  ]);

  // Auto-promote from waitlist if a confirmed spot opened
  if (wasConfirmed) {
    await promoteFromWaitlist(activityId, 1, activity.requireApproval);
  }
}

// ── Approve / Reject ────────────────────────────────────────────────────

export async function approveParticipant(
  activityId: string,
  hostId: string,
  participantId: string,
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!participant || participant.activityId !== activityId)
    throw new Error("NOT_FOUND");
  if (participant.status !== "PENDING") throw new Error("NOT_PENDING");

  // Check capacity
  const confirmedCount = await prisma.participant.count({
    where: { activityId, status: "CONFIRMED" },
  });

  if (confirmedCount >= activity.maxParticipants) {
    // Full — move to waitlist instead
    await prisma.participant.update({
      where: { id: participantId },
      data: { status: "WAITLISTED" },
    });
    return { status: "WAITLISTED" as const };
  }

  await prisma.participant.update({
    where: { id: participantId },
    data: { status: "CONFIRMED" },
  });

  // Send RSVP confirmation
  const activityDetails = activityToNotification(activity);
  notificationService
    .sendRsvpConfirmation(
      { name: participant.user.name, email: participant.user.email },
      activityDetails,
    )
    .catch(console.error);

  return { status: "CONFIRMED" as const };
}

export async function rejectParticipant(
  activityId: string,
  hostId: string,
  participantId: string,
  rejectionNote?: string,
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant || participant.activityId !== activityId)
    throw new Error("NOT_FOUND");

  // Set status to REJECTED instead of deleting, so we can store the reason
  await prisma.participant.update({
    where: { id: participantId },
    data: {
      status: "REJECTED",
      rejectionNote: rejectionNote ?? null,
    },
  });
}

// ── Guests ──────────────────────────────────────────────────────────────

export async function addGuest(
  activityId: string,
  userId: string,
  input: GuestInput,
) {
  // Verify user is a confirmed participant
  const participant = await prisma.participant.findUnique({
    where: { userId_activityId: { userId, activityId } },
  });
  if (!participant || participant.status !== "CONFIRMED")
    throw new Error("NOT_CONFIRMED");

  // Check capacity: confirmed participants + guests must be under max
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");

  const [confirmedCount, guestCount] = await Promise.all([
    prisma.participant.count({ where: { activityId, status: "CONFIRMED" } }),
    prisma.guest.count({ where: { activityId } }),
  ]);

  if (confirmedCount + guestCount >= activity.maxParticipants) {
    throw new Error("ACTIVITY_FULL");
  }

  return prisma.guest.create({
    data: {
      name: input.name,
      contactType: input.contactType,
      contact: input.contact,
      activityId,
      invitedById: userId,
    },
  });
}

export async function removeGuest(
  activityId: string,
  userId: string,
  guestId: string,
) {
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.activityId !== activityId || guest.invitedById !== userId)
    throw new Error("NOT_FOUND");

  await prisma.guest.delete({ where: { id: guestId } });
}

// ── Attendance ──────────────────────────────────────────────────────────

export async function markAttendance(
  activityId: string,
  hostId: string,
  participantIds: string[],
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");

  // Check if activity has started
  const now = new Date();
  const activityStart = new Date(activity.date);
  const parts = activity.startTime.split(":").map(Number);
  activityStart.setHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0);

  if (now < activityStart) throw new Error("TOO_EARLY");

  // Bulk update: mark selected as attended, rest as not attended
  await prisma.$transaction([
    prisma.participant.updateMany({
      where: {
        activityId,
        status: "CONFIRMED",
        id: { in: participantIds },
      },
      data: { attended: true },
    }),
    prisma.participant.updateMany({
      where: {
        activityId,
        status: "CONFIRMED",
        id: { notIn: participantIds },
      },
      data: { attended: false },
    }),
  ]);
}

// ── Waitlist promotion (internal) ───────────────────────────────────────

async function promoteFromWaitlist(
  activityId: string,
  slots: number,
  requireApproval: boolean,
) {
  const waitlisted = await prisma.participant.findMany({
    where: { activityId, status: "WAITLISTED" },
    orderBy: { joinedAt: "asc" },
    take: slots,
    include: { user: { select: { name: true, email: true } } },
  });

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) return;

  for (const p of waitlisted) {
    const newStatus: ParticipantStatus = requireApproval
      ? "PENDING"
      : "CONFIRMED";

    await prisma.participant.update({
      where: { id: p.id },
      data: { status: newStatus },
    });

    if (newStatus === "CONFIRMED") {
      const activityDetails = activityToNotification(activity);
      notificationService
        .sendWaitlistNotification(
          { name: p.user.name, email: p.user.email },
          activityDetails,
        )
        .catch(console.error);
    }
  }
}
