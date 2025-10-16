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
  listPlatformSettingDiagnostics,
  triggerPlatformSettingDiagnostic
} from '../controllers/platformSettingsDiagnosticsController.js';
import {
  getAffiliateSettingsHandler,
  saveAffiliateSettingsHandler,
  listAffiliateCommissionRulesHandler,
  upsertAffiliateCommissionRuleHandler,
  deactivateAffiliateCommissionRuleHandler
} from '../controllers/adminAffiliateController.js';
import {
  createComplianceControlHandler,
  deleteComplianceControlHandler,
  listComplianceControlsHandler,
  updateComplianceAutomationHandler,
  updateComplianceControlHandler
} from '../controllers/adminComplianceControlController.js';
  getAdminTaxonomy,
  upsertTaxonomyType,
  archiveTaxonomyType,
  upsertTaxonomyCategory,
  archiveTaxonomyCategory
} from '../controllers/taxonomyController.js';
  getAdminDashboardOverviewSettings,
  updateAdminDashboardOverviewSettings
} from '../controllers/adminDashboardSettingsController.js';
  getSecurityPostureHandler,
  upsertSecuritySignalHandler,
  deactivateSecuritySignalHandler,
  upsertAutomationTaskHandler,
  removeAutomationTaskHandler,
  upsertTelemetryConnectorHandler,
  removeTelemetryConnectorHandler,
  reorderSecuritySignalsHandler
} from '../controllers/securityPostureController.js';
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
  '/dashboard/overview-settings',
  authenticate,
  enforcePolicy('admin.dashboard.view', {
    metadata: () => ({ section: 'dashboard', surface: 'overview-settings' })
  }),
  getAdminDashboardOverviewSettings
);
router.put(
  '/dashboard/overview-settings',
  authenticate,
  enforcePolicy('admin.dashboard.configure', {
    metadata: () => ({ section: 'dashboard', surface: 'overview-settings' })
  }),
  updateAdminDashboardOverviewSettings
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
router.post(
  '/platform-settings/test',
  authenticate,
  enforcePolicy('admin.platform.write', {
    metadata: () => ({ section: 'platform-settings', action: 'diagnostic' })
  }),
  triggerPlatformSettingDiagnostic
);
router.get(
  '/platform-settings/audit',
  authenticate,
  enforcePolicy('admin.platform.read', {
    metadata: () => ({ section: 'platform-settings', action: 'audit' })
  }),
  listPlatformSettingDiagnostics
);

router.get(
  '/security-posture',
  authenticate,
  enforcePolicy('admin.security.posture.read', { metadata: () => ({ section: 'security-posture' }) }),
  getSecurityPostureHandler
);

router.post(
  '/security-posture/signals',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: () => ({ entity: 'signal', method: 'POST' })
  }),
  upsertSecuritySignalHandler
);

router.put(
  '/security-posture/signals/:id',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: (req) => ({ entity: 'signal', method: 'PUT', signalId: req.params.id })
  }),
  upsertSecuritySignalHandler
);

router.put(
  '/security-posture/signals/reorder',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: () => ({ entity: 'signal', method: 'REORDER' })
  }),
  reorderSecuritySignalsHandler
);

router.delete(
  '/security-posture/signals/:id',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: (req) => ({ entity: 'signal', method: 'DELETE', signalId: req.params.id })
  }),
  deactivateSecuritySignalHandler
);

router.post(
  '/security-posture/automation',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: () => ({ entity: 'automation-task', method: 'POST' })
  }),
  upsertAutomationTaskHandler
);

router.put(
  '/security-posture/automation/:id',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: (req) => ({ entity: 'automation-task', method: 'PUT', taskId: req.params.id })
  }),
  upsertAutomationTaskHandler
);

router.delete(
  '/security-posture/automation/:id',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: (req) => ({ entity: 'automation-task', method: 'DELETE', taskId: req.params.id })
  }),
  removeAutomationTaskHandler
);

router.post(
  '/security-posture/connectors',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: () => ({ entity: 'connector', method: 'POST' })
  }),
  upsertTelemetryConnectorHandler
);

router.put(
  '/security-posture/connectors/:id',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: (req) => ({ entity: 'connector', method: 'PUT', connectorId: req.params.id })
  }),
  upsertTelemetryConnectorHandler
);

router.delete(
  '/security-posture/connectors/:id',
  authenticate,
  enforcePolicy('admin.security.posture.write', {
    metadata: (req) => ({ entity: 'connector', method: 'DELETE', connectorId: req.params.id })
  }),
  removeTelemetryConnectorHandler
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
  '/compliance/controls',
  authenticate,
  enforcePolicy('admin.compliance.read', { metadata: () => ({ entity: 'controls' }) }),
  listComplianceControlsHandler
);

router.post(
  '/compliance/controls',
  authenticate,
  enforcePolicy('admin.compliance.write', { metadata: () => ({ entity: 'controls', action: 'create' }) }),
  createComplianceControlHandler
);

router.put(
  '/compliance/controls/:controlId',
  authenticate,
  enforcePolicy('admin.compliance.write', {
    metadata: (req) => ({ entity: 'controls', action: 'update', controlId: req.params.controlId })
  }),
  updateComplianceControlHandler
);

router.delete(
  '/compliance/controls/:controlId',
  authenticate,
  enforcePolicy('admin.compliance.write', {
    metadata: (req) => ({ entity: 'controls', action: 'delete', controlId: req.params.controlId })
  }),
  deleteComplianceControlHandler
);

router.put(
  '/compliance/controls/automation',
  authenticate,
  enforcePolicy('admin.compliance.write', { metadata: () => ({ entity: 'controls', action: 'automation' }) }),
  updateComplianceAutomationHandler
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
