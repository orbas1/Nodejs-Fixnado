import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { materialsShowcase } from '../controllers/materialsController.js';

const router = Router();

router.get('/showcase', authenticate, authorize(['company', 'servicemen']), materialsShowcase);

export default router;
