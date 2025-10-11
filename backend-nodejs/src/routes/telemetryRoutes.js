import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getUiPreferenceTelemetrySummary,
  recordUiPreferenceTelemetry,
  getUiPreferenceTelemetrySnapshots
} from '../controllers/telemetryController.js';

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

router.get(
  '/ui-preferences/snapshots',
  [
    query('rangeKey').optional().isString().isLength({ min: 1, max: 8 }),
    query('tenantId').optional().isString().isLength({ max: 64 }),
    query('capturedAfter').optional().isISO8601(),
    query('capturedBefore').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('cursor').optional().isString().isLength({ min: 8, max: 256 }),
    query('leadingTheme').optional().isString().isLength({ min: 2, max: 32 }),
    query('staleMinutesGte').optional().isInt({ min: 0, max: 10080 }),
    query('staleMinutesLte').optional().isInt({ min: 0, max: 10080 }),
    query('includeStats').optional().isBoolean().toBoolean(),
    query('freshnessWindowMinutes').optional().isInt({ min: 1, max: 10080 })
  ],
  getUiPreferenceTelemetrySnapshots
);

export default router;
