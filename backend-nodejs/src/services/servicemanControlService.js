import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  ServicemanDisputeCase,
  ServicemanDisputeTask,
  ServicemanDisputeNote,
  ServicemanDisputeEvidence,
  Dispute,
  User
} from '../models/index.js';
import { recordSecurityEvent } from './auditTrailService.js';

const CASE_STATUSES = new Set(['draft', 'open', 'under_review', 'awaiting_customer', 'resolved', 'closed']);
const CLOSED_CASE_STATUSES = new Set(['resolved', 'closed']);
const TASK_STATUSES = new Set(['pending', 'in_progress', 'completed', 'cancelled']);

function servicemanControlError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildAuditContext(auditContext = {}) {
  return {
    actorId: auditContext.actorId ?? null,
    actorRole: auditContext.actorRole ?? 'serviceman',
    actorPersona: auditContext.actorPersona ?? 'serviceman',
    ipAddress: auditContext.ipAddress ?? null,
    userAgent: auditContext.userAgent ?? null,
    correlationId: auditContext.correlationId ?? null
  };
}

async function recordServicemanControlEvent(servicemanId, action, auditContext, metadata = {}) {
  const context = buildAuditContext(auditContext);
  await recordSecurityEvent({
    userId: context.actorId ?? servicemanId,
    actorRole: context.actorRole,
    actorPersona: context.actorPersona ?? 'serviceman',
    resource: 'serviceman.control',
    action,
    decision: 'allow',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
    metadata: {
      servicemanId,
      ...metadata
    }
  });
}

async function generateCaseNumber(transaction) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `SD-${randomUUID().slice(0, 8).toUpperCase()}`;
    const existing = await ServicemanDisputeCase.findOne({
      where: { caseNumber: candidate },
      transaction,
      lock: transaction?.LOCK?.UPDATE
    });
    if (!existing) {
      return candidate;
    }
  }
  throw servicemanControlError('unable_to_generate_case_number', 500);
}

async function ensureUniqueCaseNumber(caseNumber, { transaction, excludeId } = {}) {
  if (!caseNumber) {
    return;
  }
  const trimmed = caseNumber.trim();
  if (!trimmed) {
    return;
  }
  const existing = await ServicemanDisputeCase.findOne({
    where: {
      caseNumber: trimmed,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
    },
    transaction,
    lock: transaction?.LOCK?.UPDATE
  });
  if (existing) {
    throw servicemanControlError('case_number_conflict', 409);
  }
}

async function resolveCaseNumber({ proposed, transaction, excludeId }) {
  if (proposed && proposed.trim()) {
    await ensureUniqueCaseNumber(proposed, { transaction, excludeId });
    return proposed.trim();
  }
  return generateCaseNumber(transaction);
}

async function findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction, lock = false }) {
  const query = {
    where: { id: disputeCaseId, servicemanId },
    transaction
  };
  if (lock && transaction) {
    query.lock = transaction.LOCK.UPDATE;
  }
  const disputeCase = await ServicemanDisputeCase.findOne(query);
  if (!disputeCase) {
    throw servicemanControlError('dispute_case_not_found', 404);
  }
  return disputeCase;
}

async function loadServicemanDisputeWorkspace(servicemanId) {
  const cases = await ServicemanDisputeCase.findAll({
    where: { servicemanId },
    include: [
      {
        model: ServicemanDisputeTask,
        as: 'tasks',
        separate: true,
        order: [
          ['status', 'ASC'],
          ['due_at', 'ASC'],
          ['created_at', 'ASC']
        ]
      },
      {
        model: ServicemanDisputeNote,
        as: 'notes',
        separate: true,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['created_at', 'DESC']]
      },
      {
        model: ServicemanDisputeEvidence,
        as: 'evidence',
        separate: true,
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
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

async function createServicemanDisputeCaseRecord({ servicemanId, payload, auditContext }) {
  if (!servicemanId) {
    throw servicemanControlError('serviceman_required', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const caseNumber = await resolveCaseNumber({ proposed: payload.caseNumber, transaction });
    const disputeCase = await ServicemanDisputeCase.create(
      {
        servicemanId,
        disputeId: payload.disputeId ?? null,
        caseNumber,
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
        openedAt: payload.openedAt ?? null,
        dueAt: payload.dueAt ?? null,
        resolvedAt: payload.resolvedAt ?? null,
        slaDueAt: payload.slaDueAt ?? null,
        requiresFollowUp: Boolean(payload.requiresFollowUp),
        lastReviewedAt: payload.lastReviewedAt ?? null
      },
      { transaction }
    );

    await recordServicemanControlEvent(servicemanId, 'dispute_case.created', auditContext, {
      disputeCaseId: disputeCase.id,
      status: disputeCase.status,
      severity: disputeCase.severity
    });

    return disputeCase;
  });
}

async function updateServicemanDisputeCaseRecord({ servicemanId, disputeCaseId, payload, auditContext }) {
  if (!servicemanId) {
    throw servicemanControlError('serviceman_required', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForServiceman({
      servicemanId,
      disputeCaseId,
      transaction,
      lock: true
    });

    if (payload.caseNumber && payload.caseNumber !== disputeCase.caseNumber) {
      const resolved = await resolveCaseNumber({
        proposed: payload.caseNumber,
        transaction,
        excludeId: disputeCase.id
      });
      disputeCase.caseNumber = resolved;
    }

    const fields = [
      'title',
      'category',
      'status',
      'severity',
      'summary',
      'nextStep',
      'assignedTeam',
      'assignedOwner',
      'resolutionNotes',
      'externalReference',
      'amountDisputed',
      'currency',
      'openedAt',
      'dueAt',
      'resolvedAt',
      'slaDueAt',
      'requiresFollowUp',
      'lastReviewedAt',
      'disputeId'
    ];

    fields.forEach((field) => {
      if (Object.hasOwn(payload, field)) {
        disputeCase[field] = payload[field];
      }
    });

    await disputeCase.save({ transaction });

    await recordServicemanControlEvent(servicemanId, 'dispute_case.updated', auditContext, {
      disputeCaseId,
      status: disputeCase.status,
      severity: disputeCase.severity
    });

    return disputeCase;
  });
}

async function deleteServicemanDisputeCaseRecord({ servicemanId, disputeCaseId, auditContext }) {
  if (!servicemanId) {
    throw servicemanControlError('serviceman_required', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const disputeCase = await findDisputeCaseForServiceman({
      servicemanId,
      disputeCaseId,
      transaction,
      lock: true
    });
    await disputeCase.destroy({ transaction });

    await recordServicemanControlEvent(servicemanId, 'dispute_case.deleted', auditContext, {
      disputeCaseId
    });

    return true;
  });
}

async function createServicemanDisputeTaskRecord({ servicemanId, disputeCaseId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const task = await ServicemanDisputeTask.create(
      {
        disputeCaseId,
        label: payload.label,
        status: payload.status ?? 'pending',
        dueAt: payload.dueAt ?? null,
        assignedTo: payload.assignedTo ?? null,
        instructions: payload.instructions ?? null,
        completedAt: payload.completedAt ?? null
      },
      { transaction }
    );

    await recordServicemanControlEvent(servicemanId, 'dispute_task.created', auditContext, {
      disputeCaseId,
      taskId: task.id,
      status: task.status
    });

    return task;
  });
}

async function updateServicemanDisputeTaskRecord({
  servicemanId,
  disputeCaseId,
  taskId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const task = await ServicemanDisputeTask.findOne({
      where: { id: taskId, disputeCaseId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!task) {
      throw servicemanControlError('dispute_task_not_found', 404);
    }

    const fields = ['label', 'status', 'dueAt', 'assignedTo', 'instructions', 'completedAt'];
    fields.forEach((field) => {
      if (Object.hasOwn(payload, field)) {
        task[field] = payload[field];
      }
    });

    await task.save({ transaction });

    await recordServicemanControlEvent(servicemanId, 'dispute_task.updated', auditContext, {
      disputeCaseId,
      taskId,
      status: task.status
    });

    return task;
  });
}

async function deleteServicemanDisputeTaskRecord({ servicemanId, disputeCaseId, taskId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const deleted = await ServicemanDisputeTask.destroy({
      where: { id: taskId, disputeCaseId },
      transaction
    });
    if (!deleted) {
      throw servicemanControlError('dispute_task_not_found', 404);
    }

    await recordServicemanControlEvent(servicemanId, 'dispute_task.deleted', auditContext, {
      disputeCaseId,
      taskId
    });

    return true;
  });
}

async function createServicemanDisputeNoteRecord({ servicemanId, disputeCaseId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const note = await ServicemanDisputeNote.create(
      {
        disputeCaseId,
        authorId: payload.authorId ?? auditContext?.actorId ?? servicemanId,
        noteType: payload.noteType ?? 'update',
        visibility: payload.visibility ?? 'internal',
        body: payload.body,
        nextSteps: payload.nextSteps ?? null,
        pinned: Boolean(payload.pinned)
      },
      { transaction }
    );

    await recordServicemanControlEvent(servicemanId, 'dispute_note.created', auditContext, {
      disputeCaseId,
      noteId: note.id,
      noteType: note.noteType
    });

    return note;
  });
}

async function updateServicemanDisputeNoteRecord({
  servicemanId,
  disputeCaseId,
  noteId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const note = await ServicemanDisputeNote.findOne({
      where: { id: noteId, disputeCaseId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!note) {
      throw servicemanControlError('dispute_note_not_found', 404);
    }

    const fields = ['noteType', 'visibility', 'body', 'nextSteps', 'pinned', 'authorId'];
    fields.forEach((field) => {
      if (Object.hasOwn(payload, field)) {
        note[field] = payload[field];
      }
    });

    await note.save({ transaction });

    await recordServicemanControlEvent(servicemanId, 'dispute_note.updated', auditContext, {
      disputeCaseId,
      noteId,
      noteType: note.noteType
    });

    return note;
  });
}

async function deleteServicemanDisputeNoteRecord({ servicemanId, disputeCaseId, noteId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const deleted = await ServicemanDisputeNote.destroy({
      where: { id: noteId, disputeCaseId },
      transaction
    });
    if (!deleted) {
      throw servicemanControlError('dispute_note_not_found', 404);
    }

    await recordServicemanControlEvent(servicemanId, 'dispute_note.deleted', auditContext, {
      disputeCaseId,
      noteId
    });

    return true;
  });
}

async function createServicemanDisputeEvidenceRecord({ servicemanId, disputeCaseId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const evidence = await ServicemanDisputeEvidence.create(
      {
        disputeCaseId,
        uploadedBy: payload.uploadedBy ?? auditContext?.actorId ?? servicemanId,
        label: payload.label,
        fileUrl: payload.fileUrl,
        fileType: payload.fileType ?? null,
        thumbnailUrl: payload.thumbnailUrl ?? null,
        notes: payload.notes ?? null
      },
      { transaction }
    );

    await recordServicemanControlEvent(servicemanId, 'dispute_evidence.created', auditContext, {
      disputeCaseId,
      evidenceId: evidence.id
    });

    return evidence;
  });
}

async function updateServicemanDisputeEvidenceRecord({
  servicemanId,
  disputeCaseId,
  evidenceId,
  payload,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const evidence = await ServicemanDisputeEvidence.findOne({
      where: { id: evidenceId, disputeCaseId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!evidence) {
      throw servicemanControlError('dispute_evidence_not_found', 404);
    }

    const fields = ['label', 'fileUrl', 'fileType', 'thumbnailUrl', 'notes', 'uploadedBy'];
    fields.forEach((field) => {
      if (Object.hasOwn(payload, field)) {
        evidence[field] = payload[field];
      }
    });

    await evidence.save({ transaction });

    await recordServicemanControlEvent(servicemanId, 'dispute_evidence.updated', auditContext, {
      disputeCaseId,
      evidenceId
    });

    return evidence;
  });
}

async function deleteServicemanDisputeEvidenceRecord({
  servicemanId,
  disputeCaseId,
  evidenceId,
  auditContext
}) {
  return sequelize.transaction(async (transaction) => {
    await findDisputeCaseForServiceman({ servicemanId, disputeCaseId, transaction });
    const deleted = await ServicemanDisputeEvidence.destroy({
      where: { id: evidenceId, disputeCaseId },
      transaction
    });
    if (!deleted) {
      throw servicemanControlError('dispute_evidence_not_found', 404);
    }

    await recordServicemanControlEvent(servicemanId, 'dispute_evidence.deleted', auditContext, {
      disputeCaseId,
      evidenceId
    });

    return true;
  });
}

export {
  loadServicemanDisputeWorkspace,
  createServicemanDisputeCaseRecord,
  updateServicemanDisputeCaseRecord,
  deleteServicemanDisputeCaseRecord,
  createServicemanDisputeTaskRecord,
  updateServicemanDisputeTaskRecord,
  deleteServicemanDisputeTaskRecord,
  createServicemanDisputeNoteRecord,
  updateServicemanDisputeNoteRecord,
  deleteServicemanDisputeNoteRecord,
  createServicemanDisputeEvidenceRecord,
  updateServicemanDisputeEvidenceRecord,
  deleteServicemanDisputeEvidenceRecord
};

