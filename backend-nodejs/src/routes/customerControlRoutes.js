import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getCustomerOverview,
  upsertCustomerProfile,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  createCustomerLocation,
  updateCustomerLocation,
  deleteCustomerLocation,
  createCustomerDisputeCase,
  updateCustomerDisputeCase,
  deleteCustomerDisputeCase,
  createCustomerDisputeTask,
  updateCustomerDisputeTask,
  deleteCustomerDisputeTask,
  createCustomerDisputeNote,
  updateCustomerDisputeNote,
  deleteCustomerDisputeNote,
  createCustomerDisputeEvidence,
  updateCustomerDisputeEvidence,
  deleteCustomerDisputeEvidence
  createCustomerCoupon,
  updateCustomerCoupon,
  deleteCustomerCoupon
} from '../controllers/customerControlController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const ensureCustomerPersona = (req, res, next) => {
  const headerPersona = `${req.headers['x-fixnado-persona'] ?? ''}`.toLowerCase();
  const actorPersona = `${req.auth?.actor?.persona ?? ''}`.toLowerCase();
  const fallbackRole = `${req.user?.persona ?? req.user?.type ?? ''}`.toLowerCase();
  const persona = headerPersona || actorPersona || fallbackRole;
  const allowed = new Set(['user', 'customer', 'company']);

  if (persona && !allowed.has(persona)) {
    return res.status(403).json({ message: 'persona_forbidden' });
  }

  return next();
};

const guard = (surface) =>
  enforcePolicy('customer.control.manage', {
    metadata: (req) => ({
      surface,
      persona: req.headers['x-fixnado-persona'] || null
    })
  });

const profileValidators = () => [
  body('preferredName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('companyName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('jobTitle').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('primaryEmail').optional({ values: 'falsy' }).isEmail().isLength({ max: 255 }),
  body('primaryPhone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 64 }),
  body('preferredContactMethod').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('billingEmail').optional({ values: 'falsy' }).isEmail().isLength({ max: 255 }),
  body('timezone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('locale').optional({ values: 'falsy' }).isString().trim().isLength({ max: 32 }),
  body('defaultCurrency').optional({ values: 'falsy' }).isString().trim().isLength({ min: 3, max: 12 }),
  body('avatarUrl').optional({ values: 'falsy' }).isString().trim().isLength({ max: 512 }),
  body('coverImageUrl').optional({ values: 'falsy' }).isString().trim().isLength({ max: 512 }),
  body('supportNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
  body('escalationWindowMinutes').optional().isInt({ min: 15, max: 1440 }).toInt(),
  body('marketingOptIn').optional().isBoolean().toBoolean(),
  body('notificationsEmailOptIn').optional().isBoolean().toBoolean(),
  body('notificationsSmsOptIn').optional().isBoolean().toBoolean()
];

const contactValidators = () => [
  body('name').isString().trim().isLength({ min: 2, max: 160 }),
  body('role').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('email').optional({ values: 'falsy' }).isEmail().isLength({ max: 255 }),
  body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 64 }),
  body('contactType')
    .optional({ values: 'falsy' })
    .isIn(['operations', 'finance', 'support', 'billing', 'executive', 'other']),
  body('isPrimary').optional().isBoolean().toBoolean(),
  body('notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
  body('avatarUrl').optional({ values: 'falsy' }).isString().trim().isLength({ max: 512 })
];

const locationValidators = () => [
  body('label').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('addressLine1').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
  body('addressLine2').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
  body('city').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('region').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('postalCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 32 }),
  body('country').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('zoneLabel').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('zoneCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 64 }),
  body('serviceCatalogues').optional({ values: 'falsy' }).isString().trim().isLength({ max: 500 }),
  body('onsiteContactName').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }),
  body('onsiteContactPhone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 64 }),
  body('onsiteContactEmail').optional({ values: 'falsy' }).isEmail().isLength({ max: 255 }),
  body('accessWindowStart').optional({ values: 'falsy' }).isString().trim().isLength({ max: 32 }),
  body('accessWindowEnd').optional({ values: 'falsy' }).isString().trim().isLength({ max: 32 }),
  body('parkingInformation').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
  body('loadingDockDetails').optional({ values: 'falsy' }).isString().trim().isLength({ max: 255 }),
  body('securityNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 1000 }),
  body('floorLevel').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('mapImageUrl').optional({ values: 'falsy' }).isString().trim().isLength({ max: 512 }),
  body('accessNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 1000 }),
  body('isPrimary').optional().isBoolean().toBoolean()
];

const disputeCaseValidators = () => [
  body('caseNumber').optional({ values: 'falsy' }).isString().trim().isLength({ max: 32 }),
  body('disputeId').optional({ values: 'falsy' }).isUUID(4),
  body('title').isString().trim().isLength({ min: 3, max: 200 }),
  body('category').optional({ values: 'falsy' }).isIn(['billing', 'service_quality', 'damage', 'timeline', 'compliance', 'other']),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['draft', 'open', 'under_review', 'awaiting_customer', 'resolved', 'closed']),
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
  body('pinned').optional().isBoolean().toBoolean()
];

const disputeEvidenceValidators = () => [
  body('label').isString().trim().isLength({ min: 2, max: 200 }),
  body('fileUrl').isString().trim().isURL({ require_protocol: true }).isLength({ max: 512 }),
  body('fileType').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('thumbnailUrl')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isURL({ require_protocol: true })
    .isLength({ max: 512 }),
  body('notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 })
const couponValidators = () => [
  body('name').isString().trim().isLength({ min: 2, max: 160 }),
  body('code').isString().trim().isLength({ min: 3, max: 64 }),
  body('description').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 }),
  body('discountType').isIn(['percentage', 'fixed']),
  body('discountValue').isFloat({ gt: 0 }).toFloat(),
  body('currency').optional({ values: 'falsy' }).isString().trim().isLength({ min: 3, max: 12 }),
  body('minOrderTotal').optional({ values: 'falsy' }).isFloat({ gt: 0 }).toFloat(),
  body('startsAt').optional({ values: 'falsy' }).isISO8601(),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601(),
  body('maxRedemptions').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  body('maxRedemptionsPerCustomer').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  body('autoApply').optional().isBoolean().toBoolean(),
  body('status').optional({ values: 'falsy' }).isIn(['draft', 'scheduled', 'active', 'expired', 'archived']),
  body('imageUrl').optional({ values: 'falsy' }).isString().trim().isLength({ max: 512 }),
  body('termsUrl').optional({ values: 'falsy' }).isString().trim().isLength({ max: 512 }),
  body('internalNotes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 2000 })
];

router.use(authenticate, ensureCustomerPersona);

router.get('/overview', guard('overview'), getCustomerOverview);
router.put('/profile', guard('profile'), profileValidators(), upsertCustomerProfile);

router.post('/contacts', guard('contacts:create'), contactValidators(), createCustomerContact);
router.put(
  '/contacts/:contactId',
  guard('contacts:update'),
  [param('contactId').isUUID(4), ...contactValidators()],
  updateCustomerContact
);
router.delete(
  '/contacts/:contactId',
  guard('contacts:delete'),
  param('contactId').isUUID(4),
  deleteCustomerContact
);

router.post('/locations', guard('locations:create'), locationValidators(), createCustomerLocation);
router.put(
  '/locations/:locationId',
  guard('locations:update'),
  [param('locationId').isUUID(4), ...locationValidators()],
  updateCustomerLocation
);
router.delete(
  '/locations/:locationId',
  guard('locations:delete'),
  param('locationId').isUUID(4),
  deleteCustomerLocation
);

router.post('/disputes', guard('disputes:create'), disputeCaseValidators(), createCustomerDisputeCase);
router.put(
  '/disputes/:disputeCaseId',
  guard('disputes:update'),
  [param('disputeCaseId').isUUID(4), ...disputeCaseValidators()],
  updateCustomerDisputeCase
);
router.delete(
  '/disputes/:disputeCaseId',
  guard('disputes:delete'),
  param('disputeCaseId').isUUID(4),
  deleteCustomerDisputeCase
);

router.post(
  '/disputes/:disputeCaseId/tasks',
  guard('disputes:tasks:create'),
  [param('disputeCaseId').isUUID(4), ...disputeTaskValidators()],
  createCustomerDisputeTask
);
router.put(
  '/disputes/:disputeCaseId/tasks/:taskId',
  guard('disputes:tasks:update'),
  [param('disputeCaseId').isUUID(4), param('taskId').isUUID(4), ...disputeTaskValidators()],
  updateCustomerDisputeTask
);
router.delete(
  '/disputes/:disputeCaseId/tasks/:taskId',
  guard('disputes:tasks:delete'),
  [param('disputeCaseId').isUUID(4), param('taskId').isUUID(4)],
  deleteCustomerDisputeTask
);

router.post(
  '/disputes/:disputeCaseId/notes',
  guard('disputes:notes:create'),
  [param('disputeCaseId').isUUID(4), ...disputeNoteValidators()],
  createCustomerDisputeNote
);
router.put(
  '/disputes/:disputeCaseId/notes/:noteId',
  guard('disputes:notes:update'),
  [param('disputeCaseId').isUUID(4), param('noteId').isUUID(4), ...disputeNoteValidators()],
  updateCustomerDisputeNote
);
router.delete(
  '/disputes/:disputeCaseId/notes/:noteId',
  guard('disputes:notes:delete'),
  [param('disputeCaseId').isUUID(4), param('noteId').isUUID(4)],
  deleteCustomerDisputeNote
);

router.post(
  '/disputes/:disputeCaseId/evidence',
  guard('disputes:evidence:create'),
  [param('disputeCaseId').isUUID(4), ...disputeEvidenceValidators()],
  createCustomerDisputeEvidence
);
router.put(
  '/disputes/:disputeCaseId/evidence/:evidenceId',
  guard('disputes:evidence:update'),
  [param('disputeCaseId').isUUID(4), param('evidenceId').isUUID(4), ...disputeEvidenceValidators()],
  updateCustomerDisputeEvidence
);
router.delete(
  '/disputes/:disputeCaseId/evidence/:evidenceId',
  guard('disputes:evidence:delete'),
  [param('disputeCaseId').isUUID(4), param('evidenceId').isUUID(4)],
  deleteCustomerDisputeEvidence
);
router.post('/coupons', guard('coupons:create'), couponValidators(), createCustomerCoupon);
router.put(
  '/coupons/:couponId',
  guard('coupons:update'),
  [param('couponId').isUUID(4), ...couponValidators()],
  updateCustomerCoupon
);
router.delete('/coupons/:couponId', guard('coupons:delete'), param('couponId').isUUID(4), deleteCustomerCoupon);

export default router;
