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
  getAdminTaxonomy,
  upsertTaxonomyType,
  archiveTaxonomyType,
  upsertTaxonomyCategory,
  archiveTaxonomyCategory
} from '../controllers/taxonomyController.js';
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
  '/taxonomy',
  authenticate,
  enforcePolicy('admin.taxonomy.read', { metadata: () => ({ scope: 'taxonomy' }) }),
  getAdminTaxonomy
);

router.post(
  '/taxonomy/types',
  authenticate,
  enforcePolicy('admin.taxonomy.write', { metadata: () => ({ entity: 'type', action: 'create' }) }),
  upsertTaxonomyType
);

router.put(
  '/taxonomy/types/:id',
  authenticate,
  enforcePolicy('admin.taxonomy.write', {
    metadata: (req) => ({ entity: 'type', action: 'update', typeId: req.params.id })
  }),
  upsertTaxonomyType
);

router.delete(
  '/taxonomy/types/:id',
  authenticate,
  enforcePolicy('admin.taxonomy.write', {
    metadata: (req) => ({ entity: 'type', action: 'archive', typeId: req.params.id })
  }),
  archiveTaxonomyType
);

router.post(
  '/taxonomy/categories',
  authenticate,
  enforcePolicy('admin.taxonomy.write', { metadata: () => ({ entity: 'category', action: 'create' }) }),
  upsertTaxonomyCategory
);

router.put(
  '/taxonomy/categories/:id',
  authenticate,
  enforcePolicy('admin.taxonomy.write', {
    metadata: (req) => ({ entity: 'category', action: 'update', categoryId: req.params.id })
  }),
  upsertTaxonomyCategory
);

router.delete(
  '/taxonomy/categories/:id',
  authenticate,
  enforcePolicy('admin.taxonomy.write', {
    metadata: (req) => ({ entity: 'category', action: 'archive', categoryId: req.params.id })
  }),
  archiveTaxonomyCategory
);

export default router;
