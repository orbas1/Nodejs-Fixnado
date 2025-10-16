export function formatCurrency(amount, currency = 'GBP') {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  });
  const numeric = Number.parseFloat(amount ?? 0);
  if (!Number.isFinite(numeric)) {
    return formatter.format(0);
  }
  return formatter.format(numeric);
}

export function normaliseSettingsForForm(settings = {}) {
  return {
    walletEnabled: settings.walletEnabled !== false,
    allowedOwnerTypes:
      Array.isArray(settings.allowedOwnerTypes) && settings.allowedOwnerTypes.length > 0
        ? settings.allowedOwnerTypes
        : ['provider', 'company'],
    minBalanceWarning: settings.minBalanceWarning ?? 50,
    autoPayoutCadenceDays: settings.autoPayoutCadenceDays ?? 7,
    fundingRails: {
      stripeConnect: {
        enabled: settings?.fundingRails?.stripeConnect?.enabled !== false,
        accountId: settings?.fundingRails?.stripeConnect?.accountId || '',
        autoCapture: settings?.fundingRails?.stripeConnect?.autoCapture !== false
      },
      bankTransfer: {
        enabled: settings?.fundingRails?.bankTransfer?.enabled !== false,
        instructions: settings?.fundingRails?.bankTransfer?.instructions || ''
      },
      manual: {
        enabled: settings?.fundingRails?.manual?.enabled !== false,
        notes: settings?.fundingRails?.manual?.notes || ''
      }
    },
    compliance: {
      termsUrl: settings?.compliance?.termsUrl || '',
      kycRequired: settings?.compliance?.kycRequired !== false,
      fallbackHoldDays: settings?.compliance?.fallbackHoldDays ?? 3,
      amlChecklist: settings?.compliance?.amlChecklist || '',
      escalationEmailsText: Array.isArray(settings?.compliance?.escalationEmails)
        ? settings.compliance.escalationEmails.join(', ')
        : ''
    },
    notifications: {
      lowBalanceEmailsText: Array.isArray(settings?.notifications?.lowBalanceEmails)
        ? settings.notifications.lowBalanceEmails.join(', ')
        : '',
      largeTransactionThreshold: settings?.notifications?.largeTransactionThreshold ?? 2000,
      slackWebhook: settings?.notifications?.slackWebhook || ''
    }
  };
}

export function preparePayloadFromForm(form) {
  const normalisedEmails = (text) =>
    (typeof text === 'string' ? text.split(',') : [])
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  return {
    walletEnabled: form.walletEnabled,
    allowedOwnerTypes: Array.isArray(form.allowedOwnerTypes) ? form.allowedOwnerTypes : [],
    minBalanceWarning: Number(form.minBalanceWarning ?? 0),
    autoPayoutCadenceDays: Number(form.autoPayoutCadenceDays ?? 0),
    fundingRails: {
      stripeConnect: {
        enabled: form.fundingRails?.stripeConnect?.enabled !== false,
        accountId: form.fundingRails?.stripeConnect?.accountId || '',
        autoCapture: form.fundingRails?.stripeConnect?.autoCapture !== false
      },
      bankTransfer: {
        enabled: form.fundingRails?.bankTransfer?.enabled !== false,
        instructions: form.fundingRails?.bankTransfer?.instructions || ''
      },
      manual: {
        enabled: form.fundingRails?.manual?.enabled !== false,
        notes: form.fundingRails?.manual?.notes || ''
      }
    },
    compliance: {
      termsUrl: form.compliance?.termsUrl || '',
      kycRequired: form.compliance?.kycRequired !== false,
      fallbackHoldDays: Number(form.compliance?.fallbackHoldDays ?? 0),
      amlChecklist: form.compliance?.amlChecklist || '',
      escalationEmails: normalisedEmails(form.compliance?.escalationEmailsText)
    },
    notifications: {
      lowBalanceEmails: normalisedEmails(form.notifications?.lowBalanceEmailsText),
      largeTransactionThreshold: Number(form.notifications?.largeTransactionThreshold ?? 0),
      slackWebhook: form.notifications?.slackWebhook || ''
    }
  };
}

export function summariseTotals(totals = []) {
  if (!Array.isArray(totals) || totals.length === 0) {
    return '£0.00';
  }

  return totals
    .map((total) => `${total.currency ?? 'GBP'} ${Number.parseFloat(total.totalBalance ?? 0).toLocaleString()}`)
    .join(' • ');
}
