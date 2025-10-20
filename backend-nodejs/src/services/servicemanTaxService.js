import { Op } from 'sequelize';
import { z } from 'zod';
import validator from 'validator';
import {
  ServicemanTaxProfile,
  ServicemanTaxFiling,
  ServicemanTaxTask,
  ServicemanTaxDocument,
  User
} from './models/index.js';
import { normaliseCurrency } from '../utils/currency.js';

const PROFILE_FILING_STATUSES = ['sole_trader', 'limited_company', 'partnership', 'umbrella', 'other'];
const FILING_STATUSES = ['draft', 'pending', 'submitted', 'accepted', 'overdue', 'rejected', 'cancelled'];
const FILING_TYPES = ['self_assessment', 'vat_return', 'cis', 'payroll', 'other'];
const SUBMISSION_METHODS = ['online', 'paper', 'agent', 'api', 'other'];
const REMITTANCE_CYCLES = ['monthly', 'quarterly', 'annually', 'ad_hoc'];
const TASK_STATUSES = ['planned', 'in_progress', 'blocked', 'completed'];
const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const DOCUMENT_STATUSES = ['active', 'archived', 'superseded'];
const DOCUMENT_TYPES = ['evidence', 'receipt', 'correspondence', 'certificate', 'other'];

const truthySet = new Set(['true', '1', 'yes', 'y', 'on']);
const falsySet = new Set(['false', '0', 'no', 'n', 'off']);

const optionalStringField = (max) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const stringValue = String(value).trim();
    return stringValue.length ? stringValue : null;
  }, z.string().max(max).nullable());

const optionalBooleanField = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (truthySet.has(normalised)) {
      return true;
    }
    if (falsySet.has(normalised)) {
      return false;
    }
  }
  return Boolean(value);
}, z.boolean().nullable());

const optionalDecimalField = (max = Number.POSITIVE_INFINITY) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return value;
    }
    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().min(0).max(max).nullable());

const optionalDateField = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date;
}, z.date().nullable());

const FILING_DOCUMENT_SCHEMA = z
  .array(
    z.object({
      title: optionalStringField(160).refine((val) => val !== null, 'Document title is required'),
      fileUrl: optionalStringField(2048).refine((val) => val !== null, 'Document URL is required'),
      documentType: optionalStringField(32).optional()
    })
  )
  .optional();

const TASK_CHECKLIST_SCHEMA = z
  .array(
    z.object({
      id: optionalStringField(64).optional(),
      label: optionalStringField(160).refine((val) => val !== null, 'Checklist label is required'),
      completed: optionalBooleanField.optional()
    })
  )
  .optional();

const PROFILE_SCHEMA = z.object({
  filingStatus: optionalStringField(32),
  residencyCountry: optionalStringField(2),
  residencyRegion: optionalStringField(64),
  vatRegistered: optionalBooleanField,
  vatNumber: optionalStringField(32),
  utrNumber: optionalStringField(32),
  companyNumber: optionalStringField(32),
  taxAdvisorName: optionalStringField(160),
  taxAdvisorEmail: optionalStringField(160),
  taxAdvisorPhone: optionalStringField(48),
  remittanceCycle: optionalStringField(24),
  withholdingRate: optionalDecimalField(100),
  lastFilingSubmittedAt: optionalDateField,
  nextDeadlineAt: optionalDateField,
  notes: optionalStringField(4000)
});

const FILING_SCHEMA = z.object({
  taxYear: optionalStringField(16).refine((val) => val !== null, 'Tax year is required'),
  period: optionalStringField(32),
  filingType: optionalStringField(32),
  submissionMethod: optionalStringField(32),
  status: optionalStringField(24),
  dueAt: optionalDateField,
  submittedAt: optionalDateField,
  amountDue: optionalDecimalField(100000000),
  amountPaid: optionalDecimalField(100000000),
  currency: optionalStringField(3),
  reference: optionalStringField(64),
  notes: optionalStringField(4000),
  documents: FILING_DOCUMENT_SCHEMA
});

const TASK_SCHEMA = z.object({
  title: optionalStringField(160).refine((val) => val !== null, 'Task title is required'),
  status: optionalStringField(24),
  priority: optionalStringField(16),
  dueAt: optionalDateField,
  completedAt: optionalDateField,
  assignedTo: optionalStringField(36),
  filingId: optionalStringField(36),
  instructions: optionalStringField(4000),
  checklist: TASK_CHECKLIST_SCHEMA
});

const DOCUMENT_SCHEMA = z.object({
  title: optionalStringField(160).refine((val) => val !== null, 'Document title is required'),
  documentType: optionalStringField(32),
  status: optionalStringField(24),
  fileUrl: optionalStringField(2048).refine((val) => val !== null, 'File URL is required'),
  thumbnailUrl: optionalStringField(2048),
  filingId: optionalStringField(36),
  notes: optionalStringField(4000)
});

function validationError(message, details = []) {
  const error = new Error(message);
  error.statusCode = 422;
  error.details = details;
  return error;
}

function notFoundError(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function toIso(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function serialiseProfile(model) {
  if (!model) {
    return null;
  }
  const plain = model.toJSON();
  return {
    filingStatus: plain.filingStatus,
    residencyCountry: plain.residencyCountry,
    residencyRegion: plain.residencyRegion,
    vatRegistered: Boolean(plain.vatRegistered),
    vatNumber: plain.vatNumber,
    utrNumber: plain.utrNumber,
    companyNumber: plain.companyNumber,
    taxAdvisorName: plain.taxAdvisorName,
    taxAdvisorEmail: plain.taxAdvisorEmail,
    taxAdvisorPhone: plain.taxAdvisorPhone,
    remittanceCycle: plain.remittanceCycle,
    withholdingRate: plain.withholdingRate != null ? Number.parseFloat(plain.withholdingRate) : null,
    lastFilingSubmittedAt: toIso(plain.lastFilingSubmittedAt),
    nextDeadlineAt: toIso(plain.nextDeadlineAt),
    notes: plain.notes,
    metadata: plain.metadata ?? {}
  };
}

function serialiseFiling(model) {
  if (!model) {
    return null;
  }
  const plain = model.toJSON();
  return {
    id: plain.id,
    servicemanId: plain.servicemanId,
    taxYear: plain.taxYear,
    period: plain.period,
    filingType: plain.filingType,
    submissionMethod: plain.submissionMethod,
    status: plain.status,
    dueAt: toIso(plain.dueAt),
    submittedAt: toIso(plain.submittedAt),
    amountDue: plain.amountDue != null ? Number.parseFloat(plain.amountDue) : null,
    amountPaid: plain.amountPaid != null ? Number.parseFloat(plain.amountPaid) : null,
    currency: plain.currency,
    reference: plain.reference,
    notes: plain.notes,
    documents: Array.isArray(plain.documents) ? plain.documents : [],
    metadata: plain.metadata ?? {},
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt)
  };
}

function serialiseTask(model) {
  if (!model) {
    return null;
  }
  const plain = model.toJSON();
  return {
    id: plain.id,
    servicemanId: plain.servicemanId,
    filingId: plain.filingId ?? null,
    title: plain.title,
    status: plain.status,
    priority: plain.priority,
    dueAt: toIso(plain.dueAt),
    completedAt: toIso(plain.completedAt),
    assignedTo: plain.assignedTo ?? null,
    instructions: plain.instructions ?? null,
    checklist: Array.isArray(plain.checklist) ? plain.checklist : [],
    metadata: plain.metadata ?? {},
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt)
  };
}

function serialiseDocument(model) {
  if (!model) {
    return null;
  }
  const plain = model.toJSON();
  return {
    id: plain.id,
    servicemanId: plain.servicemanId,
    filingId: plain.filingId ?? null,
    title: plain.title,
    documentType: plain.documentType,
    status: plain.status,
    fileUrl: plain.fileUrl,
    thumbnailUrl: plain.thumbnailUrl ?? null,
    uploadedAt: toIso(plain.uploadedAt),
    uploadedBy: plain.uploadedBy ?? null,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? {},
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt)
  };
}

async function ensureProfile(servicemanId) {
  const [profile] = await ServicemanTaxProfile.findOrCreate({
    where: { servicemanId },
    defaults: {
      servicemanId,
      filingStatus: 'sole_trader',
      remittanceCycle: 'monthly',
      vatRegistered: false,
      metadata: {}
    }
  });
  return profile;
}

function buildSummary({ filings = [], tasks = [], documents = [] }) {
  const filingSummary = filings.reduce(
    (acc, filing) => {
      const status = FILING_STATUSES.includes(filing.status) ? filing.status : 'draft';
      acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
      if (filing.amountDue != null) {
        acc.amountDueTotal += Number.parseFloat(filing.amountDue) || 0;
      }
      if (filing.amountPaid != null) {
        acc.amountPaidTotal += Number.parseFloat(filing.amountPaid) || 0;
      }
      if (filing.dueAt) {
        const dueTime = new Date(filing.dueAt).getTime();
        const now = Date.now();
        if (dueTime && dueTime < now && !['submitted', 'accepted', 'cancelled'].includes(status)) {
          acc.overdue += 1;
        }
        if (
          dueTime &&
          (!acc.nextDeadline ||
            (dueTime < acc.nextDeadline && !['submitted', 'accepted', 'cancelled'].includes(status)))
        ) {
          acc.nextDeadline = dueTime;
        }
      }
      acc.total += 1;
      return acc;
    },
    { total: 0, byStatus: {}, amountDueTotal: 0, amountPaidTotal: 0, overdue: 0, nextDeadline: null }
  );

  const taskSummary = tasks.reduce(
    (acc, task) => {
      const status = TASK_STATUSES.includes(task.status) ? task.status : 'planned';
      acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
      if (status !== 'completed') {
        acc.open += 1;
      }
      if (task.dueAt) {
        const dueTime = new Date(task.dueAt).getTime();
        if (dueTime && dueTime < Date.now() && status !== 'completed') {
          acc.overdue += 1;
        }
      }
      acc.total += 1;
      return acc;
    },
    { total: 0, open: 0, overdue: 0, byStatus: {} }
  );

  const documentSummary = documents.reduce(
    (acc, doc) => {
      const type = DOCUMENT_TYPES.includes(doc.documentType) ? doc.documentType : 'other';
      acc.byType[type] = (acc.byType[type] ?? 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, byType: {} }
  );

  return {
    filings: {
      total: filingSummary.total,
      byStatus: filingSummary.byStatus,
      overdue: filingSummary.overdue,
      amountDueTotal: filingSummary.amountDueTotal,
      amountPaidTotal: filingSummary.amountPaidTotal,
      nextDeadline: filingSummary.nextDeadline ? new Date(filingSummary.nextDeadline).toISOString() : null
    },
    tasks: {
      total: taskSummary.total,
      open: taskSummary.open,
      overdue: taskSummary.overdue,
      byStatus: taskSummary.byStatus
    },
    documents: {
      total: documentSummary.total,
      byType: documentSummary.byType
    }
  };
}

function buildMetadata() {
  return {
    filingStatuses: FILING_STATUSES,
    filingTypes: FILING_TYPES,
    submissionMethods: SUBMISSION_METHODS,
    remittanceCycles: REMITTANCE_CYCLES,
    profileFilingStatuses: PROFILE_FILING_STATUSES,
    taskStatuses: TASK_STATUSES,
    taskPriorities: TASK_PRIORITIES,
    documentStatuses: DOCUMENT_STATUSES,
    documentTypes: DOCUMENT_TYPES
  };
}

async function resolveServiceman(servicemanId) {
  if (!servicemanId) {
    return null;
  }
  const user = await User.findByPk(servicemanId, {
    attributes: ['id', 'firstName', 'lastName', 'email']
  });
  if (!user) {
    return null;
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return {
    id: user.id,
    name: name || 'Crew member',
    email: user.email ?? null
  };
}

function normaliseFilingPayload(input) {
  let parsed;
  try {
    parsed = FILING_SCHEMA.parse(input ?? {});
  } catch (error) {
    throw validationError('Unable to process tax filing payload.', error.errors ?? error.issues ?? error);
  }

  const status = parsed.status && FILING_STATUSES.includes(parsed.status) ? parsed.status : undefined;
  const filingType = parsed.filingType && FILING_TYPES.includes(parsed.filingType) ? parsed.filingType : undefined;
  const submissionMethod =
    parsed.submissionMethod && SUBMISSION_METHODS.includes(parsed.submissionMethod)
      ? parsed.submissionMethod
      : undefined;

  const documents = (parsed.documents ?? []).map((doc) => ({
    title: doc.title,
    fileUrl: doc.fileUrl,
    documentType: doc.documentType && DOCUMENT_TYPES.includes(doc.documentType) ? doc.documentType : 'other'
  }));

  return {
    taxYear: parsed.taxYear,
    period: parsed.period ?? null,
    filingType: filingType ?? (parsed.filingType ?? null),
    submissionMethod: submissionMethod ?? (parsed.submissionMethod ?? null),
    status: status ?? 'draft',
    dueAt: parsed.dueAt ?? null,
    submittedAt: parsed.submittedAt ?? null,
    amountDue: parsed.amountDue ?? null,
    amountPaid: parsed.amountPaid ?? null,
    currency: parsed.currency ? normaliseCurrency(parsed.currency) : 'GBP',
    reference: parsed.reference ?? null,
    notes: parsed.notes ?? null,
    documents,
    metadata: {}
  };
}

function normaliseTaskPayload(input) {
  let parsed;
  try {
    parsed = TASK_SCHEMA.parse(input ?? {});
  } catch (error) {
    throw validationError('Unable to process tax task payload.', error.errors ?? error.issues ?? error);
  }

  const status = parsed.status && TASK_STATUSES.includes(parsed.status) ? parsed.status : 'planned';
  const priority = parsed.priority && TASK_PRIORITIES.includes(parsed.priority) ? parsed.priority : 'normal';

  const checklist = (parsed.checklist ?? []).map((item, index) => ({
    id: item.id ?? `item-${index + 1}`,
    label: item.label,
    completed: Boolean(item.completed)
  }));

  return {
    title: parsed.title,
    status,
    priority,
    dueAt: parsed.dueAt ?? null,
    completedAt: parsed.completedAt ?? null,
    assignedTo: parsed.assignedTo ?? null,
    filingId: parsed.filingId ?? null,
    instructions: parsed.instructions ?? null,
    checklist,
    metadata: {}
  };
}

function normaliseDocumentPayload(input) {
  let parsed;
  try {
    parsed = DOCUMENT_SCHEMA.parse(input ?? {});
  } catch (error) {
    throw validationError('Unable to process tax document payload.', error.errors ?? error.issues ?? error);
  }

  const status = parsed.status && DOCUMENT_STATUSES.includes(parsed.status) ? parsed.status : 'active';
  const documentType =
    parsed.documentType && DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'supporting';

  return {
    title: parsed.title,
    documentType,
    status,
    fileUrl: parsed.fileUrl,
    thumbnailUrl: parsed.thumbnailUrl ?? null,
    filingId: parsed.filingId ?? null,
    notes: parsed.notes ?? null,
    metadata: {}
  };
}

function normaliseProfilePayload(input) {
  let parsed;
  try {
    parsed = PROFILE_SCHEMA.parse(input ?? {});
  } catch (error) {
    throw validationError('Unable to process tax profile payload.', error.errors ?? error.issues ?? error);
  }

  if (parsed.taxAdvisorEmail && !validator.isEmail(parsed.taxAdvisorEmail)) {
    throw validationError('Tax advisor email is invalid.', [
      { field: 'taxAdvisorEmail', message: 'Enter a valid email address.' }
    ]);
  }

  const filingStatus =
    parsed.filingStatus && PROFILE_FILING_STATUSES.includes(parsed.filingStatus)
      ? parsed.filingStatus
      : parsed.filingStatus
      ? 'other'
      : 'sole_trader';

  const remittanceCycle =
    parsed.remittanceCycle && REMITTANCE_CYCLES.includes(parsed.remittanceCycle)
      ? parsed.remittanceCycle
      : 'monthly';

  return {
    filingStatus,
    residencyCountry: parsed.residencyCountry ? parsed.residencyCountry.toUpperCase() : null,
    residencyRegion: parsed.residencyRegion ?? null,
    vatRegistered: parsed.vatRegistered ?? false,
    vatNumber: parsed.vatNumber ?? null,
    utrNumber: parsed.utrNumber ?? null,
    companyNumber: parsed.companyNumber ?? null,
    taxAdvisorName: parsed.taxAdvisorName ?? null,
    taxAdvisorEmail: parsed.taxAdvisorEmail ?? null,
    taxAdvisorPhone: parsed.taxAdvisorPhone ?? null,
    remittanceCycle,
    withholdingRate: parsed.withholdingRate != null ? Number(parsed.withholdingRate) : null,
    lastFilingSubmittedAt: parsed.lastFilingSubmittedAt ?? null,
    nextDeadlineAt: parsed.nextDeadlineAt ?? null,
    notes: parsed.notes ?? null
  };
}

export async function getServicemanTaxWorkspace({ servicemanId, limit = 10 } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const profile = await ensureProfile(servicemanId);

  const [filingRecords, filingSummaryRecords, taskRecords, taskSummaryRecords, documentRecords, documentSummaryRecords, serviceman] =
    await Promise.all([
      ServicemanTaxFiling.findAll({
        where: { servicemanId },
        order: [
          ['dueAt', 'ASC'],
          ['createdAt', 'DESC']
        ],
        limit
      }),
      ServicemanTaxFiling.findAll({
        where: { servicemanId },
        attributes: ['status', 'amountDue', 'amountPaid', 'dueAt']
      }),
      ServicemanTaxTask.findAll({
        where: { servicemanId },
        order: [
          ['status', 'ASC'],
          ['dueAt', 'ASC'],
          ['createdAt', 'DESC']
        ],
        limit
      }),
      ServicemanTaxTask.findAll({
        where: { servicemanId },
        attributes: ['status', 'dueAt']
      }),
      ServicemanTaxDocument.findAll({
        where: { servicemanId },
        order: [
          ['status', 'ASC'],
          ['createdAt', 'DESC']
        ],
        limit
      }),
      ServicemanTaxDocument.findAll({
        where: { servicemanId },
        attributes: ['documentType']
      }),
      resolveServiceman(servicemanId)
    ]);

  const filings = filingRecords.map(serialiseFiling);
  const tasks = taskRecords.map(serialiseTask);
  const documents = documentRecords.map(serialiseDocument);

  const summary = buildSummary({
    filings: filingSummaryRecords.map(serialiseFiling),
    tasks: taskSummaryRecords.map(serialiseTask),
    documents: documentSummaryRecords.map(serialiseDocument)
  });

  return {
    context: {
      servicemanId,
      serviceman
    },
    profile: serialiseProfile(profile),
    summary,
    filings: {
      items: filings,
      meta: {
        total: summary.filings.total,
        overdue: summary.filings.overdue
      }
    },
    tasks: {
      items: tasks,
      meta: {
        total: summary.tasks.total,
        open: summary.tasks.open,
        overdue: summary.tasks.overdue
      }
    },
    documents: {
      items: documents,
      meta: {
        total: summary.documents.total
      }
    },
    metadata: buildMetadata(),
    permissions: {
      canManageProfile: true,
      canManageFilings: true,
      canManageTasks: true,
      canManageDocuments: true
    }
  };
}

export async function updateServicemanTaxProfile({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const updates = normaliseProfilePayload(payload);
  const profile = await ensureProfile(servicemanId);

  Object.assign(profile, updates);
  profile.metadata = {
    ...(profile.metadata ?? {}),
    lastUpdatedBy: actorId ?? null,
    updatedAt: new Date().toISOString()
  };

  await profile.save();
  return serialiseProfile(profile);
}

export async function listServicemanTaxFilings({ servicemanId, status, search, limit = 20, offset = 0 } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const where = { servicemanId };
  if (status && status !== 'all') {
    where.status = status;
  }
  if (search) {
    where[Op.or] = [
      { taxYear: { [Op.iLike]: `%${search}%` } },
      { reference: { [Op.iLike]: `%${search}%` } },
      { filingType: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows, count } = await ServicemanTaxFiling.findAndCountAll({
    where,
    order: [
      ['dueAt', 'ASC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset
  });

  return {
    items: rows.map(serialiseFiling),
    meta: {
      total: count
    }
  };
}

export async function createServicemanTaxFiling({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const data = normaliseFilingPayload(payload);
  const filing = await ServicemanTaxFiling.create({
    ...data,
    servicemanId,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null
  });
  return serialiseFiling(filing);
}

export async function updateServicemanTaxFiling({ servicemanId, filingId, payload, actorId }) {
  if (!servicemanId || !filingId) {
    const error = new Error('filing_update_requirements');
    error.statusCode = 400;
    throw error;
  }

  const filing = await ServicemanTaxFiling.findOne({ where: { id: filingId, servicemanId } });
  if (!filing) {
    throw notFoundError('tax_filing_not_found');
  }

  const data = normaliseFilingPayload(payload);
  Object.assign(filing, data, { updatedBy: actorId ?? null });
  await filing.save();
  return serialiseFiling(filing);
}

export async function updateServicemanTaxFilingStatus({
  servicemanId,
  filingId,
  status,
  submittedAt,
  amountPaid,
  actorId
}) {
  if (!servicemanId || !filingId) {
    const error = new Error('filing_update_requirements');
    error.statusCode = 400;
    throw error;
  }

  const filing = await ServicemanTaxFiling.findOne({ where: { id: filingId, servicemanId } });
  if (!filing) {
    throw notFoundError('tax_filing_not_found');
  }

  if (status && !FILING_STATUSES.includes(status)) {
    throw validationError('Invalid filing status supplied.', [
      { field: 'status', message: 'Unsupported status value.' }
    ]);
  }

  filing.status = status ?? filing.status;
  filing.submittedAt = submittedAt ? new Date(submittedAt) : filing.submittedAt;
  filing.amountPaid = amountPaid != null ? Number.parseFloat(amountPaid) : filing.amountPaid;
  filing.updatedBy = actorId ?? filing.updatedBy;
  await filing.save();
  return serialiseFiling(filing);
}

export async function deleteServicemanTaxFiling({ servicemanId, filingId }) {
  if (!servicemanId || !filingId) {
    const error = new Error('filing_delete_requirements');
    error.statusCode = 400;
    throw error;
  }

  const filing = await ServicemanTaxFiling.findOne({ where: { id: filingId, servicemanId } });
  if (!filing) {
    throw notFoundError('tax_filing_not_found');
  }
  await filing.destroy();
  return { status: 'deleted' };
}

export async function listServicemanTaxTasks({ servicemanId, status, limit = 25, offset = 0 } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const where = { servicemanId };
  if (status && status !== 'all') {
    where.status = status;
  }

  const { rows, count } = await ServicemanTaxTask.findAndCountAll({
    where,
    order: [
      ['status', 'ASC'],
      ['dueAt', 'ASC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset
  });

  return {
    items: rows.map(serialiseTask),
    meta: { total: count }
  };
}

export async function createServicemanTaxTask({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const data = normaliseTaskPayload(payload);
  const task = await ServicemanTaxTask.create({
    ...data,
    servicemanId,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null
  });
  return serialiseTask(task);
}

export async function updateServicemanTaxTask({ servicemanId, taskId, payload, actorId }) {
  if (!servicemanId || !taskId) {
    const error = new Error('task_update_requirements');
    error.statusCode = 400;
    throw error;
  }

  const task = await ServicemanTaxTask.findOne({ where: { id: taskId, servicemanId } });
  if (!task) {
    throw notFoundError('tax_task_not_found');
  }

  const data = normaliseTaskPayload(payload);
  Object.assign(task, data, { updatedBy: actorId ?? null });
  await task.save();
  return serialiseTask(task);
}

export async function updateServicemanTaxTaskStatus({ servicemanId, taskId, status, completedAt, actorId }) {
  if (!servicemanId || !taskId) {
    const error = new Error('task_update_requirements');
    error.statusCode = 400;
    throw error;
  }

  const task = await ServicemanTaxTask.findOne({ where: { id: taskId, servicemanId } });
  if (!task) {
    throw notFoundError('tax_task_not_found');
  }

  if (status && !TASK_STATUSES.includes(status)) {
    throw validationError('Invalid task status supplied.', [
      { field: 'status', message: 'Unsupported status value.' }
    ]);
  }

  task.status = status ?? task.status;
  task.completedAt = completedAt ? new Date(completedAt) : task.completedAt;
  task.updatedBy = actorId ?? task.updatedBy;
  await task.save();
  return serialiseTask(task);
}

export async function deleteServicemanTaxTask({ servicemanId, taskId }) {
  if (!servicemanId || !taskId) {
    const error = new Error('task_delete_requirements');
    error.statusCode = 400;
    throw error;
  }

  const task = await ServicemanTaxTask.findOne({ where: { id: taskId, servicemanId } });
  if (!task) {
    throw notFoundError('tax_task_not_found');
  }
  await task.destroy();
  return { status: 'deleted' };
}

export async function listServicemanTaxDocuments({ servicemanId, type, status, limit = 25, offset = 0 } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const where = { servicemanId };
  if (type && type !== 'all') {
    where.documentType = type;
  }
  if (status && status !== 'all') {
    where.status = status;
  }

  const { rows, count } = await ServicemanTaxDocument.findAndCountAll({
    where,
    order: [
      ['status', 'ASC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset
  });

  return {
    items: rows.map(serialiseDocument),
    meta: { total: count }
  };
}

export async function createServicemanTaxDocument({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const data = normaliseDocumentPayload(payload);
  const document = await ServicemanTaxDocument.create({
    ...data,
    servicemanId,
    uploadedBy: actorId ?? null
  });
  return serialiseDocument(document);
}

export async function updateServicemanTaxDocument({ servicemanId, documentId, payload, actorId }) {
  if (!servicemanId || !documentId) {
    const error = new Error('document_update_requirements');
    error.statusCode = 400;
    throw error;
  }

  const document = await ServicemanTaxDocument.findOne({ where: { id: documentId, servicemanId } });
  if (!document) {
    throw notFoundError('tax_document_not_found');
  }

  const data = normaliseDocumentPayload(payload);
  Object.assign(document, data, { uploadedBy: actorId ?? document.uploadedBy });
  await document.save();
  return serialiseDocument(document);
}

export async function deleteServicemanTaxDocument({ servicemanId, documentId }) {
  if (!servicemanId || !documentId) {
    const error = new Error('document_delete_requirements');
    error.statusCode = 400;
    throw error;
  }

  const document = await ServicemanTaxDocument.findOne({ where: { id: documentId, servicemanId } });
  if (!document) {
    throw notFoundError('tax_document_not_found');
  }

  await document.destroy();
  return { status: 'deleted' };
}

export default {
  getServicemanTaxWorkspace,
  updateServicemanTaxProfile,
  listServicemanTaxFilings,
  createServicemanTaxFiling,
  updateServicemanTaxFiling,
  updateServicemanTaxFilingStatus,
  deleteServicemanTaxFiling,
  listServicemanTaxTasks,
  createServicemanTaxTask,
  updateServicemanTaxTask,
  updateServicemanTaxTaskStatus,
  deleteServicemanTaxTask,
  listServicemanTaxDocuments,
  createServicemanTaxDocument,
  updateServicemanTaxDocument,
  deleteServicemanTaxDocument
};
