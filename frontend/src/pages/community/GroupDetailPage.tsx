import * as React from "react"
import { ArrowLeft, Plus, UserRound } from "lucide-react"
import { Link, Navigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import DiscussionCard from "@/components/DiscussionCard"
import { Image } from "@/components/ui/image"
// TODO: Use actual group and discussion info from the database
import groups from "@/data/groups.json"
import discussions from "@/data/discussions.json"

type Group = {
    id: string
    name: string
    memberCount: number
    description: string
    avatarUrls: string[]
    profileImageUrl?: string
}

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

type JoinStatus = "joined" | "not-joined"

const JOINED_GROUP_IDS = new Set<string>(["grp-runners-sg"])

function getImageBrightness(imageUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const image = new window.Image()
        image.crossOrigin = "anonymous"
        image.src = imageUrl

        image.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = 1
            canvas.height = 1

            const context = canvas.getContext("2d")
            if (!context) {
                reject(new Error("Unable to create canvas context"))
                return
            }

            context.drawImage(image, 0, 0, 1, 1)
            const pixel = context.getImageData(0, 0, 1, 1).data
            const brightness = (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000
            resolve(brightness)
        }

        image.onerror = () => reject(new Error("Unable to load image"))
    })
}

export default function GroupDetailPage() {
    const { groupId } = useParams()
    const group = (groups as Group[]).find((item) => item.id === groupId)

    if (!group) {
        return <Navigate to="/community" replace />
    }

    const groupDiscussions = React.useMemo(() => {
        return (discussions as Discussion[]).filter((discussion) => discussion.groupName === group.name)
    }, [group.name])

    const headerBackground = React.useMemo(() => {
        if (group.profileImageUrl) return group.profileImageUrl
        const discussionWithImage = groupDiscussions.find((discussion) => discussion.imgSrc)
        return discussionWithImage?.imgSrc ?? null
    }, [group.profileImageUrl, groupDiscussions])

    const [joinStatus, setJoinStatus] = React.useState<JoinStatus>(
        JOINED_GROUP_IDS.has(group.id) ? "joined" : "not-joined",
    )
    const [isDarkBackground, setIsDarkBackground] = React.useState(false)

    // TODO: Implement join group functionality
    React.useEffect(() => {
        setJoinStatus(JOINED_GROUP_IDS.has(group.id) ? "joined" : "not-joined")
        console.log("Join group payload:", {
            groupId: group.id,
            action: "join",
        })
    }, [group.id])

    React.useEffect(() => {
        let cancelled = false

        if (!headerBackground) {
            setIsDarkBackground(false)
            return () => {
                cancelled = true
            }
        }

        getImageBrightness(headerBackground)
            .then((brightness) => {
                if (!cancelled) {
                    setIsDarkBackground(brightness < 135)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    // If we cannot inspect the image, use light text for safer contrast.
                    setIsDarkBackground(true)
                }
            })

        return () => {
            cancelled = true
        }
    }, [headerBackground])

    const titleColorClass = headerBackground
        ? isDarkBackground
            ? "text-white"
            : "text-slate-900"
        : "text-foreground"

    const subtitleColorClass = headerBackground
        ? isDarkBackground
            ? "text-white/90"
            : "text-slate-900/80"
        : "text-muted-foreground"

    const backIconClass = headerBackground
        ? isDarkBackground
            ? "text-white"
            : "text-slate-900"
        : "text-muted-foreground"

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mx-auto max-w-xl rounded-2xl border bg-card overflow-hidden">
                <header className="border-b">
                    <div className="relative">
                        {headerBackground ? (
                            <>
                                <Image
                                    src={headerBackground}
                                    alt={`${group.name} cover`}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div
                                    className={cn(
                                        "absolute inset-0",
                                        isDarkBackground ? "bg-primary-foreground/40" : "bg-accent-foreground/25",
                                    )}
                                />
                            </>
                        ) : (
                            <div className="absolute w-150 inset-0 bg-secondary/20" />
                        )}

                        <div className="relative flex min-h-50 flex-col justify-between p-4">
                            <div>
                                {/* TODO: back to community page but groups tab */}
                                <Link to="/community?tab=groups" className="text-muted-foreground transition-colors hover:text-foreground">
                                    <ArrowLeft className={cn("h-5 w-5", backIconClass)} />
                                </Link>
                            </div>

                            <div>
                                <h1 className={cn("text-2xl font-bold leading-tight", titleColorClass)}>{group.name}</h1>
                                <div className={cn("mt-2 inline-flex items-center gap-2 text-sm", subtitleColorClass)}>
                                    <UserRound className="h-4 w-4" />
                                    <span>{group.memberCount.toLocaleString()} members</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-4 py-4">
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                        {joinStatus === "joined" ? (
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" disabled className="w-1/2">
                                    Joined
                                </Button>
                                {/* TODO: implement create new post functionality */}
                                <Button type="button" className="w-1/2">
                                    <Plus className="h-4 w-4" />
                                    New Post
                                </Button>
                            </div>
                        ) : (
                            <Button type="button" onClick={() => setJoinStatus("joined")} className="w-full">
                                Join
                            </Button>
                        )}
                    </div>
                </header>

                <section className="bg-muted/20 px-4 py-4">
                    <h3 className="text-lg font-bold">
                        {groupDiscussions.length} Discussion{groupDiscussions.length === 1 ? "" : "s"}
                    </h3>

                    {groupDiscussions.length > 0 ? (
                        <div className="mt-4 space-y-3">
                            {groupDiscussions.map((discussion) => (
                                <DiscussionCard
                                    key={discussion.id}
                                    discussion={discussion}
                                    backTo={`/community/groups/${group.id}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                            No discussions yet. Be the first to start one.
                        </p>
                    )}
                </section>
            </div>
        </div>
    )
}
