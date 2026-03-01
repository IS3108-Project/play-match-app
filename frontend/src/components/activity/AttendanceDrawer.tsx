"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

type AttendanceDrawerProps = {
    activityId: string
    onRefresh?: () => void
    className?: string
}

export default function AttendanceDrawer({
    activityId,
    onRefresh,
    className,
}: AttendanceDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [detail, setDetail] = React.useState<ActivityDetail | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [checked, setChecked] = React.useState<Set<string>>(new Set())
    const [saving, setSaving] = React.useState(false)

    const fetchDetail = React.useCallback(async () => {
        setLoading(true)
        try {
            const data = await activityApi.get(activityId)
            setDetail(data)
            // Pre-check participants already marked as attended
            const attended = new Set(
                data.participants
                    .filter((p) => p.attended && p.status === "CONFIRMED")
                    .map((p) => p.id)
            )
            setChecked(attended)
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
        detail?.participants.filter((p) => p.status === "CONFIRMED") ?? []

    const hasStarted = React.useMemo(() => {
        if (!detail) return false
        const start = new Date(detail.date)
        const [h, m] = detail.startTime.split(":").map(Number)
        start.setHours(h, m, 0, 0)
        return new Date() >= start
    }, [detail])

    const toggleParticipant = (id: string) => {
        setChecked((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await activityApi.markAttendance(activityId, Array.from(checked))
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

            <DrawerContent className="h-[88vh] flex flex-col">
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
                        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                            {confirmedParticipants.map((p) => (
                                <label
                                    key={p.id}
                                    className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={p.user.image ?? undefined} alt={p.user.name} />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {p.user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="text-sm font-medium">{p.user.name}</p>
                                    </div>
                                    <Checkbox
                                        checked={checked.has(p.id)}
                                        onCheckedChange={() => toggleParticipant(p.id)}
                                    />
                                </label>
                            ))}
                        </div>

                        <DrawerFooter className="border-t">
                            {!hasStarted && (
                                <p className="text-sm text-muted-foreground text-center">
                                    Attendance can only be marked after the activity has started.
                                </p>
                            )}
                            <Button className="w-full" onClick={handleSave} disabled={saving || !hasStarted}>
                                {saving ? "Saving..." : `Save Attendance (${checked.size}/${confirmedParticipants.length})`}
                            </Button>
                        </DrawerFooter>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    )
}
