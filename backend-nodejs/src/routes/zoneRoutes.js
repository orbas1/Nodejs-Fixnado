import { Router } from 'express';
import {
  createZoneHandler,
  updateZoneHandler,
  deleteZoneHandler,
  listZonesHandler,
  getZoneHandler,
  createZoneSnapshotHandler,
  importZonesHandler,
  listZoneServicesHandler,
  syncZoneServicesHandler,
  removeZoneServiceHandler
} from '../controllers/zoneController.js';

const router = Router();

router.post('/', createZoneHandler);
router.post('/import', importZonesHandler);
router.get('/', listZonesHandler);
router.get('/:zoneId', getZoneHandler);
router.put('/:zoneId', updateZoneHandler);
router.delete('/:zoneId', deleteZoneHandler);
router.post('/:zoneId/analytics/snapshot', createZoneSnapshotHandler);
router.get('/:zoneId/services', listZoneServicesHandler);
router.post('/:zoneId/services', syncZoneServicesHandler);
router.delete('/:zoneId/services/:coverageId', removeZoneServiceHandler);

export default router;
