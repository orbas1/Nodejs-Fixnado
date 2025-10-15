import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Permissions } from '../services/accessControlService.js';
import { materialsShowcase } from '../controllers/materialsController.js';

const router = Router();

router.get('/showcase', authenticate, authorize([Permissions.MATERIALS_VIEW]), materialsShowcase);

export default router;
