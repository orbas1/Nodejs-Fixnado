import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Company,
  ProviderByokIntegration,
  ProviderByokAuditLog
} from '../models/index.js';

const ALLOWED_STATUSES = new Set(['inactive', 'active', 'suspended', 'archived']);
const DEFAULT_ALLOWED_ROLES = ['provider_admin'];
const DEFAULT_ROTATION_INTERVAL_DAYS = 60;

const INTEGRATION_CATALOGUE = {
  openai: {
    label: 'OpenAI BYOK',
    defaults: {
      provider: 'openai',
      baseUrl: '',
      defaultModel: 'gpt-4o-mini',
      organizationId: '',
      allowedRoles: DEFAULT_ALLOWED_ROLES,
      rotationIntervalDays: 60
    },
    credentialFields: ['apiKey', 'organizationId']
  },
  slack: {
    label: 'Slack BYOK',
    defaults: {
      defaultChannel: '',
      appId: '',
      teamId: '',
      allowedRoles: ['provider_admin', 'provider_manager'],
      rotationIntervalDays: 90
    },
    credentialFields: ['botToken', 'signingSecret']
  },
  webhook: {
    label: 'Webhook Relay',
    defaults: {
      targetUrl: '',
      authType: 'none',
      allowedRoles: DEFAULT_ALLOWED_ROLES,
      rotationIntervalDays: 30
    },
    credentialFields: ['sharedSecret', 'basicAuthUser', 'basicAuthPassword']
  }
};

function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseIntegrationKey(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw buildHttpError(400, 'integration_required');
  }
  return value.trim().toLowerCase();
}

function normaliseStatus(value, fallback = 'inactive') {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }
  const status = value.trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : fallback;
}

function ensureArrayOfStrings(value, fallback = []) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim().toLowerCase() : null))
      .filter((entry) => entry);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim().toLowerCase()];
  }
  return [...fallback];
}

function coercePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function sanitiseSettings(integrationKey, payload = {}) {
  const definition = INTEGRATION_CATALOGUE[integrationKey] ?? {
    label: integrationKey,
    defaults: { allowedRoles: DEFAULT_ALLOWED_ROLES, rotationIntervalDays: DEFAULT_ROTATION_INTERVAL_DAYS },
    credentialFields: []
  };
  const defaults = definition.defaults ?? {};
  const allowedRoles = ensureArrayOfStrings(payload.allowedRoles ?? defaults.allowedRoles ?? DEFAULT_ALLOWED_ROLES, DEFAULT_ALLOWED_ROLES);
  const rotationIntervalDays = coercePositiveInteger(
    payload.rotationIntervalDays ?? payload.rotationInterval ?? defaults.rotationIntervalDays ?? DEFAULT_ROTATION_INTERVAL_DAYS,
    DEFAULT_ROTATION_INTERVAL_DAYS
  );

  const settings = {
    ...defaults,
    ...payload,
    allowedRoles: allowedRoles.length ? Array.from(new Set(allowedRoles)) : DEFAULT_ALLOWED_ROLES,
    rotationIntervalDays
  };

  const trimmedKeys = [
    'provider',
    'baseUrl',
    'defaultModel',
    'organizationId',
    'defaultChannel',
    'appId',
    'teamId',
    'targetUrl',
    'authType',
    'notes'
  ];

  trimmedKeys.forEach((key) => {
    if (Object.hasOwn(settings, key)) {
      const value = settings[key];
      settings[key] = typeof value === 'string' ? value.trim() : value;
    }
  });

  const attachments = Array.isArray(payload.attachments) ? payload.attachments : defaults.attachments ?? [];
  settings.attachments = attachments
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        return { label: entry.trim(), url: entry.trim() };
      }
      if (typeof entry === 'object') {
        const label = typeof entry.label === 'string' ? entry.label.trim() : '';
        const url = typeof entry.url === 'string' ? entry.url.trim() : '';
        if (!label && !url) {
          return null;
        }
        return {
          label: label || url,
          url
        };
      }
      return null;
    })
    .filter((entry) => entry && entry.url);

  return settings;
}

function sanitiseMetadata(metadata = {}) {
  const next = {};
  if (typeof metadata.notes === 'string' && metadata.notes.trim()) {
    next.notes = metadata.notes.trim();
  }
  if (Array.isArray(metadata.supportContacts)) {
    next.supportContacts = metadata.supportContacts
      .map((contact) => {
        if (typeof contact === 'string') {
          return { name: contact.trim(), email: null };
        }
        if (typeof contact === 'object' && contact) {
          const name = typeof contact.name === 'string' ? contact.name.trim() : '';
          const email = typeof contact.email === 'string' ? contact.email.trim() : '';
          const role = typeof contact.role === 'string' ? contact.role.trim() : '';
          if (!name && !email && !role) {
            return null;
          }
          return {
            name: name || email || role || 'Contact',
            email: email || null,
            role: role || null
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (Array.isArray(metadata.supportingMedia)) {
    next.supportingMedia = metadata.supportingMedia
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') {
          return { type: 'image', url: item.trim() };
        }
        if (typeof item === 'object') {
          const type = typeof item.type === 'string' ? item.type.trim().toLowerCase() : 'image';
          const url = typeof item.url === 'string' ? item.url.trim() : '';
          const alt = typeof item.alt === 'string' ? item.alt.trim() : '';
          if (!url) {
            return null;
          }
          return { type, url, alt: alt || null };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof metadata.visibility === 'string' && metadata.visibility.trim()) {
    next.visibility = metadata.visibility.trim().toLowerCase();
  }
  if (metadata.lastReviewAt) {
    const dt = DateTime.fromISO(metadata.lastReviewAt);
    if (dt.isValid) {
      next.lastReviewAt = dt.toISO();
    }
  }
  if (metadata.reviewCadenceDays) {
    const cadence = coercePositiveInteger(metadata.reviewCadenceDays, null);
    if (cadence) {
      next.reviewCadenceDays = cadence;
    }
  }
  return next;
}

function sanitiseCredentials(integrationKey, credentials = {}) {
  const definition = INTEGRATION_CATALOGUE[integrationKey];
  const fields = definition?.credentialFields ?? Object.keys(credentials ?? {});
  const sanitized = {};
  fields.forEach((field) => {
    if (!field) {
      return;
    }
    const value = credentials[field];
    if (typeof value === 'string' && value.trim()) {
      sanitized[field] = value.trim();
    }
  });
  return Object.keys(sanitized).length ? sanitized : null;
}

function computeRotationDue(settings = {}, lastRotatedAt) {
  const interval = coercePositiveInteger(settings.rotationIntervalDays, null);
  if (!interval || !lastRotatedAt) {
    return null;
  }
  const rotated = DateTime.fromJSDate(lastRotatedAt);
  if (!rotated.isValid) {
    return null;
  }
  return rotated.plus({ days: interval });
}

function redactIntegration(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  const rotationDue = computeRotationDue(plain.settings, plain.lastRotatedAt);
  return {
    id: plain.id,
    companyId: plain.companyId,
    integration: plain.integration,
    displayName: plain.displayName,
    status: plain.status,
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    hasCredentials: Boolean(plain.credentialsEncrypted),
    credentialFingerprint: plain.credentialFingerprint ?? null,
    lastRotatedAt: plain.lastRotatedAt ? new Date(plain.lastRotatedAt).toISOString() : null,
    lastRotatedBy: plain.lastRotatedBy ?? null,
    lastTestStatus: plain.lastTestStatus ?? null,
    lastTestAt: plain.lastTestAt ? new Date(plain.lastTestAt).toISOString() : null,
    lastTestNotes: plain.lastTestNotes ?? null,
    rotationDueAt: rotationDue?.toISO() ?? null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null
  };
}

function serialiseAuditLog(log) {
  const plain = log.get({ plain: true });
  return {
    id: plain.id,
    integrationId: plain.integrationId,
    companyId: plain.companyId,
    eventType: plain.eventType,
    actorId: plain.actorId ?? null,
    actorType: plain.actorType ?? null,
    detail: plain.eventDetail ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null
  };
}

function buildSummary(integrations = []) {
  const now = DateTime.utc();
  const active = integrations.filter((item) => item.status === 'active');
  const pendingRotation = integrations.filter((item) => {
    if (!item.rotationDueAt) return false;
    const due = DateTime.fromISO(item.rotationDueAt);
    return due.isValid && due < now;
  });
  const needsTest = integrations.filter((item) => {
    if (!item.hasCredentials) {
      return true;
    }
    if (!item.lastTestAt) {
      return true;
    }
    const last = DateTime.fromISO(item.lastTestAt);
    if (!last.isValid) {
      return true;
    }
    return now.diff(last, 'days').days > 30 || item.lastTestStatus !== 'passed';
  });

  const lastRotation = integrations
    .map((item) => (item.lastRotatedAt ? DateTime.fromISO(item.lastRotatedAt) : null))
    .filter((dt) => dt && dt.isValid)
    .sort((a, b) => b.toMillis() - a.toMillis())[0];

  const nextRotation = integrations
    .map((item) => (item.rotationDueAt ? DateTime.fromISO(item.rotationDueAt) : null))
    .filter((dt) => dt && dt.isValid)
    .sort((a, b) => a.toMillis() - b.toMillis())[0];

  return {
    totalIntegrations: integrations.length,
    activeIntegrations: active.length,
    pendingRotation: pendingRotation.length,
    requiresVerification: needsTest.length,
    lastRotatedAt: lastRotation?.toISO() ?? null,
    nextRotationDueAt: nextRotation?.toISO() ?? null
  };
}

async function ensureCompany(companyId) {
  if (!companyId) {
    throw buildHttpError(400, 'company_required');
  }
  const company = await Company.findByPk(companyId, { attributes: ['id'], raw: true });
  if (!company) {
    throw buildHttpError(404, 'company_not_found');
  }
  return company.id;
}

async function recordAuditEvent({
  integrationId,
  companyId,
  eventType,
  actor,
  detail,
  transaction
}) {
  await ProviderByokAuditLog.create(
    {
      integrationId,
      companyId,
      eventType,
      eventDetail: detail ?? {},
      actorId: actor?.id ?? null,
      actorType: actor?.type ?? null
    },
    { transaction }
  );
}

export async function listProviderByokIntegrations({ companyId, includeArchived = false }) {
  const resolvedCompanyId = await ensureCompany(companyId);
  const where = { companyId: resolvedCompanyId };
  if (!includeArchived) {
    where.status = { [Op.ne]: 'archived' };
  }
  const records = await ProviderByokIntegration.findAll({
    where,
    order: [['displayName', 'ASC']]
  });
  return records.map(redactIntegration);
}

export async function getProviderByokSnapshot({ companyId }) {
  const integrations = await listProviderByokIntegrations({ companyId, includeArchived: true });
  const auditLogs = await ProviderByokAuditLog.findAll({
    where: { companyId },
    order: [['createdAt', 'DESC']],
    limit: 15
  });
  const summary = buildSummary(integrations);
  return {
    summary,
    integrations,
    audit: auditLogs.map(serialiseAuditLog)
  };
}

export async function saveProviderByokIntegration({
  companyId,
  integrationId = null,
  integration: integrationInput,
  displayName,
  status: statusInput,
  settings: settingsInput,
  credentials: credentialsInput,
  metadata: metadataInput,
  actor
}) {
  const resolvedCompanyId = await ensureCompany(companyId);
  const now = new Date();
  return sequelize.transaction(async (transaction) => {
    const integrationKey = integrationId ? null : normaliseIntegrationKey(integrationInput);
    let record = null;

    if (integrationId) {
      record = await ProviderByokIntegration.findOne({
        where: { id: integrationId, companyId: resolvedCompanyId },
        transaction
      });
      if (!record) {
        throw buildHttpError(404, 'byok_integration_not_found');
      }
    } else {
      const key = integrationKey;
      record = await ProviderByokIntegration.findOne({
        where: { companyId: resolvedCompanyId, integration: key },
        transaction
      });
      if (record) {
        throw buildHttpError(409, 'byok_integration_exists');
      }
    }

    const targetIntegration = record?.integration ?? integrationKey;
    const settings = sanitiseSettings(targetIntegration, settingsInput);
    const metadata = sanitiseMetadata(metadataInput);
    const status = normaliseStatus(statusInput ?? record?.status ?? 'inactive');
    const credentials = sanitiseCredentials(targetIntegration, credentialsInput);
    const labelFallback = INTEGRATION_CATALOGUE[targetIntegration]?.label ?? targetIntegration;
    const safeDisplayName = typeof displayName === 'string' && displayName.trim() ? displayName.trim() : labelFallback;

    if (!record) {
      record = await ProviderByokIntegration.create(
        {
          companyId: resolvedCompanyId,
          integration: targetIntegration,
          displayName: safeDisplayName,
          status,
          settings,
          metadata,
          createdBy: actor?.id ?? null,
          updatedBy: actor?.id ?? null
        },
        { transaction }
      );
      if (credentials) {
        record.credentials = credentials;
        record.lastRotatedAt = now;
        record.lastRotatedBy = actor?.id ?? null;
        await record.save({ transaction });
      }
      await recordAuditEvent({
        integrationId: record.id,
        companyId: resolvedCompanyId,
        eventType: 'integration.created',
        actor,
        detail: {
          status,
          hasCredentials: Boolean(credentials)
        },
        transaction
      });
    } else {
      const before = record.get({ plain: true });
      const updates = {
        displayName: safeDisplayName,
        status,
        settings,
        metadata,
        updatedBy: actor?.id ?? null
      };
      record.set(updates);
      let rotated = false;
      if (credentials) {
        record.credentials = credentials;
        record.lastRotatedAt = now;
        record.lastRotatedBy = actor?.id ?? null;
        rotated = true;
      }
      await record.save({ transaction });
      const after = record.get({ plain: true });
      const changes = {};
      if (before.status !== after.status) {
        changes.status = { previous: before.status, next: after.status };
      }
      if (JSON.stringify(before.settings) !== JSON.stringify(after.settings)) {
        changes.settings = true;
      }
      if (JSON.stringify(before.metadata) !== JSON.stringify(after.metadata)) {
        changes.metadata = true;
      }
      await recordAuditEvent({
        integrationId: record.id,
        companyId: resolvedCompanyId,
        eventType: rotated ? 'integration.rotated' : 'integration.updated',
        actor,
        detail: {
          changes,
          rotated,
          status: after.status,
          hasCredentials: Boolean(after.credentialsEncrypted)
        },
        transaction
      });
    }

    await record.reload({ transaction });
    return redactIntegration(record);
  });
}

export async function archiveProviderByokIntegration({ companyId, integrationId, actor }) {
  const resolvedCompanyId = await ensureCompany(companyId);
  return sequelize.transaction(async (transaction) => {
    const record = await ProviderByokIntegration.findOne({
      where: { id: integrationId, companyId: resolvedCompanyId },
      transaction
    });
    if (!record) {
      throw buildHttpError(404, 'byok_integration_not_found');
    }
    if (record.status === 'archived') {
      return redactIntegration(record);
    }
    record.status = 'archived';
    record.updatedBy = actor?.id ?? null;
    await record.save({ transaction });
    await recordAuditEvent({
      integrationId: record.id,
      companyId: resolvedCompanyId,
      eventType: 'integration.archived',
      actor,
      detail: { status: 'archived' },
      transaction
    });
    await record.reload({ transaction });
    return redactIntegration(record);
  });
}

export async function testProviderByokIntegration({ companyId, integrationId, actor }) {
  const resolvedCompanyId = await ensureCompany(companyId);
  return sequelize.transaction(async (transaction) => {
    const record = await ProviderByokIntegration.findOne({
      where: { id: integrationId, companyId: resolvedCompanyId },
      transaction
    });
    if (!record) {
      throw buildHttpError(404, 'byok_integration_not_found');
    }
    const integration = record.get({ plain: true });
    const definition = INTEGRATION_CATALOGUE[integration.integration] ?? { credentialFields: [] };
    const credentialFields = definition.credentialFields ?? [];
    let passed = true;
    let message = 'Credentials validated successfully';

    if (!record.credentialsEncrypted) {
      passed = false;
      message = 'Credentials missing';
    } else {
      const secrets = record.credentials;
      for (const field of credentialFields) {
        if (!secrets?.[field]) {
          passed = false;
          message = `Missing credential field: ${field}`;
          break;
        }
      }
    }

    record.lastTestStatus = passed ? 'passed' : 'failed';
    record.lastTestAt = new Date();
    record.lastTestNotes = message;
    record.updatedBy = actor?.id ?? null;
    await record.save({ transaction });

    await recordAuditEvent({
      integrationId: record.id,
      companyId: resolvedCompanyId,
      eventType: 'integration.tested',
      actor,
      detail: {
        status: record.lastTestStatus,
        message
      },
      transaction
    });

    await record.reload({ transaction });
    return {
      integration: redactIntegration(record),
      result: {
        status: record.lastTestStatus,
        message
      }
    };
  });
}

export async function listProviderByokAuditLogs({ companyId, integrationId, limit = 25 }) {
  await ensureCompany(companyId);
  const where = { companyId };
  if (integrationId) {
    where.integrationId = integrationId;
  }
  const logs = await ProviderByokAuditLog.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit
  });
  return logs.map(serialiseAuditLog);
}
