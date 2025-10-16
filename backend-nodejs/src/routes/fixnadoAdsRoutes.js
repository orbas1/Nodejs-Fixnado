import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  index,
  create,
  show,
  update,
  createFlight,
  saveTargeting,
  recordMetric,
  fraudSignals,
  resolveFraudSignalController,
  summary,
  creativesIndex,
  creativesCreate,
  creativesUpdate,
  creativesDestroy
} from '../controllers/fixnadoAdsController.js';

const router = Router();

router.use(authenticate);

router
  .route('/campaigns')
  .get(enforcePolicy('fixnado.ads.read'), index)
  .post(enforcePolicy('fixnado.ads.write'), create);

router
  .route('/campaigns/:campaignId')
  .get(enforcePolicy('fixnado.ads.read'), show)
  .patch(enforcePolicy('fixnado.ads.write'), update);

router.post('/campaigns/:campaignId/flights', enforcePolicy('fixnado.ads.write'), createFlight);
router.put('/campaigns/:campaignId/targeting', enforcePolicy('fixnado.ads.write'), saveTargeting);
router.post('/campaigns/:campaignId/metrics', enforcePolicy('fixnado.ads.write'), recordMetric);
router.get('/campaigns/:campaignId/fraud-signals', enforcePolicy('fixnado.ads.read'), fraudSignals);
router.post('/fraud-signals/:signalId/resolve', enforcePolicy('fixnado.ads.write'), resolveFraudSignalController);
router.get('/campaigns/:campaignId/summary', enforcePolicy('fixnado.ads.read'), summary);

router
  .route('/campaigns/:campaignId/creatives')
  .get(enforcePolicy('fixnado.ads.read'), creativesIndex)
  .post(enforcePolicy('fixnado.ads.write'), creativesCreate);

router
  .route('/creatives/:creativeId')
  .patch(enforcePolicy('fixnado.ads.write'), creativesUpdate)
  .delete(enforcePolicy('fixnado.ads.write'), creativesDestroy);

export default router;
