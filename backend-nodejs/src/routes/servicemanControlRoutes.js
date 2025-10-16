import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getServicemanDisputes,
  createServicemanDisputeCase,
  updateServicemanDisputeCase,
  deleteServicemanDisputeCase,
  createServicemanDisputeTask,
  updateServicemanDisputeTask,
  deleteServicemanDisputeTask,
  createServicemanDisputeNote,
  updateServicemanDisputeNote,
  deleteServicemanDisputeNote,
  createServicemanDisputeEvidence,
  updateServicemanDisputeEvidence,
  deleteServicemanDisputeEvidence
} from '../controllers/servicemanControlController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const ensureServicemanPersona = (req, res, next) => {
  const headerPersona = `${req.headers['x-fixnado-persona'] ?? ''}`.toLowerCase();
  const actorPersona = `${req.auth?.actor?.persona ?? ''}`.toLowerCase();
  const fallbackPersona = `${req.user?.persona ?? req.user?.type ?? ''}`.toLowerCase();
  const persona = headerPersona || actorPersona || fallbackPersona;
  const allowed = new Set(['serviceman', 'servicemen', 'crew', 'technician']);

  if (persona && !allowed.has(persona)) {
    return res.status(403).json({ message: 'persona_forbidden' });
  }

  return next();
};

const guard = (surface) =>
  enforcePolicy('serviceman.control.manage', {
    metadata: (req) => ({
      surface,
      persona: req.headers['x-fixnado-persona'] || null
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

router.use(authenticate, ensureServicemanPersona);

router.get('/disputes', guard('disputes:read'), getServicemanDisputes);
router.post('/disputes', guard('disputes:create'), disputeCaseValidators(), createServicemanDisputeCase);
router.put(
  '/disputes/:disputeCaseId',
  guard('disputes:update'),
  [param('disputeCaseId').isUUID(4), ...disputeCaseValidators()],
  updateServicemanDisputeCase
);
router.delete(
  '/disputes/:disputeCaseId',
  guard('disputes:delete'),
  param('disputeCaseId').isUUID(4),
  deleteServicemanDisputeCase
);

router.post(
  '/disputes/:disputeCaseId/tasks',
  guard('disputes:task:create'),
  [param('disputeCaseId').isUUID(4), ...disputeTaskValidators()],
  createServicemanDisputeTask
);
router.put(
  '/disputes/:disputeCaseId/tasks/:taskId',
  guard('disputes:task:update'),
  [param('disputeCaseId').isUUID(4), param('taskId').isUUID(4), ...disputeTaskValidators()],
  updateServicemanDisputeTask
);
router.delete(
  '/disputes/:disputeCaseId/tasks/:taskId',
  guard('disputes:task:delete'),
  [param('disputeCaseId').isUUID(4), param('taskId').isUUID(4)],
  deleteServicemanDisputeTask
);

router.post(
  '/disputes/:disputeCaseId/notes',
  guard('disputes:note:create'),
  [param('disputeCaseId').isUUID(4), ...disputeNoteValidators()],
  createServicemanDisputeNote
);
router.put(
  '/disputes/:disputeCaseId/notes/:noteId',
  guard('disputes:note:update'),
  [param('disputeCaseId').isUUID(4), param('noteId').isUUID(4), ...disputeNoteValidators()],
  updateServicemanDisputeNote
);
router.delete(
  '/disputes/:disputeCaseId/notes/:noteId',
  guard('disputes:note:delete'),
  [param('disputeCaseId').isUUID(4), param('noteId').isUUID(4)],
  deleteServicemanDisputeNote
);

router.post(
  '/disputes/:disputeCaseId/evidence',
  guard('disputes:evidence:create'),
  [param('disputeCaseId').isUUID(4), ...disputeEvidenceValidators()],
  createServicemanDisputeEvidence
);
router.put(
  '/disputes/:disputeCaseId/evidence/:evidenceId',
  guard('disputes:evidence:update'),
  [param('disputeCaseId').isUUID(4), param('evidenceId').isUUID(4), ...disputeEvidenceValidators()],
  updateServicemanDisputeEvidence
);
router.delete(
  '/disputes/:disputeCaseId/evidence/:evidenceId',
  guard('disputes:evidence:delete'),
  [param('disputeCaseId').isUUID(4), param('evidenceId').isUUID(4)],
  deleteServicemanDisputeEvidence
);

export default router;

