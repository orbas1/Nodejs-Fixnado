import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import {
  listProviderServicemenHandler,
  createProviderServicemanHandler,
  updateProviderServicemanHandler,
  deleteProviderServicemanHandler
} from '../controllers/providerServicemanController.js';
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
  '/enterprise/overview',
  authenticate,
  enforcePolicy('panel.enterprise.dashboard', { metadata: () => ({ section: 'enterprise-overview' }) }),
  getEnterprisePanelHandler
);
router.get('/provider/storefront', maybeAuthenticate, requireStorefrontRole, getProviderStorefrontHandler);

export default router;
