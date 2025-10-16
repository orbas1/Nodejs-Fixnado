import { Op } from 'sequelize';
import {
  sequelize,
  ServicemanIdentity,
  ServicemanIdentityDocument,
  ServicemanIdentityCheck,
  ServicemanIdentityWatcher,
  ServicemanIdentityEvent,
  User
} from '../models/index.js';

const VERIFICATION_STATUSES = Object.freeze(['pending', 'in_review', 'approved', 'rejected', 'suspended', 'expired']);
const RISK_RATINGS = Object.freeze(['low', 'medium', 'high', 'critical']);
const VERIFICATION_LEVELS = Object.freeze(['standard', 'enhanced', 'expedited']);
const DOCUMENT_TYPES = Object.freeze([
  'passport',
  'driving_license',
  'work_permit',
  'national_id',
  'insurance_certificate',
  'other'
]);
const DOCUMENT_STATUSES = Object.freeze(['pending', 'in_review', 'approved', 'rejected', 'expired']);
const CHECK_STATUSES = Object.freeze(['not_started', 'in_progress', 'blocked', 'completed']);
const WATCHER_ROLES = Object.freeze(['operations_lead', 'compliance_specialist', 'safety_manager', 'account_manager', 'other']);
const EVENT_TYPES = Object.freeze([
  'note',
  'status_change',
  'document_update',
  'check_update',
  'watcher_update',
  'escalation',
  'review_request',
  'expiry'
]);

function identityError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoOrNull(date) {
  return date ? new Date(date).toISOString() : null;
}

function buildReferenceData() {
  return {
    statuses: [...VERIFICATION_STATUSES],
    riskRatings: [...RISK_RATINGS],
    verificationLevels: [...VERIFICATION_LEVELS],
    documentTypes: [...DOCUMENT_TYPES],
    documentStatuses: [...DOCUMENT_STATUSES],
    checkStatuses: [...CHECK_STATUSES],
    watcherRoles: [...WATCHER_ROLES],
    eventTypes: [...EVENT_TYPES]
  };
}

async function ensureServiceman(servicemanId, transaction) {
  if (!servicemanId) {
    throw identityError('Serviceman identifier is required');
  }

  const serviceman = await User.findByPk(servicemanId, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'type'],
    transaction
  });

  if (!serviceman) {
    throw identityError('Serviceman record not found', 404);
  }

  if (serviceman.type !== 'servicemen') {
    throw identityError('Identity verification is only available for servicemen profiles', 422);
  }

  return serviceman;
}

async function ensureIdentity(servicemanId, transaction) {
  const serviceman = await ensureServiceman(servicemanId, transaction);

  const [identity] = await ServicemanIdentity.findOrCreate({
    where: { servicemanId },
    defaults: {
      servicemanId,
      status: 'pending',
      riskRating: 'medium',
      verificationLevel: 'standard',
      requestedAt: new Date(),
      metadata: {}
    },
    transaction
  });

  return { identity, serviceman };
}

function buildReviewerPayload(reviewer) {
  if (!reviewer) {
    return null;
  }
  const name = [reviewer.firstName, reviewer.lastName].filter(Boolean).join(' ').trim();
  return {
    id: reviewer.id,
    name: name || reviewer.email || 'Reviewer',
    email: reviewer.email || null
  };
}

function mapIdentitySnapshot({ identity, serviceman, documents, checks, watchers, events }) {
  const reviewer = identity.reviewer ? buildReviewerPayload(identity.reviewer) : null;

  return {
    verification: {
      id: identity.id,
      servicemanId: identity.servicemanId,
      status: identity.status,
      riskRating: identity.riskRating,
      verificationLevel: identity.verificationLevel,
      requestedAt: toIsoOrNull(identity.requestedAt),
      submittedAt: toIsoOrNull(identity.submittedAt),
      approvedAt: toIsoOrNull(identity.approvedAt),
      expiresAt: toIsoOrNull(identity.expiresAt),
      notes: identity.notes || '',
      reviewer,
      serviceman: serviceman
        ? {
            id: serviceman.id,
            name: [serviceman.firstName, serviceman.lastName].filter(Boolean).join(' ').trim() || serviceman.email,
            email: serviceman.email
          }
        : null
    },
    documents: documents.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      status: document.status,
      documentNumber: document.documentNumber || null,
      issuingCountry: document.issuingCountry || null,
      issuedAt: toIsoOrNull(document.issuedAt),
      expiresAt: toIsoOrNull(document.expiresAt),
      fileUrl: document.fileUrl || null,
      notes: document.notes || ''
    })),
    checks: checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      owner: check.owner || null,
      dueAt: toIsoOrNull(check.dueAt),
      completedAt: toIsoOrNull(check.completedAt)
    })),
    watchers: watchers.map((watcher) => ({
      id: watcher.id,
      email: watcher.email,
      name: watcher.name || watcher.email,
      role: watcher.role,
      notifiedAt: toIsoOrNull(watcher.notifiedAt),
      lastSeenAt: toIsoOrNull(watcher.lastSeenAt)
    })),
    events: events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      title: event.title,
      description: event.description || '',
      occurredAt: toIsoOrNull(event.occurredAt),
      metadata: event.metadata || {},
      actor: event.actor ? buildReviewerPayload(event.actor) : null
    })),
    referenceData: buildReferenceData()
  };
}

async function loadIdentitySnapshot(servicemanId, transaction) {
  const { identity, serviceman } = await ensureIdentity(servicemanId, transaction);

  const [documents, checks, watchers, events] = await Promise.all([
    ServicemanIdentityDocument.findAll({
      where: { identityId: identity.id },
      order: [['createdAt', 'ASC']],
      transaction
    }),
    ServicemanIdentityCheck.findAll({
      where: { identityId: identity.id },
      order: [['createdAt', 'ASC']],
      transaction
    }),
    ServicemanIdentityWatcher.findAll({
      where: { identityId: identity.id },
      order: [['createdAt', 'ASC']],
      transaction
    }),
    ServicemanIdentityEvent.findAll({
      where: { identityId: identity.id },
      include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['occurredAt', 'DESC']],
      limit: 50,
      transaction
    })
  ]);

  await identity.reload({
    include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    transaction
  });

  return mapIdentitySnapshot({ identity, serviceman, documents, checks, watchers, events });
}

export async function getServicemanIdentitySnapshot(servicemanId) {
  return loadIdentitySnapshot(servicemanId);
}

export async function updateServicemanIdentityProfile(servicemanId, payload = {}) {
  const { identity } = await ensureIdentity(servicemanId);

  return sequelize.transaction(async (transaction) => {
    await identity.reload({ transaction });

    const updates = {};
    const events = [];

    if (payload.status) {
      if (!VERIFICATION_STATUSES.includes(payload.status)) {
        throw identityError('Unsupported verification status');
      }
      if (payload.status !== identity.status) {
        updates.status = payload.status;
        events.push({
          eventType: 'status_change',
          title: 'Verification status updated',
          description: `Status changed to ${payload.status.replace(/_/g, ' ')}`
        });
      }
    }

    if (payload.riskRating) {
      if (!RISK_RATINGS.includes(payload.riskRating)) {
        throw identityError('Unsupported risk rating');
      }
      if (payload.riskRating !== identity.riskRating) {
        updates.riskRating = payload.riskRating;
      }
    }

    if (payload.verificationLevel) {
      if (!VERIFICATION_LEVELS.includes(payload.verificationLevel)) {
        throw identityError('Unsupported verification level');
      }
      if (payload.verificationLevel !== identity.verificationLevel) {
        updates.verificationLevel = payload.verificationLevel;
      }
    }

    if (payload.expiresAt !== undefined) {
      updates.expiresAt = toDate(payload.expiresAt);
    }

    if (payload.notes !== undefined) {
      updates.notes = payload.notes ?? '';
    }

    let reviewer = null;
    if (payload.reviewerId) {
      reviewer = await User.findByPk(payload.reviewerId, { transaction });
      if (!reviewer) {
        throw identityError('Reviewer user not found', 404);
      }
      updates.reviewerId = reviewer.id;
    } else if (payload.reviewerEmail) {
      reviewer = await User.findOne({
        where: {
          email: { [Op.iLike]: payload.reviewerEmail.trim() }
        },
        transaction
      });
      if (!reviewer) {
        throw identityError('No user found for the provided reviewer email', 404);
      }
      updates.reviewerId = reviewer.id;
    }

    if (Object.keys(updates).length > 0) {
      await identity.update(updates, { transaction });
    }

    if (events.length > 0) {
      for (const event of events) {
        await ServicemanIdentityEvent.create(
          {
            identityId: identity.id,
            ...event,
            occurredAt: new Date()
          },
          { transaction }
        );
      }
    }

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function createIdentityDocument(servicemanId, payload = {}) {
  const { identity } = await ensureIdentity(servicemanId);

  if (!payload.documentType || !DOCUMENT_TYPES.includes(payload.documentType)) {
    throw identityError('documentType is required and must be supported');
  }

  if (payload.status && !DOCUMENT_STATUSES.includes(payload.status)) {
    throw identityError('Unsupported document status');
  }

  return sequelize.transaction(async (transaction) => {
    const document = await ServicemanIdentityDocument.create(
      {
        identityId: identity.id,
        documentType: payload.documentType,
        status: payload.status && DOCUMENT_STATUSES.includes(payload.status) ? payload.status : 'pending',
        documentNumber: payload.documentNumber ?? null,
        issuingCountry: payload.issuingCountry ?? null,
        issuedAt: toDate(payload.issuedAt),
        expiresAt: toDate(payload.expiresAt),
        fileUrl: payload.fileUrl ?? null,
        notes: payload.notes ?? ''
      },
      { transaction }
    );

    await ServicemanIdentityEvent.create(
      {
        identityId: identity.id,
        eventType: 'document_update',
        title: 'Identity document added',
        description: `${document.documentType.replace(/_/g, ' ')} added to verification record`,
        occurredAt: new Date()
      },
      { transaction }
    );

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function updateIdentityDocument(servicemanId, documentId, payload = {}) {
  if (!documentId) {
    throw identityError('Document identifier is required');
  }

  const { identity } = await ensureIdentity(servicemanId);

  return sequelize.transaction(async (transaction) => {
    const document = await ServicemanIdentityDocument.findOne({
      where: { id: documentId, identityId: identity.id },
      transaction
    });

    if (!document) {
      throw identityError('Identity document not found', 404);
    }

    const updates = {};

    if (payload.documentType) {
      if (!DOCUMENT_TYPES.includes(payload.documentType)) {
        throw identityError('Unsupported document type');
      }
      updates.documentType = payload.documentType;
    }

    if (payload.status) {
      if (!DOCUMENT_STATUSES.includes(payload.status)) {
        throw identityError('Unsupported document status');
      }
      updates.status = payload.status;
    }

    if (payload.documentNumber !== undefined) {
      updates.documentNumber = payload.documentNumber ?? null;
    }

    if (payload.issuingCountry !== undefined) {
      updates.issuingCountry = payload.issuingCountry ?? null;
    }

    if (payload.issuedAt !== undefined) {
      updates.issuedAt = toDate(payload.issuedAt);
    }

    if (payload.expiresAt !== undefined) {
      updates.expiresAt = toDate(payload.expiresAt);
    }

    if (payload.fileUrl !== undefined) {
      updates.fileUrl = payload.fileUrl ?? null;
    }

    if (payload.notes !== undefined) {
      updates.notes = payload.notes ?? '';
    }

    if (Object.keys(updates).length > 0) {
      await document.update(updates, { transaction });

      await ServicemanIdentityEvent.create(
        {
          identityId: identity.id,
          eventType: 'document_update',
          title: 'Identity document updated',
          description: `${document.documentType.replace(/_/g, ' ')} updated`,
          occurredAt: new Date()
        },
        { transaction }
      );
    }

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function deleteIdentityDocument(servicemanId, documentId) {
  if (!documentId) {
    throw identityError('Document identifier is required');
  }

  const { identity } = await ensureIdentity(servicemanId);

  return sequelize.transaction(async (transaction) => {
    const document = await ServicemanIdentityDocument.findOne({
      where: { id: documentId, identityId: identity.id },
      transaction
    });

    if (!document) {
      throw identityError('Identity document not found', 404);
    }

    await document.destroy({ transaction });

    await ServicemanIdentityEvent.create(
      {
        identityId: identity.id,
        eventType: 'document_update',
        title: 'Identity document removed',
        description: `${document.documentType.replace(/_/g, ' ')} deleted from record`,
        occurredAt: new Date()
      },
      { transaction }
    );

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function createIdentityCheck(servicemanId, payload = {}) {
  const { identity } = await ensureIdentity(servicemanId);

  if (!payload.label || typeof payload.label !== 'string') {
    throw identityError('Checklist label is required');
  }

  const status = payload.status && CHECK_STATUSES.includes(payload.status) ? payload.status : 'not_started';

  return sequelize.transaction(async (transaction) => {
    await ServicemanIdentityCheck.create(
      {
        identityId: identity.id,
        label: payload.label.trim(),
        status,
        owner: payload.owner ?? null,
        dueAt: toDate(payload.dueAt),
        completedAt: toDate(payload.completedAt)
      },
      { transaction }
    );

    await ServicemanIdentityEvent.create(
      {
        identityId: identity.id,
        eventType: 'check_update',
        title: 'Verification checklist entry created',
        description: payload.label.trim(),
        occurredAt: new Date()
      },
      { transaction }
    );

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function updateIdentityCheck(servicemanId, checkId, payload = {}) {
  if (!checkId) {
    throw identityError('Checklist identifier is required');
  }

  const { identity } = await ensureIdentity(servicemanId);

  return sequelize.transaction(async (transaction) => {
    const check = await ServicemanIdentityCheck.findOne({
      where: { id: checkId, identityId: identity.id },
      transaction
    });

    if (!check) {
      throw identityError('Checklist entry not found', 404);
    }

    const updates = {};

    if (payload.status) {
      if (!CHECK_STATUSES.includes(payload.status)) {
        throw identityError('Unsupported checklist status');
      }
      updates.status = payload.status;
    }

    if (payload.label !== undefined) {
      updates.label = payload.label.trim();
    }

    if (payload.owner !== undefined) {
      updates.owner = payload.owner ?? null;
    }

    if (payload.dueAt !== undefined) {
      updates.dueAt = toDate(payload.dueAt);
    }

    if (payload.completedAt !== undefined) {
      updates.completedAt = toDate(payload.completedAt);
    }

    if (Object.keys(updates).length > 0) {
      await check.update(updates, { transaction });

      await ServicemanIdentityEvent.create(
        {
          identityId: identity.id,
          eventType: 'check_update',
          title: 'Verification checklist updated',
          description: check.label,
          occurredAt: new Date()
        },
        { transaction }
      );
    }

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function deleteIdentityCheck(servicemanId, checkId) {
  if (!checkId) {
    throw identityError('Checklist identifier is required');
  }

  const { identity } = await ensureIdentity(servicemanId);

  return sequelize.transaction(async (transaction) => {
    const check = await ServicemanIdentityCheck.findOne({
      where: { id: checkId, identityId: identity.id },
      transaction
    });

    if (!check) {
      throw identityError('Checklist entry not found', 404);
    }

    await check.destroy({ transaction });

    await ServicemanIdentityEvent.create(
      {
        identityId: identity.id,
        eventType: 'check_update',
        title: 'Verification checklist removed',
        description: check.label,
        occurredAt: new Date()
      },
      { transaction }
    );

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function addIdentityWatcher(servicemanId, payload = {}) {
  const { identity } = await ensureIdentity(servicemanId);

  if (!payload.email || typeof payload.email !== 'string') {
    throw identityError('Watcher email is required');
  }

  const normalisedEmail = payload.email.trim().toLowerCase();

  if (payload.role && !WATCHER_ROLES.includes(payload.role)) {
    throw identityError('Unsupported watcher role');
  }

  return sequelize.transaction(async (transaction) => {
    const existing = await ServicemanIdentityWatcher.findOne({
      where: {
        identityId: identity.id,
        email: { [Op.iLike]: normalisedEmail }
      },
      transaction
    });

    if (existing) {
      throw identityError('Watcher already exists for this email address', 409);
    }

    await ServicemanIdentityWatcher.create(
      {
        identityId: identity.id,
        email: normalisedEmail,
        name: payload.name ?? null,
        role: payload.role && WATCHER_ROLES.includes(payload.role) ? payload.role : 'operations_lead',
        notifiedAt: toDate(payload.notifiedAt),
        lastSeenAt: toDate(payload.lastSeenAt)
      },
      { transaction }
    );

    await ServicemanIdentityEvent.create(
      {
        identityId: identity.id,
        eventType: 'watcher_update',
        title: 'Watcher added',
        description: normalisedEmail,
        occurredAt: new Date()
      },
      { transaction }
    );

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function updateIdentityWatcher(servicemanId, watcherId, payload = {}) {
  if (!watcherId) {
    throw identityError('Watcher identifier is required');
  }

  const { identity } = await ensureIdentity(servicemanId);

  return sequelize.transaction(async (transaction) => {
    const watcher = await ServicemanIdentityWatcher.findOne({
      where: { id: watcherId, identityId: identity.id },
      transaction
    });

    if (!watcher) {
      throw identityError('Watcher not found', 404);
    }

    const updates = {};

    if (payload.role) {
      if (!WATCHER_ROLES.includes(payload.role)) {
        throw identityError('Unsupported watcher role');
      }
      updates.role = payload.role;
    }

    if (payload.name !== undefined) {
      updates.name = payload.name ?? null;
    }

    if (payload.notifiedAt !== undefined) {
      updates.notifiedAt = toDate(payload.notifiedAt);
    }

    if (payload.lastSeenAt !== undefined) {
      updates.lastSeenAt = toDate(payload.lastSeenAt);
    }

    if (Object.keys(updates).length > 0) {
      await watcher.update(updates, { transaction });

      await ServicemanIdentityEvent.create(
        {
          identityId: identity.id,
          eventType: 'watcher_update',
          title: 'Watcher updated',
          description: watcher.email,
          occurredAt: new Date()
        },
        { transaction }
      );
    }

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function removeIdentityWatcher(servicemanId, watcherId) {
  if (!watcherId) {
    throw identityError('Watcher identifier is required');
  }

  const { identity } = await ensureIdentity(servicemanId);

  return sequelize.transaction(async (transaction) => {
    const watcher = await ServicemanIdentityWatcher.findOne({
      where: { id: watcherId, identityId: identity.id },
      transaction
    });

    if (!watcher) {
      throw identityError('Watcher not found', 404);
    }

    await watcher.destroy({ transaction });

    await ServicemanIdentityEvent.create(
      {
        identityId: identity.id,
        eventType: 'watcher_update',
        title: 'Watcher removed',
        description: watcher.email,
        occurredAt: new Date()
      },
      { transaction }
    );

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export async function createIdentityEvent(servicemanId, payload = {}) {
  const { identity } = await ensureIdentity(servicemanId);

  if (!payload.eventType || !EVENT_TYPES.includes(payload.eventType)) {
    throw identityError('Unsupported event type');
  }

  if (!payload.title) {
    throw identityError('Event title is required');
  }

  return sequelize.transaction(async (transaction) => {
    let actorId = null;
    if (payload.actorId) {
      const actor = await User.findByPk(payload.actorId, { transaction });
      if (!actor) {
        throw identityError('Event actor not found', 404);
      }
      actorId = actor.id;
    }

    await ServicemanIdentityEvent.create(
      {
        identityId: identity.id,
        eventType: payload.eventType,
        title: payload.title,
        description: payload.description ?? '',
        occurredAt: toDate(payload.occurredAt) ?? new Date(),
        actorId,
        metadata: payload.metadata ?? {}
      },
      { transaction }
    );

    return loadIdentitySnapshot(servicemanId, transaction);
  });
}

export default {
  getServicemanIdentitySnapshot,
  updateServicemanIdentityProfile,
  createIdentityDocument,
  updateIdentityDocument,
  deleteIdentityDocument,
  createIdentityCheck,
  updateIdentityCheck,
  deleteIdentityCheck,
  addIdentityWatcher,
  updateIdentityWatcher,
  removeIdentityWatcher,
  createIdentityEvent
};
