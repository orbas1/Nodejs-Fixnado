import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import {
  Escrow,
  Dispute,
  Order,
  Booking,
  ComplianceDocument,
  ComplianceControl,
  InventoryAlert,
  AnalyticsPipelineRun,
  InsuredSellerApplication,
  Company,
  AnalyticsPipelineRun,
  InsuredSellerApplication
} from '../models/index.js';
import { listAdminAuditEvents } from './adminAuditEventService.js';
import { getCachedPlatformSettings } from './platformSettingsService.js';
import { getOverviewSettings } from './adminDashboardSettingsService.js';
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

function applyTemplate(template, context = {}) {
  if (typeof template !== 'string') {
    return null;
  }
  const trimmed = template.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\{\{(\w+)\}\}/g, (match, token) => {
    const value = context[token];
    return value ?? value === 0 ? String(value) : match;
  });
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
    const goal = Number.isFinite(context.goal) ? context.goal : 97;
    const warningThreshold = Number.isFinite(context.warningThreshold)
      ? context.warningThreshold
      : Math.max(goal - 3, 0);
    if (value >= goal) {
      return { tone: 'success', label: 'On target' };
    }
    if (value >= warningThreshold) {
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
  const upcomingControls = await ComplianceControl.findAll({
    where: {
      status: { [Op.ne]: 'retired' },
      nextReviewAt: {
        [Op.not]: null,
        [Op.lte]: now.plus({ days: 14 }).toJSDate()
      }
    },
    include: [
      { model: Company, as: 'company', attributes: ['id', 'contactName', 'legalStructure'], required: false },
      { model: User, as: 'owner', attributes: ['firstName', 'lastName'], required: false }
    ],
    order: [['nextReviewAt', 'ASC']],
    limit: 6
  });

  if (upcomingControls.length) {
    return upcomingControls.map((control) => {
      const dueAt = control.nextReviewAt ? DateTime.fromJSDate(control.nextReviewAt).setZone(timezone) : null;
      const diffDays = dueAt ? Math.round(dueAt.diff(now, 'days').days) : null;
      let due = 'No review scheduled';
      if (diffDays != null) {
        if (diffDays < 0) {
          due = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
        } else if (diffDays === 0) {
          due = 'Due today';
        } else if (diffDays === 1) {
          due = 'Due tomorrow';
        } else {
          due = `Due in ${diffDays} days`;
        }
      }

      let tone = 'info';
      if (diffDays != null) {
        if (diffDays < 0 || diffDays <= 1) {
          tone = 'danger';
        } else if (diffDays <= 3) {
          tone = 'warning';
        } else if (diffDays > 7) {
          tone = 'success';
        }
      }

      const ownerName = control.owner
        ? [control.owner.firstName, control.owner.lastName].filter(Boolean).join(' ').trim()
        : null;
      const ownerLabel = ownerName ? `${ownerName} • ${control.ownerTeam}` : control.ownerTeam;
      const company = control.company;
      const detailParts = [
        `${control.category.replace(/_/g, ' ')} • ${control.controlType}`,
        company?.contactName || company?.legalStructure || 'multi-provider scope'
      ];
      if (control.evidenceRequired) {
        detailParts.push('Evidence required');
      }

      return {
        id: control.id,
        name: control.title,
        detail: detailParts.join(' • '),
        due,
        owner: ownerLabel,
        tone
      };
    });
  }

  const upcomingDocuments = await ComplianceDocument.findAll({
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

  if (upcomingDocuments.length) {
    return upcomingDocuments.map((doc) => {
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

  return [
    {
      id: 'fallback-policy',
      name: 'Scheduled compliance sweep',
      detail:
        'No expiring documentation detected in the next 14 days. Automated reminders remain armed for new submissions.',
      due: 'Next window',
      owner: 'Compliance Ops',
      tone: 'success'
    }
  ];
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

async function buildAuditTimeline(range, timezone, timeframeKey) {
  const now = DateTime.now().setZone(timezone);
  let manualPayload;

  try {
    manualPayload = await listAdminAuditEvents({ timeframe: timeframeKey, timezone });
  } catch (error) {
    manualPayload = {
      events: [],
      meta: {
        timeframe: timeframeKey,
        timeframeLabel: TIMEFRAMES[timeframeKey]?.label ?? timeframeKey,
        timezone,
        range: { start: range.start.toISO(), end: range.end.toISO() },
        countsByCategory: {},
        countsByStatus: {},
        lastUpdated: now.toISO()
      }
    };
  }

  const manualEvents = manualPayload.events.map((event) => {
    const occurred = event.occurredAt
      ? DateTime.fromISO(event.occurredAt).setZone(timezone)
      : now;
    const due = event.dueAt ? DateTime.fromISO(event.dueAt).setZone(timezone) : null;
    return {
      id: event.id,
      event: event.title,
      summary: event.summary,
      owner: event.ownerName,
      ownerTeam: event.ownerTeam,
      status: event.status,
      category: event.category,
      attachments: event.attachments ?? [],
      occurredAt: occurred,
      occurredAtLabel: occurred.toFormat('HH:mm'),
      dueAt: due,
      source: 'manual',
      metadata: event.metadata ?? {}
    };
  });

  const latestPipeline = await AnalyticsPipelineRun.findOne({
    order: [['startedAt', 'DESC']]
  });

  const latestCompliance = await ComplianceDocument.findOne({
    order: [['updatedAt', 'DESC']],
    include: [{ model: Company, attributes: ['contactName'], required: false }]
  });

  const latestDispute = await Dispute.findOne({ order: [['updatedAt', 'DESC']] });

  const derivedEvents = [];

  if (latestPipeline) {
    const timestamp = DateTime.fromJSDate(latestPipeline.finishedAt ?? latestPipeline.startedAt).setZone(timezone);
    derivedEvents.push({
      id: `pipeline-${latestPipeline.id}`,
      event: 'Analytics pipeline run',
      summary: `${numberFormatter.format(latestPipeline.eventsProcessed ?? 0)} events processed • ${numberFormatter.format(
        latestPipeline.eventsFailed ?? 0
      )} failed`,
      owner: latestPipeline.triggeredBy ?? 'Data Platform',
      ownerTeam: 'Data Platform',
      status: latestPipeline.status === 'failed' ? 'blocked' : 'completed',
      category: 'pipeline',
      attachments: [],
      occurredAt: timestamp,
      occurredAtLabel: timestamp.toFormat('HH:mm'),
      dueAt: null,
      source: 'system',
      metadata: {
        runId: latestPipeline.id,
        status: latestPipeline.status,
        eventsProcessed: latestPipeline.eventsProcessed,
        eventsFailed: latestPipeline.eventsFailed
      }
    });
  }

  if (latestCompliance) {
    const timestamp = DateTime.fromJSDate(latestCompliance.updatedAt ?? latestCompliance.submittedAt).setZone(timezone);
    derivedEvents.push({
      id: `compliance-${latestCompliance.id}`,
      event: `${latestCompliance.type} review`,
      summary: latestCompliance.notes ?? latestCompliance.metadata?.summary ?? 'Latest compliance review update',
      owner: latestCompliance.Company?.contactName ?? 'Compliance Ops',
      ownerTeam: 'Compliance',
      status: latestCompliance.status === 'approved' ? 'completed' : 'in_progress',
      category: 'compliance',
      attachments: [],
      occurredAt: timestamp,
      occurredAtLabel: timestamp.toFormat('HH:mm'),
      dueAt: null,
      source: 'system',
      metadata: {
        complianceId: latestCompliance.id,
        status: latestCompliance.status
      }
    });
  }

  if (latestDispute) {
    const timestamp = DateTime.fromJSDate(latestDispute.updatedAt ?? latestDispute.createdAt).setZone(timezone);
    derivedEvents.push({
      id: `dispute-${latestDispute.id}`,
      event: 'Dispute status review',
      summary: `Current status ${latestDispute.status}`,
      owner: 'Support',
      ownerTeam: 'Support',
      status: latestDispute.status === 'resolved' ? 'completed' : 'in_progress',
      category: 'dispute',
      attachments: [],
      occurredAt: timestamp,
      occurredAtLabel: timestamp.toFormat('HH:mm'),
      dueAt: null,
      source: 'system',
      metadata: {
        disputeId: latestDispute.id,
        status: latestDispute.status
      }
    });
  }

  const combined = [...manualEvents, ...derivedEvents];

  if (!combined.length) {
    combined.push({
      id: 'audit-placeholder',
      event: 'No audit activity recorded',
      summary: 'Create a task or investigate upcoming checkpoints to populate the audit trail.',
      owner: 'Systems',
      ownerTeam: 'Operations',
      status: 'scheduled',
      category: 'other',
      attachments: [],
      occurredAt: now,
      occurredAtLabel: now.toFormat('HH:mm'),
      dueAt: null,
      source: 'system',
      metadata: {}
    });
  }

  const sorted = combined.sort((a, b) => {
    const aTime = a.occurredAt ?? now;
    const bTime = b.occurredAt ?? now;
    return bTime.toMillis() - aTime.toMillis();
  });

  const countsByCategory = sorted.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] ?? 0) + 1;
    return acc;
  }, {});

  const countsByStatus = sorted.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    events: sorted.map((entry) => ({
      id: entry.id,
      time: entry.occurredAtLabel,
      event: entry.event,
      owner: entry.owner,
      ownerTeam: entry.ownerTeam,
      status: entry.status,
      category: entry.category,
      summary: entry.summary,
      attachments: entry.attachments,
      occurredAt: entry.occurredAt.toISO(),
      dueAt: entry.dueAt ? entry.dueAt.toISO() : null,
      source: entry.source,
      metadata: entry.metadata
    })),
    summary: {
      countsByCategory,
      countsByStatus,
      manualCounts: manualPayload.meta?.countsByCategory ?? {},
      manualStatusCounts: manualPayload.meta?.countsByStatus ?? {},
      timeframe: manualPayload.meta?.timeframe ?? timeframeKey,
      timeframeLabel: manualPayload.meta?.timeframeLabel ?? TIMEFRAMES[timeframeKey]?.label ?? timeframeKey,
      timezone: manualPayload.meta?.timezone ?? timezone,
      range: manualPayload.meta?.range ?? { start: range.start.toISO(), end: range.end.toISO() },
      lastUpdated: manualPayload.meta?.lastUpdated ?? now.toISO()
    }
  };
}

export async function buildAdminDashboard({
  timeframe = '7d',
  timezone = 'Europe/London',
  securityCapabilities = null
} = {}) {
  const { key, label, bucket, now, range, previous } = resolveTimeframe(timeframe, timezone);
  const currentBuckets = createBuckets(range.start, range.end, bucket, timezone);
  const previousBuckets = createBuckets(previous.start, previous.end, bucket, timezone);

  const overviewSettingsPromise = getOverviewSettings();
  const [
    currentEscrow,
    previousEscrow,
    openDisputes,
    previousOpenDisputes,
    liveOrders,
    previousLiveOrders,
    activeZones,
    sla,
    previousSla,
    disputeMedianResponse,
    overviewSettings
  ] = await Promise.all([
    sumEscrow(range),
    sumEscrow(previous),
    countDisputes(range, ['open', 'under_review']),
    countDisputes(previous, ['open', 'under_review']),
    countLiveOrders(range),
    countLiveOrders(previous),
    countActiveZones(range),
    computeSla(range),
    computeSla(previous),
    computeDisputeMedianResponse(range),
    overviewSettingsPromise
  ]);

  const escrowChange = percentageChange(currentEscrow.totalAmount, previousEscrow.totalAmount);
  const disputesChange = percentageChange(openDisputes, previousOpenDisputes);
  const liveJobsChange = percentageChange(liveOrders, previousLiveOrders);
  const slaChange = percentageChange(sla.value, previousSla.value);

  const currency = currentEscrow.totalAmount > 0 ? 'GBP' : 'GBP';
  const formatter = currencyFormatter(currency);
  const metricSettings = overviewSettings?.metrics ?? {};
  const chartSettings = overviewSettings?.charts ?? {};
  const insightSettings = overviewSettings?.insights ?? {};
  const timelineSettings = overviewSettings?.timeline ?? {};
  const securitySettings = overviewSettings?.security ?? {};
  const automationSettings = overviewSettings?.automation ?? {};
  const queueSettings = overviewSettings?.queues ?? {};
  const auditSettings = overviewSettings?.audit ?? {};

  const escrowConfig = metricSettings.escrow ?? {};
  const disputesConfig = metricSettings.disputes ?? {};
  const jobsConfig = metricSettings.jobs ?? {};
  const slaConfig = metricSettings.sla ?? {};

  const escrowHighMultiplier = Number.isFinite(escrowConfig.targetHighMultiplier)
    ? escrowConfig.targetHighMultiplier
    : 1.05;
  const escrowMediumMultiplier = Number.isFinite(escrowConfig.targetMediumMultiplier)
    ? escrowConfig.targetMediumMultiplier
    : 0.9;
  const disputesLowMultiplier = Number.isFinite(disputesConfig.thresholdLowMultiplier)
    ? disputesConfig.thresholdLowMultiplier
    : 0.7;
  const disputesMediumMultiplier = Number.isFinite(disputesConfig.thresholdMediumMultiplier)
    ? disputesConfig.thresholdMediumMultiplier
    : 1.1;
  const jobsHighMultiplier = Number.isFinite(jobsConfig.targetHighMultiplier)
    ? jobsConfig.targetHighMultiplier
    : 1.2;
  const jobsMediumMultiplier = Number.isFinite(jobsConfig.targetMediumMultiplier)
    ? jobsConfig.targetMediumMultiplier
    : 0.9;
  const slaGoal = Number.isFinite(slaConfig.goal) ? slaConfig.goal : 97;
  const slaWarning = Number.isFinite(slaConfig.warningThreshold) ? slaConfig.warningThreshold : Math.max(slaGoal - 3, 0);

  const escrowCaption =
    applyTemplate(escrowConfig.caption, {
      count: numberFormatter.format(currentEscrow.count),
      total: formatter.format(currentEscrow.totalAmount),
      currency
    }) || `Across ${numberFormatter.format(currentEscrow.count)} funded engagements`;
  const disputesCaption =
    applyTemplate(disputesConfig.caption, {
      count: numberFormatter.format(openDisputes),
      medianResponse: disputeMedianResponse
        ? `${numberFormatter.format(disputeMedianResponse)} minutes`
        : 'within 1 hour'
    }) ||
    (disputeMedianResponse
      ? `Median response ${numberFormatter.format(disputeMedianResponse)} minutes`
      : 'Median response within 1 hour');
  const jobsCaption =
    applyTemplate(jobsConfig.caption, {
      count: numberFormatter.format(liveOrders),
      zones: numberFormatter.format(activeZones)
    }) || `Coverage across ${numberFormatter.format(activeZones)} zones`;
  const slaCaption =
    applyTemplate(slaConfig.caption, {
      goal: slaGoal,
      completed: numberFormatter.format(sla.completed),
      value: sla.value.toFixed(1)
    }) || `Goal ≥ ${slaGoal}% • ${numberFormatter.format(sla.completed)} completed`;

  const escrowTargetHighBase = Number.isFinite(previousEscrow.totalAmount) && previousEscrow.totalAmount > 0
    ? previousEscrow.totalAmount
    : Math.max(currentEscrow.totalAmount, 1);
  const escrowTargetMediumBase = Number.isFinite(previousEscrow.totalAmount) && previousEscrow.totalAmount > 0
    ? previousEscrow.totalAmount
    : Math.max(currentEscrow.totalAmount, 1);

  const jobsTargetHighBase = Number.isFinite(previousLiveOrders) && previousLiveOrders > 0
    ? previousLiveOrders
    : Math.max(liveOrders, 1);
  const jobsTargetMediumBase = Number.isFinite(previousLiveOrders) && previousLiveOrders > 0
    ? previousLiveOrders
    : Math.max(liveOrders, 1);

  const disputesLowBase = Number.isFinite(previousOpenDisputes) && previousOpenDisputes > 0
    ? previousOpenDisputes
    : Math.max(openDisputes, 1);
  const disputesMediumBase = Number.isFinite(previousOpenDisputes) && previousOpenDisputes > 0
    ? previousOpenDisputes
    : Math.max(openDisputes, 1);

  const commandTiles = [
    {
      id: 'escrow',
      label: escrowConfig.label || 'Escrow under management',
      value: {
        amount: currentEscrow.totalAmount,
        currency
      },
      valueLabel: formatter.format(currentEscrow.totalAmount),
      delta: percentFormatter.format(escrowChange),
      deltaTone: determineDeltaTone(escrowChange),
      caption: escrowCaption,
      status: determineMetricStatus('escrow', currentEscrow.totalAmount, {
        targetHigh: escrowTargetHighBase * escrowHighMultiplier,
        targetMedium: escrowTargetMediumBase * escrowMediumMultiplier
      })
    },
    {
      id: 'disputes',
      label: disputesConfig.label || 'Disputes requiring action',
      value: { amount: openDisputes, currency: null },
      valueLabel: numberFormatter.format(openDisputes),
      delta: percentFormatter.format(disputesChange),
      deltaTone: determineDeltaTone(-disputesChange),
      caption: disputesCaption,
      status: determineMetricStatus('disputes', openDisputes, {
        thresholdLow: Math.max(2, Math.round(disputesLowBase * disputesLowMultiplier)),
        thresholdMedium: Math.max(5, Math.round(disputesMediumBase * disputesMediumMultiplier))
      })
    },
    {
      id: 'jobs',
      label: jobsConfig.label || 'Live jobs',
      value: { amount: liveOrders, currency: null },
      valueLabel: numberFormatter.format(liveOrders),
      delta: percentFormatter.format(liveJobsChange),
      deltaTone: determineDeltaTone(liveJobsChange),
      caption: jobsCaption,
      status: determineMetricStatus('jobs', liveOrders, {
        targetHigh: Math.max(20, Math.round(jobsTargetHighBase * jobsHighMultiplier)),
        targetMedium: Math.max(10, Math.round(jobsTargetMediumBase * jobsMediumMultiplier))
      })
    },
    {
      id: 'sla',
      label: slaConfig.label || 'SLA compliance',
      value: { amount: sla.value, currency: null },
      valueLabel: `${sla.value.toFixed(1)}%`,
      delta: percentFormatter.format(slaChange),
      deltaTone: determineDeltaTone(slaChange),
      caption: slaCaption,
      status: determineMetricStatus('sla', sla.value, { goal: slaGoal, warningThreshold: slaWarning })
    }
  ];

  const [
    escrowSeries,
    disputeSeries,
    complianceControlsComputed,
    queueInsights,
    auditTimelineComputed,
    security
    complianceControls,
    queueInsights,
    auditTimeline,
    securityPosture
  ] = await Promise.all([
    computeEscrowSeries(currentBuckets),
    computeDisputeSeries(currentBuckets),
    computeComplianceControls(timezone),
    computeQueueInsights(range, timezone),
    buildAuditTimeline(range, timezone, key),
    computeSecuritySignals(timezone)
    buildAuditTimeline(range, timezone),
    getSecurityPosture({ timezone, includeInactive: true })
  ]);

  const automationBacklogComputed = await computeAutomationBacklog(security.pipelineTotals, timezone);

  const manualSecuritySignals = Array.isArray(securitySettings.manualSignals)
    ? securitySettings.manualSignals.map((entry) => ({
        label: entry.label,
        caption: entry.caption,
        valueLabel: entry.valueLabel,
        tone: entry.tone ?? 'info'
      }))
    : [];

  const manualAutomationBacklog = Array.isArray(automationSettings.manualBacklog)
    ? automationSettings.manualBacklog.map((entry) => ({
        name: entry.name,
        status: entry.status,
        notes: entry.notes,
        tone: entry.tone ?? 'info'
      }))
    : [];

  const manualQueueBoards = Array.isArray(queueSettings.manualBoards)
    ? queueSettings.manualBoards.map((entry, index) => ({
        id: `manual-board-${index}`,
        title: entry.title,
        summary: entry.summary,
        updates: Array.isArray(entry.updates) ? entry.updates : [],
        owner: entry.owner
      }))
    : [];

  const manualComplianceControls = Array.isArray(queueSettings.manualComplianceControls)
    ? queueSettings.manualComplianceControls.map((entry, index) => ({
        id: `manual-control-${index}`,
        name: entry.name,
        detail: entry.detail,
        due: entry.due,
        owner: entry.owner,
        tone: entry.tone ?? 'info'
      }))
    : [];

  const manualAuditTimeline = Array.isArray(auditSettings.manualTimeline)
    ? auditSettings.manualTimeline.map((entry) => ({
        time: entry.time,
        event: entry.event,
        owner: entry.owner,
        status: entry.status
      }))
    : [];

  const automationBacklog = [...automationBacklogComputed, ...manualAutomationBacklog];
  const securitySignals = [...security.signals, ...manualSecuritySignals];
  const complianceControls = [...complianceControlsComputed, ...manualComplianceControls];
  const auditTimeline = [...auditTimelineComputed, ...manualAuditTimeline];
  const queueBoards = [...queueInsights, ...manualQueueBoards];
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
  const escrowChartConfig = chartSettings.escrow ?? {};
  const escrowTargetDivisor = Number.isFinite(escrowChartConfig.targetDivisor)
    ? escrowChartConfig.targetDivisor
    : 1_000_000;

  const trendSeries = escrowSeries.map((entry) => ({
    label: entry.label,
    value: Number.isFinite(entry.value) ? entry.value : 0,
    target: Number.isFinite(previousEscrowAverage)
      ? previousEscrowAverage / escrowTargetDivisor
      : 0
  }));

  const platformSettings = getCachedPlatformSettings();
  const commissionSettings = platformSettings?.commissions ?? {};
  const subscriptionSettings = platformSettings?.subscriptions ?? {};
  const integrationSettings = platformSettings?.integrations ?? {};
  const monetisationSummary = {
    commissionsEnabled: commissionSettings.enabled !== false,
    baseRate: commissionSettings.baseRate ?? 0.025,
    baseRateLabel: `${((commissionSettings.baseRate ?? 0) * 100).toFixed(2)}%`,
    subscriptionEnabled: subscriptionSettings.enabled !== false,
    subscriptionCount: Array.isArray(subscriptionSettings.tiers)
      ? subscriptionSettings.tiers.length
      : Array.isArray(subscriptionSettings.packages)
        ? subscriptionSettings.packages.length
        : 0,
    defaultTier: subscriptionSettings.defaultTier ?? '',
    stripeConnected: Boolean(integrationSettings?.stripe?.secretKey),
    escrowConnected: Boolean(integrationSettings?.escrow?.apiKey && integrationSettings?.escrow?.apiSecret),
    smtpReady: Boolean(integrationSettings?.smtp?.host) && Boolean(integrationSettings?.smtp?.username),
    storageConfigured: Boolean(integrationSettings?.cloudflareR2?.bucket)
  };
  const manualInsights = Array.isArray(insightSettings.manual) ? insightSettings.manual : [];
  const manualUpcoming = Array.isArray(timelineSettings.manual)
    ? timelineSettings.manual.map((item) => ({
        title: item.title,
        when: item.when,
        status: item.status || 'Scheduled'
      }))
    : [];

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
        buckets: trendSeries,
        targetLabel: escrowChartConfig.targetLabel || 'Baseline target'
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
      boards: queueBoards,
      complianceControls
    },
    audit: {
      timeline: auditTimeline
    },
    platform: {
      monetisation: monetisationSummary
    overview: {
      manualInsights,
      manualUpcoming
    }
  };
}

export default buildAdminDashboard;
