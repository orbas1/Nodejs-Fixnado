import { Router } from 'express';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  createCheckoutHandler,
  enqueueFinanceWebhookHandler,
  getFinanceOverviewHandler,
  getFinanceTimelineHandler
} from '../controllers/financeController.js';

const router = Router();

router.post('/checkout', enforcePolicy('finance.checkout.create'), createCheckoutHandler);
router.get('/overview', enforcePolicy('finance.overview.read'), getFinanceOverviewHandler);
router.get('/orders/:orderId/timeline', enforcePolicy('finance.timeline.read'), getFinanceTimelineHandler);
router.post('/webhooks/:provider', enqueueFinanceWebhookHandler);

export default router;
