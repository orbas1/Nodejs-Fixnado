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

export default router;
