import {
  Company,
  ComplianceDocument,
  InsuredSellerApplication,
  MarketplaceModerationAction,
  sequelize
} from '../models/index.js';
import { toPlain } from '../utils/serializers.js';

const REQUIRED_DOCUMENTS = [
  {
    type: 'insurance_certificate',
    label: 'Professional indemnity insurance',
    expiryGraceDays: 0
  },
  {
    type: 'public_liability',
    label: 'Public liability cover',
    expiryGraceDays: 30
  },
  {
    type: 'identity_verification',
    label: 'Identity verification',
    expiryGraceDays: 0
  }
];

function complianceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isFinite(value) || value <= 0) {
    throw complianceError(`${fieldName} must be a positive number`);
  }
}

function normaliseDate(value, fieldName, { allowNull = false } = {}) {
  if (!value) {
    if (allowNull) {
      return null;
    }
    throw complianceError(`${fieldName} is required`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw complianceError(`Invalid date supplied for ${fieldName}`);
  }
  return date;
}

function buildDocumentSummary(documents, now) {
  return REQUIRED_DOCUMENTS.map((requirement) => {
    const relatedDocs = documents.filter((doc) => doc.type === requirement.type);
    if (relatedDocs.length === 0) {
      return {
        type: requirement.type,
        label: requirement.label,
        status: 'missing',
        documentId: null,
        expiryAt: null,
        expiresInDays: null,
        renewalDue: false
      };
    }

    const mostRecent = [...relatedDocs].sort((a, b) => {
      const aDate = a.reviewedAt || a.submittedAt;
      const bDate = b.reviewedAt || b.submittedAt;
      return new Date(bDate) - new Date(aDate);
    })[0];

    const expiryAt = mostRecent.expiryAt ? new Date(mostRecent.expiryAt) : null;
    const expiresInDays = expiryAt ? Math.ceil((expiryAt - now) / (24 * 60 * 60 * 1000)) : null;
    if (mostRecent.status === 'approved' && (!expiryAt || expiryAt > now)) {
      return {
        type: requirement.type,
        label: requirement.label,
        status: 'approved',
        documentId: mostRecent.id,
        expiryAt: expiryAt ? expiryAt.toISOString() : null,
        expiresInDays,
        renewalDue: typeof expiresInDays === 'number' && expiresInDays <= requirement.expiryGraceDays
      };
    }

    if (mostRecent.status === 'approved' && expiryAt && expiryAt <= now) {
      return {
        type: requirement.type,
        label: requirement.label,
        status: 'expired',
        documentId: mostRecent.id,
        expiryAt: expiryAt.toISOString(),
        expiresInDays,
        renewalDue: false
      };
    }

    if (mostRecent.status === 'expired') {
      return {
        type: requirement.type,
        label: requirement.label,
        status: 'expired',
        documentId: mostRecent.id,
        expiryAt: expiryAt ? expiryAt.toISOString() : null,
        expiresInDays,
        renewalDue: false
      };
    }

    if (mostRecent.status === 'rejected') {
      return {
        type: requirement.type,
        label: requirement.label,
        status: 'rejected',
        documentId: mostRecent.id,
        expiryAt: expiryAt ? expiryAt.toISOString() : null,
        expiresInDays,
        renewalDue: false
      };
    }

    return {
      type: requirement.type,
      label: requirement.label,
      status: 'in_review',
      documentId: mostRecent.id,
      expiryAt: expiryAt ? expiryAt.toISOString() : null,
      expiresInDays,
      renewalDue: false
    };
  });
}

async function ensureApplication(companyId, transaction) {
  const [application] = await InsuredSellerApplication.findOrCreate({
    where: { companyId },
    defaults: {
      companyId,
      status: 'pending_documents',
      requiredDocuments: REQUIRED_DOCUMENTS.map(({ type, label }) => ({ type, label })),
      complianceScore: 0
    },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  return application;
}

function earliestExpiry(summary) {
  return summary
    .filter((entry) => entry.status === 'approved' && entry.expiryAt)
    .map((entry) => new Date(entry.expiryAt))
    .sort((a, b) => a - b)[0] || null;
}

async function updateCompanyCompliance(companyId, nextState, transaction) {
  const { status, expiresAt, complianceScore, badgeEnabled } = nextState;
  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const update = {
    insuredSellerStatus: status,
    insuredSellerExpiresAt: expiryDate,
    complianceScore
  };

  if (status !== 'approved' && badgeEnabled === false) {
    update.insuredSellerBadgeVisible = false;
  }

  await Company.update(update, { where: { id: companyId }, transaction });
}

async function markExpiredDocuments(documents, transaction, now) {
  const updates = documents
    .filter((doc) => doc.status === 'approved' && doc.expiryAt && new Date(doc.expiryAt) <= now)
    .map((doc) =>
      doc.update(
        {
          status: 'expired',
          reviewedAt: doc.reviewedAt || now,
          metadata: {
            ...doc.metadata,
            autoExpiredAt: now.toISOString()
          }
        },
        { transaction }
      )
    );

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

export async function submitComplianceDocument({
  companyId,
  uploadedBy = null,
  type,
  storageKey,
  fileName,
  fileSizeBytes,
  mimeType,
  checksum = null,
  issuedAt = null,
  expiryAt = null,
  metadata = {}
}) {
  if (!companyId) {
    throw complianceError('companyId is required');
  }
  if (!type || !REQUIRED_DOCUMENTS.find((doc) => doc.type === type)) {
    throw complianceError(`Unsupported compliance document type: ${type}`);
  }
  if (!storageKey || !fileName || !mimeType) {
    throw complianceError('storageKey, fileName, and mimeType are required');
  }

  const size = Number.parseInt(fileSizeBytes, 10);
  assertPositiveInteger(size, 'fileSizeBytes');

  const now = new Date();
  const expiryDate = expiryAt ? normaliseDate(expiryAt, 'expiryAt', { allowNull: true }) : null;
  if (expiryDate && expiryDate <= now) {
    throw complianceError('expiryAt must be in the future');
  }

  const issuedDate = issuedAt ? normaliseDate(issuedAt, 'issuedAt', { allowNull: true }) : null;

  return sequelize.transaction(async (transaction) => {
    const document = await ComplianceDocument.create(
      {
        companyId,
        uploadedBy,
        type,
        storageKey,
        fileName,
        fileSizeBytes: size,
        mimeType,
        checksum,
        issuedAt: issuedDate,
        expiryAt: expiryDate,
        submittedAt: now,
        status: 'submitted',
        metadata: {
          ...metadata,
          receivedAt: now.toISOString()
        }
      },
      { transaction }
    );

    const application = await ensureApplication(companyId, transaction);
    if (application.status !== 'suspended') {
      await application.update(
        {
          status: 'in_review',
          submittedAt: application.submittedAt || now,
          lastEvaluatedAt: now
        },
        { transaction }
      );
      await updateCompanyCompliance(
        companyId,
        {
          status: 'in_review',
          expiresAt: application.expiresAt,
          complianceScore: Number(application.complianceScore || 0),
          badgeEnabled: application.badgeEnabled
        },
        transaction
      );
    }

    await MarketplaceModerationAction.create(
      {
        entityType: 'compliance_document',
        entityId: document.id,
        action: 'submitted',
        actorId: uploadedBy,
        metadata: {
          companyId,
          type
        }
      },
      { transaction }
    );

    return document;
  });
}

export async function reviewComplianceDocument(documentId, { reviewerId = null, decision, reason = null, metadata = {} }) {
  if (!['approve', 'reject'].includes(decision)) {
    throw complianceError('decision must be approve or reject');
  }

  return sequelize.transaction(async (transaction) => {
    const document = await ComplianceDocument.findByPk(documentId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!document) {
      throw complianceError('Compliance document not found', 404);
    }

    if (document.status === 'approved' && decision === 'approve') {
      return document;
    }

    const now = new Date();
    if (decision === 'approve') {
      if (document.expiryAt && new Date(document.expiryAt) <= now) {
        throw complianceError('Cannot approve an expired document', 409);
      }
      await document.update(
        {
          status: 'approved',
          reviewerId,
          reviewedAt: now,
          rejectionReason: null,
          metadata: {
            ...document.metadata,
            review: {
              ...(document.metadata?.review || {}),
              approvedAt: now.toISOString(),
              reviewerId,
              meta: metadata
            }
          }
        },
        { transaction }
      );
    } else {
      await document.update(
        {
          status: 'rejected',
          reviewerId,
          reviewedAt: now,
          rejectionReason: reason,
          metadata: {
            ...document.metadata,
            review: {
              ...(document.metadata?.review || {}),
              rejectedAt: now.toISOString(),
              reviewerId,
              reason,
              meta: metadata
            }
          }
        },
        { transaction }
      );
    }

    await MarketplaceModerationAction.create(
      {
        entityType: 'compliance_document',
        entityId: document.id,
        action: decision === 'approve' ? 'approved' : 'rejected',
        actorId: reviewerId,
        reason,
        metadata: {
          ...metadata,
          companyId: document.companyId,
          type: document.type
        }
      },
      { transaction }
    );

    await evaluateInsuredSellerStatus(document.companyId, { transaction });
    return document;
  });
}

export async function evaluateInsuredSellerStatus(companyId, { transaction, overrideSuspended = false } = {}) {
  const now = new Date();
  const documents = await ComplianceDocument.findAll({
    where: { companyId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  await markExpiredDocuments(documents, transaction, now);

  const refreshedDocuments = documents.map((doc) =>
    doc.status === 'approved' && doc.expiryAt && new Date(doc.expiryAt) <= now
      ? { ...doc.get(), status: 'expired' }
      : doc
  );

  const summary = buildDocumentSummary(refreshedDocuments.map((doc) => doc instanceof ComplianceDocument ? doc : ComplianceDocument.build(doc)), now);
  const application = await ensureApplication(companyId, transaction);

  const approvedCount = summary.filter((entry) => entry.status === 'approved').length;
  const missingCount = summary.filter((entry) => entry.status === 'missing').length;
  const rejected = summary.some((entry) => entry.status === 'rejected');
  const inReview = summary.some((entry) => entry.status === 'in_review');
  const expired = summary.some((entry) => entry.status === 'expired');

  let status = 'pending_documents';
  if (application.status === 'suspended' && !overrideSuspended) {
    status = 'suspended';
  } else if (missingCount > 0 || rejected || expired) {
    status = 'pending_documents';
  } else if (inReview) {
    status = 'in_review';
  } else if (approvedCount === REQUIRED_DOCUMENTS.length) {
    status = 'approved';
  }

  const complianceScore = Number(((approvedCount / REQUIRED_DOCUMENTS.length) * 100).toFixed(2));
  const expiresAtDate = status === 'approved' ? earliestExpiry(summary) : null;
  const expiresAt = expiresAtDate ? expiresAtDate.toISOString() : null;

  await application.update(
    {
      status,
      requiredDocuments: summary,
      complianceScore,
      lastEvaluatedAt: now,
      approvedAt: status === 'approved' ? application.approvedAt || now : application.approvedAt,
      expiresAt,
      badgeEnabled: status === 'approved' ? application.badgeEnabled : false
    },
    { transaction }
  );

  await updateCompanyCompliance(
    companyId,
    {
      status,
      expiresAt,
      complianceScore,
      badgeEnabled: status === 'approved' ? application.badgeEnabled : false
    },
    transaction
  );

  if (status !== 'approved') {
    await Company.update(
      {
        insuredSellerBadgeVisible: false
      },
      { where: { id: companyId }, transaction }
    );
    await application.update({ badgeEnabled: false }, { transaction });
  }

  return application;
}

export async function getCompanyComplianceSummary(companyId) {
  const [application, documents] = await Promise.all([
    ensureApplication(companyId),
    ComplianceDocument.findAll({
      where: { companyId },
      order: [['submittedAt', 'DESC']]
    })
  ]);

  const plainApplication = application ? toPlain(application) : null;
  const plainDocuments = documents.map((doc) => {
    const payload = toPlain(doc);
    return {
      ...payload,
      downloadUrl: `/api/v1/compliance/documents/${payload.id}/download`
    };
  });

  return {
    application: plainApplication,
    documents: plainDocuments
  };
}

export async function toggleInsuredSellerBadge(companyId, { actorId = null, visible }) {
  return sequelize.transaction(async (transaction) => {
    const application = await InsuredSellerApplication.findOne({
      where: { companyId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!application || application.status !== 'approved') {
      throw complianceError('Insured seller badge can only be toggled when application is approved', 409);
    }

    await application.update({ badgeEnabled: visible }, { transaction });
    await Company.update({ insuredSellerBadgeVisible: visible }, { where: { id: companyId }, transaction });

    await MarketplaceModerationAction.create(
      {
        entityType: 'insured_seller_badge',
        entityId: companyId,
        action: visible ? 'enabled' : 'disabled',
        actorId,
        metadata: {
          companyId,
          applicationId: application.id
        }
      },
      { transaction }
    );

    return application;
  });
}

export async function suspendInsuredSeller(companyId, { actorId = null, reason, metadata = {} }) {
  if (!reason) {
    throw complianceError('Suspension reason is required');
  }

  return sequelize.transaction(async (transaction) => {
    const application = await ensureApplication(companyId, transaction);

    await application.update(
      {
        status: 'suspended',
        badgeEnabled: false,
        notes: reason,
        lastEvaluatedAt: new Date()
      },
      { transaction }
    );

    await Company.update(
      {
        insuredSellerStatus: 'suspended',
        insuredSellerBadgeVisible: false
      },
      { where: { id: companyId }, transaction }
    );

    await MarketplaceModerationAction.create(
      {
        entityType: 'insured_seller_application',
        entityId: application.id,
        action: 'suspended',
        actorId,
        reason,
        metadata: {
          ...metadata,
          companyId
        }
      },
      { transaction }
    );

    return application;
  });
}
