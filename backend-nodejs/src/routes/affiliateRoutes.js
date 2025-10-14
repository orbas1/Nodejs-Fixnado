import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAffiliateDashboardHandler, getAffiliateReferralsHandler } from '../controllers/affiliateController.js';

const router = Router();
const ALLOWED_ROLES = ['user', 'company', 'servicemen', 'provider_admin', 'operations_admin'];

router.get('/dashboard', authenticate, authorize(ALLOWED_ROLES), getAffiliateDashboardHandler);
router.get('/referrals', authenticate, authorize(ALLOWED_ROLES), getAffiliateReferralsHandler);

export default router;
