import UserProfileCard from "@/components/UserProfileCard";
import UserStatsCard from "@/components/UserStatsCard";
import type { UserStatsItem } from "@/components/UserStatsCard";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { CalendarDays, Flame, Pencil } from "lucide-react"

// TODO: Replace with actual data
import userStats from "@/data/user-stats.json";

const streakDays = [
    { label: "M", done: true },
    { label: "T", done: false },
    { label: "W", done: false },
    { label: "T", done: false },
    { label: "F", done: false },
    { label: "S", done: false },
    { label: "S", done: false },
]

export default function ProfilePage() {
    const { session } = useRole();
    const user = session?.user;
    const preferredAreas = (user as { preferredAreas?: string[] } | undefined)?.preferredAreas;
    const statsItems = userStats as UserStatsItem[];

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
            <Button
                aria-label="Edit profile"
                variant="outline"
                className="absolute right-4 top-20 items-center justify-center"
            >
                <Pencil className="h-4 w-4" />
                Edit
            </Button>

            <UserProfileCard
                image={user?.image}
                name={user?.name}
                location={preferredAreas?.length ? preferredAreas.join(", ") : "Singapore"}
                level="Intermediate Level"
            />

            {/* Stats cards (flexbox) */}
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
                        <h2 className="text-xl min-[375px]:text-[3xl] font-bold">Personal Streak</h2>
                        <p className="text-sm font-semibold tracking-wide uppercase opacity-90">Consistency is key</p>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl bg-primary-foreground/10 p-4">
                    {streakDays.map((day) => (
                        <div key={day.label} className="flex flex-col items-center gap-2">
                            <div
                                className={`flex h-[1.25rem] w-[1.25rem] min-[375px]:h-[1.5rem] min-[375px]:w-[1.5rem] md:h-8 md:w-8 items-center justify-center rounded-full ${day.done
                                        ? "bg-accent text-primary"
                                        : "bg-primary-foreground/20 text-transparent"
                                    }`}
                            >
                                {day.done ? <Flame className="h-5 w-5" /> : <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/30" />}
                            </div>
                            <span className="text-xs font-semibold">{day.label}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}