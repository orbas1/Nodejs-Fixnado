import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTime } from 'luxon';

const configModule = await import('../src/config/index.js');
const config = configModule.default;
const {
  submitDataSubjectRequest,
  listDataSubjectRequests,
  calculateDataSubjectRequestMetrics
} = await import('../src/services/dataGovernanceService.js');
const { sequelize, Region } = await import('../src/models/index.js');

async function seedRegions() {
  await Region.bulkCreate(
    [
      { code: 'GB', name: 'United Kingdom', residencyTier: 'strict' },
      { code: 'IE', name: 'Ireland', residencyTier: 'standard' }
    ],
    { ignoreDuplicates: true }
  );
}

describe('dataGovernanceService', () => {
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

  it('normalises email addresses and sets due dates when submitting requests', async () => {
    const request = await submitDataSubjectRequest({
      subjectEmail: 'CaseSensitive@Example.com',
      requestType: 'access',
      justification: 'GDPR ticket',
      regionCode: 'IE'
    });

    expect(request.subjectEmail).toBe('casesensitive@example.com');
    const expectedDue = DateTime.fromISO('2025-01-01T08:00:00Z').plus({ days: config.dataGovernance.requestSlaDays });
    expect(DateTime.fromJSDate(request.dueAt).toISO()).toBe(expectedDue.toISO());
    expect(request.metadata.channel).toBe('web');
  });

  it('filters requests by type and region', async () => {
    await submitDataSubjectRequest({
      subjectEmail: 'alpha@example.com',
      requestType: 'access',
      regionCode: 'GB'
    });
    await submitDataSubjectRequest({
      subjectEmail: 'beta@example.com',
      requestType: 'erasure',
      regionCode: 'IE'
    });

    const filtered = await listDataSubjectRequests({ requestType: 'erasure', regionCode: 'IE' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].subjectEmail).toBe('beta@example.com');

    await expect(listDataSubjectRequests({ regionCode: 'ZZ' })).rejects.toThrow('Unknown region code: ZZ');
  });

  it('calculates backlog, SLA exposure, and completion metrics', async () => {
    const now = DateTime.fromISO('2025-01-01T08:00:00Z');

    const overdue = await submitDataSubjectRequest({
      subjectEmail: 'overdue@example.com',
      requestType: 'access',
      regionCode: 'GB'
    });
    await overdue.update({
      status: 'received',
      requestedAt: now.minus({ days: config.dataGovernance.requestSlaDays + 3 }).toJSDate(),
      dueAt: now.minus({ days: 3 }).toJSDate()
    });

    const dueSoon = await submitDataSubjectRequest({
      subjectEmail: 'due.soon@example.com',
      requestType: 'erasure',
      regionCode: 'GB'
    });
    await dueSoon.update({
      status: 'in_progress',
      dueAt: now.plus({ days: Math.min(config.dataGovernance.dueSoonWindowDays, 3) }).toJSDate()
    });

    const completed = await submitDataSubjectRequest({
      subjectEmail: 'completed@example.com',
      requestType: 'rectification',
      regionCode: 'IE'
    });
    const completedRequestedAt = now.minus({ days: 10 });
    await completed.update({
      status: 'completed',
      requestedAt: completedRequestedAt.toJSDate(),
      processedAt: completedRequestedAt.plus({ days: 2 }).toJSDate(),
      dueAt: completedRequestedAt.plus({ days: config.dataGovernance.requestSlaDays }).toJSDate()
    });

    const metrics = await calculateDataSubjectRequestMetrics();

    expect(metrics.totalRequests).toBe(3);
    expect(metrics.statusBreakdown.completed).toBe(1);
    expect(metrics.statusBreakdown.received).toBe(1);
    expect(metrics.statusBreakdown.in_progress).toBe(1);
    expect(metrics.overdueCount).toBe(1);
    expect(metrics.dueSoonCount).toBe(1);
    expect(metrics.oldestPending?.id).toBe(overdue.id);
    expect(metrics.completionRate).toBeCloseTo(1 / 3, 5);
    expect(metrics.averageCompletionMinutes).toBeCloseTo(2 * 24 * 60, 5);

    const metricsForIreland = await calculateDataSubjectRequestMetrics({ regionCode: 'IE' });
    expect(metricsForIreland.totalRequests).toBe(1);
    expect(metricsForIreland.statusBreakdown.completed).toBe(1);
  });
});
