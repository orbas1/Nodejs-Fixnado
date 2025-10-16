import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  WalletAccount,
  WalletTransaction,
  WalletPaymentMethod,
  User,
  Company
} from '../models/index.js';
import { toCanonicalRole } from '../constants/permissions.js';

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNumber(value) {
  if (value == null) return 0;
  const numeric = Number.parseFloat(value);
  if (Number.isFinite(numeric)) {
    return Number(numeric.toFixed(2));
  }
  return 0;
}

function sanitiseAccount(instance) {
  if (!instance) return null;
  const account = instance.get({ plain: true });
  account.balance = toNumber(account.balance);
  account.pending = toNumber(account.pending);
  account.spendingLimit = account.spendingLimit != null ? toNumber(account.spendingLimit) : null;
  account.autopayoutThreshold =
    account.autopayoutThreshold != null ? toNumber(account.autopayoutThreshold) : null;
  return account;
}

function sanitiseMethod(instance) {
  if (!instance) return null;
  const method = instance.get({ plain: true });
  return method;
}

function sanitiseTransaction(instance) {
  if (!instance) return null;
  const transaction = instance.get({ plain: true });
  transaction.amount = toNumber(transaction.amount);
  transaction.balanceBefore = toNumber(transaction.balanceBefore);
  transaction.balanceAfter = toNumber(transaction.balanceAfter);
  transaction.pendingBefore = toNumber(transaction.pendingBefore);
  transaction.pendingAfter = toNumber(transaction.pendingAfter);
  return transaction;
}

function normaliseAmount(value) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw createServiceError('Amount must be a positive number', 422);
  }
  return Number(numeric.toFixed(2));
}

function assertAccountActive(account) {
  if (!account) {
    throw createServiceError('Wallet account not found', 404);
  }
  if (account.status === 'suspended') {
    throw createServiceError('Wallet account is suspended', 409);
  }
  if (account.status === 'closed') {
    throw createServiceError('Wallet account is closed', 409);
  }
}

function normaliseRole(role) {
  return toCanonicalRole(role) || null;
}

function toMaskedIdentifier(type, details = {}) {
  if (type === 'bank_account') {
    const last4 = details.accountNumberLast4 || details.accountNumber?.slice(-4);
    const sortCode = details.sortCode?.replace(/\D+/g, '');
    if (last4 && sortCode) {
      return `••${last4} / ${sortCode.slice(-4)}`;
    }
    if (last4) {
      return `••${last4}`;
    }
  }
  if (type === 'card') {
    const last4 = details.cardLast4 || details.accountNumber?.slice(-4);
    if (last4) {
      return `•••• ${last4}`;
    }
  }
  if (details.identifier) {
    return details.identifier;
  }
  return null;
}

function sanitiseMethodDetails(type, payload = {}) {
  const common = {
    bankName: payload.bankName?.trim?.() || null,
    accountHolder: payload.accountHolder?.trim?.() || null,
    accountNumberLast4: payload.accountNumberLast4 || payload.accountNumber?.slice?.(-4) || null,
    sortCode: payload.sortCode?.replace?.(/[^0-9]/g, '') || null,
    iban: payload.iban?.replace?.(/\s+/g, '') || null,
    swift: payload.swift?.trim?.() || null,
    notes: payload.notes?.trim?.() || null,
    logoUrl: payload.logoUrl?.trim?.() || null
  };

  if (type === 'card') {
    return {
      brand: payload.brand?.trim?.() || null,
      expiryMonth: payload.expiryMonth || null,
      expiryYear: payload.expiryYear || null,
      cardLast4: common.accountNumberLast4,
      cardholderName: payload.accountHolder?.trim?.() || null,
      notes: common.notes,
      logoUrl: common.logoUrl
    };
  }

  if (type === 'external_wallet') {
    return {
      provider: payload.provider?.trim?.() || null,
      handle: payload.handle?.trim?.() || null,
      notes: common.notes,
      logoUrl: common.logoUrl
    };
  }

  return common;
}

export async function listWalletAccounts({ userId = null, companyId = null, includeInactive = false }) {
  const where = {};
  if (userId) {
    where.userId = userId;
  }
  if (companyId) {
    where.companyId = companyId;
  }
  if (!includeInactive) {
    where.status = { [Op.ne]: 'closed' };
  }

  const accounts = await WalletAccount.findAll({
    where,
    order: [['createdAt', 'ASC']],
    include: [{ model: WalletPaymentMethod, as: 'autopayoutMethod' }]
  });

  return accounts.map((account) => sanitiseAccount(account));
}

export async function createWalletAccount({
  userId = null,
  companyId = null,
  currency = 'GBP',
  alias = null,
  metadata = {},
  autopayoutEnabled = false,
  autopayoutThreshold = null,
  spendingLimit = null,
  actorId = null,
  actorRole = null
}) {
  if (!userId && !companyId) {
    throw createServiceError('userId or companyId is required to create a wallet account');
  }

  const account = await WalletAccount.create({
    userId,
    companyId,
    currency,
    alias,
    metadata,
    autopayoutEnabled: Boolean(autopayoutEnabled),
    autopayoutThreshold: autopayoutThreshold != null ? normaliseAmount(autopayoutThreshold) : null,
    spendingLimit: spendingLimit != null ? normaliseAmount(spendingLimit) : null,
    createdBy: actorId || null,
    updatedBy: actorId || null,
    status: 'active'
  });

  return sanitiseAccount(account);
}

async function getAccountWithRelations(accountId, { includeAutopayout = true } = {}) {
  const include = [];
  if (includeAutopayout) {
    include.push({ model: WalletPaymentMethod, as: 'autopayoutMethod' });
  }
  return WalletAccount.findByPk(accountId, { include });
}

async function getPaymentMethodsForAccount(accountId) {
  const methods = await WalletPaymentMethod.findAll({
    where: { walletAccountId: accountId },
    order: [['isDefaultPayout', 'DESC'], ['createdAt', 'ASC']]
  });
  return methods.map((method) => sanitiseMethod(method));
}

async function buildAccountSummary(account) {
  if (!account) {
    return null;
  }

  const accountId = account.id;
  const [creditTotal, debitTotal, recentTransactions] = await Promise.all([
    WalletTransaction.sum('amount', {
      where: { walletAccountId: accountId, type: 'credit' }
    }),
    WalletTransaction.sum('amount', {
      where: { walletAccountId: accountId, type: { [Op.in]: ['debit', 'release'] } }
    }),
    WalletTransaction.findAll({
      where: { walletAccountId: accountId },
      limit: 5,
      order: [['occurredAt', 'DESC']]
    })
  ]);

  const lastTransaction = recentTransactions[0] ? sanitiseTransaction(recentTransactions[0]) : null;
  const recent = recentTransactions.map((transaction) => sanitiseTransaction(transaction));

  return {
    balance: toNumber(account.balance),
    pending: toNumber(account.pending),
    available: toNumber(account.balance) - toNumber(account.pending),
    lifetimeCredits: toNumber(creditTotal || 0),
    lifetimeDebits: toNumber(debitTotal || 0),
    lastTransaction,
    recentTransactions: recent
  };
}

export async function getWalletAccountDetails(
  accountId,
  { include = [], transactionLimit = 10, transactionOffset = 0 } = {}
) {
  const includeSet = new Set(
    Array.isArray(include)
      ? include.map((value) => String(value).toLowerCase())
      : String(include || '')
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
  );

  const account = await getAccountWithRelations(accountId);
  if (!account) {
    throw createServiceError('Wallet account not found', 404);
  }

  const payload = {
    account: sanitiseAccount(account)
  };

  if (includeSet.has('methods')) {
    payload.methods = await getPaymentMethodsForAccount(account.id);
  }

  if (includeSet.has('summary')) {
    payload.summary = await buildAccountSummary(account);
    payload.autopayout = {
      enabled: account.autopayoutEnabled,
      threshold: account.autopayoutThreshold != null ? toNumber(account.autopayoutThreshold) : null,
      method: account.autopayoutMethod ? sanitiseMethod(account.autopayoutMethod) : null
    };
  }

  if (includeSet.has('transactions')) {
    const [items, total] = await Promise.all([
      WalletTransaction.findAll({
        where: { walletAccountId: account.id },
        order: [['occurredAt', 'DESC']],
        limit: Math.max(1, Math.min(transactionLimit, 100)),
        offset: Math.max(0, transactionOffset)
      }),
      WalletTransaction.count({ where: { walletAccountId: account.id } })
    ]);

    payload.transactions = {
      items: items.map((transaction) => sanitiseTransaction(transaction)),
      total,
      limit: Math.max(1, Math.min(transactionLimit, 100)),
      offset: Math.max(0, transactionOffset)
    };
  }

  return payload;
}

export async function updateWalletAccount(accountId, updates = {}, { actorId = null } = {}) {
  const account = await getAccountWithRelations(accountId);
  if (!account) {
    throw createServiceError('Wallet account not found', 404);
  }

  const next = { ...updates };

  if (next.autopayoutMethodId) {
    const method = await WalletPaymentMethod.findOne({
      where: { id: next.autopayoutMethodId, walletAccountId: account.id }
    });
    if (!method) {
      throw createServiceError('Autopayout method does not belong to this wallet', 409);
    }
  }

  if (next.status && !['active', 'suspended', 'closed'].includes(next.status)) {
    throw createServiceError('Invalid wallet status', 422);
  }

  if (next.status === 'closed' && toNumber(account.balance) > 0) {
    throw createServiceError('Wallet must be zeroed before closing', 422);
  }

  if (next.autopayoutThreshold != null) {
    next.autopayoutThreshold = normaliseAmount(next.autopayoutThreshold);
  }

  if (next.spendingLimit != null) {
    next.spendingLimit = normaliseAmount(next.spendingLimit);
  }

  const payload = {
    alias: next.alias ?? account.alias,
    autopayoutEnabled:
      next.autopayoutEnabled != null ? Boolean(next.autopayoutEnabled) : account.autopayoutEnabled,
    autopayoutThreshold: next.autopayoutThreshold ?? account.autopayoutThreshold,
    autopayoutMethodId: next.autopayoutMethodId ?? account.autopayoutMethodId,
    spendingLimit: next.spendingLimit ?? account.spendingLimit,
    metadata: next.metadata ? { ...account.metadata, ...next.metadata } : account.metadata,
    status: next.status ?? account.status,
    updatedBy: actorId || account.updatedBy
  };

  if (payload.autopayoutEnabled && !payload.autopayoutMethodId) {
    const defaultMethod = await WalletPaymentMethod.findOne({
      where: { walletAccountId: account.id, isDefaultPayout: true }
    });
    if (defaultMethod) {
      payload.autopayoutMethodId = defaultMethod.id;
    }
  }

  await account.update(payload);
  const reloaded = await getAccountWithRelations(accountId);
  return sanitiseAccount(reloaded);
}

export async function listWalletTransactions(
  accountId,
  { type = null, limit = 25, offset = 0, startDate = null, endDate = null } = {}
) {
  const account = await WalletAccount.findByPk(accountId);
  if (!account) {
    throw createServiceError('Wallet account not found', 404);
  }

  const where = { walletAccountId: account.id };
  if (type) {
    where.type = Array.isArray(type) ? { [Op.in]: type } : type;
  }
  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) {
      where.occurredAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      where.occurredAt[Op.lte] = new Date(endDate);
    }
  }

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const safeOffset = Math.max(0, offset);

  const [items, total] = await Promise.all([
    WalletTransaction.findAll({
      where,
      order: [['occurredAt', 'DESC']],
      limit: safeLimit,
      offset: safeOffset
    }),
    WalletTransaction.count({ where })
  ]);

  return {
    items: items.map((transaction) => sanitiseTransaction(transaction)),
    total,
    limit: safeLimit,
    offset: safeOffset
  };
}

export async function createWalletTransaction(accountId, payload, { actorId = null, actorRole = null } = {}) {
  const amount = normaliseAmount(payload.amount);
  const transactionType = payload.type;
  if (!['credit', 'debit', 'hold', 'release', 'adjustment'].includes(transactionType)) {
    throw createServiceError('Unsupported transaction type', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const account = await WalletAccount.findByPk(accountId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    assertAccountActive(account);

    if (payload.currency && payload.currency !== account.currency) {
      throw createServiceError('Transaction currency must match wallet currency', 422);
    }

    const balanceBefore = toNumber(account.balance);
    const pendingBefore = toNumber(account.pending);
    let balanceAfter = balanceBefore;
    let pendingAfter = pendingBefore;

    if (transactionType === 'credit' || transactionType === 'adjustment') {
      balanceAfter = balanceBefore + amount;
    } else if (transactionType === 'debit') {
      if (balanceBefore - amount < 0) {
        throw createServiceError('Insufficient wallet balance for debit', 409);
      }
      if (pendingBefore > balanceBefore - amount) {
        throw createServiceError('Debit would breach pending hold coverage', 409);
      }
      balanceAfter = balanceBefore - amount;
    } else if (transactionType === 'hold') {
      if (balanceBefore - pendingBefore < amount) {
        throw createServiceError('Insufficient available balance to hold funds', 409);
      }
      pendingAfter = pendingBefore + amount;
    } else if (transactionType === 'release') {
      if (pendingBefore < amount) {
        throw createServiceError('Cannot release more than pending amount', 409);
      }
      pendingAfter = pendingBefore - amount;
    }

    if (account.spendingLimit && toNumber(account.spendingLimit) > 0) {
      if (balanceAfter > toNumber(account.spendingLimit)) {
        throw createServiceError('Wallet spending limit exceeded', 409);
      }
    }

    await account.update(
      {
        balance: balanceAfter,
        pending: pendingAfter,
        updatedBy: actorId || account.updatedBy
      },
      { transaction }
    );

    const record = await WalletTransaction.create(
      {
        walletAccountId: account.id,
        type: transactionType,
        amount,
        currency: account.currency,
        description: payload.description || null,
        referenceId: payload.referenceId || null,
        actorId: actorId || null,
        actorRole: actorRole || null,
        balanceBefore,
        balanceAfter,
        pendingBefore,
        pendingAfter,
        metadata: payload.metadata || {},
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date()
      },
      { transaction }
    );

    return {
      account: sanitiseAccount(account),
      transaction: sanitiseTransaction(record)
    };
  });
}

export async function createWalletPaymentMethod(
  accountId,
  payload,
  { actorId = null, actorRole = null } = {}
) {
  const account = await WalletAccount.findByPk(accountId);
  if (!account) {
    throw createServiceError('Wallet account not found', 404);
  }

  const type = payload.type;
  if (!['bank_account', 'card', 'external_wallet'].includes(type)) {
    throw createServiceError('Unsupported payment method type', 422);
  }

  const label = payload.label?.trim();
  if (!label) {
    throw createServiceError('Payment method label is required', 422);
  }

  const details = sanitiseMethodDetails(type, payload.details || payload);
  const method = await WalletPaymentMethod.create({
    walletAccountId: account.id,
    type,
    label,
    status: payload.status && ['active', 'inactive', 'pending', 'rejected'].includes(payload.status)
      ? payload.status
      : 'active',
    maskedIdentifier: toMaskedIdentifier(type, details),
    details,
    supportingDocumentUrl: payload.supportingDocumentUrl || null,
    isDefaultPayout: Boolean(payload.isDefaultPayout),
    createdBy: actorId || null,
    actorRole: normaliseRole(actorRole)
  });

  if (method.isDefaultPayout) {
    await WalletPaymentMethod.update(
      { isDefaultPayout: false },
      { where: { walletAccountId: account.id, id: { [Op.ne]: method.id } } }
    );
    await account.update({ autopayoutMethodId: method.id });
  }

  return sanitiseMethod(method);
}

export async function listWalletPaymentMethods(accountId) {
  const account = await WalletAccount.findByPk(accountId);
  if (!account) {
    throw createServiceError('Wallet account not found', 404);
  }
  return getPaymentMethodsForAccount(account.id);
}

export async function updateWalletPaymentMethod(
  accountId,
  methodId,
  updates,
  { actorId = null } = {}
) {
  const method = await WalletPaymentMethod.findOne({
    where: { id: methodId, walletAccountId: accountId }
  });
  if (!method) {
    throw createServiceError('Payment method not found', 404);
  }

  const payload = {};
  if (updates.label) {
    payload.label = updates.label.trim();
  }
  if (updates.status && ['active', 'inactive', 'pending', 'rejected'].includes(updates.status)) {
    payload.status = updates.status;
  }
  if (updates.supportingDocumentUrl !== undefined) {
    payload.supportingDocumentUrl = updates.supportingDocumentUrl || null;
  }
  if (updates.details) {
    const merged = { ...method.details, ...sanitiseMethodDetails(method.type, updates.details) };
    payload.details = merged;
    payload.maskedIdentifier = toMaskedIdentifier(method.type, merged) || method.maskedIdentifier;
  }
  if (updates.isDefaultPayout != null) {
    payload.isDefaultPayout = Boolean(updates.isDefaultPayout);
  }

  if (Object.keys(payload).length === 0) {
    return sanitiseMethod(method);
  }

  await method.update(payload);

  if (payload.isDefaultPayout) {
    await WalletPaymentMethod.update(
      { isDefaultPayout: false },
      { where: { walletAccountId: accountId, id: { [Op.ne]: method.id } } }
    );
    await WalletAccount.update({ autopayoutMethodId: method.id, updatedBy: actorId || null }, { where: { id: accountId } });
  } else if (payload.isDefaultPayout === false) {
    const account = await WalletAccount.findByPk(accountId);
    if (account?.autopayoutMethodId === method.id) {
      await account.update({ autopayoutMethodId: null, autopayoutEnabled: false });
    }
  }

  return sanitiseMethod(await WalletPaymentMethod.findByPk(method.id));
}

export async function getWalletOverview({ userId = null, companyId = null }) {
  if (!userId && !companyId) {
    return null;
  }

  const account = await WalletAccount.findOne({
    where: {
      ...(userId ? { userId } : {}),
      ...(companyId ? { companyId } : {})
    },
    order: [['createdAt', 'ASC']],
    include: [{ model: WalletPaymentMethod, as: 'autopayoutMethod' }]
  });

  if (!account) {
    return null;
  }

  const [methods, summary] = await Promise.all([
    getPaymentMethodsForAccount(account.id),
    buildAccountSummary(account)
  ]);

  let user = null;
  if (account.userId) {
    const record = await User.findByPk(account.userId);
    if (record) {
      user = { id: record.id, name: `${record.firstName ?? ''} ${record.lastName ?? ''}`.trim() };
    }
  }

  let company = null;
  if (account.companyId) {
    const organisation = await Company.findByPk(account.companyId);
    if (organisation) {
      company = { id: organisation.id, name: organisation.name };
    }
  }

  return {
    account: sanitiseAccount(account),
    methods,
    summary,
    autopayout: {
      enabled: account.autopayoutEnabled,
      threshold: account.autopayoutThreshold != null ? toNumber(account.autopayoutThreshold) : null,
      method: account.autopayoutMethod ? sanitiseMethod(account.autopayoutMethod) : null
    },
    user,
    company
  };
}
