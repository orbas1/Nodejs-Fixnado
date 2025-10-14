import {
  getAffiliateSettings,
  saveAffiliateSettings,
  listCommissionRules,
  createOrUpdateCommissionRule,
  deactivateCommissionRule,
  getAffiliatePerformanceForAdmin
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
