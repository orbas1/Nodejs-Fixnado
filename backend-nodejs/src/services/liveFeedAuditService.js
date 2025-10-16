import { Op, fn, col, literal } from 'sequelize';
import { LiveFeedAuditEvent, LiveFeedAuditNote, User, ServiceZone } from '../models/index.js';

const EVENT_STATUS = new Set(['open', 'investigating', 'resolved', 'dismissed']);
const EVENT_SEVERITY = new Set(['info', 'low', 'medium', 'high', 'critical']);
const EVENT_SOURCE = new Set(['system', 'manual']);

function parseStatus(value, fallback = 'open') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalised = value.trim().toLowerCase();
  return EVENT_STATUS.has(normalised) ? normalised : fallback;
}

function validateStatus(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const normalised = value.trim().toLowerCase();
  return EVENT_STATUS.has(normalised) ? normalised : null;
}

function parseSeverity(value, fallback = 'info') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalised = value.trim().toLowerCase();
  return EVENT_SEVERITY.has(normalised) ? normalised : fallback;
}

function validateSeverity(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const normalised = value.trim().toLowerCase();
  return EVENT_SEVERITY.has(normalised) ? normalised : null;
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sanitiseString(value, { maxLength, fallback = null } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function sanitiseAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .slice(0, 10)
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }
      const url = sanitiseString(attachment.url, { maxLength: 2048 });
      if (!url || !/^https?:\/\//i.test(url)) {
        return null;
      }
      const label = sanitiseString(attachment.label, { maxLength: 120, fallback: null });
      return label ? { url, label } : { url };
    })
    .filter(Boolean);
}

function sanitiseTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  const seen = new Set();
  const result = [];
  tags.forEach((tag) => {
    const normalised = sanitiseString(tag, { maxLength: 64 });
    if (normalised && !seen.has(normalised.toLowerCase())) {
      seen.add(normalised.toLowerCase());
      result.push(normalised);
    }
  });
  return result;
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch (error) {
    return {};
  }
}

function sanitiseSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(snapshot));
  } catch (error) {
    return null;
  }
}

async function resolveActorSnapshot(actorId, snapshot = null) {
  const sanitised = sanitiseSnapshot(snapshot);
  if (sanitised) {
    return sanitised;
  }
  if (!actorId) {
    return null;
  }
  const user = await User.findByPk(actorId, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'type']
  });
  if (!user) {
    return { id: actorId };
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
  return {
    id: user.id,
    name,
    email: user.email ?? null,
    role: user.type ?? null
  };
}

async function resolveZoneSnapshot(zoneId, snapshot = null) {
  const sanitised = sanitiseSnapshot(snapshot);
  if (sanitised) {
    return sanitised;
  }
  if (!zoneId) {
    return null;
  }
  const zone = await ServiceZone.findByPk(zoneId, {
    attributes: ['id', 'name', 'companyId']
  });
  if (!zone) {
    return { id: zoneId };
  }
  return { id: zone.id, name: zone.name, companyId: zone.companyId };
}

function normaliseSource(source) {
  if (typeof source !== 'string') {
    return 'system';
  }
  const lower = source.trim().toLowerCase();
  return EVENT_SOURCE.has(lower) ? lower : 'system';
}

function serialiseEvent(event) {
  if (!event) return null;
  const json = typeof event.toJSON === 'function' ? event.toJSON() : event;
  if (!json) return json;
  return {
    ...json,
    attachments: Array.isArray(json.attachments) ? json.attachments : [],
    tags: Array.isArray(json.tags) ? json.tags : [],
    metadata: json.metadata && typeof json.metadata === 'object' ? json.metadata : {},
    actorSnapshot: json.actorSnapshot ?? json.actor_snapshot ?? null,
    zoneSnapshot: json.zoneSnapshot ?? json.zone_snapshot ?? null,
    postSnapshot: json.postSnapshot ?? json.post_snapshot ?? null,
    notes: Array.isArray(json.notes) ? json.notes.map((note) => ({
      ...note,
      tags: Array.isArray(note.tags) ? note.tags : []
    })) : undefined
  };
}

export async function recordLiveFeedAuditEvent({
  eventType,
  summary,
  details = null,
  source = 'system',
  status = 'open',
  severity = 'info',
  resourceType = null,
  resourceId = null,
  postId = null,
  postSnapshot = null,
  zoneId = null,
  zoneSnapshot = null,
  companyId = null,
  actorId = null,
  actorRole = null,
  actorPersona = null,
  actorSnapshot = null,
  assigneeId = null,
  nextActionAt = null,
  attachments = [],
  tags = [],
  metadata = {},
  occurredAt = null
} = {}) {
  const eventKey = sanitiseString(eventType, { maxLength: 64 });
  if (!eventKey) {
    throw new Error('eventType is required to record a live feed audit event');
  }

  const summaryText = sanitiseString(summary, { maxLength: 255 });
  if (!summaryText) {
    throw new Error('summary is required to record a live feed audit event');
  }

  const normalizedDetails = sanitiseString(details, { maxLength: 5000, fallback: null });
  const normalizedSource = normaliseSource(source);
  const normalizedStatus = parseStatus(status);
  const normalizedSeverity = parseSeverity(severity);
  const normalizedResourceType = sanitiseString(resourceType, { maxLength: 64, fallback: null });
  const normalizedActorRole = sanitiseString(actorRole, { maxLength: 64, fallback: null });
  const normalizedActorPersona = sanitiseString(actorPersona, { maxLength: 64, fallback: null });
  const normalizedAssignee = sanitiseString(assigneeId, { maxLength: 64, fallback: assigneeId });
  const attachmentsList = sanitiseAttachments(attachments);
  const tagsList = sanitiseTags(tags);
  const metadataObject = sanitiseMetadata(metadata);
  const occurred = toDate(occurredAt) ?? new Date();

  const [actorSnapshotResolved, zoneSnapshotResolved] = await Promise.all([
    resolveActorSnapshot(actorId, actorSnapshot),
    resolveZoneSnapshot(zoneId, zoneSnapshot)
  ]);

  const record = await LiveFeedAuditEvent.create({
    eventType: eventKey,
    summary: summaryText,
    details: normalizedDetails,
    source: normalizedSource,
    status: normalizedStatus,
    severity: normalizedSeverity,
    resourceType: normalizedResourceType,
    resourceId: resourceId ?? null,
    postId: postId ?? null,
    postSnapshot: sanitiseSnapshot(postSnapshot),
    zoneId: zoneId ?? zoneSnapshotResolved?.id ?? null,
    zoneSnapshot: zoneSnapshotResolved,
    companyId: companyId ?? zoneSnapshotResolved?.companyId ?? null,
    actorId: actorId ?? actorSnapshotResolved?.id ?? null,
    actorRole: normalizedActorRole,
    actorPersona: normalizedActorPersona,
    actorSnapshot: actorSnapshotResolved,
    assigneeId: normalizedAssignee || null,
    nextActionAt: toDate(nextActionAt),
    attachments: attachmentsList,
    tags: tagsList,
    metadata: metadataObject,
    occurredAt: occurred
  });

  return serialiseEvent(record);
}

export async function createManualLiveFeedAudit({
  actorId,
  actorRole,
  actorPersona,
  ...payload
}) {
  return recordLiveFeedAuditEvent({
    ...payload,
    actorId,
    actorRole,
    actorPersona,
    source: 'manual'
  });
}

export async function updateLiveFeedAudit(auditId, updates = {}) {
  const audit = await LiveFeedAuditEvent.findByPk(auditId);
  if (!audit) {
    const error = new Error('Live feed audit event not found');
    error.statusCode = 404;
    throw error;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const nextStatus = validateStatus(updates.status);
    if (!nextStatus) {
      throw new Error('Invalid status value supplied');
    }
    audit.status = nextStatus;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'severity')) {
    const nextSeverity = validateSeverity(updates.severity);
    if (!nextSeverity) {
      throw new Error('Invalid severity value supplied');
    }
    audit.severity = nextSeverity;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'summary')) {
    const summary = sanitiseString(updates.summary, { maxLength: 255 });
    if (!summary) {
      throw new Error('Summary cannot be empty');
    }
    audit.summary = summary;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'details')) {
    audit.details = sanitiseString(updates.details, { maxLength: 5000, fallback: null });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'assigneeId')) {
    audit.assigneeId = updates.assigneeId ? updates.assigneeId : null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'nextActionAt')) {
    audit.nextActionAt = toDate(updates.nextActionAt);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'attachments')) {
    audit.attachments = sanitiseAttachments(updates.attachments);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'tags')) {
    audit.tags = sanitiseTags(updates.tags);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
    audit.metadata = sanitiseMetadata(updates.metadata);
  }

  await audit.save();
  return serialiseEvent(audit);
}

export async function getLiveFeedAudit(auditId, { includeNotes = true } = {}) {
  const audit = await LiveFeedAuditEvent.findByPk(auditId, {
    include: includeNotes
      ? [
          {
            model: LiveFeedAuditNote,
            as: 'notes',
            order: [['createdAt', 'DESC']]
          }
        ]
      : []
  });
  if (!audit) {
    const error = new Error('Live feed audit event not found');
    error.statusCode = 404;
    throw error;
  }
  const serialised = serialiseEvent(audit);
  if (includeNotes && Array.isArray(serialised.notes)) {
    serialised.notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return serialised;
}

export async function listLiveFeedAudits({
  page = 1,
  pageSize = 25,
  start,
  end,
  eventTypes = [],
  statuses = [],
  severities = [],
  zoneIds = [],
  actorRoles = [],
  actorIds = [],
  search = null,
  includeNotes = false,
  sortBy = 'occurredAt',
  sortDirection = 'DESC'
} = {}) {
  const limit = Math.min(Math.max(Number.parseInt(pageSize, 10) || 25, 1), 100);
  const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const offset = (currentPage - 1) * limit;

  const where = {};
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) {
      where.occurredAt[Op.gte] = startDate;
    }
    if (endDate) {
      where.occurredAt[Op.lte] = endDate;
    }
  }

  const eventFilter = Array.isArray(eventTypes)
    ? eventTypes.map((value) => sanitiseString(value, { maxLength: 64 })).filter(Boolean)
    : [];
  if (eventFilter.length) {
    where.eventType = { [Op.in]: eventFilter };
  }

  const statusFilter = Array.isArray(statuses)
    ? statuses.map((value) => validateStatus(value)).filter(Boolean)
    : [];
  if (statusFilter.length) {
    where.status = { [Op.in]: statusFilter };
  }

  const severityFilter = Array.isArray(severities)
    ? severities.map((value) => validateSeverity(value)).filter(Boolean)
    : [];
  if (severityFilter.length) {
    where.severity = { [Op.in]: severityFilter };
  }

  const zoneFilter = Array.isArray(zoneIds)
    ? zoneIds.map((value) => sanitiseString(value, { maxLength: 64 })).filter(Boolean)
    : [];
  if (zoneFilter.length) {
    where.zoneId = { [Op.in]: zoneFilter };
  }

  const actorRoleFilter = Array.isArray(actorRoles)
    ? actorRoles.map((value) => sanitiseString(value, { maxLength: 64 })).filter(Boolean)
    : [];
  if (actorRoleFilter.length) {
    where.actorRole = { [Op.in]: actorRoleFilter };
  }

  const actorIdFilter = Array.isArray(actorIds)
    ? actorIds.map((value) => sanitiseString(value, { maxLength: 64 })).filter(Boolean)
    : [];
  if (actorIdFilter.length) {
    where.actorId = { [Op.in]: actorIdFilter };
  }

  const query = {
    where,
    limit,
    offset,
    order: [[sortBy === 'severity' ? 'severity' : sortBy === 'status' ? 'status' : 'occurredAt', sortDirection]],
    include: []
  };

  if (search) {
    const term = `%${search.trim().toLowerCase()}%`;
    query.where[Op.or] = [
      { summary: { [Op.iLike]: term } },
      { details: { [Op.iLike]: term } }
    ];
  }

  if (includeNotes) {
    query.include.push({
      model: LiveFeedAuditNote,
      as: 'notes',
      separate: true,
      order: [['createdAt', 'DESC']]
    });
  }

  const { rows, count } = await LiveFeedAuditEvent.findAndCountAll(query);

  const total = typeof count === 'number' ? count : count.length;

  const [statusBreakdown, severityBreakdown, eventBreakdown, topZones, topActors] = await Promise.all([
    LiveFeedAuditEvent.count({
      where,
      group: ['status']
    }),
    LiveFeedAuditEvent.count({
      where,
      group: ['severity']
    }),
    LiveFeedAuditEvent.count({
      where,
      group: ['event_type']
    }),
    LiveFeedAuditEvent.findAll({
      attributes: [
        'zoneId',
        [fn('COUNT', col('id')), 'count'],
        [literal("COALESCE(MAX(zone_snapshot->>'name'), 'Unassigned')"), 'zoneName']
      ],
      where,
      group: ['zoneId'],
      order: [[literal('COUNT(id)'), 'DESC']],
      limit: 5
    }),
    LiveFeedAuditEvent.findAll({
      attributes: [
        'actorId',
        [fn('COUNT', col('id')), 'count'],
        [literal("COALESCE(MAX(actor_snapshot->>'name'), 'Unassigned')"), 'actorName']
      ],
      where,
      group: ['actorId'],
      order: [[literal('COUNT(id)'), 'DESC']],
      limit: 5
    })
  ]);

  const summary = {
    total,
    byStatus: {},
    bySeverity: {},
    byEventType: {},
    topZones: topZones
      .map((entry) => ({
        zoneId: entry.zoneId,
        name: entry.get('zoneName'),
        count: Number.parseInt(entry.get('count'), 10) || 0
      }))
      .filter((entry) => entry.count > 0),
    topActors: topActors
      .map((entry) => ({
        actorId: entry.actorId,
        name: entry.get('actorName'),
        count: Number.parseInt(entry.get('count'), 10) || 0
      }))
      .filter((entry) => entry.count > 0)
  };

  const statusArray = Array.isArray(statusBreakdown) ? statusBreakdown : [statusBreakdown];
  statusArray
    .filter(Boolean)
    .forEach((entry) => {
      const key = entry.status || entry.get?.('status');
      const value = Number.parseInt(entry.count ?? entry.get?.('count'), 10) || 0;
      if (key) {
        summary.byStatus[key] = value;
      }
    });

  const severityArray = Array.isArray(severityBreakdown) ? severityBreakdown : [severityBreakdown];
  severityArray
    .filter(Boolean)
    .forEach((entry) => {
      const key = entry.severity || entry.get?.('severity');
      const value = Number.parseInt(entry.count ?? entry.get?.('count'), 10) || 0;
      if (key) {
        summary.bySeverity[key] = value;
      }
    });

  const eventArray = Array.isArray(eventBreakdown) ? eventBreakdown : [eventBreakdown];
  eventArray
    .filter(Boolean)
    .forEach((entry) => {
      const key = entry.event_type || entry.eventType || entry.get?.('event_type');
      const value = Number.parseInt(entry.count ?? entry.get?.('count'), 10) || 0;
      if (key) {
        summary.byEventType[key] = value;
      }
    });

  return {
    data: rows.map((row) => serialiseEvent(row)),
    meta: {
      page: currentPage,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    },
    summary
  };
}

export async function createLiveFeedAuditNote({ auditId, authorId, authorRole = null, note, tags = [] }) {
  const audit = await LiveFeedAuditEvent.findByPk(auditId);
  if (!audit) {
    const error = new Error('Live feed audit event not found');
    error.statusCode = 404;
    throw error;
  }

  const body = sanitiseString(note, { maxLength: 4000 });
  if (!body) {
    throw new Error('Note text is required');
  }

  const record = await LiveFeedAuditNote.create({
    auditId,
    authorId,
    authorRole: sanitiseString(authorRole, { maxLength: 64, fallback: null }),
    note: body,
    tags: sanitiseTags(tags)
  });

  return record.toJSON();
}

export async function updateLiveFeedAuditNote(noteId, { note, tags = [] } = {}) {
  const record = await LiveFeedAuditNote.findByPk(noteId);
  if (!record) {
    const error = new Error('Live feed audit note not found');
    error.statusCode = 404;
    throw error;
  }

  if (Object.prototype.hasOwnProperty.call({ note }, 'note')) {
    const body = sanitiseString(note, { maxLength: 4000, fallback: null });
    if (!body) {
      throw new Error('Note text cannot be empty');
    }
    record.note = body;
  }

  if (Object.prototype.hasOwnProperty.call({ tags }, 'tags')) {
    record.tags = sanitiseTags(tags);
  }

  await record.save();
  return record.toJSON();
}

export async function deleteLiveFeedAuditNote(noteId) {
  const deleted = await LiveFeedAuditNote.destroy({ where: { id: noteId } });
  if (!deleted) {
    const error = new Error('Live feed audit note not found');
    error.statusCode = 404;
    throw error;
  }
  return true;
}
