"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Clock3, MapPin, Pencil } from "lucide-react";
import type { ParticipantStatus } from "@/types/activity";

type ActivityDetailsSectionProps = {
  activityTitle: string;
  date: string;
  time: string;
  location: string;
  description: string;
  participants: string[];
  participantImages: string[];
  participantStatuses?: ParticipantStatus[];
  isHost: boolean;
  attendanceByIndex: Record<number, boolean>;
  onToggleAttendance?: (index: number, checked: boolean) => void;
  onApproveParticipant?: (index: number) => void;
  onRejectParticipant?: (index: number) => void;
  showEditButton?: boolean;
  onEdit?: () => void;
};

function badgeVariantForStatus(
  status: ParticipantStatus,
): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "confirmed":
      return "secondary";
    case "joined":
      return "default";
    case "pending":
      return "outline";
    case "cancelled":
      return "destructive";
    case "ended":
      return "secondary";
    case "not-joined":
      return "outline";
    default:
      return "outline";
  }
}

export default function ActivityDetailsSection({
  activityTitle,
  date,
  time,
  location,
  description,
  participants,
  participantImages,
  participantStatuses,
  isHost,
  attendanceByIndex,
  onToggleAttendance,
  onApproveParticipant,
  onRejectParticipant,
  showEditButton = false,
  onEdit,
}: ActivityDetailsSectionProps) {
  return (
    <>
      {/* Activity Details */}
      <section className="space-y-2">
        <div className="flex items-start justify-between gap-3 pb-4">
          <h3 className="text-2xl font-bold">{activityTitle}</h3>
          {showEditButton && (
            <Button
              type="button"
              aria-label="Edit activity"
              variant="outline"
              className="gap-2"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
        <p className="text-sm flex">
          <CalendarDays className="h-4 w-4 mr-2" />
          {date}
        </p>
        <p className="text-sm flex">
          <Clock3 className="h-4 w-4 mr-2" />
          {time}
        </p>
        <p className="text-sm flex">
          <MapPin className="h-4 w-4 mr-2" />
          {location}
        </p>
      </section>

      {/* Description */}
      <section className="space-y-2 border-t pt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </section>

      {/* Host & participants */}
      <section className="space-y-2 border-t pt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Host & participants ({participants.length})
        </h4>
        <div className="text-sm text-muted-foreground">
          {/* TODO: Extract participant profile from database */}
          {participants.map((participant, index) => {
            const statusForParticipant: ParticipantStatus =
              participantStatuses?.[index] ?? "joined";
            const showAttendanceCheckbox =
              isHost &&
              (statusForParticipant === "joined" ||
                statusForParticipant === "confirmed");
            const showApprovalActions =
              isHost && statusForParticipant === "pending";

            return (
              <div
                key={`${participant}-${index}`}
                className="flex items-center gap-2"
              >
                <Avatar className="h-8 w-8 my-1">
                  <AvatarImage
                    src={participantImages[index] ?? "/assets/logo.svg"}
                    alt={participant}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {participant.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">{participant}</p>

                <div className="ml-auto flex items-center gap-2">
                  {isHost && (
                    <Badge
                      variant={badgeVariantForStatus(statusForParticipant)}
                    >
                      {statusForParticipant}
                    </Badge>
                  )}

                  {showAttendanceCheckbox && (
                    <Checkbox
                      checked={attendanceByIndex[index] ?? false}
                      onCheckedChange={(checked) =>
                        onToggleAttendance?.(index, checked === true)
                      }
                      aria-label={`Mark ${participant} attendance`}
                    />
                  )}

                  {showApprovalActions && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        onClick={() => onApproveParticipant?.(index)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-destructive hover:text-destructive"
                        onClick={() => onRejectParticipant?.(index)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
