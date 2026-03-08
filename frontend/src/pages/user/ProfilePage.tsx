import * as React from "react";
import UserProfileCard from "@/components/profile/UserProfileCard";
import UserStatsCard from "@/components/profile/UserStatsCard";
import ReliabilityBadge from "@/components/profile/ReliabilityBadge";
import EditProfileDrawer from "@/components/community/EditProfileDrawer";
import type { UserStatsItem } from "@/components/profile/UserStatsCard";
import { Spinner } from "@/components/ui/spinner";
import { useRole } from "@/hooks/useRole";
import { userApi, type UserProfile } from "@/lib/api";
import { CalendarDays, Flame } from "lucide-react";
import { toast } from "sonner";

/** Build the last-7-weeks streak bubbles from a streak count. */
function buildStreakDots(currentStreak: number) {
  // Show temporal labels so users know which direction is "now"
  const weekLabels = ["6w ago", "5w ago", "4w ago", "3w ago", "2w ago", "Last wk", "This wk"];
  return weekLabels.map((label, i) => ({
    label,
    done: i >= weekLabels.length - currentStreak,
  }));
}

export default function ProfilePage() {
  const { session } = useRole();
  const userId = (session?.user as any)?.id as string | undefined;

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await userApi.getProfile(userId);
      setProfile(data);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load profile");
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
          value: `${profile.stats.currentStreak}wk`,
        },
        {
          id: "joinedThisMonth",
          type: "joinedThisMonth",
          label: "Joined This Month",
          value: String(profile.stats.thisMonth),
        },
        {
          id: "activitiesHosted",
          type: "activitiesHosted",
          label: "Activities Hosted",
          value: String(profile.stats.activitiesHosted),
        },
        {
          id: "newFriendsMet",
          type: "newFriendsMet",
          label: "Total Joined",
          value: String(profile.stats.totalAttended),
        },
      ]
    : [];

  const streakDots = buildStreakDots(
    Math.min(profile?.stats.currentStreak ?? 0, 7),
  );

  const handleProfileSave = async (values: {
    name: string;
    locations: string[];
    skillLevel: string;
    sportsPreferences: string[];
    preferredTimings: string[];
    image?: string | null;
  }) => {
    try {
      await userApi.updateMe({
        name: values.name,
        skillLevel: values.skillLevel,
        sportInterests: values.sportsPreferences,
        preferredAreas: values.locations,
        preferredTimes: values.preferredTimings,
        ...(values.image ? { image: values.image } : {}),
      });
      toast.success("Profile updated!");
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save profile");
    }
  };

  if (loading && !profile) {
    return (
      <div className="grid place-items-center min-h-[60vh]">
        <Spinner className="size-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Edit Profile Drawer */}
      <div className="relative z-60 self-end">
        <EditProfileDrawer
          defaultValues={{
            name: profile?.name ?? session?.user?.name ?? "",
            locations: profile?.preferredAreas ?? [],
            skillLevel: profile?.skillLevel ?? "",
            sportsPreferences: profile?.sportInterests ?? [],
            preferredTimings: profile?.preferredTimes ?? [],
            image: profile?.image ?? session?.user?.image ?? null,
          }}
          onDone={handleProfileSave}
        />
      </div>

      <UserProfileCard
        image={profile?.image ?? session?.user?.image}
        name={profile?.name ?? session?.user?.name}
        location={
          profile?.preferredAreas?.length
            ? profile.preferredAreas.join(", ")
            : "Singapore"
        }
        level={profile?.skillLevel ?? "Intermediate Level"}
      />

      {/* Reliability badge + explanation */}
      {profile && (
        <section className="flex flex-col items-center gap-1.5">
          <ReliabilityBadge
            badge={profile.reliabilityBadge}
            score={profile.reliabilityScore}
            showScore
            className="text-sm px-4 py-1.5"
          />
          <p className="text-xs text-muted-foreground">
            {profile.reliabilityScore === null
              ? "Complete 5+ activities to earn a reliability score"
              : "Based on attended activities vs no-shows and late cancellations"}
          </p>
        </section>
      )}

      {/* Stats cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        {statsItems.map((item) => (
          <UserStatsCard key={item.id} item={item} />
        ))}
      </section>

      {/* Streak panel */}
      <section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary-foreground/15 p-3">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Weekly Streak</h2>
            <p className="text-sm font-semibold tracking-wide uppercase opacity-90">
              {profile?.stats.currentStreak ?? 0} consecutive weeks
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl bg-primary-foreground/10 p-4">
          {streakDots.map((dot, index) => (
            <div
              key={dot.label + index}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`flex h-5 w-5 min-[375px]:h-6 min-[375px]:w-6 md:h-8 md:w-8 items-center justify-center rounded-full ${
                  dot.done
                    ? "bg-accent text-primary"
                    : "bg-primary-foreground/20 text-transparent"
                }`}
              >
                {dot.done ? (
                  <Flame className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/30" />
                )}
              </div>
              <span className="text-xs font-semibold">{dot.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bio */}
      {profile?.bio ? (
        <section className="rounded-2xl border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            About
          </h3>
          <p className="text-sm leading-relaxed">{profile.bio}</p>
        </section>
      ) : profile?.isOwnProfile ? (
        <section className="rounded-2xl border border-dashed bg-card p-5 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">No bio yet</p>
          <p className="text-xs text-muted-foreground">
            Tap Edit Profile to add a short bio so others know who you are.
          </p>
        </section>
      ) : null}

      {/* Favourite sport */}
      {profile?.stats.favoriteSport ? (
        <section className="rounded-2xl border bg-card px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            Favourite sport
          </span>
          <span className="text-sm font-semibold">
            {profile.stats.favoriteSport}
          </span>
        </section>
      ) : profile?.isOwnProfile ? (
        <section className="rounded-2xl border border-dashed bg-card px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Favourite sport
          </span>
          <span className="text-xs text-muted-foreground italic">
            Join more activities to see your favourite sport
          </span>
        </section>
      ) : null}
    </div>
  );
}
