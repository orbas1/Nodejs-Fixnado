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

const router = Router();

router.get('/dashboard', authenticate, authorize(['admin']), dashboard);
router.get('/feature-toggles', authenticate, authorize(['admin']), getToggles);
router.get('/feature-toggles/:key', authenticate, authorize(['admin']), getToggle);
router.patch(
  '/feature-toggles/:key',
  authenticate,
  authorize(['admin']),
  upsertToggleValidators,
  updateToggle
);

router.get('/platform-settings', authenticate, authorize(['admin']), fetchPlatformSettings);
router.put('/platform-settings', authenticate, authorize(['admin']), savePlatformSettings);

const ADMIN_AFFILIATE_ROLES = ['admin', 'provider_admin', 'operations_admin'];

router.get('/affiliate/settings', authenticate, authorize(ADMIN_AFFILIATE_ROLES), getAffiliateSettingsHandler);
router.put('/affiliate/settings', authenticate, authorize(ADMIN_AFFILIATE_ROLES), saveAffiliateSettingsHandler);
router.get('/affiliate/rules', authenticate, authorize(ADMIN_AFFILIATE_ROLES), listAffiliateCommissionRulesHandler);
router.post('/affiliate/rules', authenticate, authorize(ADMIN_AFFILIATE_ROLES), upsertAffiliateCommissionRuleHandler);
router.patch('/affiliate/rules/:id', authenticate, authorize(ADMIN_AFFILIATE_ROLES), upsertAffiliateCommissionRuleHandler);
router.delete('/affiliate/rules/:id', authenticate, authorize(ADMIN_AFFILIATE_ROLES), deactivateAffiliateCommissionRuleHandler);

export default router;
