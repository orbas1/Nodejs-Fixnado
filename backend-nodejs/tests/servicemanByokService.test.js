import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sequelize from '../src/config/database.js';
import User from '../src/models/user.js';
import ServicemanByokProfile from '../src/models/servicemanByokProfile.js';
import ServicemanByokConnector from '../src/models/servicemanByokConnector.js';
import ServicemanByokAuditEvent from '../src/models/servicemanByokAuditEvent.js';
import ensureServicemanByokAssociations from '../src/models/associations/servicemanByokAssociations.js';
import {
  getServicemanByokState,
  upsertServicemanByokProfile,
  createServicemanByokConnector,
  updateServicemanByokConnector,
  rotateServicemanByokConnector,
  deleteServicemanByokConnector,
  runServicemanByokDiagnostic,
  searchServicemanByokProfiles
} from '../src/services/servicemanByokService.js';

async function createServiceman(overrides = {}) {
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  return User.create({
    firstName: overrides.firstName ?? 'Jordan',
    lastName: overrides.lastName ?? 'Miles',
    email: overrides.email ?? `serviceman-${uniqueSuffix}@example.com`,
    passwordHash: overrides.passwordHash ?? 'test-password-hash',
    type: overrides.type ?? 'servicemen',
    ...overrides
  });
}

async function resetDatabase() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
}

ensureServicemanByokAssociations();

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

describe('servicemanByokService', () => {
  it('creates a default profile when none exists', async () => {
    const serviceman = await createServiceman();
    const state = await getServicemanByokState({ servicemanId: serviceman.id });

    expect(state.profile).toBeDefined();
    expect(state.profile.userId).toBe(serviceman.id);
    expect(state.profile.defaultProvider).toBe('openai');
    expect(state.connectors).toEqual([]);
    expect(Array.isArray(state.auditTrail)).toBe(true);

    const storedProfile = await ServicemanByokProfile.findOne({ where: { userId: serviceman.id } });
    expect(storedProfile).not.toBeNull();
  });

  it('updates BYOK profile preferences', async () => {
    const serviceman = await createServiceman();
    await getServicemanByokState({ servicemanId: serviceman.id });

    const updated = await upsertServicemanByokProfile({
      servicemanId: serviceman.id,
      payload: {
        displayName: 'North crew BYOK',
        defaultProvider: 'slack',
        defaultEnvironment: 'staging',
        rotationPolicyDays: 45,
        allowSelfProvisioning: true,
        notes: 'Prefer Slack workspace BYOK'
      },
      actorId: serviceman.id
    });

    expect(updated.displayName).toBe('North crew BYOK');
    expect(updated.defaultProvider).toBe('slack');
    expect(updated.defaultEnvironment).toBe('staging');
    expect(updated.rotationPolicyDays).toBe(45);
    expect(updated.allowSelfProvisioning).toBe(true);
    expect(updated.notes).toBe('Prefer Slack workspace BYOK');
  });

  it('supports full connector lifecycle operations', async () => {
    const serviceman = await createServiceman();
    await getServicemanByokState({ servicemanId: serviceman.id });

    const connector = await createServicemanByokConnector({
      servicemanId: serviceman.id,
      payload: {
        displayName: 'OpenAI live key',
        provider: 'openai',
        environment: 'production',
        secret: 'sk-live-123456789',
        scopes: ['completion', 'assistants']
      },
      actorId: serviceman.id
    });

    expect(connector.displayName).toBe('OpenAI live key');
    expect(connector.scopes).toEqual(['completion', 'assistants']);
    expect(connector.secretLastFour).toBe('6789');

    const storedConnector = await ServicemanByokConnector.findByPk(connector.id);
    expect(storedConnector.secretEncrypted).not.toBe('sk-live-123456789');

    const updated = await updateServicemanByokConnector({
      servicemanId: serviceman.id,
      connectorId: connector.id,
      payload: {
        displayName: 'OpenAI staging key',
        environment: 'staging',
        status: 'disabled',
        scopes: ['completion'],
        metadata: { project: 'beta' }
      },
      actorId: serviceman.id
    });

    expect(updated.displayName).toBe('OpenAI staging key');
    expect(updated.environment).toBe('staging');
    expect(updated.status).toBe('disabled');
    expect(updated.scopes).toEqual(['completion']);
    expect(updated.metadata.project).toBe('beta');

    const rotated = await rotateServicemanByokConnector({
      servicemanId: serviceman.id,
      connectorId: connector.id,
      secret: 'sk-rotated-9876',
      actorId: serviceman.id,
      metadata: { reason: 'scheduled_rotation' }
    });

    expect(rotated.secretLastFour).toBe('9876');

    const diagnostic = await runServicemanByokDiagnostic({
      servicemanId: serviceman.id,
      connectorId: connector.id,
      actorId: serviceman.id
    });

    expect(diagnostic.connectorId).toBe(connector.id);
    expect(['passed', 'failed']).toContain(diagnostic.status);

    const removed = await deleteServicemanByokConnector({
      servicemanId: serviceman.id,
      connectorId: connector.id,
      actorId: serviceman.id
    });

    expect(removed.id).toBe(connector.id);
    const missing = await ServicemanByokConnector.findByPk(connector.id);
    expect(missing).toBeNull();

    const auditEvents = await ServicemanByokAuditEvent.findAll({ where: { profileId: removed.profileId } });
    expect(auditEvents.length).toBeGreaterThan(0);
  });

  it('searches BYOK profiles by display name', async () => {
    const alpha = await createServiceman({ firstName: 'Avery', lastName: 'Stone' });
    const beta = await createServiceman({ firstName: 'Jordan', lastName: 'Miles' });

    await upsertServicemanByokProfile({
      servicemanId: alpha.id,
      payload: { displayName: 'Alpha crew BYOK' }
    });
    await upsertServicemanByokProfile({
      servicemanId: beta.id,
      payload: { displayName: 'Metro BYOK workspace' }
    });

    const results = await searchServicemanByokProfiles({ search: 'metro' });
    expect(results).toHaveLength(1);
    expect(results[0].displayName).toBe('Metro BYOK workspace');
  });
});
