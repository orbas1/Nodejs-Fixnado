import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
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
