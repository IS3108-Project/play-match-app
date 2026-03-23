import * as React from "react"
import { ArrowLeft, Send, Trash2 } from "lucide-react"
import DeleteConfirmDrawer from "@/components/ui/DeleteConfirmDrawer"
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PostCommentCard from "@/components/community/PostCommentCard"
import DiscussionPostContent from "@/components/community/DiscussionPostContent"
import PostActionMenu from "@/components/community/PostActionMenu"
import CreatePostDrawer from "@/components/ui/CreatePostDrawer"
import type { CreatePostValues } from "@/components/ui/CreatePostDrawer"
import { useRole } from "@/hooks/useRole"
import { communityApi } from "@/lib/api"
import type { CommunityDiscussionDetail, CommunityComment } from "@/lib/api"

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export default function DiscussionPostPage() {
    const { discussionId } = useParams<{ discussionId: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const { session } = useRole()
    const user = session?.user

    const [discussion, setDiscussion] = React.useState<CommunityDiscussionDetail | null | undefined>(undefined)
    const [commentText, setCommentText] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [deleteConfirm, setDeleteConfirm] = React.useState(false)

    const backTo =
        typeof (location.state as { backTo?: unknown } | null)?.backTo === "string"
            ? (location.state as { backTo: string }).backTo
            : "/community/discussions"

    React.useEffect(() => {
        if (!discussionId) return
        communityApi.getDiscussion(discussionId)
            .then(setDiscussion)
            .catch(() => setDiscussion(null))
    }, [discussionId])

    const handleUpdateDiscussion = async (values: CreatePostValues) => {
        if (!discussionId) return
        const updated = await communityApi.updateDiscussion(discussionId, {
            title: values.title,
            content: values.content,
            imageUrl: values.imageUrl || null,
            isPublic: values.isPublic,
        })
        setDiscussion((prev) => prev ? { ...prev, ...updated, comments: prev.comments } : prev)
        toast.success("Discussion updated!")
    }

    const handleDeleteComment = async (commentId: string) => {
        try {
            await communityApi.deleteComment(commentId)
            setDiscussion((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    commentCount: prev.commentCount - 1,
                    comments: prev.comments.filter((c) => c.id !== commentId),
                }
            })
            toast.success("Comment deleted")
        } catch {
            toast.error("Failed to delete comment")
        }
    }

    const handleDeleteDiscussion = async () => {
        if (!discussionId) return
        try {
            await communityApi.deleteDiscussion(discussionId)
            toast.success("Discussion deleted")
            navigate(backTo)
        } catch {
            toast.error("Failed to delete discussion")
        }
    }

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            toast.success("Link Copied")
        } catch {
            toast.error("Something went wrong")
        }
    }

    const handleLike = async () => {
        if (!discussionId || !discussion) return
        try {
            const { liked, likeCount } = await communityApi.toggleDiscussionLike(discussionId)
            setDiscussion((prev) => prev ? { ...prev, isLiked: liked, likeCount } : prev)
        } catch {
            toast.error("Failed to like post")
        }
    }

    const handleCommentLike = async (commentId: string) => {
        try {
            const { liked, likeCount } = await communityApi.toggleCommentLike(commentId)
            setDiscussion((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    comments: prev.comments.map((c) =>
                        c.id === commentId ? { ...c, isLiked: liked, likeCount } : c
                    ),
                }
            })
        } catch {
            toast.error("Failed to like comment")
        }
    }

    const handlePostComment = async () => {
        if (!discussionId || !commentText.trim()) return
        setIsSubmitting(true)
        try {
            const newComment: CommunityComment = await communityApi.addComment(discussionId, commentText.trim())
            setDiscussion((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    commentCount: prev.commentCount + 1,
                    comments: [...prev.comments, newComment],
                }
            })
            setCommentText("")
        } catch {
            toast.error("Failed to post comment")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (discussion === undefined) {
        return (
            <div className="container mx-auto px-4 py-6">
                <p className="text-center text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (discussion === null) {
        return <Navigate to="/community" replace />
    }

    const timeAgo = formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mx-auto max-w-xl rounded-2xl border bg-card">
                <header className="flex items-start justify-between border-b px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link to={backTo} className="text-muted-foreground transition-colors hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold">Discussions</h1>
                            {discussion.groupName ? (
                                <p className="truncate text-sm text-muted-foreground">{discussion.groupName}</p>
                            ) : null}
                        </div>
                    </div>
                    {discussion.isOwner ? (
                        <div className="flex items-center gap-2">
                            <CreatePostDrawer
                                mode="edit"
                                initialValues={{
                                    title: discussion.title,
                                    content: discussion.content,
                                    imageUrl: discussion.imageUrl ?? null,
                                    groupId: discussion.groupId ?? null,
                                    isPublic: true,
                                }}
                                onSubmit={handleUpdateDiscussion}
                            />
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(true)}
                                className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                                aria-label="Delete discussion"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                            <DeleteConfirmDrawer
                                open={deleteConfirm}
                                onOpenChange={setDeleteConfirm}
                                name={discussion.title}
                                itemType="discussion"
                                onConfirm={handleDeleteDiscussion}
                            />
                        </div>
                    ) : (
                        <PostActionMenu onReport={() => { }} />
                    )}
                </header>

                {/* Discussion Post Content */}
                <DiscussionPostContent
                    authorName={discussion.authorName}
                    authorImage={discussion.authorImage}
                    timeAgo={timeAgo}
                    title={discussion.title}
                    content={discussion.content}
                    imgSrc={discussion.imageUrl}
                    likes={discussion.likeCount}
                    isLiked={discussion.isLiked}
                    commentsCount={discussion.comments.length}
                    onShare={handleShare}
                    onLike={handleLike}
                />

                {/* Post Comments */}
                <section className="border-t bg-muted/20 px-4 py-4">
                    <h3 className="text-lg font-bold">{discussion.comments.length} Comments</h3>
                    <div className="mt-4 space-y-3">
                        {discussion.comments.map((comment) => (
                            <PostCommentCard
                                key={comment.id}
                                commentId={comment.id}
                                authorName={comment.authorName}
                                authorImage={comment.authorImage}
                                timeAgo={formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                content={comment.content}
                                likes={comment.likeCount}
                                isLiked={comment.isLiked}
                                isOwner={comment.isOwner}
                                onLike={() => handleCommentLike(comment.id)}
                                onDelete={() => handleDeleteComment(comment.id)}
                                onReport={() => { }}
                            />
                        ))}
                    </div>
                </section>

                <footer className="sticky bottom-0 border-t bg-card px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "You"} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.name ? getInitials(user.name) : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="relative flex-1">
                            <Input
                                placeholder="Add a comment..."
                                className="pr-10"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handlePostComment()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handlePostComment}
                                disabled={isSubmitting || !commentText.trim()}
                                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Send comment"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
