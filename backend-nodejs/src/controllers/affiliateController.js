import {
  getAffiliateDashboard,
  getAffiliateReferralsForProfile,
  ensureAffiliateProfile
} from '../services/affiliateService.js';

export async function getAffiliateDashboardHandler(req, res, next) {
  try {
    const payload = await getAffiliateDashboard({ userId: req.user.id });
    res.json({ data: payload });
  } catch (error) {
    next(error);
  }
}

export async function getAffiliateReferralsHandler(req, res, next) {
  try {
    const profile = await ensureAffiliateProfile({ userId: req.user.id });
    const data = await getAffiliateReferralsForProfile({ affiliateProfileId: profile.id });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
