import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExternalLink, EllipsisVertical, CircleX, FlagTriangleRight } from "lucide-react"

type Props = {
    onShareLink?: () => void
    onReport?: () => void
    onCancelRsvp?: () => void
}

export default function ActivityActionsMenu({
    onShareLink,
    onReport,
    onCancelRsvp,
}: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label="Activity actions"
                >
                    <EllipsisVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onShareLink}>
                    <ExternalLink className="h-4 w-4" />
                    Share Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReport}>
                    <FlagTriangleRight className="h-4 w-4" />
                    Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCancelRsvp} className="text-destructive">
                    <CircleX className="h-4 w-4 text-destructive" />
                    Cancel RSVP
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}