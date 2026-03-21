// Single entry point file for all route groups

import { Router } from "express";
import userRoutes from './user.routes'
import notificationRoutes from './notification.routes';
import activityRoutes from './activity.routes';
import uploadRoutes from './upload.routes';
import configRoutes from './config.routes';
import buddyRoutes from './buddy.routes';

const router = Router();

router.use('/config', configRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activities', activityRoutes);
router.use('/upload', uploadRoutes);
router.use('/buddy', buddyRoutes);

export default router;
