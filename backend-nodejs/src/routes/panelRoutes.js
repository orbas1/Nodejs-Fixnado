import { Router } from 'express';
import { getEnterprisePanelHandler, getProviderDashboardHandler } from '../controllers/panelController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/provider/dashboard', authenticate, authorize(['company']), getProviderDashboardHandler);
import {
  getEnterprisePanelHandler,
  getProviderDashboardHandler,
  getProviderStorefrontHandler
} from '../controllers/panelController.js';
import { requireStorefrontRole } from '../middleware/auth.js';

const router = Router();

router.get('/provider/dashboard', getProviderDashboardHandler);
router.get('/provider/storefront', requireStorefrontRole, getProviderStorefrontHandler);
router.get('/enterprise/overview', getEnterprisePanelHandler);

export default router;

