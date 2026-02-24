import { CalendarDays, Medal, Trophy, UserRoundPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type UserStatsType =
  | "currentStreak"
  | "joinedThisMonth"
  | "newFriendsMet"
  | "activitiesHosted";

export type UserStatsItem = {
  id: string;
  type: UserStatsType;
  label: string;
  value: string;
};

type UserStatsCardProps = {
  item: UserStatsItem;
};

const iconByType: Record<UserStatsType, LucideIcon> = {
  currentStreak: Trophy,
  joinedThisMonth: Medal,
  newFriendsMet: UserRoundPlus,
  activitiesHosted: CalendarDays,
};

export default function UserStatsCard({ item }: UserStatsCardProps) {
  const Icon = iconByType[item.type];
  const isPrimary = item.type === "currentStreak";

  return (
    <article
      className={[
        "flex min-h-32 w-full min-w-0 flex-col rounded-3xl p-5 shadow-sm",
        isPrimary
          ? "bg-primary text-primary-foreground"
          : "border bg-card text-foreground",
      ].join(" ")}
    >
      <Icon className={isPrimary ? "h-5 w-5 opacity-90" : "h-5 w-5 text-primary"} />
      <p
        className={[
          "mt-3 font-semibold uppercase tracking-wider text-xs",
          isPrimary ? "opacity-90" : "text-muted-foreground",
        ].join(" ")}
      >
        {item.label}
      </p>
      <p className={[
          "mt-1 text-2xl font-extrabold leading-none sm:text-4xl",
          isPrimary ? "text-accent" : "text-primary",
        ].join(" ")}>{item.value}</p>
    </article>
  );
}