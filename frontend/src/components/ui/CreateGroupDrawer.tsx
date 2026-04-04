"use client"

import * as React from "react"
import { ChevronDown, ImagePlus, PencilIcon, PlusIcon, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { communityApi } from "@/lib/api"

const EMOJI_OPTIONS = ["🏃", "🏸", "🧘", "🚴", "🏀", "⚽", "🎾", "🏊", "💪", "🥾", "🧗", "🛼"] as const
const ICON_BG_COLOR_OPTIONS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const

export type CreateGroupValues = {
    name: string
    description: string
    icon: string
    iconBgColor: string
    profileImageUrl: string | null
}

type CreateGroupDrawerProps = {
    onSubmit?: (values: CreateGroupValues) => Promise<void> | void
    initialValues?: CreateGroupValues
    mode?: "create" | "edit"
    triggerLabel?: string
}

const INITIAL_VALUES: CreateGroupValues = {
    name: "",
    description: "",
    icon: "🏃",
    iconBgColor: "chart-1",
    profileImageUrl: null,
}

export default function CreateGroupDrawer({ onSubmit, initialValues, mode = "create", triggerLabel }: CreateGroupDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [emojiPickerOpen, setEmojiPickerOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const [form, setForm] = React.useState<CreateGroupValues>(initialValues ?? INITIAL_VALUES)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (open) {
            setForm(initialValues ?? INITIAL_VALUES)
        }
    }, [open, initialValues])

    const handleChange = <K extends keyof CreateGroupValues>(key: K, value: CreateGroupValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const resetForm = () => {
        setForm(INITIAL_VALUES)
    }

    const handleImageUpload = async (file: File) => {
        setUploading(true)
        try {
            const url = await communityApi.uploadImage(file)
            handleChange("profileImageUrl", url)
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to upload image")
        } finally {
            setUploading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleImageUpload(file)
        e.target.value = ""
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith("image/")) handleImageUpload(file)
    }

    const previewSrc = form.profileImageUrl
        ? form.profileImageUrl.startsWith("/uploads/")
            ? `http://localhost:3000${form.profileImageUrl}`
            : form.profileImageUrl
        : null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (onSubmit) {
                await onSubmit(form)
            }
            setOpen(false)
            resetForm()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {mode === "edit" ? (
                    <Button type="button" variant="outline" className="w-full">
                        <PencilIcon className="size-4" />
                        {triggerLabel ?? "Edit Group"}
                    </Button>
                ) : (
                    <Button type="button" className="bg-primary text-primary-foreground">
                        <PlusIcon className="size-4" />
                        {triggerLabel ?? "Create Group"}
                    </Button>
                )}
            </DrawerTrigger>

            <DrawerContent className="h-[88vh] flex flex-col">
                <DrawerHeader className="border-b shrink-0">
                    <DrawerTitle className="text-center">{mode === "edit" ? "Edit Group" : "Create Group"}</DrawerTitle>
                </DrawerHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-5">
                        <div className="space-y-3">
                            <Label htmlFor="group-name">Group Name</Label>
                            <Input
                                id="group-name"
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="e.g. Morning Joggers East"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="group-description">Description</Label>
                            <textarea
                                id="group-description"
                                value={form.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Tell people what your group is about..."
                                rows={4}
                                required
                                className={cn(
                                    "border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                                )}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="space-y-3 w-2/7">
                                <Label htmlFor="group-emoji-trigger">Choose Icon</Label>
                                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="group-emoji-trigger"
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between"
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <span className="inline-flex size-8 items-center justify-center rounded-full text-lg">
                                                    {form.icon}
                                                </span>
                                            </span>
                                            <ChevronDown className="size-4 opacity-70" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-3" align="start">
                                        <div className="grid grid-cols-6 gap-2">
                                            {EMOJI_OPTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => {
                                                        handleChange("icon", emoji)
                                                        setEmojiPickerOpen(false)
                                                    }}
                                                    className={cn(
                                                        "rounded-md border p-2 text-xl transition-colors",
                                                        form.icon === emoji && "border-2 border-primary bg-secondary"
                                                    )}
                                                    aria-label={`Choose ${emoji} as group icon`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-3 w-5/7">
                                <Label>Background Color</Label>
                                <div className="flex h-9 items-center gap-2 rounded-md border px-3 py-2 justify-around">
                                    {ICON_BG_COLOR_OPTIONS.map((colorOption) => (
                                        <button
                                            key={colorOption}
                                            type="button"
                                            aria-label={`Set icon background to ${colorOption}`}
                                            onClick={() => handleChange("iconBgColor", colorOption)}
                                            className={cn(
                                                "size-6 rounded-full border-2 transition",
                                                form.iconBgColor === colorOption
                                                    ? "border-primary ring-2 ring-primary/30"
                                                    : "border-border"
                                            )}
                                            style={{ backgroundColor: `var(--${colorOption})` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Group Header Image (Optional)</Label>
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
                                        alt="Group header preview"
                                        className="w-full h-32 object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7"
                                        onClick={() => handleChange("profileImageUrl", null)}
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
                                    <p className="text-xs text-muted-foreground/70">JPG, PNG or WebP</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DrawerFooter className="border-t">
                        <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
                            {isSubmitting ? (mode === "edit" ? "Saving..." : "Creating...") : (mode === "edit" ? "Save Changes" : "Create Group")}
                        </Button>
                        <DrawerClose asChild>
                            <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    )
}
