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

router.post(
  '/',
  authenticate,
  enforcePolicy('zones.manage', {
    metadata: (req) => ({ companyId: req.body?.companyId || null })
  }),
  createZoneHandler
);
router.post(
  '/import',
  authenticate,
  enforcePolicy('zones.manage', {
    metadata: (req) => ({
      companyId: req.body?.companyId || null,
      featureCount: Array.isArray(req.body?.geojson?.features)
        ? req.body.geojson.features.length
        : Array.isArray(req.body?.payload?.features)
        ? req.body.payload.features.length
        : null
    })
  }),
  importZonesHandler
);
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
router.get(
  '/',
  authenticate,
  enforcePolicy('zones.read', {
    metadata: (req) => ({
      companyId: req.query?.companyId || null,
      includeAnalytics: req.query?.includeAnalytics === 'true'
    })
  }),
  listZonesHandler
);
router.get(
  '/:zoneId',
  authenticate,
  enforcePolicy('zones.read', {
    metadata: (req) => ({ zoneId: req.params.zoneId })
  }),
  getZoneHandler
);
router.put(
  '/:zoneId',
  authenticate,
  enforcePolicy('zones.manage', {
    metadata: (req) => ({
      zoneId: req.params.zoneId,
      companyId: req.body?.companyId || null
    })
  }),
  updateZoneHandler
);
router.delete(
  '/:zoneId',
  authenticate,
  enforcePolicy('zones.manage', {
    metadata: (req) => ({ zoneId: req.params.zoneId })
  }),
  deleteZoneHandler
);
router.post(
  '/:zoneId/analytics/snapshot',
  authenticate,
  enforcePolicy('zones.manage', {
    metadata: (req) => ({ zoneId: req.params.zoneId })
  }),
  createZoneSnapshotHandler
);
router.get(
  '/:zoneId/services',
  authenticate,
  enforcePolicy('zones.coverage', {
    metadata: (req) => ({ zoneId: req.params.zoneId })
  }),
  listZoneServicesHandler
);
router.post(
  '/:zoneId/services',
  authenticate,
  enforcePolicy('zones.coverage', {
    metadata: (req) => ({
      zoneId: req.params.zoneId,
      coverageCount: Array.isArray(req.body?.coverages) ? req.body.coverages.length : 0
    })
  }),
  syncZoneServicesHandler
);
router.delete(
  '/:zoneId/services/:coverageId',
  authenticate,
  enforcePolicy('zones.coverage', {
    metadata: (req) => ({
      zoneId: req.params.zoneId,
      coverageId: req.params.coverageId
    })
  }),
  removeZoneServiceHandler
);

export default router;
