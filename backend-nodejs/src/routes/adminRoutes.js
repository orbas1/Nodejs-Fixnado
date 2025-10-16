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
  listRbacRoles,
  getRbacRole,
  createRbacRole,
  updateRbacRole,
  archiveRbacRole,
  assignRbacRole,
  revokeRbacAssignment
} from '../controllers/rbacController.js';
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
  '/rbac/roles',
  authenticate,
  enforcePolicy('admin.rbac.read', { metadata: () => ({ scope: 'roles' }) }),
  listRbacRoles
);
router.post(
  '/rbac/roles',
  authenticate,
  enforcePolicy('admin.rbac.write', { metadata: () => ({ action: 'create-role' }) }),
  createRbacRole
);
router.get(
  '/rbac/roles/:key',
  authenticate,
  enforcePolicy('admin.rbac.read', {
    metadata: (req) => ({ scope: 'role', roleKey: req.params.key })
  }),
  getRbacRole
);
router.put(
  '/rbac/roles/:key',
  authenticate,
  enforcePolicy('admin.rbac.write', {
    metadata: (req) => ({ action: 'update-role', roleKey: req.params.key })
  }),
  updateRbacRole
);
router.delete(
  '/rbac/roles/:key',
  authenticate,
  enforcePolicy('admin.rbac.write', {
    metadata: (req) => ({ action: 'archive-role', roleKey: req.params.key })
  }),
  archiveRbacRole
);
router.post(
  '/rbac/roles/:key/assignments',
  authenticate,
  enforcePolicy('admin.rbac.write', {
    metadata: (req) => ({ action: 'assign-role', roleKey: req.params.key })
  }),
  assignRbacRole
);
router.delete(
  '/rbac/roles/:key/assignments/:assignmentId',
  authenticate,
  enforcePolicy('admin.rbac.write', {
    metadata: (req) => ({
      action: 'revoke-assignment',
      roleKey: req.params.key,
      assignmentId: req.params.assignmentId
    })
  }),
  revokeRbacAssignment
);

export default router;
