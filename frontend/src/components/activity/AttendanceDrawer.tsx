"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  activityApi,
  type ActivityDetail,
  type AttendanceStatus,
} from "@/lib/api";
import { toast } from "sonner";
import ReportUserDrawer from "@/components/activity/ReportUserDrawer";

type AttendanceDrawerProps = {
  activityId: string;
  onRefresh?: () => void;
  className?: string;
};

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  activeClass: string;
}[] = [
  {
    value: "ATTENDED",
    label: "Attended",
    activeClass: "bg-green-100 text-green-700 border-green-300",
  },
  {
    value: "NO_SHOW",
    label: "No-Show",
    activeClass: "bg-red-100 text-destructive border-destructive/30",
  },
  {
    value: "LATE_CANCEL",
    label: "Late Cancel",
    activeClass: "bg-orange-100 text-orange-700 border-orange-300",
  },
];

export default function AttendanceDrawer({
  activityId,
  onRefresh,
  className,
}: AttendanceDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<ActivityDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  // attendance map: participantId → status
  const [attendance, setAttendance] = React.useState<
    Record<string, AttendanceStatus>
  >({});
  const [saving, setSaving] = React.useState(false);

  const fetchDetail = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityApi.get(activityId);
      setDetail(data);
      // Pre-populate from existing attendanceStatus
      const initial: Record<string, AttendanceStatus> = {};
      data.participants
        .filter((p) => p.status === "CONFIRMED")
        .forEach((p) => {
          if (p.attendanceStatus !== "PENDING") {
            initial[p.id] = p.attendanceStatus;
          }
        });
      setAttendance(initial);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  React.useEffect(() => {
    if (open) fetchDetail();
  }, [open, fetchDetail]);

  const confirmedParticipants =
    detail?.participants.filter((p) => p.status === "CONFIRMED") ?? [];

  const hasStarted = React.useMemo(() => {
    if (!detail) return false;
    const start = new Date(detail.date);
    const [h, m] = detail.startTime.split(":").map(Number);
    start.setHours(h ?? 0, m ?? 0, 0, 0);
    return new Date() >= start;
  }, [detail]);

  const markedCount = Object.keys(attendance).length;

  const setStatus = (participantId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [participantId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await activityApi.markAttendance(activityId, attendance);
      toast.success("Attendance saved!");
      setOpen(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className}>
          <ClipboardCheck className="size-4" />
          Attendance
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[88vh] flex flex-col">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-center">Mark Attendance</DrawerTitle>
        </DrawerHeader>

        {loading || !detail ? (
          <div className="flex-1 grid place-items-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : confirmedParticipants.length === 0 ? (
          <div className="flex-1 grid place-items-center">
            <p className="text-muted-foreground">No confirmed participants</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
              {confirmedParticipants.map((p) => (
                <div key={p.id} className="rounded-lg border p-3 space-y-3">
                  {/* Participant info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={p.user.image ?? undefined}
                        alt={p.user.name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {p.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{p.user.name}</p>
                  </div>

                  {/* 3-way status buttons */}
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = attendance[p.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(p.id, opt.value)}
                          className={cn(
                            "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                            isActive
                              ? opt.activeClass
                              : "border-input bg-background text-muted-foreground hover:bg-accent/50",
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Report participant */}
                  <ReportUserDrawer
                    reportedUserId={p.user.id}
                    reportedUserName={p.user.name}
                    activityId={activityId}
                    trigger={
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline transition-colors text-right w-full"
                      >
                        Report this participant
                      </button>
                    }
                  />
                </div>
              ))}
            </div>

            <DrawerFooter className="border-t">
              {!hasStarted && (
                <p className="text-sm text-muted-foreground text-center">
                  Attendance can only be marked after the activity has started.
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={saving || !hasStarted}
              >
                {saving
                  ? "Saving..."
                  : `Save Attendance (${markedCount}/${confirmedParticipants.length})`}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
