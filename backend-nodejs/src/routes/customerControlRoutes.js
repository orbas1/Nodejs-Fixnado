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
  deleteCustomerLocation
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

export default router;
