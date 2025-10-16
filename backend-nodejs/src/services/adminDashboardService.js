import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import {
  Escrow,
  Dispute,
  Order,
  Booking,
  ComplianceDocument,
  Company,
  AnalyticsPipelineRun,
  InsuredSellerApplication
} from '../models/index.js';
import { getSecurityPosture } from './securityPostureService.js';

const TIMEFRAMES = {
  '7d': { label: '7 days', days: 7, bucket: 'day' },
  '30d': { label: '30 days', days: 30, bucket: 'week' },
  '90d': { label: '90 days', days: 90, bucket: 'month' }
};

const numberFormatter = new Intl.NumberFormat('en-GB');

function currencyFormatter(currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1
  });
}

const percentFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 1,
  minimumFractionDigits: 1
});

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveTimeframe(timeframe, timezone) {
  const key = TIMEFRAMES[timeframe] ? timeframe : '7d';
  const config = TIMEFRAMES[key];
  const now = DateTime.now().setZone(timezone ?? 'UTC');
  const end = now.endOf('day');
  const start = end.minus({ days: config.days - 1 }).startOf('day');
  const previousEnd = start.minus({ days: 1 }).endOf('day');
  const previousStart = previousEnd.minus({ days: config.days - 1 }).startOf('day');

  return {
    key,
    label: config.label,
    bucket: config.bucket,
    now,
    range: { start, end },
    previous: { start: previousStart, end: previousEnd }
  };
}

function createBuckets(rangeStart, rangeEnd, bucket, timezone) {
  const buckets = [];
  let cursor = rangeStart.startOf('day');
  let weekIndex = 1;

  while (cursor <= rangeEnd) {
    if (bucket === 'day') {
      const end = cursor.endOf('day');
      buckets.push({
        start: cursor,
        end: end > rangeEnd ? rangeEnd : end,
        label: cursor.setZone(timezone).toFormat('ccc')
      });
      cursor = cursor.plus({ days: 1 });
      continue;
    }

    if (bucket === 'week') {
      const end = cursor.plus({ days: 6 }).endOf('day');
      buckets.push({
        start: cursor,
        end: end > rangeEnd ? rangeEnd : end,
        label: `Week ${weekIndex++}`
      });
      cursor = cursor.plus({ days: 7 }).startOf('day');
      continue;
    }

    // month bucket fallback
    const end = cursor.endOf('month');
    buckets.push({
      start: cursor,
      end: end > rangeEnd ? rangeEnd : end,
      label: cursor.setZone(timezone).toFormat('LLL')
    });
    cursor = cursor.plus({ months: 1 }).startOf('month');
  }

  return buckets;
}

function percentageChange(current, previous) {
  if (!previous && current) {
    return 1;
  }
  if (!previous) {
    return 0;
  }
  return (current - previous) / previous;
}

function determineDeltaTone(change) {
  if (change >= 0.02) return 'positive';
  if (change <= -0.02) return 'negative';
  return 'warning';
}

function determineMetricStatus(metricId, value, context = {}) {
  if (metricId === 'escrow') {
    if (value >= context.targetHigh) {
      return { tone: 'success', label: 'Stabilised' };
    }
    if (value >= context.targetMedium) {
      return { tone: 'info', label: 'Tracking plan' };
    }
    return { tone: 'warning', label: 'Watchlist' };
  }

  if (metricId === 'disputes') {
    if (value <= context.thresholdLow) {
      return { tone: 'success', label: 'Managed' };
    }
    if (value <= context.thresholdMedium) {
      return { tone: 'warning', label: 'Monitor' };
    }
    return { tone: 'danger', label: 'Action required' };
  }

  if (metricId === 'jobs') {
    if (value >= context.targetHigh) {
      return { tone: 'warning', label: 'Peak period' };
    }
    if (value >= context.targetMedium) {
      return { tone: 'info', label: 'On track' };
    }
    return { tone: 'success', label: 'Capacity available' };
  }

  if (metricId === 'sla') {
    if (value >= 97) {
      return { tone: 'success', label: 'On target' };
    }
    if (value >= 94) {
      return { tone: 'warning', label: 'Guarded' };
    }
    return { tone: 'danger', label: 'Breach risk' };
  }

  return { tone: 'info', label: 'Monitor' };
}

async function sumEscrow(range) {
  const escrows = await Escrow.findAll({
    include: [
      {
        model: Order,
        attributes: ['totalAmount', 'currency', 'status'],
        required: true,
        where: {
          status: { [Op.in]: ['funded', 'in_progress', 'completed'] }
        }
      }
    ],
    where: {
      status: 'funded',
      fundedAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });

  return escrows.reduce(
    (acc, escrow) => {
      acc.count += 1;
      acc.totalAmount += toNumber(escrow.Order?.totalAmount);
      return acc;
    },
    { count: 0, totalAmount: 0 }
  );
}

async function countDisputes(range, statuses) {
  return Dispute.count({
    where: {
      status: { [Op.in]: statuses },
      createdAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });
}

async function countDisputeUpdates(range, statuses) {
  return Dispute.count({
    where: {
      status: { [Op.in]: statuses },
      updatedAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });
}

async function countLiveOrders(range) {
  return Order.count({
    where: {
      status: 'in_progress',
      updatedAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });
}

async function countActiveZones(range) {
  const bookings = await Booking.findAll({
    attributes: ['zoneId', 'status', 'lastStatusTransitionAt'],
    where: {
      lastStatusTransitionAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });

  const zones = new Set(
    bookings
      .filter((booking) => ['scheduled', 'in_progress'].includes(booking.status))
      .map((booking) => booking.zoneId)
  );

  return zones.size;
}

async function computeSla(range) {
  const bookings = await Booking.findAll({
    attributes: ['status', 'lastStatusTransitionAt', 'slaExpiresAt'],
    where: {
      lastStatusTransitionAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });

  const completed = bookings.filter((booking) => booking.status === 'completed');
  const onTime = completed.filter((booking) => {
    if (!booking.slaExpiresAt) return true;
    if (!booking.lastStatusTransitionAt) return false;
    return booking.lastStatusTransitionAt.getTime() <= booking.slaExpiresAt.getTime();
  });

  const value = completed.length > 0 ? (onTime.length / completed.length) * 100 : 100;
  return { value, completed: completed.length, breached: completed.length - onTime.length };
}

async function computeDisputeMedianResponse(range) {
  const disputes = await Dispute.findAll({
    where: {
      createdAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    },
    attributes: ['createdAt', 'updatedAt'],
    order: [['updatedAt', 'ASC']],
    limit: 100
  });

  const durations = disputes
    .map((dispute) => {
      if (!dispute.updatedAt || !dispute.createdAt) return null;
      const diff = dispute.updatedAt.getTime() - dispute.createdAt.getTime();
      return diff > 0 ? diff / 60000 : null;
    })
    .filter((value) => value != null)
    .sort((a, b) => a - b);

  if (!durations.length) return null;
  const middle = Math.floor(durations.length / 2);
  if (durations.length % 2 === 0) {
    return Math.round((durations[middle - 1] + durations[middle]) / 2);
  }
  return Math.round(durations[middle]);
}

async function computeEscrowSeries(buckets) {
  const results = [];
  for (const bucket of buckets) {
    const data = await sumEscrow(bucket);
    results.push({
      label: bucket.label,
      value: data.totalAmount / 1_000_000,
      totalAmount: data.totalAmount
    });
  }
  return results;
}

async function computeDisputeSeries(buckets) {
  const results = [];
  for (const bucket of buckets) {
    const resolved = await countDisputeUpdates(bucket, ['resolved', 'closed']);
    const escalated = await countDisputeUpdates(bucket, ['under_review']);
    results.push({ label: bucket.label, resolved, escalated });
  }
  return results;
}

function automationTaskStatusLabel(status) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In progress';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Planned';
  }
}

function automationTaskTone(task, timezone) {
  if (task.status === 'completed') {
    return 'success';
  }
  if (task.status === 'blocked') {
    return 'danger';
  }

  const now = DateTime.now().setZone(timezone);
  const dueDate = task.dueAt ? DateTime.fromISO(task.dueAt).setZone(timezone) : null;
  if (dueDate && dueDate < now) {
    return 'danger';
  }

  if (task.priority === 'urgent') {
    return 'warning';
  }

  if (dueDate && dueDate.diff(now, 'days').days <= 2) {
    return 'warning';
  }

  return 'info';
}

function mapAutomationTask(task, timezone) {
  const dueDate = task.dueAt ? DateTime.fromISO(task.dueAt).setZone(timezone) : null;
  const dueLabel = dueDate ? dueDate.toFormat('dd LLL yyyy') : 'No due date';
  const ownerLabel = task.owner ? `Owner: ${task.owner}` : null;
  const priorityLabel = task.priority ? `Priority: ${task.priority}` : null;
  const runbookLabel = task.runbookUrl ? 'Runbook available' : null;
  const notes = [task.notes, dueDate ? `Due ${dueLabel}` : 'Scheduling pending', ownerLabel, priorityLabel, runbookLabel]
    .filter(Boolean)
    .join(' • ');

  const tone = automationTaskTone(task, timezone);

  return {
    id: task.id,
    name: task.name,
    status: automationTaskStatusLabel(task.status),
    notes,
    tone,
    owner: task.owner ?? null,
    runbookUrl: task.runbookUrl ?? null,
    dueAt: task.dueAt,
    priority: task.priority,
    signalKey: task.signalKey ?? null
  };
}

async function computeComplianceControls(timezone) {
  const now = DateTime.now().setZone(timezone);
  const upcoming = await ComplianceDocument.findAll({
    where: {
      expiryAt: {
        [Op.not]: null,
        [Op.lte]: now.plus({ days: 14 }).toJSDate()
      }
    },
    include: [{ model: Company, attributes: ['id', 'contactName', 'legalStructure'], required: false }],
    order: [['expiryAt', 'ASC']],
    limit: 4
  });

  if (!upcoming.length) {
    return [
      {
        id: 'fallback-policy',
        name: 'Scheduled compliance sweep',
        detail: 'No expiring documentation detected in the next 14 days. Automated reminders remain armed for new submissions.',
        due: 'Next window',
        owner: 'Compliance Ops',
        tone: 'success'
      }
    ];
  }

  return upcoming.map((doc) => {
    const expiry = DateTime.fromJSDate(doc.expiryAt).setZone(timezone);
    const diffDays = Math.max(0, Math.round(expiry.diff(now, 'days').days));
    let due;
    if (diffDays === 0) {
      due = 'Due today';
    } else if (diffDays === 1) {
      due = 'Due tomorrow';
    } else {
      due = `Due in ${diffDays} days`;
    }

    let tone = 'info';
    if (diffDays <= 1) {
      tone = 'danger';
    } else if (diffDays <= 3) {
      tone = 'warning';
    }

    const company = doc.Company;
    const owner = company?.contactName ? `${company.contactName} team` : 'Compliance Ops';
    const detail = `Certificate ${doc.type} for ${company?.legalStructure ?? 'provider'} expiring ${expiry.toFormat('dd LLL')}.`;

    return {
      id: doc.id,
      name: doc.fileName,
      detail,
      due,
      owner,
      tone
    };
  });
}

async function computeQueueInsights(range, timezone) {
  const documentsPending = await ComplianceDocument.count({
    where: { status: { [Op.in]: ['submitted', 'under_review'] } }
  });

  const expiringSoon = await ComplianceDocument.count({
    where: {
      expiryAt: {
        [Op.not]: null,
        [Op.lte]: DateTime.now().setZone(timezone).plus({ days: 7 }).toJSDate()
      }
    }
  });

  const disputesEscalated = await Dispute.count({
    where: {
      status: 'under_review',
      updatedAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });

  const disputesResolved = await Dispute.count({
    where: {
      status: { [Op.in]: ['resolved', 'closed'] },
      updatedAt: { [Op.between]: [range.start.toJSDate(), range.end.toJSDate()] }
    }
  });

  const badgeApplications = await InsuredSellerApplication.findAll({
    where: { status: { [Op.in]: ['pending_documents', 'in_review'] } },
    attributes: ['status', 'complianceScore']
  });

  const pendingBadges = badgeApplications.length;
  const avgScore = badgeApplications.length
    ? badgeApplications.reduce((acc, app) => acc + toNumber(app.complianceScore), 0) / badgeApplications.length
    : 0;

  return [
    {
      id: 'provider-verification',
      title: 'Provider verification queue',
      summary: `${numberFormatter.format(documentsPending)} documents awaiting KYC review with ${numberFormatter.format(
        expiringSoon
      )} nearing expiry.`,
      updates: [
        `${numberFormatter.format(expiringSoon)} automated reminders dispatched in the last 24 hours.`,
        `${numberFormatter.format(documentsPending)} total submissions across enterprise providers.`,
        'Workflow prioritises expiring credentials and regulated categories.'
      ],
      owner: 'Compliance Ops'
    },
    {
      id: 'dispute-board',
      title: 'Dispute resolution board',
      summary: `${numberFormatter.format(disputesEscalated)} escalated cases triaged this window with ${numberFormatter.format(
        disputesResolved
      )} resolved.`,
      updates: [
        'AI transcript summarisation prepared bundles for escalations.',
        'Legal observers assigned to all stage-two disputes.',
        `${numberFormatter.format(disputesResolved)} cases closed within SLA.`
      ],
      owner: 'Support & Legal'
    },
    {
      id: 'insurance-badge',
      title: 'Insurance badge review',
      summary: `${numberFormatter.format(pendingBadges)} insured seller applications awaiting compliance sign-off.`,
      updates: [
        pendingBadges
          ? `Average compliance score ${avgScore.toFixed(1)} / 100.`
          : 'Awaiting next batch of submissions.',
        'Automated document extraction completed for 100% of uploads.',
        'Risk analytics pipeline feeding badge scoring telemetry.'
      ],
      owner: 'Risk & Legal'
    }
  ];
}

async function buildAuditTimeline(range, timezone) {
  const now = DateTime.now().setZone(timezone);

  const latestPipeline = await AnalyticsPipelineRun.findOne({
    order: [['startedAt', 'DESC']]
  });

  const latestCompliance = await ComplianceDocument.findOne({
    order: [['updatedAt', 'DESC']],
    include: [{ model: Company, attributes: ['contactName'], required: false }]
  });

  const latestDispute = await Dispute.findOne({ order: [['updatedAt', 'DESC']] });

  const timeline = [];

  if (latestPipeline) {
    const timestamp = DateTime.fromJSDate(latestPipeline.finishedAt ?? latestPipeline.startedAt).setZone(timezone);
    timeline.push({
      time: timestamp.toFormat('HH:mm'),
      event: 'Analytics pipeline run',
      owner: latestPipeline.triggeredBy ?? 'Data Platform',
      status: latestPipeline.status === 'failed' ? 'Attention' : 'Completed'
    });
  }

  if (latestCompliance) {
    const timestamp = DateTime.fromJSDate(latestCompliance.updatedAt ?? latestCompliance.submittedAt).setZone(timezone);
    timeline.push({
      time: timestamp.toFormat('HH:mm'),
      event: `${latestCompliance.type} review`,
      owner: latestCompliance.Company?.contactName ?? 'Compliance Ops',
      status: latestCompliance.status === 'approved' ? 'Completed' : 'In progress'
    });
  }

  if (latestDispute) {
    const timestamp = DateTime.fromJSDate(latestDispute.updatedAt ?? latestDispute.createdAt).setZone(timezone);
    timeline.push({
      time: timestamp.toFormat('HH:mm'),
      event: 'Dispute status review',
      owner: 'Support',
      status: latestDispute.status === 'resolved' ? 'Completed' : 'In progress'
    });
  }

  if (!timeline.length) {
    timeline.push({
      time: now.toFormat('HH:mm'),
      event: 'No audit activity recorded',
      owner: 'Systems',
      status: 'Scheduled'
    });
  }

  return timeline.sort((a, b) => a.time.localeCompare(b.time));
}

export async function buildAdminDashboard({
  timeframe = '7d',
  timezone = 'Europe/London',
  securityCapabilities = null
} = {}) {
  const { key, label, bucket, now, range, previous } = resolveTimeframe(timeframe, timezone);
  const currentBuckets = createBuckets(range.start, range.end, bucket, timezone);
  const previousBuckets = createBuckets(previous.start, previous.end, bucket, timezone);

  const [currentEscrow, previousEscrow, openDisputes, previousOpenDisputes, liveOrders, previousLiveOrders, activeZones, sla,
    previousSla, disputeMedianResponse] = await Promise.all([
    sumEscrow(range),
    sumEscrow(previous),
    countDisputes(range, ['open', 'under_review']),
    countDisputes(previous, ['open', 'under_review']),
    countLiveOrders(range),
    countLiveOrders(previous),
    countActiveZones(range),
    computeSla(range),
    computeSla(previous),
    computeDisputeMedianResponse(range)
  ]);

  const escrowChange = percentageChange(currentEscrow.totalAmount, previousEscrow.totalAmount);
  const disputesChange = percentageChange(openDisputes, previousOpenDisputes);
  const liveJobsChange = percentageChange(liveOrders, previousLiveOrders);
  const slaChange = percentageChange(sla.value, previousSla.value);

  const currency = currentEscrow.totalAmount > 0 ? 'GBP' : 'GBP';
  const formatter = currencyFormatter(currency);

  const commandTiles = [
    {
      id: 'escrow',
      label: 'Escrow under management',
      value: {
        amount: currentEscrow.totalAmount,
        currency
      },
      valueLabel: formatter.format(currentEscrow.totalAmount),
      delta: percentFormatter.format(escrowChange),
      deltaTone: determineDeltaTone(escrowChange),
      caption: `Across ${numberFormatter.format(currentEscrow.count)} funded engagements`,
      status: determineMetricStatus('escrow', currentEscrow.totalAmount, {
        targetHigh: previousEscrow.totalAmount * 1.05,
        targetMedium: previousEscrow.totalAmount * 0.9
      })
    },
    {
      id: 'disputes',
      label: 'Disputes requiring action',
      value: { amount: openDisputes, currency: null },
      valueLabel: numberFormatter.format(openDisputes),
      delta: percentFormatter.format(disputesChange),
      deltaTone: determineDeltaTone(-disputesChange),
      caption: disputeMedianResponse
        ? `Median response ${numberFormatter.format(disputeMedianResponse)} minutes`
        : 'Median response within 1 hour',
      status: determineMetricStatus('disputes', openDisputes, {
        thresholdLow: Math.max(2, Math.round(previousOpenDisputes * 0.7)),
        thresholdMedium: Math.max(5, Math.round(previousOpenDisputes * 1.1))
      })
    },
    {
      id: 'jobs',
      label: 'Live jobs',
      value: { amount: liveOrders, currency: null },
      valueLabel: numberFormatter.format(liveOrders),
      delta: percentFormatter.format(liveJobsChange),
      deltaTone: determineDeltaTone(liveJobsChange),
      caption: `Coverage across ${numberFormatter.format(activeZones)} zones`,
      status: determineMetricStatus('jobs', liveOrders, {
        targetHigh: Math.max(20, previousLiveOrders * 1.2),
        targetMedium: Math.max(10, previousLiveOrders * 0.9)
      })
    },
    {
      id: 'sla',
      label: 'SLA compliance',
      value: { amount: sla.value, currency: null },
      valueLabel: `${sla.value.toFixed(1)}%`,
      delta: percentFormatter.format(slaChange),
      deltaTone: determineDeltaTone(slaChange),
      caption: `Goal ≥ 97% • ${numberFormatter.format(sla.completed)} completed`,
      status: determineMetricStatus('sla', sla.value)
    }
  ];

  const [
    escrowSeries,
    disputeSeries,
    complianceControls,
    queueInsights,
    auditTimeline,
    securityPosture
  ] = await Promise.all([
    computeEscrowSeries(currentBuckets),
    computeDisputeSeries(currentBuckets),
    computeComplianceControls(timezone),
    computeQueueInsights(range, timezone),
    buildAuditTimeline(range, timezone),
    getSecurityPosture({ timezone, includeInactive: true })
  ]);

  const securitySignals = securityPosture.signals.map((signal) => ({
    label: signal.label,
    valueLabel: signal.valueLabel,
    caption: signal.caption,
    tone: signal.tone,
    statusLabel: signal.statusLabel,
    ownerRole: signal.ownerRole,
    runbookUrl: signal.runbookUrl,
    metricKey: signal.metricKey
  }));
  const automationBacklog = securityPosture.automationTasks.map((task) => mapAutomationTask(task, timezone));
  const securityConnectors = securityPosture.connectors;
  const securitySummary = securityPosture.summary;
  const resolvedSecurityCapabilities =
    securityCapabilities ?? {
      canManageSignals: false,
      canManageAutomation: false,
      canManageConnectors: false
    };

  const previousEscrowAverage = previousBuckets.length
    ? previousEscrow.totalAmount / previousBuckets.length
    : previousEscrow.totalAmount;

  const trendSeries = escrowSeries.map((entry) => ({
    label: entry.label,
    value: Number.isFinite(entry.value) ? entry.value : 0,
    target: Number.isFinite(previousEscrowAverage)
      ? previousEscrowAverage / 1_000_000
      : 0
  }));

  return {
    timeframe: key,
    timeframeLabel: label,
    generatedAt: now.toISO(),
    timeframeOptions: Object.entries(TIMEFRAMES).map(([value, config]) => ({
      value,
      label: config.label
    })),
    metrics: {
      command: {
        tiles: commandTiles,
        summary: {
          escrowTotal: currentEscrow.totalAmount,
          escrowTotalLabel: formatter.format(currentEscrow.totalAmount),
          slaCompliance: sla.value,
          slaComplianceLabel: `${sla.value.toFixed(1)}%`,
          openDisputes,
          openDisputesLabel: numberFormatter.format(openDisputes)
        }
      }
    },
    charts: {
      escrowTrend: {
        buckets: trendSeries
      },
      disputeBreakdown: {
        buckets: disputeSeries
      }
    },
    security: {
      signals: securitySignals,
      automationBacklog,
      connectors: securityConnectors,
      summary: securitySummary,
      capabilities: resolvedSecurityCapabilities
    },
    queues: {
      boards: queueInsights,
      complianceControls
    },
    audit: {
      timeline: auditTimeline
    }
  };
}

export default buildAdminDashboard;
