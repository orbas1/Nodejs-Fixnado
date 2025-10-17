import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  getWorkspaceHandler,
  updateSettingsHandler,
  updateStatusHandler,
  updateScheduleHandler,
  updateDetailsHandler,
  createNoteHandler,
  createTimelineEntryHandler,
  validateWorkspace,
  validateUpdateSettings,
  validateUpdateStatus,
  validateUpdateSchedule,
  validateUpdateDetails,
  validateCreateNote,
  validateCreateTimelineEntry
} from '../controllers/providerBookingController.js';

const router = Router();

router.get(
  '/workspace',
  authenticate,
  enforcePolicy('provider.bookings.view'),
  validateWorkspace,
  getWorkspaceHandler
);

router.patch(
  '/settings',
  authenticate,
  enforcePolicy('provider.bookings.manage'),
  validateUpdateSettings,
  updateSettingsHandler
);

router.patch(
  '/:bookingId/status',
  authenticate,
  enforcePolicy('provider.bookings.manage'),
  validateUpdateStatus,
  updateStatusHandler
);

router.patch(
  '/:bookingId/schedule',
  authenticate,
  enforcePolicy('provider.bookings.manage'),
  validateUpdateSchedule,
  updateScheduleHandler
);

router.patch(
  '/:bookingId/details',
  authenticate,
  enforcePolicy('provider.bookings.manage'),
  validateUpdateDetails,
  updateDetailsHandler
);

router.post(
  '/:bookingId/notes',
  authenticate,
  enforcePolicy('provider.bookings.manage'),
  validateCreateNote,
  createNoteHandler
);

router.post(
  '/:bookingId/history',
  authenticate,
  enforcePolicy('provider.bookings.manage'),
  validateCreateTimelineEntry,
  createTimelineEntryHandler
);

export default router;
