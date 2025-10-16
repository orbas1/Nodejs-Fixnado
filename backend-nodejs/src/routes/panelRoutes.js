import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import {
  getProviderEnterpriseUpgrade,
  createProviderEnterpriseUpgrade,
  updateProviderEnterpriseUpgrade
} from '../controllers/providerUpgradeController.js';
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
  '/enterprise/overview',
  authenticate,
  enforcePolicy('panel.enterprise.dashboard', { metadata: () => ({ section: 'enterprise-overview' }) }),
  getEnterprisePanelHandler
);
router.get('/provider/storefront', maybeAuthenticate, requireStorefrontRole, getProviderStorefrontHandler);

export default router;
