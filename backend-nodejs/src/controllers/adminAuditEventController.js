import { body, query, validationResult } from 'express-validator';
import {
  AUDIT_EVENT_CATEGORIES,
  AUDIT_EVENT_STATUSES,
  AUDIT_EVENT_TIMEFRAMES,
  listAdminAuditEvents,
  createAdminAuditEvent,
  updateAdminAuditEvent,
  deleteAdminAuditEvent
} from '../services/adminAuditEventService.js';

const ATTACHMENT_VALIDATION = [
  body('attachments')
    .optional()
    .isArray({ max: 10 })
    .withMessage('attachments must be an array with at most 10 items'),
  body('attachments.*.label')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 160 })
    .withMessage('attachment label must be 160 characters or fewer'),
  body('attachments.*.url')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('attachment URL must be an http(s) URL')
];

export const listAuditEventValidators = [
  query('timeframe')
    .optional()
    .isIn(AUDIT_EVENT_TIMEFRAMES)
    .withMessage('timeframe must be one of 7d, 30d, 90d'),
  query('category')
    .optional()
    .isIn(AUDIT_EVENT_CATEGORIES)
    .withMessage('category is not recognised'),
  query('status')
    .optional()
    .isIn(AUDIT_EVENT_STATUSES)
    .withMessage('status is not recognised')
];

export const createAuditEventValidators = [
  body('title').isString().trim().isLength({ min: 3, max: 160 }).withMessage('title must be 3-160 characters'),
  body('summary').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  body('category').optional().isIn(AUDIT_EVENT_CATEGORIES).withMessage('category is not recognised'),
  body('status').optional().isIn(AUDIT_EVENT_STATUSES).withMessage('status is not recognised'),
  body('ownerName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('ownerTeam').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body('occurredAt').isISO8601().withMessage('occurredAt must be an ISO 8601 date'),
  body('dueAt').optional({ nullable: true }).isISO8601().withMessage('dueAt must be an ISO 8601 date'),
  body('metadata').optional().isObject().withMessage('metadata must be an object'),
  ...ATTACHMENT_VALIDATION
];

export const updateAuditEventValidators = [
  body('title').optional().isString().trim().isLength({ min: 3, max: 160 }),
  body('summary').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  body('category').optional().isIn(AUDIT_EVENT_CATEGORIES).withMessage('category is not recognised'),
  body('status').optional().isIn(AUDIT_EVENT_STATUSES).withMessage('status is not recognised'),
  body('ownerName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('ownerTeam').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body('occurredAt').optional().isISO8601().withMessage('occurredAt must be an ISO 8601 date'),
  body('dueAt').optional({ nullable: true }).isISO8601().withMessage('dueAt must be an ISO 8601 date'),
  body('metadata').optional().isObject().withMessage('metadata must be an object'),
  ...ATTACHMENT_VALIDATION
];

export async function listAuditEventsHandler(req, res, next) {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    return res.status(422).json({ errors: validation.array() });
  }

  try {
    const payload = await listAdminAuditEvents({
      timeframe: req.query.timeframe,
      category: req.query.category,
      status: req.query.status,
      timezone: req.app?.get?.('dashboards:defaultTimezone') ?? 'Europe/London'
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createAuditEventHandler(req, res, next) {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    return res.status(422).json({ errors: validation.array() });
  }

  try {
    const event = await createAdminAuditEvent(req.body ?? {}, req.user?.id ?? null);
    res.status(201).json({ event });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

export async function updateAuditEventHandler(req, res, next) {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    return res.status(422).json({ errors: validation.array() });
  }

  try {
    const event = await updateAdminAuditEvent(req.params.id, req.body ?? {}, req.user?.id ?? null);
    res.json({ event });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}

export async function deleteAuditEventHandler(req, res, next) {
  try {
    await deleteAdminAuditEvent(req.params.id);
    res.status(204).end();
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
}
