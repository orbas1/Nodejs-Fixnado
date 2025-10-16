import { validationResult } from 'express-validator';
import {
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
} from '../services/customerControlService.js';
import {
  CustomerDisputeTask,
  CustomerDisputeNote,
  CustomerDisputeEvidence,
  Dispute
} from '../models/index.js';

const PROFILE_FIELDS = [
  'preferredName',
  'companyName',
  'jobTitle',
  'primaryEmail',
  'primaryPhone',
  'preferredContactMethod',
  'billingEmail',
  'timezone',
  'locale',
  'defaultCurrency',
  'avatarUrl',
  'coverImageUrl',
  'supportNotes',
  'escalationWindowMinutes',
  'marketingOptIn',
  'notificationsEmailOptIn',
  'notificationsSmsOptIn'
];

const CONTACT_FIELDS = ['name', 'role', 'email', 'phone', 'contactType', 'isPrimary', 'notes', 'avatarUrl'];
const LOCATION_FIELDS = [
  'label',
  'addressLine1',
  'addressLine2',
  'city',
  'region',
  'postalCode',
  'country',
  'accessNotes',
  'isPrimary'
];

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
const DISPUTE_NOTE_FIELDS = ['noteType', 'visibility', 'body', 'nextSteps', 'pinned'];
const DISPUTE_EVIDENCE_FIELDS = ['label', 'fileUrl', 'fileType', 'thumbnailUrl', 'notes'];

const CASE_STATUS_VALUES = ['draft', 'open', 'under_review', 'awaiting_customer', 'resolved', 'closed'];
const CASE_SEVERITY_VALUES = ['low', 'medium', 'high', 'critical'];
const CASE_CATEGORY_VALUES = ['billing', 'service_quality', 'damage', 'timeline', 'compliance', 'other'];
const TASK_STATUS_VALUES = ['pending', 'in_progress', 'completed', 'cancelled'];
const NOTE_TYPE_VALUES = ['update', 'call', 'decision', 'escalation', 'reminder', 'other'];
const NOTE_VISIBILITY_VALUES = ['customer', 'internal', 'provider', 'finance', 'compliance'];

function extractPayload(source, fields) {
  const payload = {};
  fields.forEach((field) => {
    if (Object.hasOwn(source, field)) {
      payload[field] = source[field];
    }
  });
  return payload;
}

function normaliseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return undefined;
}

function sanitiseProfileInput(body) {
  const payload = extractPayload(body, PROFILE_FIELDS);
  if (Object.hasOwn(payload, 'marketingOptIn')) {
    const normalised = normaliseBoolean(payload.marketingOptIn);
    if (typeof normalised === 'boolean') {
      payload.marketingOptIn = normalised;
    }
  }
  if (Object.hasOwn(payload, 'notificationsEmailOptIn')) {
    const normalised = normaliseBoolean(payload.notificationsEmailOptIn);
    if (typeof normalised === 'boolean') {
      payload.notificationsEmailOptIn = normalised;
    }
  }
  if (Object.hasOwn(payload, 'notificationsSmsOptIn')) {
    const normalised = normaliseBoolean(payload.notificationsSmsOptIn);
    if (typeof normalised === 'boolean') {
      payload.notificationsSmsOptIn = normalised;
    }
  }
  if (Object.hasOwn(payload, 'escalationWindowMinutes')) {
    const parsed = Number.parseInt(payload.escalationWindowMinutes, 10);
    if (Number.isFinite(parsed)) {
      payload.escalationWindowMinutes = parsed;
    } else {
      delete payload.escalationWindowMinutes;
    }
  }
  return payload;
}

function sanitiseContactInput(body) {
  const payload = extractPayload(body, CONTACT_FIELDS);
  if (Object.hasOwn(payload, 'isPrimary')) {
    const normalised = normaliseBoolean(payload.isPrimary);
    if (typeof normalised === 'boolean') {
      payload.isPrimary = normalised;
    }
  }
  return payload;
}

function sanitiseLocationInput(body) {
  const payload = extractPayload(body, LOCATION_FIELDS);
  if (Object.hasOwn(payload, 'isPrimary')) {
    const normalised = normaliseBoolean(payload.isPrimary);
    if (typeof normalised === 'boolean') {
      payload.isPrimary = normalised;
    }
  }
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
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function sanitiseDisputeCaseInput(body) {
  const payload = extractPayload(body, DISPUTE_CASE_FIELDS);

  if (Object.hasOwn(payload, 'caseNumber')) {
    const stringValue = coerceString(payload.caseNumber);
    if (stringValue !== undefined) {
      payload.caseNumber = stringValue;
    } else {
      delete payload.caseNumber;
    }
  }

  ['title', 'summary', 'nextStep', 'assignedTeam', 'assignedOwner', 'resolutionNotes', 'externalReference', 'currency'].forEach(
    (field) => {
      if (Object.hasOwn(payload, field)) {
        const stringValue = coerceString(payload[field]);
        if (stringValue !== undefined) {
          payload[field] = stringValue;
        } else {
          delete payload[field];
        }
      }
    }
  );

  if (Object.hasOwn(payload, 'status')) {
    const stringValue = coerceString(payload.status);
    if (stringValue && CASE_STATUS_VALUES.includes(stringValue)) {
      payload.status = stringValue;
    } else if (stringValue) {
      payload.status = stringValue;
    } else {
      delete payload.status;
    }
  }

  if (Object.hasOwn(payload, 'severity')) {
    const stringValue = coerceString(payload.severity);
    if (stringValue && CASE_SEVERITY_VALUES.includes(stringValue)) {
      payload.severity = stringValue;
    } else if (!stringValue) {
      delete payload.severity;
    }
  }

  if (Object.hasOwn(payload, 'category')) {
    const stringValue = coerceString(payload.category);
    if (stringValue && CASE_CATEGORY_VALUES.includes(stringValue)) {
      payload.category = stringValue;
    } else if (!stringValue) {
      delete payload.category;
    }
  }

  if (Object.hasOwn(payload, 'amountDisputed')) {
    const parsed = Number.parseFloat(payload.amountDisputed);
    if (Number.isFinite(parsed)) {
      payload.amountDisputed = parsed;
    } else {
      delete payload.amountDisputed;
    }
  }

  ['openedAt', 'dueAt', 'resolvedAt', 'slaDueAt', 'lastReviewedAt'].forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      const dateValue = coerceDate(payload[field]);
      if (dateValue) {
        payload[field] = dateValue;
      } else {
        delete payload[field];
      }
    }
  });

  if (Object.hasOwn(payload, 'requiresFollowUp')) {
    const normalised = normaliseBoolean(payload.requiresFollowUp);
    if (typeof normalised === 'boolean') {
      payload.requiresFollowUp = normalised;
    } else {
      delete payload.requiresFollowUp;
    }
  }

  if (Object.hasOwn(payload, 'disputeId')) {
    const value = coerceString(payload.disputeId);
    if (value) {
      payload.disputeId = value;
    } else {
      delete payload.disputeId;
    }
  }

  return payload;
}

function sanitiseDisputeTaskInput(body) {
  const payload = extractPayload(body, DISPUTE_TASK_FIELDS);

  if (Object.hasOwn(payload, 'label')) {
    const stringValue = coerceString(payload.label);
    if (stringValue) {
      payload.label = stringValue;
    } else {
      delete payload.label;
    }
  }

  if (Object.hasOwn(payload, 'status')) {
    const stringValue = coerceString(payload.status);
    if (stringValue && TASK_STATUS_VALUES.includes(stringValue)) {
      payload.status = stringValue;
    } else if (!stringValue) {
      delete payload.status;
    }
  }

  ['assignedTo', 'instructions'].forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      const stringValue = coerceString(payload[field]);
      if (stringValue !== undefined) {
        payload[field] = stringValue;
      } else {
        delete payload[field];
      }
    }
  });

  ['dueAt', 'completedAt'].forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      const dateValue = coerceDate(payload[field]);
      if (dateValue) {
        payload[field] = dateValue;
      } else {
        delete payload[field];
      }
    }
  });

  return payload;
}

function sanitiseDisputeNoteInput(body) {
  const payload = extractPayload(body, DISPUTE_NOTE_FIELDS);

  if (Object.hasOwn(payload, 'noteType')) {
    const stringValue = coerceString(payload.noteType);
    if (stringValue && NOTE_TYPE_VALUES.includes(stringValue)) {
      payload.noteType = stringValue;
    } else if (!stringValue) {
      delete payload.noteType;
    }
  }

  if (Object.hasOwn(payload, 'visibility')) {
    const stringValue = coerceString(payload.visibility);
    if (stringValue && NOTE_VISIBILITY_VALUES.includes(stringValue)) {
      payload.visibility = stringValue;
    } else if (!stringValue) {
      delete payload.visibility;
    }
  }

  if (Object.hasOwn(payload, 'body')) {
    const stringValue = coerceString(payload.body);
    if (stringValue) {
      payload.body = stringValue;
    }
  }

  if (Object.hasOwn(payload, 'nextSteps')) {
    const stringValue = coerceString(payload.nextSteps);
    if (stringValue !== undefined) {
      payload.nextSteps = stringValue;
    } else {
      delete payload.nextSteps;
    }
  }

  if (Object.hasOwn(payload, 'pinned')) {
    const normalised = normaliseBoolean(payload.pinned);
    if (typeof normalised === 'boolean') {
      payload.pinned = normalised;
    } else {
      delete payload.pinned;
    }
  }

  return payload;
}

function sanitiseDisputeEvidenceInput(body) {
  const payload = extractPayload(body, DISPUTE_EVIDENCE_FIELDS);

  ['label', 'fileUrl', 'fileType', 'thumbnailUrl', 'notes'].forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      const stringValue = coerceString(payload[field]);
      if (stringValue !== undefined) {
        payload[field] = stringValue;
      } else {
        delete payload[field];
      }
    }
  });

  return payload;
}

function buildAuditContext(req) {
  return {
    actorId: req.auth?.actor?.actorId ?? req.user?.id ?? null,
    actorRole: req.auth?.actor?.role ?? req.user?.role ?? 'user',
    actorPersona: req.auth?.actor?.persona ?? req.user?.persona ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    correlationId: req.headers['x-request-id'] ?? req.headers['x-correlation-id'] ?? null
  };
}

function handleServiceError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

function serialiseProfile(profile) {
  if (!profile) {
    return null;
  }
  const payload = profile.toJSON();
  return {
    id: payload.id,
    userId: payload.userId,
    preferredName: payload.preferredName ?? '',
    companyName: payload.companyName ?? '',
    jobTitle: payload.jobTitle ?? '',
    primaryEmail: payload.primaryEmail ?? '',
    primaryPhone: payload.primaryPhone ?? '',
    preferredContactMethod: payload.preferredContactMethod ?? '',
    billingEmail: payload.billingEmail ?? '',
    timezone: payload.timezone ?? '',
    locale: payload.locale ?? '',
    defaultCurrency: payload.defaultCurrency ?? '',
    avatarUrl: payload.avatarUrl ?? '',
    coverImageUrl: payload.coverImageUrl ?? '',
    supportNotes: payload.supportNotes ?? '',
    escalationWindowMinutes: payload.escalationWindowMinutes ?? 120,
    marketingOptIn: payload.marketingOptIn ?? false,
    notificationsEmailOptIn: payload.notificationsEmailOptIn ?? true,
    notificationsSmsOptIn: payload.notificationsSmsOptIn ?? false,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseContact(contact) {
  const payload = contact.toJSON();
  return {
    id: payload.id,
    userId: payload.userId,
    name: payload.name ?? '',
    role: payload.role ?? '',
    email: payload.email ?? '',
    phone: payload.phone ?? '',
    contactType: payload.contactType,
    isPrimary: Boolean(payload.isPrimary),
    notes: payload.notes ?? '',
    avatarUrl: payload.avatarUrl ?? '',
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseLocation(location) {
  const payload = location.toJSON();
  return {
    id: payload.id,
    userId: payload.userId,
    label: payload.label ?? '',
    addressLine1: payload.addressLine1 ?? '',
    addressLine2: payload.addressLine2 ?? '',
    city: payload.city ?? '',
    region: payload.region ?? '',
    postalCode: payload.postalCode ?? '',
    country: payload.country ?? '',
    accessNotes: payload.accessNotes ?? '',
    isPrimary: Boolean(payload.isPrimary),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

const DISPUTE_CASE_INCLUDES = [
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
];

async function hydrateDisputeCase(disputeCase) {
  if (!disputeCase) {
    return null;
  }
  await disputeCase.reload({ include: DISPUTE_CASE_INCLUDES });
  return disputeCase;
}

function serialiseDisputeTask(task) {
  const payload = task.toJSON();
  return {
    id: payload.id,
    disputeCaseId: payload.disputeCaseId,
    label: payload.label ?? '',
    status: payload.status,
    dueAt: payload.dueAt,
    assignedTo: payload.assignedTo ?? '',
    instructions: payload.instructions ?? '',
    completedAt: payload.completedAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseDisputeNote(note) {
  const payload = note.toJSON();
  return {
    id: payload.id,
    disputeCaseId: payload.disputeCaseId,
    authorId: payload.authorId,
    noteType: payload.noteType,
    visibility: payload.visibility,
    body: payload.body ?? '',
    nextSteps: payload.nextSteps ?? '',
    pinned: Boolean(payload.pinned),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseDisputeEvidence(evidence) {
  const payload = evidence.toJSON();
  return {
    id: payload.id,
    disputeCaseId: payload.disputeCaseId,
    uploadedBy: payload.uploadedBy,
    label: payload.label ?? '',
    fileUrl: payload.fileUrl ?? '',
    fileType: payload.fileType ?? '',
    thumbnailUrl: payload.thumbnailUrl ?? '',
    notes: payload.notes ?? '',
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
    userId: payload.userId,
    disputeId: payload.disputeId,
    caseNumber: payload.caseNumber,
    title: payload.title ?? '',
    category: payload.category,
    status: payload.status,
    severity: payload.severity,
    summary: payload.summary ?? '',
    nextStep: payload.nextStep ?? '',
    assignedTeam: payload.assignedTeam ?? '',
    assignedOwner: payload.assignedOwner ?? '',
    resolutionNotes: payload.resolutionNotes ?? '',
    externalReference: payload.externalReference ?? '',
    amountDisputed: payload.amountDisputed ?? null,
    currency: payload.currency ?? '',
    openedAt: payload.openedAt,
    dueAt: payload.dueAt,
    resolvedAt: payload.resolvedAt,
    slaDueAt: payload.slaDueAt,
    requiresFollowUp: Boolean(payload.requiresFollowUp),
    lastReviewedAt: payload.lastReviewedAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    tasks: Array.isArray(disputeCase.tasks) ? disputeCase.tasks.map(serialiseDisputeTask) : [],
    notes: Array.isArray(disputeCase.notes) ? disputeCase.notes.map(serialiseDisputeNote) : [],
    evidence: Array.isArray(disputeCase.evidence)
      ? disputeCase.evidence.map(serialiseDisputeEvidence)
      : [],
    platformDispute: disputeCase.platformDispute
      ? {
          id: disputeCase.platformDispute.id,
          status: disputeCase.platformDispute.status,
          openedAt: disputeCase.platformDispute.openedAt ?? null,
          closedAt: disputeCase.platformDispute.closedAt ?? null
        }
      : null
  };
}

export async function getCustomerOverview(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const { profile, contacts, locations, disputes } = await loadCustomerOverview(userId);

    const metrics = disputes?.metrics ?? {
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
      totalDisputedAmount: 0,
      totalCases: 0
    };

    return res.json({
      profile: serialiseProfile(profile),
      contacts: contacts.map(serialiseContact),
      locations: locations.map(serialiseLocation),
      disputes: {
        cases: Array.isArray(disputes?.cases) ? disputes.cases.map(serialiseDisputeCase) : [],
        metrics: {
          ...metrics,
          totalDisputedAmount: Number.isFinite(metrics.totalDisputedAmount)
            ? Number(metrics.totalDisputedAmount)
            : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function upsertCustomerProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseProfileInput(req.body ?? {});
    const profile = await persistCustomerProfile({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ profile: serialiseProfile(profile) });
  } catch (error) {
    next(error);
  }
}

export async function createCustomerContact(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseContactInput(req.body ?? {});
    const contact = await createCustomerContactRecord({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });
    return res.status(201).json({ contact: serialiseContact(contact) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerContact(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const contactId = req.params.contactId;
    const payload = sanitiseContactInput(req.body ?? {});
    const contact = await updateCustomerContactRecord({
      userId,
      contactId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ contact: serialiseContact(contact) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerContact(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const contactId = req.params.contactId;
    await deleteCustomerContactRecord({
      userId,
      contactId,
      auditContext: buildAuditContext(req)
    });
    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCustomerLocation(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseLocationInput(req.body ?? {});
    const location = await createCustomerLocationRecord({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });
    return res.status(201).json({ location: serialiseLocation(location) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerLocation(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const locationId = req.params.locationId;
    const payload = sanitiseLocationInput(req.body ?? {});
    const location = await updateCustomerLocationRecord({
      userId,
      locationId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ location: serialiseLocation(location) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerLocation(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const locationId = req.params.locationId;
    await deleteCustomerLocationRecord({
      userId,
      locationId,
      auditContext: buildAuditContext(req)
    });
    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCustomerDisputeCase(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseDisputeCaseInput(req.body ?? {});
    const disputeCase = await createCustomerDisputeCaseRecord({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });

    await hydrateDisputeCase(disputeCase);

    return res.status(201).json({ case: serialiseDisputeCase(disputeCase) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerDisputeCase(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseDisputeCaseInput(req.body ?? {});
    const disputeCase = await updateCustomerDisputeCaseRecord({
      userId,
      disputeCaseId,
      payload,
      auditContext: buildAuditContext(req)
    });

    await hydrateDisputeCase(disputeCase);

    return res.json({ case: serialiseDisputeCase(disputeCase) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerDisputeCase(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const disputeCaseId = req.params.disputeCaseId;
    await deleteCustomerDisputeCaseRecord({
      userId,
      disputeCaseId,
      auditContext: buildAuditContext(req)
    });

    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCustomerDisputeTask(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseDisputeTaskInput(req.body ?? {});
    const task = await createCustomerDisputeTaskRecord({
      userId,
      disputeCaseId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.status(201).json({ task: serialiseDisputeTask(task) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerDisputeTask(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const taskId = req.params.taskId;
    const payload = sanitiseDisputeTaskInput(req.body ?? {});
    const task = await updateCustomerDisputeTaskRecord({
      userId,
      disputeCaseId,
      taskId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ task: serialiseDisputeTask(task) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerDisputeTask(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const taskId = req.params.taskId;

    await deleteCustomerDisputeTaskRecord({
      userId,
      disputeCaseId,
      taskId,
      auditContext: buildAuditContext(req)
    });

    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCustomerDisputeNote(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseDisputeNoteInput(req.body ?? {});
    const note = await createCustomerDisputeNoteRecord({
      userId,
      disputeCaseId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.status(201).json({ note: serialiseDisputeNote(note) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerDisputeNote(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const noteId = req.params.noteId;
    const payload = sanitiseDisputeNoteInput(req.body ?? {});
    const note = await updateCustomerDisputeNoteRecord({
      userId,
      disputeCaseId,
      noteId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ note: serialiseDisputeNote(note) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerDisputeNote(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const noteId = req.params.noteId;

    await deleteCustomerDisputeNoteRecord({
      userId,
      disputeCaseId,
      noteId,
      auditContext: buildAuditContext(req)
    });

    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCustomerDisputeEvidence(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const payload = sanitiseDisputeEvidenceInput(req.body ?? {});
    const evidence = await createCustomerDisputeEvidenceRecord({
      userId,
      disputeCaseId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.status(201).json({ evidence: serialiseDisputeEvidence(evidence) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerDisputeEvidence(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const evidenceId = req.params.evidenceId;
    const payload = sanitiseDisputeEvidenceInput(req.body ?? {});
    const evidence = await updateCustomerDisputeEvidenceRecord({
      userId,
      disputeCaseId,
      evidenceId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ evidence: serialiseDisputeEvidence(evidence) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerDisputeEvidence(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const disputeCaseId = req.params.disputeCaseId;
    const evidenceId = req.params.evidenceId;

    await deleteCustomerDisputeEvidenceRecord({
      userId,
      disputeCaseId,
      evidenceId,
      auditContext: buildAuditContext(req)
    });

    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
