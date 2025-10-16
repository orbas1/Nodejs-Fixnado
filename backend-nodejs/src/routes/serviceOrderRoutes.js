import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  createOrderNote,
  removeOrderNote
} from '../controllers/serviceOrderController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  enforcePolicy('service.orders.read', {
    metadata: (req) => ({ status: req.query?.status || 'all', priority: req.query?.priority || 'all' })
  }),
  listOrders
);

router.get(
  '/:orderId',
  enforcePolicy('service.orders.read', {
    metadata: (req) => ({ orderId: req.params.orderId })
  }),
  [param('orderId').isUUID()],
  getOrder
);

router.post(
  '/',
  enforcePolicy('service.orders.manage', {
    metadata: (req) => ({ method: req.method, serviceId: req.body?.serviceId || null })
  }),
  [
    body('serviceId').isUUID(),
    body('title').isString().isLength({ min: 3 }),
    body('status').optional().isString(),
    body('priority').optional().isString()
  ],
  createOrder
);

router.put(
  '/:orderId',
  enforcePolicy('service.orders.manage', {
    metadata: (req) => ({ orderId: req.params.orderId })
  }),
  [
    param('orderId').isUUID(),
    body('title').optional().isString(),
    body('summary').optional().isString(),
    body('status').optional().isString(),
    body('priority').optional().isString()
  ],
  updateOrder
);

router.patch(
  '/:orderId/status',
  enforcePolicy('service.orders.manage', {
    metadata: (req) => ({ orderId: req.params.orderId, status: req.body?.status || null })
  }),
  [param('orderId').isUUID(), body('status').isString()],
  updateOrderStatus
);

router.post(
  '/:orderId/notes',
  enforcePolicy('service.orders.manage', {
    metadata: (req) => ({ orderId: req.params.orderId })
  }),
  [param('orderId').isUUID(), body('body').isString().isLength({ min: 1 })],
  createOrderNote
);

router.delete(
  '/:orderId/notes/:noteId',
  enforcePolicy('service.orders.manage', {
    metadata: (req) => ({ orderId: req.params.orderId, noteId: req.params.noteId })
  }),
  [param('orderId').isUUID(), param('noteId').isUUID()],
  removeOrderNote
);

export default router;
