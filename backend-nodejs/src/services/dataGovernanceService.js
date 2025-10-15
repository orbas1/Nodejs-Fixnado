import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import config from '../config/index.js';
import sequelize from '../config/database.js';
import {
  DataSubjectRequest,
  Region,
  User,
  Company,
  Order,
  Escrow,
  Dispute,
  Conversation,
  ConversationMessage,
  ConversationParticipant,
  MessageDelivery,
  MessageHistory,
  FinanceTransactionHistory,
  RentalAgreement
} from '../models/index.js';
import { normaliseEmail, stableHash } from '../utils/security/fieldEncryption.js';

const EXPORT_ROOT = path.resolve(process.cwd(), 'storage', 'data-exports');
const SUPPORTED_REQUEST_TYPES = new Set(['access', 'erasure', 'rectification']);
const SUPPORTED_STATUSES = new Set(['received', 'in_progress', 'completed', 'rejected']);

function dataGovernanceError(message, statusCode = 400) {
  const error = new Error(message);
  error.status = statusCode;
  return error;
}

async function findRegionByCode(regionCode) {
  if (typeof regionCode !== 'string' || regionCode.trim() === '') {
    return null;
  }

  return Region.findOne({ where: { code: regionCode.trim().toUpperCase() } });
}

async function resolveRegion(regionCode) {
  const region = await findRegionByCode(regionCode);
  if (region) {
    return region;
  }

  const fallbackCode = (config.consent?.defaultRegion || 'GB').toUpperCase();
  const fallback = await findRegionByCode(fallbackCode);
  if (fallback) {
    return fallback;
  }

  return Region.findOne({ where: { code: 'GB' } });
}

async function ensureExportDirectory(region) {
  const directory = path.join(EXPORT_ROOT, region?.code ?? 'GLOBAL');
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

async function findSubjectUser({ userId, subjectEmail }) {
  if (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      return user;
    }
  }

  if (typeof subjectEmail === 'string' && subjectEmail.trim()) {
    const hash = stableHash(normaliseEmail(subjectEmail), 'user:email-query');
    const user = await User.findOne({ where: { emailHash: hash } });
    if (user) {
      return user;
    }
  }

  return null;
}

function appendAuditEntry(request, entry) {
  const current = Array.isArray(request.auditLog) ? [...request.auditLog] : [];
  current.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
  request.auditLog = current;
}

function normaliseEmailForStorage(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function parseIsoDate(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw dataGovernanceError(`${fieldName} must be an ISO-8601 timestamp string`);
  }

  const parsed = DateTime.fromISO(value, { zone: 'utc' });
  if (!parsed.isValid) {
    throw dataGovernanceError(`Invalid ${fieldName} supplied`);
  }
  return parsed;
}

async function buildRequestFilters({
  status,
  requestType,
  regionCode,
  submittedAfter,
  submittedBefore,
  subjectEmail
} = {}) {
  const where = {};

  if (status) {
    if (!SUPPORTED_STATUSES.has(status)) {
      throw dataGovernanceError(`Unsupported status filter: ${status}`);
    }
    where.status = status;
  }

  if (requestType) {
    if (!SUPPORTED_REQUEST_TYPES.has(requestType)) {
      throw dataGovernanceError(`Unsupported request type filter: ${requestType}`);
    }
    where.requestType = requestType;
  }

  if (subjectEmail) {
    const normalised = normaliseEmailForStorage(subjectEmail);
    if (!normalised) {
      throw dataGovernanceError('subjectEmail filter must contain a valid email address');
    }
    where.subjectEmail = normalised;
  }

  let submittedAfterDate = null;
  if (submittedAfter) {
    submittedAfterDate = parseIsoDate(submittedAfter, 'submittedAfter');
    where.requestedAt = {
      ...(where.requestedAt || {}),
      [Op.gte]: submittedAfterDate.toJSDate()
    };
  }

  if (submittedBefore) {
    const to = parseIsoDate(submittedBefore, 'submittedBefore');
    where.requestedAt = {
      ...(where.requestedAt || {}),
      [Op.lte]: to.toJSDate()
    };

    if (submittedAfterDate && submittedAfterDate > to) {
      throw dataGovernanceError('submittedAfter must be before submittedBefore');
    }
  }

  if (regionCode) {
    const region = await findRegionByCode(regionCode);
    if (!region) {
      throw dataGovernanceError(`Unknown region code: ${regionCode}`);
    }
    where.regionId = region.id;
  }

  return { where };
}

function computePercentile(values, percentile) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * percentile;
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }

  const lower = sorted[lowerIndex];
  const upper = sorted[upperIndex];
  const weight = rank - lowerIndex;
  return lower + (upper - lower) * weight;
}

async function buildOrderSnapshot(userId) {
  return Order.findAll({
    where: { buyerId: userId },
    include: [
      Escrow,
      { model: Region, as: 'region' },
      { model: FinanceTransactionHistory, as: 'financeHistory', required: false, include: [{ model: Region, as: 'region' }] }
    ]
  });
}

async function buildConversationSnapshot(userId) {
  const participants = await ConversationParticipant.findAll({
    where: { participantId: userId },
    attributes: ['conversationId']
  });
  const conversationIds = participants.map((row) => row.conversationId);
  if (conversationIds.length === 0) {
    return [];
  }

  return Conversation.findAll({
    where: { id: { [Op.in]: conversationIds } },
    include: [
      { model: Region, as: 'region' },
      {
        model: ConversationMessage,
        as: 'messages',
        include: [
          { model: Region, as: 'region' },
          {
            model: MessageDelivery,
            as: 'deliveries',
            required: false,
            where: { participantId: userId },
            include: [{ model: Region, as: 'region' }]
          }
        ]
      }
    ]
  });
}

async function buildRentalSnapshot(userId) {
  return RentalAgreement.findAll({
    where: { renterId: userId },
    include: [{ model: Region, as: 'region' }]
  });
}

function sanitiseUser(user) {
  if (!user) {
    return null;
  }

  const payload = user.toSafeJSON();
  payload.region = user.regionId ? { id: user.regionId } : null;
  return payload;
}

async function buildDataExportPayload({ user, request }) {
  const [orders, conversations, rentals, companies] = await Promise.all([
    buildOrderSnapshot(user.id),
    buildConversationSnapshot(user.id),
    buildRentalSnapshot(user.id),
    Company.findAll({ where: { userId: user.id }, include: [{ model: Region, as: 'region' }] })
  ]);

  const disputes = await Dispute.findAll({
    include: [
      { model: Region, as: 'region' },
      {
        model: Escrow,
        include: [{ model: Order, include: [{ model: Region, as: 'region' }] }]
      }
    ],
    where: {
      [Op.or]: [
        { openedBy: user.id },
        { '$Escrow.Order.buyerId$': user.id }
      ]
    }
  });

  return {
    metadata: {
      generatedAt: DateTime.utc().toISO(),
      requestId: request.id,
      requestType: request.requestType
    },
    user: sanitiseUser(user),
    companies: companies.map((company) => ({
      ...company.toJSON(),
      region: company.regionId ? { id: company.regionId } : null
    })),
    orders: orders.map((order) => ({
      ...order.toJSON(),
      region: order.regionId ? { id: order.regionId } : null
    })),
    disputes: disputes.map((dispute) => ({
      ...dispute.toJSON(),
      region: dispute.regionId ? { id: dispute.regionId } : null
    })),
    rentals: rentals.map((rental) => ({
      ...rental.toJSON(),
      region: rental.regionId ? { id: rental.regionId } : null
    })),
    conversations: conversations.map((conversation) => ({
      ...conversation.toJSON(),
      region: conversation.regionId ? { id: conversation.regionId } : null
    }))
  };
}

export async function submitDataSubjectRequest({
  userId = null,
  subjectEmail,
  requestType,
  justification = '',
  channel = 'web',
  regionCode
}) {
  if (!SUPPORTED_REQUEST_TYPES.has(requestType)) {
    throw dataGovernanceError(`Unsupported request type: ${requestType}`);
  }

  const normalisedEmail = normaliseEmailForStorage(subjectEmail);
  if (!normalisedEmail) {
    throw dataGovernanceError('subjectEmail is required');
  }

  const region = await resolveRegion(regionCode);
  const user = await findSubjectUser({ userId, subjectEmail });

  const submittedAt = DateTime.utc();
  const dueAt = submittedAt.plus({ days: config.dataGovernance.requestSlaDays }).toJSDate();

  const request = await DataSubjectRequest.create({
    userId: user ? user.id : userId,
    subjectEmail: normalisedEmail,
    requestType,
    requestedAt: submittedAt.toJSDate(),
    dueAt,
    regionId: region?.id ?? null,
    metadata: {
      justification: justification?.trim() || null,
      channel
    }
  });

  appendAuditEntry(request, {
    action: 'submitted',
    actorId: userId,
    note: justification?.trim() || null
  });
  await request.save();
  return request;
}

export async function listDataSubjectRequests({
  status,
  requestType,
  regionCode,
  submittedAfter,
  submittedBefore,
  subjectEmail,
  limit = 50
} = {}) {
  const { where } = await buildRequestFilters({
    status,
    requestType,
    regionCode,
    submittedAfter,
    submittedBefore,
    subjectEmail
  });

  return DataSubjectRequest.findAll({
    where,
    order: [
      ['requestedAt', 'DESC'],
      ['id', 'DESC']
    ],
    include: [
      { model: Region, as: 'region' },
      { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'type'] }
    ],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 200)
  });
}

export async function calculateDataSubjectRequestMetrics(filters = {}) {
  const { where } = await buildRequestFilters(filters);
  const now = DateTime.utc();

  const totalRequests = await DataSubjectRequest.count({ where });

  const statusRows = await DataSubjectRequest.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('DataSubjectRequest.id')), 'count']
    ],
    where,
    group: ['status'],
    raw: true
  });

  const statusBreakdown = {
    received: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0
  };
  statusRows.forEach((row) => {
    const key = row.status;
    if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(statusBreakdown, key)) {
      statusBreakdown[key] = Number(row.count) || 0;
    }
  });

  const overdueCount = await DataSubjectRequest.count({
    where: {
      ...where,
      status: { [Op.ne]: 'completed' },
      dueAt: { [Op.lt]: now.toJSDate() }
    }
  });

  const dueSoonCount = await DataSubjectRequest.count({
    where: {
      ...where,
      status: { [Op.ne]: 'completed' },
      dueAt: {
        [Op.gte]: now.toJSDate(),
        [Op.lte]: now.plus({ days: config.dataGovernance.dueSoonWindowDays }).toJSDate()
      }
    }
  });

  const oldestPending = await DataSubjectRequest.findOne({
    where: {
      ...where,
      status: { [Op.ne]: 'completed' }
    },
    order: [
      ['requestedAt', 'ASC'],
      ['id', 'ASC']
    ],
    raw: true
  });

  const completionWhere = {
    ...where,
    status: 'completed',
    processedAt: { [Op.ne]: null }
  };

  if (!completionWhere.requestedAt) {
    completionWhere.requestedAt = { [Op.gte]: now.minus({ days: config.dataGovernance.metricsWindowDays }).toJSDate() };
  } else if (!completionWhere.requestedAt[Op.gte]) {
    completionWhere.requestedAt = {
      ...completionWhere.requestedAt,
      [Op.gte]: now.minus({ days: config.dataGovernance.metricsWindowDays }).toJSDate()
    };
  }

  const completedRows = await DataSubjectRequest.findAll({
    attributes: ['requestedAt', 'processedAt'],
    where: completionWhere,
    order: [['processedAt', 'DESC']],
    limit: 1000,
    raw: true
  });

  const durations = completedRows
    .map((row) => {
      const requested = row.requestedAt || row.requested_at;
      const processed = row.processedAt || row.processed_at;
      if (!requested || !processed) {
        return null;
      }
      const requestedMs = new Date(requested).getTime();
      const processedMs = new Date(processed).getTime();
      if (!Number.isFinite(requestedMs) || !Number.isFinite(processedMs) || processedMs < requestedMs) {
        return null;
      }
      return (processedMs - requestedMs) / 60000;
    })
    .filter((value) => Number.isFinite(value));

  const averageCompletionMinutes =
    durations.length > 0 ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
  const medianCompletionMinutes = computePercentile(durations, 0.5);
  const percentile95CompletionMinutes = computePercentile(durations, 0.95);

  return {
    generatedAt: now.toISO(),
    totalRequests,
    statusBreakdown,
    overdueCount,
    dueSoonCount,
    completionRate: totalRequests > 0 ? statusBreakdown.completed / totalRequests : 0,
    averageCompletionMinutes: averageCompletionMinutes != null ? Number(averageCompletionMinutes.toFixed(2)) : null,
    medianCompletionMinutes: medianCompletionMinutes != null ? Number(medianCompletionMinutes.toFixed(2)) : null,
    percentile95CompletionMinutes:
      percentile95CompletionMinutes != null ? Number(percentile95CompletionMinutes.toFixed(2)) : null,
    windowDays: config.dataGovernance.metricsWindowDays,
    slaTargetDays: config.dataGovernance.requestSlaDays,
    dueSoonWindowDays: config.dataGovernance.dueSoonWindowDays,
    oldestPending: oldestPending
      ? {
          id: oldestPending.id,
          subjectEmail: oldestPending.subject_email || oldestPending.subjectEmail,
          status: oldestPending.status,
          requestedAt: oldestPending.requested_at || oldestPending.requestedAt,
          dueAt: oldestPending.due_at || oldestPending.dueAt,
          regionId: oldestPending.region_id || oldestPending.regionId
        }
      : null
  };
}

export async function generateDataSubjectExport(requestId, actorId = null) {
  const request = await DataSubjectRequest.findByPk(requestId, {
    include: [{ model: Region, as: 'region' }]
  });

  if (!request) {
    throw dataGovernanceError('Data subject request not found', 404);
  }

  if (request.requestType !== 'access') {
    throw dataGovernanceError('Exports are only supported for access requests', 409);
  }

  const user = await findSubjectUser({ userId: request.userId, subjectEmail: request.subjectEmail });
  if (!user) {
    throw dataGovernanceError('No user record found for subject email', 404);
  }

  const region = request.regionId ? await Region.findByPk(request.regionId) : await resolveRegion();
  const exportDirectory = await ensureExportDirectory(region);
  const exportPayload = await buildDataExportPayload({ user, request });
  const fileName = `${request.id}-${Date.now()}.json`;
  const filePath = path.join(exportDirectory, fileName);
  await fs.writeFile(filePath, JSON.stringify(exportPayload, null, 2), 'utf8');

  request.payloadLocation = filePath;
  request.status = 'completed';
  request.processedAt = new Date();
  appendAuditEntry(request, {
    action: 'export_generated',
    actorId,
    note: `Export written to ${filePath}`
  });
  await request.save();

  return { filePath, request };
}

export async function updateDataSubjectRequestStatus(
  requestId,
  { status, actorId = null, note = null, dueAt = null } = {}
) {
  if (status && !SUPPORTED_STATUSES.has(status)) {
    throw dataGovernanceError(`Unsupported status: ${status}`);
  }

  const request = await DataSubjectRequest.findByPk(requestId);
  if (!request) {
    throw dataGovernanceError('Data subject request not found', 404);
  }

  const updates = [];
  const trimmedNote = typeof note === 'string' && note.trim().length > 0 ? note.trim() : null;

  if (dueAt) {
    const dueDate = parseIsoDate(dueAt, 'dueAt');
    const requestedAt = DateTime.fromJSDate(new Date(request.requestedAt));
    if (dueDate < requestedAt) {
      throw dataGovernanceError('dueAt must be after the original request timestamp');
    }
    request.dueAt = dueDate.toJSDate();
    appendAuditEntry(request, {
      action: 'due_date_updated',
      actorId,
      note: `Due date adjusted to ${dueDate.toISO()}`
    });
    updates.push('dueAt');
  }

  if (status && status !== request.status) {
    request.status = status;
    if (status === 'completed') {
      request.processedAt = new Date();
    } else if (status !== 'completed') {
      request.processedAt = status === 'received' ? null : request.processedAt;
    }
    appendAuditEntry(request, {
      action: 'status_update',
      actorId,
      note: trimmedNote || `Status set to ${status}`
    });
    updates.push('status');
  } else if (trimmedNote) {
    appendAuditEntry(request, { action: 'status_note', actorId, note: trimmedNote });
  }

  if (updates.length === 0 && !trimmedNote) {
    return request;
  }

  await request.save();
  return request;
}

export async function purgeExpiredDataGovernanceRecords(logger = console) {
  const retentionDays = config.dataGovernance.accessLogRetentionDays;
  const messageHistoryDays = config.dataGovernance.messageHistoryRetentionDays;
  const financeHistoryDays = config.dataGovernance.financeHistoryRetentionDays;

  const now = DateTime.utc();
  const requestCutoff = now.minus({ days: retentionDays }).toJSDate();
  const messageCutoff = now.minus({ days: messageHistoryDays }).toJSDate();
  const financeCutoff = now.minus({ days: financeHistoryDays }).toJSDate();

  const requestsPurged = await DataSubjectRequest.destroy({
    where: {
      status: 'completed',
      processedAt: { [Op.lt]: requestCutoff }
    }
  });
  const messagesPurged = await MessageHistory.destroy({ where: { capturedAt: { [Op.lt]: messageCutoff } } });
  const financePurged = await FinanceTransactionHistory.destroy({ where: { occurredAt: { [Op.lt]: financeCutoff } } });

  if (requestsPurged > 0 || messagesPurged > 0 || financePurged > 0) {
    logger.info(
      `Data governance purge removed ${requestsPurged} completed requests, ${messagesPurged} message history records, and ${financePurged} finance snapshots beyond policy windows.`
    );
  }
}
