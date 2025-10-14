import { Router } from 'express';
import { getEnterprisePanelHandler, getProviderDashboardHandler } from '../controllers/panelController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/provider/dashboard', authenticate, authorize(['company']), getProviderDashboardHandler);
router.get('/enterprise/overview', getEnterprisePanelHandler);

export default router;

