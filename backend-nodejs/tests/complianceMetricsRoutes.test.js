import request from 'supertest';
import { DateTime } from 'luxon';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const configModule = await import('../src/config/index.js');
const config = configModule.default;
const { default: app } = await import('../src/app.js');
const { sequelize, Region } = await import('../src/models/index.js');
const { submitDataSubjectRequest } = await import('../src/services/dataGovernanceService.js');

async function seedRegions() {
  await Region.bulkCreate(
    [
      { code: 'GB', name: 'United Kingdom', residencyTier: 'strict' },
      { code: 'IE', name: 'Ireland', residencyTier: 'standard' }
    ],
    { ignoreDuplicates: true }
  );
}

describe('GET /api/v1/compliance/data-requests/metrics', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T08:00:00Z'));
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    vi.useRealTimers();
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
    await seedRegions();
  });

  it('returns SLA metrics, backlog breakdown, and oldest pending record metadata', async () => {
    const now = DateTime.fromISO('2025-01-01T08:00:00Z');

    const overdue = await submitDataSubjectRequest({
      subjectEmail: 'overdue@example.com',
      requestType: 'access',
      regionCode: 'GB'
    });
    await overdue.update({
      status: 'received',
      requestedAt: now.minus({ days: config.dataGovernance.requestSlaDays + 2 }).toJSDate(),
      dueAt: now.minus({ days: 2 }).toJSDate()
    });

    const dueSoon = await submitDataSubjectRequest({
      subjectEmail: 'due.soon@example.com',
      requestType: 'erasure',
      regionCode: 'GB'
    });
    await dueSoon.update({
      status: 'in_progress',
      dueAt: now.plus({ days: Math.min(config.dataGovernance.dueSoonWindowDays, 4) }).toJSDate()
    });

    const completed = await submitDataSubjectRequest({
      subjectEmail: 'complete@example.com',
      requestType: 'rectification',
      regionCode: 'IE'
    });
    await completed.update({
      status: 'completed',
      processedAt: now.minus({ days: 1 }).toJSDate(),
      requestedAt: now.minus({ days: 6 }).toJSDate(),
      dueAt: now.minus({ days: 6 }).plus({ days: config.dataGovernance.requestSlaDays }).toJSDate()
    });

    const response = await request(app).get('/api/v1/compliance/data-requests/metrics');

    expect(response.status).toBe(200);
    expect(response.body.totalRequests).toBe(3);
    expect(response.body.statusBreakdown).toMatchObject({
      completed: 1,
      received: 1,
      in_progress: 1
    });
    expect(response.body.overdueCount).toBe(1);
    expect(response.body.dueSoonCount).toBe(1);
    expect(response.body.dueSoonWindowDays).toBe(config.dataGovernance.dueSoonWindowDays);
    expect(response.body.oldestPending.id).toBe(overdue.id);
    expect(response.body.averageCompletionMinutes).toBeGreaterThan(0);
  });

  it('applies filters passed via query string', async () => {
    await submitDataSubjectRequest({
      subjectEmail: 'gb@example.com',
      requestType: 'access',
      regionCode: 'GB'
    });
    const irish = await submitDataSubjectRequest({
      subjectEmail: 'ie@example.com',
      requestType: 'erasure',
      regionCode: 'IE'
    });
    await irish.update({ status: 'completed' });

    const response = await request(app)
      .get('/api/v1/compliance/data-requests/metrics')
      .query({ regionCode: 'IE', status: 'completed' });

    expect(response.status).toBe(200);
    expect(response.body.totalRequests).toBe(1);
    expect(response.body.statusBreakdown.completed).toBe(1);
    expect(response.body.statusBreakdown.received ?? 0).toBe(0);
    expect(response.body.statusBreakdown.in_progress ?? 0).toBe(0);
    expect(response.body.statusBreakdown.rejected ?? 0).toBe(0);
    expect(response.body.oldestPending).toBeNull();
  });
});
