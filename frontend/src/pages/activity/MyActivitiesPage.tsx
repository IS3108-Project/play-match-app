"use client"
import * as React from "react"
import { parse, isValid, startOfDay } from "date-fns"
import ActivityCard from "@/components/ActivityCard"
import { CustomTabs, CustomTabsList, CustomTabsTrigger } from "@/components/ui/custom-tabs"
import { Bell } from "lucide-react"

// TODO: Use actual activity info from the database
import activities from "@/data/activities.json"


type TabValue = "upcoming" | "past" | "all"

function parseActivityDate(dateStr: string) {
    // matches strings like "Saturday, Feb 8, 2026"
    const parsed = parse(dateStr, "EEEE, MMM d, yyyy", new Date())
    if (isValid(parsed)) return startOfDay(parsed)

    // fallback if format changes
    const fallback = new Date(dateStr)
    return isValid(fallback) ? startOfDay(fallback) : null
}

export default function MyActivitiesPage() {
    const [activeTab, setActiveTab] = React.useState<TabValue>("upcoming")
    const today = startOfDay(new Date())

    const filteredActivities = React.useMemo(() => {
        const sortedActivities = activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        if (activeTab === "all") return sortedActivities

        return activities.filter((activity) => {
            const activityDate = parseActivityDate(activity.date)
            if (!activityDate) return false

            if (activeTab === "upcoming") return activityDate > today
            return activityDate < today // past
        })
    }, [activeTab, today])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold">My Activities</h1>
            </div>

            {/* Notification */}
            <div className="mx-auto mb-6 w-full max-w-3xl rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-card-foreground">
                <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-sm">
                        <span className="font-mediun">
                            Reminder
                        </span>: Confirm your attendance 30 minutes before the meeting time.
                    </p>
                </div>
            </div>

            {/* Activity Tabs */}
            <CustomTabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TabValue)}
                className="mx-auto mb-8 w-full"
            >
                <CustomTabsList>
                    <CustomTabsTrigger value="upcoming">Upcoming</CustomTabsTrigger>
                    <CustomTabsTrigger value="past">Past</CustomTabsTrigger>
                    <CustomTabsTrigger value="all">All</CustomTabsTrigger>
                </CustomTabsList>
            </CustomTabs>

            {/* Activity Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {filteredActivities.map((activity) => (
                    <ActivityCard
                        key={`${activity.activityTitle}-${activity.date}`}
                        activity={{
                            ...activity,
                            status: activity.status as "joined" | "confirmed" | "cancelled" | "pending" | "ended" | "not-joined"
                        }}
                    />
                ))}
            </div>
        </div>
    )
}