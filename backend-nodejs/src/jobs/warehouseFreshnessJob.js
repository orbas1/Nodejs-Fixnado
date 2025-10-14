import { Op } from 'sequelize';
import config from '../config/index.js';
import { AnalyticsEvent, AnalyticsPipelineRun } from '../models/index.js';
import {
  raiseAlert as raiseOpsgenieAlert,
  closeAlert as closeOpsgenieAlert,
  isConfigured as isOpsgenieConfigured
} from '../services/opsgenieService.js';

const DEFAULT_DOMAINS = ['zones', 'bookings', 'rentals', 'disputes', 'ads', 'communications'];
const activeAlerts = new Map();

function getMonitorConfig() {
  return config.monitoring?.warehouseFreshness || null;
}

function minutesBetween(now, then) {
  if (!then) {
    return null;
  }
  const diff = now.getTime() - then.getTime();
  return diff <= 0 ? 0 : Math.round(diff / 60000);
}

function computeThreshold(thresholds, key) {
  const value = thresholds?.[key];
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  if (Number.isFinite(thresholds?.default) && thresholds.default > 0) {
    return thresholds.default;
  }
  return 120;
}

async function syncAlertState({
  alias,
  shouldAlert,
  message,
  description,
  tags,
  details,
  priority,
  logger,
  monitorConfig
}) {
  const isActive = activeAlerts.get(alias) === true;
  const opsgenieConfigured = isOpsgenieConfigured();

  if (shouldAlert) {
    if (!isActive) {
      logger.warn('Warehouse freshness breach detected', { alias, details });
      const raised = await raiseOpsgenieAlert(
        {
          alias,
          message,
          description,
          priority,
          tags,
          details,
          note: monitorConfig?.opsgenie?.note
        },
        logger
      );
      if (raised) {
        activeAlerts.set(alias, true);
      } else if (!opsgenieConfigured) {
        logger.warn('OpsGenie not configured; alert retained for retry', { alias });
      }
    }
  } else if (isActive) {
    logger.info('Warehouse freshness breach resolved', { alias, details });
    const closed = await closeOpsgenieAlert(
      { alias, note: monitorConfig?.opsgenie?.closeNote },
      logger
    );
    if (closed) {
      activeAlerts.delete(alias);
    }
  }
}

export function resetWarehouseFreshnessAlertState() {
  activeAlerts.clear();
}

export async function evaluateWarehouseFreshness({
  logger = console,
  now = new Date(),
  monitorConfig = getMonitorConfig(),
  analyticsEventModel = AnalyticsEvent,
  pipelineRunModel = AnalyticsPipelineRun
} = {}) {
  if (!monitorConfig) {
    logger.info('Warehouse freshness monitoring disabled: no configuration detected');
    return null;
  }

  const thresholds = monitorConfig.datasetThresholdMinutes || {};
  const domains = Array.from(new Set([...DEFAULT_DOMAINS, ...Object.keys(thresholds)]));
  const priority = monitorConfig?.opsgenie?.priority;

  const domainResults = {};
  for (const domain of domains) {
    const latest = await analyticsEventModel.findOne({
      where: {
        domain,
        ingestedAt: { [Op.not]: null }
      },
      attributes: ['ingestedAt'],
      order: [['ingested_at', 'DESC']]
    });

    const ingestedAt = latest?.ingestedAt ? new Date(latest.ingestedAt) : null;
    const staleMinutes = minutesBetween(now, ingestedAt);
    const threshold = computeThreshold(thresholds, domain);
    const breach = ingestedAt ? staleMinutes > threshold : true;

    domainResults[domain] = {
      lastIngestedAt: ingestedAt ? ingestedAt.toISOString() : null,
      staleMinutes,
      thresholdMinutes: threshold,
      status: breach ? 'breach' : 'ok'
    };

    await syncAlertState({
      alias: `analytics-freshness-${domain}`,
      shouldAlert: breach,
      message: `Analytics ${domain} feed is stale`,
      description: ingestedAt
        ? `Latest ingested event is ${staleMinutes} minutes old (threshold ${threshold}).`
        : 'No ingested events recorded for this dataset yet.',
      tags: ['freshness', domain],
      details: {
        domain,
        thresholdMinutes: threshold,
        staleMinutes,
        lastIngestedAt: ingestedAt ? ingestedAt.toISOString() : null
      },
      priority,
      logger,
      monitorConfig
    });
  }

  const pendingCount = await analyticsEventModel.count({ where: { ingestedAt: null } });
  let oldestPendingAt = null;
  if (pendingCount > 0) {
    const pendingRecord = await analyticsEventModel.findOne({
      where: { ingestedAt: null },
      attributes: ['occurredAt'],
      order: [['occurred_at', 'ASC']]
    });
    oldestPendingAt = pendingRecord?.occurredAt ? new Date(pendingRecord.occurredAt) : null;
  }

  const backlogAge = minutesBetween(now, oldestPendingAt);
  const backlogThreshold = Math.max(monitorConfig.backlogThreshold ?? 0, 0);
  const backlogAgeThreshold = Math.max(monitorConfig.backlogAgeMinutes ?? 0, 0);
  const backlogBreach =
    pendingCount > backlogThreshold || (Number.isFinite(backlogAge) && backlogAge > backlogAgeThreshold);

  const backlogSummary = {
    pendingCount,
    thresholdCount: backlogThreshold,
    oldestPendingAt: oldestPendingAt ? oldestPendingAt.toISOString() : null,
    oldestPendingAgeMinutes: backlogAge,
    thresholdAgeMinutes: backlogAgeThreshold,
    status: backlogBreach ? 'breach' : 'ok'
  };

  await syncAlertState({
    alias: 'analytics-backlog',
    shouldAlert: backlogBreach,
    message: 'Analytics ingestion backlog exceeds threshold',
    description: backlogBreach
      ? `Pending events: ${pendingCount} (threshold ${backlogThreshold}), oldest pending age: ${
          Number.isFinite(backlogAge) ? `${backlogAge} minutes` : 'unknown'
        }.`
      : 'Analytics backlog cleared within thresholds.',
    tags: ['freshness', 'backlog'],
    details: {
      pendingCount,
      backlogThreshold,
      backlogAge,
      backlogAgeThreshold
    },
    priority,
    logger,
    monitorConfig
  });

  const failureThreshold = Math.max(monitorConfig.failureStreakThreshold ?? 3, 1);
  const recentRuns = await pipelineRunModel.findAll({
    order: [['startedAt', 'DESC']],
    limit: Math.max(failureThreshold, 5)
  });

  let failureStreak = 0;
  for (const run of recentRuns) {
    if (run.status === 'failed') {
      failureStreak += 1;
    } else {
      break;
    }
  }

  const latestRun = recentRuns[0] || null;
  const latestFinishedAt = latestRun?.finishedAt ? new Date(latestRun.finishedAt) : latestRun?.startedAt ? new Date(latestRun.startedAt) : null;
  const runGapMinutes = minutesBetween(now, latestFinishedAt);
  const runGapThreshold = Math.max(monitorConfig.maxRunGapMinutes ?? 0, 0);
  const pipelineBreach =
    failureStreak >= failureThreshold ||
    (!latestRun && failureThreshold > 0) ||
    (Number.isFinite(runGapMinutes) && runGapMinutes > runGapThreshold);

  const pipelineSummary = {
    failureStreak,
    failureThreshold,
    lastRunStatus: latestRun?.status || null,
    lastRunFinishedAt: latestFinishedAt ? latestFinishedAt.toISOString() : null,
    lastRunTrigger: latestRun?.triggeredBy || null,
    runGapMinutes,
    runGapThresholdMinutes: runGapThreshold,
    status: pipelineBreach ? 'breach' : 'ok'
  };

  await syncAlertState({
    alias: 'analytics-pipeline',
    shouldAlert: pipelineBreach,
    message: 'Analytics ingestion pipeline requires attention',
    description: pipelineBreach
      ? `Failure streak ${failureStreak}/${failureThreshold}, last run gap ${
          Number.isFinite(runGapMinutes) ? `${runGapMinutes} minutes` : 'unknown'
        } (threshold ${runGapThreshold}).`
      : 'Analytics pipeline operating within thresholds.',
    tags: ['freshness', 'pipeline'],
    details: pipelineSummary,
    priority,
    logger,
    monitorConfig
  });

  const summary = {
    timestamp: now.toISOString(),
    domains: domainResults,
    backlog: backlogSummary,
    pipeline: pipelineSummary
  };

  logger.info('Warehouse freshness evaluation complete', summary);
  return summary;
}

export function startWarehouseFreshnessJob(logger = console) {
  const monitorConfig = getMonitorConfig();
  if (!monitorConfig) {
    logger.info('Warehouse freshness job not started: configuration missing');
    return null;
  }

  const intervalMinutes = Math.max(monitorConfig.pollIntervalMinutes ?? 0, 0);
  if (intervalMinutes <= 0) {
    logger.info('Warehouse freshness job not started: poll interval disabled');
    return null;
  }

  const run = () => {
    evaluateWarehouseFreshness({ logger, monitorConfig }).catch((error) => {
      logger.error('Warehouse freshness evaluation failed', error);
    });
  };

  run();
  const handle = setInterval(run, intervalMinutes * 60 * 1000);
  if (typeof handle.unref === 'function') {
    handle.unref();
  }

  return {
    intervalMinutes,
    stop() {
      clearInterval(handle);
    }
  };
}

export default {
  startWarehouseFreshnessJob,
  evaluateWarehouseFreshness,
  resetWarehouseFreshnessAlertState
};
