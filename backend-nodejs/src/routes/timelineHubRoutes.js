import { Router } from 'express';
import { query, body, param } from 'express-validator';
import {
  getTimelineHubHandler,
  getTimelineModerationQueueHandler,
  resolveTimelineModerationHandler,
  createChatwootSessionHandler
} from '../controllers/timelineHubController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  enforcePolicy('timeline.hub.read'),
  [
    query('timelineLimit').optional().isInt({ min: 1, max: 100 }),
    query('customJobLimit').optional().isInt({ min: 1, max: 100 }),
    query('marketplaceLimit').optional().isInt({ min: 1, max: 100 }),
    query('includeOutOfZone').optional().isBoolean(),
    query('outOfZoneOnly').optional().isBoolean()
  ],
  getTimelineHubHandler
);

router.get(
  '/moderation',
  authenticate,
  enforcePolicy('timeline.hub.moderate'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('statuses').optional().isString(),
    query('status').optional().isString(),
    query('severities').optional().isString(),
    query('severity').optional().isString(),
    query('zoneIds').optional().isString(),
    query('zoneId').optional().isString()
  ],
  getTimelineModerationQueueHandler
);

router.post(
  '/moderation/:auditId/actions',
  authenticate,
  enforcePolicy('timeline.hub.moderate'),
  [
    param('auditId').isUUID(),
    body('action')
      .optional({ checkFalsy: true })
      .isIn(['resolve', 'close', 'dismiss', 'escalate', 'investigate', 'reopen']),
    body('severity')
      .optional({ checkFalsy: true })
      .isIn(['info', 'low', 'medium', 'high', 'critical']),
    body('assigneeId').optional({ checkFalsy: true }).isUUID(),
    body('nextActionAt').optional({ checkFalsy: true }).isISO8601(),
    body('attachments').optional().isArray({ max: 10 }),
    body('attachments.*.url').optional().isURL({ require_protocol: true, protocols: ['http', 'https'] }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().isLength({ max: 120 }),
    body('tags').optional().isArray({ max: 20 }),
    body('tags.*').optional().isString().isLength({ max: 64 }),
    body('metadata').optional().isObject(),
    body('summary').optional({ checkFalsy: true }).isString().isLength({ max: 255 }),
    body('details').optional({ checkFalsy: true }).isString(),
    body('note').optional({ checkFalsy: true }).isString().isLength({ max: 4000 }),
    body('noteTags').optional().isArray({ max: 10 }),
    body('noteTags.*').optional().isString().isLength({ max: 64 })
  ],
  resolveTimelineModerationHandler
);

router.post(
  '/support/chatwoot/sessions',
  authenticate,
  enforcePolicy('timeline.support.session'),
  [
    body('email').optional({ checkFalsy: true }).isEmail(),
    body('name').optional({ checkFalsy: true }).isString().isLength({ max: 160 }),
    body('persona').optional({ checkFalsy: true }).isString().isLength({ max: 60 }),
    body('locale').optional({ checkFalsy: true }).isString().isLength({ max: 16 }),
    body('metadata').optional().isObject()
  ],
  createChatwootSessionHandler
);

export default router;
