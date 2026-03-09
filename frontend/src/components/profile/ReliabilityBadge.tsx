import { cn } from "@/lib/utils";
import type { ReliabilityBadge as ReliabilityBadgeType } from "@/lib/api";

type ReliabilityBadgeProps = {
  badge: ReliabilityBadgeType;
  score: number | null;
  /** Show the numeric score alongside the badge label */
  showScore?: boolean;
  className?: string;
};

/**
 * Displays the user's reliability badge (e.g. "Rock Solid ⭐") with an
 * appropriate colour, optionally alongside the numeric score.
 *
 * Badge thresholds (from reliability.service.ts):
 *   ≥95%  Rock Solid      — green
 *   ≥85%  Consistent      — yellow/amber
 *   ≥70%  Inconsistent    — orange
 *   <70%  No-Show Warning — red
 *   <5 activities  New    — muted
 */
export default function ReliabilityBadge({
  badge,
  score,
  showScore = false,
  className,
}: ReliabilityBadgeProps) {
  const colourClass =
    badge.colour === "green"
      ? "text-green-600 bg-green-50 border-green-200"
      : badge.colour === "yellow"
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : badge.colour === "orange"
          ? "text-orange-600 bg-orange-50 border-orange-200"
          : badge.colour === "red"
            ? "text-destructive bg-red-50 border-red-200"
            : "text-muted-foreground bg-muted border-border"; // grey / new

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colourClass,
        className,
      )}
    >
      <span aria-hidden>{badge.icon}</span>
      {badge.label}
      {showScore && score !== null && (
        <span className="ml-1 opacity-70">({Math.round(score)}%)</span>
      )}
    </span>
  );
}
