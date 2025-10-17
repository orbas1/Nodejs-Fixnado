import {
  getServicemanPaymentsWorkspace,
  createServicemanPayment,
  updateServicemanPayment,
  deleteServicemanPayment,
  listServicemanCommissionRules,
  createServicemanCommissionRule,
  updateServicemanCommissionRule,
  archiveServicemanCommissionRule
} from '../services/servicemanFinanceService.js';

function extractCompanyId(req) {
  return req.query.companyId || req.query.company_id || req.body?.companyId || null;
}

function handleError(next, error) {
  if (error?.statusCode) {
    return next(error);
  }
  return next(error);
}

export async function getServicemanPaymentsWorkspaceHandler(req, res, next) {
  try {
    const data = await getServicemanPaymentsWorkspace({
      companyId: extractCompanyId(req),
      actor: req.user,
      limit: req.query.limit,
      offset: req.query.offset,
      status: req.query.status,
      query: req.query.q || req.query.query
    });
    res.json({ data, meta: { companyId: data.companyId, total: data.history.total } });
  } catch (error) {
    handleError(next, error);
  }
}

export async function createServicemanPaymentHandler(req, res, next) {
  try {
    const payment = await createServicemanPayment(req.body, {
      companyId: extractCompanyId(req),
      actor: req.user
    });
    res.status(201).json({ data: payment });
  } catch (error) {
    handleError(next, error);
  }
}

export async function updateServicemanPaymentHandler(req, res, next) {
  try {
    const payment = await updateServicemanPayment(req.params.paymentId, req.body, {
      companyId: extractCompanyId(req),
      actor: req.user
    });
    res.json({ data: payment });
  } catch (error) {
    handleError(next, error);
  }
}

export async function deleteServicemanPaymentHandler(req, res, next) {
  try {
    await deleteServicemanPayment(req.params.paymentId, {
      companyId: extractCompanyId(req),
      actor: req.user
    });
    res.status(204).send();
  } catch (error) {
    handleError(next, error);
  }
}

export async function listServicemanCommissionRulesHandler(req, res, next) {
  try {
    const summary = await listServicemanCommissionRules({
      companyId: extractCompanyId(req),
      actor: req.user
    });
    res.json({ data: summary });
  } catch (error) {
    handleError(next, error);
  }
}

export async function createServicemanCommissionRuleHandler(req, res, next) {
  try {
    const rule = await createServicemanCommissionRule(req.body, {
      companyId: extractCompanyId(req),
      actor: req.user
    });
    res.status(201).json({ data: rule });
  } catch (error) {
    handleError(next, error);
  }
}

export async function updateServicemanCommissionRuleHandler(req, res, next) {
  try {
    const rule = await updateServicemanCommissionRule(req.params.ruleId, req.body, {
      companyId: extractCompanyId(req),
      actor: req.user
    });
    res.json({ data: rule });
  } catch (error) {
    handleError(next, error);
  }
}

export async function archiveServicemanCommissionRuleHandler(req, res, next) {
  try {
    await archiveServicemanCommissionRule(req.params.ruleId, {
      companyId: extractCompanyId(req),
      actor: req.user
    });
    res.status(204).send();
  } catch (error) {
    handleError(next, error);
  }
}
