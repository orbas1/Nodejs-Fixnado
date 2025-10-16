import { Router } from 'express';
import {
  bookingOverview,
  getBookingSettings,
  saveBookingSettings,
  createBookingHandler,
  getBookingHandler,
  updateBookingStatusHandler,
  updateBookingScheduleHandler,
  updateBookingMetaHandler,
  applyTemplateHandler,
  listTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  archiveTemplateHandler,
  getTemplateHandler
} from '../controllers/adminBookingController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/overview',
  authenticate,
  enforcePolicy('admin.bookings.read', { metadata: () => ({ section: 'booking-overview' }) }),
  bookingOverview
);

router.get(
  '/settings',
  authenticate,
  enforcePolicy('admin.bookings.read', { metadata: () => ({ section: 'booking-settings' }) }),
  getBookingSettings
);

router.put(
  '/settings',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: () => ({ section: 'booking-settings' }) }),
  saveBookingSettings
);

router.get(
  '/templates',
  authenticate,
  enforcePolicy('admin.bookings.read', { metadata: () => ({ section: 'booking-templates' }) }),
  listTemplatesHandler
);

router.post(
  '/templates',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: () => ({ section: 'booking-templates' }) }),
  createTemplateHandler
);

router.get(
  '/templates/:templateId',
  authenticate,
  enforcePolicy('admin.bookings.read', { metadata: () => ({ section: 'booking-templates' }) }),
  getTemplateHandler
);

router.put(
  '/templates/:templateId',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: (req) => ({ section: 'booking-templates', templateId: req.params.templateId }) }),
  updateTemplateHandler
);

router.patch(
  '/templates/:templateId',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: (req) => ({ section: 'booking-templates', templateId: req.params.templateId }) }),
  updateTemplateHandler
);

router.delete(
  '/templates/:templateId',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: (req) => ({ section: 'booking-templates', templateId: req.params.templateId }) }),
  archiveTemplateHandler
);

router.post(
  '/',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: () => ({ section: 'booking-management' }) }),
  createBookingHandler
);

router.get(
  '/:bookingId',
  authenticate,
  enforcePolicy('admin.bookings.read', { metadata: (req) => ({ section: 'booking-management', bookingId: req.params.bookingId }) }),
  getBookingHandler
);

router.patch(
  '/:bookingId/status',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: (req) => ({ section: 'booking-management', bookingId: req.params.bookingId }) }),
  updateBookingStatusHandler
);

router.patch(
  '/:bookingId/schedule',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: (req) => ({ section: 'booking-management', bookingId: req.params.bookingId }) }),
  updateBookingScheduleHandler
);

router.patch(
  '/:bookingId/meta',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: (req) => ({ section: 'booking-management', bookingId: req.params.bookingId }) }),
  updateBookingMetaHandler
);

router.post(
  '/:bookingId/apply-template',
  authenticate,
  enforcePolicy('admin.bookings.write', { metadata: (req) => ({ section: 'booking-management', bookingId: req.params.bookingId }) }),
  applyTemplateHandler
);

export default router;
