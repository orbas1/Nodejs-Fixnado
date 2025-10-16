export const OWNER_TYPES = ['provider', 'company', 'customer', 'affiliate', 'operations'];

export const ACCOUNT_STATUSES = ['active', 'suspended', 'closed'];

export const TRANSACTION_TYPES = ['credit', 'debit', 'hold', 'release', 'adjustment', 'refund'];

export const DEFAULT_SETTINGS = {
  walletEnabled: true,
  allowedOwnerTypes: ['provider', 'company'],
  minBalanceWarning: 50,
  autoPayoutCadenceDays: 7,
  fundingRails: {
    stripeConnect: { enabled: true, accountId: '', autoCapture: true },
    bankTransfer: { enabled: true, instructions: '' },
    manual: { enabled: true, notes: '' }
  },
  compliance: {
    termsUrl: '',
    kycRequired: true,
    amlChecklist: '',
    fallbackHoldDays: 3,
    escalationEmails: []
  },
  notifications: {
    lowBalanceEmails: [],
    largeTransactionThreshold: 2000,
    slackWebhook: ''
  }
};
