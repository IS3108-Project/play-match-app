"use client"
import * as React from "react"
import ActivityCard from "@/components/activity/ActivityCard"
import HostActivityDrawer, { type HostActivityValues } from "@/components/activity/HostActivityDrawer"
import { CustomTabs, CustomTabsList, CustomTabsTrigger } from "@/components/ui/custom-tabs"
import { Bell } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import logo from "@/assets/logo.svg"
import { activityApi, type Activity } from "@/lib/api"
import { toast } from "sonner"

type TabValue = "upcoming" | "past" | "hosted"

export default function MyActivitiesPage() {
    const [activeTab, setActiveTab] = React.useState<TabValue>("upcoming")
    const [activities, setActivities] = React.useState<Activity[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchActivities = React.useCallback(async (tab: string) => {
        setLoading(true)
        try {
            const data = await activityApi.mine(tab)
            setActivities(data)
        } catch {
            // silently fail
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchActivities(activeTab)
    }, [activeTab, fetchActivities])

    const handleHostActivitySubmit = async (values: HostActivityValues) => {
        await activityApi.create({
            title: values.activityName,
            activityType: values.activityType,
            date: values.date,
            startTime: values.startTime,
            endTime: values.endTime,
            location: values.meetingLocation,
            skillLevel: values.skillLevel,
            maxParticipants: values.maxParticipants,
            description: values.description,
            requireApproval: values.requireApproval,
            ...(values.imageSrc ? { imageSrc: values.imageSrc } : {}),
        })
        toast.success("Activity created!")
        fetchActivities("hosted")
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center md:hidden">
                    <img src={logo} alt="PlayMatch" className="h-10 w-auto" />
                </div>
                <h1 className="text-3xl font-bold">My Activities</h1>
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
                    <CustomTabsTrigger value="hosted">Hosting</CustomTabsTrigger>
                </CustomTabsList>
            </CustomTabs>

            {/* Host Activity Button */}
            {activeTab === "hosted" && (
                <div className="flex items-center justify-between w-ful pb-4">
                    <h3 className="text-left text-lg font-semibold">Hosting</h3>
                    <HostActivityDrawer
                        onSubmit={handleHostActivitySubmit}
                    />
                </div>
            )}

            {/* Activity Cards */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner className="size-8 text-primary" />
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">
                        {activeTab === "hosted"
                            ? "You aren't hosting any activities yet."
                            : activeTab === "upcoming"
                                ? "No upcoming activities. Go explore!"
                                : "No past activities yet."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {activities.map((activity) => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            isHosted={activeTab === "hosted"}
                            onRefresh={() => fetchActivities(activeTab)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
