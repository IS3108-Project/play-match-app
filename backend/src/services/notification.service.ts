// notification.service.ts
// Contains all the business logic for sending notification emails.
// Each function handles one type of notification.
//
// NOTE ON "PLACEHOLDER" PATTERN:
// The Activity model doesn't exist in the DB yet (your friend is building it).
// So instead of querying Prisma, each function takes the data it needs as arguments.
// When your friend finishes the Activity model, they can call these functions
// directly from their activity.service.ts, passing in the right data.
// Nothing in THIS file needs to change.

import { sendEmail } from "../email/send-email";
import RsvpConfirmationEmail from "../email/email_templates/rsvp-confirmation-email";
import ReminderEmail from "../email/email_templates/reminder-email";
import ChangeAlertEmail from "../email/email_templates/change-alert-email";
import WaitlistEmail from "../email/email_templates/waitlist-email";

// ── Shared types ────────────────────────────────────────────────────────────
// These two interfaces are the "contract" this service exposes to the rest of
// the backend. Any code that calls these functions must provide data in this shape.

export interface NotificationUser {
  name: string;
  email: string;
}

export interface ActivityDetails {
  name: string;
  date: string;     // pre-formatted string, e.g. "Saturday, 25 Feb 2026, 7:00 AM"
  location: string;
  url?: string;     // optional — needed for waitlist email CTA button
}

// ── 1. RSVP Confirmation ────────────────────────────────────────────────────
// Called after a single user successfully RSVPs.
// Typically called FROM activity.service.ts right after the RSVP is saved to DB.
//
// Arguments:
//   user     — the user who just RSVPed (their name + email)
//   activity — the activity they joined

export async function sendRsvpConfirmation(
  user: NotificationUser,
  activity: ActivityDetails,
): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: `You're confirmed for ${activity.name}!`,
    // We call the template as a regular function, passing in the props.
    // Resend will render this React component into HTML before sending.
    react: RsvpConfirmationEmail({
      userName: user.name,
      activityName: activity.name,
      activityDate: activity.date,
      activityLocation: activity.location,
    }),
  });
}

// ── 2. Reminder ─────────────────────────────────────────────────────────────
// Called to remind ALL participants before the activity.
// Same function handles both the 24-hour and 1-hour reminder — just pass a different `type`.
//
// Arguments:
//   users    — array of all confirmed participants (your friend queries these from DB)
//   activity — the activity details
//   type     — "24h" sends "tomorrow" reminder, "1h" sends "starting soon" reminder

export async function sendReminder(
  users: NotificationUser[],
  activity: ActivityDetails,
  type: "24h" | "1h",
): Promise<void> {
  // Convert type to a human-readable string used in the email template
  const timeUntil = type === "1h" ? "1 hour" : "24 hours";

  // Promise.all sends ALL the emails concurrently (in parallel) instead of
  // one by one. Much faster when there are many participants.
  // users.map() creates an array of Promises, then Promise.all waits for all of them.
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

// ── 3. Change Alert ──────────────────────────────────────────────────────────
// Called when an organiser updates or cancels an activity.
// Notifies ALL participants of the change.
//
// Arguments:
//   users      — all confirmed participants
//   activity   — the activity (with updated details already applied)
//   changeType — what changed: "time", "location", or "cancelled"
//   oldValue   — what it was before (not needed if cancelled)
//   newValue   — what it changed to  (not needed if cancelled)

export async function sendChangeAlert(
  users: NotificationUser[],
  activity: ActivityDetails,
  changeType: "time" | "location" | "cancelled",
  oldValue?: string,
  newValue?: string,
): Promise<void> {
  const subjectMap = {
    time: `Update: ${activity.name} has a new time`,
    location: `Update: ${activity.name} has a new location`,
    cancelled: `${activity.name} has been cancelled`,
  };

  await Promise.all(
    users.map((user) =>
      sendEmail({
        to: user.email,
        subject: subjectMap[changeType],
        react: ChangeAlertEmail({
          userName: user.name,
          activityName: activity.name,
          changeType,
          oldValue,
          newValue,
        }),
      }),
    ),
  );
}

// ── 4. Waitlist Notification ─────────────────────────────────────────────────
// Called when a confirmed participant cancels and a waitlisted user gets their spot.
// Only sent to the ONE user who just moved off the waitlist.
//
// Arguments:
//   user     — the waitlisted user who now has a spot
//   activity — must include `url` so the email button links to the activity page

export async function sendWaitlistNotification(
  user: NotificationUser,
  activity: ActivityDetails,
): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: `A spot just opened up for ${activity.name}!`,
    react: WaitlistEmail({
      userName: user.name,
      activityName: activity.name,
      activityDate: activity.date,
      activityLocation: activity.location,
      // Fall back to a generic URL if none is provided
      activityUrl: activity.url ?? "http://localhost:5173",
    }),
  });
}
