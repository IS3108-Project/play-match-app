import { Button } from "@/components/ui/button"

type Activity = {
    activityTitle: string
    location: string
    date: string
    joined: number
    slotsLeft: number
    activityType: string
    status: "joined" | "confirmed" | "cancelled" | "pending" | "ended" | "not-joined"
    imageSrc?: string
}

type ActivityCardProps = {
    activity: Activity
}

export default function ActivityCard({ activity }: ActivityCardProps) {
    return (
        <div className="flex flex-row overflow-hidden rounded-lg border bg-card shadow-sm lg:flex-col">
            {/* Picture */}
            <div className="basis-[45%] shrink-0 grow-0 bg-muted lg:basis-auto lg:w-full">
                <img
                    src={activity.imageSrc || "/assets/default-activity-image/default.png"}
                    alt={activity.activityTitle}
                    className="h-full w-full object-cover lg:h-40"
                />
            </div>

            {/* Description */}
            <div className="basis-[55%] min-w-0 p-4 lg:basis-auto">
                <span className="inline-block w-fit rounded bg-chart-1 px-2 py-1 text-xs text-secondary-foreground">
                    {activity.activityType.toUpperCase()}
                </span>
                <h3 className="mt-2 font-semibold">{activity.activityTitle}</h3>
                <p className="text-sm text-muted-foreground">{activity.location}</p>
                <p className="text-sm text-muted-foreground">{activity.date}</p>
                <p className="mt-2 text-sm">
                    {activity.joined} joined ·{" "}
                    <span className="text-primary">{activity.slotsLeft} spots left</span>
                </p>
                {activity.status === "joined" && (
                    <Button className="mt-3 w-full" size="sm" variant="outline">
                        View More
                    </Button>
                )}
            </div>
        </div>
    )
}