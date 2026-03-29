"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { ClipboardCheck } from "lucide-react"
import { activityApi, type ActivityDetail } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AttendanceDrawerProps = {
    activityId: string
    onRefresh?: () => void
    className?: string
}

const STATUS_OPTIONS = [
    {
        value: "ATTENDED" as const,
        label: "Attended",
        activeClass: "border-green-300 bg-green-100 text-green-700",
    },
    {
        value: "LATE" as const,
        label: "Late",
        activeClass: "border-amber-300 bg-amber-100 text-amber-700",
    },
    {
        value: "NO_SHOW" as const,
        label: "No-Show",
        activeClass: "border-destructive/30 bg-red-100 text-destructive",
    },
]

export default function AttendanceDrawer({
    activityId,
    onRefresh,
    className,
}: AttendanceDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [detail, setDetail] = React.useState<ActivityDetail | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [attendance, setAttendance] = React.useState<
        Record<string, "ATTENDED" | "LATE" | "NO_SHOW">
    >({})
    const [saving, setSaving] = React.useState(false)

    const fetchDetail = React.useCallback(async () => {
        setLoading(true)
        try {
            const data = await activityApi.get(activityId)
            setDetail(data)
            const initial: Record<string, "ATTENDED" | "LATE" | "NO_SHOW"> = {}
            data.participants
                .filter((participant) => participant.status === "CONFIRMED")
                .forEach((participant) => {
                    if (
                        participant.attendanceStatus === "ATTENDED" ||
                        participant.attendanceStatus === "LATE" ||
                        participant.attendanceStatus === "NO_SHOW"
                    ) {
                        initial[participant.id] = participant.attendanceStatus
                    }
                })
            setAttendance(initial)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }, [activityId])

    React.useEffect(() => {
        if (open) fetchDetail()
    }, [open, fetchDetail])

    const confirmedParticipants =
        detail?.participants.filter((participant) => participant.status === "CONFIRMED") ?? []

    const activityTimings = React.useMemo(() => {
        if (!detail) return { hasStarted: false, isLocked: false }
        const start = new Date(detail.date)
        const [startHours, startMinutes] = detail.startTime.split(":").map(Number)
        start.setHours(startHours ?? 0, startMinutes ?? 0, 0, 0)

        const end = new Date(detail.date)
        const [endHours, endMinutes] = detail.endTime.split(":").map(Number)
        end.setHours(endHours ?? 0, endMinutes ?? 0, 0, 0)

        const lockTime = new Date(end.getTime() + 24 * 60 * 60 * 1000)
        const now = new Date()

        return {
            hasStarted: now >= start,
            isLocked: now > lockTime,
        }
    }, [detail])

    const markedCount = Object.keys(attendance).length

    const setStatus = (
        participantId: string,
        status: "ATTENDED" | "LATE" | "NO_SHOW",
    ) => {
        setAttendance((current) => {
            if (current[participantId] === status) {
                const next = { ...current }
                delete next[participantId]
                return next
            }
            return { ...current, [participantId]: status }
        })
    }

    const markAllAttended = () => {
        const next: Record<string, "ATTENDED" | "LATE" | "NO_SHOW"> = {}
        confirmedParticipants.forEach((participant) => {
            next[participant.id] = "ATTENDED"
        })
        setAttendance(next)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await activityApi.markAttendance(activityId, attendance)
            toast.success("Attendance saved!")
            setOpen(false)
            onRefresh?.()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button type="button" variant="outline" size="sm" className={className}>
                    <ClipboardCheck className="size-4" />
                    Attendance
                </Button>
            </DrawerTrigger>

            <DrawerContent className="flex h-[88vh] flex-col">
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center">Mark Attendance</DrawerTitle>
                </DrawerHeader>

                {loading || !detail ? (
                    <div className="flex-1 grid place-items-center">
                        <Spinner className="size-8 text-primary" />
                    </div>
                ) : confirmedParticipants.length === 0 ? (
                    <div className="flex-1 grid place-items-center">
                        <p className="text-muted-foreground">No confirmed participants</p>
                    </div>
                ) : (
                    <>
                        {!activityTimings.hasStarted && (
                            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                                Attendance can only be marked after the activity has started.
                            </div>
                        )}

                        {activityTimings.isLocked && (
                            <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                                Attendance has been locked because the 24-hour editing window has passed.
                            </div>
                        )}

                        <div className="flex items-center justify-between px-4 pb-1 pt-3">
                            <p className="text-xs text-muted-foreground">
                                {markedCount}/{confirmedParticipants.length} marked
                            </p>
                            <button
                                type="button"
                                className="text-xs text-primary hover:underline disabled:pointer-events-none disabled:opacity-40"
                                disabled={!activityTimings.hasStarted || activityTimings.isLocked}
                                onClick={markAllAttended}
                            >
                                Mark all as attended
                            </button>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
                            {confirmedParticipants.map((participant) => (
                                <div key={participant.id} className="space-y-3 rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={participant.user.image ?? undefined}
                                                alt={participant.user.name}
                                            />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {participant.user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="truncate text-sm font-medium">
                                            {participant.user.name}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {STATUS_OPTIONS.map((option) => {
                                            const isActive = attendance[participant.id] === option.value
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    disabled={
                                                        !activityTimings.hasStarted || activityTimings.isLocked
                                                    }
                                                    onClick={() => setStatus(participant.id, option.value)}
                                                    className={cn(
                                                        "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
                                                        isActive
                                                            ? option.activeClass
                                                            : "border-input bg-background text-muted-foreground hover:bg-accent/50",
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DrawerFooter className="border-t">
                            <Button
                                className="w-full"
                                onClick={handleSave}
                                disabled={
                                    saving ||
                                    !activityTimings.hasStarted ||
                                    activityTimings.isLocked
                                }
                            >
                                {saving ? "Saving..." : "Save Attendance"}
                            </Button>
                        </DrawerFooter>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    )
}
