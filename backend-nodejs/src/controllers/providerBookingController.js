import { body, param, query, validationResult } from 'express-validator';
import {
  getProviderBookingWorkspace,
  updateProviderBookingSettings,
  updateProviderBookingStatus,
  updateProviderBookingSchedule,
  updateProviderBookingDetails,
  createProviderBookingNote,
  createProviderTimelineEntry
} from '../services/providerBookingManagementService.js';

function handleValidation(req, res) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(422).json({ message: 'validation_failed', errors: result.array() });
    return false;
  }
  return true;
}

export const validateWorkspace = [query('companyId').optional().isUUID(), query('timezone').optional().isString()];

export async function getWorkspaceHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await getProviderBookingWorkspace({
      companyId: req.query.companyId,
      timezone: req.query.timezone || 'UTC',
      actor: req.user
    });
    res.json({ workspace: payload });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateUpdateSettings = [
  query('companyId').optional().isUUID(),
  body('dispatchStrategy').optional().isString().isIn(['round_robin', 'best_fit', 'manual_review']),
  body('autoAssignEnabled').optional().isBoolean(),
  body('defaultSlaHours').optional().isInt({ min: 1, max: 72 }),
  body('allowCustomerEdits').optional().isBoolean(),
  body('intakeChannels').optional().isArray(),
  body('escalationContacts').optional().isArray(),
  body('dispatchPlaybooks').optional().isArray(),
  body('notesTemplate').optional().isString().isLength({ max: 4000 }),
  body('metadata').optional().isObject()
];

export async function updateSettingsHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const settings = await updateProviderBookingSettings({
      companyId: req.query.companyId,
      actor: req.user,
      updates: req.body || {}
    });
    res.json({ settings });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateUpdateStatus = [
  query('companyId').optional().isUUID(),
  param('bookingId').isUUID(),
  body('status').isString().isLength({ min: 2, max: 64 }),
  body('reason').optional().isString().isLength({ max: 500 })
];

export async function updateStatusHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const booking = await updateProviderBookingStatus({
      companyId: req.query.companyId,
      actor: req.user,
      bookingId: req.params.bookingId,
      status: req.body?.status,
      reason: req.body?.reason
    });
    res.json({ booking });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateUpdateSchedule = [
  query('companyId').optional().isUUID(),
  param('bookingId').isUUID(),
  body('scheduledStart').optional().isISO8601(),
  body('scheduledEnd').optional().isISO8601(),
  body('travelMinutes').optional().isInt({ min: 0, max: 480 })
];

export async function updateScheduleHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const booking = await updateProviderBookingSchedule({
      companyId: req.query.companyId,
      actor: req.user,
      bookingId: req.params.bookingId,
      schedule: req.body || {}
    });
    res.json({ booking });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateUpdateDetails = [
  query('companyId').optional().isUUID(),
  param('bookingId').isUUID(),
  body('instructions').optional().isString(),
  body('summary').optional().isString(),
  body('tags').optional(),
  body('checklist').optional().isArray(),
  body('attachments').optional().isArray(),
  body('images').optional().isArray(),
  body('autoAssignEnabled').optional().isBoolean(),
  body('allowCustomerEdits').optional().isBoolean()
];

export async function updateDetailsHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const booking = await updateProviderBookingDetails({
      companyId: req.query.companyId,
      actor: req.user,
      bookingId: req.params.bookingId,
      updates: req.body || {}
    });
    res.json({ booking });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateCreateNote = [
  query('companyId').optional().isUUID(),
  param('bookingId').isUUID(),
  body('body').isString().isLength({ min: 1, max: 4000 }),
  body('attachments').optional().isArray()
];

export async function createNoteHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const note = await createProviderBookingNote({
      companyId: req.query.companyId,
      actor: req.user,
      bookingId: req.params.bookingId,
      body: req.body?.body,
      attachments: req.body?.attachments ?? []
    });
    res.status(201).json({ note });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateCreateTimelineEntry = [
  query('companyId').optional().isUUID(),
  param('bookingId').isUUID(),
  body('title').isString().isLength({ min: 2, max: 160 }),
  body('entryType').optional().isString().isLength({ min: 2, max: 64 }),
  body('status').optional().isString().isLength({ min: 2, max: 32 }),
  body('summary').optional().isString(),
  body('occurredAt').optional().isISO8601(),
  body('attachments').optional().isArray()
];

export async function createTimelineEntryHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const entry = await createProviderTimelineEntry({
      companyId: req.query.companyId,
      actor: req.user,
      bookingId: req.params.bookingId,
      title: req.body?.title,
      entryType: req.body?.entryType,
      status: req.body?.status,
      summary: req.body?.summary,
      occurredAt: req.body?.occurredAt,
      attachments: req.body?.attachments ?? []
    });
    res.status(201).json({ entry });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export default {
  getWorkspaceHandler,
  updateSettingsHandler,
  updateStatusHandler,
  updateScheduleHandler,
  updateDetailsHandler,
  createNoteHandler,
  createTimelineEntryHandler
};
