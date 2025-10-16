import { ACCOUNT_STATUSES, DEFAULT_SETTINGS, OWNER_TYPES, TRANSACTION_TYPES } from './constants.js';

export function toNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normaliseOwnerType(value) {
  if (typeof value !== 'string') return '';
  const normalised = value.trim().toLowerCase();
  return OWNER_TYPES.includes(normalised) ? normalised : '';
}

export function normaliseStatus(value) {
  if (typeof value !== 'string') return 'active';
  const normalised = value.trim().toLowerCase();
  return ACCOUNT_STATUSES.includes(normalised) ? normalised : 'active';
}

export function normaliseCurrency(value) {
  if (typeof value !== 'string') return 'GBP';
  const normalised = value.trim().toUpperCase();
  return normalised || 'GBP';
}

export function normaliseTransactionType(value) {
  if (typeof value !== 'string') return '';
  const normalised = value.trim().toLowerCase();
  return TRANSACTION_TYPES.includes(normalised) ? normalised : '';
}

function ensureArrayStrings(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((entry) => (typeof entry === 'string' ? entry.trim() : `${entry}`.trim()))
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function ensureSettingsStructure(settings = {}) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings,
    fundingRails: {
      ...DEFAULT_SETTINGS.fundingRails,
      ...(settings.fundingRails || {})
    },
    compliance: {
      ...DEFAULT_SETTINGS.compliance,
      ...(settings.compliance || {})
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(settings.notifications || {})
    }
  };

  merged.walletEnabled = settings.walletEnabled !== false;
  merged.allowedOwnerTypes = ensureArrayStrings(settings.allowedOwnerTypes).filter((type) =>
    OWNER_TYPES.includes(type)
  );
  if (merged.allowedOwnerTypes.length === 0) {
    merged.allowedOwnerTypes = [...DEFAULT_SETTINGS.allowedOwnerTypes];
  }
  merged.minBalanceWarning = toNumber(settings.minBalanceWarning, DEFAULT_SETTINGS.minBalanceWarning);
  merged.autoPayoutCadenceDays = Math.max(
    1,
    Math.round(toNumber(settings.autoPayoutCadenceDays, DEFAULT_SETTINGS.autoPayoutCadenceDays))
  );

  merged.fundingRails.stripeConnect = {
    enabled: settings?.fundingRails?.stripeConnect?.enabled !== false,
    accountId: settings?.fundingRails?.stripeConnect?.accountId || '',
    autoCapture: settings?.fundingRails?.stripeConnect?.autoCapture !== false
  };
  merged.fundingRails.bankTransfer = {
    enabled: settings?.fundingRails?.bankTransfer?.enabled !== false,
    instructions: settings?.fundingRails?.bankTransfer?.instructions || ''
  };
  merged.fundingRails.manual = {
    enabled: settings?.fundingRails?.manual?.enabled !== false,
    notes: settings?.fundingRails?.manual?.notes || ''
  };

  merged.compliance.termsUrl = settings?.compliance?.termsUrl || '';
  merged.compliance.kycRequired = settings?.compliance?.kycRequired !== false;
  merged.compliance.amlChecklist = settings?.compliance?.amlChecklist || '';
  merged.compliance.fallbackHoldDays = Math.max(
    1,
    Math.round(toNumber(settings?.compliance?.fallbackHoldDays, DEFAULT_SETTINGS.compliance.fallbackHoldDays))
  );
  merged.compliance.escalationEmails = ensureArrayStrings(settings?.compliance?.escalationEmails);

  merged.notifications.lowBalanceEmails = ensureArrayStrings(settings?.notifications?.lowBalanceEmails);
  merged.notifications.largeTransactionThreshold = Math.max(
    0,
    toNumber(
      settings?.notifications?.largeTransactionThreshold,
      DEFAULT_SETTINGS.notifications.largeTransactionThreshold
    )
  );
  merged.notifications.slackWebhook = settings?.notifications?.slackWebhook || '';

  return merged;
}

export function buildComplianceNotices(settings) {
  const notices = [];
  if (!settings.compliance.termsUrl) {
    notices.push({
      id: 'missing-terms',
      severity: 'high',
      title: 'Wallet terms missing',
      message: 'Add a link to wallet terms so finance teams can share compliant disclosures.'
    });
  }

  if (settings.compliance.fallbackHoldDays > 7) {
    notices.push({
      id: 'extended-hold',
      severity: 'medium',
      title: 'Extended hold period configured',
      message: 'Review fallback hold days to ensure they align with escrow rules and FCA guidance.'
    });
  }

  if (settings.notifications.largeTransactionThreshold <= 0) {
    notices.push({
      id: 'missing-threshold',
      severity: 'low',
      title: 'Large transaction threshold disabled',
      message: 'Set a threshold so high-value credits trigger instant notifications.'
    });
  }

  return notices;
}

export function formatTransaction(instance, account) {
  const plain = instance?.toJSON ? instance.toJSON() : instance;
  return {
    id: plain.id,
    accountId: plain.walletAccountId || plain.wallet_account_id,
    accountName: plain.walletAccount?.displayName || account?.displayName || null,
    ownerType: plain.walletAccount?.ownerType || account?.ownerType || null,
    type: plain.type,
    amount: toNumber(plain.amount),
    currency: plain.currency,
    occurredAt: plain.occurredAt ? new Date(plain.occurredAt).toISOString() : null,
    referenceType: plain.referenceType || null,
    referenceId: plain.referenceId || null,
    description: plain.description || '',
    actorId: plain.actorId || null,
    runningBalance:
      plain.runningBalance != null
        ? toNumber(plain.runningBalance)
        : account
        ? toNumber(account.balance)
        : null,
    metadata: plain.metadata ?? {}
  };
}

export function formatAccount(account, { lastTransaction = null, pendingPayout = null } = {}) {
  const plain = account?.toJSON ? account.toJSON() : account;
  return {
    id: plain.id,
    displayName: plain.displayName,
    ownerType: plain.ownerType,
    ownerId: plain.ownerId,
    status: plain.status,
    balance: toNumber(plain.balance),
    holdBalance: toNumber(plain.holdBalance),
    currency: plain.currency,
    lastReconciledAt: plain.lastReconciledAt ? new Date(plain.lastReconciledAt).toISOString() : null,
    metadata: plain.metadata ?? {},
    lastTransaction: lastTransaction ? formatTransaction(lastTransaction, plain) : null,
    pendingPayouts: pendingPayout
      ? {
          totalAmount: toNumber(pendingPayout.total),
          count: pendingPayout.count
        }
      : { totalAmount: 0, count: 0 }
  };
}

export function formatPayout(entry) {
  const plain = entry?.toJSON ? entry.toJSON() : entry;
  return {
    id: plain.id,
    providerId: plain.providerId,
    amount: toNumber(plain.amount),
    currency: plain.currency,
    status: plain.status,
    scheduledFor: plain.scheduledFor ? new Date(plain.scheduledFor).toISOString() : null
  };
}
