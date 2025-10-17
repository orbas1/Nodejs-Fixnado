import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getProviderSettingsHandler,
  updateProviderProfileHandler,
  updateProviderBrandingHandler,
  updateProviderOperationsHandler,
  createProviderContactHandler,
  updateProviderContactHandler,
  deleteProviderContactHandler,
  createProviderCoverageHandler,
  updateProviderCoverageHandler,
  deleteProviderCoverageHandler
} from '../controllers/providerSettingsController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import { CONTACT_TYPES, COVERAGE_TYPES } from '../services/providerSettingsService.js';

const router = Router();

const profileValidators = [
  body('displayName').optional().isString().trim().isLength({ min: 2, max: 120 }),
  body('tradingName').optional().isString().trim().isLength({ min: 1, max: 160 }),
  body('tagline').optional().isString().trim().isLength({ max: 160 }),
  body('missionStatement').optional().isString().trim().isLength({ max: 2000 }),
  body('supportEmail').optional().isString().trim().isEmail(),
  body('supportPhone').optional().isString().trim().isLength({ max: 40 }),
  body('billingEmail').optional().isString().trim().isEmail(),
  body('billingPhone').optional().isString().trim().isLength({ max: 40 }),
  body('websiteUrl').optional().isURL({ require_protocol: true }),
  body('operationsPlaybookUrl').optional().isURL({ require_protocol: true }),
  body('insurancePolicyUrl').optional().isURL({ require_protocol: true }),
  body('dispatchRadiusKm').optional().isInt({ min: 0, max: 1000 }),
  body('preferredResponseMinutes').optional().isInt({ min: 5, max: 1440 }),
  body('serviceRegions').optional().custom((value) => {
    if (Array.isArray(value)) {
      return value.every((entry) => typeof entry === 'string');
    }
    return typeof value === 'string';
  })
];

const brandingValidators = [
  body('logoUrl').optional().isURL({ require_protocol: true }),
  body('heroImageUrl').optional().isURL({ require_protocol: true }),
  body('brandPrimaryColor').optional().matches(/^#?[0-9a-fA-F]{3,8}$/),
  body('brandSecondaryColor').optional().matches(/^#?[0-9a-fA-F]{3,8}$/),
  body('brandFont').optional().isString().trim().isLength({ max: 80 }),
  body('mediaGallery').optional().isArray(),
  body('mediaGallery.*.label').optional().isString().trim().isLength({ max: 120 }),
  body('mediaGallery.*.url').optional().isURL({ require_protocol: true })
];

const operationsValidators = [
  body('operationsNotes').optional().isString().trim().isLength({ max: 4000 }),
  body('coverageNotes').optional().isString().trim().isLength({ max: 4000 }),
  body('supportHours').optional().isObject(),
  body('socialLinks').optional().isArray(),
  body('socialLinks.*.label').optional().isString().trim().isLength({ max: 80 }),
  body('socialLinks.*.url').optional().isURL({ require_protocol: true })
];

const contactValidators = [
  body('name').isString().trim().isLength({ min: 2, max: 160 }),
  body('role').optional().isString().trim().isLength({ max: 120 }),
  body('email').optional().isString().trim().isEmail(),
  body('phone').optional().isString().trim().isLength({ max: 40 }),
  body('type').optional().isString().trim().isIn(CONTACT_TYPES),
  body('isPrimary').optional().isBoolean(),
  body('notes').optional().isString().trim().isLength({ max: 2000 }),
  body('avatarUrl').optional().isURL({ require_protocol: true })
];

const coverageValidators = [
  body('zoneId').isString().trim().isLength({ min: 1, max: 64 }),
  body('coverageType').optional().isString().trim().isIn(COVERAGE_TYPES),
  body('slaMinutes').optional().isInt({ min: 15, max: 1440 }),
  body('maxCapacity').optional().isInt({ min: 0, max: 1000 }),
  body('notes').optional().isString().trim().isLength({ max: 2000 })
];

router.use(
  authenticate,
  enforcePolicy('panel.provider.settings', {
    metadata: (req) => ({ companyId: req.query?.companyId ?? null })
  })
);

router.get('/', getProviderSettingsHandler);
router.put('/profile', profileValidators, updateProviderProfileHandler);
router.put('/branding', brandingValidators, updateProviderBrandingHandler);
router.put('/operations', operationsValidators, updateProviderOperationsHandler);

router.post('/contacts', contactValidators, createProviderContactHandler);
router.put('/contacts/:contactId', [param('contactId').isUUID(4), ...contactValidators], updateProviderContactHandler);
router.delete('/contacts/:contactId', [param('contactId').isUUID(4)], deleteProviderContactHandler);

router.post('/coverage', coverageValidators, createProviderCoverageHandler);
router.put('/coverage/:coverageId', [param('coverageId').isUUID(4), ...coverageValidators], updateProviderCoverageHandler);
router.delete('/coverage/:coverageId', [param('coverageId').isUUID(4)], deleteProviderCoverageHandler);

export default router;
