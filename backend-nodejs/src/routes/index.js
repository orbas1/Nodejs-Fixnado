import { Router } from 'express';
import authRoutes from './authRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import feedRoutes from './feedRoutes.js';
import searchRoutes from './searchRoutes.js';
import adminRoutes from './adminRoutes.js';
import telemetryRoutes from './telemetryRoutes.js';
import zoneRoutes from './zoneRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import rentalRoutes from './rentalRoutes.js';
import complianceRoutes from './complianceRoutes.js';
import marketplaceRoutes from './marketplaceRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import communicationsRoutes from './communicationsRoutes.js';
import analyticsPipelineRoutes from './analyticsPipelineRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/feed', feedRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/zones', zoneRoutes);
router.use('/bookings', bookingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/rentals', rentalRoutes);
router.use('/compliance', complianceRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/communications', communicationsRoutes);
router.use('/analytics', analyticsPipelineRoutes);

export default router;
