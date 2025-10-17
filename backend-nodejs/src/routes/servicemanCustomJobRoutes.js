import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listServicemanCustomJobsHandler,
  getServicemanCustomJobHandler,
  createServicemanCustomJobBidHandler,
  updateServicemanCustomJobBidHandler,
  withdrawServicemanCustomJobBidHandler,
  addServicemanCustomJobBidMessageHandler,
  getServicemanCustomJobReportsHandler
} from '../controllers/servicemanCustomJobController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  enforcePolicy('serviceman.customJobs.read', {
    metadata: (req) => ({ status: req.query?.status ?? 'open', zoneId: req.query?.zoneId ?? null })
  }),
  [
    query('status').optional({ checkFalsy: true }).isIn(['open', 'assigned', 'completed', 'cancelled', 'awarded', 'pending', 'all']),
    query('zoneId').optional({ checkFalsy: true }).isUUID(),
    query('search').optional({ checkFalsy: true }).isString().isLength({ max: 160 }),
    query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
    query('offset').optional({ checkFalsy: true }).isInt({ min: 0 })
  ],
  listServicemanCustomJobsHandler
);

router.get(
  '/reports',
  authenticate,
  enforcePolicy('serviceman.customJobs.reports'),
  [
    query('rangeStart').optional({ checkFalsy: true }).isISO8601(),
    query('rangeEnd').optional({ checkFalsy: true }).isISO8601()
  ],
  getServicemanCustomJobReportsHandler
);

router.get(
  '/:id',
  authenticate,
  enforcePolicy('serviceman.customJobs.read', { metadata: (req) => ({ jobId: req.params.id }) }),
  [param('id').isUUID()],
  getServicemanCustomJobHandler
);

router.post(
  '/:id/bids',
  authenticate,
  enforcePolicy('serviceman.customJobs.write', { metadata: (req) => ({ jobId: req.params.id, action: 'create-bid' }) }),
  [
    param('id').isUUID(),
    body('amount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('currency').optional({ checkFalsy: true }).isString().matches(/^[A-Za-z]{3}$/),
    body('message').optional({ checkFalsy: true }).isString().trim().isLength({ max: 2000 }),
    body('attachments').optional().isArray({ max: 5 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  createServicemanCustomJobBidHandler
);

router.patch(
  '/:id/bids/:bidId',
  authenticate,
  enforcePolicy('serviceman.customJobs.write', {
    metadata: (req) => ({ jobId: req.params.id, bidId: req.params.bidId, action: 'update-bid' })
  }),
  [
    param('id').isUUID(),
    param('bidId').isUUID(),
    body('amount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('currency').optional({ checkFalsy: true }).isString().matches(/^[A-Za-z]{3}$/),
    body('message').optional({ checkFalsy: true }).isString().trim().isLength({ max: 2000 }),
    body('metadata').optional().isObject()
  ],
  updateServicemanCustomJobBidHandler
);

router.post(
  '/:id/bids/:bidId/withdraw',
  authenticate,
  enforcePolicy('serviceman.customJobs.write', {
    metadata: (req) => ({ jobId: req.params.id, bidId: req.params.bidId, action: 'withdraw-bid' })
  }),
  [
    param('id').isUUID(),
    param('bidId').isUUID(),
    body('reason').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 })
  ],
  withdrawServicemanCustomJobBidHandler
);

router.post(
  '/:id/bids/:bidId/messages',
  authenticate,
  enforcePolicy('serviceman.customJobs.write', {
    metadata: (req) => ({ jobId: req.params.id, bidId: req.params.bidId, action: 'message' })
  }),
  [
    param('id').isUUID(),
    param('bidId').isUUID(),
    body('body').isString().trim().isLength({ min: 1, max: 2000 }),
    body('attachments').optional().isArray({ max: 5 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  addServicemanCustomJobBidMessageHandler
);

export default router;
