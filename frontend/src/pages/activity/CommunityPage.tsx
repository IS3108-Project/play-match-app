"use client"

import * as React from "react"
import { ChevronDown, SearchIcon, SlidersHorizontal } from "lucide-react"
import { useSearchParams } from "react-router"
import { toast } from "sonner"

import { CustomTabs, CustomTabsList, CustomTabsTrigger } from "@/components/ui/custom-tabs"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import CreatePostDrawer from "@/components/ui/CreatePostDrawer"
import type { CreatePostValues } from "@/components/ui/CreatePostDrawer"
import CreateGroupDrawer from "@/components/ui/CreateGroupDrawer"
import type { CreateGroupValues } from "@/components/ui/CreateGroupDrawer"
import GroupCard from "@/components/community/GroupCard"
import FeaturedGroupCard from "@/components/community/FeaturedGroupCard"
import DiscussionCard from "@/components/community/DiscussionCard"
import logo from "@/assets/logo.svg"

import { communityApi } from "@/lib/api"
import type { CommunityGroup, CommunityDiscussion } from "@/lib/api"

type TabValue = "groups" | "discussions"

export default function CommunityPage() {
    const [searchParams] = useSearchParams()
    const defaultTab = searchParams.get("tab") === "groups" ? "groups" : "discussions"
    const [activeTab, setActiveTab] = React.useState<TabValue>(defaultTab)
    const [searchTerm, setSearchTerm] = React.useState("")

    // Filter state (all client-side)
    const [myGroupsOnly, setMyGroupsOnly] = React.useState(false)
    const [filterGroupId, setFilterGroupId] = React.useState<string | null>(null)

    const [groups, setGroups] = React.useState<CommunityGroup[]>([])
    const [discussions, setDiscussions] = React.useState<CommunityDiscussion[]>([])
    const [loadingGroups, setLoadingGroups] = React.useState(true)
    const [loadingDiscussions, setLoadingDiscussions] = React.useState(true)

    React.useEffect(() => {
        const tab = searchParams.get("tab")
        if (tab === "groups" || tab === "discussions") {
            setActiveTab(tab)
        }
    }, [searchParams])

    const fetchGroups = React.useCallback(async () => {
        setLoadingGroups(true)
        try {
            const data = await communityApi.getGroups()
            setGroups(data)
        } catch {
            toast.error("Failed to load groups")
        } finally {
            setLoadingGroups(false)
        }
    }, [])

    const fetchDiscussions = React.useCallback(async () => {
        setLoadingDiscussions(true)
        try {
            const data = await communityApi.getDiscussions()
            setDiscussions(data)
        } catch {
            toast.error("Failed to load discussions")
        } finally {
            setLoadingDiscussions(false)
        }
    }, [])

    React.useEffect(() => { fetchGroups() }, [fetchGroups])
    React.useEffect(() => { fetchDiscussions() }, [fetchDiscussions])

    const handleCreatePost = async (values: CreatePostValues) => {
        await communityApi.createDiscussion({
            title: values.title,
            content: values.content,
            imageUrl: values.imageUrl || null,
            groupId: values.groupId || null,
            isPublic: values.isPublic,
            linkedActivityId: values.linkedActivityId || null,
        })
        toast.success("Discussion posted!")
        fetchDiscussions()
    }

    const handleCreateGroup = async (values: CreateGroupValues) => {
        await communityApi.createGroup({
            name: values.name,
            description: values.description,
            icon: values.icon,
            iconBgColor: values.iconBgColor,
            profileImageUrl: values.profileImageUrl,
        })
        toast.success("Group created!")
        fetchGroups()
    }

    const handleLikeDiscussion = async (id: string) => {
        try {
            const { liked, likeCount } = await communityApi.toggleDiscussionLike(id)
            setDiscussions((prev) =>
                prev.map((d) => (d.id === id ? { ...d, isLiked: liked, likeCount } : d))
            )
        } catch {
            toast.error("Failed to like discussion")
        }
    }

    const handleDeleteDiscussion = async (id: string) => {
        try {
            await communityApi.deleteDiscussion(id)
            toast.success("Discussion deleted")
            setDiscussions((prev) => prev.filter((d) => d.id !== id))
        } catch {
            toast.error("Failed to delete discussion")
        }
    }

    // Derived subsets for groups tab
    const myGroupIds = React.useMemo(() => new Set(groups.filter((g) => g.isJoined).map((g) => g.id)), [groups])
    const myGroups = groups.filter((g) => g.isJoined)
    const featuredGroups = groups.filter((g) => g.isFeatured)

    const filteredGroups = React.useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return groups
        return groups.filter(
            (g) =>
                g.name.toLowerCase().includes(q) ||
                g.description.toLowerCase().includes(q)
        )
    }, [groups, searchTerm])

    const filteredMyGroups = filteredGroups.filter((g) => g.isJoined)
    const filteredFeatured = filteredGroups.filter((g) => g.isFeatured)

    // Discover: apply all filters client-side
    const filteredDiscussions = React.useMemo(() => {
        let result = discussions

        if (myGroupsOnly) {
            result = result.filter((d) => d.groupId && myGroupIds.has(d.groupId))
        }

        if (filterGroupId) {
            result = result.filter((d) => d.groupId === filterGroupId)
        }

        const q = searchTerm.trim().toLowerCase()
        if (q) {
            result = result.filter(
                (d) =>
                    d.title.toLowerCase().includes(q) ||
                    d.content.toLowerCase().includes(q) ||
                    d.groupName?.toLowerCase().includes(q) ||
                    d.authorName.toLowerCase().includes(q)
            )
        }

        return result
    }, [discussions, myGroupsOnly, filterGroupId, myGroupIds, searchTerm])

    const filterGroupName = groups.find((g) => g.id === filterGroupId)?.name ?? null
    const hasActiveFilter = myGroupsOnly || !!filterGroupId

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center md:hidden">
                    <img src={logo} alt="PlayMatch" className="h-10 w-auto" />
                </div>
                <h1 className="text-3xl font-bold">Community</h1>
                <p className="mt-2 text-muted-foreground">
                    Join groups, chat, and engage with the PlayMatch community.
                </p>
            </div>

            {/* Search Bar */}
            <ButtonGroup className="my-4 w-full">
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                        activeTab === "groups"
                            ? "Search for groups..."
                            : "Search for discussions..."
                    }
                />
                <Button variant="outline" aria-label="Search">
                    <SearchIcon />
                </Button>
            </ButtonGroup>

            {/* Community Tabs */}
            <CustomTabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TabValue)}
                className="mx-auto mb-8 w-full"
            >
                <CustomTabsList>
                    <CustomTabsTrigger value="discussions">Discover</CustomTabsTrigger>
                    <CustomTabsTrigger value="groups">Groups</CustomTabsTrigger>
                </CustomTabsList>
            </CustomTabs>

            {activeTab === "groups" ? (
                <div className="flex flex-col gap-6 w-full items-stretch">
                    <p className="text-sm text-muted-foreground">
                        Join groups of players who share your sport and skill level. Connect with like-minded athletes and stay in the loop.
                    </p>

                    {/* My Groups */}
                    <div>
                        <div className="flex items-center justify-between w-full mb-3">
                            <h3 className="text-lg font-semibold">My Groups</h3>
                            <CreateGroupDrawer onSubmit={handleCreateGroup} />
                        </div>
                        {loadingGroups ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : filteredMyGroups.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {myGroups.length === 0
                                    ? "You haven't joined any groups yet. Browse below to find one!"
                                    : "No groups match your search."}
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredMyGroups.map((group) => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Group List */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Group List</h3>
                        {loadingGroups ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : filteredGroups.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No groups found.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredGroups.map((group) => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Featured Groups */}
                    {filteredFeatured.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Featured Groups</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {filteredFeatured.map((group) => (
                                    <FeaturedGroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-4 w-full items-stretch">
                    <p className="text-sm text-muted-foreground">
                        See trending discussions across the PlayMatch community. Browse posts from all groups or filter to your own.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        Posts live inside groups — tap any post to read replies and join the conversation.
                    </p>

                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold">Community Discussions</h3>
                        <CreatePostDrawer
                            groupOptions={groups.map((g) => ({ id: g.id, name: g.name }))}
                            onSubmit={handleCreatePost}
                        />
                    </div>

                    {/* Filter bar */}
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2.5">
                        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Filters:</span>

                        {/* Show toggle */}
                        <div className="flex items-center rounded-lg border bg-background p-0.5 text-sm">
                            <button
                                type="button"
                                onClick={() => setMyGroupsOnly(false)}
                                className={`rounded-md px-3 py-1 text-xs transition-colors ${!myGroupsOnly
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                All discussions
                            </button>
                            <button
                                type="button"
                                onClick={() => setMyGroupsOnly(true)}
                                className={`rounded-md px-3 py-1 text-xs transition-colors ${myGroupsOnly
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                My groups only
                            </button>
                        </div>

                        {/* Group filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={`ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-accent ${filterGroupId ? "border-primary text-primary font-medium" : "text-muted-foreground"}`}
                                >
                                    Group: {filterGroupName ?? "All"}
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setFilterGroupId(null)}>
                                    All groups
                                </DropdownMenuItem>
                                {groups.map((g) => (
                                    <DropdownMenuItem key={g.id} onClick={() => setFilterGroupId(g.id)}>
                                        {g.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Active filter chips */}
                    {hasActiveFilter && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Showing:</span>
                            {myGroupsOnly && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                                    My groups only
                                </span>
                            )}
                            {filterGroupId && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                                    {filterGroupName}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => { setMyGroupsOnly(false); setFilterGroupId(null) }}
                                className="ml-auto underline hover:text-foreground"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}

                    {loadingDiscussions ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : filteredDiscussions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {hasActiveFilter
                                ? "No discussions match your filters."
                                : "No discussions yet. Be the first to start one!"}
                        </p>
                    ) : (
                        filteredDiscussions.map((discussion) => (
                            <DiscussionCard
                                key={discussion.id}
                                discussion={discussion}
                                backTo="/community/discussions"
                                onLike={handleLikeDiscussion}
                                onDelete={handleDeleteDiscussion}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
