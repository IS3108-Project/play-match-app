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
import { activityApi, type CancelInfo } from "@/lib/api"
import { toast } from "sonner"

type CancelActivityDrawerProps = {
    activityId: string
    onRefresh?: () => void
    children: React.ReactNode
}

export default function CancelActivityDrawer({
    activityId,
    onRefresh,
    children,
}: CancelActivityDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [info, setInfo] = React.useState<CancelInfo | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setLoading(true)
            setSelectedUserId(null)
            activityApi.cancelInfo(activityId)
                .then(setInfo)
                .catch((err) => toast.error(err.message))
                .finally(() => setLoading(false))
        }
    }, [open, activityId])

    const handleTransfer = async () => {
        if (!selectedUserId) return
        setSubmitting(true)
        try {
            const result = await activityApi.cancel(activityId, { transferToUserId: selectedUserId })
            toast.success(`Host transferred to ${result.newHostName}`)
            setOpen(false)
            onRefresh?.()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = async () => {
        setSubmitting(true)
        try {
            await activityApi.cancel(activityId)
            toast.success("Activity cancelled")
            setOpen(false)
            onRefresh?.()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{children}</DrawerTrigger>

            <DrawerContent className="max-h-[80vh]">
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center">Cancel Activity</DrawerTitle>
                </DrawerHeader>

                {loading || !info ? (
                    <div className="flex-1 grid place-items-center py-12">
                        <Spinner className="size-8 text-primary" />
                    </div>
                ) : !info.hasOtherParticipants ? (
                    /* No other participants — simple cancel */
                    <div className="px-4 py-6 space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Are you sure you want to cancel this activity?
                        </p>
                        <DrawerFooter className="px-0">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleCancel}
                                disabled={submitting}
                            >
                                {submitting ? "Cancelling..." : "Cancel Activity"}
                            </Button>
                        </DrawerFooter>
                    </div>
                ) : (
                    /* Has other participants — offer transfer or cancel */
                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Transfer host to a participant</h4>
                            <p className="text-xs text-muted-foreground">
                                Select someone to take over as host. You'll be removed from the activity.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {info.confirmedParticipants.map((p) => (
                                <label
                                    key={p.userId}
                                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                                        selectedUserId === p.userId
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-accent/50"
                                    }`}
                                    onClick={() => setSelectedUserId(p.userId)}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={p.image ?? undefined} alt={p.name} />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {p.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-medium flex-1">{p.name}</p>
                                    <div className={`h-4 w-4 rounded-full border-2 ${
                                        selectedUserId === p.userId
                                            ? "border-primary bg-primary"
                                            : "border-muted-foreground"
                                    }`} />
                                </label>
                            ))}
                        </div>

                        <DrawerFooter className="px-0 space-y-2">
                            <Button
                                className="w-full"
                                onClick={handleTransfer}
                                disabled={!selectedUserId || submitting}
                            >
                                {submitting ? "Transferring..." : "Transfer Host"}
                            </Button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleCancel}
                                disabled={submitting}
                            >
                                {submitting ? "Cancelling..." : `Cancel Activity (${info.confirmedParticipants.length} will be notified)`}
                            </Button>
                        </DrawerFooter>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    )
}
