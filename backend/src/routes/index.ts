// Single entry point file for all route groups

import { Router } from "express";
import userRoutes from './user.routes'
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

export default router;
