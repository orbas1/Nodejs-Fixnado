import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const configModule = await import('../src/config/index.js');
const config = configModule.default;
const { sequelize, PlatformSetting } = await import('../src/models/index.js');
const {
  getPlatformSettings,
  updatePlatformSettings
} = await import('../src/services/platformSettingsService.js');

const ORIGINAL_FINANCE = JSON.parse(JSON.stringify(config.finance));

async function resetDatabase() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  await PlatformSetting.destroy({ where: {} });
}

function resetFinanceConfig() {
  config.finance = JSON.parse(JSON.stringify(ORIGINAL_FINANCE));
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await getPlatformSettings({ forceRefresh: true });
});

beforeEach(async () => {
  await resetDatabase();
  resetFinanceConfig();
  await getPlatformSettings({ forceRefresh: true });
});

afterAll(async () => {
  await sequelize.close();
  resetFinanceConfig();
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
        }
      }
    }, 'finance');

    expect(updated.commissions.baseRate).toBeCloseTo(0.18, 5);
    expect(updated.commissions.customRates['scheduled:high']).toBeCloseTo(0.25, 5);
    expect(config.finance.commissionRates.default).toBeCloseTo(0.18, 5);
    expect(config.finance.commissionRates['scheduled:high']).toBeCloseTo(0.25, 5);

    const cached = await getPlatformSettings();
    expect(cached.commissions.baseRate).toBeCloseTo(0.18, 5);
    expect(cached.commissions.customRates['scheduled:high']).toBeCloseTo(0.25, 5);
  });
});
