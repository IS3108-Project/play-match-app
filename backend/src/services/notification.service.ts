// notification.service.ts
// Contains all the business logic for sending notification emails.
// Each function handles one type of notification.

import { sendEmail } from "../email/send-email";
import ReminderEmail from "../email/email_templates/reminder-email";
import RsvpConfirmationEmail from "../email/email_templates/rsvp-confirmation-email";
import WithdrawalEmail from "../email/email_templates/withdrawal-email";
import NewParticipantEmail from "../email/email_templates/new-participant-email";
import InvitationEmail from "../email/email_templates/invitation-email";
import InvitationOutcomeEmail from "../email/email_templates/invitation-outcome-email";
import CancelledActivityEmail from "../email/email_templates/cancelled-activity-email";
import PendingRequestEmail from "../email/email_templates/pending-request-email";
import RequestOutcomeEmail from "../email/email_templates/request-outcome-email";
import AttendanceReminderEmail from "../email/email_templates/attendance-reminder-email";
import NoShowWarningEmail from "../email/email_templates/no-show-warning-email";

// ── Shared types ────────────────────────────────────────────────────────────

export interface NotificationUser {
  name: string;
  email: string;
}

export interface ActivityDetails {
  name: string;
  date: string;     // pre-formatted string, e.g. "Saturday, 25 Feb 2026, 7:00 AM"
  location: string;
  url?: string;
}

// ── Pending request type ─────────────────────────────────────────────────────

export interface PendingRequestDetails {
  hostName: string;
  hostEmail: string;
  requesterName: string;
  activityName: string;
  activityDate: string;
}

// ── 1. RSVP Confirmation ────────────────────────────────────────────────────
// Called when a user joins an activity and is confirmed immediately (no approval required).
// Also called when an invited user accepts an invitation.

export async function sendRsvpConfirmation(
  user: NotificationUser,
  activity: ActivityDetails,
): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: `You're confirmed for ${activity.name}!`,
    react: RsvpConfirmationEmail({
      userName: user.name,
      activityName: activity.name,
      activityDate: activity.date,
      activityLocation: activity.location,
    }),
  });
}

// ── 2. Invitation (to invited user) ─────────────────────────────────────────
// Called when a host invites a user to their activity via buddy matching.

export interface InvitationDetails {
  inviteeName: string;
  inviteeEmail: string;
  hostName: string;
  activityName: string;
  activityDate: string;
  activityLocation: string;
}

export async function sendInvitation(details: InvitationDetails): Promise<void> {
  await sendEmail({
    to: details.inviteeEmail,
    subject: `${details.hostName} invited you to join ${details.activityName}`,
    react: InvitationEmail({
      inviteeName: details.inviteeName,
      hostName: details.hostName,
      activityName: details.activityName,
      activityDate: details.activityDate,
      activityLocation: details.activityLocation,
    }),
  });
}

// ── 3. Invitation Outcome (to host) ──────────────────────────────────────────
// Called when an invitee accepts or declines a buddy matching invitation.

export interface InvitationOutcomeDetails {
  hostName: string;
  hostEmail: string;
  inviteeName: string;
  activityName: string;
  activityDate: string;
  outcome: "accepted" | "declined";
}

export async function sendInvitationOutcome(
  details: InvitationOutcomeDetails,
): Promise<void> {
  const subject = details.outcome === "accepted"
    ? `${details.inviteeName} accepted your invitation to ${details.activityName}`
    : `${details.inviteeName} declined your invitation to ${details.activityName}`;

  await sendEmail({
    to: details.hostEmail,
    subject,
    react: InvitationOutcomeEmail({
      hostName: details.hostName,
      inviteeName: details.inviteeName,
      activityName: details.activityName,
      activityDate: details.activityDate,
      outcome: details.outcome,
    }),
  });
}

// ── 4. New Participant (to host) ─────────────────────────────────────────────
// Called when a user joins an activity directly (no approval required).
// Sends one email to the host.

export interface NewParticipantDetails {
  hostName: string;
  hostEmail: string;
  participantName: string;
  activityName: string;
  activityDate: string;
  activityLocation: string;
}

export async function sendNewParticipantNotification(
  details: NewParticipantDetails,
): Promise<void> {
  await sendEmail({
    to: details.hostEmail,
    subject: `${details.participantName} just joined ${details.activityName}`,
    react: NewParticipantEmail({
      hostName: details.hostName,
      participantName: details.participantName,
      activityName: details.activityName,
      activityDate: details.activityDate,
      activityLocation: details.activityLocation,
    }),
  });
}

// ── 3. Withdrawal (to host) ──────────────────────────────────────────────────
// Called when a confirmed participant leaves an activity.
// Sends one email to the host.

export interface WithdrawalDetails {
  hostName: string;
  hostEmail: string;
  participantName: string;
  activityName: string;
  activityDate: string;
}

export async function sendWithdrawalNotification(
  details: WithdrawalDetails,
): Promise<void> {
  await sendEmail({
    to: details.hostEmail,
    subject: `${details.participantName} has withdrawn from ${details.activityName}`,
    react: WithdrawalEmail({
      hostName: details.hostName,
      participantName: details.participantName,
      activityName: details.activityName,
      activityDate: details.activityDate,
    }),
  });
}

// ── 3. Activity Cancelled ────────────────────────────────────────────────────
// Called when a host cancels an activity.
// Notifies ALL participants (CONFIRMED, PENDING, WAITLISTED).

export async function sendActivityCancelled(
  users: NotificationUser[],
  activity: ActivityDetails,
): Promise<void> {
  await Promise.all(
    users.map((user) =>
      sendEmail({
        to: user.email,
        subject: `${activity.name} has been cancelled`,
        react: CancelledActivityEmail({
          userName: user.name,
          activityName: activity.name,
          activityDate: activity.date,
          activityLocation: activity.location,
        }),
      }),
    ),
  );
}

// ── 2. Pending Request (to host) ─────────────────────────────────────────────
// Called when a user requests to join an approval-required activity.
// Sends one email to the host.

export async function sendPendingRequestToHost(
  details: PendingRequestDetails,
): Promise<void> {
  await sendEmail({
    to: details.hostEmail,
    subject: `${details.requesterName} wants to join ${details.activityName}`,
    react: PendingRequestEmail({
      hostName: details.hostName,
      requesterName: details.requesterName,
      activityName: details.activityName,
      activityDate: details.activityDate,
    }),
  });
}

// ── 3. Request Outcome (to user) ─────────────────────────────────────────────
// Called when a host approves or rejects a pending join request.
// Sends one email to the requesting user.

export async function sendRequestOutcome(
  user: NotificationUser,
  activity: ActivityDetails,
  outcome: "approved" | "rejected",
  rejectionNote?: string,
): Promise<void> {
  const subject = outcome === "approved"
    ? `You're in! Request approved for ${activity.name}`
    : `Your request to join ${activity.name} was not accepted`;

  await sendEmail({
    to: user.email,
    subject,
    react: RequestOutcomeEmail({
      userName: user.name,
      activityName: activity.name,
      activityDate: activity.date,
      activityLocation: activity.location,
      outcome,
      rejectionNote,
    }),
  });
}

// ── 4. Reminder ─────────────────────────────────────────────────────────────
// Called to remind ALL participants (+ host) before the activity.
// type "24h" sends "tomorrow" reminder.
//
// Arguments:
//   users    — array of all confirmed participants + host
//   activity — the activity details
//   type     — "24h" sends "tomorrow" reminder, "1h" sends "starting soon" reminder

export async function sendReminder(
  users: NotificationUser[],
  activity: ActivityDetails,
  type: "24h" | "1h",
): Promise<void> {
  const timeUntil = type === "1h" ? "1 hour" : "24 hours";

  await Promise.all(
    users.map((user) =>
      sendEmail({
        to: user.email,
        subject: `Reminder: ${activity.name} is in ${timeUntil}`,
        react: ReminderEmail({
          userName: user.name,
          activityName: activity.name,
          activityDate: activity.date,
          activityLocation: activity.location,
          timeUntil,
        }),
      }),
      ),
  );
}

export async function sendAttendanceReminder(
  user: NotificationUser,
  activity: ActivityDetails,
  urgency: "first" | "final",
): Promise<void> {
  await sendEmail({
    to: user.email,
    subject:
      urgency === "final"
        ? `Final reminder: mark attendance for ${activity.name}`
        : `Don't forget to mark attendance for ${activity.name}`,
    react: AttendanceReminderEmail({
      userName: user.name,
      activityName: activity.name,
      activityDate: activity.date,
      activityLocation: activity.location,
      urgency,
    }),
  });
}

export async function sendNoShowWarning(
  user: NotificationUser,
  totalNoShows: number,
): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: "Warning: You've missed 5 activities",
    react: NoShowWarningEmail({
      userName: user.name,
      totalNoShows,
    }),
  });
}
