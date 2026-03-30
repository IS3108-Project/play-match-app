"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"

type DeleteConfirmDrawerProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    itemType?: "group" | "discussion" | "comment"
    onConfirm: () => Promise<void>
}

export default function DeleteConfirmDrawer({
    open,
    onOpenChange,
    name,
    itemType = "discussion",
    onConfirm,
}: DeleteConfirmDrawerProps) {
    const [submitting, setSubmitting] = React.useState(false)

    const handleConfirm = async () => {
        setSubmitting(true)
        try {
            await onConfirm()
            onOpenChange(false)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center">Delete {itemType === "group" ? "Group" : itemType === "comment" ? "Comment" : "Discussion"}</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-6 space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Are you sure you want to delete <span className="font-semibold text-foreground">"{name}"</span>? This action cannot be undone.
                    </p>
                    <DrawerFooter className="px-0 gap-2">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleConfirm}
                            disabled={submitting}
                        >
                            {submitting ? "Deleting..." : `Delete ${itemType === "group" ? "Group" : itemType === "comment" ? "Comment" : "Discussion"}`}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
