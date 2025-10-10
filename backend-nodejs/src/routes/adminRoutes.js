import { Router } from 'express';
import { dashboard } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, authorize(['company']), dashboard);

export default router;
