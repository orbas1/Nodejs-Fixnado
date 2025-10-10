import { Router } from 'express';
import { body } from 'express-validator';
import { listServices, createService, purchaseService } from '../controllers/serviceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', listServices);

router.post(
  '/',
  authenticate,
  authorize(['servicemen', 'company']),
  [body('title').notEmpty(), body('price').isNumeric()],
  createService
);

router.post(
  '/:serviceId/purchase',
  authenticate,
  authorize(['user', 'company']),
  [body('totalAmount').optional().isNumeric()],
  purchaseService
);

export default router;
