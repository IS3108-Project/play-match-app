// notification.routes.ts
// Maps URL paths to controller functions.
// All routes here are prefixed with /api/notifications (set in routes/index.ts).

import { Router } from "express";
import {
  sendRsvpConfirmation,
  sendWithdrawalNotification,
  sendActivityCancelled,
  sendPendingRequestToHost,
  sendRequestOutcome,
  sendReminder,
} from "../controllers/notification.controller";

const router = Router();

router.post("/rsvp-confirmation", sendRsvpConfirmation);
router.post("/withdrawal", sendWithdrawalNotification);
router.post("/activity-cancelled", sendActivityCancelled);
router.post("/pending-request", sendPendingRequestToHost);
router.post("/request-outcome", sendRequestOutcome);
router.post("/reminder", sendReminder);

export default router;
