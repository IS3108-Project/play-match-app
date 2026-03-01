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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MapPin, CalendarDays, Clock3, PlusIcon, MinusIcon, MailIcon, ChevronDown, X } from "lucide-react"
import { Input } from "../ui/input"
import { TelegramOutline } from "../ui/telegram-icon"
import { Spinner } from "../ui/spinner"
import { activityApi, type ActivityDetail } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { useRole } from "@/hooks/useRole"
import LocationMap from "./LocationMap"

type ActivityDetailsCardProps = {
    activityId: string
    children: React.ReactNode
    onRefresh?: () => void
}

export default function ActivityDetailsCard({ activityId, children, onRefresh }: ActivityDetailsCardProps) {
    const [open, setOpen] = React.useState(false)
    const [detail, setDetail] = React.useState<ActivityDetail | null>(null)
    const [loading, setLoading] = React.useState(false)

    // Guest form state
    const [guestExpanded, setGuestExpanded] = React.useState(false)
    const [guestName, setGuestName] = React.useState("")
    const [guestContactType, setGuestContactType] = React.useState<"email" | "telegram">("email")
    const [guestContact, setGuestContact] = React.useState("")

    const { session } = useRole()
    const userId = session?.user?.id

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

    const clearGuest = () => {
        setGuestExpanded(false)
        setGuestName("")
        setGuestContactType("email")
        setGuestContact("")
    }

    const handleJoin = async () => {
        try {
            const result = await activityApi.join(activityId)
            if (result.status === "CONFIRMED") toast.success("You're in!")
            else if (result.status === "PENDING") toast.success("Request sent! Waiting for host approval.")
            else if (result.status === "WAITLISTED") toast.success("Added to waitlist.")
            fetchDetail()
            onRefresh?.()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const [confirmingLeave, setConfirmingLeave] = React.useState(false)

    const handleLeave = async () => {
        try {
            await activityApi.leave(activityId)
            toast.success("Left activity")
            setConfirmingLeave(false)
            setOpen(false)
            onRefresh?.()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleGuestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            await activityApi.addGuest(activityId, {
                name: guestName.trim(),
                contactType: guestContactType,
                contact: guestContact.trim(),
            })
            toast.success(`${guestName.trim()} added as guest!`)
            clearGuest()
            fetchDetail()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleRemoveGuest = async (guestId: string) => {
        try {
            await activityApi.removeGuest(activityId, guestId)
            toast.success("Guest removed")
            fetchDetail()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const isJoined = detail?.myStatus === "CONFIRMED"
    const isRejected = detail?.myStatus === "REJECTED"
    const isNotJoined = !detail?.myStatus
    const isHost = detail?.hostId === userId
    const isFull = (detail?.slotsLeft ?? 0) <= 0

    const confirmedParticipants = detail?.participants.filter(p => p.status === "CONFIRMED") ?? []
    const myGuests = detail?.guests.filter(g => g.invitedById === userId) ?? []

    // Find the user's own rejection note if rejected
    const myRejectionNote = isRejected
        ? detail?.participants.find(p => p.userId === userId)?.rejectionNote
        : null

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{children}</DrawerTrigger>

            <DrawerContent className="h-[88vh]">
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center">Activity Details</DrawerTitle>
                </DrawerHeader>

                {loading || !detail ? (
                    <div className="flex-1 grid place-items-center">
                        <Spinner className="size-8 text-primary" />
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                            {/* Activity Details */}
                            <section className="space-y-2">
                                <h3 className="text-2xl font-bold pb-4">{detail.title}</h3>
                                <p className="text-sm flex items-center">
                                    <CalendarDays className="h-4 w-4 mr-2 shrink-0" />
                                    {format(new Date(detail.date), "EEEE, MMM d, yyyy")}
                                </p>
                                <p className="text-sm flex items-center">
                                    <Clock3 className="h-4 w-4 mr-2 shrink-0" />
                                    {detail.startTime} - {detail.endTime}
                                </p>
                                <p className="text-sm flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 shrink-0" />
                                    {detail.location}
                                </p>
                                <LocationMap location={detail.location} />
                            </section>

                            {/* Description */}
                            <section className="space-y-2 border-t pt-5">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Description
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {detail.description}
                                </p>
                            </section>

                            {/* Host & Participants */}
                            <section className="space-y-2 border-t pt-5">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Host & Participants ({confirmedParticipants.length})
                                </h4>
                                <div className="text-sm text-muted-foreground">
                                    {confirmedParticipants.map((p) => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8 my-1">
                                                <AvatarImage
                                                    src={p.user.image ?? "/assets/logo.svg"}
                                                    alt={p.user.name}
                                                />
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {p.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm text-muted-foreground">
                                                {p.user.name}
                                                {p.userId === detail.hostId && (
                                                    <span className="ml-1 text-xs text-primary">(Host)</span>
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Bring a Guest — only for confirmed participants who are not the host */}
                            {isJoined && !isHost && (
                                <section className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Bring a Guest
                                        </h4>
                                        {isFull ? (
                                            <p className="text-xs text-muted-foreground">Activity is full</p>
                                        ) : (
                                            <Button
                                                className="flex w-max-xs items-center justify-between px-3 py-2 text-left"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (guestExpanded) clearGuest()
                                                    else setGuestExpanded(true)
                                                }}
                                            >
                                                <span className="text-lg leading-none">
                                                    {guestExpanded ? <MinusIcon className="size-4" /> : <PlusIcon className="size-4" />}
                                                </span>
                                            </Button>
                                        )}
                                    </div>

                                    {/* Existing guests */}
                                    {myGuests.length > 0 && (
                                        <div className="space-y-2">
                                            {myGuests.map((g) => (
                                                <div key={g.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                                    <div>
                                                        <p className="text-sm font-medium">{g.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {g.contactType === "email" ? g.contact : `@${g.contact}`}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleRemoveGuest(g.id)}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {guestExpanded && !isFull && (
                                        <form onSubmit={handleGuestSubmit} className="space-y-2 border-t py-4">
                                            <Input
                                                className="w-full"
                                                placeholder="Guest's Name"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                required
                                            />

                                            <div className="flex items-center gap-2">
                                                <div className="w-1/5">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-9 w-full justify-between px-2 md:px-3"
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    {guestContactType === "email" ? (
                                                                        <MailIcon className="size-4 text-muted-foreground" />
                                                                    ) : (
                                                                        <TelegramOutline className="size-4 text-muted-foreground" />
                                                                    )}
                                                                    <span className="hidden text-sm text-muted-foreground sm:inline">
                                                                        {guestContactType === "email" ? "Email" : "Telegram"}
                                                                    </span>
                                                                </span>
                                                                <ChevronDown className="size-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start">
                                                            <DropdownMenuItem
                                                                onClick={() => setGuestContactType("email")}
                                                                className="gap-2"
                                                            >
                                                                <MailIcon className="size-4" />
                                                                Email
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setGuestContactType("telegram")}
                                                                className="gap-2"
                                                            >
                                                                <TelegramOutline className="size-4" />
                                                                Telegram
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="w-4/5">
                                                    <Input
                                                        type={guestContactType === "email" ? "email" : "text"}
                                                        placeholder={guestContactType === "email" ? "Guest's Email" : "Guest's Telegram Handle"}
                                                        value={guestContact}
                                                        onChange={(e) => setGuestContact(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={!guestName.trim() || !guestContact.trim()}
                                            >
                                                Add Guest
                                            </Button>
                                        </form>
                                    )}
                                </section>
                            )}
                        </div>

                        <DrawerFooter className="border-t">
                            {isJoined && !isHost && (
                                confirmingLeave ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Are you sure you want to leave this activity?
                                        </p>
                                        <div className="flex gap-2">
                                            <Button className="flex-1" variant="outline" onClick={() => setConfirmingLeave(false)}>
                                                Cancel
                                            </Button>
                                            <Button className="flex-1" variant="destructive" onClick={handleLeave}>
                                                Yes, Leave
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button className="w-full" variant="outline" onClick={() => setConfirmingLeave(true)}>
                                        Withdraw
                                    </Button>
                                )
                            )}
                            {isRejected && (
                                <div className="space-y-2">
                                    <p className="text-sm text-destructive text-center">
                                        Your request to join was rejected.
                                    </p>
                                    {myRejectionNote && (
                                        <p className="text-sm text-muted-foreground text-center">
                                            Reason: {myRejectionNote}
                                        </p>
                                    )}
                                    <Button className="w-full" onClick={handleJoin}>
                                        Request to Join Again
                                    </Button>
                                </div>
                            )}
                            {isNotJoined && (
                                <Button className="w-full" onClick={handleJoin}>
                                    {detail.requireApproval ? "Request to Join" : "Join Now"}
                                </Button>
                            )}
                        </DrawerFooter>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    )
}
