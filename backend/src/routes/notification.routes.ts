// notification.routes.ts
// Maps URL paths to controller functions.
// All routes here are prefixed with /api/notifications (set in routes/index.ts).
//
// Full URLs:
//   POST /api/notifications/rsvp-confirmation
//   POST /api/notifications/reminder
//   POST /api/notifications/change-alert
//   POST /api/notifications/waitlist

import { Router } from "express";
import {
  sendRsvpConfirmation,
  sendReminder,
  sendChangeAlert,
  sendWaitlistNotification,
} from "../controllers/notification.controller";

// Router is Express's way of grouping related routes.
// Think of it as a mini-app that handles a specific section of your API.
const router = Router();

// We use POST for all notification routes because:
//   - We are sending data (user info, activity details) in the request body
//   - GET requests don't have a body — they're for fetching data, not triggering actions
router.post("/rsvp-confirmation", sendRsvpConfirmation);
router.post("/reminder", sendReminder);
router.post("/change-alert", sendChangeAlert);
router.post("/waitlist", sendWaitlistNotification);

export default router;
