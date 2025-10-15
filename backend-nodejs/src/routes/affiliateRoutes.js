import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import { getAffiliateDashboardHandler, getAffiliateReferralsHandler } from '../controllers/affiliateController.js';

const router = Router();

router.get('/dashboard', authenticate, enforcePolicy('affiliate.dashboard.view'), getAffiliateDashboardHandler);
router.get('/referrals', authenticate, enforcePolicy('affiliate.referrals.view'), getAffiliateReferralsHandler);

export default router;
