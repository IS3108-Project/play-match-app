"use client"

import * as React from "react"
import { SearchIcon, PlusIcon } from "lucide-react"

import { CustomTabs, CustomTabsList, CustomTabsTrigger } from "@/components/ui/custom-tabs"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import GroupCard from "@/components/GroupCard"
import FeaturedGroupCard from "@/components/FeaturedGroupCard"
import DiscussionCard from "@/components/DiscussionCard"
import logo from "@/assets/logo.svg"

// TODO: Use actual group and discussion info from the database
import groups from "@/data/groups.json"
import discussions from "@/data/discussions.json"

type TabValue = "groups" | "discussions"


type Discussion = (typeof discussions)[number]

export default function CommunityPage() {
    const [activeTab, setActiveTab] = React.useState<TabValue>("groups")
    const [searchTerm, setSearchTerm] = React.useState("")

    const filteredGroups = React.useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return groups

        return groups.filter((group) => {
            return (
                group.name.toLowerCase().includes(q) ||
                group.description.toLowerCase().includes(q)
            )
        })
    }, [searchTerm])

    const featuredGroups = React.useMemo(() => {
        return groups.filter((group) => group.isFeatured)
    }, [])

    const filteredDiscussions = React.useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return discussions

        return discussions.filter((discussion) => {
            return (
                discussion.title.toLowerCase().includes(q) ||
                discussion.content.toLowerCase().includes(q) ||
                discussion.groupName.toLowerCase().includes(q) ||
                discussion.authorName.toLowerCase().includes(q)
            )
        })
    }, [searchTerm])

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
                    <CustomTabsTrigger value="groups">Groups</CustomTabsTrigger>
                    <CustomTabsTrigger value="discussions">Discussions</CustomTabsTrigger>
                </CustomTabsList>
            </CustomTabs>

            {activeTab === "groups" ? (
                <div className="flex flex-col gap-4 w-full items-stretch">
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-left text-lg font-semibold">My Groups</h3>
                        {/* TODO: Implement create group button */}
                        <Button type="button" className="bg-primary text-primary-foreground">
                            <PlusIcon className="size-4" />
                            Create Group
                        </Button>
                    </div>
                    {filteredGroups.map((group) => (
                        <GroupCard key={group.id} group={group} />
                    ))}

                    <div className="flex items-center justify-between">
                        <h3 className="text-left text-lg font-semibold">Featured Groups</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:grid-cols-3">
                        {featuredGroups.map((group) => (
                            <FeaturedGroupCard key={group.id} group={group} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 w-full items-stretch">
                    <div className="flex items-center justify-between">
                        <h3 className="text-left text-lg font-semibold">Community Discussions</h3>
                        {/* TODO: Implement new post button */}
                        <Button type="button" className="bg-primary text-primary-foreground">
                            <PlusIcon className="size-4" />
                            New Post
                        </Button>
                    </div>
                    {filteredDiscussions.map((discussion) => (
                        // <DiscussionCardPlaceholder key={discussion.id} discussion={discussion} />
                        <DiscussionCard key={discussion.id} discussion={discussion} />
                    ))}
                </div>
            )}
        </div>
    )
}