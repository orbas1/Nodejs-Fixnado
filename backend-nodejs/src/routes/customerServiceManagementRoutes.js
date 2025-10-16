import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getCustomerServices,
  createCustomerService,
  updateCustomerServiceSchedule,
  releaseCustomerEscrow,
  startCustomerServiceDispute,
  getCustomerOrderDetails
} from '../controllers/customerServiceManagementController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const basePolicy = enforcePolicy('customer.services.manage', {
  metadata: (req) => ({ actorId: req.user?.id ?? null })
});

router.get('/', authenticate, basePolicy, getCustomerServices);

router.post(
  '/',
  authenticate,
  basePolicy,
  [
    body('serviceId').isUUID().withMessage('serviceId must be a valid UUID'),
    body('zoneId').isUUID().withMessage('zoneId must be a valid UUID'),
    body('bookingType').optional().isIn(['on_demand', 'scheduled']),
    body('scheduledStart').optional().isISO8601(),
    body('scheduledEnd').optional().isISO8601(),
    body('baseAmount').optional().isFloat({ gt: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('demandLevel').optional().isIn(['low', 'medium', 'high']),
    body('notes').optional().isString().isLength({ max: 2000 })
  ],
  createCustomerService
);

router.get(
  '/orders/:orderId',
  authenticate,
  basePolicy,
  [param('orderId').isUUID()],
  getCustomerOrderDetails
);

router.patch(
  '/orders/:orderId/schedule',
  authenticate,
  basePolicy,
  [
    param('orderId').isUUID(),
    body('scheduledStart').isISO8601(),
    body('scheduledEnd').isISO8601()
  ],
  updateCustomerServiceSchedule
);

router.post(
  '/orders/:orderId/escrow/release',
  authenticate,
  basePolicy,
  [param('orderId').isUUID()],
  releaseCustomerEscrow
);

router.post(
  '/orders/:orderId/disputes',
  authenticate,
  basePolicy,
  [
    param('orderId').isUUID(),
    body('reason').optional().isString().isLength({ max: 2000 }),
    body('regionId').optional().isUUID()
  ],
  startCustomerServiceDispute
);

export default router;
