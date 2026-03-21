import { prisma } from "../config/prisma";

// ── Types ───────────────────────────────────────────────────────────────

interface BuddyMatch {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  sportInterests: string[];
  skillLevel: string | null;
  preferredTimes: string[];
  preferredAreas: string[];
  compatibilityScore: number;
  commonSports: string[];
  commonTimes: string[];
  commonAreas: string[];
  upcomingActivities: Array<{
    id: string;
    title: string;
    activityType: string;
    date: string;
    startTime: string;
    location: string;
    slotsLeft: number;
  }>;
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Calculate compatibility score between two users
 * Score breakdown:
 * - 30 points: Common sport interests
 * - 25 points: Same skill level
 * - 25 points: Overlapping preferred times
 * - 20 points: Overlapping preferred areas
 */
function calculateCompatibility(
  currentUser: {
    sportInterests: string[];
    skillLevel: string | null;
    preferredTimes: string[];
    preferredAreas: string[];
  },
  otherUser: {
    sportInterests: string[];
    skillLevel: string | null;
    preferredTimes: string[];
    preferredAreas: string[];
  }
): { score: number; commonSports: string[]; commonTimes: string[]; commonAreas: string[] } {
  let score = 0;

  // Common sports (max 30 points)
  const commonSports = currentUser.sportInterests.filter((s) =>
    otherUser.sportInterests.includes(s)
  );
  if (commonSports.length > 0) {
    score += Math.min(30, commonSports.length * 10);
  }

  // Same skill level (25 points)
  if (
    currentUser.skillLevel &&
    otherUser.skillLevel &&
    currentUser.skillLevel.toLowerCase() === otherUser.skillLevel.toLowerCase()
  ) {
    score += 25;
  }

  // Common preferred times (max 25 points)
  const commonTimes = currentUser.preferredTimes.filter((t) =>
    otherUser.preferredTimes.includes(t)
  );
  if (commonTimes.length > 0) {
    score += Math.min(25, commonTimes.length * 8);
  }

  // Common preferred areas (max 20 points)
  const commonAreas = currentUser.preferredAreas.filter((a) =>
    otherUser.preferredAreas.includes(a)
  );
  if (commonAreas.length > 0) {
    score += Math.min(20, commonAreas.length * 7);
  }

  return { score, commonSports, commonTimes, commonAreas };
}

// ── Get Potential Matches ───────────────────────────────────────────────

export async function getPotentialMatches(userId: string): Promise<BuddyMatch[]> {
  // Get current user with their preferences
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sportInterests: true,
      skillLevel: true,
      preferredTimes: true,
      preferredAreas: true,
    },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find potential matches (excluding self)
  const potentialUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      // Only users who have completed onboarding and have at least some preferences
      shouldOnboard: false,
      OR: [
        { sportInterests: { isEmpty: false } },
        { preferredAreas: { isEmpty: false } },
      ],
    },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      sportInterests: true,
      skillLevel: true,
      preferredTimes: true,
      preferredAreas: true,
      // Include user's upcoming hosted activities
      hostedActivities: {
        where: {
          status: "ACTIVE",
          date: { gte: today },
        },
        select: {
          id: true,
          title: true,
          activityType: true,
          date: true,
          startTime: true,
          location: true,
          maxParticipants: true,
          _count: {
            select: {
              participants: {
                where: { status: "CONFIRMED" },
              },
            },
          },
        },
        orderBy: { date: "asc" },
        take: 5, // Limit to 5 upcoming activities
      },
    },
  });

  // Calculate compatibility for each user
  const matches: BuddyMatch[] = potentialUsers
    .map((user) => {
      const { score, commonSports, commonTimes, commonAreas } = calculateCompatibility(
        currentUser,
        user
      );

      return {
        id: user.id,
        name: user.name,
        image: user.image,
        bio: user.bio,
        sportInterests: user.sportInterests,
        skillLevel: user.skillLevel,
        preferredTimes: user.preferredTimes,
        preferredAreas: user.preferredAreas,
        compatibilityScore: score,
        commonSports,
        commonTimes,
        commonAreas,
        upcomingActivities: user.hostedActivities.map((a) => ({
          id: a.id,
          title: a.title,
          activityType: a.activityType,
          date: a.date.toISOString(),
          startTime: a.startTime,
          location: a.location,
          slotsLeft: a.maxParticipants - a._count.participants,
        })),
      };
    })
    // Filter by minimum compatibility score (50%)
    .filter((match) => match.compatibilityScore >= 50)
    // Sort by compatibility score (highest first)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return matches;
}
