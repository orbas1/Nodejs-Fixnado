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
  listAdminUsersHandler,
  createAdminUserHandler,
  updateAdminUserHandler,
  updateAdminUserProfileHandler,
  resetAdminUserMfaHandler,
  revokeAdminUserSessionsHandler,
  listAdminUsersValidators,
  createAdminUserValidators,
  updateAdminUserValidators,
  updateAdminUserProfileValidators,
  resetAdminUserMfaValidators,
  revokeAdminUserSessionsValidators
} from '../controllers/adminUserController.js';
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
  '/users',
  authenticate,
  enforcePolicy('admin.users.read', { metadata: () => ({ entity: 'user-directory' }) }),
  listAdminUsersValidators,
  listAdminUsersHandler
);
router.post(
  '/users',
  authenticate,
  enforcePolicy('admin.users.invite', { metadata: () => ({ entity: 'user-directory' }) }),
  createAdminUserValidators,
  createAdminUserHandler
);
router.patch(
  '/users/:id',
  authenticate,
  enforcePolicy('admin.users.write', {
    metadata: (req) => ({ entity: 'user', userId: req.params.id })
  }),
  updateAdminUserValidators,
  updateAdminUserHandler
);
router.patch(
  '/users/:id/profile',
  authenticate,
  enforcePolicy('admin.users.write', {
    metadata: (req) => ({ entity: 'user-profile', userId: req.params.id })
  }),
  updateAdminUserProfileValidators,
  updateAdminUserProfileHandler
);
router.post(
  '/users/:id/reset-mfa',
  authenticate,
  enforcePolicy('admin.users.write', {
    metadata: (req) => ({ action: 'reset-mfa', userId: req.params.id })
  }),
  resetAdminUserMfaValidators,
  resetAdminUserMfaHandler
);
router.post(
  '/users/:id/revoke-sessions',
  authenticate,
  enforcePolicy('admin.users.write', {
    metadata: (req) => ({ action: 'revoke-sessions', userId: req.params.id })
  }),
  revokeAdminUserSessionsValidators,
  revokeAdminUserSessionsHandler
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
