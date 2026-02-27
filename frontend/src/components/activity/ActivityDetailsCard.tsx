"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import ActivityDetailsSection from "@/components/activity/ActivityDetailsSection";
import BringAGuestForm from "@/components/activity/BringAGuestForm";
import EditActivityForm from "@/components/activity/EditActivityForm";
import type { EditActivityValues } from "@/components/activity/EditActivityForm";
import type { Activity, ParticipantStatus } from "@/types/activity";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type ActivityDetailsCardProps = {
  activity: Activity;
  children: React.ReactNode;
  isHost?: boolean;
  status: ParticipantStatus;
};

export default function ActivityDetailsCard({
  activity,
  children,
  status,
  isHost = false,
}: ActivityDetailsCardProps) {
  const [activityDraft, setActivityDraft] = React.useState(activity);
  const [attendanceByIndex, setAttendanceByIndex] = React.useState<
    Record<number, boolean>
  >({});
  const [inEditMode, setInEditMode] = React.useState(false);

  React.useEffect(() => {
    setActivityDraft({
      ...activity,
      participantStatuses:
        activity.participantStatuses ??
        new Array(activity.participants.length).fill("joined"),
    });
  }, [activity]);

  const handleEditMode = () => {
    setInEditMode(!inEditMode);
  };

  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="h-[88vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-center">Activity Details</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {inEditMode ? (
            <EditActivityForm
              defaultValues={{
                activityTitle: activityDraft.activityTitle,
                activityType: activityDraft.activityType,
                date: activityDraft.date,
                time: activityDraft.time,
                location: activityDraft.location,
                description: activityDraft.description,
                maxParticipants: Math.max(
                  2,
                  (activityDraft.joined ?? 0) + (activityDraft.slotsLeft ?? 0),
                ),
              }}
              onCancel={() => setInEditMode(false)}
              onSubmit={async (values: EditActivityValues) => {
                setActivityDraft((prev) => ({
                  ...prev,
                  activityTitle: values.activityTitle,
                  activityType: values.activityType,
                  date: values.date,
                  time: values.time,
                  location: values.location,
                  description: values.description,
                }));
                setInEditMode(false);
              }}
            />
          ) : (
            <>
              <ActivityDetailsSection
                activityTitle={activityDraft.activityTitle}
                date={activityDraft.date}
                time={activityDraft.time}
                location={activityDraft.location}
                description={activityDraft.description}
                participants={activityDraft.participants}
                participantImages={activityDraft.participantImages}
                participantStatuses={activityDraft.participantStatuses}
                isHost={isHost}
                attendanceByIndex={attendanceByIndex}
                onToggleAttendance={(index, checked) =>
                  setAttendanceByIndex((prev) => ({
                    ...prev,
                    [index]: checked,
                  }))
                }
                onApproveParticipant={(index) =>
                  setActivityDraft((prev) => {
                    const next = [...(prev.participantStatuses ?? [])];
                    next[index] = "confirmed";
                    return { ...prev, participantStatuses: next };
                  })
                }
                onRejectParticipant={(index) =>
                  setActivityDraft((prev) => {
                    const next = [...(prev.participantStatuses ?? [])];
                    next[index] = "cancelled";
                    return { ...prev, participantStatuses: next };
                  })
                }
                showEditButton={isHost && status === "joined"}
                onEdit={handleEditMode}
              />

              {/* TODO: Implement Add a guest functionality */}
              {/* Bring a Guest */}
              {status === "joined" && !isHost && <BringAGuestForm />}
            </>
          )}
        </div>

        {/* TODO: implement button functionalities */}
        <DrawerFooter className="border-t">
          {status === "joined" && !isHost && (
            <>
              <Button className="w-full ">RSVP</Button>
              <Button className="w-full" variant="outline">
                Withdraw
              </Button>
              <p className="text-xs text-muted-foreground">
                Please confirm your attendance at least 30 minutes before the
                activity starts.
              </p>
            </>
          )}
          {status === "not-joined" && (
            <Button className="w-full">Request to Join</Button>
          )}
          {isHost && !inEditMode && (
            <Button className="w-full">Confirm Attendance</Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
