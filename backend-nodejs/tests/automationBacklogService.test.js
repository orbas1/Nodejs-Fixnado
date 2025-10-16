import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sequelize } from '../src/models/index.js';
import {
  createAutomationInitiative,
  listAutomationInitiatives,
  updateAutomationInitiative,
  archiveAutomationInitiative
} from '../src/services/automationBacklogService.js';

function buildPayload(overrides = {}) {
  const now = new Date();
  return {
    name: 'Provider onboarding automation',
    summary:
      'Automate document validation, risk scoring, and welcome actions for new provider companies with human review fallbacks.',
    status: 'pilot',
    stage: 'validation',
    category: 'Provider automation',
    automationType: 'workflow',
    owner: 'Automation PMO',
    sponsor: 'COO',
    squad: 'Studio North',
    readinessScore: 58,
    priority: 'now',
    riskLevel: 'medium',
    targetMetric: 'Reduce onboarding lead time',
    baselineMetric: '72 hours to go-live',
    forecastMetric: '18 hours to go-live',
    estimatedSavings: 125000,
    savingsCurrency: 'GBP',
    expectedLaunchAt: now.toISOString().slice(0, 10),
    nextMilestoneOn: now.toISOString().slice(0, 10),
    lastReviewedAt: now.toISOString().slice(0, 10),
    notes: 'Pilot partners confirmed. Awaiting data migration sign-off.',
    allowedRoles: ['admin', 'operations'],
    dependencies: [{ label: 'Data warehouse sync', status: 'on_track', owner: 'Data platform' }],
    blockers: [{ label: 'Contract approval', status: 'awaiting_signoff', owner: 'Legal' }],
    attachments: [{ label: 'Pilot checklist', url: 'https://example.com/checklist.pdf', type: 'checklist' }],
    images: [{ label: 'Journey map', url: 'https://example.com/journey-map.png' }],
    metadata: { jiraEpic: 'AUT-42' },
    ...overrides
  };
}

describe('automationBacklogService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
  });

  it('creates, lists, updates, and archives initiatives', async () => {
    const created = await createAutomationInitiative({ actorId: 'admin-user', payload: buildPayload() });
    expect(created).toHaveProperty('id');
    expect(created.allowedRoles).toContain('admin');

    const list = await listAutomationInitiatives();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Provider onboarding automation');

    const updated = await updateAutomationInitiative({
      id: created.id,
      actorId: 'ops-user',
      payload: buildPayload({ status: 'delivery', readinessScore: 74, priority: 'next' })
    });

    expect(updated.status).toBe('delivery');
    expect(updated.readinessScore).toBe(74);
    expect(updated.priority).toBe('next');
    expect(updated.updatedBy).toBe('ops-user');

    await archiveAutomationInitiative({ id: created.id, actorId: 'admin-user' });
    const active = await listAutomationInitiatives();
    expect(active).toHaveLength(0);

    const archived = await listAutomationInitiatives({ includeArchived: true });
    expect(archived).toHaveLength(1);
    expect(archived[0].archivedAt).toBeTruthy();
  });

  it('validates payloads and rejects invalid submissions', async () => {
    await expect(
      createAutomationInitiative({ actorId: 'tester', payload: buildPayload({ status: 'invalid' }) })
    ).rejects.toMatchObject({ statusCode: 422 });

    await expect(
      createAutomationInitiative({ actorId: 'tester', payload: buildPayload({ name: '' }) })
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});
