import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { dashboard } from '../controllers/adminController.js';
import {
  getToggle,
  getToggles,
  updateToggle,
  upsertToggleValidators
} from '../controllers/featureToggleController.js';
import {
  fetchPlatformSettings,
  savePlatformSettings
} from '../controllers/platformSettingsController.js';
import {
  getAffiliateSettingsHandler,
  saveAffiliateSettingsHandler,
  listAffiliateCommissionRulesHandler,
  upsertAffiliateCommissionRuleHandler,
  deactivateAffiliateCommissionRuleHandler
} from '../controllers/adminAffiliateController.js';
import {
  listAdminCustomJobsHandler,
  createAdminCustomJobHandler,
  getAdminCustomJobHandler,
  updateAdminCustomJobHandler,
  awardAdminCustomJobHandler,
  addAdminCustomJobBidMessageHandler
} from '../controllers/adminCustomJobController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  enforcePolicy('admin.dashboard.view', { metadata: () => ({ section: 'dashboard' }) }),
  dashboard
);
router.get(
  '/feature-toggles',
  authenticate,
  enforcePolicy('admin.features.read', { metadata: () => ({ scope: 'all' }) }),
  getToggles
);
router.get(
  '/feature-toggles/:key',
  authenticate,
  enforcePolicy('admin.features.read', {
    metadata: (req) => ({ scope: 'single', key: req.params.key })
  }),
  getToggle
);
router.patch(
  '/feature-toggles/:key',
  authenticate,
  enforcePolicy('admin.features.write', {
    metadata: (req) => ({ key: req.params.key, method: req.method })
  }),
  upsertToggleValidators,
  updateToggle
);

router.get(
  '/platform-settings',
  authenticate,
  enforcePolicy('admin.platform.read', { metadata: () => ({ section: 'platform-settings' }) }),
  fetchPlatformSettings
);
router.put(
  '/platform-settings',
  authenticate,
  enforcePolicy('admin.platform.write', { metadata: () => ({ section: 'platform-settings' }) }),
  savePlatformSettings
);

router.get(
  '/custom-jobs',
  authenticate,
  enforcePolicy('admin.customJobs.read', {
    metadata: (req) => ({ status: req.query.status ?? 'all', zoneId: req.query.zoneId ?? null })
  }),
  [
    query('status').optional({ checkFalsy: true }).isIn(['open', 'assigned', 'completed', 'cancelled', 'all']),
    query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
    query('offset').optional({ checkFalsy: true }).isInt({ min: 0 }),
    query('zoneId').optional({ checkFalsy: true }).isUUID(),
    query('search').optional({ checkFalsy: true }).isString().isLength({ max: 160 })
  ],
  listAdminCustomJobsHandler
);

router.post(
  '/custom-jobs',
  authenticate,
  enforcePolicy('admin.customJobs.write', { metadata: () => ({ action: 'create' }) }),
  [
    body('title').isString().trim().isLength({ min: 5, max: 160 }),
    body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 4000 }),
    body('budgetLabel').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
    body('budgetAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('budgetCurrency')
      .optional({ checkFalsy: true })
      .isString()
      .matches(/^[A-Za-z]{3}$/),
    body('category').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('categoryOther').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('images').optional().isArray({ max: 6 }),
    body('images.*').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('metadata').optional().isObject(),
    body('location').optional({ checkFalsy: true }).isString().trim().isLength({ max: 240 }),
    body('zoneId').optional({ checkFalsy: true }).isUUID(),
    body('allowOutOfZone').optional().isBoolean(),
    body('bidDeadline').optional({ checkFalsy: true }).isISO8601(),
    body('internalNotes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 4000 }),
    body('customer').optional().isObject(),
    body('customer.id').optional({ checkFalsy: true }).isUUID(),
    body('customer.email').optional({ checkFalsy: true }).isEmail(),
    body('customer.firstName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('customer.lastName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  createAdminCustomJobHandler
);

router.get(
  '/custom-jobs/:id',
  authenticate,
  enforcePolicy('admin.customJobs.read', { metadata: (req) => ({ jobId: req.params.id }) }),
  [param('id').isUUID()],
  getAdminCustomJobHandler
);

router.put(
  '/custom-jobs/:id',
  authenticate,
  enforcePolicy('admin.customJobs.write', { metadata: (req) => ({ jobId: req.params.id, action: 'update' }) }),
  [
    param('id').isUUID(),
    body('title').optional({ checkFalsy: true }).isString().trim().isLength({ min: 5, max: 160 }),
    body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 4000 }),
    body('budgetLabel').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
    body('budgetAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('budgetCurrency')
      .optional({ checkFalsy: true })
      .isString()
      .matches(/^[A-Za-z]{3}$/),
    body('category').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('categoryOther').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('images').optional().isArray({ max: 6 }),
    body('images.*').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('metadata').optional().isObject(),
    body('location').optional({ checkFalsy: true }).isString().trim().isLength({ max: 240 }),
    body('zoneId').optional({ checkFalsy: true }).isUUID(),
    body('allowOutOfZone').optional().isBoolean(),
    body('bidDeadline').optional({ checkFalsy: true }).isISO8601(),
    body('internalNotes').optional({ checkFalsy: true }).isString().trim().isLength({ max: 4000 }),
    body('status').optional({ checkFalsy: true }).isIn(['open', 'assigned', 'completed', 'cancelled']),
    body('closedAt').optional({ checkFalsy: true }).isISO8601(),
    body('customer').optional().isObject(),
    body('customer.id').optional({ checkFalsy: true }).isUUID(),
    body('customer.email').optional({ checkFalsy: true }).isEmail(),
    body('customer.firstName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('customer.lastName').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  updateAdminCustomJobHandler
);

router.post(
  '/custom-jobs/:id/award',
  authenticate,
  enforcePolicy('admin.customJobs.write', { metadata: (req) => ({ jobId: req.params.id, action: 'award' }) }),
  [param('id').isUUID(), body('bidId').isUUID()],
  awardAdminCustomJobHandler
);

router.post(
  '/custom-jobs/:id/bids/:bidId/messages',
  authenticate,
  enforcePolicy('admin.customJobs.write', {
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
  addAdminCustomJobBidMessageHandler
);

router.get(
  '/affiliate/settings',
  authenticate,
  enforcePolicy('admin.affiliates.read', { metadata: () => ({ entity: 'settings' }) }),
  getAffiliateSettingsHandler
);
router.put(
  '/affiliate/settings',
  authenticate,
  enforcePolicy('admin.affiliates.write', { metadata: () => ({ entity: 'settings' }) }),
  saveAffiliateSettingsHandler
);
router.get(
  '/affiliate/rules',
  authenticate,
  enforcePolicy('admin.affiliates.read', { metadata: () => ({ entity: 'commission-rules' }) }),
  listAffiliateCommissionRulesHandler
);
router.post(
  '/affiliate/rules',
  authenticate,
  enforcePolicy('admin.affiliates.write', { metadata: () => ({ entity: 'commission-rules' }) }),
  upsertAffiliateCommissionRuleHandler
);
router.patch(
  '/affiliate/rules/:id',
  authenticate,
  enforcePolicy('admin.affiliates.write', {
    metadata: (req) => ({ entity: 'commission-rules', ruleId: req.params.id })
  }),
  upsertAffiliateCommissionRuleHandler
);
router.delete(
  '/affiliate/rules/:id',
  authenticate,
  enforcePolicy('admin.affiliates.write', {
    metadata: (req) => ({ entity: 'commission-rules', ruleId: req.params.id })
  }),
  deactivateAffiliateCommissionRuleHandler
);

export default router;
