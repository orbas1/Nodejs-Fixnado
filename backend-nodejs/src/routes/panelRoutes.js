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
  '/enterprise/overview',
  authenticate,
  enforcePolicy('panel.enterprise.dashboard', { metadata: () => ({ section: 'enterprise-overview' }) }),
  getEnterprisePanelHandler
);
router.get('/provider/storefront', maybeAuthenticate, requireStorefrontRole, getProviderStorefrontHandler);

export default router;
