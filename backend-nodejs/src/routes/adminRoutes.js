import { Router } from 'express';
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
  listProvidersValidators,
  listProvidersHandler,
  getProviderValidators,
  getProviderHandler,
  createProviderValidators,
  createProviderHandler,
  updateProviderValidators,
  updateProviderHandler,
  archiveProviderValidators,
  archiveProviderHandler,
  upsertContactValidators,
  upsertProviderContactHandler,
  deleteContactValidators,
  deleteProviderContactHandler,
  upsertCoverageValidators,
  upsertProviderCoverageHandler,
  deleteCoverageValidators,
  deleteProviderCoverageHandler
} from '../controllers/adminProviderController.js';
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

router.get(
  '/providers',
  authenticate,
  enforcePolicy('admin.providers.read', { metadata: () => ({ scope: 'directory' }) }),
  listProvidersValidators,
  listProvidersHandler
);
router.post(
  '/providers',
  authenticate,
  enforcePolicy('admin.providers.write', { metadata: () => ({ action: 'create' }) }),
  createProviderValidators,
  createProviderHandler
);
router.get(
  '/providers/:companyId',
  authenticate,
  enforcePolicy('admin.providers.read', {
    metadata: (req) => ({ scope: 'detail', companyId: req.params.companyId })
  }),
  getProviderValidators,
  getProviderHandler
);
router.put(
  '/providers/:companyId',
  authenticate,
  enforcePolicy('admin.providers.write', {
    metadata: (req) => ({ action: 'update', companyId: req.params.companyId })
  }),
  updateProviderValidators,
  updateProviderHandler
);
router.post(
  '/providers/:companyId/archive',
  authenticate,
  enforcePolicy('admin.providers.archive', {
    metadata: (req) => ({ action: 'archive', companyId: req.params.companyId })
  }),
  archiveProviderValidators,
  archiveProviderHandler
);
router.post(
  '/providers/:companyId/contacts',
  authenticate,
  enforcePolicy('admin.providers.write', {
    metadata: (req) => ({ action: 'contact:create', companyId: req.params.companyId })
  }),
  upsertContactValidators,
  upsertProviderContactHandler
);
router.put(
  '/providers/:companyId/contacts/:contactId',
  authenticate,
  enforcePolicy('admin.providers.write', {
    metadata: (req) => ({ action: 'contact:update', companyId: req.params.companyId, contactId: req.params.contactId })
  }),
  upsertContactValidators,
  upsertProviderContactHandler
);
router.delete(
  '/providers/:companyId/contacts/:contactId',
  authenticate,
  enforcePolicy('admin.providers.write', {
    metadata: (req) => ({ action: 'contact:delete', companyId: req.params.companyId, contactId: req.params.contactId })
  }),
  deleteContactValidators,
  deleteProviderContactHandler
);
router.post(
  '/providers/:companyId/coverage',
  authenticate,
  enforcePolicy('admin.providers.write', {
    metadata: (req) => ({ action: 'coverage:create', companyId: req.params.companyId })
  }),
  upsertCoverageValidators,
  upsertProviderCoverageHandler
);
router.put(
  '/providers/:companyId/coverage/:coverageId',
  authenticate,
  enforcePolicy('admin.providers.write', {
    metadata: (req) => ({ action: 'coverage:update', companyId: req.params.companyId, coverageId: req.params.coverageId })
  }),
  upsertCoverageValidators,
  upsertProviderCoverageHandler
);
router.delete(
  '/providers/:companyId/coverage/:coverageId',
  authenticate,
  enforcePolicy('admin.providers.write', {
    metadata: (req) => ({ action: 'coverage:delete', companyId: req.params.companyId, coverageId: req.params.coverageId })
  }),
  deleteCoverageValidators,
  deleteProviderCoverageHandler
);

export default router;
