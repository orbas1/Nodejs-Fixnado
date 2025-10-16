import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import sequelize, {
  LegalDocument,
  LegalDocumentVersion
} from '../models/index.js';

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function normaliseParagraphs(input) {
  if (Array.isArray(input)) {
    return input
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry && entry.length > 0);
  }

  if (typeof input === 'string') {
    return input
      .split(/\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }

  return [];
}

function normaliseAttachments(entries = []) {
  return ensureArray(entries)
    .map((entry, index) => {
      if (!entry) return null;
      const label = typeof entry.label === 'string' && entry.label.trim().length > 0
        ? entry.label.trim()
        : `Attachment ${index + 1}`;
      const url = typeof entry.url === 'string' ? entry.url.trim() : '';
      if (!url) {
        return null;
      }
      const description =
        typeof entry.description === 'string' && entry.description.trim().length > 0
          ? entry.description.trim()
          : null;
      const type = typeof entry.type === 'string' && entry.type.trim().length > 0 ? entry.type.trim() : null;
      const id = typeof entry.id === 'string' && entry.id.trim().length > 0 ? entry.id.trim() : null;

      return {
        id,
        label,
        url,
        description,
        type
      };
    })
    .filter(Boolean);
}

function slugify(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120) || fallback;
}

async function ensureUniqueSlug(baseSlug, transaction) {
  let candidate = baseSlug;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await LegalDocument.findOne({ where: { slug: candidate }, transaction, lock: transaction.LOCK.UPDATE });
    if (!existing) {
      return candidate;
    }
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function normaliseSections(sections = []) {
  return ensureArray(sections).map((section, index) => {
    const title = section?.title?.trim() || `Section ${index + 1}`;
    const id = section?.id?.trim() || `section-${index + 1}`;
    const anchor = section?.anchor?.trim() || slugify(title, `section-${index + 1}`);
    const summary = section?.summary?.trim() || null;
    const body = normaliseParagraphs(section?.body);

    return {
      id,
      anchor,
      title,
      summary,
      body,
      kind: section?.kind?.trim() || 'paragraphs',
      attachments: normaliseAttachments(section?.attachments)
    };
  });
}

function buildContentPayload(document, payload = {}) {
  const hero = {
    eyebrow: payload?.hero?.eyebrow?.trim() || 'Legal library',
    title: payload?.hero?.title?.trim() || document.title,
    summary: payload?.hero?.summary?.trim() || document.summary
  };

  const contact = {
    email: payload?.contactEmail?.trim() || document.contactEmail || null,
    phone: payload?.contactPhone?.trim() || document.contactPhone || null,
    url: payload?.contactUrl?.trim() || document.contactUrl || 'https://fixnado.com/legal'
  };

  const metadata = {
    reviewCadence: payload?.reviewCadence?.trim() || document.reviewCadence || null,
    owner: document.owner
  };

  const sections = normaliseSections(payload?.sections || []);

  const attachments = normaliseAttachments(payload?.attachments || []);

  return { hero, contact, metadata, sections, attachments };
}

function toPlain(version) {
  if (!version) return null;
  const plain = version.get({ plain: true });
  return {
    id: plain.id,
    documentId: plain.documentId,
    version: plain.version,
    status: plain.status,
    changeNotes: plain.changeNotes,
    content: plain.content,
    attachments: normaliseAttachments(plain.attachments),
    createdBy: plain.createdBy,
    publishedBy: plain.publishedBy,
    effectiveAt: plain.effectiveAt ? new Date(plain.effectiveAt).toISOString() : null,
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null
  };
}

function computeDocumentStatus(publishedVersion, draftVersion) {
  if (draftVersion) {
    return draftVersion.status === 'draft'
      ? `Draft v${draftVersion.version} awaiting review`
      : `Pending status • v${draftVersion.version}`;
  }

  if (publishedVersion) {
    return `Published v${publishedVersion.version}`;
  }

  return 'No published versions';
}

function computeDocumentHealth(document, publishedVersion, draftVersion) {
  const nextEffective = draftVersion?.effectiveAt || null;
  const reviewCadence = document.reviewCadence;
  const lastPublished = publishedVersion?.publishedAt || publishedVersion?.effectiveAt || null;
  return {
    nextEffective,
    reviewCadence,
    lastPublished
  };
}

export async function listLegalDocumentsSummary({ timezone = 'Europe/London' } = {}) {
  const documents = await LegalDocument.findAll({ order: [['title', 'ASC']] });
  if (!documents.length) {
    return { documents: [], stats: { publishedCount: 0, draftCount: 0 }, timeline: [] };
  }

  const documentIds = documents.map((doc) => doc.id);

  const versions = await LegalDocumentVersion.findAll({
    where: { documentId: { [Op.in]: documentIds } },
    order: [
      ['documentId', 'ASC'],
      ['version', 'DESC']
    ],
    attributes: [
      'id',
      'documentId',
      'version',
      'status',
      'changeNotes',
      'effectiveAt',
      'publishedAt',
      'createdAt',
      'updatedAt',
      'createdBy',
      'publishedBy'
    ]
  });

  const latestPublished = new Map();
  const latestDraft = new Map();

  versions.forEach((version) => {
    const data = version.get({ plain: true });
    if (data.status === 'published' && !latestPublished.has(data.documentId)) {
      latestPublished.set(data.documentId, data);
    }
    if (data.status === 'draft' && !latestDraft.has(data.documentId)) {
      latestDraft.set(data.documentId, data);
    }
  });

  const summary = documents.map((doc) => {
    const published = latestPublished.get(doc.id) || null;
    const draft = latestDraft.get(doc.id) || null;
    const statusLabel = computeDocumentStatus(published, draft);
    const draftEffective = draft?.effectiveAt ? new Date(draft.effectiveAt).toISOString() : null;
    const publishedEffective = published?.effectiveAt ? new Date(published.effectiveAt).toISOString() : null;
    const publishedVersion = publishedEffective ? { ...published, effectiveAt: publishedEffective } : published;
    const health = computeDocumentHealth(doc, publishedVersion, draft);

    const previewPath = `/legal/${doc.slug}`;

    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary,
      heroImageUrl: doc.heroImageUrl,
      owner: doc.owner,
      contactEmail: doc.contactEmail,
      contactPhone: doc.contactPhone,
      contactUrl: doc.contactUrl,
      reviewCadence: doc.reviewCadence,
      statusLabel,
      publishedVersion: published
        ? {
            version: published.version,
            effectiveAt: publishedEffective,
            publishedAt: published.publishedAt ? new Date(published.publishedAt).toISOString() : null
          }
        : null,
      draftVersion: draft
        ? {
            id: draft.id,
            version: draft.version,
            updatedAt: draft.updatedAt ? new Date(draft.updatedAt).toISOString() : null,
            changeNotes: draft.changeNotes || null,
            effectiveAt: draftEffective
          }
        : null,
      health: {
        ...health,
        nextEffective: draftEffective,
        lastPublished: published?.publishedAt ? new Date(published.publishedAt).toISOString() : null
      },
      previewPath
    };
  });

  const timelineRecords = await LegalDocumentVersion.findAll({
    where: { documentId: { [Op.in]: documentIds } },
    include: [
      {
        model: LegalDocument,
        as: 'document',
        attributes: ['id', 'slug', 'title']
      }
    ],
    order: [['updatedAt', 'DESC']],
    limit: 8
  });

  const timeline = timelineRecords.map((record) => {
    const data = record.get({ plain: true });
    const timestamp = DateTime.fromJSDate(new Date(data.updatedAt)).setZone(timezone);
    return {
      id: data.id,
      documentId: data.documentId,
      slug: data.document?.slug,
      title: data.document?.title,
      version: data.version,
      status: data.status,
      updatedAt: timestamp.toISO(),
      actor: data.publishedBy || data.createdBy || 'system'
    };
  });

  const publishedCount = summary.filter((doc) => doc.publishedVersion).length;
  const draftCount = summary.filter((doc) => doc.draftVersion).length;

  return {
    documents: summary,
    stats: {
      publishedCount,
      draftCount
    },
    timeline
  };
}

export async function getLegalDocumentDetail(slug) {
  const document = await LegalDocument.findOne({ where: { slug } });
  if (!document) {
    return null;
  }

  const versions = await LegalDocumentVersion.findAll({
    where: { documentId: document.id },
    order: [['version', 'DESC']]
  });

  const plainVersions = versions.map((version) => toPlain(version));
  const draftVersion = plainVersions.find((version) => version.status === 'draft') || null;
  const currentVersion = plainVersions.find((version) => version.id === document.currentVersionId) || null;

  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    heroImageUrl: document.heroImageUrl,
    owner: document.owner,
    contactEmail: document.contactEmail,
    contactPhone: document.contactPhone,
    contactUrl: document.contactUrl,
    reviewCadence: document.reviewCadence,
    currentVersion,
    draftVersion,
    versions: plainVersions
  };
}

function applyDocumentMetadata(document, payload = {}, actor) {
  if (payload.title !== undefined) {
    document.title = payload.title ? payload.title.trim() : document.title;
  }
  if (payload.summary !== undefined) {
    document.summary = payload.summary ? payload.summary.trim() : '';
  }
  if (payload.heroImageUrl !== undefined) {
    document.heroImageUrl = payload.heroImageUrl ? payload.heroImageUrl.trim() : null;
  }
  if (payload.contactEmail !== undefined) {
    document.contactEmail = payload.contactEmail ? payload.contactEmail.trim() : null;
  }
  if (payload.contactPhone !== undefined) {
    document.contactPhone = payload.contactPhone ? payload.contactPhone.trim() : null;
  }
  if (payload.contactUrl !== undefined) {
    document.contactUrl = payload.contactUrl ? payload.contactUrl.trim() : null;
  }
  if (payload.owner !== undefined) {
    document.owner = payload.owner ? payload.owner.trim() : document.owner;
  }
  if (payload.reviewCadence !== undefined) {
    document.reviewCadence = payload.reviewCadence ? payload.reviewCadence.trim() : null;
  }
  if (actor) {
    document.updatedBy = actor;
  }
}

export async function createLegalDocument({ payload, actor = 'admin' }) {
  const requestedSlug = typeof payload?.slug === 'string' ? payload.slug.trim() : '';
  const fallbackSlugBase = typeof payload?.title === 'string' && payload.title.trim().length > 0
    ? slugify(payload.title, 'legal-document')
    : 'legal-document';
  const baseSlug = slugify(requestedSlug, fallbackSlugBase);

  if (!baseSlug) {
    throw new Error('Slug is required');
  }

  const { slug } = await sequelize.transaction(async (transaction) => {
    const uniqueSlug = await ensureUniqueSlug(baseSlug, transaction);

    const document = await LegalDocument.create(
      {
        slug: uniqueSlug,
        title: payload?.title?.trim() || 'Untitled policy',
        summary: payload?.summary?.trim() || '',
        heroImageUrl: payload?.heroImageUrl?.trim() || null,
        owner: payload?.owner?.trim() || 'Blackwellen Ltd Legal Team',
        contactEmail: payload?.contactEmail?.trim() || null,
        contactPhone: payload?.contactPhone?.trim() || null,
        contactUrl: payload?.contactUrl?.trim() || null,
        reviewCadence: payload?.reviewCadence?.trim() || null,
        createdBy: actor,
        updatedBy: actor
      },
      { transaction }
    );

    const { attachments, ...content } = buildContentPayload(document, payload);

    await LegalDocumentVersion.create(
      {
        documentId: document.id,
        version: 1,
        status: 'draft',
        changeNotes: payload?.changeNotes?.trim() || 'Initial draft created',
        content,
        attachments,
        createdBy: actor
      },
      { transaction }
    );

    return { slug: document.slug };
  });

  return getLegalDocumentDetail(slug);
}

export async function createDraftVersion({ slug, payload, actor = 'admin' }) {
  return sequelize.transaction(async (transaction) => {
    const document = await LegalDocument.findOne({ where: { slug }, transaction, lock: transaction.LOCK.UPDATE });
    if (!document) {
      throw new Error('Document not found');
    }

    const existingDraft = await LegalDocumentVersion.findOne({
      where: { documentId: document.id, status: 'draft' },
      order: [['version', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingDraft) {
      throw new Error('Draft already exists');
    }

    const maxVersion =
      (await LegalDocumentVersion.max('version', { where: { documentId: document.id }, transaction })) || 0;
    const nextVersion = maxVersion + 1;

    applyDocumentMetadata(document, payload, actor);
    const { attachments, ...content } = buildContentPayload(document, payload);

    const draft = await LegalDocumentVersion.create(
      {
        documentId: document.id,
        version: nextVersion,
        status: 'draft',
        changeNotes: payload?.changeNotes || null,
        content,
        attachments,
        createdBy: actor
      },
      { transaction }
    );

    await document.save({ transaction });

    return toPlain(draft);
  });
}

export async function updateDraftVersion({ slug, versionId, payload, actor = 'admin' }) {
  return sequelize.transaction(async (transaction) => {
    const document = await LegalDocument.findOne({ where: { slug }, transaction, lock: transaction.LOCK.UPDATE });
    if (!document) {
      throw new Error('Document not found');
    }

    const draft = await LegalDocumentVersion.findOne({
      where: { id: versionId, documentId: document.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!draft) {
      throw new Error('Draft not found');
    }

    if (draft.status !== 'draft') {
      throw new Error('Only draft versions can be updated');
    }

    applyDocumentMetadata(document, payload, actor);
    const { attachments, ...content } = buildContentPayload(document, payload);

    draft.changeNotes = payload?.changeNotes || draft.changeNotes || null;
    draft.content = content;
    draft.attachments = attachments.length ? attachments : [];

    await Promise.all([document.save({ transaction }), draft.save({ transaction })]);

    return toPlain(draft);
  });
}

export async function updateLegalDocumentMetadata({ slug, payload, actor = 'admin' }) {
  const result = await sequelize.transaction(async (transaction) => {
    const document = await LegalDocument.findOne({ where: { slug }, transaction, lock: transaction.LOCK.UPDATE });
    if (!document) {
      throw new Error('Document not found');
    }

    applyDocumentMetadata(document, payload, actor);
    await document.save({ transaction });

    return { slug: document.slug };
  });

  return getLegalDocumentDetail(result.slug);
}

export async function publishLegalDocumentVersion({ slug, versionId, effectiveAt, actor = 'admin' }) {
  return sequelize.transaction(async (transaction) => {
    const document = await LegalDocument.findOne({ where: { slug }, transaction, lock: transaction.LOCK.UPDATE });
    if (!document) {
      throw new Error('Document not found');
    }

    const version = await LegalDocumentVersion.findOne({
      where: { id: versionId, documentId: document.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!version) {
      throw new Error('Version not found');
    }

    const targetEffectiveDate = effectiveAt ? new Date(effectiveAt) : new Date();
    if (Number.isNaN(targetEffectiveDate.getTime())) {
      throw new Error('Invalid effective date');
    }

    await LegalDocumentVersion.update(
      { status: 'archived' },
      {
        where: {
          documentId: document.id,
          status: 'published',
          id: { [Op.ne]: version.id }
        },
        transaction
      }
    );

    version.status = 'published';
    version.publishedAt = new Date();
    version.effectiveAt = targetEffectiveDate;
    version.publishedBy = actor;

    document.currentVersionId = version.id;
    document.updatedBy = actor;

    await Promise.all([version.save({ transaction }), document.save({ transaction })]);

    return toPlain(version);
  });
}

export async function archiveDraftVersion({ slug, versionId }) {
  return sequelize.transaction(async (transaction) => {
    const document = await LegalDocument.findOne({ where: { slug }, transaction, lock: transaction.LOCK.UPDATE });
    if (!document) {
      throw new Error('Document not found');
    }

    const version = await LegalDocumentVersion.findOne({
      where: { id: versionId, documentId: document.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!version) {
      throw new Error('Version not found');
    }

    if (version.status !== 'draft') {
      throw new Error('Only drafts can be archived');
    }

    version.status = 'archived';
    await version.save({ transaction });

    return toPlain(version);
  });
}

export async function deleteLegalDocument({ slug }) {
  await sequelize.transaction(async (transaction) => {
    const document = await LegalDocument.findOne({ where: { slug }, transaction, lock: transaction.LOCK.UPDATE });
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.currentVersionId) {
      throw new Error('Cannot delete published document');
    }

    await document.destroy({ transaction });
  });
}

export default {
  listLegalDocumentsSummary,
  getLegalDocumentDetail,
  createLegalDocument,
  createDraftVersion,
  updateDraftVersion,
  updateLegalDocumentMetadata,
  publishLegalDocumentVersion,
  archiveDraftVersion,
  deleteLegalDocument
};
