import { MessageSquare, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

type Group = {
  id: string
  name: string
  icon: string
  iconBgColor: string
  memberCount: number
  discussionCount: number
  description: string
  avatarUrls: string[]
}

type GroupCardProps = {
  group: Group
}

export default function GroupCard({ group }: GroupCardProps) {
  const formatCount = (count: number) => count.toLocaleString()

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: group.iconBgColor }}
          aria-hidden="true"
        >
          <span>{group.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-foreground text-lg font-semibold">{group.name}</h3>

          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatCount(group.memberCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {formatCount(group.discussionCount)}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-[15px] text-foreground/80">{group.description}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              {group.avatarUrls.slice(0, 4).map((url, idx) => (
                <img
                  key={`${group.id}-avatar-${idx}`}
                  src={url}
                  alt={`${group.name} member ${idx + 1}`}
                  className="h-7 w-7 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>

            <Button variant="ghost" size="sm" className="text-primary">
              <Link to={`/community/groups/${group.id}`}>
                View More
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}