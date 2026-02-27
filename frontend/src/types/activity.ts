export const PARTICIPANT_STATUSES = [
  "joined",
  "confirmed",
  "cancelled",
  "pending",
  "ended",
  "not-joined",
] as const;

export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

export function isParticipantStatus(
  value: unknown,
): value is ParticipantStatus {
  return (
    typeof value === "string" &&
    (PARTICIPANT_STATUSES as readonly string[]).includes(value)
  );
}

export type Activity = {
  activityTitle: string;
  location: string;
  date: string;
  time: string;
  description: string;
  host: string;
  hostImage: string;
  participants: string[];
  participantImages: string[];
  participantStatuses?: ParticipantStatus[];
  joined: number;
  slotsLeft: number;
  activityType: string;
  status: ParticipantStatus;
  imageSrc?: string;

  // Optional metadata present in `activities.json` today.
  distanceKm?: number;
  skill?: string;
  rating?: number;
};
