// reminder.job.ts
// Cron job that runs every hour and sends 24-hour reminder emails for upcoming activities.
// Registered in app.ts on server startup.

import cron from "node-cron";
import { prisma } from "../config/prisma";
import * as notificationService from "../services/notification.service";
import { format } from "date-fns";

async function sendUpcomingReminders(): Promise<void> {
  const now = new Date();

  // Widen the DB query to catch the full day around the 24h mark.
  // date is stored as midnight, so we can't rely on it alone — we combine
  // with startTime in JS to get the real activity start datetime.
  const queryStart = new Date(now.getTime() + 22 * 60 * 60 * 1000);
  const queryEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const candidates = await prisma.activity.findMany({
    where: {
      status: "ACTIVE",
      date: {
        gte: queryStart,
        lte: queryEnd,
      },
    },
    include: {
      host: { select: { name: true, email: true } },
      participants: {
        where: { status: "CONFIRMED" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  // Post-filter by combining date + startTime to get the real start datetime,
  // then check if it falls within the 23-25h window.
  const activities = candidates.filter((activity) => {
    const parts = activity.startTime.split(":");
    const hours = parseInt(parts[0] ?? "0", 10);
    const minutes = parseInt(parts[1] ?? "0", 10);
    const activityStart = new Date(activity.date);
    activityStart.setHours(hours, minutes, 0, 0);
    const hoursUntil = (activityStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 23 && hoursUntil <= 25;
  });

  for (const activity of activities) {
    // Build recipient list: all confirmed participants + the host
    const participants = activity.participants.map((p) => ({
      name: p.user.name,
      email: p.user.email,
    }));
    const allRecipients = [
      { name: activity.host.name, email: activity.host.email },
      ...participants,
    ];

    const activityDetails: notificationService.ActivityDetails = {
      name: activity.title,
      date: format(activity.date, "EEEE, d MMM yyyy") + ", " + activity.startTime,
      location: activity.location,
    };

    notificationService
      .sendReminder(allRecipients, activityDetails, "24h")
      .catch((err) => console.error(`Reminder failed for activity ${activity.id}:`, err));
  }
}

async function sendAttendanceReminders(): Promise<void> {
  const now = new Date();
  const queryStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const queryEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const candidates = await prisma.activity.findMany({
    where: {
      status: "ACTIVE",
      date: {
        gte: queryStart,
        lte: queryEnd,
      },
    },
    include: {
      host: { select: { name: true, email: true } },
      participants: {
        where: {
          status: "CONFIRMED",
          attendanceStatus: "PENDING",
        },
      },
    },
  });

  for (const activity of candidates) {
    if (activity.participants.length === 0) continue;

    const endParts = activity.endTime.split(":").map(Number);
    const activityEnd = new Date(activity.date);
    activityEnd.setHours(endParts[0] ?? 0, endParts[1] ?? 0, 0, 0);
    const minutesSinceEnd =
      (now.getTime() - activityEnd.getTime()) / (1000 * 60);

    let urgency: "first" | "final" | null = null;
    if (minutesSinceEnd >= 30 && minutesSinceEnd <= 90) {
      urgency = "first";
    } else if (minutesSinceEnd >= 23 * 60 && minutesSinceEnd <= 24 * 60) {
      urgency = "final";
    }

    if (!urgency) continue;

    const activityDetails: notificationService.ActivityDetails = {
      name: activity.title,
      date: format(activity.date, "EEEE, d MMM yyyy") + ", " + activity.startTime,
      location: activity.location,
    };

    notificationService
      .sendAttendanceReminder(
        { name: activity.host.name, email: activity.host.email },
        activityDetails,
        urgency,
      )
      .catch((err) =>
        console.error(
          `Attendance reminder failed for activity ${activity.id}:`,
          err,
        ),
      );
  }
}

export function startReminderJob(): void {
  // Run at the top of every hour: "0 * * * *"
  cron.schedule("0 * * * *", () => {
    console.log("[reminder.job] Checking for activities in ~24h...");
    sendUpcomingReminders().catch(console.error);
    sendAttendanceReminders().catch(console.error);
  });

  console.log("[reminder.job] Reminder cron jobs registered (runs hourly)");
}
