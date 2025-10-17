import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getProviderCustomJobWorkspaceHandler,
  searchProviderCustomJobOpportunitiesHandler,
  createProviderCustomJobHandler,
  submitProviderCustomJobBidHandler,
  updateProviderCustomJobBidHandler,
  withdrawProviderCustomJobBidHandler,
  addProviderCustomJobBidMessageHandler,
  inviteProviderCustomJobParticipantHandler,
  updateProviderCustomJobInvitationHandler,
  createProviderCustomJobReportHandler,
  updateProviderCustomJobReportHandler,
  deleteProviderCustomJobReportHandler
} from '../controllers/providerCustomJobController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.get(
  '/custom-jobs/workspace',
  authenticate,
  enforcePolicy('panel.provider.customJobs.view'),
  getProviderCustomJobWorkspaceHandler
);

router.get(
  '/custom-jobs/opportunities',
  authenticate,
  enforcePolicy('panel.provider.customJobs.view'),
  searchProviderCustomJobOpportunitiesHandler
);

router.post(
  '/custom-jobs',
  authenticate,
  enforcePolicy('panel.provider.customJobs.manage', {
    metadata: (req) => ({ title: req.body?.title || null })
  }),
  [
    body('title').isString().trim().isLength({ min: 3, max: 160 }),
    body('description').optional({ nullable: true }).isString().trim().isLength({ max: 5000 }),
    body('zoneId').optional({ checkFalsy: true }).isUUID(),
    body('budgetAmount')
      .optional({ nullable: true })
      .custom((value) => {
        if (value === null || value === '') {
          return true;
        }
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0;
      }),
    body('currency')
      .optional({ checkFalsy: true })
      .isString()
      .isLength({ min: 3, max: 3 })
      .matches(/^[A-Za-z]{3}$/),
    body('allowOutOfZone').optional().isBoolean(),
    body('bidDeadline').optional({ checkFalsy: true }).isISO8601(),
    body('attachments').optional().isArray({ max: 6 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('invites').optional().isArray({ max: 20 }),
    body('invites.*.type').optional({ checkFalsy: true }).isIn(['provider', 'serviceman', 'user']),
    body('invites.*.targetId').optional({ checkFalsy: true }).isUUID(),
    body('invites.*.targetEmail').optional({ checkFalsy: true }).isEmail(),
    body('invites.*.targetHandle').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
    body('invites.*.note').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 })
  ],
  validate,
  createProviderCustomJobHandler
);

router.post(
  '/custom-jobs/opportunities/:postId/bids',
  authenticate,
  enforcePolicy('panel.provider.customJobs.bid', {
    metadata: (req) => ({
      postId: req.params.postId,
      currency: req.body?.currency || null,
      hasAmount: typeof req.body?.amount === 'number'
    })
  }),
  [
    param('postId').isUUID(),
    body('amount').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
    body('currency')
      .optional({ checkFalsy: true })
      .isString()
      .isLength({ min: 3, max: 3 })
      .matches(/^[A-Za-z]{3}$/),
    body('message').optional({ checkFalsy: true }).isString().trim().isLength({ max: 2000 }),
    body('attachments').optional().isArray({ max: 5 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  validate,
  submitProviderCustomJobBidHandler
);

router.patch(
  '/custom-jobs/bids/:bidId',
  authenticate,
  enforcePolicy('panel.provider.customJobs.bid', {
    metadata: (req) => ({ bidId: req.params.bidId })
  }),
  [
    param('bidId').isUUID(),
    body('amount').optional({ nullable: true }).custom((value) => {
      if (value === null || value === '') {
        return true;
      }
      if (typeof value === 'number') {
        return value > 0;
      }
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) && parsed > 0;
    }),
    body('currency')
      .optional({ checkFalsy: true })
      .isString()
      .isLength({ min: 3, max: 3 })
      .matches(/^[A-Za-z]{3}$/),
    body('message').optional({ nullable: true }).isString().trim().isLength({ max: 2000 })
  ],
  validate,
  updateProviderCustomJobBidHandler
);

router.post(
  '/custom-jobs/bids/:bidId/withdraw',
  authenticate,
  enforcePolicy('panel.provider.customJobs.bid', {
    metadata: (req) => ({ bidId: req.params.bidId, action: 'withdraw' })
  }),
  [param('bidId').isUUID()],
  validate,
  withdrawProviderCustomJobBidHandler
);

router.post(
  '/custom-jobs/bids/:bidId/messages',
  authenticate,
  enforcePolicy('panel.provider.customJobs.message', {
    metadata: (req) => ({ bidId: req.params.bidId })
  }),
  [
    param('bidId').isUUID(),
    body('body').isString().trim().isLength({ min: 1, max: 2000 }),
    body('attachments').optional().isArray({ max: 5 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  validate,
  addProviderCustomJobBidMessageHandler
);

router.post(
  '/custom-jobs/:postId/invitations',
  authenticate,
  enforcePolicy('panel.provider.customJobs.manage', {
    metadata: (req) => ({ postId: req.params.postId, inviteType: req.body?.type || null })
  }),
  [
    param('postId').isUUID(),
    body('type').optional({ checkFalsy: true }).isIn(['provider', 'serviceman', 'user']),
    body('targetId').optional({ checkFalsy: true }).isUUID(),
    body('targetEmail').optional({ checkFalsy: true }).isEmail(),
    body('targetHandle').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
    body('note').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 })
  ],
  validate,
  inviteProviderCustomJobParticipantHandler
);

router.patch(
  '/custom-jobs/invitations/:invitationId',
  authenticate,
  enforcePolicy('panel.provider.customJobs.manage', {
    metadata: (req) => ({ invitationId: req.params.invitationId, status: req.body?.status || null })
  }),
  [
    param('invitationId').isUUID(),
    body('status').optional({ checkFalsy: true }).isIn(['pending', 'accepted', 'declined', 'cancelled']),
    body('targetId')
      .optional({ nullable: true })
      .custom((value) => value === null || typeof value === 'string')
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true;
        }
        return /^[0-9a-fA-F-]{36}$/.test(value);
      }),
    body('targetEmail').optional({ nullable: true, checkFalsy: true }).isEmail(),
    body('targetHandle').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 160 }),
    body('note').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 500 }),
    body('contactId').optional({ nullable: true, checkFalsy: true }).isUUID()
  ],
  validate,
  updateProviderCustomJobInvitationHandler
);

router.post(
  '/custom-jobs/reports',
  authenticate,
  enforcePolicy('panel.provider.customJobs.report'),
  [body('name').isString().trim().isLength({ min: 3, max: 160 })],
  validate,
  createProviderCustomJobReportHandler
);

router.put(
  '/custom-jobs/reports/:reportId',
  authenticate,
  enforcePolicy('panel.provider.customJobs.report'),
  [param('reportId').isUUID(), body('name').optional({ checkFalsy: true }).isString().trim().isLength({ min: 3, max: 160 })],
  validate,
  updateProviderCustomJobReportHandler
);

router.delete(
  '/custom-jobs/reports/:reportId',
  authenticate,
  enforcePolicy('panel.provider.customJobs.report'),
  [param('reportId').isUUID()],
  validate,
  deleteProviderCustomJobReportHandler
);

export default router;
