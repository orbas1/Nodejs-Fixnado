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
  removeZoneServiceHandler,
  matchGeoZoneHandler,
  previewCoverageHandler
} from '../controllers/zoneController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', createZoneHandler);
router.post('/import', importZonesHandler);
router.post('/match', authenticate, authorize(['operations_admin']), matchGeoZoneHandler);
router.get('/coverage/preview', authenticate, authorize(['operations_admin']), previewCoverageHandler);
router.get('/', listZonesHandler);
router.get('/:zoneId', getZoneHandler);
router.put('/:zoneId', updateZoneHandler);
router.delete('/:zoneId', deleteZoneHandler);
router.post('/:zoneId/analytics/snapshot', createZoneSnapshotHandler);
router.get('/:zoneId/services', listZoneServicesHandler);
router.post('/:zoneId/services', syncZoneServicesHandler);
router.delete('/:zoneId/services/:coverageId', removeZoneServiceHandler);

export default router;
