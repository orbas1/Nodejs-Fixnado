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
