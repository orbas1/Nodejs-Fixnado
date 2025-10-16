import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { sequelize, PlatformSetting } = await import('../src/models/index.js');
const {
  getAdminPreferences,
  updateAdminPreferences
} = await import('../src/services/adminPreferencesService.js');

async function resetPreferencesTable() {
  await PlatformSetting.destroy({ where: { key: 'admin_preferences' } });
  await getAdminPreferences({ forceRefresh: true });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await getAdminPreferences({ forceRefresh: true });
});

beforeEach(async () => {
  await resetPreferencesTable();
});

afterAll(async () => {
  await sequelize.close();
});

describe('adminPreferencesService', () => {
  it('returns default preferences and metadata when no row exists', async () => {
    const snapshot = await getAdminPreferences();
    expect(snapshot.preferences.general.platformName).toBe('Fixnado');
    expect(snapshot.preferences.security.requireMfa).toBe(true);
    expect(snapshot.meta.version).toBe(0);
    expect(snapshot.meta.changedSections).toEqual([]);
  });

  it('persists updates and surfaces metadata details', async () => {
    const snapshot = await updateAdminPreferences(
      {
        general: {
          platformName: 'Fixnado Control Centre',
          supportEmail: 'ops@fixnado.com'
        },
        notifications: {
          escalationEmails: ['secops@fixnado.com']
        }
      },
      'ops-admin'
    );

    expect(snapshot.preferences.general.platformName).toBe('Fixnado Control Centre');
    expect(snapshot.preferences.notifications.escalationEmails).toEqual(['secops@fixnado.com']);
    expect(snapshot.meta.updatedBy).toBe('ops-admin');
    expect(snapshot.meta.version).toBe(1);
    expect(snapshot.meta.changedSections).toEqual(['general', 'notifications']);

    const stored = await PlatformSetting.findOne({ where: { key: 'admin_preferences' } });
    expect(stored).not.toBeNull();
    const storedValue = typeof stored.value === 'string' ? JSON.parse(stored.value) : stored.value;
    expect(storedValue.general.platformName).toBe('Fixnado Control Centre');
    expect(storedValue.__meta.version).toBe(1);
  });

  it('rejects invalid email addresses with validation details', async () => {
    await expect(
      updateAdminPreferences(
        {
          general: {
            supportEmail: 'not-an-email'
          }
        },
        'qa-tester'
      )
    ).rejects.toMatchObject({
      name: 'ValidationError',
      details: expect.arrayContaining([
        expect.objectContaining({ field: 'general.supportEmail' })
      ])
    });
  });

  it('increments metadata version sequentially and isolates changed sections', async () => {
    await updateAdminPreferences(
      {
        general: { platformName: 'Fixnado Ops' }
      },
      'ops-admin'
    );

    const second = await updateAdminPreferences(
      {
        security: {
          sessionTimeoutMinutes: 60
        }
      },
      'security-admin'
    );

    expect(second.meta.version).toBe(2);
    expect(second.meta.changedSections).toEqual(['security']);
  });

  it('supports forced refresh after out-of-band updates', async () => {
    await updateAdminPreferences(
      {
        general: { platformName: 'Fixnado Prime' }
      },
      'ops-admin'
    );

    await PlatformSetting.update(
      {
        value: {
          general: { platformName: 'Manual override' }
        },
        updatedBy: 'db-maintenance'
      },
      { where: { key: 'admin_preferences' } }
    );

    const cached = await getAdminPreferences();
    expect(cached.preferences.general.platformName).toBe('Fixnado Prime');

    const refreshed = await getAdminPreferences({ forceRefresh: true });
    expect(refreshed.preferences.general.platformName).toBe('Manual override');
  });
});
