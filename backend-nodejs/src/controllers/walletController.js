import {
  getWalletOverview,
  saveWalletSettings,
  listWalletAccounts,
  createWalletAccount,
  updateWalletAccount,
  recordWalletTransaction,
  listWalletTransactions
} from '../services/wallet/index.js';

function handleServiceError(next, error) {
  if (error && (error.statusCode || error.status)) {
    const responseError = new Error(error.message);
    responseError.status = error.statusCode || error.status;
    return next(responseError);
import { toCanonicalRole } from '../constants/permissions.js';
import {
  listWalletAccounts,
  createWalletAccount,
  getWalletAccountDetails,
  updateWalletAccount,
  listWalletTransactions,
  createWalletTransaction,
  createWalletPaymentMethod,
  updateWalletPaymentMethod,
  listWalletPaymentMethods,
  getWalletOverview
} from '../services/walletService.js';

function resolveActor(req) {
  const actorId = req.user?.id || null;
  const headerRole = req.headers['x-fixnado-role'] || req.headers['x-fixnado-persona'];
  const actorRole =
    toCanonicalRole(headerRole) || toCanonicalRole(req.user?.type) || toCanonicalRole(req.user?.role) || null;
  return { actorId, actorRole };
}

function handleError(next, error) {
  if (error?.statusCode) {
    const normalised = new Error(error.message);
    normalised.statusCode = error.statusCode;
    normalised.status = error.statusCode;
    return next(normalised);
  }
  return next(error);
}

export async function getWalletOverviewHandler(req, res, next) {
  try {
    const { search, status, page, pageSize } = req.query;
    const payload = await getWalletOverview({ search, status, page, pageSize });
    res.json(payload);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function getWalletAccountsHandler(req, res, next) {
  try {
    const { search, status, page, pageSize } = req.query;
    const payload = await listWalletAccounts({ search, status, page, pageSize, includeRecent: true });
    res.json(payload);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function saveWalletSettingsHandler(req, res, next) {
  try {
    const actorId = req.user?.id ?? null;
    const settings = await saveWalletSettings({ actorId, settings: req.body });
    res.json({ settings });
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function createWalletAccountHandler(req, res, next) {
  try {
    const actorId = req.user?.id ?? null;
    const account = await createWalletAccount({ ...req.body, actorId });
    res.status(201).json(account);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function updateWalletAccountHandler(req, res, next) {
  try {
    const account = await updateWalletAccount(req.params.id, req.body);
    res.json(account);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function recordWalletTransactionHandler(req, res, next) {
  try {
    const actorId = req.user?.id ?? null;
    const payload = await recordWalletTransaction({
      accountId: req.params.id,
      ...req.body,
      actorId
    });
    res.status(201).json(payload);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export async function getWalletTransactionsHandler(req, res, next) {
  try {
    const { limit } = req.query;
    const payload = await listWalletTransactions({ accountId: req.params.id, limit });
    res.json(payload);
  } catch (error) {
    handleServiceError(next, error);
  }
}

export default {
  getWalletOverviewHandler,
  getWalletAccountsHandler,
  saveWalletSettingsHandler,
  createWalletAccountHandler,
  updateWalletAccountHandler,
  recordWalletTransactionHandler,
  getWalletTransactionsHandler
};
export async function listWalletAccountsHandler(req, res, next) {
  try {
    const accounts = await listWalletAccounts({
      userId: req.query.userId || req.user?.id || null,
      companyId: req.query.companyId || null,
      includeInactive: req.query.includeInactive === 'true'
    });
    res.json({ accounts });
  } catch (error) {
    handleError(next, error);
  }
}

export async function createWalletAccountHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const account = await createWalletAccount({
      userId: req.body.userId || req.user?.id || null,
      companyId: req.body.companyId || null,
      currency: req.body.currency || 'GBP',
      alias: req.body.alias || null,
      metadata: req.body.metadata || {},
      autopayoutEnabled: Boolean(req.body.autopayoutEnabled),
      autopayoutThreshold: req.body.autopayoutThreshold ?? null,
      spendingLimit: req.body.spendingLimit ?? null,
      actorId,
      actorRole
    });
    res.status(201).json({ account });
  } catch (error) {
    handleError(next, error);
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
    handleError(next, error);
  }
}

export async function updateWalletAccountHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const account = await updateWalletAccount(req.params.accountId, req.body || {}, { actorId });
    res.json({ account });
  } catch (error) {
    handleError(next, error);
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
    handleError(next, error);
  }
}

export async function createWalletTransactionHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const result = await createWalletTransaction(req.params.accountId, req.body || {}, { actorId, actorRole });
    res.status(201).json(result);
  } catch (error) {
    handleError(next, error);
  }
}

export async function listWalletPaymentMethodsHandler(req, res, next) {
  try {
    const methods = await listWalletPaymentMethods(req.params.accountId);
    res.json({ methods });
  } catch (error) {
    handleError(next, error);
  }
}

export async function createWalletPaymentMethodHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const method = await createWalletPaymentMethod(req.params.accountId, req.body || {}, { actorId, actorRole });
    res.status(201).json({ method });
  } catch (error) {
    handleError(next, error);
  }
}

export async function updateWalletPaymentMethodHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const method = await updateWalletPaymentMethod(
      req.params.accountId,
      req.params.methodId,
      req.body || {},
      { actorId }
    );
    res.json({ method });
  } catch (error) {
    handleError(next, error);
  }
}

export async function getWalletSummaryHandler(req, res, next) {
  try {
    const overview = await getWalletOverview({
      userId: req.query.userId || req.user?.id || null,
      companyId: req.query.companyId || null
    });
    res.json({ overview });
  } catch (error) {
    handleError(next, error);
  }
}
