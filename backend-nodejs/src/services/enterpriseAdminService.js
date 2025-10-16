import slugify from 'slugify';
import sequelize from '../config/database.js';
import {
  EnterpriseAccount,
  EnterpriseSite,
  EnterpriseStakeholder,
  EnterprisePlaybook
} from '../models/index.js';

const ACCOUNT_STATUSES = ['active', 'pilot', 'paused', 'offboarding', 'prospect'];
const ACCOUNT_PRIORITIES = ['standard', 'priority', 'critical'];
const SITE_STATUSES = ['operational', 'maintenance', 'standby', 'offline'];
const PLAYBOOK_STATUSES = ['draft', 'approved', 'in_review', 'retired'];

function normaliseString(value, { maxLength = 255, fallback = null } = {}) {
  if (value == null) {
    return fallback;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return fallback;
  }
  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function normaliseEmail(value) {
  const email = normaliseString(value, { maxLength: 160, fallback: null });
  if (!email) {
    return null;
  }
  return email.toLowerCase();
}

function ensureAccountPayload(payload = {}, { isCreate = false } = {}) {
  const name = normaliseString(payload.name, { maxLength: 180 });
  if (!name && isCreate) {
    throw Object.assign(new Error('Enterprise name is required'), { statusCode: 422 });
  }

  const status = normaliseString(payload.status, { maxLength: 32 }) || 'active';
  const priority = normaliseString(payload.priority, { maxLength: 24 }) || 'standard';

  if (!ACCOUNT_STATUSES.includes(status)) {
    throw Object.assign(new Error('Unsupported enterprise status'), { statusCode: 422 });
  }
  if (!ACCOUNT_PRIORITIES.includes(priority)) {
    throw Object.assign(new Error('Unsupported enterprise priority'), { statusCode: 422 });
  }

  const body = {};

  if (name) body.name = name;
  body.status = status;
  body.priority = priority;
  body.accountManager = normaliseString(payload.accountManager, { maxLength: 120 });
  body.timezone = normaliseString(payload.timezone, { maxLength: 64, fallback: 'Europe/London' });
  body.supportEmail = normaliseEmail(payload.supportEmail);
  body.billingEmail = normaliseEmail(payload.billingEmail);
  body.supportPhone = normaliseString(payload.supportPhone, { maxLength: 48 });
  body.logoUrl = normaliseString(payload.logoUrl, { maxLength: 512 });
  body.heroImageUrl = normaliseString(payload.heroImageUrl, { maxLength: 512 });
  body.notes = payload.notes != null ? String(payload.notes).slice(0, 4000) : null;
  body.escalationNotes = payload.escalationNotes != null ? String(payload.escalationNotes).slice(0, 4000) : null;

  return body;
}

function ensureSitePayload(payload = {}, { isCreate = false } = {}) {
  const name = normaliseString(payload.name, { maxLength: 160 });
  if (!name && isCreate) {
    throw Object.assign(new Error('Site name is required'), { statusCode: 422 });
  }

  const status = normaliseString(payload.status, { maxLength: 32 }) || 'operational';
  if (!SITE_STATUSES.includes(status)) {
    throw Object.assign(new Error('Unsupported site status'), { statusCode: 422 });
  }

  const body = {};
  if (name) body.name = name;
  body.status = status;
  body.code = normaliseString(payload.code, { maxLength: 40 });
  body.addressLine1 = normaliseString(payload.addressLine1, { maxLength: 180 });
  body.addressLine2 = normaliseString(payload.addressLine2, { maxLength: 180 });
  body.city = normaliseString(payload.city, { maxLength: 120 });
  body.region = normaliseString(payload.region, { maxLength: 120 });
  body.postalCode = normaliseString(payload.postalCode, { maxLength: 24 });
  body.country = normaliseString(payload.country, { maxLength: 120 });
  body.timezone = normaliseString(payload.timezone, { maxLength: 64 });
  body.contactName = normaliseString(payload.contactName, { maxLength: 120 });
  body.contactEmail = normaliseEmail(payload.contactEmail);
  body.contactPhone = normaliseString(payload.contactPhone, { maxLength: 48 });
  body.capacityNotes = normaliseString(payload.capacityNotes, { maxLength: 240 });
  body.imageUrl = normaliseString(payload.imageUrl, { maxLength: 512 });
  body.mapUrl = normaliseString(payload.mapUrl, { maxLength: 512 });
  body.notes = payload.notes != null ? String(payload.notes).slice(0, 4000) : null;

  return body;
}

function ensureStakeholderPayload(payload = {}, { isCreate = false } = {}) {
  const role = normaliseString(payload.role, { maxLength: 120 });
  const name = normaliseString(payload.name, { maxLength: 160 });
  if ((!role || !name) && isCreate) {
    throw Object.assign(new Error('Stakeholder name and role are required'), { statusCode: 422 });
  }

  const body = {};
  if (role) body.role = role;
  if (name) body.name = name;
  body.email = normaliseEmail(payload.email);
  body.phone = normaliseString(payload.phone, { maxLength: 48 });
  body.escalationLevel = normaliseString(payload.escalationLevel, { maxLength: 48 });
  body.isPrimary = Boolean(payload.isPrimary);
  body.avatarUrl = normaliseString(payload.avatarUrl, { maxLength: 512 });
  body.notes = payload.notes != null ? String(payload.notes).slice(0, 4000) : null;

  return body;
}

function ensurePlaybookPayload(payload = {}, { isCreate = false } = {}) {
  const name = normaliseString(payload.name, { maxLength: 160 });
  if (!name && isCreate) {
    throw Object.assign(new Error('Playbook name is required'), { statusCode: 422 });
  }

  const status = normaliseString(payload.status, { maxLength: 32 }) || 'draft';
  if (!PLAYBOOK_STATUSES.includes(status)) {
    throw Object.assign(new Error('Unsupported playbook status'), { statusCode: 422 });
  }

  const body = {};
  if (name) body.name = name;
  body.status = status;
  body.category = normaliseString(payload.category, { maxLength: 120 });
  body.owner = normaliseString(payload.owner, { maxLength: 120 });
  body.documentUrl = normaliseString(payload.documentUrl, { maxLength: 512 });
  body.summary = payload.summary != null ? String(payload.summary).slice(0, 4000) : null;
  body.lastReviewedAt = payload.lastReviewedAt ? new Date(payload.lastReviewedAt) : null;

  return body;
}

async function generateUniqueSlug(name, { transaction } = {}) {
  const base = slugify(name || 'enterprise', { lower: true, strict: true }).slice(0, 170) || 'enterprise';
  let candidate = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // include archived accounts when checking slug uniqueness
    const existing = await EnterpriseAccount.findOne({
      where: { slug: candidate },
      paranoid: false,
      transaction
    });
    if (!existing) {
      return candidate;
    }
    counter += 1;
    candidate = `${base}-${counter}`.slice(0, 180);
  }
}

function serialiseSite(siteInstance) {
  const site = siteInstance?.toJSON ? siteInstance.toJSON() : siteInstance;
  if (!site) {
    return null;
  }
  return {
    id: site.id,
    enterpriseAccountId: site.enterpriseAccountId,
    name: site.name,
    code: site.code,
    status: site.status,
    addressLine1: site.addressLine1,
    addressLine2: site.addressLine2,
    city: site.city,
    region: site.region,
    postalCode: site.postalCode,
    country: site.country,
    timezone: site.timezone,
    contactName: site.contactName,
    contactEmail: site.contactEmail,
    contactPhone: site.contactPhone,
    capacityNotes: site.capacityNotes,
    imageUrl: site.imageUrl,
    mapUrl: site.mapUrl,
    notes: site.notes,
    createdBy: site.createdBy,
    updatedBy: site.updatedBy,
    createdAt: site.createdAt?.toISOString?.() ?? null,
    updatedAt: site.updatedAt?.toISOString?.() ?? null
  };
}

function serialiseStakeholder(instance) {
  const stakeholder = instance?.toJSON ? instance.toJSON() : instance;
  if (!stakeholder) {
    return null;
  }
  return {
    id: stakeholder.id,
    enterpriseAccountId: stakeholder.enterpriseAccountId,
    role: stakeholder.role,
    name: stakeholder.name,
    email: stakeholder.email,
    phone: stakeholder.phone,
    escalationLevel: stakeholder.escalationLevel,
    isPrimary: Boolean(stakeholder.isPrimary),
    avatarUrl: stakeholder.avatarUrl,
    notes: stakeholder.notes,
    createdBy: stakeholder.createdBy,
    updatedBy: stakeholder.updatedBy,
    createdAt: stakeholder.createdAt?.toISOString?.() ?? null,
    updatedAt: stakeholder.updatedAt?.toISOString?.() ?? null
  };
}

function serialisePlaybook(instance) {
  const playbook = instance?.toJSON ? instance.toJSON() : instance;
  if (!playbook) {
    return null;
  }
  return {
    id: playbook.id,
    enterpriseAccountId: playbook.enterpriseAccountId,
    name: playbook.name,
    category: playbook.category,
    owner: playbook.owner,
    status: playbook.status,
    documentUrl: playbook.documentUrl,
    summary: playbook.summary,
    lastReviewedAt: playbook.lastReviewedAt ? new Date(playbook.lastReviewedAt).toISOString() : null,
    createdBy: playbook.createdBy,
    updatedBy: playbook.updatedBy,
    createdAt: playbook.createdAt?.toISOString?.() ?? null,
    updatedAt: playbook.updatedAt?.toISOString?.() ?? null
  };
}

function serialiseAccount(instance, { includeChildren = true } = {}) {
  const account = instance?.toJSON ? instance.toJSON() : instance;
  if (!account) {
    return null;
  }
  const payload = {
    id: account.id,
    name: account.name,
    slug: account.slug,
    status: account.status,
    priority: account.priority,
    accountManager: account.accountManager,
    timezone: account.timezone,
    supportEmail: account.supportEmail,
    billingEmail: account.billingEmail,
    supportPhone: account.supportPhone,
    logoUrl: account.logoUrl,
    heroImageUrl: account.heroImageUrl,
    notes: account.notes,
    escalationNotes: account.escalationNotes,
    createdBy: account.createdBy,
    updatedBy: account.updatedBy,
    createdAt: account.createdAt?.toISOString?.() ?? null,
    updatedAt: account.updatedAt?.toISOString?.() ?? null,
    archivedAt: account.archivedAt?.toISOString?.() ?? null
  };

  if (includeChildren) {
    payload.sites = Array.isArray(account.sites)
      ? account.sites.map((site) => serialiseSite(site)).sort((a, b) => a.name.localeCompare(b.name))
      : [];
    payload.stakeholders = Array.isArray(account.stakeholders)
      ? account.stakeholders
          .map((stakeholder) => serialiseStakeholder(stakeholder))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];
    payload.playbooks = Array.isArray(account.playbooks)
      ? account.playbooks.map((playbook) => serialisePlaybook(playbook)).sort((a, b) => a.name.localeCompare(b.name))
      : [];
  }

  return payload;
}

const READ_ONLY_ERROR = 'Archived enterprise accounts are read-only';

function ensureAccountIsMutable(account) {
  if (!account) {
    return;
  }
  if (account.archivedAt) {
    throw Object.assign(new Error(READ_ONLY_ERROR), { statusCode: 409 });
  }
}

async function loadAccount(accountId, { includeChildren = true, requireMutable = false } = {}) {
  const include = includeChildren
    ? [
        { model: EnterpriseSite, as: 'sites' },
        { model: EnterpriseStakeholder, as: 'stakeholders' },
        { model: EnterprisePlaybook, as: 'playbooks' }
      ]
    : undefined;

  const account = await EnterpriseAccount.findByPk(accountId, { include });
  if (!account) {
    throw Object.assign(new Error('Enterprise account not found'), { statusCode: 404 });
  }
  if (requireMutable) {
    ensureAccountIsMutable(account);
  }
  return account;
}

export async function listEnterpriseAccounts({ includeArchived = false } = {}) {
  const where = includeArchived ? {} : { archivedAt: null };
  const accounts = await EnterpriseAccount.findAll({
    where,
    order: [['name', 'ASC']],
    include: [
      { model: EnterpriseSite, as: 'sites' },
      { model: EnterpriseStakeholder, as: 'stakeholders' },
      { model: EnterprisePlaybook, as: 'playbooks' }
    ]
  });
  return accounts.map((account) => serialiseAccount(account));
}

export async function getEnterpriseAccountById(accountId) {
  const account = await loadAccount(accountId, { includeChildren: true });
  return serialiseAccount(account);
}

export async function createEnterpriseAccount({ payload, actorId }) {
  const body = ensureAccountPayload(payload, { isCreate: true });

  return sequelize.transaction(async (transaction) => {
    const slug = await generateUniqueSlug(body.name, { transaction });
    const account = await EnterpriseAccount.create(
      {
        ...body,
        slug,
        createdBy: actorId,
        updatedBy: actorId
      },
      { transaction }
    );

    const reloaded = await loadAccount(account.id, { includeChildren: true });
    return serialiseAccount(reloaded);
  });
}

export async function updateEnterpriseAccount({ accountId, payload, actorId }) {
  const account = await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const body = ensureAccountPayload(payload, { isCreate: false });

  if (body.name && body.name !== account.name) {
    body.slug = await generateUniqueSlug(body.name);
  }

  body.updatedBy = actorId;
  await account.update(body);

  const refreshed = await loadAccount(accountId, { includeChildren: true });
  return serialiseAccount(refreshed);
}

export async function archiveEnterpriseAccount({ accountId, actorId }) {
  const account = await loadAccount(accountId, { includeChildren: false });
  if (account.archivedAt) {
    throw Object.assign(new Error('Enterprise account already archived'), { statusCode: 409 });
  }
  await account.update({ archivedAt: new Date(), updatedBy: actorId });
  const refreshed = await loadAccount(accountId, { includeChildren: true });
  return serialiseAccount(refreshed);
}

export async function createEnterpriseSite({ accountId, payload, actorId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const body = ensureSitePayload(payload, { isCreate: true });
  body.enterpriseAccountId = accountId;
  body.createdBy = actorId;
  body.updatedBy = actorId;

  const site = await EnterpriseSite.create(body);
  return serialiseSite(site);
}

export async function updateEnterpriseSite({ accountId, siteId, payload, actorId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const site = await EnterpriseSite.findOne({ where: { id: siteId, enterpriseAccountId: accountId } });
  if (!site) {
    throw Object.assign(new Error('Enterprise site not found'), { statusCode: 404 });
  }
  const body = ensureSitePayload(payload, { isCreate: false });
  body.updatedBy = actorId;
  await site.update(body);
  return serialiseSite(site);
}

export async function deleteEnterpriseSite({ accountId, siteId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const deleted = await EnterpriseSite.destroy({ where: { id: siteId, enterpriseAccountId: accountId } });
  if (!deleted) {
    throw Object.assign(new Error('Enterprise site not found'), { statusCode: 404 });
  }
}

export async function createEnterpriseStakeholder({ accountId, payload, actorId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const body = ensureStakeholderPayload(payload, { isCreate: true });
  body.enterpriseAccountId = accountId;
  body.createdBy = actorId;
  body.updatedBy = actorId;

  const stakeholder = await EnterpriseStakeholder.create(body);
  return serialiseStakeholder(stakeholder);
}

export async function updateEnterpriseStakeholder({ accountId, stakeholderId, payload, actorId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const stakeholder = await EnterpriseStakeholder.findOne({
    where: { id: stakeholderId, enterpriseAccountId: accountId }
  });
  if (!stakeholder) {
    throw Object.assign(new Error('Enterprise stakeholder not found'), { statusCode: 404 });
  }
  const body = ensureStakeholderPayload(payload, { isCreate: false });
  body.updatedBy = actorId;
  await stakeholder.update(body);
  return serialiseStakeholder(stakeholder);
}

export async function deleteEnterpriseStakeholder({ accountId, stakeholderId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const deleted = await EnterpriseStakeholder.destroy({
    where: { id: stakeholderId, enterpriseAccountId: accountId }
  });
  if (!deleted) {
    throw Object.assign(new Error('Enterprise stakeholder not found'), { statusCode: 404 });
  }
}

export async function createEnterprisePlaybook({ accountId, payload, actorId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const body = ensurePlaybookPayload(payload, { isCreate: true });
  body.enterpriseAccountId = accountId;
  body.createdBy = actorId;
  body.updatedBy = actorId;

  const playbook = await EnterprisePlaybook.create(body);
  return serialisePlaybook(playbook);
}

export async function updateEnterprisePlaybook({ accountId, playbookId, payload, actorId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const playbook = await EnterprisePlaybook.findOne({
    where: { id: playbookId, enterpriseAccountId: accountId }
  });
  if (!playbook) {
    throw Object.assign(new Error('Enterprise playbook not found'), { statusCode: 404 });
  }
  const body = ensurePlaybookPayload(payload, { isCreate: false });
  body.updatedBy = actorId;
  await playbook.update(body);
  return serialisePlaybook(playbook);
}

export async function deleteEnterprisePlaybook({ accountId, playbookId }) {
  await loadAccount(accountId, { includeChildren: false, requireMutable: true });
  const deleted = await EnterprisePlaybook.destroy({
    where: { id: playbookId, enterpriseAccountId: accountId }
  });
  if (!deleted) {
    throw Object.assign(new Error('Enterprise playbook not found'), { statusCode: 404 });
  }
}

export function getAccountSummary(accounts = []) {
  return accounts.reduce(
    (acc, account) => {
      acc.total += 1;
      if (account.status === 'active') {
        acc.active += 1;
      }
      if (account.status === 'pilot') {
        acc.pilot += 1;
      }
      if (account.priority === 'critical') {
        acc.critical += 1;
      }
      if (account.archivedAt) {
        acc.archived += 1;
      }
      acc.sites += Array.isArray(account.sites) ? account.sites.length : 0;
      acc.stakeholders += Array.isArray(account.stakeholders) ? account.stakeholders.length : 0;
      acc.playbooks += Array.isArray(account.playbooks) ? account.playbooks.length : 0;
      return acc;
    },
    { total: 0, active: 0, pilot: 0, critical: 0, archived: 0, sites: 0, stakeholders: 0, playbooks: 0 }
  );
}

export default {
  listEnterpriseAccounts,
  getEnterpriseAccountById,
  createEnterpriseAccount,
  updateEnterpriseAccount,
  archiveEnterpriseAccount,
  createEnterpriseSite,
  updateEnterpriseSite,
  deleteEnterpriseSite,
  createEnterpriseStakeholder,
  updateEnterpriseStakeholder,
  deleteEnterpriseStakeholder,
  createEnterprisePlaybook,
  updateEnterprisePlaybook,
  deleteEnterprisePlaybook,
  getAccountSummary
};
