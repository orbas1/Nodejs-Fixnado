import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getProviderCalendarHandler,
  updateProviderCalendarSettingsHandler,
  createProviderCalendarEventHandler,
  updateProviderCalendarEventHandler,
  deleteProviderCalendarEventHandler,
  updateProviderCalendarBookingHandler,
  createProviderCalendarBookingHandler
} from '../controllers/providerCalendarController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const companyQueryValidator = [query('companyId').isUUID(4).withMessage('companyId must be a valid UUID')];

const companyInBodyValidator = [
  body('companyId').optional().isUUID(4).withMessage('companyId must be a valid UUID'),
  query('companyId').optional().isUUID(4)
];

const eventValidators = [
  body('title').isString().trim().isLength({ min: 2, max: 160 }),
  body('start').isISO8601().withMessage('start must be an ISO 8601 timestamp'),
  body('end').optional({ nullable: true }).isISO8601().withMessage('end must be an ISO 8601 timestamp'),
  body('status')
    .optional()
    .isIn(['planned', 'confirmed', 'cancelled', 'tentative', 'standby', 'travel'])
    .withMessage('invalid status'),
  body('type')
    .optional()
    .isIn(['internal', 'hold', 'travel', 'maintenance', 'booking'])
    .withMessage('invalid event type'),
  body('visibility')
    .optional()
    .isIn(['internal', 'crew', 'public'])
    .withMessage('invalid visibility')
];

const bookingValidators = [
  body('start').isISO8601().withMessage('start must be an ISO 8601 timestamp'),
  body('end').optional({ nullable: true }).isISO8601().withMessage('end must be an ISO 8601 timestamp'),
  body('zoneId').isUUID(4).withMessage('zoneId must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['pending', 'awaiting_assignment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'disputed'])
    .withMessage('invalid booking status')
];

router.get(
  '/calendar',
  authenticate,
  enforcePolicy('provider.calendar.read'),
  companyQueryValidator,
  getProviderCalendarHandler
);

router.patch(
  '/calendar/settings',
  authenticate,
  enforcePolicy('provider.calendar.manage'),
  companyInBodyValidator,
  updateProviderCalendarSettingsHandler
);

router.post(
  '/calendar/events',
  authenticate,
  enforcePolicy('provider.calendar.manage'),
  companyInBodyValidator,
  eventValidators,
  createProviderCalendarEventHandler
);

router.patch(
  '/calendar/events/:eventId',
  authenticate,
  enforcePolicy('provider.calendar.manage'),
  param('eventId').isUUID(4).withMessage('eventId must be a valid UUID'),
  companyInBodyValidator,
  updateProviderCalendarEventHandler
);

router.delete(
  '/calendar/events/:eventId',
  authenticate,
  enforcePolicy('provider.calendar.manage'),
  param('eventId').isUUID(4).withMessage('eventId must be a valid UUID'),
  companyQueryValidator,
  deleteProviderCalendarEventHandler
);

router.patch(
  '/calendar/bookings/:bookingId',
  authenticate,
  enforcePolicy('provider.calendar.manage'),
  param('bookingId').isUUID(4).withMessage('bookingId must be a valid UUID'),
  companyInBodyValidator,
  updateProviderCalendarBookingHandler
);

router.post(
  '/calendar/bookings',
  authenticate,
  enforcePolicy('provider.calendar.manage'),
  companyInBodyValidator,
  bookingValidators,
  createProviderCalendarBookingHandler
);

export default router;
