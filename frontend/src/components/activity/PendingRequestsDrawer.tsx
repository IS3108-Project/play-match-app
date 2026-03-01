"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { Check, X, Users } from "lucide-react"
import { activityApi, type ActivityDetail } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PendingRequestsDrawerProps = {
    activityId: string
    pendingCount: number
    onRefresh?: () => void
    className?: string
}

export default function PendingRequestsDrawer({
    activityId,
    pendingCount,
    onRefresh,
    className,
}: PendingRequestsDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [detail, setDetail] = React.useState<ActivityDetail | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [rejectingId, setRejectingId] = React.useState<string | null>(null)
    const [rejectionNote, setRejectionNote] = React.useState("")

    const fetchDetail = React.useCallback(async () => {
        setLoading(true)
        try {
            const data = await activityApi.get(activityId)
            setDetail(data)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [activityId])

    React.useEffect(() => {
        if (open) fetchDetail()
    }, [open, fetchDetail])

    const pendingParticipants = detail?.participants.filter(p => p.status === "PENDING") ?? []

    const handleApprove = async (participantId: string) => {
        try {
            const result = await activityApi.approve(activityId, participantId)
            if (result.status === "WAITLISTED") {
                toast.warning("Activity is full. Participant moved to waitlist.")
            } else {
                toast.success("Participant approved!")
            }
            fetchDetail()
            onRefresh?.()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleReject = async (participantId: string) => {
        try {
            await activityApi.reject(activityId, participantId, rejectionNote || undefined)
            toast.success("Request rejected")
            setRejectingId(null)
            setRejectionNote("")
            fetchDetail()
            onRefresh?.()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button type="button" variant="outline" size="sm" className={cn("relative", className)}>
                    <Users className="size-4" />
                    Pending
                    {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                            {pendingCount}
                        </span>
                    )}
                </Button>
            </DrawerTrigger>

            <DrawerContent className="h-[88vh]">
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center">Pending Requests</DrawerTitle>
                </DrawerHeader>

                {loading || !detail ? (
                    <div className="flex-1 grid place-items-center">
                        <Spinner className="size-8 text-primary" />
                    </div>
                ) : pendingParticipants.length === 0 ? (
                    <div className="flex-1 grid place-items-center">
                        <p className="text-muted-foreground">No pending requests</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                        {pendingParticipants.map((p) => (
                            <div key={p.id} className="rounded-lg border p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={p.user.image ?? undefined} alt={p.user.name} />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {p.user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{p.user.name}</p>
                                            <p className="text-xs text-muted-foreground">{p.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 text-green-600 hover:text-green-700"
                                            onClick={() => handleApprove(p.id)}
                                        >
                                            <Check className="size-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                                            onClick={() => {
                                                if (rejectingId === p.id) {
                                                    setRejectingId(null)
                                                    setRejectionNote("")
                                                } else {
                                                    setRejectingId(p.id)
                                                    setRejectionNote("")
                                                }
                                            }}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Rejection note form */}
                                {rejectingId === p.id && (
                                    <div className="space-y-2 border-t pt-3">
                                        <textarea
                                            value={rejectionNote}
                                            onChange={(e) => setRejectionNote(e.target.value)}
                                            placeholder="Reason for rejection (optional)"
                                            rows={2}
                                            className="border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setRejectingId(null)
                                                    setRejectionNote("")
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="flex-1"
                                                onClick={() => handleReject(p.id)}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    )
}
