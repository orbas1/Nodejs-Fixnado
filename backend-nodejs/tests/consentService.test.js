import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sequelize from '../src/config/database.js';
import { ConsentEvent, User } from '../src/models/index.js';
import { getLatestConsent, listConsentHistory, recordConsent } from '../src/services/consentService.js';

const USER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

async function ensureUser() {
  const [user] = await User.findOrCreate({
    where: { id: USER_ID },
    defaults: {
      id: USER_ID,
      firstName: 'Consent',
      lastName: 'Tester',
      email: 'consent.tester@example.com',
      passwordHash: 'hash',
      type: 'user'
    }
  });
  return user;
}

describe('consentService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await ensureUser();
  });

  beforeEach(async () => {
    await ConsentEvent.destroy({ where: {} });
  });

  it('records consent decisions with metadata sanitisation', async () => {
    await recordConsent({
      userId: USER_ID,
      sessionId: 'session-one',
      consentType: 'cookie_banner',
      consentVersion: '2025.02',
      granted: true,
      ipAddress: '198.51.100.77',
      userAgent: 'Mozilla/5.0',
      metadata: { choice: 'accept_all', nested: { dark: true } }
    });

    const events = await ConsentEvent.findAll();
    expect(events).toHaveLength(1);
    expect(events[0].metadata).toEqual({ choice: 'accept_all', nested: { dark: true } });
    expect(events[0].sessionId).toBe('session-one');
    expect(events[0].granted).toBe(true);
  });

  it('returns the latest consent prioritising recent records and user linkage', async () => {
    await recordConsent({
      userId: USER_ID,
      sessionId: 'session-two',
      consentType: 'privacy_policy',
      consentVersion: '2025.02',
      granted: false
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await recordConsent({
      sessionId: 'session-two',
      consentType: 'privacy_policy',
      consentVersion: '2025.03',
      granted: true
    });

    const latest = await getLatestConsent({ userId: USER_ID, sessionId: 'session-two', consentType: 'privacy_policy' });
    expect(latest).toBeTruthy();
    expect(latest.consentVersion).toBe('2025.03');
    expect(latest.granted).toBe(true);
  });

  it('lists consent history with safe limits', async () => {
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await recordConsent({
        sessionId: 'session-history',
        consentType: 'cookie_banner',
        consentVersion: `2025.0${i + 1}`,
        granted: i % 2 === 0
      });
    }

    const history = await listConsentHistory({ sessionId: 'session-history', limit: 2 });
    expect(history).toHaveLength(2);
    expect(history[0].consentVersion).toBe('2025.03');
    expect(history[1].consentVersion).toBe('2025.02');
  });
});
