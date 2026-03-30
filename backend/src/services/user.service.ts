import { prisma } from "../config/prisma";

interface User {
  id: number;
  name: string;
}

type CalendarDaySummary = {
  latestActivityType: string | null;
  latestStartAt: number;
};

export interface ReliabilityBadge {
  label:
    | "Always on Time!"
    | "Consistent"
    | "No-Show Warning"
    | "Active"
    | "New";
  icon: string;
  colour: "gold" | "green" | "red" | "blue" | "grey";
}

function getWeekStart(date: Date): Date {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function weekKey(date: Date): string {
  return getWeekStart(date).toISOString().slice(0, 10);
}

function computeWeeklyStreak(activityDates: Date[]) {
  if (activityDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const weeks = Array.from(new Set(activityDates.map(weekKey))).sort();
  let longest = 1;
  let running = 1;

  for (let index = 1; index < weeks.length; index++) {
    const previous = new Date(weeks[index - 1]!);
    const current = new Date(weeks[index]!);
    const diffWeeks = Math.round(
      (current.getTime() - previous.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );

    if (diffWeeks === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  const currentWeek = weekKey(new Date());
  const previousWeek = weekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  let current = 0;
  let backwardsRun = 0;
  for (let index = weeks.length - 1; index >= 0; index--) {
    const currentEntry = new Date(weeks[index]!);
    const nextEntry =
      index < weeks.length - 1 ? new Date(weeks[index + 1]!) : null;

    if (!nextEntry) {
      backwardsRun = 1;
    } else {
      const diffWeeks = Math.round(
        (nextEntry.getTime() - currentEntry.getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      );
      backwardsRun = diffWeeks === 1 ? backwardsRun + 1 : 1;
    }

    if (weeks[index] === currentWeek || weeks[index] === previousWeek) {
      current = backwardsRun;
      break;
    }
  }

  return { current, longest };
}

function getActivityStartDateTime(activity: { date: Date; startTime: string }) {
  const value = new Date(activity.date);
  const [hours, minutes] = activity.startTime.split(":").map(Number);
  value.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return value;
}

async function syncStartedHostAttendanceForUser(userId: string) {
  const hostParticipantRecords = await prisma.participant.findMany({
    where: {
      userId,
      status: "CONFIRMED",
      attendanceStatus: "PENDING",
    },
    include: {
      activity: {
        select: {
          id: true,
          date: true,
          startTime: true,
          hostId: true,
          status: true,
        },
      },
    },
  });

  const toMark = hostParticipantRecords
    .filter((record) => {
      if (record.activity.hostId !== userId) return false;
      if (record.activity.status !== "ACTIVE") return false;
      return getActivityStartDateTime(record.activity).getTime() <= Date.now();
    })
    .map((record) => record.id);

  if (toMark.length === 0) return;

  await prisma.participant.updateMany({
    where: { id: { in: toMark } },
    data: { attendanceStatus: "ATTENDED" },
  });
}

export function getReliabilityBadge(
  totalActivities: number,
  totalLate: number,
  attendanceRate: number,
  noShowRate: number,
): ReliabilityBadge {
  if (totalActivities < 5) {
    return { label: "New", icon: "Sparkles", colour: "grey" };
  }

  if (totalActivities >= 10 && totalLate === 0) {
    return { label: "Always on Time!", icon: "Zap", colour: "gold" };
  }

  if (attendanceRate >= 90) {
    return { label: "Consistent", icon: "BadgeCheck", colour: "green" };
  }

  return { label: "Active", icon: "CircleUserRound", colour: "blue" };
}

export const getAllUsers = async (): Promise<User[]> => {
  return [{ id: 1, name: "Jordan" }];
};

export const getUserById = async (id: number): Promise<User | null> => {
  return { id: Number(id), name: "Jordan" };
};

export async function getUserProfile(viewerId: string, targetUserId: string) {
  await syncStartedHostAttendanceForUser(targetUserId);

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
      preferredAreas: true,
      skillLevel: true,
      sportInterests: true,
      preferredTimes: true,
      locationSharingEnabled: true,
      emailNotificationsEnabled: true,
      activityRemindersEnabled: true,
      hostedActivities: {
        select: {
          id: true,
          status: true,
          date: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const trackedParticipants = await prisma.participant.findMany({
    where: {
      userId: targetUserId,
      attendanceStatus: { in: ["ATTENDED", "LATE", "NO_SHOW"] },
    },
    include: {
      activity: {
        select: {
          id: true,
          activityType: true,
          date: true,
          startTime: true,
        },
      },
    },
  });

  const totalAttended = trackedParticipants.filter(
    (entry) => entry.attendanceStatus === "ATTENDED",
  ).length;
  const totalLate = trackedParticipants.filter(
    (entry) => entry.attendanceStatus === "LATE",
  ).length;
  const totalNoShow = trackedParticipants.filter(
    (entry) => entry.attendanceStatus === "NO_SHOW",
  ).length;
  const totalActivities = totalAttended + totalLate + totalNoShow;

  const attendanceRate =
    totalActivities === 0
      ? 0
      : Math.round(((totalAttended + totalLate) / totalActivities) * 100);
  const punctualityRate =
    totalAttended + totalLate === 0
      ? 0
      : Math.round((totalAttended / (totalAttended + totalLate)) * 100);
  const noShowRate =
    totalActivities === 0
      ? 0
      : Math.round((totalNoShow / totalActivities) * 100);

  const badge = getReliabilityBadge(
    totalActivities,
    totalLate,
    attendanceRate,
    noShowRate,
  );

  const attendedOrLate = trackedParticipants.filter((entry) =>
    ["ATTENDED", "LATE"].includes(entry.attendanceStatus),
  );

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const joinedThisMonth = attendedOrLate.filter(
    (entry) => entry.activity.date >= thisMonthStart,
  ).length;

  const weeklyStreak = computeWeeklyStreak(
    attendedOrLate.map((entry) => entry.activity.date),
  );

  const favoriteSportCounts: Record<string, number> = {};
  for (const entry of attendedOrLate) {
    favoriteSportCounts[entry.activity.activityType] =
      (favoriteSportCounts[entry.activity.activityType] ?? 0) + 1;
  }
  const favoriteSport =
    Object.entries(favoriteSportCounts).sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0] ?? null;

  const attendedActivityIds = attendedOrLate.map((entry) => entry.activityId);
  const metParticipants =
    attendedActivityIds.length === 0
      ? []
      : await prisma.participant.findMany({
          where: {
            activityId: { in: attendedActivityIds },
            userId: { not: targetUserId },
            attendanceStatus: { in: ["ATTENDED", "LATE"] },
          },
          select: { userId: true },
          distinct: ["userId"],
        });

  const totalHosted = user.hostedActivities.filter(
    (activity) => activity.status !== "CANCELLED" && activity.date < new Date(),
  ).length;
  const totalCancelledAsHost = user.hostedActivities.filter(
    (activity) => activity.status === "CANCELLED",
  ).length;
  const hostStatsDenominator = totalHosted + totalCancelledAsHost;
  const cancellationRate =
    hostStatsDenominator === 0
      ? 0
      : Math.round((totalCancelledAsHost / hostStatsDenominator) * 100);

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const nextMonthStart = new Date(currentMonthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

  const calendarEntries = new Map<string, CalendarDaySummary>();
  for (const entry of attendedOrLate) {
    if (
      entry.activity.date >= currentMonthStart &&
      entry.activity.date < nextMonthStart
    ) {
      const key = entry.activity.date.toISOString().slice(0, 10);
      const latestStartAt = getActivityStartDateTime({
        date: entry.activity.date,
        startTime: entry.activity.startTime,
      }).getTime();
      const currentEntry = calendarEntries.get(key);

      if (!currentEntry || latestStartAt >= currentEntry.latestStartAt) {
        calendarEntries.set(key, {
          latestActivityType: entry.activity.activityType,
          latestStartAt,
        });
      }
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    bio: user.bio,
    memberSince: user.createdAt.toISOString(),
    preferredAreas: user.preferredAreas,
    skillLevel: user.skillLevel,
    sportInterests: user.sportInterests,
    preferredTimes: user.preferredTimes,
    locationSharingEnabled: user.locationSharingEnabled,
    emailNotificationsEnabled: user.emailNotificationsEnabled,
    activityRemindersEnabled: user.activityRemindersEnabled,
    reliability: {
      totalAttended,
      totalLate,
      totalNoShow,
      totalActivities,
      attendanceRate,
      punctualityRate,
      noShowRate,
    },
    badge,
    stats: {
      currentStreak: weeklyStreak.current,
      longestStreak: weeklyStreak.longest,
      joinedThisMonth,
      newFriendsMet: metParticipants.length,
      activitiesHosted: totalHosted,
      totalActivitiesJoined: attendedOrLate.length,
      favoriteSport,
      hostCancellationRate: cancellationRate,
      totalCancelledAsHost,
    },
    calendar: {
      monthLabel: currentMonthStart.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      streakActivities: attendedOrLate.length,
      days: Array.from(calendarEntries.entries()).map(([date, summary]) => ({
        date,
        latestActivityType: summary.latestActivityType,
      })),
    },
    isOwnProfile: viewerId === targetUserId,
  };
}

export const updateLocationSharing = async (
  userId: string,
  enabled: boolean,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { locationSharingEnabled: enabled },
    select: { locationSharingEnabled: true },
  });
};

interface UpdateProfileInput {
  name?: string;
  preferredAreas?: string[];
  skillLevel?: string;
  sportInterests?: string[];
  preferredTimes?: string[];
  locationSharingEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  activityRemindersEnabled?: boolean;
  image?: string | null;
  bio?: string;
  matchRadius?: number;
}

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      preferredAreas: true,
      skillLevel: true,
      sportInterests: true,
      preferredTimes: true,
      locationSharingEnabled: true,
      emailNotificationsEnabled: true,
      activityRemindersEnabled: true,
      bio: true,
      matchRadius: true,
    },
  });
};
