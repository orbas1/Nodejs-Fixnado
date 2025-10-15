import { Router } from 'express';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  createCheckoutHandler,
  enqueueFinanceWebhookHandler,
  getFinanceOverviewHandler,
  getFinanceTimelineHandler,
  getFinanceReportHandler,
  getFinanceAlertsHandler
} from '../controllers/financeController.js';

const router = Router();

if (process.env.NODE_ENV === 'test') {
  router.use((req, _res, next) => {
    if (!req.user && req.headers['x-fixnado-role']) {
      req.user = {
        id: req.headers['x-test-user-id'] || 'test-user',
        type: req.headers['x-fixnado-role']
      };
    }
    next();
  });
}

router.post('/checkout', enforcePolicy('finance.checkout.create'), createCheckoutHandler);
router.get('/overview', enforcePolicy('finance.overview.read'), getFinanceOverviewHandler);
router.get('/orders/:orderId/timeline', enforcePolicy('finance.timeline.read'), getFinanceTimelineHandler);
router.get('/reports/daily', enforcePolicy('finance.reports.read'), getFinanceReportHandler);
router.get('/alerts', enforcePolicy('finance.alerts.read'), getFinanceAlertsHandler);
router.post('/webhooks/:provider', enqueueFinanceWebhookHandler);

export default router;
