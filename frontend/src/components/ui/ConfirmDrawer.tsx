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
import { Trash2, Ban, ShieldCheck } from "lucide-react"

type ConfirmDrawerProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: React.ReactNode
    confirmText?: string
    cancelText?: string
    variant?: "destructive" | "warning" | "default"
    onConfirm: () => Promise<void>
}

export default function ConfirmDrawer({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "destructive",
    onConfirm,
}: ConfirmDrawerProps) {
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

    const Icon = variant === "destructive" ? Trash2 : variant === "warning" ? Ban : ShieldCheck
    const iconColor = variant === "destructive" ? "text-destructive" : variant === "warning" ? "text-amber-500" : "text-primary"

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="border-b">
                    <DrawerTitle className="text-center flex items-center justify-center gap-2">
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                        {title}
                    </DrawerTitle>
                </DrawerHeader>
                <div className="px-4 py-6 space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
                        {description}
                    </div>
                    <DrawerFooter className="px-0 gap-2">
                        <Button
                            variant={variant === "default" ? "default" : "destructive"}
                            className="w-full"
                            onClick={handleConfirm}
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : confirmText}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            {cancelText}
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
