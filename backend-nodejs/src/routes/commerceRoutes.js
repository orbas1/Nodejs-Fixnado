import { Router } from 'express';
import { param, query } from 'express-validator';

import {
  getCommerceSnapshotHandler,
  getPersonaCommerceDashboardHandler
} from '../controllers/commerceController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const sharedFilters = [
  query('timeframe').optional().isString().isLength({ min: 2, max: 6 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('timezone').optional().isString().isLength({ min: 2, max: 40 }),
  query('currency').optional().isString().isLength({ min: 3, max: 3 }),
  query('providerId').optional().isUUID(),
  query('companyId').optional().isUUID(),
  query('servicemanId').optional().isUUID(),
  query('regionId').optional().isUUID(),
  query('userId').optional().isUUID()
];

router.get(
  '/snapshot',
  authenticate,
  enforcePolicy('commerce.snapshot.read'),
  [query('persona').optional().isString().isLength({ min: 3, max: 32 }), ...sharedFilters],
  getCommerceSnapshotHandler
);

router.get(
  '/personas/:persona',
  authenticate,
  enforcePolicy('commerce.persona.dashboard'),
  [param('persona').isString().isLength({ min: 3, max: 32 }), ...sharedFilters],
  getPersonaCommerceDashboardHandler
);

export default router;
