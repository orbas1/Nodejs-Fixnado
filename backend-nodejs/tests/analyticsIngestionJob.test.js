import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const pipelineConfig = {
  ingestEndpoint: 'https://warehouse.fixnado.test/ingest',
  ingestApiKey: 'test-key',
  batchSize: 2,
  pollIntervalSeconds: 45,
  retentionDays: 365,
  requestTimeoutMs: 5000,
  purgeBatchSize: 100,
  retryScheduleMinutes: [5, 15, 60],
  lookbackHours: 48
};

const ensureBackfillCoverage = vi.fn();
const fetchPendingAnalyticsEvents = vi.fn();
const markEventIngestionFailure = vi.fn();
const markEventIngestionSuccess = vi.fn();
const purgeExpiredAnalyticsEvents = vi.fn();

let startAnalyticsIngestionJob;

const originalFetch = global.fetch;

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  pipelineConfig.ingestEndpoint = 'https://warehouse.fixnado.test/ingest';
  global.fetch = vi.fn();

  vi.doMock('../src/config/index.js', async () => {
    const actual = await vi.importActual('../src/config/index.js');
    return {
      default: {
        ...actual.default,
        analyticsPipeline: pipelineConfig
      }
    };
  });

  vi.doMock('../src/services/analyticsEventService.js', () => ({
    ensureBackfillCoverage,
    fetchPendingAnalyticsEvents,
    markEventIngestionFailure,
    markEventIngestionSuccess,
    purgeExpiredAnalyticsEvents
  }));

  ({ startAnalyticsIngestionJob } = await import('../src/jobs/analyticsIngestionJob.js'));
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('analytics ingestion job', () => {
  it('sends pending events to the warehouse and marks them as ingested', async () => {
    const events = [
      {
        id: 'evt-1',
        domain: 'zones',
        entityType: 'zone',
        eventName: 'zone.created',
        schemaVersion: 1,
        occurredAt: new Date('2025-10-20T10:00:00Z'),
        receivedAt: new Date('2025-10-20T10:01:00Z'),
        metadata: { zoneId: 'zone-1' },
        ingestionAttempts: 0
      },
      {
        id: 'evt-2',
        domain: 'bookings',
        entityType: 'booking',
        eventName: 'booking.created',
        schemaVersion: 1,
        occurredAt: new Date('2025-10-20T11:00:00Z'),
        receivedAt: new Date('2025-10-20T11:01:00Z'),
        metadata: { bookingId: 'booking-1' },
        ingestionAttempts: 1
      }
    ];

    ensureBackfillCoverage.mockResolvedValue(0);
    fetchPendingAnalyticsEvents.mockResolvedValue(events);
    purgeExpiredAnalyticsEvents.mockResolvedValue(0);
    markEventIngestionSuccess.mockResolvedValue();
    global.fetch.mockResolvedValue({ ok: true, status: 200, text: vi.fn().mockResolvedValue('OK') });

    const logger = { info: vi.fn(), error: vi.fn() };
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    const handle = startAnalyticsIngestionJob(logger);
    await flushPromises();

    expect(ensureBackfillCoverage).toHaveBeenCalledWith({ lookbackHours: pipelineConfig.lookbackHours, now: expect.any(Date) });
    expect(fetchPendingAnalyticsEvents).toHaveBeenCalledWith({ limit: pipelineConfig.batchSize, now: expect.any(Date) });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [endpoint, requestInit] = global.fetch.mock.calls[0];
    expect(endpoint).toBe(pipelineConfig.ingestEndpoint);
    expect(requestInit.method).toBe('POST');
    expect(requestInit.headers).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': pipelineConfig.ingestApiKey
    });

    const payload = JSON.parse(requestInit.body);
    expect(payload.dataset).toBe('analytics_events');
    expect(payload.events).toHaveLength(2);
    expect(payload.summary.totalEvents).toBe(2);
    expect(payload.summary.byDomain).toMatchObject({ zones: 1, bookings: 1 });

    expect(markEventIngestionSuccess).toHaveBeenCalledTimes(2);
    expect(markEventIngestionSuccess).toHaveBeenNthCalledWith(1, events[0], { retentionDays: pipelineConfig.retentionDays });
    expect(markEventIngestionSuccess).toHaveBeenNthCalledWith(2, events[1], { retentionDays: pipelineConfig.retentionDays });
    expect(purgeExpiredAnalyticsEvents).toHaveBeenCalledWith({ now: expect.any(Date), batchSize: pipelineConfig.purgeBatchSize });
    expect(logger.info).toHaveBeenCalledWith(
      'analytics-event-batch-sent',
      expect.objectContaining({ count: 2, endpoint: pipelineConfig.ingestEndpoint })
    );

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), pipelineConfig.pollIntervalSeconds * 1000);

    clearInterval(handle);
    setIntervalSpy.mockRestore();
  });

  it('records failures when the warehouse returns an error', async () => {
    const events = [
      {
        id: 'evt-3',
        domain: 'ads',
        entityType: 'campaign',
        eventName: 'ads.campaign.metrics_recorded',
        schemaVersion: 1,
        occurredAt: new Date('2025-10-20T12:00:00Z'),
        receivedAt: new Date('2025-10-20T12:05:00Z'),
        metadata: { campaignId: 'cmp-1' },
        ingestionAttempts: 2
      }
    ];

    ensureBackfillCoverage.mockResolvedValue(0);
    fetchPendingAnalyticsEvents.mockResolvedValue(events);
    purgeExpiredAnalyticsEvents.mockResolvedValue(0);
    markEventIngestionFailure.mockResolvedValue();
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue('warehouse unavailable')
    });

    const logger = { info: vi.fn(), error: vi.fn() };

    const handle = startAnalyticsIngestionJob(logger);
    await flushPromises();

    expect(markEventIngestionFailure).toHaveBeenCalledTimes(1);
    const [eventArg, resultArg] = markEventIngestionFailure.mock.calls[0];
    expect(eventArg).toBe(events[0]);
    expect(resultArg.error).toBeInstanceOf(Error);
    expect(resultArg.error.message).toContain('503');
    expect(resultArg.retryAt).toBeInstanceOf(Date);
    expect(resultArg.retryAt.getTime()).toBeGreaterThan(Date.now());
    expect(logger.error).toHaveBeenCalledWith(
      'analytics-event-ingest-error',
      expect.objectContaining({ eventId: events[0].id, attempts: 3 })
    );

    clearInterval(handle);
  });

  it('fails fast when the ingest endpoint is not configured', async () => {
    const events = [
      {
        id: 'evt-4',
        domain: 'rentals',
        entityType: 'rental_agreement',
        eventName: 'rental.requested',
        schemaVersion: 1,
        occurredAt: new Date('2025-10-20T13:00:00Z'),
        receivedAt: new Date('2025-10-20T13:05:00Z'),
        metadata: { rentalId: 'rent-1' },
        ingestionAttempts: 0
      }
    ];

    pipelineConfig.ingestEndpoint = '';
    ensureBackfillCoverage.mockResolvedValue(0);
    fetchPendingAnalyticsEvents.mockResolvedValue(events);
    purgeExpiredAnalyticsEvents.mockResolvedValue(0);
    markEventIngestionFailure.mockResolvedValue();

    const logger = { info: vi.fn(), error: vi.fn() };

    const handle = startAnalyticsIngestionJob(logger);
    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(markEventIngestionFailure).toHaveBeenCalledWith(
      events[0],
      expect.objectContaining({
        error: expect.any(Error),
        retryAt: expect.any(Date)
      })
    );
    expect(logger.error).toHaveBeenCalledWith(
      'analytics-event-ingest-error',
      expect.objectContaining({ eventId: events[0].id })
    );

    clearInterval(handle);
  });
});
