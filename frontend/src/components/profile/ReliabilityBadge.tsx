import {
  BadgeCheck,
  CircleUserRound,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReliabilityBadge as ReliabilityBadgeType } from "@/lib/api";

const iconByName = {
  BadgeCheck,
  CircleUserRound,
  Sparkles,
  TriangleAlert,
  Zap,
} as const;

const colourClasses: Record<ReliabilityBadgeType["colour"], string> = {
  gold: "border-yellow-300 bg-yellow-100 text-yellow-800",
  green: "border-green-300 bg-green-100 text-green-800",
  red: "border-red-300 bg-red-100 text-red-800",
  blue: "border-blue-300 bg-blue-100 text-blue-800",
  grey: "border-slate-300 bg-slate-100 text-slate-700",
};

type Props = {
  badge: ReliabilityBadgeType;
  score?: number;
  showScore?: boolean;
  className?: string;
};

export default function ReliabilityBadge({
  badge,
  score,
  showScore = false,
  className,
}: Props) {
  const Icon = iconByName[badge.icon as keyof typeof iconByName] ?? Sparkles;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
        colourClasses[badge.colour],
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{badge.label}</span>
      {showScore && typeof score === "number" && (
        <span className="text-xs opacity-80">{score}% attendance</span>
      )}
    </div>
  );
}
