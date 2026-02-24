import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

type FeaturedGroup = {
    id: string
    name: string
    icon: string
    iconBgColor: string
    memberCount: number
    description: string
    avatarUrls: string[]
    isFeatured: boolean
}

type FeaturedGroupCardPlaceholderProps = {
    group: FeaturedGroup
}

export default function FeaturedGroupCardPlaceholder({
    group,
}: FeaturedGroupCardPlaceholderProps) {
    return (
        <article className="mx-auto flex h-full w-full min-h-[300px] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            {/* Group Icon / Background */}
            <div
                className="flex h-24 items-center justify-center text-4xl"
                style={{ backgroundColor: group.iconBgColor }}
                aria-hidden="true"
            >
                <span>{group.icon}</span>
            </div>

            {/* Description */}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">{group.name}</h3>

                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{group.description}</p>

                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.memberCount.toLocaleString()} Members</span>
                </div>

                {/* Action Button */}
                <Button asChild className="mt-auto w-full bg-primary text-sm font-semibold text-primary-foreground">
                    <Link to={`/community/groups/${group.id}`}>Join</Link>
                </Button>
            </div>
        </article>
    )
}