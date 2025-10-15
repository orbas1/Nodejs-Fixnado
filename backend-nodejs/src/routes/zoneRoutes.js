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
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.post('/', createZoneHandler);
router.post('/import', importZonesHandler);
router.post(
  '/match',
  authenticate,
  enforcePolicy('zones.match', {
    metadata: (req) => ({
      requestedZoneId: req.body?.zoneId || null,
      includeOutOfZone: Boolean(req.body?.allowOutOfZone)
    })
  }),
  matchGeoZoneHandler
);
router.get(
  '/coverage/preview',
  authenticate,
  enforcePolicy('zones.preview', {
    metadata: (req) => ({
      zoneId: req.query?.zoneId || null,
      postcode: req.query?.postcode || null
    })
  }),
  previewCoverageHandler
);
router.get('/', listZonesHandler);
router.get('/:zoneId', getZoneHandler);
router.put('/:zoneId', updateZoneHandler);
router.delete('/:zoneId', deleteZoneHandler);
router.post('/:zoneId/analytics/snapshot', createZoneSnapshotHandler);
router.get('/:zoneId/services', listZoneServicesHandler);
router.post('/:zoneId/services', syncZoneServicesHandler);
router.delete('/:zoneId/services/:coverageId', removeZoneServiceHandler);

export default router;
