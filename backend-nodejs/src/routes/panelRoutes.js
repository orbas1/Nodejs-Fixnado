import { Router } from 'express';
import { getEnterprisePanelHandler, getProviderDashboardHandler } from '../controllers/panelController.js';

const router = Router();

router.get('/provider/dashboard', getProviderDashboardHandler);
router.get('/enterprise/overview', getEnterprisePanelHandler);

export default router;

