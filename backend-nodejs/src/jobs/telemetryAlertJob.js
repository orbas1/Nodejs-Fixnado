import https from 'node:https';
import { URL } from 'node:url';
import config from '../config/index.js';
import { summariseUiPreferenceEvents } from '../services/telemetryService.js';
import { UiPreferenceTelemetrySnapshot } from '../models/index.js';

const {
  slackWebhookUrl,
  evaluationRangeHours,
  staleMinutesThreshold,
  emoShareThreshold,
  pollIntervalMinutes,
  repeatAlertMinutes,
  minimumEventsForShare
} = config.telemetry;

const alertState = {
  staleness: { active: false, lastSentAt: 0 },
  emoShare: { active: false, lastSentAt: 0 }
};

let snapshotTableReadyPromise = null;

function minutesBetween(later, earlier) {
  return Math.round((later.getTime() - earlier.getTime()) / 60000);
}

function mapRangeKey(hours) {
  if (hours === 24) {
    return '1d';
  }

  if (hours === 24 * 7) {
    return '7d';
  }

  if (hours === 24 * 30) {
    return '30d';
  }

  return `${hours}h`;
}

function determineLeadingTheme(themeBreakdown) {
  if (!Array.isArray(themeBreakdown) || themeBreakdown.length === 0) {
    return null;
  }

  const [leader] = themeBreakdown;
  if (!leader || typeof leader.count !== 'number') {
    return null;
  }

  return leader;
}

function resolveSnapshotTable(logger) {
  if (!snapshotTableReadyPromise) {
    snapshotTableReadyPromise = UiPreferenceTelemetrySnapshot.sync().catch((error) => {
      logger.error('Failed to ensure telemetry snapshot table exists', error);
      snapshotTableReadyPromise = null;
      throw error;
    });
  }

  return snapshotTableReadyPromise;
}

function formatPercentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatStalenessMinutes(value) {
  if (!Number.isFinite(value)) {
    return 'no events recorded in window';
  }

  return `${value} minutes`;
}

function postSlackMessage(payload, logger) {
  return new Promise((resolve, reject) => {
    const url = new URL(slackWebhookUrl);
    const data = JSON.stringify(payload);

    const request = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve();
          } else {
            const body = Buffer.concat(chunks).toString('utf8');
            reject(new Error(`Slack webhook responded with ${response.statusCode}: ${body}`));
          }
        });
      }
    );

    request.on('error', reject);
    request.write(data);
    request.end();
  }).catch((error) => {
    logger.error('Unable to deliver telemetry alert to Slack', error);
  });
}

function buildRunbookFooter() {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: 'Runbook: docs/telemetry/ui-preference-dashboard.md'
      }
    ]
  };
}

function evaluateAlertState(key, shouldAlert, now) {
  const state = alertState[key];
  const nowTs = now.getTime();
  const repeatWindowMs = repeatAlertMinutes * 60 * 1000;

  if (shouldAlert) {
    if (!state.active || nowTs - state.lastSentAt >= repeatWindowMs) {
      state.active = true;
      state.lastSentAt = nowTs;
      return 'alert';
    }

    return 'skip';
  }

  if (state.active) {
    state.active = false;
    state.lastSentAt = nowTs;
    return 'recovery';
  }

  return 'skip';
}

async function persistSnapshot(rangeKey, summary, evaluatedAt, logger) {
  try {
    await resolveSnapshotTable(logger);
    const totalEvents = summary.totals.events;
    const leadingTheme = determineLeadingTheme(summary.breakdown.theme);
    const leadingThemeCount = leadingTheme ? Number(leadingTheme.count) : 0;
    const leadingThemeKey = leadingTheme ? leadingTheme.key : null;
    const emoEntry = summary.breakdown.theme.find((entry) => entry.key === 'emo');
    const emoShare = totalEvents > 0 && emoEntry ? emoEntry.count / totalEvents : 0;

    const payload = {
      ...summary,
      evaluatedAt: evaluatedAt.toISOString(),
      rangeKey
    };

    await UiPreferenceTelemetrySnapshot.create({
      rangeKey,
      rangeStart: new Date(summary.range.start),
      rangeEnd: new Date(summary.range.end),
      tenantId: summary.range.tenantId,
      events: totalEvents,
      emoShare,
      leadingTheme: leadingThemeKey,
      leadingThemeShare: totalEvents > 0 ? leadingThemeCount / totalEvents : 0,
      staleMinutes: summary.latestEventAt ? minutesBetween(evaluatedAt, new Date(summary.latestEventAt)) : null,
      payload
    });
  } catch (error) {
    logger.error('Failed to persist telemetry summary snapshot', error);
  }
}

function buildStaleAlertBlocks(latestEventAt, staleMinutes) {
  const lastEventText = latestEventAt
    ? new Date(latestEventAt).toISOString()
    : 'no telemetry events captured in window';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *UI preference telemetry is stale (${formatStalenessMinutes(staleMinutes)} since last event).*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Latest event observed at: \`${lastEventText}\`\nThreshold: ${staleMinutesThreshold} minutes`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Follow runbook steps: validate Theme Studio beacon, inspect ingestion API, confirm queue processing.'
      }
    },
    buildRunbookFooter()
  ];
}

function buildStaleRecoveryBlocks(latestEventAt, staleMinutes) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:white_check_mark: *Telemetry ingestion recovered*. Latest event at \`${new Date(latestEventAt).toISOString()}\` (${formatStalenessMinutes(staleMinutes)} since capture).`
      }
    },
    buildRunbookFooter()
  ];
}

function buildEmoShareAlertBlocks(totalEvents, emoShare, leadingTheme) {
  const leaderText = leadingTheme
    ? `Leading theme: *${leadingTheme.key}* (${formatPercentage(leadingTheme.count / totalEvents)})`
    : 'No leading theme captured.';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *Emo theme adoption dropped to ${formatPercentage(emoShare)}.*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Events analysed: *${totalEvents}*\nThreshold: ${formatPercentage(emoShareThreshold)} minimum\n${leaderText}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Coordinate with marketing/legal for campaign adjustments; validate Theme Studio presets and promotion banners.'
      }
    },
    buildRunbookFooter()
  ];
}

function buildEmoShareRecoveryBlocks(emoShare, totalEvents) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:white_check_mark: *Emo theme adoption restored to ${formatPercentage(emoShare)}* across ${totalEvents} events.`
      }
    },
    buildRunbookFooter()
  ];
}

async function runOnce(logger) {
  const now = new Date();
  const evaluationWindowMs = evaluationRangeHours * 60 * 60 * 1000;
  const start = new Date(now.getTime() - evaluationWindowMs);
  const rangeKey = mapRangeKey(evaluationRangeHours);

  const summary = await summariseUiPreferenceEvents({ startDate: start, endDate: now, tenantId: null });
  await persistSnapshot(rangeKey, summary, now, logger);

  const totalEvents = summary.totals.events;
  const latestEventAt = summary.latestEventAt ? new Date(summary.latestEventAt) : null;
  const minutesSinceLastEvent = latestEventAt ? minutesBetween(now, latestEventAt) : Number.POSITIVE_INFINITY;

  const staleAlertDecision = evaluateAlertState('staleness', minutesSinceLastEvent >= staleMinutesThreshold, now);
  if (staleAlertDecision === 'alert') {
    await postSlackMessage({ blocks: buildStaleAlertBlocks(summary.latestEventAt, minutesSinceLastEvent) }, logger);
  } else if (staleAlertDecision === 'recovery' && latestEventAt) {
    await postSlackMessage({ blocks: buildStaleRecoveryBlocks(summary.latestEventAt, minutesSinceLastEvent) }, logger);
  }

  const emoEntry = summary.breakdown.theme.find((entry) => entry.key === 'emo');
  const emoShare = totalEvents > 0 && emoEntry ? emoEntry.count / totalEvents : 0;
  const leadingTheme = determineLeadingTheme(summary.breakdown.theme);
  const shareAlertActive = totalEvents >= minimumEventsForShare && emoShare < emoShareThreshold;
  const shareAlertDecision = evaluateAlertState('emoShare', shareAlertActive, now);

  if (shareAlertDecision === 'alert') {
    await postSlackMessage({ blocks: buildEmoShareAlertBlocks(totalEvents, emoShare, leadingTheme) }, logger);
  } else if (shareAlertDecision === 'recovery') {
    await postSlackMessage({ blocks: buildEmoShareRecoveryBlocks(emoShare, totalEvents) }, logger);
  }
}

export function startTelemetryAlertingJob(logger = console) {
  if (!slackWebhookUrl) {
    logger.info('Telemetry alerting disabled: TELEMETRY_SLACK_WEBHOOK_URL not configured.');
    return null;
  }

  logger.info('Starting telemetry alerting job.');

  const execute = () =>
    runOnce(logger).catch((error) => {
      logger.error('Telemetry alerting job run failed', error);
    });

  execute();

  const intervalMs = pollIntervalMinutes * 60 * 1000;
  const handle = setInterval(execute, intervalMs);
  if (typeof handle.unref === 'function') {
    handle.unref();
  }

  return handle;
}
