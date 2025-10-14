import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import { authenticate, authorize, requireStorefrontRole } from '../middleware/auth.js';

const router = Router();

router.get(
  '/provider/dashboard',
  authenticate,
  authorize(['company', 'admin']),
  getProviderDashboardHandler
);

router.get(
  '/provider/storefront',
  requireStorefrontRole,
  getProviderStorefrontHandler
);

router.get(
  '/enterprise/overview',
  authenticate,
  authorize(['company', 'admin']),
  getEnterprisePanelHandler
);

export default router;
