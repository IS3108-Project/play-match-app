import * as React from "react"
import { CalendarDays, Clock3, MapPin } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { activityApi, type LinkedActivityPreview } from "@/lib/api"
import { useRole } from "@/hooks/useRole"
import { toast } from "sonner"

type LinkedActivityCardProps = {
    activity: LinkedActivityPreview
    showActions?: boolean
}

function getInitials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

export default function LinkedActivityCard({ activity, showActions = true }: LinkedActivityCardProps) {
    const { session } = useRole()
    const userId = session?.user?.id

    const [myStatus, setMyStatus] = React.useState<string | null>(activity.myStatus)
    const [loading, setLoading] = React.useState(false)

    const displayDate = format(new Date(activity.date), "EEE, MMM d")
    const displayTime = `${activity.startTime} – ${activity.endTime}`
    const isCancelled = activity.status === "CANCELLED"
    const isHost = activity.hostId === userId
    const isFull = activity.slotsLeft <= 0

    const handleJoin = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setLoading(true)
        try {
            const result = await activityApi.join(activity.id)
            setMyStatus(result.status)
            if (result.status === "CONFIRMED") toast.success("You're in!")
            else if (result.status === "PENDING") toast.success("Request sent! Waiting for host approval.")
            else if (result.status === "WAITLISTED") toast.success("Added to waitlist.")
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to join activity")
        } finally {
            setLoading(false)
        }
    }

    let actionButton: React.ReactNode = null
    if (!isHost && !isCancelled) {
        if (!myStatus || myStatus === "REJECTED" || myStatus === "CANCELLED") {
            if (isFull) {
                actionButton = (
                    <Button size="sm" className="w-full mt-3" onClick={handleJoin} disabled={loading}>
                        {loading ? "Joining..." : "Join Waitlist"}
                    </Button>
                )
            } else if (activity.requireApproval) {
                actionButton = (
                    <Button size="sm" className="w-full mt-3" onClick={handleJoin} disabled={loading}>
                        {loading ? "Requesting..." : "Request to Join"}
                    </Button>
                )
            } else {
                actionButton = (
                    <Button size="sm" className="w-full mt-3" onClick={handleJoin} disabled={loading}>
                        {loading ? "Joining..." : "Join Activity"}
                    </Button>
                )
            }
        } else if (myStatus === "CONFIRMED") {
            actionButton = (
                <p className="mt-3 text-center text-xs font-medium text-primary">You're attending this activity</p>
            )
        } else if (myStatus === "PENDING") {
            actionButton = (
                <p className="mt-3 text-center text-xs font-medium text-muted-foreground">Request pending approval</p>
            )
        } else if (myStatus === "WAITLISTED") {
            actionButton = (
                <p className="mt-3 text-center text-xs font-medium text-muted-foreground">You're on the waitlist</p>
            )
        }
    }

    return (
        <div
            className={`mt-3 rounded-xl border bg-muted/30 p-3 ${isCancelled ? "opacity-60" : ""}`}
            onClick={showActions ? (e) => e.preventDefault() : undefined}
        >
            {/* Label */}
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Linked Activity
            </p>

            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="inline-block rounded bg-chart-1 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {activity.activityType.toUpperCase()}
                    </span>
                    {isCancelled && (
                        <span className="inline-block rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            CANCELLED
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                    {activity.title}
                </p>
                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        <span>{displayDate}</span>
                        <Clock3 className="ml-1 h-3 w-3 shrink-0" />
                        <span>{displayTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{activity.location}</span>
                    </div>
                </div>
            </div>

            {/* Host row */}
            <div className="mt-2 flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
                <Avatar className="h-5 w-5">
                    <AvatarImage src={activity.host.image ?? undefined} alt={activity.host.name} />
                    <AvatarFallback className="text-[9px]">{getInitials(activity.host.name)}</AvatarFallback>
                </Avatar>
                <span>Hosted by <span className="font-medium text-foreground">{activity.host.name}</span></span>
                {!isCancelled && !isHost && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                        {isFull ? "Full" : `${activity.slotsLeft} spot${activity.slotsLeft === 1 ? "" : "s"} left`}
                    </span>
                )}
                {isHost && (
                    <span className="ml-auto text-[10px] font-medium text-primary">You're hosting</span>
                )}
            </div>

            {showActions && actionButton}
        </div>
    )
}
