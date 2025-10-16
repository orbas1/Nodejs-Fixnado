import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const configModule = await import('../src/config/index.js');
const config = configModule.default;
const { sequelize, PlatformSetting } = await import('../src/models/index.js');
const {
  getPlatformSettings,
  updatePlatformSettings
} = await import('../src/services/platformSettingsService.js');

const ORIGINAL_FINANCE = JSON.parse(JSON.stringify(config.finance));
const ORIGINAL_INTEGRATIONS = JSON.parse(JSON.stringify(config.integrations));
const ORIGINAL_APP = config.app ? JSON.parse(JSON.stringify(config.app)) : null;
const ORIGINAL_SYSTEM = config.system ? JSON.parse(JSON.stringify(config.system)) : null;
const ORIGINAL_SOCIAL = config.social ? JSON.parse(JSON.stringify(config.social)) : null;
const ORIGINAL_SUPPORT = config.support ? JSON.parse(JSON.stringify(config.support)) : null;
const ORIGINAL_AI = config.ai ? JSON.parse(JSON.stringify(config.ai)) : null;

async function resetDatabase() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  await PlatformSetting.destroy({ where: {} });
}

function resetRuntimeConfig() {
  config.finance = JSON.parse(JSON.stringify(ORIGINAL_FINANCE));
  config.integrations = JSON.parse(JSON.stringify(ORIGINAL_INTEGRATIONS));

  if (ORIGINAL_APP) {
    config.app = JSON.parse(JSON.stringify(ORIGINAL_APP));
  } else {
    delete config.app;
  }

  if (ORIGINAL_SYSTEM) {
    config.system = JSON.parse(JSON.stringify(ORIGINAL_SYSTEM));
  } else {
    delete config.system;
  }

  if (ORIGINAL_SOCIAL) {
    config.social = JSON.parse(JSON.stringify(ORIGINAL_SOCIAL));
  } else {
    delete config.social;
  }

  if (ORIGINAL_SUPPORT) {
    config.support = JSON.parse(JSON.stringify(ORIGINAL_SUPPORT));
  } else {
    delete config.support;
  }

  if (ORIGINAL_AI) {
    config.ai = JSON.parse(JSON.stringify(ORIGINAL_AI));
  } else {
    delete config.ai;
  }
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await getPlatformSettings({ forceRefresh: true });
});

beforeEach(async () => {
  await resetDatabase();
  resetRuntimeConfig();
  await getPlatformSettings({ forceRefresh: true });
});

afterAll(async () => {
  await sequelize.close();
  resetRuntimeConfig();
});

describe('platformSettingsService commission defaults', () => {
  it('hydrates a 2.5% default commission rate', async () => {
    const settings = await getPlatformSettings();
    expect(settings.commissions.baseRate).toBeCloseTo(0.025, 5);
    expect(config.finance.commissionRates.default).toBeCloseTo(0.025, 5);
  });

  it('rejects commission rates above 100%', async () => {
    const updated = await updatePlatformSettings({
      commissions: {
        baseRate: 5
      }
    }, 'qa-tester');

    expect(updated.commissions.baseRate).toBeCloseTo(0.025, 5);
    expect(config.finance.commissionRates.default).toBeCloseTo(0.025, 5);
    const rows = await PlatformSetting.findAll({ where: { key: 'commissions' }, raw: true });
    expect(rows).toHaveLength(1);
    const storedValue =
      typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
    const storedBaseRate = Number.parseFloat(storedValue.baseRate);
    expect(storedBaseRate).toBeCloseTo(0.025, 5);
  });

  it('persists valid commission updates and keeps config in sync', async () => {
    const updated = await updatePlatformSettings({
      commissions: {
        baseRate: 0.18,
        customRates: {
          'scheduled:high': 0.25
        },
        structures: [
          {
            id: 'vip',
            name: 'VIP partners',
            rateType: 'percentage',
            rateValue: 0.12,
            appliesTo: ['vip', 'preferred'],
            payoutDelayDays: 3,
            minBookingValue: 100,
            maxBookingValue: 2000,
            active: true,
            imageUrl: 'https://cdn.fixnado.com/vip.png'
          }
        ]
      }
    }, 'finance');

    expect(updated.commissions.baseRate).toBeCloseTo(0.18, 5);
    expect(updated.commissions.customRates['scheduled:high']).toBeCloseTo(0.25, 5);
    expect(updated.commissions.structures).toHaveLength(1);
    expect(updated.commissions.structures[0]).toMatchObject({
      id: 'vip',
      rateType: 'percentage',
      rateValue: 0.12,
      payoutDelayDays: 3,
      minBookingValue: 100,
      maxBookingValue: 2000,
      active: true
    });
    expect(config.finance.commissionRates.default).toBeCloseTo(0.18, 5);
    expect(config.finance.commissionRates['scheduled:high']).toBeCloseTo(0.25, 5);
    expect(config.finance.commissionStructures).toHaveLength(1);
    expect(config.finance.commissionStructures[0]).toMatchObject({ id: 'vip', rateValue: 0.12 });

    const cached = await getPlatformSettings();
    expect(cached.commissions.baseRate).toBeCloseTo(0.18, 5);
    expect(cached.commissions.customRates['scheduled:high']).toBeCloseTo(0.25, 5);
    expect(cached.commissions.structures[0]).toMatchObject({ id: 'vip' });
  });
});

describe('subscription package governance', () => {
  it('sanitises and persists subscription packages', async () => {
    const updated = await updatePlatformSettings({
      subscriptions: {
        defaultTier: 'growth',
        tiers: [
          {
            id: 'growth',
            label: 'Growth',
            description: 'Scale to regional coverage.',
            features: ['jobs', 'crm', 'analytics'],
            price: { amount: 199.995, currency: 'usd' },
            billingInterval: 'MONTH',
            billingFrequency: 3,
            trialDays: 21,
            badge: 'Best value',
            imageUrl: 'https://cdn.fixnado.com/growth.png',
            roleAccess: ['provider', 'provider', 'admin'],
            highlight: true,
            supportUrl: 'https://docs.fixnado.com/growth'
          }
        ],
        restrictedFeatures: ['jobs', 'crm']
      }
    }, 'subscriptions');

    expect(updated.subscriptions.tiers).toHaveLength(1);
    const [tier] = updated.subscriptions.tiers;
    expect(tier).toMatchObject({
      id: 'growth',
      label: 'Growth',
      price: { amount: 199.99, currency: 'USD' },
      billingInterval: 'month',
      billingFrequency: 3,
      trialDays: 21,
      highlight: true,
      supportUrl: 'https://docs.fixnado.com/growth'
    });
    expect(tier.roleAccess).toEqual(['provider', 'admin']);
    expect(config.subscriptions.tiers[0]).toMatchObject({ id: 'growth', highlight: true });
    expect(updated.subscriptions.defaultTier).toBe('growth');
  });
});

describe('platformSettingsService system settings', () => {
  it('persists and normalises system settings payloads', async () => {
    const updated = await updatePlatformSettings(
      {
        system: {
          site: {
            name: ' Fixnado Control ',
            supportEmail: ' ops@fixnado.test ',
            defaultLocale: ' en-GB ',
            defaultTimezone: ' America/New_York ',
            tagline: ' Powering every job ',
            logoUrl: ' https://cdn.fixnado.test/logo.svg '
          },
          socialLinks: [
            { id: 'twitter', label: ' Twitter ', url: ' https://x.com/fixnado ', handle: '@fixnado' },
            { label: 'Twitter', url: 'https://duplicate.example.com' },
            { label: '', url: 'https://invalid.example.com' }
          ],
          supportLinks: [
            { label: 'Help centre', url: ' https://help.fixnado.test ', type: 'docs' },
            { label: 'Email support', url: 'mailto:support@fixnado.test', id: ' support-email ' }
          ],
          chatwoot: {
            baseUrl: ' https://chat.example.com ',
            websiteToken: ' token123 ',
            inboxIdentifier: ' primary '
          },
          openai: {
            apiKey: ' sk-123 ',
            baseUrl: ' https://openai.fixnado.test ',
            organizationId: ' org-789 ',
            defaultModel: ' gpt-4.1 ',
            byokEnabled: false
          },
          slack: {
            botToken: ' xoxb-456 ',
            signingSecret: ' secret ',
            defaultChannel: ' #ops ',
            byokEnabled: true
          },
          github: {
            appId: ' 987 ',
            clientId: ' client-123 ',
            organization: ' Fixnado '
          },
          googleDrive: {
            clientId: ' drive-client ',
            rootFolderId: ' root-folder '
          },
          storage: {
            provider: ' s3 ',
            accountId: ' acc-123 ',
            bucket: ' fixnado-bucket ',
            useCdn: true
          }
        }
      },
      'ops'
    );

    expect(updated.system.site.name).toBe('Fixnado Control');
    expect(updated.system.site.supportEmail).toBe('ops@fixnado.test');
    expect(updated.system.site.defaultLocale).toBe('en-GB');
    expect(updated.system.site.defaultTimezone).toBe('America/New_York');
    expect(updated.system.site.tagline).toBe('Powering every job');
    expect(updated.system.socialLinks).toHaveLength(1);
    expect(updated.system.socialLinks[0]).toMatchObject({ id: 'twitter', url: 'https://x.com/fixnado' });
    expect(updated.system.supportLinks).toHaveLength(2);
    expect(updated.system.supportLinks[1].id).toBe('support-email');
    expect(updated.system.chatwoot.baseUrl).toBe('https://chat.example.com');
    expect(updated.system.openai.apiKey).toBe('sk-123');
    expect(updated.system.openai.byokEnabled).toBe(false);
    expect(updated.system.slack.byokEnabled).toBe(true);
    expect(updated.system.storage.provider).toBe('s3');
    expect(updated.system.storage.accountId).toBe('acc-123');
    expect(updated.system.storage.useCdn).toBe(true);

    expect(config.system.site.name).toBe('Fixnado Control');
    expect(config.app.name).toBe('Fixnado Control');
    expect(config.integrations.chatwoot.baseUrl).toBe('https://chat.example.com');
    expect(config.integrations.slack.botToken).toBe('xoxb-456');
    expect(config.ai.openai.apiKey).toBe('sk-123');

    const rows = await PlatformSetting.findAll({ where: { key: 'system' }, raw: true });
    expect(rows).toHaveLength(1);
    const stored = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
    expect(stored.site.name).toBe('Fixnado Control');
    expect(stored.supportLinks).toHaveLength(2);
  });
});
