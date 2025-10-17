import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const modelsModule = await import('../src/models/index.js');
const servicesModule = await import('../src/services/providerByokService.js');

const { sequelize, Company, ProviderByokIntegration, ProviderByokAuditLog } = modelsModule;
const {
  saveProviderByokIntegration,
  testProviderByokIntegration,
  listProviderByokAuditLogs
} = servicesModule;

let companyId;

async function createCompanyFixture() {
  const company = await Company.create({
    userId: '00000000-0000-4000-8000-000000000001',
    legalStructure: 'llc',
    serviceRegions: '[]',
    marketplaceIntent: 'services',
    verified: true,
    insuredSellerStatus: 'approved',
    insuredSellerBadgeVisible: true,
    complianceScore: 95
  });

  return company.id;
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
  companyId = await createCompanyFixture();
});

beforeEach(async () => {
  await ProviderByokAuditLog.destroy({ where: {} });
  await ProviderByokIntegration.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('providerByokService', () => {
  it('creates a BYOK integration with sanitised defaults and records an audit trail', async () => {
    const integration = await saveProviderByokIntegration({
      companyId,
      integration: 'openai',
      displayName: '   ',
      status: 'ACTIVE',
      settings: {
        rotationIntervalDays: '45',
        allowedRoles: ['provider_admin', 'PROVIDER_MANAGER'],
        attachments: [' https://cdn.fixnado.com/runbook.pdf ']
      },
      credentials: {
        apiKey: 'super-secret',
        organizationId: 'org-test'
      },
      metadata: {
        notes: '  ensure dual control  ',
        supportContacts: ['Alice Control <alice@example.com>'],
        supportingMedia: ['https://cdn.fixnado.com/evidence.png']
      },
      actor: { id: 'actor-1', type: 'user' }
    });

    expect(integration.integration).toBe('openai');
    expect(integration.displayName).toBe('OpenAI BYOK');
    expect(integration.status).toBe('active');
    expect(integration.lastRotatedAt).toBeTruthy();
    expect(integration.hasCredentials).toBe(true);
    expect(integration.settings.rotationIntervalDays).toBe(45);
    expect(integration.settings.allowedRoles).toEqual(
      expect.arrayContaining(['provider_admin', 'provider_manager'])
    );
    expect(integration.settings.attachments[0]).toMatchObject({
      url: 'https://cdn.fixnado.com/runbook.pdf'
    });
    expect(integration.metadata.supportContacts[0]).toMatchObject({ name: expect.any(String) });

    const logs = await listProviderByokAuditLogs({ companyId, integrationId: integration.id, limit: 10 });
    expect(logs).toHaveLength(1);
    expect(logs[0].eventType).toBe('integration.created');
    expect(logs[0].detail).toMatchObject({ status: 'active', hasCredentials: true });
  });

  it('rotates credentials during update and notes the change in the audit log', async () => {
    const created = await saveProviderByokIntegration({
      companyId,
      integration: 'webhook',
      displayName: 'Webhook relay',
      status: 'inactive',
      settings: { targetUrl: 'https://hooks.fixnado.com/key-relay' },
      metadata: { notes: 'initial rollout' },
      actor: { id: 'actor-setup', type: 'system' }
    });

    const updated = await saveProviderByokIntegration({
      companyId,
      integrationId: created.id,
      displayName: 'Webhook relay',
      status: 'suspended',
      settings: { targetUrl: 'https://hooks.fixnado.com/key-relay', rotationIntervalDays: 30 },
      credentials: { sharedSecret: 'rotated-secret', basicAuthUser: 'svc', basicAuthPassword: 'rotated' },
      metadata: { notes: 'rotation performed' },
      actor: { id: 'actor-2', type: 'automation' }
    });

    expect(updated.status).toBe('suspended');
    expect(updated.lastRotatedBy).toBe('actor-2');
    expect(updated.rotationDueAt).toBeTruthy();
    expect(updated.hasCredentials).toBe(true);

    const logs = await listProviderByokAuditLogs({ companyId, integrationId: created.id, limit: 10 });
    expect(logs.map((entry) => entry.eventType)).toEqual(
      expect.arrayContaining(['integration.created', 'integration.rotated'])
    );
    const rotationLog = logs.find((entry) => entry.eventType === 'integration.rotated');
    expect(rotationLog.detail).toMatchObject({ rotated: true, status: 'suspended' });
  });

  it('fails validation when credentials are missing and records the test result', async () => {
    const created = await saveProviderByokIntegration({
      companyId,
      integration: 'slack',
      displayName: 'Slack bridge',
      status: 'active',
      settings: { defaultChannel: 'ops', teamId: 'T123' },
      actor: { id: 'actor-3', type: 'user' }
    });

    const testResult = await testProviderByokIntegration({
      companyId,
      integrationId: created.id,
      actor: { id: 'actor-3', type: 'user' }
    });

    expect(testResult.result.status).toBe('failed');
    expect(testResult.result.message).toMatch(/missing/i);
    expect(testResult.integration.lastTestStatus).toBe('failed');

    const logs = await listProviderByokAuditLogs({ companyId, integrationId: created.id, limit: 10 });
    const testLog = logs.find((entry) => entry.eventType === 'integration.tested');
    expect(testLog).toBeTruthy();
    expect(testLog.detail).toMatchObject({ status: 'failed' });
  });
});
