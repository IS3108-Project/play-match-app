import { MessageCircle, Share2, ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Image } from "@/components/ui/image"

type DiscussionPostContentProps = {
    authorName: string
    authorAvatar: string
    timeAgo: string
    title: string
    content: string
    imgSrc?: string | null
    likes: number
    commentsCount: number
    onShare: () => void
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

export default function DiscussionPostContent({
    authorName,
    authorAvatar,
    timeAgo,
    title,
    content,
    imgSrc,
    likes,
    commentsCount,
    onShare,
}: DiscussionPostContentProps) {
    return (
        <article className="space-y-4 px-4 py-5">
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={authorAvatar} alt={authorName} />
                    <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold leading-none">{authorName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{timeAgo}</p>
                </div>
            </div>

            <h2 className="text-3xl font-bold leading-tight">{title}</h2>
            <p className="text-base leading-7 text-foreground/90">{content}</p>

            {imgSrc ? (
                <Image
                    src={imgSrc}
                    alt={title}
                    className="h-64 w-full rounded-xl object-cover"
                />
            ) : null}

            <div className="flex items-center gap-6 border-t pt-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{likes}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    <span>{commentsCount}</span>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onShare}
                    className="ml-auto h-auto px-2 text-muted-foreground hover:text-foreground"
                >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                </Button>
            </div>
        </article>
    )
}
