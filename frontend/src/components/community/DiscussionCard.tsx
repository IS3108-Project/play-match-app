import * as React from "react"
import { Crown, MessageCircle, Trash2, ThumbsUp } from "lucide-react"
import { Link } from "react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import DeleteConfirmDrawer from "@/components/ui/DeleteConfirmDrawer"

type Discussion = {
    id: string
    title: string
    authorName: string
    authorImage?: string | null
    groupName?: string | null
    content: string
    likeCount: number
    commentCount: number
    isLiked: boolean
    isOwner?: boolean
    createdAt: string
}

type DiscussionCardProps = {
    discussion: Discussion
    backTo?: string
    onLike?: (id: string) => void
    onDelete?: (id: string) => void
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export default function DiscussionCard({ discussion, backTo = "/community/discussions", onLike, onDelete }: DiscussionCardProps) {
    const timeAgo = formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })
    const [confirmOpen, setConfirmOpen] = React.useState(false)

    return (
        <>
        <Link
            to={`/community/discussions/${discussion.id}`}
            state={{ backTo }}
            className="discussion-card-hover block rounded-xl border bg-card p-4 shadow-sm"
        >
            <header className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={discussion.authorImage ?? undefined} alt={discussion.authorName} />
                        <AvatarFallback>{getInitials(discussion.authorName)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-foreground text-sm font-semibold leading-snug whitespace-normal">
                            {discussion.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <p className="text-xs text-muted-foreground">{discussion.authorName}</p>
                            {discussion.isOwner && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                                    <Crown className="h-3 w-3" />
                                    Owner
                                </span>
                            )}
                        </div>
                        {discussion.groupName ? (
                            <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                {discussion.groupName}
                            </span>
                        ) : null}
                    </div>
                </div>
                {discussion.isOwner && onDelete && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmOpen(true) }}
                        className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete discussion"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </header>

            <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground/90">{discussion.content}</p>

            <footer className="mt-4 flex items-center gap-5 border-t pt-3 text-sm text-muted-foreground">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        onLike?.(discussion.id)
                    }}
                    className={`inline-flex items-center gap-1.5 transition-colors ${discussion.isLiked ? "text-primary" : "hover:text-foreground"}`}
                    aria-label="Like discussion"
                >
                    <ThumbsUp className={`h-4 w-4 ${discussion.isLiked ? "fill-primary" : ""}`} />
                    <span>{discussion.likeCount}</span>
                </button>
                <div className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    <span>{discussion.commentCount} replies</span>
                </div>
                <div className="ml-auto inline-flex items-center gap-1.5">
                    <span className="shrink-0 text-xs text-muted-foreground/70">{timeAgo}</span>
                </div>
            </footer>
        </Link>
        {discussion.isOwner && onDelete && (
            <DeleteConfirmDrawer
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                name={discussion.title}
                itemType="discussion"
                onConfirm={async () => { onDelete(discussion.id) }}
            />
        )}
        </>
    )
}
