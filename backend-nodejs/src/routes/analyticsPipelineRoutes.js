import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  fetchAnalyticsPipelineStatus,
  pauseAnalyticsPipelineHandler,
  resumeAnalyticsPipelineHandler
} from '../controllers/analyticsPipelineController.js';
import {
  exportPersonaDashboardHandler,
  getPersonaDashboardHandler
} from '../controllers/analyticsDashboardController.js';

const router = Router();

router.get('/pipeline/status', fetchAnalyticsPipelineStatus);

const controlValidators = () => [
  body('actor').isString().trim().isLength({ min: 2, max: 96 }),
  body('reason').optional().isString().trim().isLength({ max: 255 }),
  body('ticket').optional().isString().trim().isLength({ max: 64 })
];

router.post('/pipeline/pause', controlValidators(), pauseAnalyticsPipelineHandler);
router.post('/pipeline/resume', controlValidators(), resumeAnalyticsPipelineHandler);

const personaValidators = () => [
  param('persona').isString().trim().isLength({ min: 3, max: 32 }),
  query('companyId').optional().isUUID(4),
  query('providerId').optional().isUUID(4),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('timezone').optional().isString().trim().isLength({ min: 2, max: 64 })
];

router.get('/dashboards/:persona/export', personaValidators(), exportPersonaDashboardHandler);
router.get('/dashboards/:persona', personaValidators(), getPersonaDashboardHandler);

export default router;
