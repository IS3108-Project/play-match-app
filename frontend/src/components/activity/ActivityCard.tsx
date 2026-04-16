import { Button } from "@/components/ui/button";
import ActivityActionsMenu from "@/components/activity/ActivityActionMenu";
import ActivityDetailsCard from "@/components/activity/ActivityDetailsCard";
import HostActivityDrawer, {
  type HostActivityValues,
} from "@/components/activity/HostActivityDrawer";
import PendingRequestsDrawer from "@/components/activity/PendingRequestsDrawer";
import AttendanceDrawer from "@/components/activity/AttendanceDrawer";
import CancelActivityDrawer from "@/components/activity/CancelActivityDrawer";
import ReportDrawer from "@/components/ReportDrawer";
import { type Activity, activityApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import * as React from "react";

type ActivityCardProps = {
  activity: Activity;
  isHosted?: boolean;
  onRefresh?: () => void;
};

export default function ActivityCard({
  activity,
  isHosted,
  onRefresh,
}: ActivityCardProps) {
  const { session } = useRole();
  const isHost = activity.hostId === session?.user?.id;

  const slotsLeft = activity.slotsLeft;
  const confirmed = activity._count.confirmed;
  const displayDate = format(new Date(activity.date), "EEEE, MMM d, yyyy");
  const displayTime = `${activity.startTime} - ${activity.endTime}`;

  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const handleCancelRsvp = async () => {
    try {
      const result = await activityApi.leave(activity.id);
      if (result.isLateCancellation) {
        toast.warning("Late cancellation recorded. This counts as a no-show.");
      } else {
        toast.success("Left activity");
      }
      setConfirmingCancel(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/explore?activity=${activity.id}`,
      );
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleEditSubmit = async (values: HostActivityValues) => {
    await activityApi.update(activity.id, {
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
      // Send null explicitly when image is removed, or the new image URL
      imageSrc: values.imageSrc ?? null,
    });
    toast.success("Activity updated!");
    onRefresh?.();
  };

  const editInitialValues: HostActivityValues = {
    activityName: activity.title,
    activityType: activity.activityType,
    date: activity.date.split("T")[0]!,
    startTime: activity.startTime,
    endTime: activity.endTime,
    meetingLocation: {
      location: activity.location,
      latitude: activity.latitude ?? null,
      longitude: activity.longitude ?? null,
    },
    skillLevel: activity.skillLevel,
    maxParticipants: activity.maxParticipants,
    description: activity.description,
    requireApproval: activity.requireApproval,
    imageSrc: activity.imageSrc ?? undefined,
  };

  const isJoined = activity.myStatus === "CONFIRMED";
  const isPending = activity.myStatus === "PENDING";
  const isInvited = isPending && activity.mySource === "INVITED";
  const isWaitlisted = activity.myStatus === "WAITLISTED";
  const isNotJoined = !activity.myStatus;

  // Resolve image src
  const imgSrc = activity.imageSrc || "/assets/default-activity-image/default.png";

  return (
    <div className="relative flex h-full flex-row overflow-hidden rounded-lg border bg-card shadow-sm lg:flex-col">
      {/* Actions Menu */}
      {(isJoined || isPending || isWaitlisted) && (
        <div className="absolute right-3 top-3 z-10">
          <ActivityActionsMenu
            onShareLink={handleShare}
            onReport={isHost ? undefined : () => setReportOpen(true)}
            onCancelRsvp={isHost ? undefined : () => setConfirmingCancel(true)}
            cancelLabel={
              isPending
                ? "Cancel Request"
                : isWaitlisted
                  ? "Leave Waitlist"
                  : "Cancel RSVP"
            }
          />
        </div>
      )}

      {/* Picture */}
      <div className="basis-[45%] shrink-0 grow-0 bg-muted lg:basis-auto lg:w-full">
        <img
          src={imgSrc}
          alt={activity.title}
          className="h-full w-full object-cover lg:h-40"
        />
      </div>

      {/* Description */}
      <div className="flex basis-[55%] min-w-0 flex-col p-4 lg:basis-auto">
        <div className="flex flex-wrap gap-2">
          <span className="inline-block w-fit rounded bg-chart-1 px-2 py-1 text-xs text-primary">
            {activity.activityType.toUpperCase()}
          </span>
          {activity.distance != null && (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {activity.distance} km
            </span>
          )}
        </div>
        <h3 className="mt-2 truncate font-semibold">{activity.title}</h3>
        <p className="text-sm text-muted-foreground">{activity.location}</p>
        <p className="text-sm text-muted-foreground">{displayDate}</p>
        <p className="text-sm text-muted-foreground">{displayTime}</p>
        <p className="mt-2 text-sm">
          {confirmed} joined ·{" "}
          <span className="text-primary">
            {slotsLeft > 0 ? `${slotsLeft} spots left` : "Full"}
          </span>
        </p>

        <div className="mt-auto">
        {isHosted ? (
          <>
            <ActivityDetailsCard activityId={activity.id} onRefresh={onRefresh}>
              <Button className="mt-3 w-full" size="sm" variant="outline">
                View Details
              </Button>
            </ActivityDetailsCard>
            <div className="mt-2 space-y-2">
              {/* Row 1: Attendance (only after activity date) + Pending */}
              <div className="flex gap-2">
                {new Date() > new Date(activity.date) && (
                  <AttendanceDrawer
                    activityId={activity.id}
                    onRefresh={onRefresh}
                    className={activity.requireApproval ? "flex-1" : "w-full"}
                  />
                )}
                {activity.requireApproval && (
                  <PendingRequestsDrawer
                    activityId={activity.id}
                    pendingCount={activity.pendingCount ?? 0}
                    onRefresh={onRefresh}
                    className="flex-1"
                  />
                )}
              </div>
              {/* Row 2: Edit + Cancel */}
              <div className="flex gap-2">
                <HostActivityDrawer
                  onSubmit={handleEditSubmit}
                  initialValues={editInitialValues}
                  mode="edit"
                  className="flex-1"
                />
                <CancelActivityDrawer
                  activityId={activity.id}
                  onRefresh={onRefresh}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive/80"
                  >
                    Cancel
                  </Button>
                </CancelActivityDrawer>
              </div>
            </div>
          </>
        ) : (
          <>
            {isJoined && (
              <ActivityDetailsCard
                activityId={activity.id}
                onRefresh={onRefresh}
              >
                <Button className="mt-3 w-full" size="sm" variant="outline">
                  View More
                </Button>
              </ActivityDetailsCard>
            )}

            {isPending &&
              (isInvited ? (
                <ActivityDetailsCard
                  activityId={activity.id}
                  onRefresh={onRefresh}
                >
                  <Button className="mt-3 w-full" size="sm" variant="default">
                    View Invitation
                  </Button>
                </ActivityDetailsCard>
              ) : (
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  variant="secondary"
                  disabled
                >
                  Pending Approval
                </Button>
              ))}

            {isWaitlisted && (
              <Button
                className="mt-3 w-full"
                size="sm"
                variant="secondary"
                disabled
              >
                On Waitlist
              </Button>
            )}

            {isNotJoined && (
              <ActivityDetailsCard
                activityId={activity.id}
                onRefresh={onRefresh}
              >
                <Button className="mt-3 w-full" size="sm" variant="default">
                  {activity.requireApproval ? "Request to Join" : "Join Now"}
                </Button>
              </ActivityDetailsCard>
            )}
          </>
        )}
        </div>
      </div>

      {confirmingCancel && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium">
              Are you sure you want to leave this activity?
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmingCancel(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancelRsvp}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReportDrawer
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedUserId={activity.hostId}
        reportedUserName={activity.host.name}
        activityId={activity.id}
      />
    </div>
  );
}
