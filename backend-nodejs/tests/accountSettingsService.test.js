import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  sequelize,
  User,
  CustomerAccountSetting,
  CustomerNotificationRecipient
} from '../src/models/index.js';
import {
  createNotificationRecipient,
  deleteNotificationRecipient,
  getAccountSettings,
  updateAccountPreferences,
  updateAccountProfile,
  updateAccountSecurity,
  updateNotificationRecipient
} from '../src/services/accountSettingsService.js';

let user;

async function resetDatabase() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await resetDatabase();
  user = await User.create({
    firstName: 'Avery',
    lastName: 'Stone',
    email: 'avery@example.com',
    passwordHash: 'test-hash',
    type: 'user'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('accountSettingsService', () => {
  it('creates default settings snapshot for a new user', async () => {
    const settings = await getAccountSettings(user.id);
    expect(settings.profile.firstName).toBe('Avery');
    expect(settings.profile.email).toBe('avery@example.com');
    expect(settings.preferences.defaultCurrency).toBe('GBP');
    expect(settings.recipients).toHaveLength(0);

    const stored = await CustomerAccountSetting.findOne({ where: { userId: user.id } });
    expect(stored).toBeTruthy();
    expect(stored.timezone).toBe('Europe/London');
  });

  it('updates profile details and persists encrypted contact data', async () => {
    const updated = await updateAccountProfile(user.id, {
      firstName: 'Jordan',
      lastName: 'Miles',
      email: 'jordan@example.com',
      phoneNumber: '+44 7700 900123',
      profileImageUrl: 'https://cdn.fixnado.test/avatar.png'
    });

    expect(updated.profile.firstName).toBe('Jordan');
    expect(updated.profile.lastName).toBe('Miles');
    expect(updated.profile.email).toBe('jordan@example.com');
    expect(updated.profile.phoneNumber).toBe('+44 7700 900123');
    expect(updated.profile.profileImageUrl).toBe('https://cdn.fixnado.test/avatar.png');

    const reloaded = await User.findByPk(user.id);
    expect(reloaded.firstName).toBe('Jordan');
    expect(reloaded.phoneNumber).toBe('+44 7700 900123');
  });

  it('updates preference toggles and quiet hours', async () => {
    const updated = await updateAccountPreferences(user.id, {
      timezone: 'America/New_York',
      locale: 'en-US',
      defaultCurrency: 'USD',
      weeklySummaryEnabled: false,
      dispatchAlertsEnabled: false,
      escrowAlertsEnabled: true,
      conciergeAlertsEnabled: false,
      quietHoursStart: '21:00',
      quietHoursEnd: '07:00'
    });

    expect(updated.preferences.defaultCurrency).toBe('USD');
    expect(updated.preferences.weeklySummaryEnabled).toBe(false);
    expect(updated.preferences.dispatchAlertsEnabled).toBe(false);
    expect(updated.preferences.conciergeAlertsEnabled).toBe(false);
    expect(updated.preferences.quietHoursStart).toBe('21:00');
    expect(updated.preferences.quietHoursEnd).toBe('07:00');

    const stored = await CustomerAccountSetting.findOne({ where: { userId: user.id } });
    expect(stored.timezone).toBe('America/New_York');
    expect(stored.quietHoursStart).toBe('21:00');
  });

  it('toggles security settings', async () => {
    const updated = await updateAccountSecurity(user.id, {
      twoFactorApp: true,
      twoFactorEmail: true
    });

    expect(updated.security.twoFactorApp).toBe(true);
    expect(updated.security.twoFactorEmail).toBe(true);

    const reloaded = await User.findByPk(user.id);
    expect(reloaded.twoFactorApp).toBe(true);
    expect(reloaded.twoFactorEmail).toBe(true);
  });

  it('manages notification recipients with CRUD operations', async () => {
    const created = await createNotificationRecipient(user.id, {
      label: 'Finance desk',
      channel: 'email',
      target: 'finance@example.com',
      role: 'finance',
      enabled: true
    });

    expect(created.id).toBeTruthy();
    expect(created.role).toBe('finance');

    const updated = await updateNotificationRecipient(user.id, created.id, {
      label: 'Finance approver',
      role: 'approver',
      enabled: false
    });

    expect(updated.label).toBe('Finance approver');
    expect(updated.enabled).toBe(false);

    await deleteNotificationRecipient(user.id, created.id);

    const remaining = await CustomerNotificationRecipient.count({ where: { accountSettingId: created.accountSettingId } });
    expect(remaining).toBe(0);
  });
});
