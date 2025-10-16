import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import Dispute from '../models/dispute.js';
import DisputeHealthBucket from '../models/disputeHealthBucket.js';
import DisputeHealthEntry from '../models/disputeHealthEntry.js';

const DEFAULT_WINDOW_DAYS = 14;
const BACKLOG_HOURS_THRESHOLD = 72;

function normaliseChecklist(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return item.trim();
      }
      if (typeof item.label === 'string') {
        return item.label.trim();
      }
      return null;
    })
    .filter((item) => Boolean(item) && item.length > 0);
}

function normaliseAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const url = item.trim();
        if (!url) return null;
        return { id: randomUUID(), label: url, url, type: 'link' };
      }
      const url = typeof item.url === 'string' ? item.url.trim() : null;
      if (!url) return null;
      return {
        id: item.id ?? randomUUID(),
        label: typeof item.label === 'string' && item.label.trim().length > 0 ? item.label.trim() : url,
        url,
        type: typeof item.type === 'string' ? item.type : 'link',
        thumbnail:
          typeof item.thumbnail === 'string' && item.thumbnail.trim().length > 0
            ? item.thumbnail.trim()
            : null
      };
    })
    .filter(Boolean);
}

function serialiseEntry(entry) {
  return {
    id: entry.id,
    bucketId: entry.bucketId,
    periodStart: entry.periodStart?.toISOString?.() ?? new Date(entry.periodStart).toISOString(),
    periodEnd: entry.periodEnd?.toISOString?.() ?? new Date(entry.periodEnd).toISOString(),
    escalatedCount: Number(entry.escalatedCount ?? 0),
    resolvedCount: Number(entry.resolvedCount ?? 0),
    reopenedCount: Number(entry.reopenedCount ?? 0),
    backlogCount: Number(entry.backlogCount ?? 0),
    ownerNotes: entry.ownerNotes ?? null,
    attachments: normaliseAttachments(entry.attachments ?? []),
    createdBy: entry.createdBy ?? null,
    updatedBy: entry.updatedBy ?? null,
    createdAt: entry.createdAt?.toISOString?.() ?? null,
    updatedAt: entry.updatedAt?.toISOString?.() ?? null
  };
}

function computeBucketMetrics(entries = []) {
  if (!entries.length) {
    return {
      latestResolutionRate: 0,
      latestEscalated: 0,
      latestResolved: 0,
      backlog: 0,
      trend: 0
    };
  }

  const [latest, previous] = entries;
  const latestEscalated = Number(latest.escalatedCount ?? 0);
  const latestResolved = Number(latest.resolvedCount ?? 0);
  const backlog = Number(latest.backlogCount ?? 0);
  const latestResolutionRate = latestEscalated > 0 ? latestResolved / latestEscalated : 1;
  let trend = 0;

  if (previous) {
    const prevRate = Number(previous.escalatedCount ?? 0) > 0
      ? Number(previous.resolvedCount ?? 0) / Number(previous.escalatedCount ?? 0)
      : 1;
    trend = latestResolutionRate - prevRate;
  }

  return { latestResolutionRate, latestEscalated, latestResolved, backlog, trend };
}

async function computeSummary(windowStart) {
  const now = DateTime.now();
  const backlogCutoff = now.minus({ hours: BACKLOG_HOURS_THRESHOLD }).toJSDate();

  const [open, underReview, resolvedThisWindow, openedThisWindow, backlogOlderThanTarget] = await Promise.all([
    Dispute.count({ where: { status: 'open' } }),
    Dispute.count({ where: { status: 'under_review' } }),
    Dispute.count({
      where: {
        status: { [Op.in]: ['resolved', 'closed'] },
        updatedAt: { [Op.gte]: windowStart }
      }
    }),
    Dispute.count({ where: { createdAt: { [Op.gte]: windowStart } } }),
    Dispute.count({
      where: {
        status: { [Op.in]: ['open', 'under_review'] },
        createdAt: { [Op.lt]: backlogCutoff }
      }
    })
  ]);

  const reopenedThisWindow = await DisputeHealthEntry.sum('reopened_count', {
    where: {
      periodEnd: { [Op.gte]: windowStart }
    }
  });

  const resolutionRate = openedThisWindow > 0 ? resolvedThisWindow / openedThisWindow : resolvedThisWindow > 0 ? 1 : 0;

  return {
    open,
    underReview,
    resolvedThisWindow,
    openedThisWindow,
    resolutionRate,
    backlogOlderThanTarget,
    reopenedThisWindow: Number.isFinite(reopenedThisWindow) ? Number(reopenedThisWindow) : 0,
    windowStart: windowStart.toISOString(),
    generatedAt: now.toISO()
  };
}

export async function getDisputeHealthWorkspace({ includeHistory = true } = {}) {
  const windowStart = DateTime.now().minus({ days: DEFAULT_WINDOW_DAYS }).toJSDate();

  const buckets = await DisputeHealthBucket.findAll({
    where: { archivedAt: null },
    order: [
      ['sortOrder', 'ASC'],
      ['createdAt', 'ASC']
    ],
    include: [
      {
        model: DisputeHealthEntry,
        as: 'entries',
        separate: true,
        order: [
          ['periodEnd', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: includeHistory ? undefined : 1
      }
    ]
  });

  const payloadBuckets = buckets.map((bucket) => {
    const plain = bucket.get({ plain: true });
    const entries = (plain.entries ?? []).map((entry) => serialiseEntry(entry));
    const metrics = computeBucketMetrics(entries);

    return {
      id: plain.id,
      label: plain.label,
      cadence: plain.cadence,
      windowDurationHours: plain.windowDurationHours,
      ownerName: plain.ownerName,
      ownerRole: plain.ownerRole,
      escalationContact: plain.escalationContact,
      playbookUrl: plain.playbookUrl,
      heroImageUrl: plain.heroImageUrl,
      checklist: normaliseChecklist(plain.checklist),
      status: plain.status,
      sortOrder: plain.sortOrder,
      latestEntry: entries[0] ?? null,
      entries: includeHistory ? entries : entries.slice(0, 1),
      metrics
    };
  });

  const summary = await computeSummary(windowStart);

  const insights = payloadBuckets.map((bucket) => ({
    id: bucket.id,
    label: bucket.label,
    status: bucket.status,
    latestResolutionRate: bucket.metrics.latestResolutionRate,
    backlog: bucket.metrics.backlog
  }));

  return {
    summary,
    buckets: payloadBuckets,
    insights
  };
}

export async function createDisputeHealthBucket(payload = {}, actorId = null) {
  await DisputeHealthBucket.create({
    label: payload.label?.trim() || 'New cadence bucket',
    cadence: payload.cadence?.trim() || 'Window',
    windowDurationHours: Number.isFinite(Number(payload.windowDurationHours))
      ? Math.max(1, Number(payload.windowDurationHours))
      : 24,
    ownerName: payload.ownerName?.trim() || null,
    ownerRole: payload.ownerRole?.trim() || null,
    escalationContact: payload.escalationContact?.trim() || null,
    playbookUrl: payload.playbookUrl?.trim() || null,
    heroImageUrl: payload.heroImageUrl?.trim() || null,
    checklist: normaliseChecklist(payload.checklist),
    status: ['on_track', 'monitor', 'at_risk'].includes(payload.status) ? payload.status : 'on_track',
    sortOrder: Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0,
    createdBy: actorId,
    updatedBy: actorId
  });

  return getDisputeHealthWorkspace({ includeHistory: true });
}

export async function updateDisputeHealthBucket(bucketId, payload = {}, actorId = null) {
  const bucket = await DisputeHealthBucket.findByPk(bucketId);
  if (!bucket) {
    const error = new Error('Dispute health bucket not found');
    error.statusCode = 404;
    throw error;
  }

  bucket.label = payload.label?.trim() || bucket.label;
  bucket.cadence = payload.cadence?.trim() || bucket.cadence;
  if (payload.windowDurationHours != null && Number.isFinite(Number(payload.windowDurationHours))) {
    bucket.windowDurationHours = Math.max(1, Number(payload.windowDurationHours));
  }
  if (payload.ownerName !== undefined) {
    bucket.ownerName = payload.ownerName?.trim() || null;
  }
  if (payload.ownerRole !== undefined) {
    bucket.ownerRole = payload.ownerRole?.trim() || null;
  }
  if (payload.escalationContact !== undefined) {
    bucket.escalationContact = payload.escalationContact?.trim() || null;
  }
  if (payload.playbookUrl !== undefined) {
    bucket.playbookUrl = payload.playbookUrl?.trim() || null;
  }
  if (payload.heroImageUrl !== undefined) {
    bucket.heroImageUrl = payload.heroImageUrl?.trim() || null;
  }
  if (payload.checklist !== undefined) {
    bucket.checklist = normaliseChecklist(payload.checklist);
  }
  if (payload.status && ['on_track', 'monitor', 'at_risk'].includes(payload.status)) {
    bucket.status = payload.status;
  }
  if (payload.sortOrder != null && Number.isFinite(Number(payload.sortOrder))) {
    bucket.sortOrder = Number(payload.sortOrder);
  }
  bucket.updatedBy = actorId;

  await bucket.save();

  return getDisputeHealthWorkspace({ includeHistory: true });
}

export async function archiveDisputeHealthBucket(bucketId, actorId = null) {
  const bucket = await DisputeHealthBucket.findByPk(bucketId);
  if (!bucket) {
    const error = new Error('Dispute health bucket not found');
    error.statusCode = 404;
    throw error;
  }

  bucket.archivedAt = new Date();
  bucket.updatedBy = actorId;
  await bucket.save();

  return getDisputeHealthWorkspace({ includeHistory: true });
}

function coerceDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function upsertDisputeHealthEntry(entryId, payload = {}, actorId = null) {
  const periodStart = coerceDate(payload.periodStart, new Date());
  const periodEnd = coerceDate(payload.periodEnd, periodStart);

  if (!payload.bucketId) {
    const error = new Error('bucketId is required');
    error.statusCode = 400;
    throw error;
  }

  if (periodEnd.getTime() < periodStart.getTime()) {
    const error = new Error('periodEnd must be after periodStart');
    error.statusCode = 422;
    throw error;
  }

  const bucket = await DisputeHealthBucket.findOne({
    where: { id: payload.bucketId, archivedAt: null }
  });

  if (!bucket) {
    const error = new Error('Dispute health bucket not found');
    error.statusCode = 404;
    throw error;
  }

  const normalisedAttachments =
    payload.attachments === undefined ? undefined : normaliseAttachments(payload.attachments);

  const data = {
    bucketId: payload.bucketId,
    periodStart,
    periodEnd,
    escalatedCount: Number.isFinite(Number(payload.escalatedCount))
      ? Math.max(0, Number(payload.escalatedCount))
      : 0,
    resolvedCount: Number.isFinite(Number(payload.resolvedCount))
      ? Math.max(0, Number(payload.resolvedCount))
      : 0,
    reopenedCount: Number.isFinite(Number(payload.reopenedCount))
      ? Math.max(0, Number(payload.reopenedCount))
      : 0,
    backlogCount: Number.isFinite(Number(payload.backlogCount))
      ? Math.max(0, Number(payload.backlogCount))
      : 0,
    ownerNotes: payload.ownerNotes !== undefined ? payload.ownerNotes?.trim() || null : undefined,
    updatedBy: actorId
  };

  if (normalisedAttachments !== undefined) {
    data.attachments = normalisedAttachments;
  }

  if (data.ownerNotes === undefined) {
    delete data.ownerNotes;
  }

  if (entryId) {
    const [updated] = await DisputeHealthEntry.update(data, {
      where: { id: entryId }
    });
    if (updated === 0) {
      const error = new Error('Dispute health entry not found');
      error.statusCode = 404;
      throw error;
    }
  } else {
    const creationPayload = { ...data, createdBy: actorId };
    if (creationPayload.attachments === undefined) {
      creationPayload.attachments = [];
    }
    await DisputeHealthEntry.create(creationPayload);
  }

  return getDisputeHealthWorkspace({ includeHistory: true });
}

export async function listDisputeHealthHistory(bucketId, { limit = 50, offset = 0 } = {}) {
  const bucket = await DisputeHealthBucket.findOne({
    where: { id: bucketId, archivedAt: null }
  });

  if (!bucket) {
    const error = new Error('Dispute health bucket not found');
    error.statusCode = 404;
    throw error;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 0, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const { rows, count } = await DisputeHealthEntry.findAndCountAll({
    where: { bucketId },
    order: [
      ['periodEnd', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit: safeLimit,
    offset: safeOffset
  });

  const entries = rows.map((entry) => serialiseEntry(entry));
  const latestSample = await DisputeHealthEntry.findAll({
    where: { bucketId },
    order: [
      ['periodEnd', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit: 2
  });
  const metrics = computeBucketMetrics(latestSample.map((entry) => serialiseEntry(entry)));

  return {
    bucket: {
      id: bucket.id,
      label: bucket.label,
      cadence: bucket.cadence,
      status: bucket.status,
      windowDurationHours: bucket.windowDurationHours,
      ownerName: bucket.ownerName,
      ownerRole: bucket.ownerRole,
      escalationContact: bucket.escalationContact,
      playbookUrl: bucket.playbookUrl,
      heroImageUrl: bucket.heroImageUrl,
      checklist: normaliseChecklist(bucket.checklist)
    },
    entries,
    pagination: {
      total: count,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + rows.length < count
    },
    metrics
  };
}

export async function deleteDisputeHealthEntry(entryId) {
  const entry = await DisputeHealthEntry.findByPk(entryId);
  if (!entry) {
    const error = new Error('Dispute health entry not found');
    error.statusCode = 404;
    throw error;
  }

  await entry.destroy();

  return getDisputeHealthWorkspace({ includeHistory: true });
}
