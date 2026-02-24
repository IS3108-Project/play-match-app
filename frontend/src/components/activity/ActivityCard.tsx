import { Button } from "@/components/ui/button"
import ActivityActionsMenu from "@/components/activity/ActivityActionMenu"
import ActivityDetailsCard from "@/components/activity/ActivityDetailsCard"

type Activity = {
    activityTitle: string
    location: string
    date: string
    time: string
    description: string
    host: string
    hostImage: string
    participants: string[]
    participantImages: string[]
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
        <div className="relative flex flex-row overflow-hidden rounded-lg border bg-card shadow-sm lg:flex-col">
            {/* Actions Menu */}
            {activity.status === "joined" && (
                // TODO: Implement share link, report and cancel RSVP functionalities
                <div className="absolute right-3 top-3 z-10">
                    <ActivityActionsMenu
                        onShareLink={() => { }}
                        onReport={() => { }}
                        onCancelRsvp={() => { }}
                    />
                </div>
            )}

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
                <span className="inline-block w-fit rounded bg-chart-1 px-2 py-1 text-xs text-primary">
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
                    <ActivityDetailsCard activity={activity} status="joined">
                        <Button className="mt-3 w-full" size="sm" variant="outline">
                            View More
                        </Button>
                    </ActivityDetailsCard>
                )}

                {activity.status === "not-joined" && (
                    <ActivityDetailsCard activity={activity} status="not-joined">
                        <Button className="mt-3 w-full" size="sm" variant="default">
                            Join Now
                        </Button>
                    </ActivityDetailsCard>
                )}
            </div>
        </div>
    )
}