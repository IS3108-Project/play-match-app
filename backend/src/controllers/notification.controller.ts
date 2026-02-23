// notification.controller.ts
// Reads data from the HTTP request body, calls the service, sends back a response.

import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";

// POST /api/notifications/rsvp-confirmation
export async function sendRsvpConfirmation(req: Request, res: Response) {
  const { user, activity } = req.body;
  try {
    await notificationService.sendRsvpConfirmation(user, activity);
    res.status(200).json({ message: "RSVP confirmation email sent" });
  } catch (error) {
    console.error("Failed to send RSVP confirmation:", error);
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

// POST /api/notifications/change-alert
export async function sendChangeAlert(req: Request, res: Response) {
  const { users, activity, changeType, oldValue, newValue } = req.body;
  try {
    await notificationService.sendChangeAlert(users, activity, changeType, oldValue, newValue);
    res.status(200).json({ message: `Change alert emails sent to ${users.length} participant(s)` });
  } catch (error) {
    console.error("Failed to send change alerts:", error);
    res.status(500).json({ error: "Failed to send emails" });
  }
}

// POST /api/notifications/waitlist
export async function sendWaitlistNotification(req: Request, res: Response) {
  const { user, activity } = req.body;
  try {
    await notificationService.sendWaitlistNotification(user, activity);
    res.status(200).json({ message: "Waitlist notification email sent" });
  } catch (error) {
    console.error("Failed to send waitlist notification:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}


