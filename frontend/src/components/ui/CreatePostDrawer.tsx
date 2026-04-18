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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn, toLocalDate } from "@/lib/utils"
import { communityApi, activityApi, type Activity } from "@/lib/api"

export type CreatePostValues = {
    title: string
    content: string
    imageUrl: string | null
    groupId: string | null
    isPublic: boolean
    linkedActivityId: string | null
}

type GroupOption = { id: string; name: string }

type CreatePostDrawerProps = {
    onSubmit?: (values: CreatePostValues) => Promise<void> | void
    groupOptions?: GroupOption[]
    defaultGroupId?: string | null
    triggerLabel?: string
    initialValues?: CreatePostValues
    mode?: "create" | "edit"
}

const INITIAL_VALUES: CreatePostValues = {
    title: "",
    content: "",
    imageUrl: null,
    groupId: null,
    isPublic: true,
    linkedActivityId: null,
}

export default function CreatePostDrawer({
    onSubmit,
    groupOptions = [],
    defaultGroupId = null,
    triggerLabel,
    initialValues,
    mode = "create",
}: CreatePostDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [form, setForm] = React.useState<CreatePostValues>(initialValues ?? { ...INITIAL_VALUES, groupId: defaultGroupId })
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const [pendingFile, setPendingFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [hostedActivities, setHostedActivities] = React.useState<Activity[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (open) {
            setForm(initialValues ?? { ...INITIAL_VALUES, groupId: defaultGroupId })
            setPendingFile(null)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
            activityApi.mine({ host: ["me"], time: ["upcoming"], limit: 50 })
                .then((res) => setHostedActivities(
                    res.data.filter((a) => a.status !== "CANCELLED" && toLocalDate(a.date) > new Date())
                ))
                .catch(() => setHostedActivities([]))
        }
    }, [open, defaultGroupId, initialValues])

    const handleChange = <K extends keyof CreatePostValues>(key: K, value: CreatePostValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const selectedGroup = groupOptions.find((g) => g.id === form.groupId) ?? null
    const selectedActivity = hostedActivities.find((a) => a.id === form.linkedActivityId) ?? null

    const handleImageUpload = async (file: File) => {
        setPendingFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        handleChange("imageUrl", "pending")
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

    const previewSrc = previewUrl || (form.imageUrl && form.imageUrl !== "pending" ? form.imageUrl : null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            let finalForm = { ...form }
            if (pendingFile) {
                setUploading(true)
                try {
                    const url = await communityApi.uploadImage(pendingFile, "discussions")
                    finalForm = { ...finalForm, imageUrl: url }
                } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Failed to upload image")
                    return
                } finally {
                    setUploading(false)
                }
            } else if (form.imageUrl === "pending") {
                finalForm = { ...finalForm, imageUrl: null }
            }

            if (onSubmit) {
                await onSubmit(finalForm)
            }
            setOpen(false)
            setForm({ ...INITIAL_VALUES, groupId: defaultGroupId })
            setPendingFile(null)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {mode === "edit" ? (
                    <Button type="button" variant="outline" size="sm">
                        <PencilIcon className="size-4" />
                        {triggerLabel ?? "Edit Post"}
                    </Button>
                ) : (
                    <Button type="button" className="bg-primary text-primary-foreground">
                        <PlusIcon className="size-4" />
                        {triggerLabel ?? "New Post"}
                    </Button>
                )}
            </DrawerTrigger>

            <DrawerContent className="h-[88vh] flex flex-col">
                <DrawerHeader className="border-b shrink-0">
                    <DrawerTitle className="text-center">{mode === "edit" ? "Edit Discussion" : "Create Discussion Post"}</DrawerTitle>
                </DrawerHeader>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-5">
                        <div className="space-y-3">
                            <Label htmlFor="post-title">Post Title</Label>
                            <Input
                                id="post-title"
                                value={form.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                placeholder="e.g. Favorite running routes in SG?"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="post-content">Post Content</Label>
                            <textarea
                                id="post-content"
                                value={form.content}
                                onChange={(e) => handleChange("content", e.target.value)}
                                placeholder="Share your question, tips, or thoughts..."
                                rows={6}
                                required
                                className={cn(
                                    "border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                                )}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Post Image (Optional)</Label>
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
                                        alt="Post image"
                                        className="w-full h-40 object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7"
                                        onClick={() => {
                                            handleChange("imageUrl", null)
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
                                    <p className="text-xs text-muted-foreground/70">JPG, PNG or WebP</p>
                                </div>
                            )}
                        </div>

                        {groupOptions.length > 0 && (
                            <div className="space-y-3">
                                <Label htmlFor="post-group-trigger">Tag to Group (Optional)</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            id="post-group-trigger"
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between"
                                        >
                                            {selectedGroup ? selectedGroup.name : "No group tag"}
                                            <ChevronDown className="size-4 opacity-70" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                        <DropdownMenuItem onClick={() => handleChange("groupId", null)}>
                                            No group tag
                                        </DropdownMenuItem>
                                        {groupOptions.map((group) => (
                                            <DropdownMenuItem
                                                key={group.id}
                                                onClick={() => handleChange("groupId", group.id)}
                                            >
                                                {group.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        {hostedActivities.length > 0 && (
                            <div className="space-y-3">
                                <Label>Link an Activity (Optional)</Label>
                                {selectedActivity ? (
                                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{selectedActivity.title}</p>
                                            <p className="text-xs text-muted-foreground">{selectedActivity.activityType} · {selectedActivity.startTime}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleChange("linkedActivityId", null)}
                                            className="ml-2 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                            aria-label="Remove linked activity"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between"
                                            >
                                                No activity linked
                                                <ChevronDown className="size-4 opacity-70" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                            {hostedActivities.map((activity) => (
                                                <DropdownMenuItem
                                                    key={activity.id}
                                                    onClick={() => handleChange("linkedActivityId", activity.id)}
                                                >
                                                    <span className="truncate">{activity.title}</span>
                                                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{activity.activityType}</span>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="post-public-switch">Post Visibility</Label>
                            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <p className="text-sm text-muted-foreground">Make this post public</p>
                                <Switch
                                    id="post-public-switch"
                                    checked={form.isPublic}
                                    onCheckedChange={(checked) => handleChange("isPublic", checked)}
                                />
                            </div>
                        </div>
                    </div>

                    <DrawerFooter className="border-t">
                        <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
                            {isSubmitting ? (mode === "edit" ? "Saving..." : "Posting...") : (mode === "edit" ? "Save Changes" : "Post Discussion")}
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
