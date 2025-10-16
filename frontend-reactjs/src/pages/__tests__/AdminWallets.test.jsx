import { describe, expect, it } from 'vitest';
import {
  normaliseSettingsForForm,
  preparePayloadFromForm,
  summariseTotals
} from '../../modules/walletManagement/utils.js';

describe('AdminWallets helpers', () => {
  it('normalises settings with sensible defaults', () => {
    const result = normaliseSettingsForForm({
      walletEnabled: false,
      allowedOwnerTypes: ['provider'],
      fundingRails: {
        stripeConnect: { enabled: true, accountId: 'acct_test', autoCapture: false }
      },
      compliance: {
        termsUrl: 'https://example.com',
        escalationEmails: ['ops@example.com']
      },
      notifications: {
        lowBalanceEmails: ['finance@example.com'],
        largeTransactionThreshold: 5000
      }
    });

    expect(result.walletEnabled).toBe(false);
    expect(result.allowedOwnerTypes).toEqual(['provider']);
    expect(result.fundingRails.stripeConnect.accountId).toBe('acct_test');
    expect(result.compliance.escalationEmailsText).toContain('ops@example.com');
    expect(result.notifications.lowBalanceEmailsText).toContain('finance@example.com');
  });

  it('prepares payloads from form state', () => {
    const payload = preparePayloadFromForm({
      walletEnabled: true,
      allowedOwnerTypes: ['provider', 'company'],
      minBalanceWarning: '120',
      autoPayoutCadenceDays: '5',
      fundingRails: {
        stripeConnect: { enabled: true, accountId: 'acct_test', autoCapture: true },
        bankTransfer: { enabled: false, instructions: '' },
        manual: { enabled: true, notes: 'Manual payouts allowed' }
      },
      compliance: {
        termsUrl: 'https://example.com',
        kycRequired: true,
        fallbackHoldDays: '4',
        amlChecklist: 'Check ID',
        escalationEmailsText: 'ops@example.com, finance@example.com'
      },
      notifications: {
        lowBalanceEmailsText: 'finance@example.com',
        largeTransactionThreshold: '2500',
        slackWebhook: 'https://hooks.slack.com/services/test'
      }
    });

    expect(payload.allowedOwnerTypes).toEqual(['provider', 'company']);
    expect(payload.minBalanceWarning).toBe(120);
    expect(payload.compliance.escalationEmails).toHaveLength(2);
    expect(payload.notifications.largeTransactionThreshold).toBe(2500);
  });

  it('summarises totals into a readable string', () => {
    const summary = summariseTotals([
      { currency: 'GBP', totalBalance: 1200.5 },
      { currency: 'EUR', totalBalance: 900.25 }
    ]);

    expect(summary).toContain('GBP');
    expect(summary).toContain('EUR');
  });
});
