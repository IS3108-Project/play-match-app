"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buddyApi, activityApi, type BuddyMatch, type Activity } from "@/lib/api"
import { toast } from "sonner"
import HostActivityDrawer, { type HostActivityValues } from "@/components/activity/HostActivityDrawer"
import { 
  MapPin, 
  Clock, 
  Dumbbell, 
  Signal,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  Send,
  UserPlus,
  Calendar,
  CheckCircle2
} from "lucide-react"
import { Link } from "react-router"
import { format } from "date-fns"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import ActivityDetailsCard from "@/components/activity/ActivityDetailsCard"

// Helper to get full image URL for backend uploads
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return null
  if (imagePath.startsWith("/uploads/")) {
    return `http://localhost:3000${imagePath}`
  }
  return imagePath
}

export default function BuddyMatchingPage() {
  const [matches, setMatches] = React.useState<BuddyMatch[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [myActivities, setMyActivities] = React.useState<Activity[]>([])
  const [allHostedActivities, setAllHostedActivities] = React.useState<Activity[]>([])
  const [showInviteSheet, setShowInviteSheet] = React.useState(false)
  const [showJoinSheet, setShowJoinSheet] = React.useState(false)

  // Fetch potential matches and user's hosted activities
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [matchesData, activitiesData] = await Promise.all([
          buddyApi.getPotentialMatches(),
          activityApi.mine("hosted"),
        ])
        setMatches(matchesData)
        // Store all hosted activities (for pending invite check)
        setAllHostedActivities(activitiesData)
        // Filter to only upcoming activities with slots available (for invite drawer)
        const now = new Date()
        setMyActivities(
          activitiesData.filter(
            (a) => new Date(a.date) >= now && a.slotsLeft > 0 && a.status === "ACTIVE"
          )
        )
      } catch (error) {
        toast.error("Failed to load matches")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const currentMatch = matches[currentIndex]

  // Check if current buddy is already invited to any of my activities
  const hasPendingInvite = React.useMemo(() => {
    if (!currentMatch) return false
    return allHostedActivities.some(a => 
      a.participantUserIds?.includes(currentMatch.id)
    )
  }, [currentMatch, allHostedActivities])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleInviteToActivity = async (activityId: string) => {
    if (!currentMatch) return
    
    try {
      await activityApi.invite(activityId, currentMatch.id)
      toast.success(`Invitation sent to ${currentMatch.name}`)
      setShowInviteSheet(false)
      await handleActivityRefresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation")
    }
  }

  // Refresh matches after joining an activity
  const handleActivityRefresh = async () => {
    try {
      const [matchesData, activitiesData] = await Promise.all([
        buddyApi.getPotentialMatches(),
        activityApi.mine("hosting"),
      ])
      setMatches(matchesData)
      // Store all hosted activities (for pending invite check)
      setAllHostedActivities(activitiesData)
      // Filter to only upcoming activities with slots available (for invite drawer)
      const now = new Date()
      setMyActivities(
        activitiesData.filter(
          (a) => new Date(a.date) >= now && a.slotsLeft > 0 && a.status === "ACTIVE"
        )
      )
    } catch (error) {
      // Silently fail
    }
  }

  const handleHostActivitySubmit = async (values: HostActivityValues) => {
    if (!currentMatch) return
    
    // Create the activity
    const activity = await activityApi.create({
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
    
    // Auto-invite the buddy
    try {
      await activityApi.invite(activity.id, currentMatch.id)
      toast.success(`Activity created! Invitation sent to ${currentMatch.name}`)
    } catch (error) {
      // Activity created but invite failed
      toast.success("Activity created!")
      toast.error(`Failed to invite ${currentMatch.name}`)
    }
    
    await handleActivityRefresh()
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  // No matches
  if (matches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Matches Found</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            We couldn't find any buddies matching your preferences. Try updating your profile to find more.
          </p>
          <Button variant="outline" asChild>
            <Link to="/profile">Update Preferences</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Find Potential Buddies</h1>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {matches.length} matches
          </p>
        </div>
      </div>

      {/* Match Card */}
      <div className="relative">
        <div className="bg-card rounded-3xl shadow-lg overflow-hidden border min-h-[600px]">
          {/* Profile Image */}
          <div className="relative h-72 bg-muted">
            {currentMatch.image ? (
              <img
                src={getImageUrl(currentMatch.image) || undefined}
                alt={currentMatch.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {currentMatch.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            {/* Compatibility Score Badge */}
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              {currentMatch.compatibilityScore}% Match
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{currentMatch.name}</h2>
                {currentMatch.skillLevel && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <Signal className="h-4 w-4" />
                    {currentMatch.skillLevel.charAt(0).toUpperCase() + currentMatch.skillLevel.slice(1)}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {currentMatch.bio && (
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {currentMatch.bio}
              </p>
            )}

            {/* Common Interests */}
            {currentMatch.commonSports.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  Sports in Common
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentMatch.commonSports.map((sport) => (
                    <span
                      key={sport}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Common Times */}
            {currentMatch.commonTimes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Available Same Time
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentMatch.commonTimes.map((time) => (
                    <span
                      key={time}
                      className="bg-muted px-3 py-1 rounded-full text-sm"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Common Areas */}
            {currentMatch.commonAreas.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Same Preferred Areas
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentMatch.commonAreas.map((area) => (
                    <span
                      key={area}
                      className="bg-muted px-3 py-1 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t">
              {/* Show invitation pending state */}
              {hasPendingInvite && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Invitation sent to {currentMatch.name.split(' ')[0]}</span>
                </div>
              )}

              {/* Invite to Activity - only show if user has activities and no pending invite */}
              {!hasPendingInvite && myActivities.length > 0 && (
                <Button
                  className="w-full gap-2"
                  onClick={() => setShowInviteSheet(true)}
                >
                  <Send className="h-4 w-4" />
                  Invite to My Activity
                </Button>
              )}
              
              {/* Request to Join - only show if match has activities */}
              {currentMatch.upcomingActivities.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowJoinSheet(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Join Their Activity ({currentMatch.upcomingActivities.length})
                </Button>
              )}

              {/* Show message if no actions available and no pending invite */}
              {!hasPendingInvite && myActivities.length === 0 && currentMatch.upcomingActivities.length === 0 && (
                <div className="text-center py-2 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No activities available to invite {currentMatch.name}!
                  </p>
                  <HostActivityDrawer 
                    onSubmit={handleHostActivitySubmit} 
                    triggerLabel={`Host & Invite ${currentMatch.name.split(' ')[0]}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {matches.length}
          </span>
          
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handleNext}
            disabled={currentIndex === matches.length - 1}
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Invite to Activity Drawer */}
      <Drawer direction="bottom" open={showInviteSheet} onOpenChange={setShowInviteSheet}>
        <DrawerContent className="h-[70vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-center">Invite {currentMatch?.name} to Activity</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
            {myActivities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => handleInviteToActivity(activity.id)}
                className="w-full text-left p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(activity.date), "EEE, MMM d")} · {activity.startTime}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.location}
                    </p>
                    <p className="text-xs text-primary mt-1">
                      {activity.slotsLeft} slots left
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Join Their Activity Drawer */}
      <Drawer direction="bottom" open={showJoinSheet} onOpenChange={setShowJoinSheet}>
        <DrawerContent className="h-[70vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-center">{currentMatch?.name}'s Activities</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
            {currentMatch?.upcomingActivities.map((activity) => (
              <ActivityDetailsCard 
                key={activity.id} 
                activityId={activity.id}
                onRefresh={handleActivityRefresh}
              >
                <button
                  className="w-full text-left p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(activity.date), "EEE, MMM d")} · {activity.startTime}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {activity.activityType}
                        </span>
                        <span className="text-xs text-primary">
                          {activity.slotsLeft} slots left
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </button>
              </ActivityDetailsCard>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
