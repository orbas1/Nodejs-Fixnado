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
  listWebsitePagesHandler,
  getWebsitePageHandler,
  createWebsitePageHandler,
  updateWebsitePageHandler,
  deleteWebsitePageHandler,
  createWebsiteContentBlockHandler,
  updateWebsiteContentBlockHandler,
  deleteWebsiteContentBlockHandler,
  listWebsiteNavigationHandler,
  createWebsiteNavigationMenuHandler,
  updateWebsiteNavigationMenuHandler,
  deleteWebsiteNavigationMenuHandler,
  createWebsiteNavigationItemHandler,
  updateWebsiteNavigationItemHandler,
  deleteWebsiteNavigationItemHandler
} from '../controllers/websiteManagementController.js';
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
  '/website/pages',
  authenticate,
  enforcePolicy('admin.website.read', { metadata: () => ({ entity: 'pages' }) }),
  listWebsitePagesHandler
);
router.post(
  '/website/pages',
  authenticate,
  enforcePolicy('admin.website.write', { metadata: () => ({ entity: 'page', action: 'create' }) }),
  createWebsitePageHandler
);
router.get(
  '/website/pages/:pageId',
  authenticate,
  enforcePolicy('admin.website.read', {
    metadata: (req) => ({ entity: 'page', pageId: req.params.pageId })
  }),
  getWebsitePageHandler
);
router.put(
  '/website/pages/:pageId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'page', action: 'update', pageId: req.params.pageId })
  }),
  updateWebsitePageHandler
);
router.delete(
  '/website/pages/:pageId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'page', action: 'delete', pageId: req.params.pageId })
  }),
  deleteWebsitePageHandler
);

router.post(
  '/website/pages/:pageId/blocks',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'block', action: 'create', pageId: req.params.pageId })
  }),
  createWebsiteContentBlockHandler
);
router.patch(
  '/website/blocks/:blockId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'block', action: 'update', blockId: req.params.blockId })
  }),
  updateWebsiteContentBlockHandler
);
router.delete(
  '/website/blocks/:blockId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'block', action: 'delete', blockId: req.params.blockId })
  }),
  deleteWebsiteContentBlockHandler
);

router.get(
  '/website/navigation',
  authenticate,
  enforcePolicy('admin.website.read', { metadata: () => ({ entity: 'navigation' }) }),
  listWebsiteNavigationHandler
);
router.post(
  '/website/navigation',
  authenticate,
  enforcePolicy('admin.website.write', { metadata: () => ({ entity: 'navigation', action: 'create' }) }),
  createWebsiteNavigationMenuHandler
);
router.patch(
  '/website/navigation/:menuId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'navigation', action: 'update', menuId: req.params.menuId })
  }),
  updateWebsiteNavigationMenuHandler
);
router.delete(
  '/website/navigation/:menuId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'navigation', action: 'delete', menuId: req.params.menuId })
  }),
  deleteWebsiteNavigationMenuHandler
);
router.post(
  '/website/navigation/:menuId/items',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'navigation-item', action: 'create', menuId: req.params.menuId })
  }),
  createWebsiteNavigationItemHandler
);
router.patch(
  '/website/navigation/items/:itemId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'navigation-item', action: 'update', itemId: req.params.itemId })
  }),
  updateWebsiteNavigationItemHandler
);
router.delete(
  '/website/navigation/items/:itemId',
  authenticate,
  enforcePolicy('admin.website.write', {
    metadata: (req) => ({ entity: 'navigation-item', action: 'delete', itemId: req.params.itemId })
  }),
  deleteWebsiteNavigationItemHandler
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
