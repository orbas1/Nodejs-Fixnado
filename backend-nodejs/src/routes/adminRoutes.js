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
  fetchAdminProfileSettings,
  saveAdminProfileSettings,
  createAdminProfileDelegate,
  updateAdminProfileDelegate,
  deleteAdminProfileDelegate
} from '../controllers/adminProfileController.js';
  listPlatformSettingDiagnostics,
  triggerPlatformSettingDiagnostic
} from '../controllers/platformSettingsDiagnosticsController.js';
import {
  getAffiliateSettingsHandler,
  saveAffiliateSettingsHandler,
  listAffiliateCommissionRulesHandler,
  upsertAffiliateCommissionRuleHandler,
  deactivateAffiliateCommissionRuleHandler,
  listAffiliateProfilesHandler,
  createAffiliateProfileHandler,
  updateAffiliateProfileHandler,
  listAffiliateLedgerEntriesHandler,
  createAffiliateLedgerEntryHandler,
  listAffiliateReferralsHandler,
  createAffiliateReferralHandler,
  updateAffiliateReferralHandler
} from '../controllers/adminAffiliateController.js';
import {
  fetchAdminPreferences,
  saveAdminPreferences
} from '../controllers/adminPreferencesController.js';
  getDisputeHealthWorkspaceHandler,
  createDisputeHealthBucketHandler,
  updateDisputeHealthBucketHandler,
  archiveDisputeHealthBucketHandler,
  upsertDisputeHealthEntryHandler,
  getDisputeHealthBucketHistoryHandler,
  deleteDisputeHealthEntryHandler
} from '../controllers/disputeHealthController.js';
  getCommandMetricsConfiguration,
  saveCommandMetricSettings,
  createCommandMetricCardHandler,
  updateCommandMetricCardHandler,
  deleteCommandMetricCardHandler
} from '../controllers/commandMetricsController.js';
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
  listAutomationBacklogHandler,
  createAutomationBacklogHandler,
  updateAutomationBacklogHandler,
  archiveAutomationBacklogHandler
} from '../controllers/automationBacklogController.js';
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
  listAppearanceProfilesHandler,
  getAppearanceProfileHandler,
  createAppearanceProfileHandler,
  updateAppearanceProfileHandler,
  archiveAppearanceProfileHandler
} from '../controllers/adminAppearanceController.js';
  getInboxSnapshot,
  saveInboxConfiguration,
  saveInboxQueue,
  removeInboxQueue,
  saveInboxTemplate,
  removeInboxTemplate
} from '../controllers/adminInboxController.js';
  listPurchaseOrdersHandler,
  getPurchaseOrderHandler,
  createPurchaseOrderHandler,
  updatePurchaseOrderHandler,
  updatePurchaseOrderStatusHandler,
  recordPurchaseReceiptHandler,
  addPurchaseAttachmentHandler,
  deletePurchaseAttachmentHandler,
  listSuppliersHandler,
  upsertSupplierHandler,
  updateSupplierStatusHandler,
  listPurchaseBudgetsHandler,
  upsertPurchaseBudgetHandler
} from '../controllers/purchaseManagementController.js';
  listLegalDocuments,
  getLegalDocument,
  createLegalDocumentHandler,
  updateLegalDocumentHandler,
  createDraft,
  updateDraft,
  publishVersion,
  archiveDraft,
  deleteLegalDocumentHandler
} from '../controllers/legalAdminController.js';
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
  listAuditEventsHandler,
  createAuditEventHandler,
  updateAuditEventHandler,
  deleteAuditEventHandler,
  listAuditEventValidators,
  createAuditEventValidators,
  updateAuditEventValidators
} from '../controllers/adminAuditEventController.js';
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
  '/audit/events',
  authenticate,
  enforcePolicy('admin.audit.read', {
    metadata: (req) => ({
      section: 'audit-timeline',
      timeframe: req.query.timeframe || '7d'
    })
  }),
  listAuditEventValidators,
  listAuditEventsHandler
);
router.post(
  '/audit/events',
  authenticate,
  enforcePolicy('admin.audit.write', { metadata: () => ({ section: 'audit-timeline', action: 'create' }) }),
  createAuditEventValidators,
  createAuditEventHandler
);
router.put(
  '/audit/events/:id',
  authenticate,
  enforcePolicy('admin.audit.write', {
    metadata: (req) => ({ section: 'audit-timeline', action: 'update', eventId: req.params.id })
  }),
  updateAuditEventValidators,
  updateAuditEventHandler
);
router.delete(
  '/audit/events/:id',
  authenticate,
  enforcePolicy('admin.audit.write', {
    metadata: (req) => ({ section: 'audit-timeline', action: 'delete', eventId: req.params.id })
  }),
  deleteAuditEventHandler
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
  '/automation/backlog',
  authenticate,
  enforcePolicy('admin.automation.read', { metadata: (req) => ({ includeArchived: req.query.includeArchived === 'true' }) }),
  listAutomationBacklogHandler
);
router.post(
  '/automation/backlog',
  authenticate,
  enforcePolicy('admin.automation.write', { metadata: () => ({ action: 'create' }) }),
  createAutomationBacklogHandler
);
router.patch(
  '/automation/backlog/:id',
  authenticate,
  enforcePolicy('admin.automation.write', { metadata: (req) => ({ action: 'update', initiativeId: req.params.id }) }),
  updateAutomationBacklogHandler
);
router.delete(
  '/automation/backlog/:id',
  authenticate,
  enforcePolicy('admin.automation.write', { metadata: (req) => ({ action: 'archive', initiativeId: req.params.id }) }),
  archiveAutomationBacklogHandler
);

router.get(
  '/preferences',
  authenticate,
  enforcePolicy('admin.preferences.read', { metadata: () => ({ section: 'admin-preferences' }) }),
  fetchAdminPreferences
);

router.put(
  '/preferences',
  authenticate,
  enforcePolicy('admin.preferences.write', { metadata: () => ({ section: 'admin-preferences' }) }),
  saveAdminPreferences
);

router.get(
  '/profile-settings',
  authenticate,
  enforcePolicy('admin.profile.read', { metadata: () => ({ section: 'profile-settings' }) }),
  fetchAdminProfileSettings
);
router.put(
  '/profile-settings',
  authenticate,
  enforcePolicy('admin.profile.write', { metadata: () => ({ section: 'profile-settings' }) }),
  saveAdminProfileSettings
);
router.post(
  '/profile-settings/delegates',
  authenticate,
  enforcePolicy('admin.profile.write', {
    metadata: () => ({ section: 'profile-settings', entity: 'delegates' })
  }),
  createAdminProfileDelegate
);
router.patch(
  '/profile-settings/delegates/:id',
  authenticate,
  enforcePolicy('admin.profile.write', {
    metadata: (req) => ({ section: 'profile-settings', delegateId: req.params.id })
  }),
  updateAdminProfileDelegate
);
router.delete(
  '/profile-settings/delegates/:id',
  authenticate,
  enforcePolicy('admin.profile.write', {
    metadata: (req) => ({ section: 'profile-settings', delegateId: req.params.id })
  }),
  deleteAdminProfileDelegate
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
  '/disputes/health',
  authenticate,
  enforcePolicy('finance.disputes.read'),
  getDisputeHealthWorkspaceHandler
);

router.get(
  '/disputes/health/buckets/:bucketId/history',
  authenticate,
  enforcePolicy('finance.disputes.read'),
  getDisputeHealthBucketHistoryHandler
);

router.post(
  '/disputes/health/buckets',
  authenticate,
  enforcePolicy('finance.disputes.manage'),
  createDisputeHealthBucketHandler
);

router.put(
  '/disputes/health/buckets/:bucketId',
  authenticate,
  enforcePolicy('finance.disputes.manage'),
  updateDisputeHealthBucketHandler
);

router.delete(
  '/disputes/health/buckets/:bucketId',
  authenticate,
  enforcePolicy('finance.disputes.manage'),
  archiveDisputeHealthBucketHandler
);

router.post(
  '/disputes/health/entries',
  authenticate,
  enforcePolicy('finance.disputes.manage'),
  upsertDisputeHealthEntryHandler
);

router.put(
  '/disputes/health/entries/:entryId',
  authenticate,
  enforcePolicy('finance.disputes.manage'),
  upsertDisputeHealthEntryHandler
);

router.delete(
  '/disputes/health/entries/:entryId',
  authenticate,
  enforcePolicy('finance.disputes.manage'),
  deleteDisputeHealthEntryHandler
  '/command-metrics/config',
  authenticate,
  enforcePolicy('admin.commandMetrics.read', {
    metadata: () => ({ entity: 'command-metrics', scope: 'configuration' })
  }),
  getCommandMetricsConfiguration
);
router.put(
  '/command-metrics/settings',
  authenticate,
  enforcePolicy('admin.commandMetrics.write', {
    metadata: () => ({ entity: 'command-metrics', scope: 'settings' })
  }),
  saveCommandMetricSettings
);
router.post(
  '/command-metrics/cards',
  authenticate,
  enforcePolicy('admin.commandMetrics.write', {
    metadata: () => ({ entity: 'command-metrics', scope: 'cards', method: 'create' })
  }),
  createCommandMetricCardHandler
);
router.patch(
  '/command-metrics/cards/:id',
  authenticate,
  enforcePolicy('admin.commandMetrics.write', {
    metadata: (req) => ({ entity: 'command-metrics', scope: 'cards', cardId: req.params.id, method: req.method })
  }),
  updateCommandMetricCardHandler
);
router.delete(
  '/command-metrics/cards/:id',
  authenticate,
  enforcePolicy('admin.commandMetrics.write', {
    metadata: (req) => ({ entity: 'command-metrics', scope: 'cards', cardId: req.params.id, method: req.method })
  }),
  deleteCommandMetricCardHandler
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
  '/inbox',
  authenticate,
  enforcePolicy('admin.inbox.read', { metadata: () => ({ section: 'inbox' }) }),
  getInboxSnapshot
);

router.put(
  '/inbox/configuration',
  authenticate,
  enforcePolicy('admin.inbox.write', { metadata: () => ({ entity: 'configuration' }) }),
  saveInboxConfiguration
);

router.post(
  '/inbox/queues',
  authenticate,
  enforcePolicy('admin.inbox.write', { metadata: () => ({ entity: 'queues', method: 'POST' }) }),
  saveInboxQueue
);

router.put(
  '/inbox/queues/:id',
  authenticate,
  enforcePolicy('admin.inbox.write', {
    metadata: (req) => ({ entity: 'queues', queueId: req.params.id, method: 'PUT' })
  }),
  saveInboxQueue
);

router.delete(
  '/inbox/queues/:id',
  authenticate,
  enforcePolicy('admin.inbox.write', {
    metadata: (req) => ({ entity: 'queues', queueId: req.params.id, method: 'DELETE' })
  }),
  removeInboxQueue
);

router.post(
  '/inbox/templates',
  authenticate,
  enforcePolicy('admin.inbox.write', { metadata: () => ({ entity: 'templates', method: 'POST' }) }),
  saveInboxTemplate
);

router.put(
  '/inbox/templates/:id',
  authenticate,
  enforcePolicy('admin.inbox.write', {
    metadata: (req) => ({ entity: 'templates', templateId: req.params.id, method: 'PUT' })
  }),
  saveInboxTemplate
);

router.delete(
  '/inbox/templates/:id',
  authenticate,
  enforcePolicy('admin.inbox.write', {
    metadata: (req) => ({ entity: 'templates', templateId: req.params.id, method: 'DELETE' })
  }),
  removeInboxTemplate
  '/purchases/orders',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'orders', status: req.query?.status ?? 'all' })
  }),
  listPurchaseOrdersHandler
);
router.post(
  '/purchases/orders',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'create', supplierId: req.body?.supplierId ?? null })
  }),
  createPurchaseOrderHandler
);
router.get(
  '/purchases/orders/:orderId',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'orders', action: 'view', orderId: req.params.orderId })
  }),
  getPurchaseOrderHandler
);
router.put(
  '/purchases/orders/:orderId',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'update', orderId: req.params.orderId })
  }),
  updatePurchaseOrderHandler
);
router.patch(
  '/purchases/orders/:orderId/status',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'status', orderId: req.params.orderId, nextStatus: req.body?.status })
  }),
  updatePurchaseOrderStatusHandler
);
router.post(
  '/purchases/orders/:orderId/receipts',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'receipt', orderId: req.params.orderId })
  }),
  recordPurchaseReceiptHandler
);
router.post(
  '/purchases/orders/:orderId/attachments',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'add-attachment', orderId: req.params.orderId })
  }),
  addPurchaseAttachmentHandler
);
router.delete(
  '/purchases/orders/:orderId/attachments/:attachmentId',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'orders', action: 'remove-attachment', orderId: req.params.orderId })
  }),
  deletePurchaseAttachmentHandler
);

router.get(
  '/purchases/suppliers',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'suppliers', status: req.query?.status ?? 'all' })
  }),
  listSuppliersHandler
);
router.post(
  '/purchases/suppliers',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: () => ({ scope: 'suppliers', action: 'create' })
  }),
  upsertSupplierHandler
);
router.put(
  '/purchases/suppliers/:supplierId',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'suppliers', action: 'update', supplierId: req.params.supplierId })
  }),
  upsertSupplierHandler
);
router.patch(
  '/purchases/suppliers/:supplierId/status',
  authenticate,
  enforcePolicy('admin.purchases.write', {
    metadata: (req) => ({ scope: 'suppliers', action: 'status', supplierId: req.params.supplierId, status: req.body?.status })
  }),
  updateSupplierStatusHandler
);

router.get(
  '/purchases/budgets',
  authenticate,
  enforcePolicy('admin.purchases.read', {
    metadata: (req) => ({ scope: 'budgets', fiscalYear: req.query?.fiscalYear ?? null })
  }),
  listPurchaseBudgetsHandler
);
router.post(
  '/purchases/budgets',
  authenticate,
  enforcePolicy('admin.purchases.budget', {
    metadata: (req) => ({ scope: 'budgets', action: 'create', category: req.body?.category ?? null })
  }),
  upsertPurchaseBudgetHandler
);
router.put(
  '/purchases/budgets/:budgetId',
  authenticate,
  enforcePolicy('admin.purchases.budget', {
    metadata: (req) => ({ scope: 'budgets', action: 'update', budgetId: req.params.budgetId })
  }),
  upsertPurchaseBudgetHandler
  '/legal',
  authenticate,
  enforcePolicy('admin.legal.read', { metadata: () => ({ scope: 'collection' }) }),
  listLegalDocuments
);

router.get(
  '/legal/:slug',
  authenticate,
  enforcePolicy('admin.legal.read', {
    metadata: (req) => ({ scope: 'single', slug: req.params.slug })
  }),
  getLegalDocument
);

router.post(
  '/legal',
  authenticate,
  enforcePolicy('admin.legal.write', { metadata: () => ({ action: 'create-document' }) }),
  createLegalDocumentHandler
);

router.put(
  '/legal/:slug',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'update-metadata', slug: req.params.slug })
  }),
  updateLegalDocumentHandler
);

router.post(
  '/legal/:slug/versions',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'create-draft', slug: req.params.slug })
  }),
  createDraft
);

router.put(
  '/legal/:slug/versions/:versionId',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'update-draft', slug: req.params.slug, versionId: req.params.versionId })
  }),
  updateDraft
);

router.post(
  '/legal/:slug/versions/:versionId/publish',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'publish', slug: req.params.slug, versionId: req.params.versionId })
  }),
  publishVersion
);

router.post(
  '/legal/:slug/versions/:versionId/archive',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'archive-draft', slug: req.params.slug, versionId: req.params.versionId })
  }),
  archiveDraft
);

router.delete(
  '/legal/:slug',
  authenticate,
  enforcePolicy('admin.legal.write', {
    metadata: (req) => ({ action: 'delete-document', slug: req.params.slug })
  }),
  deleteLegalDocumentHandler
  '/affiliate/profiles',
  authenticate,
  enforcePolicy('admin.affiliates.read', { metadata: () => ({ entity: 'profiles' }) }),
  listAffiliateProfilesHandler
);
router.post(
  '/affiliate/profiles',
  authenticate,
  enforcePolicy('admin.affiliates.write', { metadata: () => ({ entity: 'profiles' }) }),
  createAffiliateProfileHandler
);
router.patch(
  '/affiliate/profiles/:id',
  authenticate,
  enforcePolicy('admin.affiliates.write', {
    metadata: (req) => ({ entity: 'profiles', profileId: req.params.id })
  }),
  updateAffiliateProfileHandler
);
router.get(
  '/affiliate/profiles/:id/ledger',
  authenticate,
  enforcePolicy('admin.affiliates.read', {
    metadata: (req) => ({ entity: 'ledger', profileId: req.params.id })
  }),
  listAffiliateLedgerEntriesHandler
);
router.post(
  '/affiliate/profiles/:id/ledger',
  authenticate,
  enforcePolicy('admin.affiliates.write', {
    metadata: (req) => ({ entity: 'ledger', profileId: req.params.id })
  }),
  createAffiliateLedgerEntryHandler
);

router.get(
  '/affiliate/referrals',
  authenticate,
  enforcePolicy('admin.affiliates.read', { metadata: () => ({ entity: 'referrals' }) }),
  listAffiliateReferralsHandler
);
router.post(
  '/affiliate/referrals',
  authenticate,
  enforcePolicy('admin.affiliates.write', { metadata: () => ({ entity: 'referrals' }) }),
  createAffiliateReferralHandler
);
router.patch(
  '/affiliate/referrals/:id',
  authenticate,
  enforcePolicy('admin.affiliates.write', {
    metadata: (req) => ({ entity: 'referrals', referralId: req.params.id })
  }),
  updateAffiliateReferralHandler
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
