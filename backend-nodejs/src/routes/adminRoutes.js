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
  listQueuesHandler,
  getQueueHandler,
  createQueueHandler,
  updateQueueHandler,
  archiveQueueHandler,
  createQueueUpdateHandler,
  updateQueueUpdateHandler,
  deleteQueueUpdateHandler,
  createQueueValidators,
  updateQueueValidators,
  queueIdValidator,
  createUpdateValidators,
  patchUpdateValidators,
  updateIdValidator
} from '../controllers/operationsQueueController.js';
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
  '/operations/queues',
  authenticate,
  enforcePolicy('admin.operations.queues.read', {
    metadata: () => ({ section: 'operations-queues', action: 'list' })
  }),
  listQueuesHandler
);

router.post(
  '/operations/queues',
  authenticate,
  enforcePolicy('admin.operations.queues.write', {
    metadata: () => ({ section: 'operations-queues', action: 'create' })
  }),
  createQueueValidators,
  createQueueHandler
);

router.get(
  '/operations/queues/:id',
  authenticate,
  enforcePolicy('admin.operations.queues.read', {
    metadata: (req) => ({ section: 'operations-queues', action: 'get', queueId: req.params.id })
  }),
  queueIdValidator,
  getQueueHandler
);

router.patch(
  '/operations/queues/:id',
  authenticate,
  enforcePolicy('admin.operations.queues.write', {
    metadata: (req) => ({ section: 'operations-queues', action: 'update', queueId: req.params.id })
  }),
  updateQueueValidators,
  updateQueueHandler
);

router.delete(
  '/operations/queues/:id',
  authenticate,
  enforcePolicy('admin.operations.queues.write', {
    metadata: (req) => ({ section: 'operations-queues', action: 'archive', queueId: req.params.id })
  }),
  queueIdValidator,
  archiveQueueHandler
);

router.post(
  '/operations/queues/:id/updates',
  authenticate,
  enforcePolicy('admin.operations.queues.write', {
    metadata: (req) => ({ section: 'operations-queues', action: 'create-update', queueId: req.params.id })
  }),
  createUpdateValidators,
  createQueueUpdateHandler
);

router.patch(
  '/operations/queues/:id/updates/:updateId',
  authenticate,
  enforcePolicy('admin.operations.queues.write', {
    metadata: (req) => ({
      section: 'operations-queues',
      action: 'update-update',
      queueId: req.params.id,
      updateId: req.params.updateId
    })
  }),
  patchUpdateValidators,
  updateQueueUpdateHandler
);

router.delete(
  '/operations/queues/:id/updates/:updateId',
  authenticate,
  enforcePolicy('admin.operations.queues.write', {
    metadata: (req) => ({
      section: 'operations-queues',
      action: 'delete-update',
      queueId: req.params.id,
      updateId: req.params.updateId
    })
  }),
  updateIdValidator,
  deleteQueueUpdateHandler
);

export default router;
