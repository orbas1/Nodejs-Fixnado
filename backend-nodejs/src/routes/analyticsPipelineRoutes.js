import { Router } from 'express';
import { body } from 'express-validator';
import {
  fetchAnalyticsPipelineStatus,
  pauseAnalyticsPipelineHandler,
  resumeAnalyticsPipelineHandler
} from '../controllers/analyticsPipelineController.js';

const router = Router();

router.get('/pipeline/status', fetchAnalyticsPipelineStatus);

const controlValidators = () => [
  body('actor').isString().trim().isLength({ min: 2, max: 96 }),
  body('reason').optional().isString().trim().isLength({ max: 255 }),
  body('ticket').optional().isString().trim().isLength({ max: 64 })
];

router.post('/pipeline/pause', controlValidators(), pauseAnalyticsPipelineHandler);
router.post('/pipeline/resume', controlValidators(), resumeAnalyticsPipelineHandler);

export default router;
