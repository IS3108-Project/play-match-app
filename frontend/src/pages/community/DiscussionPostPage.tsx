import { ArrowLeft, Send } from "lucide-react"
import { Link, Navigate, useLocation, useParams } from "react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import PostCommentCard from "@/components/PostCommentCard"
import DiscussionPostContent from "@/components/DiscussionPostContent"
import PostActionMenu from "@/components/PostActionMenu"
import { useRole } from "@/hooks/useRole"

// TODO: Use actual discussion and comment info from the database
import discussions from "@/data/discussions.json"
import discussionComments from "@/data/discussion-comments.json"

type Discussion = {
    id: string
    title: string
    authorName: string
    authorAvatar: string
    groupName?: string | null
    content: string
    likes: number
    replies: number
    timeAgo: string
    imgSrc?: string | null
}

type DiscussionComment = {
    id: string
    discussionId: string
    authorName: string
    authorAvatar: string
    content: string
    likes: number
    timeAgo: string
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export default function DiscussionPostPage() {
    const { discussionId } = useParams()
    const location = useLocation()
    const { session } = useRole()
    const user = session?.user
    const discussion = (discussions as Discussion[]).find((item) => item.id === discussionId)
    const backTo =
        typeof (location.state as { backTo?: unknown } | null)?.backTo === "string"
            ? (location.state as { backTo: string }).backTo
            : "/community/discussions"

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            toast.success("Link Copied")
        } catch {
            toast.error("Something went wrong")
        }
    }

    // TODO: Implement report discussion functionality
    const handleReportDiscussion = () => {
        console.log("Report discussion payload:", {
            discussionId: discussion?.id,
            reason: "inappropriate_content",
        })
    }

    // TODO: Implement post comment functionality
    const handlePostComment = () => {
        console.log("Post comment payload:", {
            discussionId: discussion?.id,
            userId: user?.id,
            content: "Dummy comment content",
        })
    }

    if (!discussion) {
        return <Navigate to="/community" replace />
    }

    // TODO: extract post content and comments in the backend
    const comments = (discussionComments as DiscussionComment[]).filter(
        (comment) => comment.discussionId === discussion.id,
    )

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
                    <PostActionMenu onReport={handleReportDiscussion} />
                </header>

                {/* Discussion Post Content */}
                <DiscussionPostContent
                    authorName={discussion.authorName}
                    authorAvatar={discussion.authorAvatar}
                    timeAgo={discussion.timeAgo}
                    title={discussion.title}
                    content={discussion.content}
                    imgSrc={discussion.imgSrc}
                    likes={discussion.likes}
                    commentsCount={comments.length}
                    onShare={handleShare}
                />

                {/* Post Comments */}
                <section className="border-t bg-muted/20 px-4 py-4">
                    <h3 className="text-lg font-bold">{comments.length} Comments</h3>
                    <div className="mt-4 space-y-3">
                        {comments.map((comment) => (
                            <PostCommentCard
                                key={comment.id}
                                authorName={comment.authorName}
                                authorAvatar={comment.authorAvatar}
                                timeAgo={comment.timeAgo}
                                content={comment.content}
                                likes={comment.likes}
                                onReport={() => { }}
                            />
                        ))}
                    </div>
                </section>

                <footer className="sticky bottom-0 border-t bg-card px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "You"} />
                            <AvatarFallback className="bg-primary text-primary-foreground">{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                        </Avatar>
                        <div className="relative flex-1">
                            <Input placeholder="Add a comment..." className="pr-10" />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handlePostComment}
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

