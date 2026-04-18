import * as React from "react"
import { ThumbsUp, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolveProfileImage } from "@/lib/utils"
import PostActionMenu from "@/components/community/PostActionMenu"
import DeleteConfirmDrawer from "@/components/ui/DeleteConfirmDrawer"

type PostCommentCardProps = {
    commentId: string
    authorName: string
    authorImage?: string | null
    timeAgo: string
    content: string
    likes: number
    isLiked: boolean
    isOwner?: boolean
    onLike?: () => void
    onDelete?: () => void
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
    authorImage,
    timeAgo,
    content,
    likes,
    isLiked,
    isOwner,
    onLike,
    onDelete,
    onReport,
}: PostCommentCardProps) {
    const [deleteConfirm, setDeleteConfirm] = React.useState(false)

    return (
        <>
        <article className="rounded-xl border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={resolveProfileImage(authorImage)} alt={authorName} />
                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="font-semibold leading-none">{authorName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{timeAgo}</p>
                    </div>
                </div>
                {isOwner ? (
                    <button
                        type="button"
                        onClick={() => setDeleteConfirm(true)}
                        className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete comment"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : (
                    <PostActionMenu onReport={onReport ?? (() => { })} />
                )}
            </div>

            <p className="mt-3 text-sm leading-6 text-foreground/90">{content}</p>

            <button
                type="button"
                onClick={onLike}
                className={`mt-3 inline-flex items-center gap-1.5 text-sm transition-colors ${isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Like comment"
            >
                <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
                <span>{likes}</span>
            </button>
        </article>
        {isOwner && onDelete && (
            <DeleteConfirmDrawer
                open={deleteConfirm}
                onOpenChange={setDeleteConfirm}
                name="this comment"
                itemType="comment"
                onConfirm={async () => { onDelete() }}
            />
        )}
        </>
    )
}
