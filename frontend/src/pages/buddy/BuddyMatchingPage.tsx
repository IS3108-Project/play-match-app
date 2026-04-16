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
  Send,
  UserPlus,
  Calendar,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"
import { Link } from "react-router"
import logo from "@/assets/logo.svg"
import { format } from "date-fns"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import ActivityDetailsCard from "@/components/activity/ActivityDetailsCard"
import { Swiper, SwiperSlide } from "swiper/react"
import { EffectCards } from "swiper/modules"
import "swiper/css"
import "swiper/css/effect-cards"

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
        const [matchesData, activitiesRes] = await Promise.all([
          buddyApi.getPotentialMatches(),
          activityApi.mine({ host: ["me"], time: ["upcoming"], limit: 50 }),
        ])
        setMatches(matchesData)
        // Store all hosted activities (for pending invite check)
        setAllHostedActivities(activitiesRes.data)
        // Filter to only upcoming activities with slots available (for invite drawer)
        const now = new Date()
        setMyActivities(
          activitiesRes.data.filter(
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

  // Check if a buddy is already invited to any of my activities
  const isPendingInvite = React.useCallback((match: BuddyMatch) => {
    return allHostedActivities.some(a =>
      a.participantUserIds?.includes(match.id)
    )
  }, [allHostedActivities])

  const currentMatch = matches[currentIndex]

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
      const [matchesData, activitiesRes] = await Promise.all([
        buddyApi.getPotentialMatches(),
        activityApi.mine({ host: ["me"], time: ["upcoming"], limit: 50 }),
      ])
      setMatches(matchesData)
      // Store all hosted activities (for pending invite check)
      setAllHostedActivities(activitiesRes.data)
      // Filter to only upcoming activities with slots available (for invite drawer)
      const now = new Date()
      setMyActivities(
        activitiesRes.data.filter(
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
    <div className="container mx-auto px-4 py-4 max-w-lg flex flex-col" style={{ height: "calc(100dvh - 5rem)" }}>
      {/* Header */}
      <div className="mb-3 text-center shrink-0">
        <div className="mb-2 flex justify-center md:hidden">
          <img src={logo} alt="PlayMatch" className="h-8 w-auto" />
        </div>
        <h1 className="text-2xl font-bold">Find Your Buddy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentIndex + 1} of {matches.length} matches
        </p>
      </div>

      {/* Swiper Card Stack */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <Swiper
          effect="cards"
          grabCursor
          modules={[EffectCards]}
          onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
          className="w-full h-full max-h-full"
        >
          {matches.map((match) => {
            const pending = isPendingInvite(match)
            return (
              <SwiperSlide key={match.id} className="rounded-3xl overflow-hidden">
                <div className="relative w-full h-full">
                  {/* Full-bleed image */}
                  {match.image ? (
                    <img
                      src={match.image || undefined}
                      alt={match.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <Avatar className="h-32 w-32">
                        <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                          {match.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {/* Gradient scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Compatibility Score Badge */}
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    {match.compatibilityScore}% Match
                  </div>

                  {/* Overlaid content at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h2 className="text-2xl font-bold">{match.name}</h2>
                    {match.skillLevel && (
                      <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                        <Signal className="h-4 w-4" />
                        {match.skillLevel.charAt(0).toUpperCase() + match.skillLevel.slice(1)}
                      </div>
                    )}

                    {match.bio && (
                      <p className="text-white/80 text-sm mt-2 line-clamp-2">{match.bio}</p>
                    )}

                    {/* Common badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {match.commonSports.map((sport) => (
                        <span key={sport} className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
                          <Dumbbell className="inline h-3 w-3 mr-1" />{sport}
                        </span>
                      ))}
                      {match.commonTimes.map((time) => (
                        <span key={time} className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
                          <Clock className="inline h-3 w-3 mr-1" />{time}
                        </span>
                      ))}
                      {match.commonAreas.map((area) => (
                        <span key={area} className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
                          <MapPin className="inline h-3 w-3 mr-1" />{area}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-4">
                      {pending && (
                        <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/20 backdrop-blur-sm rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                          <span className="text-sm font-medium">Invitation sent to {match.name.split(' ')[0]}</span>
                        </div>
                      )}

                      {!pending && myActivities.length > 0 && (
                        <Button className="w-full gap-2" onClick={() => setShowInviteSheet(true)}>
                          <Send className="h-4 w-4" />
                          Invite to My Activity
                        </Button>
                      )}

                      {match.upcomingActivities.length > 0 && (
                        <Button variant="secondary" className="w-full gap-2" onClick={() => setShowJoinSheet(true)}>
                          <UserPlus className="h-4 w-4" />
                          Join Their Activity ({match.upcomingActivities.length})
                        </Button>
                      )}

                      {!pending && myActivities.length === 0 && match.upcomingActivities.length === 0 && (
                        <HostActivityDrawer
                          onSubmit={handleHostActivitySubmit}
                          triggerLabel={`Host & Invite ${match.name.split(' ')[0]}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
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
