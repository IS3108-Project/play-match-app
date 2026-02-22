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
import { MapPin, CalendarDays, Clock3 } from "lucide-react"

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
}

export default function ActivityDetailsCard({ activity, children }: ActivityDetailsCardProps) {
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
                </div>

                <DrawerFooter className="border-t">
                    <Button className="w-full ">RSVP</Button>
                    <p className="text-xs text-muted-foreground">
                        Please confirm your attendance at least 30 minutes before the activity starts.
                    </p>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}