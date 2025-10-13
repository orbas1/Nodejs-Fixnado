import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const raiseAlertMock = vi.fn();
const closeAlertMock = vi.fn();
const isConfiguredMock = vi.fn();

vi.mock('../src/services/opsgenieService.js', () => ({
  raiseAlert: (...args) => raiseAlertMock(...args),
  closeAlert: (...args) => closeAlertMock(...args),
  isConfigured: (...args) => isConfiguredMock(...args)
}));

let evaluateWarehouseFreshness;
let resetWarehouseFreshnessAlertState;

beforeAll(async () => {
  ({ evaluateWarehouseFreshness, resetWarehouseFreshnessAlertState } = await import(
    '../src/jobs/warehouseFreshnessJob.js'
  ));
});

describe('warehouseFreshnessJob', () => {
  const now = new Date('2025-10-20T12:00:00Z');
  const baseConfig = {
    datasetThresholdMinutes: { default: 90, bookings: 30, rentals: 45, disputes: 60, ads: 45, communications: 25, zones: 120 },
    backlogThreshold: 500,
    backlogAgeMinutes: 60,
    failureStreakThreshold: 3,
    maxRunGapMinutes: 20,
    opsgenie: { priority: 'P2', note: 'Check analytics ingest runbook', closeNote: 'Pipeline recovered' }
  };

  let analyticsEventModel;
  let pipelineRunModel;
  let logger;

  beforeEach(() => {
    raiseAlertMock.mockReset();
    closeAlertMock.mockReset();
    isConfiguredMock.mockReset();
    isConfiguredMock.mockReturnValue(true);
    raiseAlertMock.mockResolvedValue(true);
    closeAlertMock.mockResolvedValue(true);

    analyticsEventModel = {
      findOne: vi.fn(),
      count: vi.fn()
    };
    pipelineRunModel = {
      findAll: vi.fn()
    };
    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    resetWarehouseFreshnessAlertState();
  });

  it('raises an OpsGenie alert when a domain exceeds the freshness threshold', async () => {
    const domainIngestTimes = {
      bookings: new Date('2025-10-20T08:45:00Z'),
      rentals: new Date('2025-10-20T11:40:00Z'),
      disputes: new Date('2025-10-20T11:55:00Z'),
      ads: new Date('2025-10-20T11:30:00Z'),
      communications: new Date('2025-10-20T11:50:00Z'),
      zones: new Date('2025-10-20T10:55:00Z')
    };

    analyticsEventModel.findOne.mockImplementation(async (opts) => {
      if (Object.prototype.hasOwnProperty.call(opts.where, 'domain')) {
        const domain = opts.where.domain;
        const value = domainIngestTimes[domain];
        return value ? { ingestedAt: value } : null;
      }
      return null;
    });
    analyticsEventModel.count.mockResolvedValue(50);
    pipelineRunModel.findAll.mockResolvedValue([
      { status: 'success', finishedAt: new Date('2025-10-20T11:55:00Z'), triggeredBy: 'scheduler' }
    ]);

    await evaluateWarehouseFreshness({
      now,
      monitorConfig: baseConfig,
      analyticsEventModel,
      pipelineRunModel,
      logger
    });

    expect(raiseAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ alias: 'analytics-freshness-bookings' }),
      logger
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Warehouse freshness breach detected',
      expect.objectContaining({ alias: 'analytics-freshness-bookings' })
    );
  });

  it('closes an alert when freshness recovers', async () => {
    const domainIngestTimes = {
      bookings: new Date('2025-10-20T08:30:00Z'),
      rentals: new Date('2025-10-20T11:45:00Z'),
      disputes: new Date('2025-10-20T11:55:00Z'),
      ads: new Date('2025-10-20T11:32:00Z'),
      communications: new Date('2025-10-20T11:52:00Z'),
      zones: new Date('2025-10-20T11:20:00Z')
    };

    analyticsEventModel.findOne.mockImplementation(async (opts) => {
      if (Object.prototype.hasOwnProperty.call(opts.where, 'domain')) {
        const domain = opts.where.domain;
        const value = domainIngestTimes[domain];
        return value ? { ingestedAt: value } : null;
      }
      return null;
    });
    analyticsEventModel.count.mockResolvedValue(10);
    pipelineRunModel.findAll.mockResolvedValue([
      { status: 'success', finishedAt: new Date('2025-10-20T11:58:00Z'), triggeredBy: 'scheduler' }
    ]);

    await evaluateWarehouseFreshness({
      now,
      monitorConfig: baseConfig,
      analyticsEventModel,
      pipelineRunModel,
      logger
    });

    expect(raiseAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ alias: 'analytics-freshness-bookings' }),
      logger
    );

    raiseAlertMock.mockClear();
    domainIngestTimes.bookings = new Date('2025-10-20T11:50:00Z');

    await evaluateWarehouseFreshness({
      now,
      monitorConfig: baseConfig,
      analyticsEventModel,
      pipelineRunModel,
      logger
    });

    expect(closeAlertMock).toHaveBeenCalledWith({ alias: 'analytics-freshness-bookings', note: baseConfig.opsgenie.closeNote }, logger);
  });

  it('raises backlog alert when pending queue exceeds thresholds', async () => {
    analyticsEventModel.findOne.mockImplementation(async (opts) => {
      if (Object.prototype.hasOwnProperty.call(opts.where, 'domain')) {
        return { ingestedAt: new Date('2025-10-20T11:55:00Z') };
      }
      return { occurredAt: new Date('2025-10-20T09:00:00Z') };
    });
    analyticsEventModel.count.mockResolvedValue(1200);
    pipelineRunModel.findAll.mockResolvedValue([
      { status: 'success', finishedAt: new Date('2025-10-20T11:57:00Z'), triggeredBy: 'scheduler' }
    ]);

    await evaluateWarehouseFreshness({
      now,
      monitorConfig: baseConfig,
      analyticsEventModel,
      pipelineRunModel,
      logger
    });

    expect(raiseAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ alias: 'analytics-backlog' }),
      logger
    );
  });

  it('raises pipeline alert when failure streak breaches threshold', async () => {
    analyticsEventModel.findOne.mockImplementation(async (opts) => {
      if (Object.prototype.hasOwnProperty.call(opts.where, 'domain')) {
        return { ingestedAt: new Date('2025-10-20T11:45:00Z') };
      }
      return null;
    });
    analyticsEventModel.count.mockResolvedValue(0);
    pipelineRunModel.findAll.mockResolvedValue([
      { status: 'failed', finishedAt: new Date('2025-10-20T11:40:00Z'), triggeredBy: 'scheduler' },
      { status: 'failed', finishedAt: new Date('2025-10-20T11:20:00Z'), triggeredBy: 'scheduler' },
      { status: 'failed', finishedAt: new Date('2025-10-20T11:00:00Z'), triggeredBy: 'manual' }
    ]);

    await evaluateWarehouseFreshness({
      now,
      monitorConfig: baseConfig,
      analyticsEventModel,
      pipelineRunModel,
      logger
    });

    expect(raiseAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ alias: 'analytics-pipeline' }),
      logger
    );
  });

  it('logs and skips OpsGenie calls when integration disabled', async () => {
    isConfiguredMock.mockReturnValue(false);
    raiseAlertMock.mockResolvedValue(false);
    analyticsEventModel.findOne.mockResolvedValue({ ingestedAt: new Date('2025-10-20T08:00:00Z') });
    analyticsEventModel.count.mockResolvedValue(0);
    pipelineRunModel.findAll.mockResolvedValue([]);

    await evaluateWarehouseFreshness({
      now,
      monitorConfig: baseConfig,
      analyticsEventModel,
      pipelineRunModel,
      logger
    });

    expect(logger.warn).toHaveBeenCalledWith(
      'OpsGenie not configured; alert retained for retry',
      expect.objectContaining({ alias: 'analytics-freshness-bookings' })
    );
  });
});
