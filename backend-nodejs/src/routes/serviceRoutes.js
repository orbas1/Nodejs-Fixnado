import { Router } from 'express';
import { body } from 'express-validator';
import { listServices, createService, purchaseService } from '../controllers/serviceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Permissions } from '../services/accessControlService.js';

const router = Router();

router.get('/', listServices);

router.post(
  '/',
  authenticate,
  authorize([Permissions.SERVICES_MANAGE]),
  [
    body('title').isString().isLength({ min: 3 }),
    body('price').isFloat({ gt: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('companyId').optional().isUUID()
  ],
  createService
);

router.post(
  '/:serviceId/purchase',
  authenticate,
  authorize([Permissions.SERVICES_BOOK]),
  [
    body('zoneId').isUUID(),
    body('bookingType').optional().isIn(['on_demand', 'scheduled']),
    body('scheduledStart').optional().isISO8601(),
    body('scheduledEnd').optional().isISO8601(),
    body('baseAmount').optional().isFloat({ gt: 0 }),
    body('totalAmount').optional().isFloat({ gt: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('demandLevel').optional().isIn(['low', 'medium', 'high']),
    body('metadata').optional().isObject()
  ],
  purchaseService
);

export default router;
