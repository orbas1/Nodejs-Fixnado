import { Router } from 'express';
import {
  acknowledgeAlert,
  createInventoryAdjustment,
  createInventoryItem,
  getInventoryItem,
  listInventory,
  resolveAlert
} from '../controllers/inventoryController.js';

const router = Router();

router.post('/items', createInventoryItem);
router.get('/items', listInventory);
router.get('/items/:itemId', getInventoryItem);
router.post('/items/:itemId/adjustments', createInventoryAdjustment);
router.post('/alerts/:alertId/acknowledge', acknowledgeAlert);
router.post('/alerts/:alertId/resolve', resolveAlert);

export default router;
