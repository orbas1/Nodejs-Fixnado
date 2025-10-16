import {
  getAffiliateSettings,
  saveAffiliateSettings,
  listCommissionRules,
  createOrUpdateCommissionRule,
  deactivateCommissionRule,
  getAffiliatePerformanceForAdmin,
  listAffiliateProfiles,
  createAffiliateProfile,
  updateAffiliateProfile,
  listAffiliateLedgerEntries,
  createManualAffiliateLedgerEntry,
  listAffiliateReferrals,
  createAffiliateReferral,
  updateAffiliateReferral
} from '../services/affiliateService.js';

export async function getAffiliateSettingsHandler(req, res, next) {
  try {
    const [settings, rules, performance] = await Promise.all([
      getAffiliateSettings(),
      listCommissionRules(),
      getAffiliatePerformanceForAdmin()
    ]);
    res.json({ data: { settings, rules, performance } });
  } catch (error) {
    next(error);
  }
}

export async function saveAffiliateSettingsHandler(req, res, next) {
  try {
    const settings = await saveAffiliateSettings({ actorId: req.user.id, payload: req.body });
    res.json({ data: settings });
  } catch (error) {
    next(error);
  }
}

export async function upsertAffiliateCommissionRuleHandler(req, res, next) {
  try {
    const rule = await createOrUpdateCommissionRule({ id: req.params.id, payload: req.body, actorId: req.user.id });
    res.json({ data: rule });
  } catch (error) {
    next(error);
  }
}

export async function listAffiliateCommissionRulesHandler(req, res, next) {
  try {
    const rules = await listCommissionRules();
    res.json({ data: rules });
  } catch (error) {
    next(error);
  }
}

export async function deactivateAffiliateCommissionRuleHandler(req, res, next) {
  try {
    const rule = await deactivateCommissionRule({ id: req.params.id });
    res.json({ data: rule });
  } catch (error) {
    next(error);
  }
}

export async function listAffiliateProfilesHandler(req, res, next) {
  try {
    const { data, meta } = await listAffiliateProfiles({
      search: req.query.search,
      status: req.query.status,
      tier: req.query.tier,
      page: req.query.page,
      pageSize: req.query.pageSize
    });
    res.json({ data, meta });
  } catch (error) {
    next(error);
  }
}

export async function createAffiliateProfileHandler(req, res, next) {
  try {
    const profile = await createAffiliateProfile({ actorId: req.user.id, payload: req.body });
    res.status(201).json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateAffiliateProfileHandler(req, res, next) {
  try {
    const profile = await updateAffiliateProfile({ id: req.params.id, payload: req.body });
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function listAffiliateLedgerEntriesHandler(req, res, next) {
  try {
    const { data, meta } = await listAffiliateLedgerEntries({
      affiliateProfileId: req.params.id,
      page: req.query.page,
      pageSize: req.query.pageSize
    });
    res.json({ data, meta });
  } catch (error) {
    next(error);
  }
}

export async function createAffiliateLedgerEntryHandler(req, res, next) {
  try {
    const result = await createManualAffiliateLedgerEntry({
      affiliateProfileId: req.params.id,
      actorId: req.user.id,
      payload: req.body
    });
    res.status(201).json({ data: result.entry, profile: result.profile });
  } catch (error) {
    next(error);
  }
}

export async function listAffiliateReferralsHandler(req, res, next) {
  try {
    const { data, meta } = await listAffiliateReferrals({
      status: req.query.status,
      search: req.query.search,
      affiliateProfileId: req.query.affiliateProfileId,
      page: req.query.page,
      pageSize: req.query.pageSize
    });
    res.json({ data, meta });
  } catch (error) {
    next(error);
  }
}

export async function createAffiliateReferralHandler(req, res, next) {
  try {
    const result = await createAffiliateReferral({ actorId: req.user.id, payload: req.body });
    res.status(201).json({ data: result.referral, profile: result.profile });
  } catch (error) {
    next(error);
  }
}

export async function updateAffiliateReferralHandler(req, res, next) {
  try {
    const result = await updateAffiliateReferral({ id: req.params.id, payload: req.body });
    res.json({ data: result.referral, profile: result.profile });
  } catch (error) {
    next(error);
  }
}
