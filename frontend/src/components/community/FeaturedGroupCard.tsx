import { CheckCircle, Crown, Users } from "lucide-react"
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
    isJoined?: boolean
    isOwner?: boolean
}

type FeaturedGroupCardPlaceholderProps = {
    group: FeaturedGroup
}

export default function FeaturedGroupCardPlaceholder({
    group,
}: FeaturedGroupCardPlaceholderProps) {
    return (
        <article className="card-hover mx-auto flex h-full w-full min-h-[300px] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            {/* Group Icon / Background */}
            <div
                className="flex h-24 items-center justify-center text-4xl"
                style={{ backgroundColor: `var(--${group.iconBgColor})` }}
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

                {group.isOwner ? (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Crown className="h-3 w-3" />
                        Owner
                    </span>
                ) : group.isJoined ? (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Joined
                    </span>
                ) : null}

                {/* Action Button */}
                <Button asChild className="mt-auto w-full bg-primary text-sm font-semibold text-primary-foreground">
                    <Link to={`/community/groups/${group.id}`}>View</Link>
                </Button>
            </div>
        </article>
    )
}