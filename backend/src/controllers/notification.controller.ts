// notification.controller.ts
// Reads data from the HTTP request body, calls the service, sends back a response.

import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";

// POST /api/notifications/activity-cancelled
export async function sendActivityCancelled(req: Request, res: Response) {
  const { users, activity } = req.body;
  try {
    await notificationService.sendActivityCancelled(users, activity);
    res.status(200).json({ message: `Cancellation emails sent to ${users.length} participant(s)` });
  } catch (error) {
    console.error("Failed to send cancellation emails:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
}

// POST /api/notifications/pending-request
export async function sendPendingRequestToHost(req: Request, res: Response) {
  const { details } = req.body;
  try {
    await notificationService.sendPendingRequestToHost(details);
    res.status(200).json({ message: "Pending request email sent to host" });
  } catch (error) {
    console.error("Failed to send pending request email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}

// POST /api/notifications/request-outcome
export async function sendRequestOutcome(req: Request, res: Response) {
  const { user, activity, outcome, rejectionNote } = req.body;
  try {
    await notificationService.sendRequestOutcome(user, activity, outcome, rejectionNote);
    res.status(200).json({ message: "Request outcome email sent" });
  } catch (error) {
    console.error("Failed to send request outcome email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}

// POST /api/notifications/reminder
export async function sendReminder(req: Request, res: Response) {
  const { users, activity, type } = req.body;
  try {
    await notificationService.sendReminder(users, activity, type);
    res.status(200).json({ message: `Reminder emails sent to ${users.length} participant(s)` });
  } catch (error) {
    console.error("Failed to send reminders:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
}
