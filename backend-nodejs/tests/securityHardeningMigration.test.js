import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import sequelize from '../src/config/database.js';
import {
  up as securityHardeningUp,
  down as securityHardeningDown
} from '../src/database/migrations/20250315090000-security-hardening.js';

const queryInterface = sequelize.getQueryInterface();

async function attemptDown() {
  try {
    await securityHardeningDown(queryInterface);
  } catch (error) {
    if (!/does not exist/i.test(error.message) && !/no such table/i.test(error.message)) {
      throw error;
    }
  }
}

describe('20250315090000-security-hardening migration', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await attemptDown();
  });

  it('creates and drops the security hardening tables with indexes intact', async () => {
    await securityHardeningUp(queryInterface, sequelize.constructor);

    const sessionTokens = await queryInterface.describeTable('session_tokens');
    expect(sessionTokens.token_hash).toBeTruthy();
    expect(sessionTokens.expires_at.allowNull).toBe(false);

    const securityEvents = await queryInterface.describeTable('security_audit_events');
    expect(securityEvents.event_type.allowNull).toBe(false);
    expect(securityEvents.status.allowNull).toBe(false);

    const consentEvents = await queryInterface.describeTable('consent_events');
    expect(consentEvents.consent_type.allowNull).toBe(false);
    expect(consentEvents.session_id.allowNull).toBe(false);

    const scamEvents = await queryInterface.describeTable('scam_detection_events');
    expect(scamEvents.risk_score.allowNull).toBe(false);
    expect(['{}', undefined].includes(scamEvents.signals.defaultValue)).toBe(true);

    const consentIndexes = await queryInterface.showIndex('consent_events');
    expect(consentIndexes.some((index) => index.fields.some((field) => field.attribute === 'consent_type'))).toBe(true);

    await securityHardeningDown(queryInterface);

    await expect(queryInterface.describeTable('session_tokens')).rejects.toThrow();
    await expect(queryInterface.describeTable('consent_events')).rejects.toThrow();
  });
});
