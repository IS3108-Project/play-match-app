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
import LocationPicker, { type LocationValue } from "./LocationPicker"

const ACTIVITY_TYPE_OPTIONS = ["Running", "Yoga", "Badminton", "Basketball", "Tennis", "Cycling", "Swimming", "Football"] as const
const SKILL_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const

export type HostActivityValues = {
    activityName: string
    activityType: string
    date: string
    startTime: string
    endTime: string
    meetingLocation: LocationValue
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
    triggerLabel?: string
}

const INITIAL_VALUES: HostActivityValues = {
    activityName: "",
    activityType: "",
    date: "",
    startTime: "",
    endTime: "",
    meetingLocation: { location: "", latitude: null, longitude: null },
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
    triggerLabel,
}: HostActivityFormProps) {
    const defaults = initialValues ?? INITIAL_VALUES
    const [open, setOpen] = React.useState(false)
    const [form, setForm] = React.useState<HostActivityValues>(defaults)
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
        defaults.date ? new Date(defaults.date) : undefined
    )
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const [pendingFile, setPendingFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [errors, setErrors] = React.useState<{
        activityName?: boolean
        activityType?: boolean
        date?: boolean
        datePast?: boolean
        startTime?: boolean
        startTimePast?: boolean
        endTime?: boolean
        endTimeInvalid?: boolean
        skillLevel?: boolean
        location?: boolean
        maxParticipants?: boolean
        description?: boolean
    }>({})
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
        setPendingFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        handleChange("imageSrc", "pending")
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
        
        // Validate all required fields
        const newErrors: typeof errors = {}
        if (!form.activityName.trim()) newErrors.activityName = true
        if (!form.activityType) newErrors.activityType = true
        if (!form.date) newErrors.date = true
        
        // Check if date/time is in the past
        if (form.date) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const selectedDate = new Date(form.date)
            selectedDate.setHours(0, 0, 0, 0)
            
            if (selectedDate < today) {
                newErrors.datePast = true
            } else if (
                mode === "create" &&
                selectedDate.getTime() === today.getTime() &&
                form.startTime
            ) {
                // Same day - check if start time is in the past
                const now = new Date()
                const [hours, minutes] = form.startTime.split(":").map(Number)
                if (hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes())) {
                    newErrors.startTimePast = true
                }
            }
        }
        
        if (!form.startTime) newErrors.startTime = true
        if (!form.endTime) newErrors.endTime = true
        // Check end time is after start time
        if (form.startTime && form.endTime && form.endTime <= form.startTime) {
            newErrors.endTimeInvalid = true
        }
        if (!form.skillLevel) newErrors.skillLevel = true
        // Location validation: require lat/lng in create mode, but allow legacy location string in edit mode
        const hasCoordinates = form.meetingLocation.latitude && form.meetingLocation.longitude
        const hasLocationString = form.meetingLocation.location.trim()
        if (mode === "create") {
            // Create mode: must select from dropdown (need coordinates)
            if (!hasCoordinates) newErrors.location = true
        } else {
            // Edit mode: allow legacy data with just location string
            if (!hasCoordinates && !hasLocationString) newErrors.location = true
        }
        if (!form.maxParticipants || form.maxParticipants < 2) newErrors.maxParticipants = true
        if (!form.description.trim()) newErrors.description = true
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        
        setIsSubmitting(true)

        try {
            // Upload image to R2 only on submit
            let finalForm = { ...form }
            if (pendingFile) {
                setUploading(true)
                try {
                    const url = await activityApi.uploadImage(pendingFile, "activities")
                    finalForm = { ...finalForm, imageSrc: url }
                } catch (err: any) {
                    toast.error(err.message || "Failed to upload image")
                    return
                } finally {
                    setUploading(false)
                }
            } else if (form.imageSrc === "pending") {
                finalForm = { ...finalForm, imageSrc: undefined }
            }

            if (onSubmit) {
                await onSubmit(finalForm)
            }

            setOpen(false)
            if (mode === "create") {
                setForm(INITIAL_VALUES)
                setSelectedDate(undefined)
                setErrors({})
                setPendingFile(null)
                if (previewUrl) URL.revokeObjectURL(previewUrl)
                setPreviewUrl(null)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const isEdit = mode === "edit"

    // Resolve preview URL for uploaded images
    const previewSrc = previewUrl || (form.imageSrc && form.imageSrc !== "pending" ? form.imageSrc : null)

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
                        {triggerLabel || "Host Activity"}
                    </Button>
                )}
            </DrawerTrigger>

            <DrawerContent
                className="h-[88vh] flex flex-col"
                onInteractOutside={(e) => {
                    // Prevent drawer from closing when clicking on Google Places autocomplete
                    const target = e.target as HTMLElement
                    if (target.closest(".pac-container")) {
                        e.preventDefault()
                    }
                }}
            >
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
                                        onClick={() => {
                                            handleChange("imageSrc", undefined)
                                            setPendingFile(null)
                                            if (previewUrl) URL.revokeObjectURL(previewUrl)
                                            setPreviewUrl(null)
                                        }}
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
                        <div className="space-y-2">
                            <Label htmlFor="activity-name">Activity Name</Label>
                            <Input
                                id="activity-name"
                                value={form.activityName}
                                onChange={(e) => {
                                    handleChange("activityName", e.target.value)
                                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, activityName: false }))
                                }}
                                placeholder="Enter activity name"
                                className={cn(errors.activityName && "border-destructive")}
                            />
                            {errors.activityName && (
                                <p className="text-sm text-destructive">Please enter an activity name</p>
                            )}
                        </div>

                        {/* Activity Type */}
                        <div className="space-y-2">
                            <Label htmlFor="activity-type-trigger">Activity Type</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        id="activity-type-trigger"
                                        type="button"
                                        variant="outline"
                                        className={cn("w-full justify-between", errors.activityType && "border-destructive")}
                                    >
                                        {form.activityType || "Select activity type"}
                                        <ChevronDown className="size-4 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                    {activityTypes.map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => {
                                                handleChange("activityType", type)
                                                setErrors((prev) => ({ ...prev, activityType: false }))
                                            }}
                                        >
                                            {type}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {errors.activityType && (
                                <p className="text-sm text-destructive">Please select an activity type</p>
                            )}
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
                                        className={cn("w-full justify-between font-normal", (errors.date || errors.datePast) && "border-destructive")}
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
                                            if (nextDate) setErrors((prev) => ({ ...prev, date: false, datePast: false, startTimePast: false }))
                                        }}
                                        disabled={{ before: new Date() }}
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.date && (
                                <p className="text-sm text-destructive">Please select a date</p>
                            )}
                            {errors.datePast && !errors.date && (
                                <p className="text-sm text-destructive">Date cannot be in the past</p>
                            )}
                        </div>

                        {/* Start Time and End Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-time">Start Time</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) => {
                                        handleChange("startTime", e.target.value)
                                        if (e.target.value) setErrors((prev) => ({ ...prev, startTime: false, startTimePast: false, endTimeInvalid: false }))
                                    }}
                                    className={cn((errors.startTime || errors.startTimePast) && "border-destructive")}
                                />
                                {errors.startTime && (
                                    <p className="text-sm text-destructive">Required</p>
                                )}
                                {errors.startTimePast && !errors.startTime && (
                                    <p className="text-sm text-destructive">Start time cannot be in the past</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end-time">End Time</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={form.endTime}
                                    onChange={(e) => {
                                        handleChange("endTime", e.target.value)
                                        if (e.target.value) setErrors((prev) => ({ ...prev, endTime: false, endTimeInvalid: false }))
                                    }}
                                    className={cn((errors.endTime || errors.endTimeInvalid) && "border-destructive")}
                                />
                                {errors.endTime && (
                                    <p className="text-sm text-destructive">Required</p>
                                )}
                                {errors.endTimeInvalid && !errors.endTime && (
                                    <p className="text-sm text-destructive">End time must be after start time</p>
                                )}
                            </div>
                        </div>

                        {/* Meeting Location */}
                        <div className="space-y-2">
                            <Label>Meeting Location</Label>
                            <LocationPicker
                                value={form.meetingLocation}
                                onChange={(val) => {
                                    handleChange("meetingLocation", val)
                                    if (val.latitude && val.longitude) {
                                        setErrors((prev) => ({ ...prev, location: false }))
                                    }
                                }}
                            />
                            {errors.location && (
                                <p className="text-sm text-destructive">Please select a location from the dropdown</p>
                            )}
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
                                        className={cn("w-full justify-between", errors.skillLevel && "border-destructive")}
                                    >
                                        {form.skillLevel || "Select skill level"}
                                        <ChevronDown className="size-4 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                    {SKILL_LEVEL_OPTIONS.map((level) => (
                                        <DropdownMenuItem
                                            key={level}
                                            onClick={() => {
                                                handleChange("skillLevel", level)
                                                setErrors((prev) => ({ ...prev, skillLevel: false }))
                                            }}
                                        >
                                            {level}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {errors.skillLevel && (
                                <p className="text-sm text-destructive">Please select a skill level</p>
                            )}
                        </div>

                        {/* Max Participants */}
                        <div className="space-y-2">
                            <Label htmlFor="max-participants">Max Participants</Label>
                            <Input
                                id="max-participants"
                                type="number"
                                min={2}
                                value={form.maxParticipants}
                                onChange={(e) => {
                                    handleChange("maxParticipants", Number(e.target.value))
                                    if (Number(e.target.value) >= 2) setErrors((prev) => ({ ...prev, maxParticipants: false }))
                                }}
                                className={cn(errors.maxParticipants && "border-destructive")}
                            />
                            {errors.maxParticipants && (
                                <p className="text-sm text-destructive">Please enter at least 2 participants</p>
                            )}
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
                                onChange={(e) => {
                                    handleChange("description", e.target.value)
                                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, description: false }))
                                }}
                                placeholder="Add activity details..."
                                rows={4}
                                className={cn(
                                    "border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none",
                                    errors.description && "border-destructive"
                                )}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">Please enter a description</p>
                            )}
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
