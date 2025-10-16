import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import AdminAuditEvent, {
  AUDIT_EVENT_CATEGORIES,
  AUDIT_EVENT_STATUSES
} from '../models/adminAuditEvent.js';

export { AUDIT_EVENT_CATEGORIES, AUDIT_EVENT_STATUSES } from '../models/adminAuditEvent.js';

const TIMEFRAMES = {
  '7d': { label: '7 days', days: 7 },
  '30d': { label: '30 days', days: 30 },
  '90d': { label: '90 days', days: 90 }
};

function sanitiseAttachments(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const label = typeof item.label === 'string' ? item.label.trim().slice(0, 160) : 'Attachment';
      const url = typeof item.url === 'string' ? item.url.trim() : null;
      if (!url) {
        return null;
      }
      return { label: label || 'Attachment', url };
    })
    .filter(Boolean);
}

function parseDate(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function resolveWindow(timeframe = '7d', timezone = 'Europe/London') {
  const key = TIMEFRAMES[timeframe] ? timeframe : '7d';
  const config = TIMEFRAMES[key];
  const now = DateTime.now().setZone(timezone ?? 'UTC');
  const end = now.endOf('day');
  const start = end.minus({ days: config.days - 1 }).startOf('day');

  return {
    key,
    label: config.label,
    timezone: timezone ?? 'UTC',
    range: { start, end }
  };
}

function normaliseEvent(record) {
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    summary: plain.summary || '',
    category: plain.category,
    status: plain.status,
    ownerName: plain.ownerName,
    ownerTeam: plain.ownerTeam,
    occurredAt: plain.occurredAt instanceof Date ? plain.occurredAt.toISOString() : null,
    dueAt: plain.dueAt instanceof Date ? plain.dueAt.toISOString() : null,
    attachments: sanitiseAttachments(plain.attachments),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt instanceof Date ? plain.createdAt.toISOString() : null,
    updatedAt: plain.updatedAt instanceof Date ? plain.updatedAt.toISOString() : null,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null
  };
}

function buildWhere(range, filters = {}) {
  const where = {
    occurredAt: {
      [Op.between]: [range.start.toJSDate(), range.end.toJSDate()]
    }
  };

  if (filters.category && AUDIT_EVENT_CATEGORIES.includes(filters.category)) {
    where.category = filters.category;
  }

  if (filters.status && AUDIT_EVENT_STATUSES.includes(filters.status)) {
    where.status = filters.status;
  }

  return where;
}

export async function listAdminAuditEvents({
  timeframe = '7d',
  category,
  status,
  timezone = 'Europe/London'
} = {}) {
  const window = resolveWindow(timeframe, timezone);
  const lastUpdated = DateTime.now().setZone(timezone ?? 'UTC');
  const records = await AdminAuditEvent.findAll({
    where: buildWhere(window.range, { category, status }),
    order: [
      ['occurred_at', 'DESC'],
      ['created_at', 'DESC']
    ]
  });

  const events = records.map((record) => normaliseEvent(record));
  const countsByCategory = events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] ?? 0) + 1;
    return acc;
  }, {});
  const countsByStatus = events.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    events,
    meta: {
      timeframe: window.key,
      timeframeLabel: window.label,
      timezone: window.timezone,
      range: {
        start: window.range.start.toISO(),
        end: window.range.end.toISO()
      },
      filters: {
        category: category ?? null,
        status: status ?? null
      },
      countsByCategory,
      countsByStatus,
      lastUpdated: lastUpdated.toISO()
    }
  };
}

export async function createAdminAuditEvent(payload, actorId = null) {
  const occurredAt = parseDate(payload?.occurredAt);
  if (!occurredAt) {
    const error = new Error('occurredAt must be a valid date');
    error.status = 422;
    throw error;
  }

  const dueAt = parseDate(payload?.dueAt);

  const record = await AdminAuditEvent.create({
    title: payload.title?.trim(),
    summary: payload.summary?.trim() || null,
    category: AUDIT_EVENT_CATEGORIES.includes(payload.category) ? payload.category : 'other',
    status: AUDIT_EVENT_STATUSES.includes(payload.status) ? payload.status : 'scheduled',
    ownerName: payload.ownerName?.trim() || 'Operations',
    ownerTeam: payload.ownerTeam?.trim() || null,
    occurredAt,
    dueAt,
    attachments: sanitiseAttachments(payload.attachments),
    metadata: payload.metadata ?? null,
    createdBy: actorId,
    updatedBy: actorId
  });

  return normaliseEvent(record);
}

export async function updateAdminAuditEvent(id, payload, actorId = null) {
  const record = await AdminAuditEvent.findByPk(id);
  if (!record) {
    const error = new Error('Audit event not found');
    error.status = 404;
    throw error;
  }

  const updates = {};

  if (payload.title != null) {
    updates.title = payload.title.trim();
  }
  if (payload.summary !== undefined) {
    updates.summary = payload.summary?.trim() || null;
  }
  if (payload.category && AUDIT_EVENT_CATEGORIES.includes(payload.category)) {
    updates.category = payload.category;
  }
  if (payload.status && AUDIT_EVENT_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.ownerName != null) {
    updates.ownerName = payload.ownerName.trim() || record.ownerName;
  }
  if (payload.ownerTeam !== undefined) {
    updates.ownerTeam = payload.ownerTeam ? payload.ownerTeam.trim() : null;
  }
  if (payload.occurredAt !== undefined) {
    const occurredAt = parseDate(payload.occurredAt);
    if (!occurredAt) {
      const error = new Error('occurredAt must be a valid date');
      error.status = 422;
      throw error;
    }
    updates.occurredAt = occurredAt;
  }
  if (payload.dueAt !== undefined) {
    const dueAt = parseDate(payload.dueAt);
    updates.dueAt = dueAt;
  }
  if (payload.attachments !== undefined) {
    updates.attachments = sanitiseAttachments(payload.attachments);
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? null;
  }

  updates.updatedBy = actorId;

  await record.update(updates);
  return normaliseEvent(record);
}

export async function deleteAdminAuditEvent(id) {
  const record = await AdminAuditEvent.findByPk(id);
  if (!record) {
    const error = new Error('Audit event not found');
    error.status = 404;
    throw error;
  }

  await record.destroy();
  return true;
}

export const AUDIT_EVENT_TIMEFRAMES = Object.keys(TIMEFRAMES);
