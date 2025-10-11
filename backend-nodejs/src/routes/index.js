import { Router } from 'express';
import authRoutes from './authRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import feedRoutes from './feedRoutes.js';
import searchRoutes from './searchRoutes.js';
import adminRoutes from './adminRoutes.js';
import telemetryRoutes from './telemetryRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/feed', feedRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/telemetry', telemetryRoutes);

export default router;
