import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  getServicemanMetricsConfiguration,
  saveServicemanMetricsSettings,
  createServicemanMetricCardHandler,
  updateServicemanMetricCardHandler,
  deleteServicemanMetricCardHandler
} from '../controllers/servicemanMetricsController.js';

const router = Router();

router.get(
  '/config',
  authenticate,
  enforcePolicy('serviceman.metrics.read', {
    metadata: () => ({ scope: 'serviceman-metrics', action: 'read' })
  }),
  getServicemanMetricsConfiguration
);

router.put(
  '/settings',
  authenticate,
  enforcePolicy('serviceman.metrics.write', {
    metadata: () => ({ scope: 'serviceman-metrics', action: 'settings:update' })
  }),
  saveServicemanMetricsSettings
);

router.post(
  '/cards',
  authenticate,
  enforcePolicy('serviceman.metrics.write', {
    metadata: () => ({ scope: 'serviceman-metrics', action: 'cards:create' })
  }),
  createServicemanMetricCardHandler
);

router.patch(
  '/cards/:id',
  authenticate,
  enforcePolicy('serviceman.metrics.write', {
    metadata: (req) => ({ scope: 'serviceman-metrics', action: 'cards:update', cardId: req.params.id })
  }),
  updateServicemanMetricCardHandler
);

router.delete(
  '/cards/:id',
  authenticate,
  enforcePolicy('serviceman.metrics.write', {
    metadata: (req) => ({ scope: 'serviceman-metrics', action: 'cards:delete', cardId: req.params.id })
  }),
  deleteServicemanMetricCardHandler
);

export default router;
