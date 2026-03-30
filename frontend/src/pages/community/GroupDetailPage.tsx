import * as React from "react"
import { ArrowLeft, Crown, Trash2, UserRound } from "lucide-react"
import DeleteConfirmDrawer from "@/components/ui/DeleteConfirmDrawer"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import DiscussionCard from "@/components/community/DiscussionCard"
import { Image } from "@/components/ui/image"
import CreatePostDrawer from "@/components/ui/CreatePostDrawer"
import type { CreatePostValues } from "@/components/ui/CreatePostDrawer"
import CreateGroupDrawer from "@/components/ui/CreateGroupDrawer"
import type { CreateGroupValues } from "@/components/ui/CreateGroupDrawer"
import { communityApi } from "@/lib/api"
import type { CommunityGroup, CommunityDiscussion } from "@/lib/api"

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
            const brightness = (pixel[0]! * 299 + pixel[1]! * 587 + pixel[2]! * 114) / 1000
            resolve(brightness)
        }

        image.onerror = () => reject(new Error("Unable to load image"))
    })
}

export default function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>()
    const navigate = useNavigate()
    const [group, setGroup] = React.useState<(CommunityGroup & { discussions?: CommunityDiscussion[] }) | null | undefined>(undefined)
    const [isJoining, setIsJoining] = React.useState(false)
    const [isDarkBackground, setIsDarkBackground] = React.useState(false)
    const [deleteGroupConfirm, setDeleteGroupConfirm] = React.useState(false)

    const fetchGroup = React.useCallback(async () => {
        if (!groupId) return
        try {
            const data = await communityApi.getGroup(groupId)
            setGroup(data)
        } catch {
            setGroup(null)
        }
    }, [groupId])

    React.useEffect(() => { fetchGroup() }, [fetchGroup])

    const headerBackground = React.useMemo(() => {
        if (!group) return null
        if (group.profileImageUrl) return group.profileImageUrl
        const withImage = group.discussions?.find((d) => d.imageUrl)
        return withImage?.imageUrl ?? null
    }, [group])

    React.useEffect(() => {
        let cancelled = false
        if (!headerBackground) {
            setIsDarkBackground(false)
            return () => { cancelled = true }
        }
        getImageBrightness(headerBackground)
            .then((brightness) => { if (!cancelled) setIsDarkBackground(brightness < 135) })
            .catch(() => { if (!cancelled) setIsDarkBackground(true) })
        return () => { cancelled = true }
    }, [headerBackground])

    const handleJoin = async () => {
        if (!groupId || !group) return
        setIsJoining(true)
        try {
            await communityApi.joinGroup(groupId)
            toast.success(`Joined ${group.name}!`)
            fetchGroup()
        } catch {
            toast.error("Failed to join group")
        } finally {
            setIsJoining(false)
        }
    }

    const handleLeave = async () => {
        if (!groupId || !group) return
        setIsJoining(true)
        try {
            await communityApi.leaveGroup(groupId)
            toast.success(`Left ${group.name}`)
            fetchGroup()
        } catch {
            toast.error("Failed to leave group")
        } finally {
            setIsJoining(false)
        }
    }

    const handleCreatePost = async (values: CreatePostValues) => {
        await communityApi.createDiscussion({
            title: values.title,
            content: values.content,
            imageUrl: values.imageUrl || null,
            groupId: groupId ?? null,
            isPublic: values.isPublic,
            linkedActivityId: values.linkedActivityId || null,
        })
        toast.success("Discussion posted!")
        fetchGroup()
    }

    const handleUpdateGroup = async (values: CreateGroupValues) => {
        if (!groupId) return
        await communityApi.updateGroup(groupId, values)
        toast.success("Group updated!")
        fetchGroup()
    }

    const handleDeleteGroup = async () => {
        if (!groupId) return
        try {
            await communityApi.deleteGroup(groupId)
            toast.success("Group deleted")
            navigate("/community?tab=groups")
        } catch {
            toast.error("Failed to delete group")
        }
    }

    const handleDeleteDiscussion = async (id: string) => {
        try {
            await communityApi.deleteDiscussion(id)
            toast.success("Discussion deleted")
            setGroup((prev) => {
                if (!prev) return prev
                return { ...prev, discussions: prev.discussions?.filter((d) => d.id !== id) }
            })
        } catch {
            toast.error("Failed to delete discussion")
        }
    }

    const handleLikeDiscussion = async (id: string) => {
        try {
            const { liked, likeCount } = await communityApi.toggleDiscussionLike(id)
            setGroup((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    discussions: prev.discussions?.map((d) =>
                        d.id === id ? { ...d, isLiked: liked, likeCount } : d
                    ),
                }
            })
        } catch {
            toast.error("Failed to like discussion")
        }
    }

    if (group === undefined) {
        return (
            <div className="container mx-auto px-4 py-6">
                <p className="text-center text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (group === null) {
        return <Navigate to="/community?tab=groups" replace />
    }

    const titleColorClass = headerBackground
        ? isDarkBackground ? "text-white" : "text-slate-900"
        : "text-foreground"

    const subtitleColorClass = headerBackground
        ? isDarkBackground ? "text-white/90" : "text-slate-900/80"
        : "text-muted-foreground"

    const backIconClass = headerBackground
        ? isDarkBackground ? "text-white" : "text-slate-900"
        : "text-muted-foreground"

    const groupDiscussions = group.discussions ?? []

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
                                <div className="absolute inset-0" />
                            </>
                        ) : (
                            <div className="absolute w-150 inset-0 bg-secondary/20" />
                        )}

                        <div className="relative flex min-h-50 flex-col justify-between p-4">
                            <div>
                                <Link to="/community?tab=groups" className="text-muted-foreground transition-colors hover:text-foreground">
                                    <ArrowLeft className={cn("h-5 w-5", backIconClass)} />
                                </Link>
                            </div>

                            <div>
                                <h1 className={cn("text-2xl font-bold leading-tight", titleColorClass)}>{group.name}</h1>
                                <div className={cn("mt-2 inline-flex items-center gap-2 text-sm", subtitleColorClass)}>
                                    <UserRound className="h-4 w-4" />
                                    <span>{group.memberCount.toLocaleString()} members</span>
                                    {group.isOwner && (
                                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                            <Crown className="h-3.5 w-3.5" />
                                            Owner
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-4 py-4">
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                        {group.isOwner ? (
                            <>
                                <CreateGroupDrawer
                                    mode="edit"
                                    initialValues={{
                                        name: group.name,
                                        description: group.description,
                                        icon: group.icon,
                                        iconBgColor: group.iconBgColor,
                                        profileImageUrl: group.profileImageUrl ?? null,
                                    }}
                                    onSubmit={handleUpdateGroup}
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setDeleteGroupConfirm(true)}
                                    className="w-full cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Group
                                </Button>
                                <DeleteConfirmDrawer
                                    open={deleteGroupConfirm}
                                    onOpenChange={setDeleteGroupConfirm}
                                    name={group.name}
                                    itemType="group"
                                    onConfirm={handleDeleteGroup}
                                />
                            </>
                        ) : group.isJoined ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleLeave}
                                disabled={isJoining}
                                className="w-full"
                            >
                                {isJoining ? "Leaving..." : "Leave Group"}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="w-full"
                            >
                                {isJoining ? "Joining..." : "Join"}
                            </Button>
                        )}
                    </div>
                </header>

                <section className="bg-muted/20 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">
                            {groupDiscussions.length} Discussion{groupDiscussions.length === 1 ? "" : "s"}
                        </h3>
                        {(group.isJoined || group.isOwner) && (
                            <CreatePostDrawer
                                groupOptions={[{ id: group.id, name: group.name }]}
                                defaultGroupId={group.id}
                                onSubmit={handleCreatePost}
                                triggerLabel="New Post"
                            />
                        )}
                    </div>

                    {groupDiscussions.length > 0 ? (
                        <div className="mt-4 space-y-3">
                            {groupDiscussions.map((discussion) => (
                                <DiscussionCard
                                    key={discussion.id}
                                    discussion={discussion}
                                    backTo={`/community/groups/${group.id}`}
                                    onLike={handleLikeDiscussion}
                                    onDelete={handleDeleteDiscussion}
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
