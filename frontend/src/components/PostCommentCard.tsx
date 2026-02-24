import { ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PostActionMenu from "@/components/PostActionMenu"

type PostCommentCardProps = {
    authorName: string
    authorAvatar: string
    timeAgo: string
    content: string
    likes: number
    onReport?: () => void
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export default function PostCommentCard({
    authorName,
    authorAvatar,
    timeAgo,
    content,
    likes,
    onReport,
}: PostCommentCardProps) {
    return (
        <article className="rounded-xl border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={authorAvatar} alt={authorName} />
                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="font-semibold leading-none">{authorName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{timeAgo}</p>
                    </div>
                </div>
                <PostActionMenu onReport={onReport ?? (() => { })} />
            </div>

            <p className="mt-3 text-sm leading-6 text-foreground/90">{content}</p>

            <div className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <ThumbsUp className="h-4 w-4" />
                <span>{likes}</span>
            </div>
        </article>
    )
}
