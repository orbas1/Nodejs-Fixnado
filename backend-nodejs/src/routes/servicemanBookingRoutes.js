import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  getWorkspaceHandler,
  updateSettingsHandler,
  updateStatusHandler,
  updateScheduleHandler,
  updateDetailsHandler,
  createNoteHandler,
  createTimelineEntryHandler
} from '../controllers/servicemanBookingController.js';

const router = Router();

const timezoneValidator = query('timezone').optional().isString().isLength({ min: 2, max: 64 });
const servicemanIdParam = query('servicemanId').optional().isUUID(4);

router.get(
  '/workspace',
  authenticate,
  enforcePolicy('serviceman.bookings.view'),
  [timezoneValidator, servicemanIdParam],
  getWorkspaceHandler
);

router.patch(
  '/settings',
  authenticate,
  enforcePolicy('serviceman.bookings.manage'),
  [
    body('autoAcceptAssignments').optional().isBoolean(),
    body('travelBufferMinutes').optional().isInt({ min: 0, max: 480 }),
    body('maxDailyJobs').optional().isInt({ min: 1, max: 24 }),
    body('preferredContactChannel').optional().isIn(['sms', 'call', 'email', 'push']),
    body('defaultArrivalWindow.start').optional().matches(/^\d{2}:\d{2}$/),
    body('defaultArrivalWindow.end').optional().matches(/^\d{2}:\d{2}$/),
    body('defaultArrivalWindowStart').optional().matches(/^\d{2}:\d{2}$/),
    body('defaultArrivalWindowEnd').optional().matches(/^\d{2}:\d{2}$/),
    body('notesTemplate').optional().isString(),
    body('safetyBriefTemplate').optional().isString(),
    body('quickReplies').optional().isArray({ max: 12 }),
    body('quickReplies.*').optional().isString().isLength({ max: 160 }),
    body('defaultChecklist').optional().isArray({ max: 20 }),
    body('defaultChecklist.*.id').optional().isString().isLength({ max: 120 }),
    body('defaultChecklist.*.label').optional().isString().isLength({ max: 240 }),
    body('defaultChecklist.*.mandatory').optional().isBoolean(),
    body('assetLibrary').optional().isArray({ max: 10 }),
    body('assetLibrary.*.url').optional().isURL({ require_protocol: true }),
    body('assetLibrary.*.label').optional().isString().isLength({ max: 160 }),
    body('assetLibrary.*.type').optional().isString().isLength({ max: 32 })
  ],
  updateSettingsHandler
);

const bookingIdParam = param('bookingId').isUUID(4);

router.patch(
  '/:bookingId/status',
  authenticate,
  enforcePolicy('serviceman.bookings.manage'),
  [bookingIdParam, body('status').isString().isLength({ min: 1, max: 64 }), body('reason').optional().isString()],
  updateStatusHandler
);

router.patch(
  '/:bookingId/schedule',
  authenticate,
  enforcePolicy('serviceman.bookings.manage'),
  [
    bookingIdParam,
    body('scheduledStart').optional().isISO8601(),
    body('scheduledEnd').optional().isISO8601(),
    body('travelMinutes').optional().isInt({ min: 0, max: 480 })
  ],
  updateScheduleHandler
);

router.patch(
  '/:bookingId/details',
  authenticate,
  enforcePolicy('serviceman.bookings.manage'),
  [
    bookingIdParam,
    body('instructions').optional().isString(),
    body('summary').optional().isString(),
    body('notes').optional().isString(),
    body('checklist').optional().isArray({ max: 20 }),
    body('checklist.*.id').optional().isString().isLength({ max: 120 }),
    body('checklist.*.label').optional().isString().isLength({ max: 240 }),
    body('checklist.*.mandatory').optional().isBoolean(),
    body('attachments').optional().isArray({ max: 10 }),
    body('attachments.*.url').optional().isURL({ require_protocol: true }),
    body('attachments.*.label').optional().isString().isLength({ max: 160 }),
    body('attachments.*.type').optional().isString().isLength({ max: 32 }),
    body('tags').optional().custom((value) => {
      if (Array.isArray(value)) {
        return value.every((tag) => typeof tag === 'string');
      }
      return typeof value === 'string';
    }),
    body('images').optional().isArray({ max: 10 }),
    body('images.*.url').optional().isURL({ require_protocol: true }),
    body('images.*.label').optional().isString().isLength({ max: 160 }),
    body('images.*.type').optional().isString().isLength({ max: 32 })
  ],
  updateDetailsHandler
);

router.post(
  '/:bookingId/notes',
  authenticate,
  enforcePolicy('serviceman.bookings.manage'),
  [
    bookingIdParam,
    body('body').isString().isLength({ min: 1 }),
    body('attachments').optional().isArray({ max: 10 }),
    body('attachments.*.url').optional().isURL({ require_protocol: true }),
    body('attachments.*.label').optional().isString().isLength({ max: 160 }),
    body('attachments.*.type').optional().isString().isLength({ max: 32 })
  ],
  createNoteHandler
);

router.post(
  '/:bookingId/history',
  authenticate,
  enforcePolicy('serviceman.bookings.manage'),
  [
    bookingIdParam,
    body('title').optional().isString().isLength({ min: 1, max: 160 }),
    body('entryType').optional().isIn(['note', 'status_update', 'milestone', 'handoff', 'document']),
    body('status').optional().isIn(['open', 'in_progress', 'blocked', 'completed', 'cancelled']),
    body('summary').optional().isString(),
    body('occurredAt').optional().isISO8601(),
    body('attachments').optional().isArray({ max: 10 }),
    body('attachments.*.url').optional().isURL({ require_protocol: true }),
    body('attachments.*.label').optional().isString().isLength({ max: 160 }),
    body('attachments.*.type').optional().isString().isLength({ max: 32 }),
    body('meta').optional().isObject()
  ],
  createTimelineEntryHandler
);

export default router;
