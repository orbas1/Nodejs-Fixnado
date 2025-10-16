import {
  getWalletOverview as getAdminWalletOverview,
  saveWalletSettings,
  listWalletAccounts as adminListWalletAccounts,
  createWalletAccount as adminCreateWalletAccount,
  updateWalletAccount as adminUpdateWalletAccount,
  recordWalletTransaction as adminRecordWalletTransaction,
  listWalletTransactions as adminListWalletTransactions
} from '../services/wallet/index.js';
import { toCanonicalRole } from '../constants/permissions.js';
import {
  listWalletAccounts as listUserWalletAccounts,
  createWalletAccount as createUserWalletAccount,
  getWalletAccountDetails,
  updateWalletAccount as updateUserWalletAccount,
  listWalletTransactions as listUserWalletTransactions,
  createWalletTransaction as createUserWalletTransaction,
  listWalletPaymentMethods,
  createWalletPaymentMethod,
  updateWalletPaymentMethod,
  getWalletOverview as getUserWalletOverview
} from '../services/walletService.js';

function normaliseHttpError(error) {
  if (!error) {
    return new Error('Unknown wallet error');
  }

  if (error instanceof Error) {
    if (!error.status && error.statusCode) {
      const normalised = new Error(error.message);
      normalised.status = error.statusCode;
      if (error.code) {
        normalised.code = error.code;
      }
      return normalised;
    }

    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unknown wallet error');
}

function handleAdminError(next, error) {
  return next(normaliseHttpError(error));
}

function handleUserError(next, error) {
  return next(normaliseHttpError(error));
}

function resolveActor(req) {
  const actorId = req.user?.id || null;
  const headerRole = req.headers['x-fixnado-role'] || req.headers['x-fixnado-persona'];
  const actorRole =
    toCanonicalRole(headerRole) || toCanonicalRole(req.user?.type) || toCanonicalRole(req.user?.role) || null;
  return { actorId, actorRole };
}

export async function getAdminWalletOverviewHandler(req, res, next) {
  try {
    const { search, status, page, pageSize } = req.query;
    const payload = await getAdminWalletOverview({ search, status, page, pageSize });
    res.json(payload);
  } catch (error) {
    handleAdminError(next, error);
  }
}

export async function getAdminWalletAccountsHandler(req, res, next) {
  try {
    const { search, status, page, pageSize } = req.query;
    const payload = await adminListWalletAccounts({ search, status, page, pageSize, includeRecent: true });
    res.json(payload);
  } catch (error) {
    handleAdminError(next, error);
  }
}

export async function saveAdminWalletSettingsHandler(req, res, next) {
  try {
    const actorId = req.user?.id ?? null;
    const settings = await saveWalletSettings({ actorId, settings: req.body });
    res.json({ settings });
  } catch (error) {
    handleAdminError(next, error);
  }
}

export async function createAdminWalletAccountHandler(req, res, next) {
  try {
    const actorId = req.user?.id ?? null;
    const account = await adminCreateWalletAccount({ ...req.body, actorId });
    res.status(201).json(account);
  } catch (error) {
    handleAdminError(next, error);
  }
}

export async function updateAdminWalletAccountHandler(req, res, next) {
  try {
    const account = await adminUpdateWalletAccount(req.params.id, req.body);
    res.json(account);
  } catch (error) {
    handleAdminError(next, error);
  }
}

export async function recordAdminWalletTransactionHandler(req, res, next) {
  try {
    const actorId = req.user?.id ?? null;
    const payload = await adminRecordWalletTransaction({ accountId: req.params.id, ...req.body, actorId });
    res.status(201).json(payload);
  } catch (error) {
    handleAdminError(next, error);
  }
}

export async function getAdminWalletTransactionsHandler(req, res, next) {
  try {
    const { limit } = req.query;
    const payload = await adminListWalletTransactions({ accountId: req.params.id, limit });
    res.json(payload);
  } catch (error) {
    handleAdminError(next, error);
  }
}

export async function listWalletAccountsHandler(req, res, next) {
  try {
    const accounts = await listUserWalletAccounts({
      userId: req.query.userId || req.user?.id || null,
      companyId: req.query.companyId || null,
      includeInactive: req.query.includeInactive === 'true'
    });
    res.json({ accounts });
  } catch (error) {
    handleUserError(next, error);
  }
}

export async function createWalletAccountHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const account = await createUserWalletAccount({
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
    handleUserError(next, error);
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
    handleUserError(next, error);
  }
}

export async function updateWalletAccountHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const account = await updateUserWalletAccount(req.params.accountId, req.body || {}, { actorId });
    res.json({ account });
  } catch (error) {
    handleUserError(next, error);
  }
}

export async function listWalletTransactionsHandler(req, res, next) {
  try {
    const result = await listUserWalletTransactions(req.params.accountId, {
      type: req.query.type,
      limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query.offset ? Number.parseInt(req.query.offset, 10) : undefined,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    });
    res.json(result);
  } catch (error) {
    handleUserError(next, error);
  }
}

export async function createWalletTransactionHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const result = await createUserWalletTransaction(req.params.accountId, req.body || {}, { actorId, actorRole });
    res.status(201).json(result);
  } catch (error) {
    handleUserError(next, error);
  }
}

export async function listWalletPaymentMethodsHandler(req, res, next) {
  try {
    const methods = await listWalletPaymentMethods(req.params.accountId);
    res.json({ methods });
  } catch (error) {
    handleUserError(next, error);
  }
}

export async function createWalletPaymentMethodHandler(req, res, next) {
  try {
    const { actorId, actorRole } = resolveActor(req);
    const method = await createWalletPaymentMethod(req.params.accountId, req.body || {}, { actorId, actorRole });
    res.status(201).json({ method });
  } catch (error) {
    handleUserError(next, error);
  }
}

export async function updateWalletPaymentMethodHandler(req, res, next) {
  try {
    const { actorId } = resolveActor(req);
    const method = await updateWalletPaymentMethod(req.params.accountId, req.params.methodId, req.body || {}, { actorId });
    res.json({ method });
  } catch (error) {
    handleUserError(next, error);
  }
}

export async function getWalletSummaryHandler(req, res, next) {
  try {
    const overview = await getUserWalletOverview({
      userId: req.query.userId || req.user?.id || null,
      companyId: req.query.companyId || null
    });
    res.json({ overview });
  } catch (error) {
    handleUserError(next, error);
  }
}
