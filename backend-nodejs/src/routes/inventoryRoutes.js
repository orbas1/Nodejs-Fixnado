import { Router } from 'express';
import {
  acknowledgeAlert,
  createInventoryAdjustment,
  createInventoryItem,
  getInventoryItem,
  listInventory,
  resolveAlert
} from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(
  authenticate,
  enforcePolicy('inventory.manage', {
    metadata: (req) => ({
      method: req.method,
      path: req.path
    })
  })
);

router.post('/items', createInventoryItem);
router.get('/items', listInventory);
router.get('/items/:itemId', getInventoryItem);
router.post('/items/:itemId/adjustments', createInventoryAdjustment);
router.post('/alerts/:alertId/acknowledge', acknowledgeAlert);
router.post('/alerts/:alertId/resolve', resolveAlert);

export default router;
