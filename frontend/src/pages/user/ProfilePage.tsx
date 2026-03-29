import * as React from "react";
import UserProfileCard from "@/components/profile/UserProfileCard";
import UserStatsCard from "@/components/profile/UserStatsCard";
import ReliabilityBadge from "@/components/profile/ReliabilityBadge";
import EditProfileDrawer from "@/components/community/EditProfileDrawer";
import type { UserStatsItem } from "@/components/profile/UserStatsCard";
import { Spinner } from "@/components/ui/spinner";
import { useRole } from "@/hooks/useRole";
import {
  BadgeCheck,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  Medal,
  PersonStanding,
  Shield,
  ShieldAlert,
  Star,
  Trophy,
  Waves,
} from "lucide-react";
import { activityApi, userApi, type UserProfile } from "@/lib/api";
import { toast } from "sonner";
import { authClient } from "@/lib/client-auth";
import {
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/custom-tabs";
import { TabsContent } from "@/components/ui/tabs";

function capitalize(value?: string | null) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeActivityType(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function getActivityIcon(activityType?: string | null) {
  const normalized = normalizeActivityType(activityType);

  if (normalized.includes("run")) return Footprints;
  if (normalized.includes("cycle")) return Bike;
  if (normalized.includes("swim")) return Waves;
  if (normalized.includes("yoga")) return PersonStanding;
  if (normalized.includes("badminton")) return Trophy;
  return Dumbbell;
}

const badgeShowcase = [
  {
    label: "New",
    description: "Complete 5 tracked activities to move beyond the starter badge.",
    icon: Star,
    palette: "from-slate-200 via-slate-100 to-white",
    trim: "border-slate-300",
    ribbon: "bg-slate-500",
  },
  {
    label: "Active",
    description: "Stay involved and keep turning up to your activities.",
    icon: Flame,
    palette: "from-sky-400 via-cyan-300 to-white",
    trim: "border-sky-300",
    ribbon: "bg-sky-600",
  },
  {
    label: "Consistent",
    description: "Reach a 90% attendance rate with at least 5 tracked activities.",
    icon: BadgeCheck,
    palette: "from-emerald-400 via-lime-300 to-white",
    trim: "border-emerald-300",
    ribbon: "bg-emerald-600",
  },
  {
    label: "Always on Time!",
    description: "Complete 10 tracked activities with zero late arrivals.",
    icon: Medal,
    palette: "from-amber-300 via-yellow-200 to-white",
    trim: "border-amber-300",
    ribbon: "bg-amber-600",
  },
  {
    label: "No-Show Warning",
    description: "Triggered when your no-show rate reaches 20% or more.",
    icon: Shield,
    palette: "from-rose-400 via-orange-300 to-white",
    trim: "border-rose-300",
    ribbon: "bg-rose-600",
  },
] as const;

function getCalendarMatrix(monthLabel: string) {
  const [monthName, yearLabel] = monthLabel.split(" ");
  const monthIndex = new Date(`${monthName} 1, ${yearLabel}`).getMonth();
  const year = Number(yearLabel);
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const cells: Array<Date | null> = [];

  for (let index = 0; index < totalCells; index++) {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      cells.push(null);
    } else {
      cells.push(new Date(year, monthIndex, dayNumber));
    }
  }

  return cells;
}

export default function ProfilePage() {
  const { session } = useRole();
  const userId = session?.user?.id as string | undefined;
  const user = session?.user;

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");

  const fetchProfile = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await userApi.getProfile(userId);
      setProfile(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const statsItems: UserStatsItem[] = profile
    ? [
        {
          id: "currentStreak",
          type: "currentStreak",
          label: "Week Streak",
          value: `${profile.stats.currentStreak} week(s)`,
        },
        {
          id: "joinedThisMonth",
          type: "joinedThisMonth",
          label: "Joined This Month",
          value: String(profile.stats.joinedThisMonth),
        },
        {
          id: "newFriendsMet",
          type: "newFriendsMet",
          label: "New Friends Met",
          value: String(profile.stats.newFriendsMet),
        },
        {
          id: "activitiesHosted",
          type: "activitiesHosted",
          label: "Activities Hosted",
          value: String(profile.stats.activitiesHosted),
        },
      ]
    : [];

  const calendarCounts = React.useMemo(
    () =>
      new Map(
        (profile?.calendar.days ?? []).map((entry) => [
          entry.date,
          entry.latestActivityType,
        ]),
      ),
    [profile?.calendar.days],
  );

  const calendarCells = React.useMemo(
    () => (profile ? getCalendarMatrix(profile.calendar.monthLabel) : []),
    [profile],
  );

  const handleProfileSave = async (values: {
    name: string;
    bio: string;
    locations: string[];
    skillLevel: string;
    sportsPreferences: string[];
    preferredTimings: string[];
    locationSharingEnabled?: boolean;
    image?: string | null;
    imageFile?: File | null;
  }) => {
    try {
      let imageUrl = values.image;
      if (values.imageFile) {
        imageUrl = await activityApi.uploadImage(values.imageFile);
      }

      await userApi.updateProfile({
        name: values.name,
        bio: values.bio,
        preferredAreas: values.locations,
        skillLevel: values.skillLevel,
        sportInterests: values.sportsPreferences,
        preferredTimes: values.preferredTimings,
        locationSharingEnabled: values.locationSharingEnabled,
        image: imageUrl,
      });

      await authClient.getSession({ fetchOptions: { cache: "no-store" } });
      toast.success("Profile updated!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  if (loading && !profile) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="size-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <UserProfileCard
        image={profile?.image ?? user?.image}
        name={profile?.name ?? user?.name}
        location={
          profile?.preferredAreas?.length
            ? profile.preferredAreas.join(", ")
            : "Singapore"
        }
        level={capitalize(profile?.skillLevel) || "Intermediate"}
        metaRow={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <Dumbbell className="h-4 w-4" />
              {capitalize(profile?.skillLevel) || "Intermediate"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <Star className="h-4 w-4" />
              {profile?.stats.favoriteSport ?? "Favourite sport pending"}
            </span>
          </div>
        }
        editAction={
          <EditProfileDrawer
            defaultValues={{
              name: profile?.name ?? user?.name ?? "",
              bio: profile?.bio ?? "",
              locations: profile?.preferredAreas ?? [],
              skillLevel: profile?.skillLevel ?? "",
              sportsPreferences: profile?.sportInterests ?? [],
              preferredTimings: profile?.preferredTimes ?? [],
              image: profile?.image ?? user?.image ?? null,
              locationSharingEnabled:
                profile?.locationSharingEnabled ??
                (user as { locationSharingEnabled?: boolean } | undefined)
                  ?.locationSharingEnabled ??
                false,
            }}
            onDone={handleProfileSave}
          />
        }
      />

      {profile && profile.reliability.totalNoShow >= 5 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-red-700" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Warning: your no-show count is high.
              </p>
              <p className="mt-1 text-xs text-red-600">
                Continued no-shows may affect your reputation in the PlayMatch
                community.
              </p>
            </div>
          </div>
        </section>
      )}

      <CustomTabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mx-auto mb-2 w-full"
      >
        <CustomTabsList>
          <CustomTabsTrigger value="overview">Overview</CustomTabsTrigger>
          <CustomTabsTrigger value="stats">Stats</CustomTabsTrigger>
          <CustomTabsTrigger value="calendar">Calendar</CustomTabsTrigger>
          <CustomTabsTrigger value="badges">Badges</CustomTabsTrigger>
        </CustomTabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {profile?.bio ? (
            <section className="space-y-2 rounded-2xl border bg-card p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                About
              </h3>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </section>
          ) : (
            <section className="space-y-1 rounded-2xl border border-dashed bg-card p-5">
              <p className="text-sm font-medium text-muted-foreground">
                No bio yet
              </p>
              <p className="text-xs text-muted-foreground">
                Tap Edit Profile to add a short bio so others know who you are.
              </p>
            </section>
          )}

          {profile && (
            <section className="flex flex-col items-center gap-2">
              <ReliabilityBadge
                badge={profile.badge}
                score={profile.reliability.attendanceRate}
                showScore
              />
              <p className="text-xs text-muted-foreground">
                {profile.reliability.totalActivities < 5
                  ? "Complete 5 tracked activities to unlock your long-term reliability badge."
                  : `${profile.reliability.totalAttended} attended, ${profile.reliability.totalLate} late, ${profile.reliability.totalNoShow} no-show.`}
              </p>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Attendance Rate
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {profile?.reliability.attendanceRate ?? 0}%
              </p>
            </article>
            <article className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Punctuality Rate
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {profile?.reliability.punctualityRate ?? 0}%
              </p>
            </article>
          </section>
        </TabsContent>

        <TabsContent value="stats" className="mt-6 space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:gap-4">
            {statsItems.map((item) => (
              <UserStatsCard key={item.id} item={item} />
            ))}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Activities Joined
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {profile?.stats.totalActivitiesJoined ?? 0}
              </p>
            </article>
            <article className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Host Cancellation Rate
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {profile?.stats.hostCancellationRate ?? 0}%
              </p>
            </article>
          </section>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {profile?.calendar.monthLabel}
                </h2>
                <div className="mt-4 flex gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Streak</p>
                    <p className="text-3xl font-bold text-primary">
                      {profile?.stats.currentStreak ?? 0} Weeks
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Streak Activities
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {profile?.calendar.streakActivities ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-primary/10 px-4 py-6 text-center">
                <Flame className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current
                </p>
                <p className="text-3xl font-bold text-primary">
                  {profile?.stats.currentStreak ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-3 text-center text-sm text-muted-foreground">
              {["M", "T", "W", "T", "F", "S", "S"].map((label) => (
                <span key={label} className="font-medium">
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-7 gap-3">
              {calendarCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="h-16 rounded-2xl" />;
                }

                const key = cell.toISOString().slice(0, 10);
                const latestActivityType = calendarCounts.get(key) ?? null;
                const ActivityIcon = getActivityIcon(latestActivityType);
                return (
                  <div
                    key={key}
                    className="flex h-16 items-center justify-center rounded-2xl border bg-background"
                  >
                    {latestActivityType ? (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background"
                        title={latestActivityType}
                      >
                        <ActivityIcon className="h-5 w-5" />
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {cell.getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="badges" className="mt-6 space-y-4">
          <section className="rounded-3xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Badge Cabinet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Earn streak and reliability badges as you keep showing up.
                </p>
              </div>
              {profile && (
                <ReliabilityBadge
                  badge={profile.badge}
                  score={profile.reliability.attendanceRate}
                  showScore
                />
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {badgeShowcase.map((badge) => {
                const Icon = badge.icon;
                const earned = profile?.badge.label === badge.label;

                return (
                  <article
                    key={badge.label}
                    className="rounded-3xl border bg-background p-4 text-center shadow-sm"
                  >
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div
                        className={[
                          "relative flex h-24 w-24 items-center justify-center rounded-full border-4 bg-gradient-to-b shadow-sm",
                          badge.palette,
                          badge.trim,
                          earned ? "" : "grayscale opacity-60",
                        ].join(" ")}
                      >
                        <Icon className="h-10 w-10 text-foreground" />
                        <span className="absolute -top-2 rounded-full border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          {earned ? "Earned" : "Locked"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className={["mt-[-1px] h-6 w-4 rounded-b-xl", badge.ribbon].join(" ")} />
                        <div className={["mt-[-1px] h-6 w-4 rounded-b-xl", badge.ribbon].join(" ")} />
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold">{badge.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {badge.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </TabsContent>
      </CustomTabs>
    </div>
  );
}
