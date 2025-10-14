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
import { authenticate } from '../middleware/auth.js';
import { authorizePersonaAccess } from '../middleware/personaAccess.js';

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

const personaAccessControl = () => (req, res, next) => {
  const persona = req.params.persona?.toLowerCase();
  if (!persona) {
    return res.status(403).json({ message: 'persona_forbidden' });
  }

  const header = req.headers['x-fixnado-persona'];
  const claimed = typeof header === 'string' ? header.toLowerCase() : null;

  const accessMatrix = {
    user: ['user'],
    admin: ['admin'],
    provider: ['provider'],
    serviceman: ['serviceman', 'servicemen'],
    enterprise: ['enterprise']
  };

  const allowed = accessMatrix[persona];
  if (!allowed) {
    return res.status(404).json({ message: 'persona_not_supported' });
  }

  if (!claimed || !allowed.includes(claimed)) {
    return res.status(403).json({ message: 'persona_forbidden' });
  }

  next();
};

router.get('/dashboards/:persona/export', personaValidators(), personaAccessControl(), exportPersonaDashboardHandler);
router.get('/dashboards/:persona', personaValidators(), personaAccessControl(), getPersonaDashboardHandler);
router.get('/dashboards/:persona/export', authenticate, authorizePersonaAccess, personaValidators(), exportPersonaDashboardHandler);
router.get('/dashboards/:persona', authenticate, authorizePersonaAccess, personaValidators(), getPersonaDashboardHandler);

export default router;
