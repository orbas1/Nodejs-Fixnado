import { Router } from 'express';
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import { authenticate, authorize, requireStorefrontRole } from '../middleware/auth.js';
import { Permissions } from '../services/accessControlService.js';

const router = Router();

router.get('/provider/dashboard', authenticate, authorize([Permissions.PANEL_PROVIDER]), getProviderDashboardHandler);
router.get('/enterprise/overview', authenticate, authorize([Permissions.PANEL_ENTERPRISE]), getEnterprisePanelHandler);
router.get('/provider/storefront', authenticate, requireStorefrontRole, getProviderStorefrontHandler);

export default router;
