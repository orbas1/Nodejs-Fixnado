import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  CustomerProfile,
  CustomerContact,
  CustomerLocation,
  CustomerDisputeCase,
  CustomerDisputeTask,
  CustomerDisputeNote,
  CustomerDisputeEvidence,
  Dispute
} from '../models/index.js';
import { recordSecurityEvent } from './auditTrailService.js';

const CASE_STATUSES = new Set(['draft', 'open', 'under_review', 'awaiting_customer', 'resolved', 'closed']);
const CLOSED_CASE_STATUSES = new Set(['resolved', 'closed']);
const TASK_STATUSES = new Set(['pending', 'in_progress', 'completed', 'cancelled']);

function customerControlError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildAuditContext(auditContext = {}) {
  return {
    actorId: auditContext.actorId ?? null,
    actorRole: auditContext.actorRole ?? 'user',
    actorPersona: auditContext.actorPersona ?? null,
    ipAddress: auditContext.ipAddress ?? null,
    userAgent: auditContext.userAgent ?? null,
    correlationId: auditContext.correlationId ?? null
  };
}

async function recordCustomerControlEvent(userId, action, auditContext, metadata = {}) {
  const context = buildAuditContext(auditContext);
  await recordSecurityEvent({
    userId: context.actorId ?? userId,
    actorRole: context.actorRole,
    actorPersona: context.actorPersona,
    resource: 'customer.control',
    action,
    decision: 'allow',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
    metadata: {
      workspaceUserId: userId,
      ...metadata
    }
  });
}

async function generateCaseNumber(transaction) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `CD-${randomUUID().slice(0, 8).toUpperCase()}`;
    const existing = await CustomerDisputeCase.findOne({
      where: { caseNumber: candidate },
      transaction,
      lock: transaction?.LOCK?.UPDATE
    });
    if (!existing) {
      return candidate;
    }
  }
  throw customerControlError('unable_to_generate_case_number', 500);
}

async function ensureUniqueCaseNumber(caseNumber, { transaction, excludeId } = {}) {
  if (!caseNumber) {
    return;
  }
  const trimmed = caseNumber.trim();
  if (!trimmed) {
    return;
  }
  const existing = await CustomerDisputeCase.findOne({
    where: {
      caseNumber: trimmed,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
    },
    transaction,
    lock: transaction?.LOCK?.UPDATE
  });
  if (existing) {
    throw customerControlError('case_number_conflict', 409);
  }
}

async function resolveCaseNumber({ proposed, transaction, excludeId }) {
  if (proposed && proposed.trim()) {
    await ensureUniqueCaseNumber(proposed, { transaction, excludeId });
    return proposed.trim();
  }
  return generateCaseNumber(transaction);
}

async function findDisputeCaseForUser({ userId, disputeCaseId, transaction, lock = false }) {
  const query = {
    where: { id: disputeCaseId, userId },
    transaction
  };
  if (lock && transaction) {
    query.lock = transaction.LOCK.UPDATE;
  }
  const disputeCase = await CustomerDisputeCase.findOne(query);
  if (!disputeCase) {
    throw customerControlError('dispute_case_not_found', 404);
  }
  return disputeCase;
}

async function loadCustomerDisputeWorkspace(userId) {
  const cases = await CustomerDisputeCase.findAll({
    where: { userId },
    include: [
      {
        model: CustomerDisputeTask,
        as: 'tasks',
        separate: true,
        order: [
          ['status', 'ASC'],
          ['due_at', 'ASC'],
          ['created_at', 'ASC']
        ]
      },
      {
        model: CustomerDisputeNote,
        as: 'notes',
        separate: true,
        order: [['created_at', 'DESC']]
      },
      {
        model: CustomerDisputeEvidence,
        as: 'evidence',
        separate: true,
        order: [['created_at', 'DESC']]
      },
      {
        model: Dispute,
        as: 'platformDispute'
      }
    ],
    order: [['created_at', 'DESC']]
  });

  const metrics = cases.reduce(
    (acc, disputeCase) => {
      const status = disputeCase.status ?? 'draft';
      if (CASE_STATUSES.has(status)) {
        acc.statusCounts[status] = (acc.statusCounts[status] ?? 0) + 1;
      }
      if (disputeCase.requiresFollowUp) {
        acc.requiresFollowUp += 1;
      }
      const amount = disputeCase.amountDisputed ?? 0;
      if (Number.isFinite(amount)) {
        acc.totalDisputedAmount += amount;
      }
      if (
        disputeCase.dueAt &&
        !CLOSED_CASE_STATUSES.has(status) &&
        new Date(disputeCase.dueAt).getTime() < Date.now()
      ) {
        acc.overdue += 1;
      }
      if (disputeCase.tasks?.some((task) => TASK_STATUSES.has(task.status) && task.status !== 'completed')) {
        acc.activeTasks += 1;
      }
      return acc;
    },
    {
      statusCounts: {
        draft: 0,
        open: 0,
        under_review: 0,
        awaiting_customer: 0,
        resolved: 0,
        closed: 0
      },
      requiresFollowUp: 0,
      overdue: 0,
      activeTasks: 0,
      totalDisputedAmount: 0
    }
  );

  metrics.totalCases = cases.length;

  return { cases, metrics };
}

export async function loadCustomerOverview(userId) {
  const [profile, contacts, locations, disputes] = await Promise.all([
    CustomerProfile.findOne({ where: { userId } }),
    CustomerContact.findAll({
      where: { userId },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'ASC']
      ]
    }),
    CustomerLocation.findAll({
      where: { userId },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'ASC']
      ]
    }),
    loadCustomerDisputeWorkspace(userId)
  ]);

  return { profile, contacts, locations, disputes };
}

export async function persistCustomerProfile({ userId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const existingProfile = await CustomerProfile.findOne({
      where: { userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingProfile) {
      existingProfile.set(payload);
      const changed = existingProfile.changed() ?? [];
      await existingProfile.save({ transaction });
      await recordCustomerControlEvent(userId, 'customer.control:profile:update', auditContext, {
        profileId: existingProfile.id,
        changedFields: changed
      });
      return existingProfile;
    }

    const profile = await CustomerProfile.create({ userId, ...payload }, { transaction });
    await recordCustomerControlEvent(userId, 'customer.control:profile:create', auditContext, {
      profileId: profile.id,
      fields: Object.keys(payload)
    });
    return profile;
  });
}

export async function createCustomerContactRecord({ userId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const contact = await CustomerContact.create({ userId, ...payload }, { transaction });

    if (payload.isPrimary) {
      await CustomerContact.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: contact.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:contact:create', auditContext, {
      contactId: contact.id,
      isPrimary: contact.isPrimary
    });

    return contact;
  });
}

export async function updateCustomerContactRecord({ userId, contactId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const contact = await CustomerContact.findOne({
      where: { id: contactId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!contact) {
      throw customerControlError('contact_not_found', 404);
    }

    contact.set(payload);
    const changed = contact.changed() ?? [];
    await contact.save({ transaction });

    if (contact.isPrimary) {
      await CustomerContact.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: contact.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:contact:update', auditContext, {
      contactId: contact.id,
      changedFields: changed,
      isPrimary: contact.isPrimary
    });

    return contact;
  });
}

export async function deleteCustomerContactRecord({ userId, contactId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const contact = await CustomerContact.findOne({
      where: { id: contactId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!contact) {
      throw customerControlError('contact_not_found', 404);
    }

    const wasPrimary = contact.isPrimary;
    await contact.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:contact:delete', auditContext, {
      contactId,
      wasPrimary
    });

    return true;
  });
}

export async function createCustomerLocationRecord({ userId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const location = await CustomerLocation.create({ userId, ...payload }, { transaction });

    if (payload.isPrimary) {
      await CustomerLocation.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: location.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:location:create', auditContext, {
      locationId: location.id,
      isPrimary: location.isPrimary
    });

    return location;
  });
}

export async function updateCustomerLocationRecord({ userId, locationId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const location = await CustomerLocation.findOne({
      where: { id: locationId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!location) {
      throw customerControlError('location_not_found', 404);
    }

    location.set(payload);
    const changed = location.changed() ?? [];
    await location.save({ transaction });

    if (location.isPrimary) {
      await CustomerLocation.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: location.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:location:update', auditContext, {
      locationId: location.id,
      changedFields: changed,
      isPrimary: location.isPrimary
    });

    return location;
  });
}

export async function deleteCustomerLocationRecord({ userId, locationId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const location = await CustomerLocation.findOne({
      where: { id: locationId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!location) {
      throw customerControlError('location_not_found', 404);
    }

    const wasPrimary = location.isPrimary;
    await location.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:location:delete', auditContext, {
      locationId,
      wasPrimary
    });

    return true;
  });
}

export async function createCustomerDisputeCaseRecord({ userId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const caseNumber = await resolveCaseNumber({
      proposed: payload.caseNumber,
      transaction
    });

    const disputeCase = await CustomerDisputeCase.create(
      {
        userId,
        caseNumber,
        disputeId: payload.disputeId ?? null,
        title: payload.title,
        category: payload.category ?? 'billing',
        status: payload.status ?? 'draft',
        severity: payload.severity ?? 'medium',
        summary: payload.summary ?? null,
        nextStep: payload.nextStep ?? null,
        assignedTeam: payload.assignedTeam ?? null,
        assignedOwner: payload.assignedOwner ?? null,
        resolutionNotes: payload.resolutionNotes ?? null,
        externalReference: payload.externalReference ?? null,
        amountDisputed: payload.amountDisputed ?? null,
        currency: payload.currency ?? 'GBP',
        openedAt: payload.openedAt ?? new Date(),
        dueAt: payload.dueAt ?? null,
        resolvedAt: payload.resolvedAt ?? null,
        slaDueAt: payload.slaDueAt ?? null,
        requiresFollowUp: Boolean(payload.requiresFollowUp),
        lastReviewedAt: payload.lastReviewedAt ?? null
      },
      { transaction }
    );

    await recordCustomerControlEvent(userId, 'customer.control:disputeCase:create', auditContext, {
      caseId: disputeCase.id,
      caseNumber: disputeCase.caseNumber
    });

    return disputeCase;
  });
}

export async function updateCustomerDisputeCaseRecord({
  userId,
  disputeCaseId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    if (payload.caseNumber && payload.caseNumber !== disputeCase.caseNumber) {
      await resolveCaseNumber({
        proposed: payload.caseNumber,
        transaction,
        excludeId: disputeCase.id
      });
      disputeCase.caseNumber = payload.caseNumber;
    }

    const updatable = { ...payload };
    delete updatable.caseNumber;

    disputeCase.set(updatable);
    const changed = disputeCase.changed() ?? [];
    await disputeCase.save({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeCase:update', auditContext, {
      caseId: disputeCase.id,
      changedFields: changed
    });

    return disputeCase;
  });
}

export async function deleteCustomerDisputeCaseRecord({ userId, disputeCaseId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    await disputeCase.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeCase:delete', auditContext, {
      caseId: disputeCase.id,
      caseNumber: disputeCase.caseNumber
    });

    return true;
  });
}

export async function createCustomerDisputeTaskRecord({
  userId,
  disputeCaseId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const task = await CustomerDisputeTask.create(
      {
        disputeCaseId: disputeCase.id,
        label: payload.label,
        status: payload.status ?? 'pending',
        dueAt: payload.dueAt ?? null,
        assignedTo: payload.assignedTo ?? null,
        instructions: payload.instructions ?? null,
        completedAt: payload.completedAt ?? null
      },
      { transaction }
    );

    await recordCustomerControlEvent(userId, 'customer.control:disputeTask:create', auditContext, {
      caseId: disputeCase.id,
      taskId: task.id
    });

    return task;
  });
}

export async function updateCustomerDisputeTaskRecord({
  userId,
  disputeCaseId,
  taskId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const task = await CustomerDisputeTask.findOne({
      where: { id: taskId, disputeCaseId: disputeCase.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!task) {
      throw customerControlError('dispute_task_not_found', 404);
    }

    task.set(payload);
    const changed = task.changed() ?? [];
    await task.save({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeTask:update', auditContext, {
      caseId: disputeCase.id,
      taskId: task.id,
      changedFields: changed
    });

    return task;
  });
}

export async function deleteCustomerDisputeTaskRecord({
  userId,
  disputeCaseId,
  taskId,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const task = await CustomerDisputeTask.findOne({
      where: { id: taskId, disputeCaseId: disputeCase.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!task) {
      throw customerControlError('dispute_task_not_found', 404);
    }

    await task.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeTask:delete', auditContext, {
      caseId: disputeCase.id,
      taskId: task.id
    });

    return true;
  });
}

export async function createCustomerDisputeNoteRecord({
  userId,
  disputeCaseId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const authorId = payload.authorId ?? auditContext?.actorId ?? userId;
    const note = await CustomerDisputeNote.create(
      {
        disputeCaseId: disputeCase.id,
        authorId,
        noteType: payload.noteType ?? 'update',
        visibility: payload.visibility ?? 'customer',
        body: payload.body,
        nextSteps: payload.nextSteps ?? null,
        pinned: Boolean(payload.pinned)
      },
      { transaction }
    );

    await recordCustomerControlEvent(userId, 'customer.control:disputeNote:create', auditContext, {
      caseId: disputeCase.id,
      noteId: note.id,
      noteType: note.noteType
    });

    return note;
  });
}

export async function updateCustomerDisputeNoteRecord({
  userId,
  disputeCaseId,
  noteId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const note = await CustomerDisputeNote.findOne({
      where: { id: noteId, disputeCaseId: disputeCase.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!note) {
      throw customerControlError('dispute_note_not_found', 404);
    }

    note.set(payload);
    const changed = note.changed() ?? [];
    await note.save({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeNote:update', auditContext, {
      caseId: disputeCase.id,
      noteId: note.id,
      changedFields: changed
    });

    return note;
  });
}

export async function deleteCustomerDisputeNoteRecord({
  userId,
  disputeCaseId,
  noteId,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const note = await CustomerDisputeNote.findOne({
      where: { id: noteId, disputeCaseId: disputeCase.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!note) {
      throw customerControlError('dispute_note_not_found', 404);
    }

    await note.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeNote:delete', auditContext, {
      caseId: disputeCase.id,
      noteId: note.id
    });

    return true;
  });
}

export async function createCustomerDisputeEvidenceRecord({
  userId,
  disputeCaseId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const uploadedBy = payload.uploadedBy ?? auditContext?.actorId ?? userId;
    const evidence = await CustomerDisputeEvidence.create(
      {
        disputeCaseId: disputeCase.id,
        uploadedBy,
        label: payload.label,
        fileUrl: payload.fileUrl,
        fileType: payload.fileType ?? null,
        thumbnailUrl: payload.thumbnailUrl ?? null,
        notes: payload.notes ?? null
      },
      { transaction }
    );

    await recordCustomerControlEvent(userId, 'customer.control:disputeEvidence:create', auditContext, {
      caseId: disputeCase.id,
      evidenceId: evidence.id
    });

    return evidence;
  });
}

export async function updateCustomerDisputeEvidenceRecord({
  userId,
  disputeCaseId,
  evidenceId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const evidence = await CustomerDisputeEvidence.findOne({
      where: { id: evidenceId, disputeCaseId: disputeCase.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!evidence) {
      throw customerControlError('dispute_evidence_not_found', 404);
    }

    evidence.set(payload);
    const changed = evidence.changed() ?? [];
    await evidence.save({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeEvidence:update', auditContext, {
      caseId: disputeCase.id,
      evidenceId: evidence.id,
      changedFields: changed
    });

    return evidence;
  });
}

export async function deleteCustomerDisputeEvidenceRecord({
  userId,
  disputeCaseId,
  evidenceId,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForUser({
      userId,
      disputeCaseId,
      transaction,
      lock: true
    });

    const evidence = await CustomerDisputeEvidence.findOne({
      where: { id: evidenceId, disputeCaseId: disputeCase.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!evidence) {
      throw customerControlError('dispute_evidence_not_found', 404);
    }

    await evidence.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:disputeEvidence:delete', auditContext, {
      caseId: disputeCase.id,
      evidenceId: evidence.id
    });

    return true;
  });
}

export default {
  loadCustomerOverview,
  persistCustomerProfile,
  createCustomerContactRecord,
  updateCustomerContactRecord,
  deleteCustomerContactRecord,
  createCustomerLocationRecord,
  updateCustomerLocationRecord,
  deleteCustomerLocationRecord,
  createCustomerDisputeCaseRecord,
  updateCustomerDisputeCaseRecord,
  deleteCustomerDisputeCaseRecord,
  createCustomerDisputeTaskRecord,
  updateCustomerDisputeTaskRecord,
  deleteCustomerDisputeTaskRecord,
  createCustomerDisputeNoteRecord,
  updateCustomerDisputeNoteRecord,
  deleteCustomerDisputeNoteRecord,
  createCustomerDisputeEvidenceRecord,
  updateCustomerDisputeEvidenceRecord,
  deleteCustomerDisputeEvidenceRecord
};
