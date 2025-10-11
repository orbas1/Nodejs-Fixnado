import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockConfig = {
  campaigns: {
    analyticsEndpoint: 'https://warehouse.fixnado.test/ingest',
    analyticsApiKey: 'test-key',
    exportIntervalSeconds: 45,
    failedRetryMinutes: 9
  }
};

const requeueFailedAnalyticsExports = vi.fn();
const fetchPendingAnalyticsExports = vi.fn();
const markAnalyticsExportAttempt = vi.fn();

vi.mock('../src/config/index.js', () => ({
  default: mockConfig
}));

vi.mock('../src/services/campaignService.js', () => ({
  fetchPendingAnalyticsExports,
  markAnalyticsExportAttempt,
  requeueFailedAnalyticsExports
}));

const { startCampaignAnalyticsJob } = await import('../src/jobs/campaignAnalyticsJob.js');

const originalFetch = global.fetch;

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockConfig.campaigns.analyticsEndpoint = 'https://warehouse.fixnado.test/ingest';
  global.fetch = vi.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('campaign analytics exporter job', () => {
  it('sends pending exports to the warehouse and marks them as sent', async () => {
    const exportRecord = {
      id: 'exp-1',
      payload: { campaignId: 'cmp-1', metricDate: '2025-10-20' },
      campaignDailyMetric: { campaignId: 'cmp-1' }
    };

    fetchPendingAnalyticsExports.mockResolvedValue([exportRecord]);
    requeueFailedAnalyticsExports.mockResolvedValue();
    markAnalyticsExportAttempt.mockResolvedValue(exportRecord);
    global.fetch.mockResolvedValue({ ok: true, status: 200, text: vi.fn().mockResolvedValue('OK') });

    const logger = { info: vi.fn(), error: vi.fn() };
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    const interval = startCampaignAnalyticsJob(logger);
    await flushPromises();

    expect(requeueFailedAnalyticsExports).toHaveBeenCalledWith(mockConfig.campaigns.failedRetryMinutes);
    expect(fetchPendingAnalyticsExports).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [endpoint, requestInit] = global.fetch.mock.calls[0];
    expect(endpoint).toBe(mockConfig.campaigns.analyticsEndpoint);
    expect(requestInit.method).toBe('POST');
    expect(requestInit.headers).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': mockConfig.campaigns.analyticsApiKey
    });
    expect(requestInit.body).toBe(JSON.stringify(exportRecord.payload));

    expect(markAnalyticsExportAttempt).toHaveBeenCalledWith(exportRecord, expect.objectContaining({ status: 'sent' }));
    expect(logger.info).toHaveBeenCalledWith(
      'campaign-analytics-export-sent',
      expect.objectContaining({ exportId: exportRecord.id })
    );
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), mockConfig.campaigns.exportIntervalSeconds * 1000);

    clearInterval(interval);
    setIntervalSpy.mockRestore();
  });

  it('marks exports as failed when the warehouse returns an error', async () => {
    const exportRecord = {
      id: 'exp-2',
      payload: { campaignId: 'cmp-2', metricDate: '2025-10-20' },
      campaignDailyMetric: { campaignId: 'cmp-2' }
    };

    fetchPendingAnalyticsExports.mockResolvedValue([exportRecord]);
    requeueFailedAnalyticsExports.mockResolvedValue();
    markAnalyticsExportAttempt.mockResolvedValue(exportRecord);
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue('warehouse unavailable')
    });

    const logger = { info: vi.fn(), error: vi.fn() };
    const interval = startCampaignAnalyticsJob(logger);
    await flushPromises();

    expect(requeueFailedAnalyticsExports).toHaveBeenCalledWith(mockConfig.campaigns.failedRetryMinutes);
    expect(fetchPendingAnalyticsExports).toHaveBeenCalledTimes(1);
    expect(markAnalyticsExportAttempt).toHaveBeenCalledWith(
      exportRecord,
      expect.objectContaining({
        status: 'failed',
        error: expect.any(Error)
      })
    );
    const [, markArgs] = markAnalyticsExportAttempt.mock.calls[0];
    expect(markArgs.error.message).toContain('503');

    expect(logger.error).toHaveBeenCalledWith(
      'campaign-analytics-export-error',
      expect.objectContaining({
        exportId: exportRecord.id,
        error: expect.stringContaining('503')
      })
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);

    clearInterval(interval);
  });

  it('logs and records failure when the analytics endpoint is not configured', async () => {
    const exportRecord = {
      id: 'exp-3',
      payload: { campaignId: 'cmp-3', metricDate: '2025-10-20' },
      campaignDailyMetric: { campaignId: 'cmp-3' }
    };

    mockConfig.campaigns.analyticsEndpoint = undefined;
    fetchPendingAnalyticsExports.mockResolvedValue([exportRecord]);
    requeueFailedAnalyticsExports.mockResolvedValue();
    markAnalyticsExportAttempt.mockResolvedValue(exportRecord);

    const logger = { info: vi.fn(), error: vi.fn() };
    const interval = startCampaignAnalyticsJob(logger);
    await flushPromises();

    expect(requeueFailedAnalyticsExports).toHaveBeenCalledWith(mockConfig.campaigns.failedRetryMinutes);
    expect(fetchPendingAnalyticsExports).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(markAnalyticsExportAttempt).toHaveBeenCalledWith(
      exportRecord,
      expect.objectContaining({
        status: 'failed',
        error: expect.any(Error)
      })
    );
    const [, args] = markAnalyticsExportAttempt.mock.calls[0];
    expect(args.error.message).toContain('not configured');

    expect(logger.error).toHaveBeenCalledWith(
      'campaign-analytics-export-error',
      expect.objectContaining({
        exportId: exportRecord.id,
        error: expect.stringContaining('not configured')
      })
    );

    clearInterval(interval);
  });
});
