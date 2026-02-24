"use client"

import * as React from "react"
import { ChevronDown, PlusIcon } from "lucide-react"

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
import { Image } from "@/components/ui/image"

// TODO: maybe have enum in database
const EMOJI_OPTIONS = ["🏃", "🏸", "🧘", "🚴", "🏀", "⚽", "🎾", "🏊", "💪", "🥾", "🧗", "🛼"] as const
const ICON_BG_COLOR_OPTIONS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const

export type CreateGroupValues = {
    name: string
    description: string
    icon: string
    iconBgColor: string
    headerImageFile: File | null
    profileImageUrl: string | null
}

type CreateGroupDrawerProps = {
    onSubmit?: (values: CreateGroupValues) => Promise<void> | void
}

const INITIAL_VALUES: CreateGroupValues = {
    name: "",
    description: "",
    icon: "🏃",
    iconBgColor: "chart-1",
    headerImageFile: null,
    profileImageUrl: null,
}

export default function CreateGroupDrawer({ onSubmit }: CreateGroupDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [emojiPickerOpen, setEmojiPickerOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [form, setForm] = React.useState<CreateGroupValues>(INITIAL_VALUES)
    const [headerImagePreview, setHeaderImagePreview] = React.useState<string | null>(null)

    // TODO: add character limit to group name & description?

    React.useEffect(() => {
        return () => {
            if (headerImagePreview) {
                URL.revokeObjectURL(headerImagePreview)
            }
        }
    }, [headerImagePreview])

    const handleChange = <K extends keyof CreateGroupValues>(key: K, value: CreateGroupValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const resetForm = () => {
        if (headerImagePreview) {
            URL.revokeObjectURL(headerImagePreview)
        }
        setHeaderImagePreview(null)
        setForm(INITIAL_VALUES)
    }

    const handleHeaderImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null

        if (headerImagePreview) {
            URL.revokeObjectURL(headerImagePreview)
        }

        if (!file) {
            setHeaderImagePreview(null)
            handleChange("headerImageFile", null)
            handleChange("profileImageUrl", null)
            return
        }

        const nextPreviewUrl = URL.createObjectURL(file)
        setHeaderImagePreview(nextPreviewUrl)
        handleChange("headerImageFile", file)
        handleChange("profileImageUrl", nextPreviewUrl)
    }

    // TODO: implement submit functionality
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (onSubmit) {
                await onSubmit(form)
            } else {
                // Dummy DB call placeholder
                await new Promise((resolve) => setTimeout(resolve, 500))
                console.log("Create group payload:", form)
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
                <Button type="button" className="bg-primary text-primary-foreground">
                    <PlusIcon className="size-4" />
                    Create Group
                </Button>
            </DrawerTrigger>

            <DrawerContent className="h-[88vh] flex flex-col">
                <DrawerHeader className="border-b shrink-0">
                    <DrawerTitle className="text-center">Create Group</DrawerTitle>
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
                                                <span
                                                    className="inline-flex size-8 items-center justify-center rounded-full text-lg"
                                                >
                                                    {form.icon}
                                                </span>
                                                {!form.icon ? "Choose Icon" : null}
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
                            <Label htmlFor="group-header-image">Group Header Image (Optional)</Label>
                            <Input
                                id="group-header-image"
                                type="file"
                                accept="image/*"
                                onChange={handleHeaderImageChange}
                                className="file:font-semibold text-muted-foreground"
                            />
                            {headerImagePreview ? (
                                <Image
                                    src={headerImagePreview}
                                    alt="Group header preview"
                                    className="h-32 w-full rounded-md border object-cover"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Uploaded image will be used as group header in the group detail page.
                                </p>
                            )}
                        </div>
                    </div>

                    <DrawerFooter className="border-t">
                        {/* TODO: implement submit functionality */}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Group"}
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
