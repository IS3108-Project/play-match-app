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
import { ClipboardCheck, Flag } from "lucide-react";
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

  // Clicking the active button again reverts the participant to PENDING (removes key)
  const setStatus = (participantId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      if (prev[participantId] === status) {
        const next = { ...prev };
        delete next[participantId];
        return next;
      }
      return { ...prev, [participantId]: status };
    });
  };

  const markAllAttended = () => {
    const all: Record<string, AttendanceStatus> = {};
    confirmedParticipants.forEach((p) => {
      all[p.id] = "ATTENDED";
    });
    setAttendance(all);
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
            {/* H1: warn at top so it's always visible, not buried below the list */}
            {!hasStarted && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-700">
                <span className="shrink-0">⏳</span>
                Attendance can only be marked after the activity has started.
              </div>
            )}

            {/* H7: mark all shortcut */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="text-xs text-muted-foreground">
                {markedCount}/{confirmedParticipants.length} marked
              </p>
              <button
                type="button"
                className="text-xs text-primary hover:underline underline-offset-2 disabled:opacity-40 disabled:pointer-events-none"
                disabled={!hasStarted}
                onClick={markAllAttended}
              >
                Mark all as attended
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {confirmedParticipants.map((p) => (
                <div key={p.id} className="rounded-lg border p-3 space-y-3">
                  {/* Participant info + H8: flag icon instead of full-width text link */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={p.user.image ?? undefined}
                          alt={p.user.name}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {p.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium truncate">{p.user.name}</p>
                    </div>
                    <ReportUserDrawer
                      reportedUserId={p.user.id}
                      reportedUserName={p.user.name}
                      activityId={activityId}
                      trigger={
                        <button
                          type="button"
                          title={`Report ${p.user.name}`}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Flag className="size-3.5" />
                        </button>
                      }
                    />
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


                </div>
              ))}
            </div>

            <DrawerFooter className="border-t">
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
