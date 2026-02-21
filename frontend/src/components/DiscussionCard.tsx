import { MessageCircle, ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Discussion = {
    id: string
    title: string
    authorName: string
    authorAvatar: string
    groupName: string
    content: string
    likes: number
    replies: number
    timeAgo: string
}

type DiscussionCardProps = {
    discussion: Discussion
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

// function DiscussionCardPlaceholder({ discussion }: { discussion: Discussion }) {
//     return (
//         <div className="rounded-xl border bg-card p-4 shadow-sm">
//             <div className="mb-2 text-sm text-muted-foreground">Discussion card placeholder</div>
//             <h3 className="font-semibold">{discussion.title}</h3>
//             <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{discussion.content}</p>
//             <p className="mt-2 text-xs text-muted-foreground">
//                 {discussion.authorName} · {discussion.groupName} · {discussion.timeAgo}
//             </p>
//         </div>
//     )
// }

export default function DiscussionCard({ discussion }: DiscussionCardProps) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <header className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={discussion.authorAvatar} alt={discussion.authorName} />
                        <AvatarFallback>{getInitials(discussion.authorName)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-foreground text-sm font-semibold leading-snug whitespace-normal">
                            {discussion.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {discussion.authorName}
                        </p>
                    </div>
                </div>
            </header>

            <p className="mt-3 text-sm leading-6 text-foreground/90">{discussion.content}</p>

            <footer className="mt-4 flex items-center gap-5 border-t pt-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{discussion.likes}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    <span>{discussion.replies} replies</span>
                </div>
                <div className="ml-auto inline-flex items-center gap-1.5">
                    <span className="shrink-0 text-xs text-muted-foreground/70">{discussion.timeAgo}</span>
                </div>
            </footer>
        </div>
    )
}