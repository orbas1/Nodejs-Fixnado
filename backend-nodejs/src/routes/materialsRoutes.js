import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import { materialsShowcase } from '../controllers/materialsController.js';

const router = Router();

router.get('/showcase', authenticate, enforcePolicy('materials.showcase.view'), materialsShowcase);

export default router;
