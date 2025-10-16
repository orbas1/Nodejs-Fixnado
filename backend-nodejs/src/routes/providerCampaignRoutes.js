import { Router } from 'express';
import {
  getProviderCampaignWorkspace,
  listProviderCampaigns,
  getProviderCampaignDetail,
  createProviderCampaignHandler,
  updateProviderCampaignHandler,
  createProviderCampaignFlightHandler,
  saveProviderTargetingHandler,
  createProviderCreativeHandler,
  updateProviderCreativeHandler,
  deleteProviderCreativeHandler,
  saveProviderSegmentsHandler,
  saveProviderPlacementsHandler,
  recordProviderMetricsHandler
} from '../controllers/providerCampaignController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(
  authenticate,
  enforcePolicy('panel.provider.ads', {
    metadata: (req) => ({
      companyId: req.query.companyId || req.body?.companyId || null,
      campaignId: req.params?.campaignId || null
    })
  })
);

router.get('/workspace', getProviderCampaignWorkspace);
router.get('/', listProviderCampaigns);
router.post('/', createProviderCampaignHandler);
router.get('/:campaignId', getProviderCampaignDetail);
router.patch('/:campaignId', updateProviderCampaignHandler);
router.post('/:campaignId/flights', createProviderCampaignFlightHandler);
router.put('/:campaignId/targeting', saveProviderTargetingHandler);
router.post('/:campaignId/creatives', createProviderCreativeHandler);
router.patch('/:campaignId/creatives/:creativeId', updateProviderCreativeHandler);
router.delete('/:campaignId/creatives/:creativeId', deleteProviderCreativeHandler);
router.put('/:campaignId/audience-segments', saveProviderSegmentsHandler);
router.put('/:campaignId/placements', saveProviderPlacementsHandler);
router.post('/:campaignId/metrics', recordProviderMetricsHandler);

export default router;
