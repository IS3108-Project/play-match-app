"use client"

import * as React from "react"
import { ChevronDown, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// TODO: replace with actual activity types from the database
const ACTIVITY_TYPE_OPTIONS = ["Running", "Yoga", "Badminton", "Basketball", "Tennis", "Cycling", "Swimming", "Football"] as const
const SKILL_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const

export type HostActivityValues = {
    activityName: string
    activityType: string
    date: string
    startTime: string
    endTime: string
    meetingLocation: string
    skillLevel: string
    maxParticipants: number
    description: string
}

type HostActivityFormProps = {
    onSubmit?: (values: HostActivityValues) => Promise<void> | void
    activityTypes?: string[]
}

const INITIAL_VALUES: HostActivityValues = {
    activityName: "",
    activityType: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingLocation: "",
    skillLevel: "",
    maxParticipants: 2,
    description: "",
}

export default function HostActivityForm({
    onSubmit,
    activityTypes = [...ACTIVITY_TYPE_OPTIONS],
}: HostActivityFormProps) {
    const [open, setOpen] = React.useState(false)
    const [form, setForm] = React.useState<HostActivityValues>(INITIAL_VALUES)
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleChange = <K extends keyof HostActivityValues>(key: K, value: HostActivityValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (onSubmit) {
                await onSubmit(form)
            } else {
                // Dummy DB call placeholder
                await new Promise((resolve) => setTimeout(resolve, 500))
                console.log("Host activity payload:", form)
            }

            setOpen(false)
            setForm(INITIAL_VALUES)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button type="button" className="bg-primary text-primary-foreground">
                    <PlusIcon className="size-4" />
                    Host Activity
                </Button>
            </DrawerTrigger>

            <DrawerContent className="h-[88vh] flex flex-col">
                <DrawerHeader className="border-b shrink-0">
                    <DrawerTitle className="text-center">Host Activity</DrawerTitle>
                </DrawerHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-5">
                        {/* Activity Name */}
                        <div className="space-y-3">
                            <Label htmlFor="activity-name">Activity Name</Label>
                            <Input
                                id="activity-name"
                                value={form.activityName}
                                onChange={(e) => handleChange("activityName", e.target.value)}
                                placeholder="Enter activity name"
                                required
                            />
                        </div>

                        {/* Activity Type */}
                        <div className="space-y-3">
                            <Label htmlFor="activity-type-trigger">Activity Type</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        id="activity-type-trigger"
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between"
                                    >
                                        {form.activityType || "Select activity type"}
                                        <ChevronDown className="size-4 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                    {activityTypes.map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => handleChange("activityType", type)}
                                        >
                                            {type}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="activity-date-trigger">Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="activity-date-trigger"
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between font-normal"
                                    >
                                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                                        <ChevronDown className="size-4 opacity-70" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(nextDate) => {
                                            setSelectedDate(nextDate)
                                            handleChange("date", nextDate ? format(nextDate, "yyyy-MM-dd") : "")
                                        }}
                                        disabled={{ before: new Date() }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Start Time and End Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-time">Start Time</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) => handleChange("startTime", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end-time">End Time</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={form.endTime}
                                    onChange={(e) => handleChange("endTime", e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Meeting Location */}
                        <div className="space-y-2">
                            <Label htmlFor="meeting-location">Meeting Location</Label>
                            <Input
                                id="meeting-location"
                                value={form.meetingLocation}
                                onChange={(e) => handleChange("meetingLocation", e.target.value)}
                                placeholder="e.g. Bedok Sports Hall"
                                required
                            />
                        </div>

                        {/* Skill Level */}
                        <div className="space-y-2">
                            <Label htmlFor="skill-level-trigger">Skill Level</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        id="skill-level-trigger"
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between"
                                    >
                                        {form.skillLevel || "Select skill level"}
                                        <ChevronDown className="size-4 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                    {SKILL_LEVEL_OPTIONS.map((level) => (
                                        <DropdownMenuItem
                                            key={level}
                                            onClick={() => handleChange("skillLevel", level)}
                                        >
                                            {level}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Max Participants */}
                        <div className="space-y-2">
                            <Label htmlFor="max-participants">Max Participants</Label>
                            <Input
                                id="max-participants"
                                type="number"
                                min={2}
                                value={form.maxParticipants}
                                onChange={(e) => handleChange("maxParticipants", Number(e.target.value))}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Add activity details..."
                                rows={4}
                                required
                                className={cn(
                                    "border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                                )}
                            />
                        </div>
                    </div>

                    <DrawerFooter className="border-t">
                        {/* TODO: Implement submit functionality */}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Create Activity"}
                        </Button>
                        <DrawerClose asChild>
                            {/* TODO: Implement cancel functionality */}
                            <Button type="button" variant="outline" className="w-full">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </form>

            </DrawerContent>
        </Drawer>
    )
}