"use client"
import * as React from "react"
import ActivityCard from "@/components/activity/ActivityCard"
import HostActivityDrawer, { type HostActivityValues } from "@/components/activity/HostActivityDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ActivityGridSkeleton } from "@/components/ui/skeletons"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchIcon, SlidersHorizontal, CalendarDays, UserRound, ChevronDown } from "lucide-react"
import logo from "@/assets/logo.svg"
import { activityApi, type Activity, type PaginationInfo } from "@/lib/api"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/useDebounce"

type TimeFilter = "upcoming" | "past"
type HostFilter = "me" | "others"

export default function MyActivitiesPage() {
    const [selectedTime, setSelectedTime] = React.useState<TimeFilter[]>(["upcoming", "past"])
    const [selectedHost, setSelectedHost] = React.useState<HostFilter[]>(["me", "others"])
    const [search, setSearch] = React.useState("")
    const debouncedSearch = useDebounce(search, 300)

    const [activities, setActivities] = React.useState<(Activity & { isHosted: boolean })[]>([])
    const [pagination, setPagination] = React.useState<PaginationInfo | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [page, setPage] = React.useState(1)

    const isAllSelected = selectedTime.length === 2 && selectedHost.length === 2
    const activeFilterCount = isAllSelected ? 0 : selectedTime.length + selectedHost.length

    const clearAllFilters = () => {
        setSelectedTime(["upcoming", "past"])
        setSelectedHost(["me", "others"])
    }

    const toggleTime = (value: TimeFilter, checked: boolean) => {
        setSelectedTime((prev) =>
            checked ? [...prev, value] : prev.filter((v) => v !== value)
        )
    }

    const toggleHost = (value: HostFilter, checked: boolean) => {
        setSelectedHost((prev) =>
            checked ? [...prev, value] : prev.filter((v) => v !== value)
        )
    }

    const fetchActivities = React.useCallback(async (pageNum = 1) => {
        setLoading(true)
        try {
            const result = await activityApi.mine({
                time: selectedTime.length > 0 ? selectedTime : undefined,
                host: selectedHost.length > 0 ? selectedHost : undefined,
                search: debouncedSearch || undefined,
                page: pageNum,
                limit: 12,
            })
            setActivities(result.data)
            setPagination(result.pagination)
            setPage(pageNum)
        } catch {
            setActivities([])
            setPagination(null)
        } finally {
            setLoading(false)
        }
    }, [selectedTime, selectedHost, debouncedSearch])

    // Reset to page 1 when filters change
    React.useEffect(() => {
        fetchActivities(1)
    }, [fetchActivities])

    const handleHostActivitySubmit = async (values: HostActivityValues) => {
        await activityApi.create({
            title: values.activityName,
            activityType: values.activityType,
            date: values.date,
            startTime: values.startTime,
            endTime: values.endTime,
            location: values.meetingLocation.location,
            latitude: values.meetingLocation.latitude,
            longitude: values.meetingLocation.longitude,
            skillLevel: values.skillLevel,
            maxParticipants: values.maxParticipants,
            description: values.description,
            requireApproval: values.requireApproval,
            ...(values.imageSrc ? { imageSrc: values.imageSrc } : {}),
        })
        toast.success("Activity created!")
        fetchActivities(1)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-4 flex justify-center md:hidden">
                <img src={logo} alt="PlayMatch" className="h-10 w-auto" />
            </div>
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold">My Activities</h1>
                <p className="mt-2 text-muted-foreground">
                    Track your upcoming sessions, review past games, and manage the activities you host.
                </p>
                <HostActivityDrawer
                    onSubmit={handleHostActivitySubmit}
                    className="mt-4"
                />
            </div>

            {/* Search Bar */}
            <div className="relative my-4">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search your activities..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Filter Bar */}
            <div className="mb-6 flex items-center gap-2 overflow-x-auto p-1">
                {/* Clear Filters */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="relative">
                            <Button
                                size="icon"
                                className="h-9 w-9 shrink-0 rounded-xl"
                                aria-label="Filters"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                                    {activeFilterCount}
                                </span>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onClick={clearAllFilters}
                            disabled={activeFilterCount === 0}
                            className="text-destructive focus:text-destructive"
                        >
                            Clear all filters
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Time Period Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
                            <CalendarDays className="mr-1 h-4 w-4" />
                            {selectedTime.length > 0 ? (
                                <span className="font-normal text-primary">
                                    {selectedTime.map((t) => t === "upcoming" ? "Upcoming" : "Past").join(", ")}
                                </span>
                            ) : (
                                "Time period"
                            )}
                            <ChevronDown className="ml-1 size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                            checked={selectedTime.includes("upcoming")}
                            onCheckedChange={(checked) => toggleTime("upcoming", Boolean(checked))}
                        >
                            Upcoming
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={selectedTime.includes("past")}
                            onCheckedChange={(checked) => toggleTime("past", Boolean(checked))}
                        >
                            Past
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Host Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 shrink-0 rounded-xl px-4">
                            <UserRound className="mr-1 h-4 w-4" />
                            {selectedHost.length > 0 ? (
                                <span className="font-normal text-primary">
                                    {selectedHost.map((h) => h === "me" ? "By Me" : "By Others").join(", ")}
                                </span>
                            ) : (
                                "Hosted by"
                            )}
                            <ChevronDown className="ml-1 size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                            checked={selectedHost.includes("me")}
                            onCheckedChange={(checked) => toggleHost("me", Boolean(checked))}
                        >
                            Hosted by Me
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={selectedHost.includes("others")}
                            onCheckedChange={(checked) => toggleHost("others", Boolean(checked))}
                        >
                            Hosted by Others
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Activity Cards */}
            {loading ? (
                <ActivityGridSkeleton />
            ) : activities.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">
                        {debouncedSearch ? "No activities match your search." : "No activities found."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {activities.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                isHosted={activity.isHosted}
                                onRefresh={() => fetchActivities(page)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchActivities(page - 1)}
                                disabled={!pagination.hasPrevPage}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchActivities(page + 1)}
                                disabled={!pagination.hasNextPage}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
