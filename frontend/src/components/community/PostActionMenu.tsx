import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EllipsisVertical, FlagTriangleRight } from "lucide-react"

type Props = {
    onReport?: () => void
}

export default function PostActionMenu({
    onReport,
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
                <DropdownMenuItem onClick={onReport}>
                    <FlagTriangleRight className="h-4 w-4" />
                    Report
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}