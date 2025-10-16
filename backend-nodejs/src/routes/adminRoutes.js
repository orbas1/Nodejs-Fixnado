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
  listAppearanceProfilesHandler,
  getAppearanceProfileHandler,
  createAppearanceProfileHandler,
  updateAppearanceProfileHandler,
  archiveAppearanceProfileHandler
} from '../controllers/adminAppearanceController.js';
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
  '/appearance/profiles',
  authenticate,
  enforcePolicy('admin.appearance.read', {
    metadata: () => ({ entity: 'appearance-profiles', action: 'list' })
  }),
  listAppearanceProfilesHandler
);

router.post(
  '/appearance/profiles',
  authenticate,
  enforcePolicy('admin.appearance.write', {
    metadata: () => ({ entity: 'appearance-profiles', action: 'create' })
  }),
  createAppearanceProfileHandler
);

router.get(
  '/appearance/profiles/:id',
  authenticate,
  enforcePolicy('admin.appearance.read', {
    metadata: (req) => ({ entity: 'appearance-profiles', profileId: req.params.id })
  }),
  getAppearanceProfileHandler
);

router.put(
  '/appearance/profiles/:id',
  authenticate,
  enforcePolicy('admin.appearance.write', {
    metadata: (req) => ({ entity: 'appearance-profiles', profileId: req.params.id })
  }),
  updateAppearanceProfileHandler
);

router.delete(
  '/appearance/profiles/:id',
  authenticate,
  enforcePolicy('admin.appearance.write', {
    metadata: (req) => ({ entity: 'appearance-profiles', profileId: req.params.id, action: 'archive' })
  }),
  archiveAppearanceProfileHandler
);

export default router;
