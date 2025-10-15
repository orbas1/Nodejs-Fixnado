import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Permissions } from '../services/accessControlService.js';
import { getAffiliateDashboardHandler, getAffiliateReferralsHandler } from '../controllers/affiliateController.js';

const router = Router();

router.get('/dashboard', authenticate, authorize([Permissions.AFFILIATE_DASHBOARD]), getAffiliateDashboardHandler);
router.get('/referrals', authenticate, authorize([Permissions.AFFILIATE_REFERRALS]), getAffiliateReferralsHandler);

export default router;
