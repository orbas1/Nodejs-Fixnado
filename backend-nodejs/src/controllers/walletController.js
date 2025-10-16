import { toCanonicalRole } from '../constants/permissions.js';
import {
  getWalletOverview as getAdminWalletOverview,
  saveWalletSettings,
  listWalletAccounts as listAdminWalletAccounts,
  createWalletAccount as createAdminWalletAccount,
  updateWalletAccount as updateAdminWalletAccount,
  recordWalletTransaction,
  listWalletTransactions as listAdminWalletTransactions
} from '../services/wallet/index.js';
import {
  listWalletAccounts,
  createWalletAccount,
  getWalletAccountDetails,
  updateWalletAccount,
  listWalletTransactions,
  createWalletTransaction,
  listWalletPaymentMethods,
  createWalletPaymentMethod,
  updateWalletPaymentMethod,
  deleteWalletPaymentMethod,
  exportWalletTransactions,
  getWalletOverview as getWalletSummary
} from '../services/walletService.js';

function resolveActor(req) {
  const actorId = req.user?.id || null;
  const headerRole = req.headers['x-fixnado-role'] || req.headers['x-fixnado-persona'];
  const actorRole =
    toCanonicalRole(headerRole) || toCanonicalRole(req.user?.type) || toCanonicalRole(req.user?.role) || null;
  return { actorId, actorRole };
}

function forwardError(next, error) {
  if (!error) {
    return next();
  }
  if (error.statusCode || error.status) {
    const wrapped = new Error(error.message);
    wrapped.status = error.statusCode || error.status;
    wrapped.statusCode = wrapped.status;
    return next(wrapped);
  }
  return next(error);
}

// Admin handlers
export async function getAdminWalletOverviewHandler(req, res, next) {
  try {
    const { search, status, page, pageSize } = req.query;
    const payload = await getAdminWalletOverview({ search, status, page, pageSize });
    res.json(payload);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function listAdminWalletAccountsHandler(req, res, next) {
  try {
    const { search, status, page, pageSize } = req.query;
    const payload = await listAdminWalletAccounts({ search, status, page, pageSize, includeRecent: true });
    res.json(payload);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function saveAdminWalletSettingsHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const settings = await saveWalletSettings({ actorId, settings: req.body });
    res.json({ settings });
  } catch (error) {
    forwardError(next, error);
  }
}

export async function createAdminWalletAccountHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const account = await createAdminWalletAccount({ ...req.body, actorId });
    res.status(201).json(account);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function updateAdminWalletAccountHandler(req, res, next) {
  try {
    const account = await updateAdminWalletAccount(req.params.id, req.body);
    res.json(account);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function recordAdminWalletTransactionHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const payload = await recordWalletTransaction({
      accountId: req.params.id,
      ...req.body,
      actorId
    });
    res.status(201).json(payload);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function listAdminWalletTransactionsHandler(req, res, next) {
  try {
    const { limit } = req.query;
    const payload = await listAdminWalletTransactions({ accountId: req.params.id, limit });
    res.json(payload);
  } catch (error) {
    forwardError(next, error);
  }
}

// Serviceman / general dashboard handlers
export async function listWalletAccountsHandler(req, res, next) {
  try {
    const accounts = await listWalletAccounts({
      userId: req.query.userId || req.user?.id || null,
      companyId: req.query.companyId || null,
      includeInactive: req.query.includeInactive === 'true'
    });
    res.json({ accounts });
  } catch (error) {
    forwardError(next, error);
  }
}

export async function createWalletAccountHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const account = await createWalletAccount({
      userId: req.body.userId || req.user?.id || null,
      companyId: req.body.companyId || null,
      currency: req.body.currency || 'GBP',
      alias: req.body.alias || null,
      metadata: req.body.metadata || {},
      autopayoutEnabled: Boolean(req.body.autopayoutEnabled),
      autopayoutThreshold: req.body.autopayoutThreshold ?? null,
      spendingLimit: req.body.spendingLimit ?? null,
      actorId
    });
    res.status(201).json({ account });
  } catch (error) {
    forwardError(next, error);
  }
}

export async function getWalletAccountHandler(req, res, next) {
  try {
    const { include, transactionLimit, transactionOffset } = req.query;
    const payload = await getWalletAccountDetails(req.params.accountId, {
      include,
      transactionLimit: transactionLimit ? Number.parseInt(transactionLimit, 10) : 10,
      transactionOffset: transactionOffset ? Number.parseInt(transactionOffset, 10) : 0
    });
    res.json(payload);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function updateWalletAccountHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const account = await updateWalletAccount(req.params.accountId, req.body || {}, { actorId });
    res.json({ account });
  } catch (error) {
    forwardError(next, error);
  }
}

export async function listWalletTransactionsHandler(req, res, next) {
  try {
    const result = await listWalletTransactions(req.params.accountId, {
      type: req.query.type,
      limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query.offset ? Number.parseInt(req.query.offset, 10) : undefined,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    });
    res.json(result);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function createWalletTransactionHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const payload = await createWalletTransaction(req.params.accountId, req.body, { actorId, actorRole });
    res.status(201).json(payload);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function listWalletPaymentMethodsHandler(req, res, next) {
  try {
    const methods = await listWalletPaymentMethods(req.params.accountId);
    res.json({ methods });
  } catch (error) {
    forwardError(next, error);
  }
}

export async function createWalletPaymentMethodHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const method = await createWalletPaymentMethod(req.params.accountId, req.body, { actorId, actorRole });
    res.status(201).json({ method });
  } catch (error) {
    forwardError(next, error);
  }
}

export async function updateWalletPaymentMethodHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const method = await updateWalletPaymentMethod(req.params.accountId, req.params.methodId, req.body, { actorId });
    res.json({ method });
  } catch (error) {
    forwardError(next, error);
  }
}

export async function deleteWalletPaymentMethodHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    await deleteWalletPaymentMethod(req.params.accountId, req.params.methodId, { actorId });
    res.status(204).send();
  } catch (error) {
    forwardError(next, error);
  }
}

export async function exportWalletTransactionsHandler(req, res, next) {
  try {
    const payload = await exportWalletTransactions(req.params.accountId, {
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
    res.send(payload.csv);
  } catch (error) {
    forwardError(next, error);
  }
}

export async function getWalletSummaryHandler(req, res, next) {
  try {
    const overview = await getWalletSummary({
      userId: req.query.userId || req.user?.id || null,
      companyId: req.query.companyId || null
    });
    res.json({ overview });
  } catch (error) {
    forwardError(next, error);
  }
}

export default {
  getAdminWalletOverviewHandler,
  listAdminWalletAccountsHandler,
  saveAdminWalletSettingsHandler,
  createAdminWalletAccountHandler,
  updateAdminWalletAccountHandler,
  recordAdminWalletTransactionHandler,
  listAdminWalletTransactionsHandler,
  listWalletAccountsHandler,
  createWalletAccountHandler,
  getWalletAccountHandler,
  updateWalletAccountHandler,
  listWalletTransactionsHandler,
  createWalletTransactionHandler,
  listWalletPaymentMethodsHandler,
  createWalletPaymentMethodHandler,
  updateWalletPaymentMethodHandler,
  deleteWalletPaymentMethodHandler,
  exportWalletTransactionsHandler,
  getWalletSummaryHandler
};
