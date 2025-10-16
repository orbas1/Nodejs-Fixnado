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
  addEscrowNoteHandler,
  createEscrowHandler,
  deleteEscrowMilestoneHandler,
  deleteEscrowNoteHandler,
  getEscrowHandler,
  listReleasePoliciesHandler,
  listEscrowsHandler,
  updateEscrowHandler,
  upsertEscrowMilestoneHandler,
  createReleasePolicyHandler,
  updateReleasePolicyHandler,
  deleteReleasePolicyHandler
} from '../controllers/adminEscrowController.js';
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
  '/escrows',
  authenticate,
  enforcePolicy('admin.escrows.read', {
    metadata: (req) => ({
      scope: 'list',
      status: req.query?.status || 'all'
    })
  }),
  listEscrowsHandler
);

router.post(
  '/escrows',
  authenticate,
  enforcePolicy('admin.escrows.write', { metadata: () => ({ action: 'create' }) }),
  createEscrowHandler
);

router.get(
  '/escrows/:id',
  authenticate,
  enforcePolicy('admin.escrows.read', {
    metadata: (req) => ({ scope: 'single', escrowId: req.params.id })
  }),
  getEscrowHandler
);

router.patch(
  '/escrows/:id',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'update', escrowId: req.params.id })
  }),
  updateEscrowHandler
);

router.post(
  '/escrows/:id/notes',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'add-note', escrowId: req.params.id })
  }),
  addEscrowNoteHandler
);

router.delete(
  '/escrows/:id/notes/:noteId',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'delete-note', escrowId: req.params.id, noteId: req.params.noteId })
  }),
  deleteEscrowNoteHandler
);

router.post(
  '/escrows/:id/milestones',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'create-milestone', escrowId: req.params.id })
  }),
  upsertEscrowMilestoneHandler
);

router.patch(
  '/escrows/:id/milestones/:milestoneId',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'update-milestone', escrowId: req.params.id, milestoneId: req.params.milestoneId })
  }),
  upsertEscrowMilestoneHandler
);

router.delete(
  '/escrows/:id/milestones/:milestoneId',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'delete-milestone', escrowId: req.params.id, milestoneId: req.params.milestoneId })
  }),
  deleteEscrowMilestoneHandler
);

router.get(
  '/escrows/policies',
  authenticate,
  enforcePolicy('admin.escrows.read', {
    metadata: () => ({ scope: 'policies' })
  }),
  listReleasePoliciesHandler
);

router.post(
  '/escrows/policies',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: () => ({ action: 'create-policy' })
  }),
  createReleasePolicyHandler
);

router.patch(
  '/escrows/policies/:policyId',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'update-policy', policyId: req.params.policyId })
  }),
  updateReleasePolicyHandler
);

router.delete(
  '/escrows/policies/:policyId',
  authenticate,
  enforcePolicy('admin.escrows.write', {
    metadata: (req) => ({ action: 'delete-policy', policyId: req.params.policyId })
  }),
  deleteReleasePolicyHandler
);

export default router;
