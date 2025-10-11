import { Router } from 'express';
import { body, query } from 'express-validator';
import { getUiPreferenceTelemetrySummary, recordUiPreferenceTelemetry } from '../controllers/telemetryController.js';

const router = Router();

router.post(
  '/ui-preferences',
  [
    body('theme').isIn(['standard', 'dark', 'emo']),
    body('density').isIn(['compact', 'comfortable']),
    body('contrast').isIn(['standard', 'high']),
    body('marketingVariant').optional().isString().isLength({ max: 64 }),
    body('tenantId').optional().isString().isLength({ max: 64 }),
    body('role').optional().isString().isLength({ max: 32 }),
    body('userId').optional().isUUID(4),
    body('locale').optional().isString().isLength({ max: 16 }),
    body('timestamp').optional().isISO8601(),
    body('userAgent').optional().isString().isLength({ max: 255 }),
    body('source').optional().isString().isLength({ max: 64 }),
    body('correlationId').optional().isString().isLength({ max: 64 }),
    body('dataVersion').optional().isString().isLength({ max: 16 })
  ],
  recordUiPreferenceTelemetry
);

router.get(
  '/ui-preferences/summary',
  [
    query('range').optional().isIn(['1d', '7d', '30d']),
    query('tenantId').optional().isString().isLength({ max: 64 })
  ],
  getUiPreferenceTelemetrySummary
);

export default router;
