import { validationResult } from 'express-validator';
import {
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
} from '../services/servicemanControlService.js';

const DISPUTE_CASE_FIELDS = [
  'caseNumber',
  'disputeId',
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
  'lastReviewedAt'
];

const DISPUTE_TASK_FIELDS = ['label', 'status', 'dueAt', 'assignedTo', 'instructions', 'completedAt'];
const DISPUTE_NOTE_FIELDS = ['noteType', 'visibility', 'body', 'nextSteps', 'pinned', 'authorId'];
const DISPUTE_EVIDENCE_FIELDS = ['label', 'fileUrl', 'fileType', 'thumbnailUrl', 'notes', 'uploadedBy'];

function extractPayload(source, fields) {
  const payload = {};
  fields.forEach((field) => {
    if (Object.hasOwn(source, field)) {
      payload[field] = source[field];
    }
  });
  return payload;
}

function coerceString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const stringValue = `${value}`.trim();
  return stringValue || undefined;
}

function coerceDate(value) {
  if (!value && value !== 0) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function sanitiseCaseInput(body) {
  const payload = extractPayload(body, DISPUTE_CASE_FIELDS);

  if (Object.hasOwn(payload, 'caseNumber')) {
    payload.caseNumber = coerceString(payload.caseNumber);
  }
  if (Object.hasOwn(payload, 'disputeId')) {
    payload.disputeId = coerceString(payload.disputeId);
  }
  if (Object.hasOwn(payload, 'summary')) {
    payload.summary = coerceString(payload.summary);
  }
  if (Object.hasOwn(payload, 'nextStep')) {
    payload.nextStep = coerceString(payload.nextStep);
  }
  if (Object.hasOwn(payload, 'assignedTeam')) {
    payload.assignedTeam = coerceString(payload.assignedTeam);
  }
  if (Object.hasOwn(payload, 'assignedOwner')) {
    payload.assignedOwner = coerceString(payload.assignedOwner);
  }
  if (Object.hasOwn(payload, 'resolutionNotes')) {
    payload.resolutionNotes = coerceString(payload.resolutionNotes);
  }
  if (Object.hasOwn(payload, 'externalReference')) {
    payload.externalReference = coerceString(payload.externalReference);
  }
  if (Object.hasOwn(payload, 'currency')) {
    payload.currency = coerceString(payload.currency) ?? 'GBP';
  }
  if (Object.hasOwn(payload, 'amountDisputed')) {
    const parsed = Number.parseFloat(payload.amountDisputed);
    payload.amountDisputed = Number.isFinite(parsed) ? parsed : null;
  }
  if (Object.hasOwn(payload, 'openedAt')) {
    payload.openedAt = coerceDate(payload.openedAt);
  }
  if (Object.hasOwn(payload, 'dueAt')) {
    payload.dueAt = coerceDate(payload.dueAt);
  }
  if (Object.hasOwn(payload, 'resolvedAt')) {
    payload.resolvedAt = coerceDate(payload.resolvedAt);
  }
  if (Object.hasOwn(payload, 'slaDueAt')) {
    payload.slaDueAt = coerceDate(payload.slaDueAt);
  }
  if (Object.hasOwn(payload, 'lastReviewedAt')) {
    payload.lastReviewedAt = coerceDate(payload.lastReviewedAt);
  }
  if (Object.hasOwn(payload, 'requiresFollowUp')) {
    payload.requiresFollowUp = Boolean(payload.requiresFollowUp);
  }

  return payload;
}

function sanitiseTaskInput(body) {
  const payload = extractPayload(body, DISPUTE_TASK_FIELDS);
  if (Object.hasOwn(payload, 'label')) {
    payload.label = coerceString(payload.label);
  }
  if (Object.hasOwn(payload, 'assignedTo')) {
    payload.assignedTo = coerceString(payload.assignedTo);
  }
  if (Object.hasOwn(payload, 'instructions')) {
    payload.instructions = coerceString(payload.instructions);
  }
  if (Object.hasOwn(payload, 'dueAt')) {
    payload.dueAt = coerceDate(payload.dueAt);
  }
  if (Object.hasOwn(payload, 'completedAt')) {
    payload.completedAt = coerceDate(payload.completedAt);
  }
  return payload;
}

function sanitiseNoteInput(body) {
  const payload = extractPayload(body, DISPUTE_NOTE_FIELDS);
  if (Object.hasOwn(payload, 'body')) {
    payload.body = coerceString(payload.body);
  }
  if (Object.hasOwn(payload, 'nextSteps')) {
    payload.nextSteps = coerceString(payload.nextSteps);
  }
  if (Object.hasOwn(payload, 'authorId')) {
    payload.authorId = coerceString(payload.authorId);
  }
  if (Object.hasOwn(payload, 'pinned')) {
    payload.pinned = Boolean(payload.pinned);
  }
  return payload;
}

function sanitiseEvidenceInput(body) {
  const payload = extractPayload(body, DISPUTE_EVIDENCE_FIELDS);
  if (Object.hasOwn(payload, 'label')) {
    payload.label = coerceString(payload.label);
  }
  if (Object.hasOwn(payload, 'fileUrl')) {
    payload.fileUrl = coerceString(payload.fileUrl);
  }
  if (Object.hasOwn(payload, 'fileType')) {
    payload.fileType = coerceString(payload.fileType);
  }
  if (Object.hasOwn(payload, 'thumbnailUrl')) {
    payload.thumbnailUrl = coerceString(payload.thumbnailUrl);
  }
  if (Object.hasOwn(payload, 'notes')) {
    payload.notes = coerceString(payload.notes);
  }
  if (Object.hasOwn(payload, 'uploadedBy')) {
    payload.uploadedBy = coerceString(payload.uploadedBy);
  }
  return payload;
}

function serialiseDisputeTask(task) {
  if (!task) {
    return null;
  }
  const payload = task.toJSON();
  return {
    id: payload.id,
    disputeCaseId: payload.disputeCaseId,
    label: payload.label,
    status: payload.status,
    dueAt: payload.dueAt,
    assignedTo: payload.assignedTo,
    instructions: payload.instructions,
    completedAt: payload.completedAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseDisputeNote(note) {
  if (!note) {
    return null;
  }
  const payload = note.toJSON();
  return {
    id: payload.id,
    disputeCaseId: payload.disputeCaseId,
    authorId: payload.authorId ?? null,
    author: payload.author
      ? {
          id: payload.author.id,
          name: [payload.author.firstName, payload.author.lastName].filter(Boolean).join(' ') || null
        }
      : null,
    noteType: payload.noteType,
    visibility: payload.visibility,
    body: payload.body,
    nextSteps: payload.nextSteps,
    pinned: Boolean(payload.pinned),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseDisputeEvidence(evidence) {
  if (!evidence) {
    return null;
  }
  const payload = evidence.toJSON();
  return {
    id: payload.id,
    disputeCaseId: payload.disputeCaseId,
    uploadedBy: payload.uploadedBy ?? null,
    uploader: payload.uploader
      ? {
          id: payload.uploader.id,
          name: [payload.uploader.firstName, payload.uploader.lastName].filter(Boolean).join(' ') || null
        }
      : null,
    label: payload.label,
    fileUrl: payload.fileUrl,
    fileType: payload.fileType,
    thumbnailUrl: payload.thumbnailUrl,
    notes: payload.notes,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseDisputeCase(disputeCase) {
  if (!disputeCase) {
    return null;
  }
  const payload = disputeCase.toJSON();
  return {
    id: payload.id,
    servicemanId: payload.servicemanId,
    disputeId: payload.disputeId,
    caseNumber: payload.caseNumber,
    title: payload.title,
    category: payload.category,
    status: payload.status,
    severity: payload.severity,
    summary: payload.summary,
    nextStep: payload.nextStep,
    assignedTeam: payload.assignedTeam,
    assignedOwner: payload.assignedOwner,
    resolutionNotes: payload.resolutionNotes,
    externalReference: payload.externalReference,
    amountDisputed: payload.amountDisputed,
    currency: payload.currency,
    openedAt: payload.openedAt,
    dueAt: payload.dueAt,
    resolvedAt: payload.resolvedAt,
    slaDueAt: payload.slaDueAt,
    requiresFollowUp: Boolean(payload.requiresFollowUp),
    lastReviewedAt: payload.lastReviewedAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    platformDispute: payload.platformDispute
      ? {
          id: payload.platformDispute.id,
          status: payload.platformDispute.status,
          openedAt: payload.platformDispute.openedAt ?? null,
          closedAt: payload.platformDispute.closedAt ?? null
        }
      : null,
    tasks: Array.isArray(payload.tasks) ? payload.tasks.map(serialiseDisputeTask).filter(Boolean) : [],
    notes: Array.isArray(payload.notes) ? payload.notes.map(serialiseDisputeNote).filter(Boolean) : [],
    evidence: Array.isArray(payload.evidence) ? payload.evidence.map(serialiseDisputeEvidence).filter(Boolean) : []
  };
}

function resolveAuditContext(req) {
  return {
    actorId: req.auth?.actor?.actorId ?? req.user?.id ?? null,
    actorRole: req.auth?.actor?.role ?? req.user?.role ?? 'serviceman',
    actorPersona: req.auth?.actor?.persona ?? req.user?.persona ?? 'serviceman',
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    correlationId: req.headers['x-request-id'] ?? null
  };
}

function ensureServiceman(req, res) {
  const servicemanId = req.user?.id;
  if (!servicemanId) {
    res.status(401).json({ message: 'authentication_required' });
    return null;
  }
  return servicemanId;
}

export async function getServicemanDisputes(req, res, next) {
  try {
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const workspace = await loadServicemanDisputeWorkspace(servicemanId);
    res.json({
      cases: workspace.cases.map(serialiseDisputeCase).filter(Boolean),
      metrics: workspace.metrics
    });
  } catch (error) {
    next(error);
  }
}

export async function createServicemanDisputeCase(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const payload = sanitiseCaseInput(req.body ?? {});
    const disputeCase = await createServicemanDisputeCaseRecord({
      servicemanId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.status(201).json({ case: serialiseDisputeCase(disputeCase) });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanDisputeCase(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseCaseInput(req.body ?? {});
    const disputeCase = await updateServicemanDisputeCaseRecord({
      servicemanId,
      disputeCaseId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.json({ case: serialiseDisputeCase(disputeCase) });
  } catch (error) {
    next(error);
  }
}

export async function deleteServicemanDisputeCase(req, res, next) {
  try {
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    await deleteServicemanDisputeCaseRecord({
      servicemanId,
      disputeCaseId,
      auditContext: resolveAuditContext(req)
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createServicemanDisputeTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseTaskInput(req.body ?? {});
    const task = await createServicemanDisputeTaskRecord({
      servicemanId,
      disputeCaseId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.status(201).json({ task: serialiseDisputeTask(task) });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanDisputeTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const taskId = req.params.taskId;
    const payload = sanitiseTaskInput(req.body ?? {});
    const task = await updateServicemanDisputeTaskRecord({
      servicemanId,
      disputeCaseId,
      taskId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.json({ task: serialiseDisputeTask(task) });
  } catch (error) {
    next(error);
  }
}

export async function deleteServicemanDisputeTask(req, res, next) {
  try {
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const taskId = req.params.taskId;
    await deleteServicemanDisputeTaskRecord({
      servicemanId,
      disputeCaseId,
      taskId,
      auditContext: resolveAuditContext(req)
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createServicemanDisputeNote(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseNoteInput(req.body ?? {});
    const note = await createServicemanDisputeNoteRecord({
      servicemanId,
      disputeCaseId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.status(201).json({ note: serialiseDisputeNote(note) });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanDisputeNote(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const noteId = req.params.noteId;
    const payload = sanitiseNoteInput(req.body ?? {});
    const note = await updateServicemanDisputeNoteRecord({
      servicemanId,
      disputeCaseId,
      noteId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.json({ note: serialiseDisputeNote(note) });
  } catch (error) {
    next(error);
  }
}

export async function deleteServicemanDisputeNote(req, res, next) {
  try {
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const noteId = req.params.noteId;
    await deleteServicemanDisputeNoteRecord({
      servicemanId,
      disputeCaseId,
      noteId,
      auditContext: resolveAuditContext(req)
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createServicemanDisputeEvidence(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseEvidenceInput(req.body ?? {});
    const evidence = await createServicemanDisputeEvidenceRecord({
      servicemanId,
      disputeCaseId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.status(201).json({ evidence: serialiseDisputeEvidence(evidence) });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanDisputeEvidence(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const evidenceId = req.params.evidenceId;
    const payload = sanitiseEvidenceInput(req.body ?? {});
    const evidence = await updateServicemanDisputeEvidenceRecord({
      servicemanId,
      disputeCaseId,
      evidenceId,
      payload,
      auditContext: resolveAuditContext(req)
    });

    res.json({ evidence: serialiseDisputeEvidence(evidence) });
  } catch (error) {
    next(error);
  }
}

export async function deleteServicemanDisputeEvidence(req, res, next) {
  try {
    const servicemanId = ensureServiceman(req, res);
    if (!servicemanId) {
      return;
    }

    const disputeCaseId = req.params.disputeCaseId;
    const evidenceId = req.params.evidenceId;
    await deleteServicemanDisputeEvidenceRecord({
      servicemanId,
      disputeCaseId,
      evidenceId,
      auditContext: resolveAuditContext(req)
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

