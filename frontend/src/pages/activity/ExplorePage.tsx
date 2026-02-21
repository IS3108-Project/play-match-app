"use client"
import * as React from "react"
import SearchDrawer from "@/components/SearchDrawer"
import ActivityCard from "@/components/ActivityCard"

// TODO: Use actual activity info from the database
import activities from "@/data/activities.json"


export default function ExplorePage() {
  const [date, setDate] = React.useState<Date>()
  const [activityInput, setActivityInput] = React.useState("")
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Find Your Activity</h1>
        <p className="mt-2 text-muted-foreground">
          Join local activities organized by the community
        </p>
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

      {/* Activities Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {activities.map((activity) => (
          <ActivityCard
            key={`${activity.activityTitle}-${activity.date}`}
            activity={activity}
          />
        ))}
      </div>
    </div>
  );
}


