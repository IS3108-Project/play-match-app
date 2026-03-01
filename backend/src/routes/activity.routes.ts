import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as ctrl from "../controllers/activity.controller";

const router = Router();

// All activity routes require auth
router.use(requireAuth as any);

// CRUD
router.post("/", ctrl.createActivity as any);
router.get("/", ctrl.getActivities as any);
router.get("/mine", ctrl.getMyActivities as any);
router.get("/:id", ctrl.getActivity as any);
router.patch("/:id", ctrl.updateActivity as any);
router.delete("/:id", ctrl.cancelActivity as any);

// Cancel info (for transfer host flow)
router.get("/:id/cancel-info", ctrl.getCancelInfo as any);

// Join / Leave
router.post("/:id/join", ctrl.joinActivity as any);
router.post("/:id/leave", ctrl.leaveActivity as any);

// Approval (host only)
router.post("/:id/approve/:participantId", ctrl.approveParticipant as any);
router.post("/:id/reject/:participantId", ctrl.rejectParticipant as any);

// Guests
router.post("/:id/guests", ctrl.addGuest as any);
router.delete("/:id/guests/:guestId", ctrl.removeGuest as any);

// Attendance
router.post("/:id/attendance", ctrl.markAttendance as any);

export default router;
