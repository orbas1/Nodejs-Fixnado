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
import { authenticate, authorize } from '../middleware/auth.js';
import { Permissions } from '../services/accessControlService.js';

const router = Router();

router.get('/dashboard', authenticate, authorize([Permissions.ADMIN_DASHBOARD]), dashboard);
router.get('/feature-toggles', authenticate, authorize([Permissions.ADMIN_FEATURE_READ]), getToggles);
router.get('/feature-toggles/:key', authenticate, authorize([Permissions.ADMIN_FEATURE_READ]), getToggle);
router.patch(
  '/feature-toggles/:key',
  authenticate,
  authorize([Permissions.ADMIN_FEATURE_WRITE]),
  upsertToggleValidators,
  updateToggle
);

router.get(
  '/platform-settings',
  authenticate,
  authorize([Permissions.ADMIN_PLATFORM_READ]),
  fetchPlatformSettings
);
router.put(
  '/platform-settings',
  authenticate,
  authorize([Permissions.ADMIN_PLATFORM_WRITE]),
  savePlatformSettings
);

router.get(
  '/affiliate/settings',
  authenticate,
  authorize([Permissions.ADMIN_AFFILIATE_READ]),
  getAffiliateSettingsHandler
);
router.put(
  '/affiliate/settings',
  authenticate,
  authorize([Permissions.ADMIN_AFFILIATE_WRITE]),
  saveAffiliateSettingsHandler
);
router.get(
  '/affiliate/rules',
  authenticate,
  authorize([Permissions.ADMIN_AFFILIATE_READ]),
  listAffiliateCommissionRulesHandler
);
router.post(
  '/affiliate/rules',
  authenticate,
  authorize([Permissions.ADMIN_AFFILIATE_WRITE]),
  upsertAffiliateCommissionRuleHandler
);
router.patch(
  '/affiliate/rules/:id',
  authenticate,
  authorize([Permissions.ADMIN_AFFILIATE_WRITE]),
  upsertAffiliateCommissionRuleHandler
);
router.delete(
  '/affiliate/rules/:id',
  authenticate,
  authorize([Permissions.ADMIN_AFFILIATE_WRITE]),
  deactivateAffiliateCommissionRuleHandler
);

export default router;
