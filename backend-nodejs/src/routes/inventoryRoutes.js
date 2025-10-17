import { Router } from 'express';
import {
  acknowledgeAlert,
  createCategory,
  createInventoryAdjustment,
  createInventoryItem,
  createItemMediaController,
  createTag,
  createZone,
  deleteCategory,
  deleteInventoryItemController,
  deleteItemMediaController,
  deleteItemSupplierController,
  deleteTag,
  deleteZone,
  getInventoryItem,
  listCategories,
  listInventory,
  listItemMediaController,
  listItemSuppliersController,
  listSuppliersDirectory,
  listTags,
  listZones,
  resolveAlert,
  setItemTagsController,
  updateCategory,
  updateInventoryItemController,
  updateItemMediaController,
  upsertItemSupplierController,
  updateTag,
  updateZone
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
router.put('/items/:itemId', updateInventoryItemController);
router.delete('/items/:itemId', deleteInventoryItemController);
router.post('/items/:itemId/adjustments', createInventoryAdjustment);
router.post('/items/:itemId/tags', setItemTagsController);
router.post('/alerts/:alertId/acknowledge', acknowledgeAlert);
router.post('/alerts/:alertId/resolve', resolveAlert);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

router.get('/tags', listTags);
router.post('/tags', createTag);
router.put('/tags/:tagId', updateTag);
router.delete('/tags/:tagId', deleteTag);

router.get('/zones', listZones);
router.post('/zones', createZone);
router.put('/zones/:zoneId', updateZone);
router.delete('/zones/:zoneId', deleteZone);

router.get('/suppliers', listSuppliersDirectory);
router.get('/items/:itemId/suppliers', listItemSuppliersController);
router.post('/items/:itemId/suppliers', upsertItemSupplierController);
router.put('/items/:itemId/suppliers/:supplierLinkId', upsertItemSupplierController);
router.delete('/items/:itemId/suppliers/:supplierLinkId', deleteItemSupplierController);

router.get('/items/:itemId/media', listItemMediaController);
router.post('/items/:itemId/media', createItemMediaController);
router.put('/items/:itemId/media/:mediaId', updateItemMediaController);
router.delete('/items/:itemId/media/:mediaId', deleteItemMediaController);

export default router;
