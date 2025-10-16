import { Op, fn, col } from 'sequelize';
import sequelize from '../../config/database.js';
import { WalletAccount, WalletTransaction, PayoutRequest } from '../../models/index.js';
import {
  formatAccount,
  formatTransaction,
  normaliseCurrency,
  normaliseOwnerType,
  normaliseStatus,
  normaliseTransactionType,
  toNumber
} from './helpers.js';

function buildAccountWhere({ search, status }) {
  const where = {};
  const filters = [];

  if (status && status !== 'all') {
    filters.push({ status: normaliseStatus(status) });
  }

  if (search && typeof search === 'string') {
    const trimmed = search.trim();
    if (trimmed) {
      const likePattern = `%${trimmed.toLowerCase()}%`;
      filters.push({
        [Op.or]: [
          sequelize.where(fn('lower', col('display_name')), {
            [Op.like]: likePattern
          }),
          sequelize.where(fn('lower', col('owner_type')), {
            [Op.like]: likePattern
          })
        ]
      });

      if (/^[0-9a-f-]{8,}$/i.test(trimmed)) {
        filters.push({ ownerId: trimmed });
      }
    }
  }

  if (filters.length === 1) {
    Object.assign(where, filters[0]);
  } else if (filters.length > 1) {
    where[Op.and] = filters;
  }

  return where;
}

async function resolvePendingPayouts(accounts) {
  const providerOwnerIds = accounts
    .filter((account) => account.ownerType === 'provider')
    .map((account) => account.ownerId);

  if (providerOwnerIds.length === 0) {
    return new Map();
  }

  const rows = await PayoutRequest.findAll({
    attributes: [
      'providerId',
      [fn('SUM', col('amount')), 'totalAmount'],
      [fn('COUNT', col('id')), 'count']
    ],
    where: {
      providerId: { [Op.in]: providerOwnerIds },
      status: { [Op.in]: ['pending', 'approved', 'processing'] }
    },
    group: ['providerId']
  });

  const map = new Map();
  rows.forEach((row) => {
    map.set(row.get('providerId'), {
      total: toNumber(row.get('totalAmount')),
      count: Number.parseInt(row.get('count'), 10) || 0
    });
  });
  return map;
}

async function attachRecentTransactions(accounts) {
  if (accounts.length === 0) {
    return new Map();
  }

  const ids = accounts.map((account) => account.id);
  const recent = await WalletTransaction.findAll({
    where: { walletAccountId: { [Op.in]: ids } },
    order: [['occurred_at', 'DESC']],
    limit: ids.length * 3
  });

  const map = new Map();
  recent.forEach((transaction) => {
    if (!map.has(transaction.walletAccountId)) {
      map.set(transaction.walletAccountId, transaction);
    }
  });
  return map;
}

export async function listWalletAccounts({
  search,
  status,
  page = 1,
  pageSize = 10,
  includeRecent = false
} = {}) {
  const limit = Math.min(Math.max(Number.parseInt(pageSize, 10) || 10, 1), 50);
  const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const offset = (currentPage - 1) * limit;
  const where = buildAccountWhere({ search, status });

  const { rows, count } = await WalletAccount.findAndCountAll({
    where,
    order: [['updated_at', 'DESC']],
    limit,
    offset
  });

  const pendingMap = await resolvePendingPayouts(rows);
  const recentMap = includeRecent ? await attachRecentTransactions(rows) : new Map();

  const results = rows.map((account) =>
    formatAccount(account, {
      pendingPayout: account.ownerType === 'provider' ? pendingMap.get(account.ownerId) ?? null : null,
      lastTransaction: includeRecent ? recentMap.get(account.id) ?? null : null
    })
  );

  return {
    page: currentPage,
    pageSize: limit,
    total: count,
    results
  };
}

export async function createWalletAccount({
  displayName,
  ownerType,
  ownerId,
  currency,
  status,
  metadata,
  actorId
}) {
  const resolvedOwnerType = normaliseOwnerType(ownerType);
  if (!resolvedOwnerType) {
    const error = new Error('Owner type is not supported for wallets');
    error.statusCode = 422;
    throw error;
  }
  if (!ownerId) {
    const error = new Error('Owner ID is required');
    error.statusCode = 422;
    throw error;
  }
  if (!displayName || typeof displayName !== 'string') {
    const error = new Error('Display name is required');
    error.statusCode = 422;
    throw error;
  }

  const account = await WalletAccount.create({
    displayName: displayName.trim(),
    ownerType: resolvedOwnerType,
    ownerId,
    currency: normaliseCurrency(currency),
    status: normaliseStatus(status),
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    lastReconciledAt: new Date()
  });

  if (actorId) {
    await WalletTransaction.create({
      walletAccountId: account.id,
      type: 'adjustment',
      amount: 0,
      currency: account.currency,
      description: 'Wallet created',
      actorId,
      occurredAt: new Date(),
      runningBalance: 0,
      metadata: { systemEvent: true }
    });
  }

  return formatAccount(account);
}

export async function updateWalletAccount(id, { displayName, status, metadata, lastReconciledAt }) {
  const account = await WalletAccount.findByPk(id);
  if (!account) {
    const error = new Error('Wallet account not found');
    error.statusCode = 404;
    throw error;
  }

  if (displayName && typeof displayName === 'string') {
    account.displayName = displayName.trim();
  }
  if (status) {
    account.status = normaliseStatus(status);
  }
  if (metadata && typeof metadata === 'object') {
    account.metadata = { ...(account.metadata ?? {}), ...metadata };
  }
  if (lastReconciledAt) {
    account.lastReconciledAt = new Date(lastReconciledAt);
  }

  await account.save();
  return formatAccount(account);
}

export async function recordWalletTransaction({
  accountId,
  type,
  amount,
  currency,
  referenceType,
  referenceId,
  description,
  metadata,
  actorId,
  allowNegative = false
}) {
  const account = await WalletAccount.findByPk(accountId);
  if (!account) {
    const error = new Error('Wallet account not found');
    error.statusCode = 404;
    throw error;
  }

  const transactionType = normaliseTransactionType(type);
  if (!transactionType) {
    const error = new Error('Transaction type is invalid');
    error.statusCode = 422;
    throw error;
  }

  const numericAmount = Number.parseFloat(amount);
  if (!Number.isFinite(numericAmount)) {
    const error = new Error('Amount must be a valid number');
    error.statusCode = 422;
    throw error;
  }
  if (transactionType !== 'adjustment' && numericAmount <= 0) {
    const error = new Error('Amount must be greater than zero');
    error.statusCode = 422;
    throw error;
  }

  const transactionCurrency = normaliseCurrency(currency || account.currency);
  if (transactionCurrency !== account.currency) {
    const error = new Error('Transaction currency must match wallet currency');
    error.statusCode = 422;
    throw error;
  }

  return sequelize.transaction(async (t) => {
    const currentBalance = toNumber(account.balance);
    const currentHold = toNumber(account.holdBalance);

    let nextBalance = currentBalance;
    let nextHold = currentHold;

    switch (transactionType) {
      case 'credit':
        nextBalance = currentBalance + numericAmount;
        break;
      case 'debit':
        nextBalance = currentBalance - numericAmount;
        break;
      case 'hold':
        nextBalance = currentBalance - numericAmount;
        nextHold = currentHold + numericAmount;
        break;
      case 'release':
        nextHold = Math.max(0, currentHold - numericAmount);
        nextBalance = currentBalance + numericAmount;
        break;
      case 'refund':
        nextBalance = currentBalance - numericAmount;
        break;
      case 'adjustment':
        nextBalance = currentBalance + numericAmount;
        break;
      default: {
        const error = new Error('Unsupported transaction type');
        error.statusCode = 422;
        throw error;
      }
    }

    if (!allowNegative && nextBalance < 0) {
      const error = new Error('Wallet balance cannot be negative');
      error.statusCode = 409;
      throw error;
    }

    account.balance = nextBalance;
    account.holdBalance = nextHold;
    account.lastReconciledAt = new Date();
    await account.save({ transaction: t });

    const transaction = await WalletTransaction.create(
      {
        walletAccountId: account.id,
        type: transactionType,
        amount: numericAmount,
        currency: transactionCurrency,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        description: description || null,
        actorId: actorId || null,
        occurredAt: new Date(),
        runningBalance: nextBalance,
        metadata: metadata && typeof metadata === 'object' ? metadata : {}
      },
      { transaction: t }
    );

    return {
      account: formatAccount(account),
      transaction: formatTransaction(transaction, account)
    };
  });
}

export async function listWalletTransactions({ accountId, limit = 25 } = {}) {
  const account = await WalletAccount.findByPk(accountId);
  if (!account) {
    const error = new Error('Wallet account not found');
    error.statusCode = 404;
    throw error;
  }

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 25, 1), 100);
  const entries = await WalletTransaction.findAll({
    where: { walletAccountId: account.id },
    order: [['occurred_at', 'DESC']],
    limit: safeLimit
  });

  const pendingMap = await resolvePendingPayouts([account]);
  const pending = account.ownerType === 'provider' ? pendingMap.get(account.ownerId) ?? null : null;
  const lastTransaction = entries.length > 0 ? entries[0] : null;

  return {
    account: formatAccount(account, { lastTransaction, pendingPayout: pending }),
    transactions: entries.map((entry) => formatTransaction(entry, account))
  };
}

export default {
  listWalletAccounts,
  createWalletAccount,
  updateWalletAccount,
  recordWalletTransaction,
  listWalletTransactions
};
