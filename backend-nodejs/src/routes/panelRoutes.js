import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import {
  listToolSalesHandler,
  createToolSaleHandler,
  updateToolSaleHandler,
  deleteToolSaleHandler,
  createToolSaleCouponHandler,
  updateToolSaleCouponHandler,
  deleteToolSaleCouponHandler
} from '../controllers/toolSalesController.js';
import { authenticate, maybeAuthenticate, requireStorefrontRole } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
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

const router = Router();

router.get(
  '/provider/dashboard',
  authenticate,
  enforcePolicy('panel.provider.dashboard', { metadata: () => ({ section: 'provider-dashboard' }) }),
  getProviderDashboardHandler
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
  enforcePolicy('panel.provider.tools.manage', { metadata: (req) => ({ section: 'provider-tools', method: req.method }) }),
  createToolSaleHandler
);
router.put(
  '/provider/tools/:profileId',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({ section: 'provider-tools', method: req.method, profileId: req.params.profileId ?? null })
  }),
  updateToolSaleHandler
);
router.delete(
  '/provider/tools/:profileId',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({ section: 'provider-tools', method: req.method, profileId: req.params.profileId ?? null })
  }),
  deleteToolSaleHandler
);
router.post(
  '/provider/tools/:profileId/coupons',
  authenticate,
  enforcePolicy('panel.provider.tools.manage', {
    metadata: (req) => ({ section: 'provider-tools', method: req.method, profileId: req.params.profileId ?? null })
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
