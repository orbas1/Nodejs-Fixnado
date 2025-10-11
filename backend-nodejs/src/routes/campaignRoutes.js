import { Router } from 'express';
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  createCampaignFlight,
  saveTargetingRules,
  ingestDailyMetrics,
  listFraudSignals,
  resolveFraudSignal,
  campaignSummary
} from '../controllers/campaignController.js';

const router = Router();

router.post('/', createCampaign);
router.get('/', listCampaigns);
router.get('/:campaignId', getCampaign);
router.patch('/:campaignId', updateCampaign);
router.post('/:campaignId/flights', createCampaignFlight);
router.put('/:campaignId/targeting', saveTargetingRules);
router.post('/:campaignId/metrics', ingestDailyMetrics);
router.get('/:campaignId/fraud-signals', listFraudSignals);
router.post('/fraud-signals/:signalId/resolve', resolveFraudSignal);
router.get('/:campaignId/summary', campaignSummary);

export default router;
