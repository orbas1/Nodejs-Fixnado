import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getProviderCrewManagementHandler,
  createProviderCrewMemberHandler,
  updateProviderCrewMemberHandler,
  deleteProviderCrewMemberHandler,
  upsertProviderCrewAvailabilityHandler,
  deleteProviderCrewAvailabilityHandler,
  upsertProviderCrewDeploymentHandler,
  deleteProviderCrewDeploymentHandler,
  upsertProviderCrewDelegationHandler,
  deleteProviderCrewDelegationHandler
} from '../controllers/providerCrewController.js';
import {
  getProviderDisputes,
  createProviderDisputeCase,
  updateProviderDisputeCase,
  deleteProviderDisputeCase,
  createProviderDisputeTask,
  updateProviderDisputeTask,
  deleteProviderDisputeTask,
  createProviderDisputeNote,
  updateProviderDisputeNote,
  deleteProviderDisputeNote,
  createProviderDisputeEvidence,
  updateProviderDisputeEvidence,
  deleteProviderDisputeEvidence
} from '../controllers/providerDisputeController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const withCrewPolicy = enforcePolicy('provider.control.crew', {
  metadata: (req) => ({
    companyId: req.query?.companyId || req.body?.companyId || null,
    path: req.path
  })
});

const withDisputePolicy = enforcePolicy('provider.control.disputes', {
  metadata: (req) => ({
    companyId: req.query?.companyId || req.body?.companyId || null,
    path: req.path
  })
});

const disputeCaseValidators = () => [
  body('caseNumber').optional({ values: 'falsy' }).isString().trim().isLength({ max: 32 }),
  body('disputeId').optional({ values: 'falsy' }).isUUID(4),
  body('title').isString().trim().isLength({ min: 3, max: 200 }),
  body('category').optional({ values: 'falsy' }).isIn(['billing', 'service_quality', 'damage', 'timeline', 'compliance', 'other']),
  body('status').optional({ values: 'falsy' }).isIn(['draft', 'open', 'under_review', 'awaiting_customer', 'resolved', 'closed']),
  body('severity').optional({ values: 'falsy' }).isIn(['low', 'medium', 'high', 'critical']),
  body('summary').optional({ values: 'falsy' }).isString().trim().isLength({ max: 4000 }),
  body('nextStep').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
  body('assignedTeam').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('assignedOwner').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('resolutionNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 4000 }),
  body('externalReference').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('amountDisputed').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100000000 }).toFloat(),
  body('currency').optional({ values: 'falsy' }).isString().trim().isLength({ min: 3, max: 12 }),
  body('openedAt').optional({ values: 'falsy' }).isISO8601(),
  body('dueAt').optional({ values: 'falsy' }).isISO8601(),
  body('resolvedAt').optional({ values: 'falsy' }).isISO8601(),
  body('slaDueAt').optional({ values: 'falsy' }).isISO8601(),
  body('requiresFollowUp').optional().isBoolean().toBoolean(),
  body('lastReviewedAt').optional({ values: 'falsy' }).isISO8601()
];

const disputeTaskValidators = () => [
  body('label').isString().trim().isLength({ min: 2, max: 160 }),
  body('status').optional({ values: 'falsy' }).isIn(['pending', 'in_progress', 'completed', 'cancelled']),
  body('dueAt').optional({ values: 'falsy' }).isISO8601(),
  body('assignedTo').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('instructions').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
  body('completedAt').optional({ values: 'falsy' }).isISO8601()
];

const disputeNoteValidators = () => [
  body('noteType').optional({ values: 'falsy' }).isIn(['update', 'call', 'decision', 'escalation', 'reminder', 'other']),
  body('visibility').optional({ values: 'falsy' }).isIn(['customer', 'internal', 'provider', 'finance', 'compliance']),
  body('body').isString().trim().isLength({ min: 2, max: 4000 }),
  body('nextSteps').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
  body('pinned').optional().isBoolean().toBoolean(),
  body('authorId').optional({ values: 'falsy' }).isUUID(4)
];

const disputeEvidenceValidators = () => [
  body('label').isString().trim().isLength({ min: 2, max: 200 }),
  body('fileUrl').isString().trim().isURL({ require_protocol: true }).isLength({ max: 512 }),
  body('fileType').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('thumbnailUrl').optional({ values: 'falsy' }).isString().trim().isURL({ require_protocol: true }).isLength({ max: 512 }),
  body('notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
  body('uploadedBy').optional({ values: 'falsy' }).isUUID(4)
];

router.use(authenticate);

router.get('/crew', withCrewPolicy, getProviderCrewManagementHandler);
router.post('/crew-members', withCrewPolicy, createProviderCrewMemberHandler);
router.put('/crew-members/:crewMemberId', withCrewPolicy, updateProviderCrewMemberHandler);
router.delete('/crew-members/:crewMemberId', withCrewPolicy, deleteProviderCrewMemberHandler);

router.post('/crew-members/:crewMemberId/availability', withCrewPolicy, upsertProviderCrewAvailabilityHandler);
router.put(
  '/crew-members/:crewMemberId/availability/:availabilityId',
  withCrewPolicy,
  upsertProviderCrewAvailabilityHandler
);
router.delete(
  '/crew-members/:crewMemberId/availability/:availabilityId',
  withCrewPolicy,
  deleteProviderCrewAvailabilityHandler
);

router.post('/deployments', withCrewPolicy, upsertProviderCrewDeploymentHandler);
router.put('/deployments/:deploymentId', withCrewPolicy, upsertProviderCrewDeploymentHandler);
router.delete('/deployments/:deploymentId', withCrewPolicy, deleteProviderCrewDeploymentHandler);

router.post('/delegations', withCrewPolicy, upsertProviderCrewDelegationHandler);
router.put('/delegations/:delegationId', withCrewPolicy, upsertProviderCrewDelegationHandler);
router.delete('/delegations/:delegationId', withCrewPolicy, deleteProviderCrewDelegationHandler);

router.get('/disputes', withDisputePolicy, getProviderDisputes);
router.post('/disputes', withDisputePolicy, disputeCaseValidators(), createProviderDisputeCase);
router.put(
  '/disputes/:disputeCaseId',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), ...disputeCaseValidators()],
  updateProviderDisputeCase
);
router.delete(
  '/disputes/:disputeCaseId',
  withDisputePolicy,
  param('disputeCaseId').isUUID(4),
  deleteProviderDisputeCase
);

router.post(
  '/disputes/:disputeCaseId/tasks',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), ...disputeTaskValidators()],
  createProviderDisputeTask
);
router.put(
  '/disputes/:disputeCaseId/tasks/:taskId',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), param('taskId').isUUID(4), ...disputeTaskValidators()],
  updateProviderDisputeTask
);
router.delete(
  '/disputes/:disputeCaseId/tasks/:taskId',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), param('taskId').isUUID(4)],
  deleteProviderDisputeTask
);

router.post(
  '/disputes/:disputeCaseId/notes',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), ...disputeNoteValidators()],
  createProviderDisputeNote
);
router.put(
  '/disputes/:disputeCaseId/notes/:noteId',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), param('noteId').isUUID(4), ...disputeNoteValidators()],
  updateProviderDisputeNote
);
router.delete(
  '/disputes/:disputeCaseId/notes/:noteId',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), param('noteId').isUUID(4)],
  deleteProviderDisputeNote
);

router.post(
  '/disputes/:disputeCaseId/evidence',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), ...disputeEvidenceValidators()],
  createProviderDisputeEvidence
);
router.put(
  '/disputes/:disputeCaseId/evidence/:evidenceId',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), param('evidenceId').isUUID(4), ...disputeEvidenceValidators()],
  updateProviderDisputeEvidence
);
router.delete(
  '/disputes/:disputeCaseId/evidence/:evidenceId',
  withDisputePolicy,
  [param('disputeCaseId').isUUID(4), param('evidenceId').isUUID(4)],
  deleteProviderDisputeEvidence
);

export default router;
