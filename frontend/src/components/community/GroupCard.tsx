import { CheckCircle, Crown, MessageSquare, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolveProfileImage } from "@/lib/utils"

type Group = {
  id: string
  name: string
  icon: string
  iconBgColor: string
  memberCount: number
  discussionCount: number
  description: string
  memberAvatars: { name: string; image: string | null }[]
  isJoined?: boolean
  isOwner?: boolean
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

type GroupCardProps = {
  group: Group
}

export default function GroupCard({ group }: GroupCardProps) {
  const formatCount = (count: number) => count.toLocaleString()

  return (
    <div className="card-hover rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: `var(--${group.iconBgColor})` }}
          aria-hidden="true"
        >
          <span>{group.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-foreground text-lg font-semibold">{group.name}</h3>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatCount(group.memberCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {formatCount(group.discussionCount)}
            </span>
            {group.isOwner ? (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Crown className="h-3.5 w-3.5" />
                Owner
              </span>
            ) : group.isJoined ? (
              <span className="flex items-center gap-1 text-primary font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                Joined
              </span>
            ) : null}
          </div>

          <p className="mt-3 line-clamp-2 text-[15px] text-foreground/80">{group.description}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              {group.memberAvatars.slice(0, 4).map((member, idx) => (
                <Avatar key={`${group.id}-avatar-${idx}`} className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={resolveProfileImage(member.image)} alt={member.name} />
                  <AvatarFallback className="text-[10px]">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>

            <Button variant="ghost" size="sm" className="text-primary">
              <Link to={`/community/groups/${group.id}`}>
                View
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
