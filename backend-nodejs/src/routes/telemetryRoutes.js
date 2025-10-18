import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getUiPreferenceTelemetrySummary,
  recordUiPreferenceTelemetry,
  getUiPreferenceTelemetrySnapshots,
  recordClientErrorEvent,
  recordMobileCrashReport
} from '../controllers/telemetryController.js';

const router = Router();

router.post(
  '/client-errors',
  [
    body('reference').optional().isString().isLength({ min: 3, max: 64 }),
    body('correlationId').optional().isString().isLength({ max: 64 }),
    body('requestId').optional().isString().isLength({ max: 64 }),
    body('sessionId').optional().isString().isLength({ max: 64 }),
    body('userId').optional().isString().isLength({ max: 64 }),
    body('tenantId').optional().isString().isLength({ max: 64 }),
    body('boundaryId').optional().isString().isLength({ min: 1, max: 128 }),
    body('environment').optional().isString().isLength({ max: 32 }),
    body('releaseChannel').optional().isString().isLength({ max: 32 }),
    body('appVersion').optional().isString().isLength({ max: 32 }),
    body('buildNumber').optional().isString().isLength({ max: 32 }),
    body('location').optional().isString().isLength({ max: 512 }),
    body('userAgent').optional().isString().isLength({ max: 512 }),
    body('occurredAt').optional().isISO8601(),
    body('severity').optional().isIn(['debug', 'info', 'warning', 'error', 'fatal']),
    body('error').optional().custom((value) => value === undefined || (value && typeof value === 'object')), 
    body('info').optional().custom((value) => value === undefined || (value && typeof value === 'object')),
    body('metadata')
      .optional()
      .custom((value) => value && typeof value === 'object' && !Array.isArray(value))
      .withMessage('metadata must be an object'),
    body('breadcrumbs')
      .optional()
      .isArray({ max: 100 })
      .custom((entries) => entries.every((entry) => entry && typeof entry === 'object'))
      .withMessage('breadcrumbs entries must be objects'),
    body('tags')
      .optional()
      .isArray({ max: 32 })
      .custom((entries) => entries.every((tag) => typeof tag === 'string'))
      .withMessage('tags must be an array of strings')
  ],
  recordClientErrorEvent
);

router.post(
  '/mobile-crashes',
  [
    body('reference').isString().isLength({ min: 3, max: 64 }),
    body('correlationId').optional().isString().isLength({ max: 64 }),
    body('requestId').optional().isString().isLength({ max: 64 }),
    body('sessionId').optional().isString().isLength({ max: 64 }),
    body('userId').optional().isString().isLength({ max: 64 }),
    body('tenantId').optional().isString().isLength({ max: 64 }),
    body('environment').optional().isString().isLength({ max: 32 }),
    body('releaseChannel').optional().isString().isLength({ max: 32 }),
    body('appVersion').optional().isString().isLength({ max: 32 }),
    body('buildNumber').optional().isString().isLength({ max: 32 }),
    body('platform').isString().isLength({ min: 2, max: 32 }),
    body('platformVersion').optional().isString().isLength({ max: 64 }),
    body('deviceModel').optional().isString().isLength({ max: 96 }),
    body('deviceManufacturer').optional().isString().isLength({ max: 96 }),
    body('deviceIdentifier').optional().isString().isLength({ max: 128 }),
    body('device')
      .optional()
      .custom((value) => value && typeof value === 'object' && !Array.isArray(value))
      .withMessage('device must be an object when provided'),
    body('locale').optional().isString().isLength({ max: 32 }),
    body('isEmulator').optional().isBoolean().toBoolean(),
    body('isReleaseBuild').optional().isBoolean().toBoolean(),
    body('occurredAt').optional().isISO8601(),
    body('severity').optional().isIn(['debug', 'info', 'warning', 'error', 'fatal']),
    body('error')
      .optional()
      .custom((value) => value && typeof value === 'object' && !Array.isArray(value))
      .withMessage('error must be an object when provided'),
    body('metadata')
      .optional()
      .custom((value) => value && typeof value === 'object' && !Array.isArray(value))
      .withMessage('metadata must be an object'),
    body('breadcrumbs')
      .optional()
      .isArray({ max: 120 })
      .custom((entries) => entries.every((entry) => entry && typeof entry === 'object')),
    body('threads').optional().isArray({ max: 20 }),
    body('tags')
      .optional()
      .isArray({ max: 32 })
      .custom((entries) => entries.every((tag) => typeof tag === 'string'))
  ],
  recordMobileCrashReport
);

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
