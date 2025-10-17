import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import {
  getProviderWebsitePreferencesHandler,
  updateProviderWebsitePreferencesHandler
} from '../controllers/providerWebsitePreferencesController.js';
import {
  listProviderServicemenHandler,
  createProviderServicemanHandler,
  updateProviderServicemanHandler,
  deleteProviderServicemanHandler
} from '../controllers/providerServicemanController.js';
import {
  getProviderEnterpriseUpgrade,
  createProviderEnterpriseUpgrade,
  updateProviderEnterpriseUpgrade
} from '../controllers/providerUpgradeController.js';
import {
  getProviderOnboardingWorkspaceHandler,
  createProviderOnboardingTaskHandler,
  updateProviderOnboardingTaskHandler,
  updateProviderOnboardingTaskStatusHandler,
  deleteProviderOnboardingTaskHandler,
  createProviderOnboardingRequirementHandler,
  updateProviderOnboardingRequirementHandler,
  updateProviderOnboardingRequirementStatusHandler,
  deleteProviderOnboardingRequirementHandler,
  createProviderOnboardingNoteHandler,
  getWorkspaceValidators,
  createTaskValidators,
  updateTaskValidators,
  updateTaskStatusValidators,
  deleteTaskValidators,
  createRequirementValidators,
  updateRequirementValidators,
  updateRequirementStatusValidators,
  deleteRequirementValidators,
  createNoteValidators
} from '../controllers/providerOnboardingController.js';
import {
  listToolSalesHandler,
  createToolSaleHandler,
  updateToolSaleHandler,
  deleteToolSaleHandler,
  createToolSaleCouponHandler,
  updateToolSaleCouponHandler,
  deleteToolSaleCouponHandler
} from '../controllers/toolSalesController.js';
import {
  validateStorefrontWorkspace,
  getStorefrontWorkspaceHandler,
  validateStorefrontSettings,
  updateStorefrontSettingsHandler,
  validateCreateInventory,
  createInventoryItemHandler,
  validateUpdateInventory,
  updateInventoryItemHandler,
  validateArchiveInventory,
  archiveInventoryItemHandler,
  validateCreateCoupon,
  createCouponHandler,
  validateUpdateCoupon,
  updateCouponHandler,
  validateUpdateCouponStatus,
  updateCouponStatusHandler
} from '../controllers/providerStorefrontManagementController.js';
import { authenticate, maybeAuthenticate, requireStorefrontRole } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import providerServicemanFinanceRoutes from './providerServicemanFinanceRoutes.js';
import providerCampaignRoutes from './providerCampaignRoutes.js';
import providerServiceManagementRoutes from './providerServiceManagementRoutes.js';

const router = Router();

router.get(
  '/provider/dashboard',
  authenticate,
  enforcePolicy('panel.provider.dashboard', { metadata: () => ({ section: 'provider-dashboard' }) }),
  getProviderDashboardHandler
);

router.get(
  '/provider/website-preferences',
  authenticate,
  enforcePolicy('panel.provider.website', {
    metadata: () => ({ section: 'provider-website-preferences', action: 'read' })
  }),
  getProviderWebsitePreferencesHandler
);

router.put(
  '/provider/website-preferences',
  authenticate,
  enforcePolicy('panel.provider.website', {
    metadata: () => ({ section: 'provider-website-preferences', action: 'update' })
  }),
  updateProviderWebsitePreferencesHandler
);

router.get(
  '/provider/servicemen',
  authenticate,
  enforcePolicy('panel.provider.servicemen.manage', {
    metadata: (req) => ({
      companyId: req.query.companyId ?? null,
      method: 'list'
    })
  }),
  listProviderServicemenHandler
);

router.post(
  '/provider/servicemen',
  authenticate,
  enforcePolicy('panel.provider.servicemen.manage', {
    metadata: (req) => ({
      companyId: req.query.companyId ?? null,
      method: 'create'
    })
  }),
  createProviderServicemanHandler
);

router.put(
  '/provider/servicemen/:servicemanId',
  authenticate,
  enforcePolicy('panel.provider.servicemen.manage', {
    metadata: (req) => ({
      companyId: req.query.companyId ?? null,
      servicemanId: req.params.servicemanId ?? null,
      method: 'update'
    })
  }),
  updateProviderServicemanHandler
);

router.delete(
  '/provider/servicemen/:servicemanId',
  authenticate,
  enforcePolicy('panel.provider.servicemen.manage', {
    metadata: (req) => ({
      companyId: req.query.companyId ?? null,
      servicemanId: req.params.servicemanId ?? null,
      method: 'delete'
    })
  }),
  deleteProviderServicemanHandler
);

router.get(
  '/provider/enterprise-upgrade',
  authenticate,
  enforcePolicy('panel.provider.enterpriseUpgrade.view', {
    metadata: (req) => ({ companyId: req.query?.companyId ?? null })
  }),
  getProviderEnterpriseUpgrade
);

router.post(
  '/provider/enterprise-upgrade',
  authenticate,
  enforcePolicy('panel.provider.enterpriseUpgrade.manage', {
    metadata: (req) => ({ companyId: req.body?.companyId ?? req.query?.companyId ?? null })
  }),
  createProviderEnterpriseUpgrade
);

router.put(
  '/provider/enterprise-upgrade/:requestId',
  authenticate,
  enforcePolicy('panel.provider.enterpriseUpgrade.manage', {
    metadata: (req) => ({
      companyId: req.body?.companyId ?? req.query?.companyId ?? null,
      requestId: req.params.requestId
    })
  }),
  updateProviderEnterpriseUpgrade
);

router.get(
  '/provider/onboarding',
  authenticate,
  enforcePolicy('panel.provider.onboarding.read', {
    metadata: () => ({ section: 'provider-onboarding' })
  }),
  ...getWorkspaceValidators,
  getProviderOnboardingWorkspaceHandler
);

router.post(
  '/provider/onboarding/tasks',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: () => ({ section: 'provider-onboarding', entity: 'tasks', action: 'create' })
  }),
  ...createTaskValidators,
  createProviderOnboardingTaskHandler
);

router.put(
  '/provider/onboarding/tasks/:taskId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'tasks',
      action: 'update',
      taskId: req.params.taskId
    })
  }),
  ...updateTaskValidators,
  updateProviderOnboardingTaskHandler
);

router.patch(
  '/provider/onboarding/tasks/:taskId/status',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'tasks',
      action: 'status',
      taskId: req.params.taskId,
      status: req.body?.status
    })
  }),
  ...updateTaskStatusValidators,
  updateProviderOnboardingTaskStatusHandler
);

router.delete(
  '/provider/onboarding/tasks/:taskId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'tasks',
      action: 'delete',
      taskId: req.params.taskId
    })
  }),
  ...deleteTaskValidators,
  deleteProviderOnboardingTaskHandler
);

router.post(
  '/provider/onboarding/requirements',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: () => ({ section: 'provider-onboarding', entity: 'requirements', action: 'create' })
  }),
  ...createRequirementValidators,
  createProviderOnboardingRequirementHandler
);

router.put(
  '/provider/onboarding/requirements/:requirementId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'requirements',
      action: 'update',
      requirementId: req.params.requirementId
    })
  }),
  ...updateRequirementValidators,
  updateProviderOnboardingRequirementHandler
);

router.patch(
  '/provider/onboarding/requirements/:requirementId/status',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'requirements',
      action: 'status',
      requirementId: req.params.requirementId,
      status: req.body?.status
    })
  }),
  ...updateRequirementStatusValidators,
  updateProviderOnboardingRequirementStatusHandler
);

router.delete(
  '/provider/onboarding/requirements/:requirementId',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: (req) => ({
      section: 'provider-onboarding',
      entity: 'requirements',
      action: 'delete',
      requirementId: req.params.requirementId
    })
  }),
  ...deleteRequirementValidators,
  deleteProviderOnboardingRequirementHandler
);

router.post(
  '/provider/onboarding/notes',
  authenticate,
  enforcePolicy('panel.provider.onboarding.write', {
    metadata: () => ({ section: 'provider-onboarding', entity: 'notes', action: 'create' })
  }),
  ...createNoteValidators,
  createProviderOnboardingNoteHandler
);

router.get(
  '/provider/tools',
  authenticate,
  enforcePolicy('panel.provider.tools.read', { metadata: () => ({ section: 'provider-tools' }) }),
  listToolSalesHandler
);

router.post(
  '/provider/tools',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({ section: 'provider-tools', method: req.method })
  }),
  createToolSaleHandler
);

router.put(
  '/provider/tools/:profileId',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({
      section: 'provider-tools',
      method: req.method,
      profileId: req.params.profileId ?? null
    })
  }),
  updateToolSaleHandler
);

router.delete(
  '/provider/tools/:profileId',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({
      section: 'provider-tools',
      method: req.method,
      profileId: req.params.profileId ?? null
    })
  }),
  deleteToolSaleHandler
);

router.post(
  '/provider/tools/:profileId/coupons',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({
      section: 'provider-tools',
      method: req.method,
      profileId: req.params.profileId ?? null
    })
  }),
  createToolSaleCouponHandler
);

router.put(
  '/provider/tools/:profileId/coupons/:couponId',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({
      section: 'provider-tools',
      method: req.method,
      profileId: req.params.profileId ?? null,
      couponId: req.params.couponId ?? null
    })
  }),
  updateToolSaleCouponHandler
);

router.delete(
  '/provider/tools/:profileId/coupons/:couponId',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({
      section: 'provider-tools',
      method: req.method,
      profileId: req.params.profileId ?? null,
      couponId: req.params.couponId ?? null
    })
  }),
  deleteToolSaleCouponHandler
);

router.get(
  '/enterprise/overview',
  authenticate,
  enforcePolicy('panel.enterprise.dashboard', { metadata: () => ({ section: 'enterprise-overview' }) }),
  getEnterprisePanelHandler
);

router.get('/provider/storefront', maybeAuthenticate, requireStorefrontRole, getProviderStorefrontHandler);

router.use('/provider/servicemen', providerServicemanFinanceRoutes);
router.use('/provider/campaigns', providerCampaignRoutes);
router.use('/provider/services', providerServiceManagementRoutes);

router.get(
  '/provider/storefront/workspace',
  authenticate,
  requireStorefrontRole,
  validateStorefrontWorkspace,
  getStorefrontWorkspaceHandler
);

router.put(
  '/provider/storefront/settings',
  authenticate,
  requireStorefrontRole,
  validateStorefrontSettings,
  updateStorefrontSettingsHandler
);

router.post(
  '/provider/storefront/inventory',
  authenticate,
  requireStorefrontRole,
  validateCreateInventory,
  createInventoryItemHandler
);

router.put(
  '/provider/storefront/inventory/:inventoryId',
  authenticate,
  requireStorefrontRole,
  validateUpdateInventory,
  updateInventoryItemHandler
);

router.delete(
  '/provider/storefront/inventory/:inventoryId',
  authenticate,
  requireStorefrontRole,
  validateArchiveInventory,
  archiveInventoryItemHandler
);

router.post(
  '/provider/storefront/coupons',
  authenticate,
  requireStorefrontRole,
  validateCreateCoupon,
  createCouponHandler
);

router.put(
  '/provider/storefront/coupons/:couponId',
  authenticate,
  requireStorefrontRole,
  validateUpdateCoupon,
  updateCouponHandler
);

router.patch(
  '/provider/storefront/coupons/:couponId/status',
  authenticate,
  requireStorefrontRole,
  validateUpdateCouponStatus,
  updateCouponStatusHandler
);

export default router;
