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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export type CreatePostValues = {
    title: string
    content: string
    imageUrl: string
    groupName: string | null
    isPublic: boolean
}

type CreatePostDrawerProps = {
    onSubmit?: (values: CreatePostValues) => Promise<void> | void
    groupOptions?: string[]
}

const INITIAL_VALUES: CreatePostValues = {
    title: "",
    content: "",
    imageUrl: "",
    groupName: null,
    isPublic: false,
}

export default function CreatePostDrawer({
    onSubmit,
    groupOptions = [],
}: CreatePostDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [form, setForm] = React.useState<CreatePostValues>(INITIAL_VALUES)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleChange = <K extends keyof CreatePostValues>(key: K, value: CreatePostValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (onSubmit) {
                await onSubmit(form)
            } else {
                // TODO: implememt form submissoin to backend
                await new Promise((resolve) => setTimeout(resolve, 500))
                console.log("Create discussion payload:", form)
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
                    New Post
                </Button>
            </DrawerTrigger>

            <DrawerContent className="h-[88vh] flex flex-col">
                <DrawerHeader className="border-b shrink-0">
                    <DrawerTitle className="text-center">Create Discussion Post</DrawerTitle>
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
                            <Label htmlFor="post-image-url">Image URL (Optional)</Label>
                            <Input
                                id="post-image-url"
                                value={form.imageUrl}
                                onChange={(e) => handleChange("imageUrl", e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

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
                                        {form.groupName || "No group tag"}
                                        <ChevronDown className="size-4 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                                    <DropdownMenuItem onClick={() => handleChange("groupName", null)}>
                                        No group tag
                                    </DropdownMenuItem>
                                    {groupOptions.map((groupName) => (
                                        <DropdownMenuItem
                                            key={groupName}
                                            onClick={() => handleChange("groupName", groupName)}
                                        >
                                            {groupName}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

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
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Posting..." : "Post Discussion"}
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
