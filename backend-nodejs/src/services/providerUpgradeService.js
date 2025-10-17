import { z } from 'zod';
import sequelize from '../config/database.js';
import {
  Company,
  User,
  EnterpriseUpgradeRequest,
  EnterpriseUpgradeContact,
  EnterpriseUpgradeSite,
  EnterpriseUpgradeChecklistItem,
  EnterpriseUpgradeDocument
} from '../models/index.js';

const REQUEST_STATUSES = ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'deferred'];
const CHECKLIST_STATUSES = ['not_started', 'in_progress', 'blocked', 'complete'];

function buildHttpError(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  return error;
}

async function resolveCompanyContext({ companyId, actor }) {
  if (!actor?.id) {
    throw buildHttpError(403, 'forbidden');
  }

  const actorRecord = await User.findByPk(actor.id, { attributes: ['id', 'type'] });
  if (!actorRecord) {
    throw buildHttpError(403, 'forbidden');
  }

  if (actorRecord.type === 'admin') {
    const where = companyId ? { id: companyId } : {};
    const companyInstance = await Company.findOne({ where, order: [['createdAt', 'ASC']] });
    if (!companyInstance) {
      throw buildHttpError(404, 'company_not_found');
    }
    return companyInstance.get({ plain: true });
  }

  if (!['company', 'provider_admin'].includes(actorRecord.type)) {
    throw buildHttpError(403, 'forbidden');
  }

  const where = companyId ? { id: companyId, userId: actorRecord.id } : { userId: actorRecord.id };
  const companyInstance = await Company.findOne({ where });
  if (!companyInstance) {
    throw buildHttpError(404, 'company_not_found');
  }

  return companyInstance.get({ plain: true });
}

function normaliseMaybeString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    return String(value);
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

const nullableDate = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (value instanceof Date) return value;
    return new Date(value);
  }, z.union([z.date(), z.null()]).optional());

const nullableNumber = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }, z.union([z.number(), z.null()]).optional())
  .refine((value) => value === undefined || value === null || Number.isFinite(value), 'Invalid number');

const nullableInteger = nullableNumber.refine(
  (value) => value === undefined || value === null || Number.isInteger(value),
  'Must be an integer'
);

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(160),
  role: z.string().max(120).optional().nullable(),
  email: z.string().max(160).optional().nullable(),
  phone: z.string().max(48).optional().nullable(),
  influenceLevel: z.string().max(60).optional().nullable(),
  primaryContact: z.boolean().optional()
});

const siteSchema = z.object({
  id: z.string().uuid().optional(),
  siteName: z.string().min(1).max(160),
  region: z.string().max(120).optional().nullable(),
  headcount: nullableInteger,
  goLiveDate: nullableDate,
  imageUrl: z.string().max(512).optional().nullable(),
  notes: z.string().max(2000).optional().nullable()
});

const checklistItemSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(180),
  status: z.enum(CHECKLIST_STATUSES),
  owner: z.string().max(120).optional().nullable(),
  dueDate: nullableDate,
  notes: z.string().max(4000).optional().nullable(),
  sortOrder: nullableInteger
});

const documentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(180),
  type: z.string().max(60).optional().nullable(),
  url: z.string().min(1).max(512),
  thumbnailUrl: z.string().max(512).optional().nullable(),
  description: z.string().max(4000).optional().nullable()
});

const requestPayloadSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  summary: z.string().max(8000).optional().nullable(),
  requestedAt: nullableDate,
  targetGoLive: nullableDate,
  lastDecisionAt: nullableDate,
  seats: nullableInteger,
  contractValue: nullableNumber,
  currency: z.string().length(3).optional(),
  automationScope: z.string().max(8000).optional().nullable(),
  enterpriseFeatures: z.array(z.string().max(120)).optional(),
  onboardingManager: z.string().max(160).optional().nullable(),
  notes: z.string().max(8000).optional().nullable(),
  contacts: z.array(contactSchema).optional(),
  sites: z.array(siteSchema).optional(),
  checklist: z.array(checklistItemSchema).optional(),
  documents: z.array(documentSchema).optional(),
  removedContactIds: z.array(z.string().uuid()).optional(),
  removedSiteIds: z.array(z.string().uuid()).optional(),
  removedChecklistIds: z.array(z.string().uuid()).optional(),
  removedDocumentIds: z.array(z.string().uuid()).optional()
});

function sanitiseStrings(payload = {}) {
  const next = { ...payload };
  if ('summary' in next) next.summary = normaliseMaybeString(next.summary) ?? null;
  if ('automationScope' in next) next.automationScope = normaliseMaybeString(next.automationScope) ?? null;
  if ('onboardingManager' in next) next.onboardingManager = normaliseMaybeString(next.onboardingManager) ?? null;
  if ('notes' in next) next.notes = normaliseMaybeString(next.notes) ?? null;
  if ('currency' in next && typeof next.currency === 'string') {
    next.currency = next.currency.trim().toUpperCase();
  }

  if (Array.isArray(next.contacts)) {
    next.contacts = next.contacts.map((contact) => ({
      ...contact,
      role: normaliseMaybeString(contact.role) ?? null,
      email: normaliseMaybeString(contact.email) ?? null,
      phone: normaliseMaybeString(contact.phone) ?? null,
      influenceLevel: normaliseMaybeString(contact.influenceLevel) ?? null
    }));
  }

  if (Array.isArray(next.sites)) {
    next.sites = next.sites.map((site) => ({
      ...site,
      region: normaliseMaybeString(site.region) ?? null,
      imageUrl: normaliseMaybeString(site.imageUrl) ?? null,
      notes: normaliseMaybeString(site.notes) ?? null
    }));
  }

  if (Array.isArray(next.checklist)) {
    next.checklist = next.checklist.map((item) => ({
      ...item,
      owner: normaliseMaybeString(item.owner) ?? null,
      notes: normaliseMaybeString(item.notes) ?? null
    }));
  }

  if (Array.isArray(next.documents)) {
    next.documents = next.documents.map((doc) => ({
      ...doc,
      type: normaliseMaybeString(doc.type) ?? null,
      thumbnailUrl: normaliseMaybeString(doc.thumbnailUrl) ?? null,
      description: normaliseMaybeString(doc.description) ?? null
    }));
  }

  return next;
}

async function fetchLatestUpgradeRequest(companyId, { transaction } = {}) {
  const request = await EnterpriseUpgradeRequest.findOne({
    where: { companyId },
    order: [['createdAt', 'DESC']],
    include: [
      { model: EnterpriseUpgradeContact, as: 'contacts', order: [['createdAt', 'ASC']] },
      { model: EnterpriseUpgradeSite, as: 'sites', order: [['createdAt', 'ASC']] },
      {
        model: EnterpriseUpgradeChecklistItem,
        as: 'checklistItems',
        order: [
          ['sortOrder', 'ASC'],
          ['createdAt', 'ASC']
        ]
      },
      { model: EnterpriseUpgradeDocument, as: 'documents', order: [['createdAt', 'ASC']] }
    ],
    transaction
  });

  if (!request) {
    return null;
  }

  const plain = request.get({ plain: true });
  return {
    ...plain,
    contacts: plain.contacts ?? [],
    sites: plain.sites ?? [],
    checklist: plain.checklistItems ?? [],
    documents: plain.documents ?? []
  };
}

export async function getEnterpriseUpgradeForActor({ companyId, actor }) {
  const company = await resolveCompanyContext({ companyId, actor });
  return fetchLatestUpgradeRequest(company.id);
}

export async function getEnterpriseUpgradeByCompany(companyId) {
  if (!companyId) {
    return null;
  }
  return fetchLatestUpgradeRequest(companyId);
}

export async function createEnterpriseUpgrade({ actor, companyId, payload = {} }) {
  const company = await resolveCompanyContext({ companyId, actor });
  const parsed = requestPayloadSchema.parse(sanitiseStrings(payload));

  if (await fetchLatestUpgradeRequest(company.id)) {
    throw buildHttpError(409, 'upgrade_request_already_exists');
  }

  const requestRecord = await sequelize.transaction(async (transaction) => {
    const request = await EnterpriseUpgradeRequest.create(
      {
        companyId: company.id,
        status: parsed.status ?? 'draft',
        summary: parsed.summary ?? null,
        requestedBy: actor?.id ?? null,
        requestedAt: parsed.requestedAt ?? new Date(),
        targetGoLive: parsed.targetGoLive ?? null,
        seats: parsed.seats ?? null,
        contractValue: parsed.contractValue ?? null,
        currency: parsed.currency ?? 'GBP',
        automationScope: parsed.automationScope ?? null,
        enterpriseFeatures: Array.from(new Set(parsed.enterpriseFeatures ?? [])),
        onboardingManager: parsed.onboardingManager ?? null,
        notes: parsed.notes ?? null,
        lastDecisionAt: parsed.lastDecisionAt ?? null
      },
      { transaction }
    );

    if (parsed.contacts) {
      await Promise.all(
        parsed.contacts.map((contact) =>
          EnterpriseUpgradeContact.create(
            {
              upgradeRequestId: request.id,
              name: contact.name,
              role: contact.role ?? null,
              email: contact.email ?? null,
              phone: contact.phone ?? null,
              influenceLevel: contact.influenceLevel ?? null,
              primaryContact: Boolean(contact.primaryContact)
            },
            { transaction }
          )
        )
      );
    }

    if (parsed.sites) {
      await Promise.all(
        parsed.sites.map((site) =>
          EnterpriseUpgradeSite.create(
            {
              upgradeRequestId: request.id,
              siteName: site.siteName,
              region: site.region ?? null,
              headcount: site.headcount ?? null,
              goLiveDate: site.goLiveDate ?? null,
              imageUrl: site.imageUrl ?? null,
              notes: site.notes ?? null
            },
            { transaction }
          )
        )
      );
    }

    if (parsed.checklist) {
      await Promise.all(
        parsed.checklist.map((item, index) =>
          EnterpriseUpgradeChecklistItem.create(
            {
              upgradeRequestId: request.id,
              label: item.label,
              status: item.status,
              owner: item.owner ?? null,
              dueDate: item.dueDate ?? null,
              notes: item.notes ?? null,
              sortOrder: item.sortOrder ?? index
            },
            { transaction }
          )
        )
      );
    }

    if (parsed.documents) {
      await Promise.all(
        parsed.documents.map((doc) =>
          EnterpriseUpgradeDocument.create(
            {
              upgradeRequestId: request.id,
              title: doc.title,
              type: doc.type ?? null,
              url: doc.url,
              thumbnailUrl: doc.thumbnailUrl ?? null,
              description: doc.description ?? null
            },
            { transaction }
          )
        )
      );
    }

    return request;
  });

  return fetchLatestUpgradeRequest(requestRecord.companyId);
}

function partitionById(records = []) {
  return records.reduce(
    (acc, record) => {
      if (record.id) {
        acc.existing.push(record);
      } else {
        acc.create.push(record);
      }
      return acc;
    },
    { create: [], existing: [] }
  );
}

export async function updateEnterpriseUpgrade({ actor, companyId, requestId, payload = {} }) {
  const company = await resolveCompanyContext({ companyId, actor });
  const existing = await EnterpriseUpgradeRequest.findOne({
    where: { id: requestId, companyId: company.id }
  });

  if (!existing) {
    throw buildHttpError(404, 'upgrade_request_not_found');
  }

  const parsed = requestPayloadSchema.parse(sanitiseStrings(payload));

  await sequelize.transaction(async (transaction) => {
    await existing.update(
      {
        status: parsed.status ?? existing.status,
        summary: parsed.summary ?? existing.summary,
        requestedAt: parsed.requestedAt ?? existing.requestedAt,
        targetGoLive: parsed.targetGoLive ?? existing.targetGoLive,
        seats: parsed.seats ?? existing.seats,
        contractValue: parsed.contractValue ?? existing.contractValue,
        currency: parsed.currency ?? existing.currency,
        automationScope: parsed.automationScope ?? existing.automationScope,
        enterpriseFeatures: Array.from(new Set(parsed.enterpriseFeatures ?? existing.enterpriseFeatures ?? [])),
        onboardingManager: parsed.onboardingManager ?? existing.onboardingManager,
        notes: parsed.notes ?? existing.notes,
        lastDecisionAt: parsed.lastDecisionAt ?? existing.lastDecisionAt
      },
      { transaction }
    );

    if (parsed.contacts) {
      const { create, existing: updateSet } = partitionById(parsed.contacts);
      await Promise.all(
        updateSet.map((contact) =>
          EnterpriseUpgradeContact.update(
            {
              name: contact.name,
              role: contact.role ?? null,
              email: contact.email ?? null,
              phone: contact.phone ?? null,
              influenceLevel: contact.influenceLevel ?? null,
              primaryContact: Boolean(contact.primaryContact)
            },
            { where: { id: contact.id, upgradeRequestId: existing.id }, transaction }
          )
        )
      );
      await Promise.all(
        create.map((contact) =>
          EnterpriseUpgradeContact.create(
            {
              upgradeRequestId: existing.id,
              name: contact.name,
              role: contact.role ?? null,
              email: contact.email ?? null,
              phone: contact.phone ?? null,
              influenceLevel: contact.influenceLevel ?? null,
              primaryContact: Boolean(contact.primaryContact)
            },
            { transaction }
          )
        )
      );
    }

    if (Array.isArray(parsed.removedContactIds) && parsed.removedContactIds.length > 0) {
      await EnterpriseUpgradeContact.destroy({
        where: { id: parsed.removedContactIds, upgradeRequestId: existing.id },
        transaction
      });
    }

    if (parsed.sites) {
      const { create, existing: updateSet } = partitionById(parsed.sites);
      await Promise.all(
        updateSet.map((site) =>
          EnterpriseUpgradeSite.update(
            {
              siteName: site.siteName,
              region: site.region ?? null,
              headcount: site.headcount ?? null,
              goLiveDate: site.goLiveDate ?? null,
              imageUrl: site.imageUrl ?? null,
              notes: site.notes ?? null
            },
            { where: { id: site.id, upgradeRequestId: existing.id }, transaction }
          )
        )
      );
      await Promise.all(
        create.map((site) =>
          EnterpriseUpgradeSite.create(
            {
              upgradeRequestId: existing.id,
              siteName: site.siteName,
              region: site.region ?? null,
              headcount: site.headcount ?? null,
              goLiveDate: site.goLiveDate ?? null,
              imageUrl: site.imageUrl ?? null,
              notes: site.notes ?? null
            },
            { transaction }
          )
        )
      );
    }

    if (Array.isArray(parsed.removedSiteIds) && parsed.removedSiteIds.length > 0) {
      await EnterpriseUpgradeSite.destroy({
        where: { id: parsed.removedSiteIds, upgradeRequestId: existing.id },
        transaction
      });
    }

    if (parsed.checklist) {
      const { create, existing: updateSet } = partitionById(parsed.checklist);
      await Promise.all(
        updateSet.map((item, index) =>
          EnterpriseUpgradeChecklistItem.update(
            {
              label: item.label,
              status: item.status,
              owner: item.owner ?? null,
              dueDate: item.dueDate ?? null,
              notes: item.notes ?? null,
              sortOrder: item.sortOrder ?? index
            },
            { where: { id: item.id, upgradeRequestId: existing.id }, transaction }
          )
        )
      );
      await Promise.all(
        create.map((item, index) =>
          EnterpriseUpgradeChecklistItem.create(
            {
              upgradeRequestId: existing.id,
              label: item.label,
              status: item.status,
              owner: item.owner ?? null,
              dueDate: item.dueDate ?? null,
              notes: item.notes ?? null,
              sortOrder: item.sortOrder ?? index
            },
            { transaction }
          )
        )
      );
    }

    if (Array.isArray(parsed.removedChecklistIds) && parsed.removedChecklistIds.length > 0) {
      await EnterpriseUpgradeChecklistItem.destroy({
        where: { id: parsed.removedChecklistIds, upgradeRequestId: existing.id },
        transaction
      });
    }

    if (parsed.documents) {
      const { create, existing: updateSet } = partitionById(parsed.documents);
      await Promise.all(
        updateSet.map((doc) =>
          EnterpriseUpgradeDocument.update(
            {
              title: doc.title,
              type: doc.type ?? null,
              url: doc.url,
              thumbnailUrl: doc.thumbnailUrl ?? null,
              description: doc.description ?? null
            },
            { where: { id: doc.id, upgradeRequestId: existing.id }, transaction }
          )
        )
      );
      await Promise.all(
        create.map((doc) =>
          EnterpriseUpgradeDocument.create(
            {
              upgradeRequestId: existing.id,
              title: doc.title,
              type: doc.type ?? null,
              url: doc.url,
              thumbnailUrl: doc.thumbnailUrl ?? null,
              description: doc.description ?? null
            },
            { transaction }
          )
        )
      );
    }

    if (Array.isArray(parsed.removedDocumentIds) && parsed.removedDocumentIds.length > 0) {
      await EnterpriseUpgradeDocument.destroy({
        where: { id: parsed.removedDocumentIds, upgradeRequestId: existing.id },
        transaction
      });
    }
  });

  return fetchLatestUpgradeRequest(existing.companyId);
}

export default {
  getEnterpriseUpgradeForActor,
  getEnterpriseUpgradeByCompany,
  createEnterpriseUpgrade,
  updateEnterpriseUpgrade
};
