"use client";
import * as React from "react";
import SearchDrawer from "@/components/SearchDrawer";
import ActivityCard from "@/components/activity/ActivityCard";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import { isParticipantStatus, type Activity } from "@/types/activity";

// TODO: Use actual activity info from the database
import activities from "@/data/activities.json";

export default function ExplorePage() {
  const [date, setDate] = React.useState<Date>();
  const [activityInput, setActivityInput] = React.useState("");
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = React.useState<
    string[]
  >([]);
  const [selectedSkills, setSelectedSkills] = React.useState<
    ("Beginner" | "Intermediate" | "Advanced")[]
  >([]);
  const [radiusKm, setRadiusKm] = React.useState<number | "any">("any");
  const [sortBy, setSortBy] = React.useState<"date" | "distance">("date");

  const parsedActivities = React.useMemo<Activity[]>(() => {
    return activities.map((activity) => ({
      ...activity,
      status: isParticipantStatus(activity.status)
        ? activity.status
        : "not-joined",
      participantStatuses: Array.isArray(activity.participantStatuses)
        ? activity.participantStatuses.filter(isParticipantStatus)
        : undefined,
    }));
  }, []);

  const activityTypes = React.useMemo(
    () =>
      Array.from(
        new Set(parsedActivities.map((activity) => activity.activityType)),
      ),
    [],
  );

  // TODO: extract the filtering logic to backend,
  // then fetch filtered activities from the database
  // this is a temporary solution for FE display
  const filteredActivities = React.useMemo(() => {
    const result: Activity[] = [];

    for (const activity of parsedActivities) {
      if (activity.status !== "not-joined") continue;

      const matchesActivity =
        selectedActivityTypes.length === 0 ||
        selectedActivityTypes.includes(activity.activityType);

      const matchesSkill =
        selectedSkills.length === 0 ||
        selectedSkills.includes(
          activity.skill as "Beginner" | "Intermediate" | "Advanced",
        );

      const distanceKm = activity.distanceKm ?? Number.POSITIVE_INFINITY;
      const matchesRadius = radiusKm === "any" || distanceKm <= radiusKm;

      if (matchesActivity && matchesSkill && matchesRadius) {
        result.push(activity);
      }
    }

    result.sort((a, b) => {
      if (sortBy === "distance") {
        return (
          (a.distanceKm ?? Number.POSITIVE_INFINITY) -
          (b.distanceKm ?? Number.POSITIVE_INFINITY)
        );
      }
      // date sort
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return result;
  }, [
    parsedActivities,
    selectedActivityTypes,
    selectedSkills,
    radiusKm,
    sortBy,
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4 flex justify-center md:hidden">
        <img src={logo} alt="PlayMatch" className="h-10 w-auto" />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Find Your Activity</h1>
        <p className="mt-2 text-muted-foreground">
          Join local activities organized by the community. Or... Try out our
          new feature:
        </p>
        {/* TODO: implement finding buddies functionality (FE + BE) */}
        <Button
          type="button"
          className="bg-primary text-primary-foreground mt-4"
        >
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filteredActivities.map((activity) => (
          <ActivityCard
            key={`${activity.activityTitle}-${activity.date}`}
            activity={{
              ...activity,
              status: activity.status as
                | "joined"
                | "confirmed"
                | "cancelled"
                | "pending"
                | "ended"
                | "not-joined",
            }}
          />
        ))}
      </div>
    </div>
  );
}
