import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listProviderEscrowsHandler,
  getProviderEscrowHandler,
  updateProviderEscrowHandler,
  addProviderEscrowNoteHandler,
  deleteProviderEscrowNoteHandler,
  upsertProviderEscrowMilestoneHandler,
  deleteProviderEscrowMilestoneHandler,
  createProviderEscrowHandler,
  listProviderReleasePoliciesHandler,
  createProviderReleasePolicyHandler,
  updateProviderReleasePolicyHandler,
  deleteProviderReleasePolicyHandler
} from '../controllers/providerEscrowController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import { Permissions } from '../services/accessControlService.js';

const router = Router();

const providerReadPolicy = (metadata) =>
  enforcePolicy({
    id: 'provider.escrows.read',
    version: '1.0.0',
    resource: 'provider.escrows',
    action: 'provider.escrows:read',
    description: 'Allow provider organisations to review escrow records tied to their service orders.',
    requirements: [Permissions.PROVIDER_ESCROW_READ],
    tags: ['provider', 'escrow', 'finance'],
    metadata
  });

const providerWritePolicy = (metadata) =>
  enforcePolicy({
    id: 'provider.escrows.write',
    version: '1.0.0',
    resource: 'provider.escrows',
    action: 'provider.escrows:write',
    description: 'Allow provider finance teams to update escrow metadata, milestones, and release policies.',
    requirements: [Permissions.PROVIDER_ESCROW_WRITE],
    tags: ['provider', 'escrow', 'finance'],
    metadata
  });

router.get(
  '/policies',
  authenticate,
  providerReadPolicy((req) => ({ action: 'list-policies', persona: req.headers['x-fixnado-persona'] || null })),
  listProviderReleasePoliciesHandler
);

router.post(
  '/policies',
  authenticate,
  providerWritePolicy((req) => ({ action: 'create-policy', persona: req.headers['x-fixnado-persona'] || null })),
  [body('name').isString().trim().isLength({ min: 1 })],
  createProviderReleasePolicyHandler
);

router.patch(
  '/policies/:policyId',
  authenticate,
  providerWritePolicy((req) => ({ action: 'update-policy', policyId: req.params.policyId })),
  [param('policyId').isString()],
  updateProviderReleasePolicyHandler
);

router.delete(
  '/policies/:policyId',
  authenticate,
  providerWritePolicy((req) => ({ action: 'delete-policy', policyId: req.params.policyId })),
  [param('policyId').isString()],
  deleteProviderReleasePolicyHandler
);

router.get(
  '/',
  authenticate,
  providerReadPolicy((req) => ({ action: 'list', persona: req.headers['x-fixnado-persona'] || null })),
  [
    query('status').optional().isString(),
    query('policyId').optional().isString(),
    query('onHold').optional().isString(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 })
  ],
  listProviderEscrowsHandler
);

router.post(
  '/',
  authenticate,
  providerWritePolicy(() => ({ action: 'create' })),
  [
    body('orderId').isUUID(),
    body('amount').optional().isNumeric(),
    body('milestones').optional().isArray()
  ],
  createProviderEscrowHandler
);

router.get(
  '/:id',
  authenticate,
  providerReadPolicy((req) => ({ action: 'detail', escrowId: req.params.id })),
  [param('id').isUUID()],
  getProviderEscrowHandler
);

router.patch(
  '/:id',
  authenticate,
  providerWritePolicy((req) => ({ action: 'update', escrowId: req.params.id })),
  [param('id').isUUID()],
  updateProviderEscrowHandler
);

router.post(
  '/:id/notes',
  authenticate,
  providerWritePolicy((req) => ({ action: 'add-note', escrowId: req.params.id })),
  [param('id').isUUID(), body('body').isString().trim().isLength({ min: 1 })],
  addProviderEscrowNoteHandler
);

router.delete(
  '/:id/notes/:noteId',
  authenticate,
  providerWritePolicy((req) => ({ action: 'delete-note', escrowId: req.params.id, noteId: req.params.noteId })),
  [param('id').isUUID(), param('noteId').isString()],
  deleteProviderEscrowNoteHandler
);

router.post(
  '/:id/milestones',
  authenticate,
  providerWritePolicy((req) => ({ action: 'create-milestone', escrowId: req.params.id })),
  [param('id').isUUID(), body('label').isString().trim().isLength({ min: 1 })],
  upsertProviderEscrowMilestoneHandler
);

router.patch(
  '/:id/milestones/:milestoneId',
  authenticate,
  providerWritePolicy((req) => ({
    action: 'update-milestone',
    escrowId: req.params.id,
    milestoneId: req.params.milestoneId
  })),
  [param('id').isUUID(), param('milestoneId').isString()],
  (req, res, next) => {
    req.body = { ...(req.body ?? {}), id: req.params.milestoneId };
    return upsertProviderEscrowMilestoneHandler(req, res, next);
  }
);

router.delete(
  '/:id/milestones/:milestoneId',
  authenticate,
  providerWritePolicy((req) => ({
    action: 'delete-milestone',
    escrowId: req.params.id,
    milestoneId: req.params.milestoneId
  })),
  [param('id').isUUID(), param('milestoneId').isString()],
  deleteProviderEscrowMilestoneHandler
);

export default router;
