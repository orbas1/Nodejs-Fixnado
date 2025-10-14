import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import { authenticate, authorize, requireStorefrontRole } from '../middleware/auth.js';

const router = Router();

router.get('/provider/dashboard', authenticate, authorize(['company']), getProviderDashboardHandler);
router.get('/enterprise/overview', authenticate, authorize(['company']), getEnterprisePanelHandler);
router.get('/provider/storefront', authenticate, requireStorefrontRole, getProviderStorefrontHandler);

export default router;
