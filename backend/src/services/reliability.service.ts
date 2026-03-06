// ── Reliability Score & Badge ────────────────────────────────────────────────
//
// Formula:  score = attended / (attended + noShows + lateCancels * 0.5) * 100
//
// Penalty weights:
//   ATTENDED      → 0   (positive)
//   CANCELLED     → 0   (>24 hrs, no penalty)
//   LATE_CANCEL   → 0.5 (partial penalty)
//   NO_SHOW       → 1.0 (full penalty)
//
// Score is only shown after the user has completed ≥ 5 activities.

export type ReliabilityBadge = {
  label:
    | "Rock Solid"
    | "Consistent"
    | "Inconsistent"
    | "No-Show Warning"
    | "New";
  icon: "⭐" | "✅" | "⚠️" | "🚩" | "🆕";
  colour: "green" | "yellow" | "orange" | "red" | "grey";
};

/**
 * Computes the reliability score from a user's participant records.
 * Returns null if fewer than 5 relevant activities exist.
 */
export function computeReliabilityScore(
  participants: { attendanceStatus: string }[],
): number | null {
  const relevant = participants.filter((p) =>
    ["ATTENDED", "NO_SHOW", "LATE_CANCEL"].includes(p.attendanceStatus),
  );

  if (relevant.length < 5) return null;

  const attended = relevant.filter(
    (p) => p.attendanceStatus === "ATTENDED",
  ).length;
  const noShows = relevant.filter(
    (p) => p.attendanceStatus === "NO_SHOW",
  ).length;
  const lateCancels = relevant.filter(
    (p) => p.attendanceStatus === "LATE_CANCEL",
  ).length;

  const denominator = attended + noShows + lateCancels * 0.5;
  if (denominator === 0) return 100;

  return Math.round((attended / denominator) * 100);
}

/**
 * Derives the reliability badge from a score + total activity count.
 */
export function getReliabilityBadge(
  score: number | null,
  totalRelevantActivities: number,
): ReliabilityBadge {
  if (totalRelevantActivities < 5 || score === null) {
    return { label: "New", icon: "🆕", colour: "grey" };
  }
  if (score >= 95) return { label: "Rock Solid", icon: "⭐", colour: "green" };
  if (score >= 85) return { label: "Consistent", icon: "✅", colour: "yellow" };
  if (score >= 70)
    return { label: "Inconsistent", icon: "⚠️", colour: "orange" };
  return { label: "No-Show Warning", icon: "🚩", colour: "red" };
}

/**
 * Derives the colour class string used in the UI (Tailwind-compatible).
 */
export function getScoreColourClass(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 95) return "text-green-600";
  if (score >= 85) return "text-yellow-500";
  if (score >= 70) return "text-orange-500";
  return "text-red-600";
}
