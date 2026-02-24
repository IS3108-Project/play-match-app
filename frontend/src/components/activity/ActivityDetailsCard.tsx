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
import { MapPin, CalendarDays, Clock3, PlusIcon, MinusIcon, MailIcon, ChevronDown } from "lucide-react"
import { Input } from "../ui/input"
import { TelegramOutline } from "../ui/telegram-icon"

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

type ActivityDetailsCardProps = {
    activity: Activity
    children: React.ReactNode
    status: "joined" | "confirmed" | "cancelled" | "pending" | "ended" | "not-joined"
}

export default function ActivityDetailsCard({ activity, children, status }: ActivityDetailsCardProps) {
    const [guestExpanded, setGuestExpanded] = React.useState(false)
    const [guestName, setGuestName] = React.useState("")
    const [guestContactType, setGuestContactType] = React.useState<"email" | "telegram">("email")
    const [guestContact, setGuestContact] = React.useState("")

    const clearGuest = () => {
        setGuestExpanded(false)
        setGuestName("")
        setGuestContactType("email")
        setGuestContact("")
    }

    const handleGuestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const guestPayload = {
            name: guestName.trim(),
            contactType: guestContactType,
            contact: guestContact.trim(),
        }

        // TODO: send guestPayload to backend API
        console.log("Submitting guest:", guestPayload)
    }

    return (
        <Drawer direction="bottom">
            <DrawerTrigger asChild>{children}</DrawerTrigger>

            <DrawerContent className="h-[88vh]">
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center">Activity Details</DrawerTitle>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                    {/* Activity Details */}
                    <section className="space-y-2">
                        <h3 className="text-2xl font-bold pb-4">{activity.activityTitle}</h3>
                        <p className="text-sm flex">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            {activity.date}
                        </p>
                        <p className="text-sm flex">
                            <Clock3 className="h-4 w-4 mr-2" />
                            {activity.time}
                        </p>
                        <p className="text-sm flex">
                            <MapPin className="h-4 w-4 mr-2" />
                            {activity.location}
                        </p>
                    </section>

                    {/* Description */}
                    <section className="space-y-2 border-t pt-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Description
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {activity.description}
                        </p>
                    </section>

                    {/* Host & participants */}
                    <section className="space-y-2 border-t pt-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Host & participants ({activity.participants.length})
                        </h4>
                        <div className="text-sm text-muted-foreground">
                            {/* TODO: Extract participant profile from database */}
                            {activity.participants.map((participant, index) => (
                                <div key={`${participant}-${index}`} className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 my-1">
                                        <AvatarImage
                                            src={activity.participantImages[index] ?? "/assets/logo.svg"}
                                            alt={participant}
                                        />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {participant.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm text-muted-foreground">{participant}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* TODO: Implement Add a guest functionality */}
                    {/* Bring a Guest */}
                    {status === "joined" && (
                        <section className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Bring a Guest
                                </h4>
                                <Button
                                    className="flex w-max-xs items-center justify-between px-3 py-2 text-left"
                                    variant="ghost"
                                    onClick={() => {
                                        if (guestExpanded) clearGuest()
                                        else setGuestExpanded(true)
                                    }}
                                >
                                    <span className="text-lg leading-none">{guestExpanded ? <MinusIcon className="size-4" /> : <PlusIcon className="size-4" />}</span>
                                </Button>
                            </div>
                            {guestExpanded && (
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

                                    {/* TODO: send info to backend */}
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
                    {status === "joined" && (
                        <>
                            <Button className="w-full ">RSVP</Button>
                            <Button className="w-full" variant="outline">Withdraw</Button>
                            <p className="text-xs text-muted-foreground">
                                Please confirm your attendance at least 30 minutes before the activity starts.
                            </p>
                        </>
                    )}
                    {status === "not-joined" && (
                        <Button className="w-full">Request to Join</Button>
                    )}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}