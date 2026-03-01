"use client"
import * as React from "react"
import SearchDrawer from "@/components/SearchDrawer"
import ActivityCard from "@/components/activity/ActivityCard"
import FilterBar from "@/components/FilterBar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import logo from "@/assets/logo.svg"
import { activityApi, type Activity } from "@/lib/api"

export default function ExplorePage() {
  const [date, setDate] = React.useState<Date>()
  const [activityInput, setActivityInput] = React.useState("")
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([])
  const [selectedActivityTypes, setSelectedActivityTypes] = React.useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = React.useState<("Beginner" | "Intermediate" | "Advanced")[]>([])
  const [radiusKm, setRadiusKm] = React.useState<number | "any">("any")
  const [sortBy, setSortBy] = React.useState<"date" | "distance">("date")

  const [activities, setActivities] = React.useState<Activity[]>([])
  const [loading, setLoading] = React.useState(true)

  const activityTypes = React.useMemo(
    () => Array.from(new Set(activities.map((a) => a.activityType))),
    [activities]
  )

  const fetchActivities = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (selectedActivityTypes.length > 0) {
        params.activityType = selectedActivityTypes.join(",")
      }
      if (selectedSkills.length === 1) {
        params.skillLevel = selectedSkills[0]!
      }
      const data = await activityApi.list(params)
      setActivities(data)
    } catch {
      // silently fail — user sees empty state
    } finally {
      setLoading(false)
    }
  }, [selectedActivityTypes, selectedSkills])

  React.useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Client-side filtering for skills (multi-select) and sort
  const filteredActivities = React.useMemo(() => {
    let result = activities

    if (selectedSkills.length > 1) {
      result = result.filter((a) =>
        selectedSkills.includes(a.skillLevel as "Beginner" | "Intermediate" | "Advanced")
      )
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      return 0 // distance sorting not supported without geolocation
    })

    return result
  }, [activities, selectedSkills, sortBy])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4 flex justify-center md:hidden">
        <img src={logo} alt="PlayMatch" className="h-10 w-auto" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Find Your Activity</h1>
        <p className="mt-2 text-muted-foreground">
          Join local activities organized by the community. Or... Try out our new feature:
        </p>
        <Button type="button" className="bg-primary text-primary-foreground mt-4">
          Finding Buddies
        </Button>
      </div>

      {/* Search Drawer */}
      <SearchDrawer
        activityInput={activityInput}
        onActivityInputChange={setActivityInput}
        selectedRegions={selectedRegions}
        onSelectedRegionsChange={setSelectedRegions}
        date={date}
        onDateChange={setDate}
      />

      {/* Filter Bar */}
      <FilterBar
        radiusKm={radiusKm}
        onRadiusKmChange={setRadiusKm}
        selectedSkills={selectedSkills}
        onSelectedSkillsChange={setSelectedSkills}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        activityTypes={activityTypes}
        selectedActivityTypes={selectedActivityTypes}
        onSelectedActivityTypesChange={setSelectedActivityTypes}
      />

      {/* Activities Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No activities found. Be the first to host one!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onRefresh={fetchActivities}
            />
          ))}
        </div>
      )}
    </div>
  );
}
