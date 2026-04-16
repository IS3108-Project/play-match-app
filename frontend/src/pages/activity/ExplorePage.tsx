"use client"
import * as React from "react"
import { useSearchParams } from "react-router"
import ActivityCard from "@/components/activity/ActivityCard"
import ActivityDetailsCard from "@/components/activity/ActivityDetailsCard"
import FilterBar, { type MaxDistance } from "@/components/FilterBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { SearchIcon } from "lucide-react"
import logo from "@/assets/logo.svg"
import { activityApi, type Activity, type PaginationInfo } from "@/lib/api"
import { useDebounce } from "@/hooks/useDebounce"
import { useUserLocation } from "@/hooks/useUserLocation"
import { Link } from "react-router"

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const deepLinkedActivityId = searchParams.get("activity")

  const { location, isEnabled: locationEnabled, hasPermission: hasLocationPermission } = useUserLocation()

  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 300)

  const [selectedActivityTypes, setSelectedActivityTypes] = React.useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = React.useState<("Beginner" | "Intermediate" | "Advanced")[]>([])
  const [sortBy, setSortBy] = React.useState<"date" | "distance">("date")
  const [maxDistance, setMaxDistance] = React.useState<MaxDistance>(null)

  const [activities, setActivities] = React.useState<Activity[]>([])
  const [allActivityTypes, setAllActivityTypes] = React.useState<string[]>([])
  const [pagination, setPagination] = React.useState<PaginationInfo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)

  // Fetch all activity types once on mount (for filter dropdown)
  React.useEffect(() => {
    activityApi.list({ limit: 100 }).then((res) => {
      const types = Array.from(new Set(res.data.map((a) => a.activityType)))
      setAllActivityTypes(types)
    }).catch(() => {})
  }, [])

  const fetchActivities = React.useCallback(async (pageNum = 1) => {
    setLoading(true)
    try {
      const result = await activityApi.list({
        search: debouncedSearch || undefined,
        activityType: selectedActivityTypes.length > 0 ? selectedActivityTypes.join(",") : undefined,
        skillLevel: selectedSkills.length > 0 ? selectedSkills.join(",") : undefined,
        sortBy: sortBy,
        page: pageNum,
        limit: 12,
        // Always pass location when available (for distance display on cards)
        ...(location ? {
          lat: location.latitude,
          lng: location.longitude,
        } : {}),
        ...(location && maxDistance ? { maxDistance } : {}),
      })
      setActivities(result.data)
      setPagination(result.pagination)
      setPage(pageNum)
    } catch {
      // silently fail — user sees empty state
      setActivities([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedActivityTypes, selectedSkills, sortBy, location, maxDistance])

  // Reset to page 1 when filters change
  React.useEffect(() => {
    fetchActivities(1)
  }, [fetchActivities])

  // Activities are already sorted server-side
  const sortedActivities = activities

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4 flex justify-center md:hidden">
        <img src={logo} alt="PlayMatch" className="h-10 w-auto" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Explore Activities</h1>
        <p className="mt-2 text-muted-foreground">
          Join local activities organized by the community. Or... Try out our new feature:
        </p>
        <Button asChild className="bg-primary text-primary-foreground mt-4">
          <Link to="/buddy">Finding Buddies</Link>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative my-4">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        selectedSkills={selectedSkills}
        onSelectedSkillsChange={setSelectedSkills}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        activityTypes={allActivityTypes}
        selectedActivityTypes={selectedActivityTypes}
        onSelectedActivityTypesChange={setSelectedActivityTypes}
        locationEnabled={locationEnabled && hasLocationPermission}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
      />

      {/* Activities Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : sortedActivities.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No activities found. Be the first to host one!</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sortedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
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

      {deepLinkedActivityId && (
        <ActivityDetailsCard
          key={deepLinkedActivityId}
          activityId={deepLinkedActivityId}
          defaultOpen
          onRefresh={fetchActivities}
        >
          <span className="hidden" />
        </ActivityDetailsCard>
      )}
    </div>
  );
}
