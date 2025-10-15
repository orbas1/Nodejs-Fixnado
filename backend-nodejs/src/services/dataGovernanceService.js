import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import config from '../config/index.js';
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

function dataGovernanceError(message, statusCode = 400) {
  const error = new Error(message);
  error.status = statusCode;
  return error;
}

async function resolveRegion(regionCode) {
  if (typeof regionCode !== 'string' || regionCode.trim() === '') {
    return Region.findOne({ where: { code: 'GB' } });
  }

  const region = await Region.findOne({ where: { code: regionCode.trim().toUpperCase() } });
  if (!region) {
    return resolveRegion('GB');
  }
  return region;
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

  if (typeof subjectEmail !== 'string' || subjectEmail.trim() === '') {
    throw dataGovernanceError('subjectEmail is required');
  }

  const region = await resolveRegion(regionCode);
  const user = await findSubjectUser({ userId, subjectEmail });

  const request = await DataSubjectRequest.create({
    userId: user ? user.id : userId,
    subjectEmail,
    requestType,
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

export async function listDataSubjectRequests({ status, limit = 50 }) {
  const where = {};
  if (status) {
    where.status = status;
  }

  return DataSubjectRequest.findAll({
    where,
    order: [['requestedAt', 'DESC']],
    include: [
      { model: Region, as: 'region' },
      { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'type'] }
    ],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 200)
  });
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

export async function updateDataSubjectRequestStatus(requestId, status, actorId = null, note = null) {
  if (!['received', 'in_progress', 'completed', 'rejected'].includes(status)) {
    throw dataGovernanceError(`Unsupported status: ${status}`);
  }

  const request = await DataSubjectRequest.findByPk(requestId);
  if (!request) {
    throw dataGovernanceError('Data subject request not found', 404);
  }

  request.status = status;
  if (status === 'completed') {
    request.processedAt = new Date();
  }

  appendAuditEntry(request, { action: 'status_update', actorId, note: note || `Status set to ${status}` });
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
