// reminder.job.ts
// Cron job that runs every hour and sends 24-hour reminder emails for upcoming activities.
// Registered in app.ts on server startup.

import cron from "node-cron";
import { prisma } from "../config/prisma";
import * as notificationService from "../services/notification.service";
import { format } from "date-fns";

async function sendUpcomingReminders(): Promise<void> {
  const now = new Date();

  // Target window: activities starting between 23h and 25h from now
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const activities = await prisma.activity.findMany({
    where: {
      status: "ACTIVE",
      date: {
        gte: windowStart,
        lte: windowEnd,
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

export function startReminderJob(): void {
  // Run at the top of every hour: "0 * * * *"
  cron.schedule("0 * * * *", () => {
    console.log("[reminder.job] Checking for activities in ~24h...");
    sendUpcomingReminders().catch(console.error);
  });

  console.log("[reminder.job] 24-hour reminder cron job registered (runs hourly)");
}
