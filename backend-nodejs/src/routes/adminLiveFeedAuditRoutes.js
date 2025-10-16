import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listLiveFeedAuditsHandler,
  getLiveFeedAuditHandler,
  createLiveFeedAuditHandler,
  updateLiveFeedAuditHandler,
  createLiveFeedAuditNoteHandler,
  updateLiveFeedAuditNoteHandler,
  deleteLiveFeedAuditNoteHandler
} from '../controllers/liveFeedAuditController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  enforcePolicy('admin.live-feed.audit.read', {
    metadata: (req) => ({ query: req.query ?? {} })
  }),
  listLiveFeedAuditsHandler
);

router.get(
  '/:auditId',
  authenticate,
  enforcePolicy('admin.live-feed.audit.read', {
    metadata: (req) => ({ auditId: req.params.auditId })
  }),
  [param('auditId').isUUID()],
  getLiveFeedAuditHandler
);

const eventStatuses = ['open', 'investigating', 'resolved', 'dismissed'];
const eventSeverities = ['info', 'low', 'medium', 'high', 'critical'];

router.post(
  '/',
  authenticate,
  enforcePolicy('admin.live-feed.audit.write', {
    metadata: () => ({ method: 'create' })
  }),
  [
    body('eventType').isString().trim().isLength({ min: 3, max: 64 }),
    body('summary').isString().trim().isLength({ min: 5, max: 255 }),
    body('details').optional({ checkFalsy: true }).isString().trim().isLength({ max: 5000 }),
    body('status').optional({ checkFalsy: true }).isIn(eventStatuses),
    body('severity').optional({ checkFalsy: true }).isIn(eventSeverities),
    body('resourceType').optional({ checkFalsy: true }).isString().trim().isLength({ max: 64 }),
    body('resourceId').optional({ checkFalsy: true }).isString().trim().isLength({ max: 64 }),
    body('postId').optional({ checkFalsy: true }).isUUID(),
    body('zoneId').optional({ checkFalsy: true }).isUUID(),
    body('companyId').optional({ checkFalsy: true }).isUUID(),
    body('assigneeId').optional({ checkFalsy: true }).isUUID(),
    body('nextActionAt').optional({ checkFalsy: true }).isISO8601(),
    body('occurredAt').optional({ checkFalsy: true }).isISO8601(),
    body('attachments').optional().isArray({ max: 10 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('tags').optional().isArray({ max: 20 }),
    body('tags.*').optional().isString().trim().isLength({ max: 64 }),
    body('metadata').optional().isObject(),
    body('postSnapshot').optional().isObject(),
    body('zoneSnapshot').optional().isObject(),
    body('actorSnapshot').optional().isObject()
  ],
  createLiveFeedAuditHandler
);

router.patch(
  '/:auditId',
  authenticate,
  enforcePolicy('admin.live-feed.audit.write', {
    metadata: (req) => ({ auditId: req.params.auditId, method: 'update' })
  }),
  [
    param('auditId').isUUID(),
    body('status').optional({ checkFalsy: true }).isIn(eventStatuses),
    body('severity').optional({ checkFalsy: true }).isIn(eventSeverities),
    body('summary').optional({ checkFalsy: true }).isString().trim().isLength({ min: 5, max: 255 }),
    body('details').optional({ checkFalsy: true }).isString().trim().isLength({ max: 5000 }),
    body('assigneeId').optional({ checkFalsy: true }).isUUID(),
    body('nextActionAt').optional({ checkFalsy: true }).isISO8601(),
    body('attachments').optional().isArray({ max: 10 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('tags').optional().isArray({ max: 20 }),
    body('tags.*').optional().isString().trim().isLength({ max: 64 }),
    body('metadata').optional().isObject()
  ],
  updateLiveFeedAuditHandler
);

router.post(
  '/:auditId/notes',
  authenticate,
  enforcePolicy('admin.live-feed.audit.write', {
    metadata: (req) => ({ auditId: req.params.auditId, method: 'note:create' })
  }),
  [
    param('auditId').isUUID(),
    body('note').isString().trim().isLength({ min: 3, max: 4000 }),
    body('tags').optional().isArray({ max: 20 }),
    body('tags.*').optional().isString().trim().isLength({ max: 64 })
  ],
  createLiveFeedAuditNoteHandler
);

router.patch(
  '/notes/:noteId',
  authenticate,
  enforcePolicy('admin.live-feed.audit.write', {
    metadata: (req) => ({ noteId: req.params.noteId, method: 'note:update' })
  }),
  [
    param('noteId').isUUID(),
    body('note').optional({ checkFalsy: true }).isString().trim().isLength({ min: 1, max: 4000 }),
    body('tags').optional().isArray({ max: 20 }),
    body('tags.*').optional().isString().trim().isLength({ max: 64 })
  ],
  updateLiveFeedAuditNoteHandler
);

router.delete(
  '/notes/:noteId',
  authenticate,
  enforcePolicy('admin.live-feed.audit.write', {
    metadata: (req) => ({ noteId: req.params.noteId, method: 'note:delete' })
  }),
  [param('noteId').isUUID()],
  deleteLiveFeedAuditNoteHandler
);

export default router;
