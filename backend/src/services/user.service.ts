import { prisma } from "../config/prisma";
import {
  computeReliabilityScore,
  getReliabilityBadge,
} from "./reliability.service";

// ── Streak helpers ────────────────────────────────────────────────────────────

/** Returns the Monday (00:00:00) of the week containing `date`. */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Stable string key for a week: "YYYY-MM-DD" of that week's Monday. */
function weekKey(date: Date): string {
  return getMondayOfWeek(date).toISOString().split("T")[0]!;
}

/**
 * Computes current and longest activity streaks (week-based).
 * A streak requires ≥1 attended activity per consecutive week.
 * The current streak remains alive if the user participated this week OR last week.
 */
function computeStreaks(attendedDates: Date[]): {
  current: number;
  longest: number;
} {
  if (attendedDates.length === 0) return { current: 0, longest: 0 };

  // Unique sorted week keys
  const weekSet = new Set(attendedDates.map(weekKey));
  const weeks = Array.from(weekSet).sort(); // ascending "YYYY-MM-DD" strings

  // Build streak runs
  let longest = 1;
  let runLength = 1;
  for (let i = 1; i < weeks.length; i++) {
    const prev = new Date(weeks[i - 1]!);
    const curr = new Date(weeks[i]!);
    const diffWeeks = Math.round(
      (curr.getTime() - prev.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    if (diffWeeks === 1) {
      runLength++;
      if (runLength > longest) longest = runLength;
    } else {
      runLength = 1;
    }
  }

  // Is the streak still active? (last active week is this week or last week)
  const lastActiveWeek = weeks[weeks.length - 1]!;
  const thisWeek = weekKey(new Date());
  const lastWeek = weekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const streakAlive =
    lastActiveWeek === thisWeek || lastActiveWeek === lastWeek;
  const current = streakAlive ? runLength : 0;

  return { current, longest };
}

// ── getUserProfile ────────────────────────────────────────────────────────────

export async function getUserProfile(viewerId: string, targetUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      sportInterests: true,
      skillLevel: true,
      preferredAreas: true,
      preferredTimes: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  // Fetch all participant records for stats + reliability
  const participations = await prisma.participant.findMany({
    where: { userId: targetUserId },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          activityType: true,
          date: true,
          startTime: true,
          location: true,
          skillLevel: true,
          host: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { activity: { date: "desc" } },
  });

  // ── Reliability score ───────────────────────────────────────────────────────
  const reliabilityScore = computeReliabilityScore(
    participations.map((p) => ({ attendanceStatus: p.attendanceStatus })),
  );
  const reliabilityBadge = getReliabilityBadge(
    reliabilityScore,
    participations.filter((p) =>
      ["ATTENDED", "NO_SHOW", "LATE_CANCEL"].includes(p.attendanceStatus),
    ).length,
  );

  // ── Activity stats ─────────────────────────────────────────────────────────
  const attended = participations.filter(
    (p) => p.attendanceStatus === "ATTENDED",
  );

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = attended.filter(
    (p) => new Date(p.activity.date) >= startOfMonth,
  ).length;

  const activitiesHosted = await prisma.activity.count({
    where: { hostId: targetUserId },
  });

  // Streak uses attended activity dates
  const streaks = computeStreaks(
    attended.map((p) => new Date(p.activity.date)),
  );

  // Favorite sport: most frequent activityType among attended
  const sportCounts: Record<string, number> = {};
  for (const p of attended) {
    const t = p.activity.activityType;
    sportCounts[t] = (sportCounts[t] ?? 0) + 1;
  }
  const favoriteSport =
    Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // ── Activity history (last 20, all statuses) ───────────────────────────────
  const activityHistory = participations.slice(0, 20).map((p) => ({
    id: p.activity.id,
    title: p.activity.title,
    activityType: p.activity.activityType,
    date: p.activity.date.toISOString(),
    startTime: p.activity.startTime,
    location: p.activity.location,
    skillLevel: p.activity.skillLevel,
    participantStatus: p.status,
    attendanceStatus: p.attendanceStatus,
    host: p.activity.host,
  }));

  return {
    // Base user info
    id: user.id,
    name: user.name,
    image: user.image,
    bio: user.bio,
    sportInterests: user.sportInterests,
    skillLevel: user.skillLevel,
    preferredAreas: user.preferredAreas,
    preferredTimes: user.preferredTimes,
    memberSince: user.createdAt.toISOString(),

    // Reliability
    reliabilityScore,
    reliabilityBadge,

    // Stats
    stats: {
      totalAttended: attended.length,
      thisMonth,
      activitiesHosted,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      favoriteSport,
    },

    // History
    activityHistory,

    // Meta
    isOwnProfile: viewerId === targetUserId,
  };
}

// ── updateUserProfile ─────────────────────────────────────────────────────────

export async function updateUserProfile(
  userId: string,
  input: {
    bio?: string;
    name?: string;
    image?: string;
    sportInterests?: string[];
    skillLevel?: string;
    preferredAreas?: string[];
    preferredTimes?: string[];
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.name && { name: input.name }),
      ...(input.image !== undefined && { image: input.image }),
      ...(input.sportInterests && { sportInterests: input.sportInterests }),
      ...(input.skillLevel && { skillLevel: input.skillLevel }),
      ...(input.preferredAreas && { preferredAreas: input.preferredAreas }),
      ...(input.preferredTimes && { preferredTimes: input.preferredTimes }),
    },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      sportInterests: true,
      skillLevel: true,
      preferredAreas: true,
      preferredTimes: true,
    },
  });
}
