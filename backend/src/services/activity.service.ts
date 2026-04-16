import { prisma } from "../config/prisma";
import { ParticipantStatus, ActivityStatus } from "../generated/prisma/client";
import * as notificationService from "./notification.service";
import { format } from "date-fns";
import { deleteFromR2 } from "../config/storage";
import { getReliabilityBadge } from "./user.service";

// ── Types ───────────────────────────────────────────────────────────────

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate a bounding box for initial DB filtering (rough filter before exact distance calculation)
 */
function getBoundingBox(lat: number, lng: number, distanceKm: number) {
  // 1 degree of latitude ≈ 111 km
  const latDelta = distanceKm / 111;
  // 1 degree of longitude varies by latitude
  const lngDelta = distanceKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

interface CreateActivityInput {
  title: string;
  description: string;
  activityType: string;
  date: string; // "2026-03-15"
  startTime: string; // "07:00"
  endTime: string; // "08:30"
  location: string;
  latitude?: number | null;
  longitude?: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
  skillLevel?: string;
  maxParticipants?: number;
  requireApproval?: boolean;
  imageSrc?: string | null;
}

interface GuestInput {
  name: string;
  contactType: "email" | "telegram";
  contact: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function activityToNotification(activity: {
  title: string;
  date: Date;
  startTime: string;
  location: string;
  id: string;
}): notificationService.ActivityDetails {
  return {
    name: activity.title,
    date: format(activity.date, "EEEE, d MMM yyyy") + ", " + activity.startTime,
    location: activity.location,
    url: `http://localhost:5173/explore?activity=${activity.id}`,
  };
}

function getActivityStartDateTime(activity: {
  date: Date;
  startTime: string;
}): Date {
  const result = new Date(activity.date);
  const [hours, minutes] = activity.startTime.split(":").map(Number);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

function getActivityEndDateTime(activity: {
  date: Date;
  endTime: string;
}): Date {
  const result = new Date(activity.date);
  const [hours, minutes] = activity.endTime.split(":").map(Number);
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return result;
}

function isWithinLateCancellationWindow(activity: {
  date: Date;
  startTime: string;
}): boolean {
  return (
    getActivityStartDateTime(activity).getTime() - Date.now() <
    24 * 60 * 60 * 1000
  );
}

async function syncStartedHostAttendanceForActivities(
  activities: Array<{
    id: string;
    date: Date;
    startTime: string;
    hostId: string;
    status: ActivityStatus;
  }>,
) {
  const now = new Date();
  const eligibleActivities = activities.filter((activity) => {
    if (activity.status !== "ACTIVE") return false;
    return getActivityStartDateTime(activity).getTime() <= now.getTime();
  });

  if (eligibleActivities.length === 0) return;

  const hostParticipantIds = await prisma.participant.findMany({
    where: {
      activityId: { in: eligibleActivities.map((activity) => activity.id) },
      status: "CONFIRMED",
      attendanceStatus: "PENDING",
      OR: eligibleActivities.map((activity) => ({
        activityId: activity.id,
        userId: activity.hostId,
      })),
    },
    select: { id: true },
  });

  if (hostParticipantIds.length === 0) return;

  await prisma.participant.updateMany({
    where: {
      id: { in: hostParticipantIds.map((participant) => participant.id) },
    },
    data: { attendanceStatus: "ATTENDED" },
  });
}

async function getNoShowCount(userId: string) {
  return prisma.participant.count({
    where: { userId, attendanceStatus: "NO_SHOW" },
  });
}

async function maybeSendNoShowWarning(userId: string, previousCount: number) {
  const totalNoShows = await getNoShowCount(userId);
  if (previousCount < 5 && totalNoShows >= 5) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (user) {
      notificationService
        .sendNoShowWarning({ name: user.name, email: user.email }, totalNoShows)
        .catch(console.error);
    }
  }
}

// ── Create ──────────────────────────────────────────────────────────────

export async function createActivity(
  hostId: string,
  input: CreateActivityInput,
) {
  const activity = await prisma.activity.create({
    data: {
      title: input.title,
      description: input.description,
      activityType: input.activityType,
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
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

interface PaginationParams {
  page?: number | undefined;
  limit?: number | undefined;
}

interface ActivityFilters {
  search?: string;
  activityType?: string[];
  skillLevel?: string[];
  region?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "date" | "createdAt" | "distance";
  // Distance-based filtering
  lat?: number;
  lng?: number;
  maxDistance?: number; // in km
}

export async function getActivities(
  userId: string,
  filters: ActivityFilters,
  pagination: PaginationParams = {},
) {
  const page = Math.max(1, pagination.page ?? 1);
  const limit = Math.min(50, Math.max(1, pagination.limit ?? 12)); // Default 12, max 50

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: any = {
    status: "ACTIVE" as ActivityStatus,
    date: { gte: today },
  };

  // Check if we need distance-based filtering or sorting
  const useDistanceFilter =
    filters.lat != null && filters.lng != null && filters.maxDistance != null;
  const sortByDistance =
    filters.sortBy === "distance" && filters.lat != null && filters.lng != null;
  const showDistances = filters.lat != null && filters.lng != null; // Always calculate distance when coords provided

  // Text search on title and description (case-insensitive)
  if (filters.search?.trim()) {
    const searchTerm = filters.search.trim();
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
      { activityType: { contains: searchTerm, mode: "insensitive" } },
      { location: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (filters.activityType?.length) {
    where.activityType = { in: filters.activityType };
  }
  if (filters.skillLevel?.length) {
    where.skillLevel = { in: filters.skillLevel };
  }
  // Region filter - matches if location contains any of the selected regions
  if (filters.region?.length) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: filters.region.map((r) => ({
          location: { contains: r, mode: "insensitive" },
        })),
      },
    ];
  }
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  // Add bounding box filter for distance queries (rough filter to reduce DB results)
  if (useDistanceFilter) {
    const bbox = getBoundingBox(
      filters.lat!,
      filters.lng!,
      filters.maxDistance!,
    );
    where.AND = [
      ...(where.AND || []),
      { latitude: { not: null } },
      { longitude: { not: null } },
      { latitude: { gte: bbox.minLat, lte: bbox.maxLat } },
      { longitude: { gte: bbox.minLng, lte: bbox.maxLng } },
    ];
  }

  // For distance-based queries, we need to fetch all matching activities first,
  // then filter/sort by exact distance, then paginate manually
  if (useDistanceFilter || sortByDistance || showDistances) {
    // Ensure only activities with coordinates are included for distance sorting
    if (sortByDistance && !useDistanceFilter) {
      where.AND = [
        ...(where.AND || []),
        { latitude: { not: null } },
        { longitude: { not: null } },
      ];
    }

    // Fetch all matching activities (we'll filter and paginate manually)
    const allActivities = await prisma.activity.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: {
          select: { id: true, userId: true, status: true },
        },
        _count: { select: { guests: true } },
      },
    });

    // Calculate distance for each activity and filter/sort
    let activitiesWithDistance = allActivities.map((a) => ({
      ...a,
      distance:
        a.latitude != null && a.longitude != null
          ? calculateDistanceKm(
              filters.lat!,
              filters.lng!,
              a.latitude,
              a.longitude,
            )
          : null,
    }));

    // Filter by maxDistance if specified
    if (useDistanceFilter) {
      activitiesWithDistance = activitiesWithDistance.filter(
        (a) => a.distance !== null && a.distance <= filters.maxDistance!,
      );
    }

    // Sort by distance or date
    if (sortByDistance) {
      activitiesWithDistance.sort(
        (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
      );
    } else {
      activitiesWithDistance.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }

    // Manual pagination
    const total = activitiesWithDistance.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedActivities = activitiesWithDistance.slice(
      skip,
      skip + limit,
    );

    // Map to response shape
    const data = paginatedActivities.map((a) => {
      const confirmed = a.participants.filter(
        (p) => p.status === "CONFIRMED",
      ).length;
      const guestCount = a._count.guests;
      const myParticipant = a.participants.find((p) => p.userId === userId);
      const normalizedMyStatus =
        myParticipant?.status === "CANCELLED"
          ? null
          : (myParticipant?.status ?? null);

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        activityType: a.activityType,
        date: a.date.toISOString(),
        startTime: a.startTime,
        endTime: a.endTime,
        location: a.location,
        latitude: a.latitude,
        longitude: a.longitude,
        skillLevel: a.skillLevel,
        maxParticipants: a.maxParticipants,
        requireApproval: a.requireApproval,
        status: a.status,
        imageSrc: a.imageSrc,
        hostId: a.hostId,
        host: a.host,
        _count: { confirmed },
        slotsLeft: a.maxParticipants - confirmed - guestCount,
        myStatus: normalizedMyStatus,
        createdAt: a.createdAt.toISOString(),
        distance: a.distance != null ? Math.round(a.distance * 10) / 10 : null, // Round to 1 decimal
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Standard query without distance (use DB pagination)
  const skip = (page - 1) * limit;

  // Determine sort order
  const orderBy =
    filters.sortBy === "createdAt"
      ? { createdAt: "desc" as const }
      : { date: "asc" as const };

  // Run count and findMany in parallel for efficiency
  const [total, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: {
          select: { id: true, userId: true, status: true },
        },
        _count: { select: { guests: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Map to response shape with counts + current user's status
  const data = activities.map((a) => {
    const confirmed = a.participants.filter(
      (p) => p.status === "CONFIRMED",
    ).length;
    const guestCount = a._count.guests;
    const myParticipant = a.participants.find((p) => p.userId === userId);
    const normalizedMyStatus =
      myParticipant?.status === "CANCELLED"
        ? null
        : (myParticipant?.status ?? null);

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      activityType: a.activityType,
      date: a.date.toISOString(),
      startTime: a.startTime,
      endTime: a.endTime,
      location: a.location,
      latitude: a.latitude,
      longitude: a.longitude,
      skillLevel: a.skillLevel,
      maxParticipants: a.maxParticipants,
      requireApproval: a.requireApproval,
      status: a.status,
      imageSrc: a.imageSrc,
      hostId: a.hostId,
      host: a.host,
      _count: { confirmed },
      slotsLeft: a.maxParticipants - confirmed - guestCount,
      myStatus: normalizedMyStatus,
      createdAt: a.createdAt.toISOString(),
      distance: null, // No distance info in standard query
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

// ── My Activities ───────────────────────────────────────────────────────

export async function getMyActivities(
  userId: string,
  options: {
    time?: ("upcoming" | "past")[];
    host?: ("me" | "others")[];
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 12));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const timeFilters = options.time?.length ? options.time : ["upcoming", "past"];
  const hostFilters = options.host?.length ? options.host : ["me", "others"];

  // Fetch based on what we need
  const needHosted = hostFilters.includes("me");
  const needJoined = hostFilters.includes("others");
  const needUpcoming = timeFilters.includes("upcoming");
  const needPast = timeFilters.includes("past");

  let allResults: { activity: any; isHosted: boolean }[] = [];

  // Hosted by me
  if (needHosted) {
    const dateFilter: any = {};
    if (needUpcoming && !needPast) dateFilter.gte = today;
    else if (needPast && !needUpcoming) dateFilter.lte = today;

    let hosted = await prisma.activity.findMany({
      where: {
        hostId: userId,
        status: { not: "CANCELLED" },
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: "desc" },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: {
          select: { id: true, userId: true, status: true, source: true, attendanceStatus: true },
        },
        _count: { select: { guests: true } },
      },
    });

    // Sync attendance for hosted activities
    await syncStartedHostAttendanceForActivities(
      hosted.map((activity) => ({
        id: activity.id,
        date: activity.date,
        startTime: activity.startTime,
        hostId: activity.hostId,
        status: activity.status,
      })),
    );

    // Re-fetch after sync
    hosted = await prisma.activity.findMany({
      where: {
        hostId: userId,
        status: { not: "CANCELLED" },
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: "desc" },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: {
          select: { id: true, userId: true, status: true, source: true, attendanceStatus: true },
        },
        _count: { select: { guests: true } },
      },
    });

    // Apply same-day time filtering
    const filtered = hosted.filter((a) => {
      const activityDate = new Date(a.date);
      activityDate.setHours(0, 0, 0, 0);
      const isToday = activityDate.getTime() === today.getTime();
      if (!isToday) return true;
      if (needUpcoming && needPast) return true;

      const [endH = 0, endM = 0] = a.endTime.split(":").map(Number);
      const endPassed = now.getHours() > endH || (now.getHours() === endH && now.getMinutes() >= endM);
      if (needUpcoming && !needPast) return !endPassed;
      if (needPast && !needUpcoming) return endPassed;
      return true;
    });

    for (const a of filtered) {
      allResults.push({ activity: a, isHosted: true });
    }
  }

  // Joined (hosted by others)
  if (needJoined) {
    const dateFilter: any = {};
    if (needUpcoming && !needPast) dateFilter.gte = today;
    else if (needPast && !needUpcoming) dateFilter.lte = today;

    const joined = await prisma.activity.findMany({
      where: {
        status: "ACTIVE",
        hostId: { not: userId },
        participants: {
          some: {
            userId,
            status: { in: ["CONFIRMED", "PENDING", "WAITLISTED"] },
          },
        },
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: "desc" },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: {
          select: { id: true, userId: true, status: true, source: true },
        },
        _count: { select: { guests: true } },
      },
    });

    // Apply same-day time filtering
    const filtered = joined.filter((a) => {
      const activityDate = new Date(a.date);
      activityDate.setHours(0, 0, 0, 0);
      const isToday = activityDate.getTime() === today.getTime();
      if (!isToday) return true;
      if (needUpcoming && needPast) return true;

      const [endH = 0, endM = 0] = a.endTime.split(":").map(Number);
      const endPassed = now.getHours() > endH || (now.getHours() === endH && now.getMinutes() >= endM);
      if (needUpcoming && !needPast) return !endPassed;
      if (needPast && !needUpcoming) return endPassed;
      return true;
    });

    for (const a of filtered) {
      allResults.push({ activity: a, isHosted: false });
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  allResults = allResults.filter(({ activity }) => {
    if (seen.has(activity.id)) return false;
    seen.add(activity.id);
    return true;
  });

  // Apply search filter
  if (options.search) {
    const q = options.search.toLowerCase();
    allResults = allResults.filter(({ activity }) =>
      activity.title.toLowerCase().includes(q) ||
      activity.location.toLowerCase().includes(q) ||
      activity.activityType.toLowerCase().includes(q)
    );
  }

  // Sort by date descending
  allResults.sort((a, b) =>
    new Date(b.activity.date).getTime() - new Date(a.activity.date).getTime()
  );

  const total = allResults.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = allResults.slice((page - 1) * limit, page * limit);

  return {
    data: paginated.map(({ activity, isHosted }) => ({
      ...mapActivityResponse(activity, userId),
      isHosted,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

function mapActivityResponse(a: any, userId: string) {
  const confirmed = a.participants.filter(
    (p: any) => p.status === "CONFIRMED",
  ).length;
  const guestCount = a._count?.guests ?? 0;
  const myParticipant = a.participants.find((p: any) => p.userId === userId);
  const normalizedMyStatus =
    myParticipant?.status === "CANCELLED"
      ? null
      : (myParticipant?.status ?? null);

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
    myStatus: normalizedMyStatus,
    mySource: myParticipant?.source ?? null,
    pendingCount: a.participants.filter((p: any) => p.status === "PENDING")
      .length,
    createdAt: a.createdAt.toISOString(),
    // Include participant user IDs for invite tracking
    participantUserIds: a.participants.map((p: any) => p.userId),
  };
}

// ── Get By ID (Detail) ──────────────────────────────────────────────────

export async function getActivityById(activityId: string, userId: string) {
  let activity = await prisma.activity.findUnique({
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
  await syncStartedHostAttendanceForActivities([
    {
      id: activity.id,
      date: activity.date,
      startTime: activity.startTime,
      hostId: activity.hostId,
      status: activity.status,
    },
  ]);
  activity = await prisma.activity.findUnique({
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
  const normalizedMyStatus =
    myParticipant?.status === "CANCELLED"
      ? null
      : (myParticipant?.status ?? null);
  const participantUserIds = activity.participants.map(
    (participant) => participant.userId,
  );
  const reliabilityEntries =
    participantUserIds.length === 0
      ? []
      : await prisma.participant.findMany({
          where: {
            userId: { in: participantUserIds },
            attendanceStatus: { in: ["ATTENDED", "LATE", "NO_SHOW"] },
          },
          select: {
            userId: true,
            attendanceStatus: true,
          },
        });
  const reliabilityCounts = new Map<string, number>();
  for (const entry of reliabilityEntries) {
    const key = `${entry.userId}:${entry.attendanceStatus}`;
    reliabilityCounts.set(key, (reliabilityCounts.get(key) ?? 0) + 1);
  }

  return {
    ...activity,
    date: activity.date.toISOString(),
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
    _count: { confirmed },
    slotsLeft: activity.maxParticipants - confirmed - activity.guests.length,
    myStatus: normalizedMyStatus,
    mySource: myParticipant?.source ?? null,
    participants: activity.participants.map((participant) => {
      const totalAttended =
        reliabilityCounts.get(`${participant.userId}:ATTENDED`) ?? 0;
      const totalLate =
        reliabilityCounts.get(`${participant.userId}:LATE`) ?? 0;
      const totalNoShow =
        reliabilityCounts.get(`${participant.userId}:NO_SHOW`) ?? 0;
      const totalActivities = totalAttended + totalLate + totalNoShow;
      const attendanceRate =
        totalActivities === 0
          ? 0
          : Math.round(((totalAttended + totalLate) / totalActivities) * 100);
      const noShowRate =
        totalActivities === 0
          ? 0
          : Math.round((totalNoShow / totalActivities) * 100);

      return {
        ...participant,
        joinedAt: participant.joinedAt.toISOString(),
        reliability: {
          totalAttended,
          totalLate,
          totalNoShow,
          totalActivities,
          attendanceRate,
          noShowRate,
        },
        badge: getReliabilityBadge(
          totalActivities,
          totalLate,
          attendanceRate,
          noShowRate,
        ),
      };
    }),
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

  // Compare dates only (not time) to allow editing activities scheduled for today
  const activityDate = new Date(activity.date);
  activityDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (activityDate < today) throw new Error("PAST_ACTIVITY");

  // Handle image removal/replacement - delete old file from R2
  if (
    "imageSrc" in input &&
    activity.imageSrc &&
    activity.imageSrc !== input.imageSrc
  ) {
    deleteFromR2(activity.imageSrc).catch((err) => {
      console.error("Failed to delete old image from R2:", err);
    });
  }

  const data: any = { ...input };
  if (input.date) data.date = new Date(input.date);

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data,
    include: { host: { select: { id: true, name: true, image: true } } },
  });

  // If maxParticipants increased, auto-promote from waitlist
  if (
    input.maxParticipants &&
    input.maxParticipants > activity.maxParticipants
  ) {
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
  if (isWithinLateCancellationWindow(activity)) {
    throw new Error("TOO_LATE_TO_CANCEL");
  }

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

  // Notify all participants (CONFIRMED, PENDING, WAITLISTED)
  const users = activity.participants.map((p) => ({
    name: p.user.name,
    email: p.user.email,
  }));
  const activityDetails = activityToNotification(activity);
  notificationService
    .sendActivityCancelled(users, activityDetails)
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
  if (
    existing &&
    (existing.status === "REJECTED" || existing.status === "CANCELLED")
  ) {
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
      data: { userId, activityId, status, source: "REQUESTED" },
    });

    return { status: participant.status };
  });

  // Send emails if joined and confirmed immediately (no approval required)
  if (result.status === "CONFIRMED") {
    const activityDetails = activityToNotification(activity);
    // Confirm to the joining user
    notificationService
      .sendRsvpConfirmation(
        { name: userName, email: userEmail },
        activityDetails,
      )
      .catch(console.error);
    // Notify the host
    prisma.user
      .findUnique({
        where: { id: activity.hostId },
        select: { name: true, email: true },
      })
      .then((host) => {
        if (host) {
          notificationService
            .sendNewParticipantNotification({
              hostName: host.name,
              hostEmail: host.email,
              participantName: userName,
              activityName: activity.title,
              activityDate:
                format(activity.date, "EEEE, d MMM yyyy") +
                ", " +
                activity.startTime,
              activityLocation: activity.location,
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  }

  // Notify host when a user requests to join (approval-required activity)
  if (result.status === "PENDING") {
    prisma.user
      .findUnique({
        where: { id: activity.hostId },
        select: { name: true, email: true },
      })
      .then((host) => {
        if (host) {
          notificationService
            .sendPendingRequestToHost({
              hostName: host.name,
              hostEmail: host.email,
              requesterName: userName,
              activityName: activity.title,
              activityDate:
                format(activity.date, "EEEE, d MMM yyyy") +
                ", " +
                activity.startTime,
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  }

  return result;
}

// ── Invite User (Host invites another user) ─────────────────────────────

export async function inviteUser(
  activityId: string,
  hostId: string,
  invitedUserId: string,
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");
  if (activity.status !== "ACTIVE") throw new Error("ACTIVITY_CANCELLED");
  if (hostId === invitedUserId) throw new Error("CANNOT_INVITE_SELF");

  // Check if already a participant
  const existing = await prisma.participant.findUnique({
    where: { userId_activityId: { userId: invitedUserId, activityId } },
  });

  if (
    existing &&
    (existing.status === "REJECTED" || existing.status === "CANCELLED")
  ) {
    await prisma.participant.delete({
      where: {
        userId_activityId: { userId: invitedUserId, activityId },
      },
    });
  } else if (existing) {
    throw new Error("ALREADY_PARTICIPANT");
  }

  // Check if there's room
  const confirmedCount = await prisma.participant.count({
    where: { activityId, status: "CONFIRMED" },
  });
  const guestCount = await prisma.guest.count({
    where: { activityId },
  });

  if (confirmedCount + guestCount >= activity.maxParticipants) {
    throw new Error("ACTIVITY_FULL");
  }

  // Add as PENDING participant - invitee must accept the invitation
  const participant = await prisma.participant.create({
    data: {
      userId: invitedUserId,
      activityId,
      status: "PENDING",
      source: "INVITED",
    },
  });

  // Notify the invited user
  prisma.user
    .findMany({
      where: { id: { in: [invitedUserId, hostId] } },
      select: { id: true, name: true, email: true },
    })
    .then((users) => {
      const invitee = users.find((u) => u.id === invitedUserId);
      const host = users.find((u) => u.id === hostId);
      if (invitee && host) {
        notificationService
          .sendInvitation({
            inviteeName: invitee.name,
            inviteeEmail: invitee.email,
            hostName: host.name,
            activityName: activity.title,
            activityDate:
              format(activity.date, "EEEE, d MMM yyyy") +
              ", " +
              activity.startTime,
            activityLocation: activity.location,
          })
          .catch(console.error);
      }
    })
    .catch(console.error);

  return { status: participant.status };
}

// ── Accept Invitation (Invitee accepts host's invite) ───────────────────

export async function acceptInvitation(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) throw new Error("NOT_FOUND");
  if (activity.status !== "ACTIVE") throw new Error("ACTIVITY_CANCELLED");

  const participant = await prisma.participant.findUnique({
    where: { userId_activityId: { userId, activityId } },
  });

  if (!participant) throw new Error("NOT_PARTICIPANT");
  if (participant.source !== "INVITED") throw new Error("NOT_INVITED");
  if (participant.status !== "PENDING") throw new Error("NOT_PENDING");

  // Check if there's still room
  const confirmedCount = await prisma.participant.count({
    where: { activityId, status: "CONFIRMED" },
  });
  const guestCount = await prisma.guest.count({
    where: { activityId },
  });

  if (confirmedCount + guestCount >= activity.maxParticipants) {
    throw new Error("ACTIVITY_FULL");
  }

  // Update to CONFIRMED
  await prisma.participant.update({
    where: { userId_activityId: { userId, activityId } },
    data: { status: "CONFIRMED" },
  });

  // Notify host that the invitee accepted
  prisma.user
    .findMany({
      where: { id: { in: [userId, activity.hostId] } },
      select: { id: true, name: true, email: true },
    })
    .then((users) => {
      const invitee = users.find((u) => u.id === userId);
      const host = users.find((u) => u.id === activity.hostId);
      if (invitee && host) {
        notificationService
          .sendInvitationOutcome({
            hostName: host.name,
            hostEmail: host.email,
            inviteeName: invitee.name,
            activityName: activity.title,
            activityDate:
              format(activity.date, "EEEE, d MMM yyyy") +
              ", " +
              activity.startTime,
            outcome: "accepted",
          })
          .catch(console.error);
      }
    })
    .catch(console.error);

  return { status: "CONFIRMED" };
}

// ── Decline Invitation (Invitee declines host's invite) ─────────────────

export async function declineInvitation(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) throw new Error("NOT_FOUND");

  const participant = await prisma.participant.findUnique({
    where: { userId_activityId: { userId, activityId } },
  });

  if (!participant) throw new Error("NOT_PARTICIPANT");
  if (participant.source !== "INVITED") throw new Error("NOT_INVITED");
  if (participant.status !== "PENDING") throw new Error("NOT_PENDING");

  // Delete the participant record
  await prisma.participant.delete({
    where: { userId_activityId: { userId, activityId } },
  });

  // Notify host that the invitee declined
  prisma.user
    .findMany({
      where: { id: { in: [userId, activity.hostId] } },
      select: { id: true, name: true, email: true },
    })
    .then((users) => {
      const invitee = users.find((u) => u.id === userId);
      const host = users.find((u) => u.id === activity.hostId);
      if (invitee && host) {
        notificationService
          .sendInvitationOutcome({
            hostName: host.name,
            hostEmail: host.email,
            inviteeName: invitee.name,
            activityName: activity.title,
            activityDate:
              format(activity.date, "EEEE, d MMM yyyy") +
              ", " +
              activity.startTime,
            outcome: "declined",
          })
          .catch(console.error);
      }
    })
    .catch(console.error);

  return { success: true };
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
  const isLateCancellation = isWithinLateCancellationWindow(activity);
  const attendanceStatus = isLateCancellation ? "NO_SHOW" : "CANCELLED";
  const previousNoShowCount = isLateCancellation
    ? await getNoShowCount(userId)
    : null;

  const leavingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  await prisma.$transaction([
    prisma.guest.deleteMany({ where: { activityId, invitedById: userId } }),
    prisma.participant.update({
      where: { userId_activityId: { userId, activityId } },
      data: {
        status: "CANCELLED",
        attendanceStatus,
      },
    }),
  ]);

  // Notify host that a participant withdrew
  if (leavingUser) {
    prisma.user
      .findUnique({
        where: { id: activity.hostId },
        select: { name: true, email: true },
      })
      .then((host) => {
        if (host) {
          notificationService
            .sendWithdrawalNotification({
              hostName: host.name,
              hostEmail: host.email,
              participantName: leavingUser.name,
              activityName: activity.title,
              activityDate:
                format(activity.date, "EEEE, d MMM yyyy") +
                ", " +
                activity.startTime,
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  }

  // Auto-promote from waitlist if a confirmed spot opened
  if (wasConfirmed) {
    await promoteFromWaitlist(activityId, 1, activity.requireApproval);
  }

  if (isLateCancellation && previousNoShowCount != null) {
    await maybeSendNoShowWarning(userId, previousNoShowCount);
  }

  return { isLateCancellation, attendanceStatus };
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

  // Notify user their request was approved
  const activityDetails = activityToNotification(activity);
  notificationService
    .sendRequestOutcome(
      { name: participant.user.name, email: participant.user.email },
      activityDetails,
      "approved",
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

  /**
   * Retrieves a participant by their ID and includes related user information.
   *
   * @param participantId - The unique identifier of the participant to find
   * @returns Promise resolving to the participant object with nested user data (name and email),
   *          or null if the participant doesn't exist
   *
   * @remarks
   * The `include` option fetches the associated user record and selects only the `name` and `email`
   * fields from the user object, reducing the payload by excluding other user properties.
   */
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { user: { select: { name: true, email: true } } },
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

  // Notify user their request was rejected
  const activityDetails = activityToNotification(activity);
  notificationService
    .sendRequestOutcome(
      { name: participant.user.name, email: participant.user.email },
      activityDetails,
      "rejected",
      rejectionNote,
    )
    .catch(console.error);
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
  attendance?: Record<string, "ATTENDED" | "LATE" | "NO_SHOW">,
  participantIds?: string[],
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) throw new Error("NOT_FOUND");
  if (activity.hostId !== hostId) throw new Error("FORBIDDEN");

  const now = new Date();
  const activityStart = getActivityStartDateTime(activity);
  const activityEnd = getActivityEndDateTime(activity);
  const attendanceLockTime = new Date(
    activityEnd.getTime() + 24 * 60 * 60 * 1000,
  );

  if (now < activityStart) throw new Error("TOO_EARLY");
  if (now > attendanceLockTime) throw new Error("ATTENDANCE_LOCKED");

  const confirmedParticipants = await prisma.participant.findMany({
    where: { activityId, status: "CONFIRMED" },
    select: { id: true, userId: true },
  });

  const normalizedAttendance: Record<string, "ATTENDED" | "LATE" | "NO_SHOW"> =
    attendance && Object.keys(attendance).length > 0
      ? attendance
      : Object.fromEntries(
          confirmedParticipants.map((participant) => [
            participant.id,
            participantIds?.includes(participant.id) ? "ATTENDED" : "NO_SHOW",
          ]),
        );

  const previousNoShowCounts = new Map<string, number>();
  const touchedUserIds = new Set<string>();
  const updates = confirmedParticipants.map((participant) => {
    const nextStatus = normalizedAttendance[participant.id] ?? "NO_SHOW";

    return prisma.participant.update({
      where: { id: participant.id },
      data: { attendanceStatus: nextStatus },
    });
  });

  for (const participant of confirmedParticipants) {
    touchedUserIds.add(participant.userId);
    if (!previousNoShowCounts.has(participant.userId)) {
      previousNoShowCounts.set(
        participant.userId,
        await getNoShowCount(participant.userId),
      );
    }
  }

  await prisma.$transaction(updates);

  await Promise.all(
    Array.from(touchedUserIds).map((userId) =>
      maybeSendNoShowWarning(userId, previousNoShowCounts.get(userId) ?? 0),
    ),
  );
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
  }
}
