"use client"

import * as React from "react"
import { ChevronDown, PlusIcon, Pencil, ImagePlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { activityApi } from "@/lib/api"
import { toast } from "sonner"
import LocationPicker from "./LocationPicker"

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
    requireApproval: boolean
    imageSrc?: string
}

type HostActivityFormProps = {
    onSubmit?: (values: HostActivityValues) => Promise<void> | void
    activityTypes?: string[]
    initialValues?: HostActivityValues
    mode?: "create" | "edit"
    className?: string
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
    requireApproval: false,
}

export default function HostActivityForm({
    onSubmit,
    activityTypes = [...ACTIVITY_TYPE_OPTIONS],
    initialValues,
    mode = "create",
    className,
}: HostActivityFormProps) {
    const defaults = initialValues ?? INITIAL_VALUES
    const [open, setOpen] = React.useState(false)
    const [form, setForm] = React.useState<HostActivityValues>(defaults)
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
        defaults.date ? new Date(defaults.date) : undefined
    )
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (initialValues) {
            setForm(initialValues)
            setSelectedDate(initialValues.date ? new Date(initialValues.date) : undefined)
        }
    }, [initialValues])

    const handleChange = <K extends keyof HostActivityValues>(key: K, value: HostActivityValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleImageUpload = async (file: File) => {
        setUploading(true)
        try {
            const url = await activityApi.uploadImage(file)
            handleChange("imageSrc", url)
        } catch (err: any) {
            toast.error(err.message || "Failed to upload image")
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith("image/")) handleImageUpload(file)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleImageUpload(file)
        e.target.value = ""
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (onSubmit) {
                await onSubmit(form)
            } else {
                await new Promise((resolve) => setTimeout(resolve, 500))
                console.log("Host activity payload:", form)
            }

            setOpen(false)
            if (mode === "create") {
                setForm(INITIAL_VALUES)
                setSelectedDate(undefined)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const isEdit = mode === "edit"

    // Resolve preview URL for uploaded images
    const previewSrc = form.imageSrc
        ? form.imageSrc.startsWith("/uploads/")
            ? `http://localhost:3000${form.imageSrc}`
            : form.imageSrc
        : null

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {isEdit ? (
                    <Button type="button" variant="outline" size="sm" className={className}>
                        <Pencil className="size-4" />
                        Edit
                    </Button>
                ) : (
                    <Button type="button" className={cn("bg-primary text-primary-foreground", className)}>
                        <PlusIcon className="size-4" />
                        Host Activity
                    </Button>
                )}
            </DrawerTrigger>

            <DrawerContent className="h-[88vh] flex flex-col">
                <DrawerHeader className="border-b shrink-0">
                    <DrawerTitle className="text-center">
                        {isEdit ? "Edit Activity" : "Host Activity"}
                    </DrawerTitle>
                </DrawerHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-5">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>Cover Image</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            {previewSrc ? (
                                <div className="relative rounded-lg overflow-hidden">
                                    <img
                                        src={previewSrc}
                                        alt="Activity cover"
                                        className="w-full h-40 object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7"
                                        onClick={() => handleChange("imageSrc", undefined)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <ImagePlus className="size-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">
                                        {uploading ? "Uploading..." : "Click or drag to upload"}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">
                                        JPG, PNG or WebP (max 5MB)
                                    </p>
                                </div>
                            )}
                        </div>

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
                            <Label>Meeting Location</Label>
                            <LocationPicker
                                value={form.meetingLocation}
                                onChange={(val) => handleChange("meetingLocation", val)}
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

                        {/* Require Approval */}
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="require-approval">Require Join Approval</Label>
                                <p className="text-xs text-muted-foreground">
                                    Review and approve join requests before confirming
                                </p>
                            </div>
                            <Switch
                                id="require-approval"
                                checked={form.requireApproval}
                                onCheckedChange={(checked) => handleChange("requireApproval", checked)}
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
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting
                                ? (isEdit ? "Saving..." : "Creating...")
                                : (isEdit ? "Save Changes" : "Create Activity")}
                        </Button>
                        <DrawerClose asChild>
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
