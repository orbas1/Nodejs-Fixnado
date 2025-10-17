import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import User from '../models/user.js';
import ServicemanByokProfile from '../models/servicemanByokProfile.js';
import ServicemanByokConnector from '../models/servicemanByokConnector.js';
import ServicemanByokAuditEvent from '../models/servicemanByokAuditEvent.js';
import ensureServicemanByokAssociations from '../models/associations/servicemanByokAssociations.js';
import { encryptString } from '../utils/security/fieldEncryption.js';

ensureServicemanByokAssociations();

const PROVIDERS = new Set(['openai', 'slack', 'microsoft', 'google', 'custom']);
const ENVIRONMENTS = new Set(['production', 'staging', 'sandbox']);
const STATUSES = new Set(['active', 'disabled', 'pending', 'revoked']);

function byokError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function normaliseList(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const unique = new Set();
  const result = [];
  values.forEach((value) => {
    const normalised = normaliseString(value);
    if (!normalised || unique.has(normalised)) {
      return;
    }
    unique.add(normalised);
    result.push(normalised);
  });
  return result;
}

function mapConnector(connector) {
  if (!connector) {
    return null;
  }
  const payload = connector.toJSON();
  return {
    id: payload.id,
    profileId: payload.profileId,
    provider: payload.provider,
    displayName: payload.displayName,
    environment: payload.environment,
    status: payload.status,
    scopes: Array.isArray(payload.scopes) ? payload.scopes : [],
    metadata: payload.metadata ?? {},
    rotatesAt: payload.rotatesAt ? new Date(payload.rotatesAt).toISOString() : null,
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : null,
    lastRotatedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : null,
    secretLastFour: payload.secretLastFour
  };
}

function mapAuditEvent(event) {
  if (!event) {
    return null;
  }
  const payload = event.toJSON();
  return {
    id: payload.id,
    profileId: payload.profileId,
    connectorId: payload.connectorId,
    action: payload.action,
    status: payload.status,
    message: payload.message,
    actorId: payload.actorId,
    metadata: payload.metadata ?? {},
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null
  };
}

async function ensureServiceman(servicemanId, { transaction } = {}) {
  const user = await User.findByPk(servicemanId, { transaction });
  if (!user) {
    throw byokError('Serviceman account not found', 404);
  }
  const role = normaliseString(user.type).toLowerCase();
  const allowed = new Set(['servicemen', 'serviceman', 'operations_admin', 'admin']);
  if (!allowed.has(role)) {
    throw byokError('Serviceman BYOK management is not available for this user', 403);
  }
  return user;
}

async function recordAuditEvent({
  profileId,
  connectorId = null,
  actorId = null,
  action,
  status = 'success',
  message = null,
  metadata = {},
  transaction
}) {
  return ServicemanByokAuditEvent.create(
    {
      profileId,
      connectorId,
      actorId,
      action,
      status,
      message,
      metadata: metadata ?? {}
    },
    { transaction }
  );
}

async function ensureProfile(servicemanId, { transaction } = {}) {
  const existing = await ServicemanByokProfile.findOne({
    where: { userId: servicemanId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  if (existing) {
    return existing;
  }
  return ServicemanByokProfile.create(
    {
      userId: servicemanId,
      displayName: 'Crew BYOK profile',
      defaultProvider: 'openai',
      defaultEnvironment: 'production',
      rotationPolicyDays: 90,
      allowSelfProvisioning: false,
      metadata: {}
    },
    { transaction }
  );
}

export async function getServicemanByokState({ servicemanId }) {
  const serviceman = await ensureServiceman(servicemanId);
  const profile = await ensureProfile(serviceman.id);
  const [connectors, auditEvents] = await Promise.all([
    ServicemanByokConnector.findAll({
      where: { profileId: profile.id },
      order: [['createdAt', 'ASC']]
    }),
    ServicemanByokAuditEvent.findAll({
      where: { profileId: profile.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    })
  ]);

  return {
    profile: profile.toJSON(),
    connectors: connectors.map(mapConnector),
    auditTrail: auditEvents.map(mapAuditEvent)
  };
}

export async function upsertServicemanByokProfile({ servicemanId, payload = {}, actorId }) {
  const serviceman = await ensureServiceman(servicemanId);
  return sequelize.transaction(async (transaction) => {
    const profile = await ensureProfile(serviceman.id, { transaction });
    const next = { ...profile.toJSON() };

    if (payload.displayName !== undefined) {
      const value = normaliseString(payload.displayName);
      if (!value) {
        throw byokError('Display name is required');
      }
      next.displayName = value.slice(0, 160);
    }

    if (payload.defaultProvider !== undefined) {
      const provider = normaliseString(payload.defaultProvider).toLowerCase();
      if (!PROVIDERS.has(provider)) {
        throw byokError('Unsupported provider option');
      }
      next.defaultProvider = provider;
    }

    if (payload.defaultEnvironment !== undefined) {
      const environment = normaliseString(payload.defaultEnvironment).toLowerCase();
      if (!ENVIRONMENTS.has(environment)) {
        throw byokError('Unsupported environment option');
      }
      next.defaultEnvironment = environment;
    }

    if (payload.rotationPolicyDays !== undefined) {
      const numeric = Number.parseInt(payload.rotationPolicyDays, 10);
      if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 365) {
        throw byokError('Rotation policy must be between 1 and 365 days');
      }
      next.rotationPolicyDays = numeric;
    }

    if (payload.allowSelfProvisioning !== undefined) {
      next.allowSelfProvisioning = Boolean(payload.allowSelfProvisioning);
    }

    if (payload.notes !== undefined) {
      next.notes = normaliseString(payload.notes) || null;
    }

    if (payload.metadata && typeof payload.metadata === 'object') {
      next.metadata = { ...(profile.metadata ?? {}), ...payload.metadata };
    }

    await profile.update(next, { transaction });
    await recordAuditEvent({
      profileId: profile.id,
      actorId,
      action: 'profile.updated',
      metadata: {
        actorId,
        fields: Object.keys(payload ?? {})
      },
      transaction
    });

    return profile.toJSON();
  });
}

function resolveRotationDate(profile, providedDate) {
  if (providedDate) {
    const parsed = new Date(providedDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (!profile.rotationPolicyDays) {
    return null;
  }
  const now = new Date();
  return new Date(now.getTime() + profile.rotationPolicyDays * 24 * 60 * 60 * 1000);
}

export async function createServicemanByokConnector({ servicemanId, payload = {}, actorId }) {
  const serviceman = await ensureServiceman(servicemanId);
  return sequelize.transaction(async (transaction) => {
    const profile = await ensureProfile(serviceman.id, { transaction });
    const provider = normaliseString(payload.provider || profile.defaultProvider).toLowerCase();
    if (!PROVIDERS.has(provider)) {
      throw byokError('Unsupported provider option');
    }

    const environment = normaliseString(payload.environment || profile.defaultEnvironment).toLowerCase();
    if (!ENVIRONMENTS.has(environment)) {
      throw byokError('Unsupported environment option');
    }

    const displayName = normaliseString(payload.displayName);
    if (!displayName) {
      throw byokError('Connector display name is required');
    }

    const secretValue = normaliseString(payload.secret);
    if (!secretValue) {
      throw byokError('Connector secret value is required');
    }

    const scopes = normaliseList(payload.scopes ?? []);
    const metadata = typeof payload.metadata === 'object' && payload.metadata ? payload.metadata : {};
    const rotatesAt = resolveRotationDate(profile, payload.rotatesAt);

    const connector = await ServicemanByokConnector.create(
      {
        profileId: profile.id,
        provider,
        displayName: displayName.slice(0, 160),
        environment,
        status: STATUSES.has(normaliseString(payload.status).toLowerCase())
          ? normaliseString(payload.status).toLowerCase()
          : 'active',
        secretEncrypted: encryptString(secretValue, 'servicemanByok:secret'),
        secretLastFour: secretValue.slice(-4),
        scopes,
        metadata,
        rotatesAt,
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null
      },
      { transaction }
    );

    await recordAuditEvent({
      profileId: profile.id,
      connectorId: connector.id,
      actorId,
      action: 'connector.created',
      metadata: {
        provider,
        environment,
        scopeCount: scopes.length
      },
      transaction
    });

    return mapConnector(connector);
  });
}

export async function updateServicemanByokConnector({
  servicemanId,
  connectorId,
  payload = {},
  actorId
}) {
  const serviceman = await ensureServiceman(servicemanId);
  return sequelize.transaction(async (transaction) => {
    const profile = await ensureProfile(serviceman.id, { transaction });
    const connector = await ServicemanByokConnector.findOne({
      where: { id: connectorId, profileId: profile.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!connector) {
      throw byokError('Connector not found', 404);
    }

    const updates = {};
    if (payload.displayName !== undefined) {
      const value = normaliseString(payload.displayName);
      if (!value) {
        throw byokError('Display name cannot be empty');
      }
      updates.displayName = value.slice(0, 160);
    }

    if (payload.provider !== undefined) {
      const provider = normaliseString(payload.provider).toLowerCase();
      if (!PROVIDERS.has(provider)) {
        throw byokError('Unsupported provider option');
      }
      updates.provider = provider;
    }

    if (payload.environment !== undefined) {
      const environment = normaliseString(payload.environment).toLowerCase();
      if (!ENVIRONMENTS.has(environment)) {
        throw byokError('Unsupported environment option');
      }
      updates.environment = environment;
    }

    if (payload.status !== undefined) {
      const status = normaliseString(payload.status).toLowerCase();
      if (!STATUSES.has(status)) {
        throw byokError('Unsupported status option');
      }
      updates.status = status;
    }

    if (payload.scopes !== undefined) {
      updates.scopes = normaliseList(payload.scopes);
    }

    if (payload.metadata && typeof payload.metadata === 'object') {
      updates.metadata = { ...(connector.metadata ?? {}), ...payload.metadata };
    }

    if (payload.rotatesAt !== undefined) {
      updates.rotatesAt = resolveRotationDate(profile, payload.rotatesAt);
    }

    if (Object.keys(updates).length === 0) {
      return mapConnector(connector);
    }

    updates.updatedBy = actorId ?? null;
    await connector.update(updates, { transaction });

    await recordAuditEvent({
      profileId: profile.id,
      connectorId: connector.id,
      actorId,
      action: 'connector.updated',
      metadata: { fields: Object.keys(updates) },
      transaction
    });

    return mapConnector(connector);
  });
}

export async function rotateServicemanByokConnector({
  servicemanId,
  connectorId,
  secret,
  actorId,
  metadata = {}
}) {
  const serviceman = await ensureServiceman(servicemanId);
  return sequelize.transaction(async (transaction) => {
    const profile = await ensureProfile(serviceman.id, { transaction });
    const connector = await ServicemanByokConnector.findOne({
      where: { id: connectorId, profileId: profile.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!connector) {
      throw byokError('Connector not found', 404);
    }

    const secretValue = normaliseString(secret);
    if (!secretValue) {
      throw byokError('New secret value is required');
    }

    const rotatesAt = resolveRotationDate(profile, metadata?.nextRotationAt);

    await connector.update(
      {
        secretEncrypted: encryptString(secretValue, 'servicemanByok:secret'),
        secretLastFour: secretValue.slice(-4),
        rotatesAt,
        updatedBy: actorId ?? null
      },
      { transaction }
    );

    await recordAuditEvent({
      profileId: profile.id,
      connectorId: connector.id,
      actorId,
      action: 'connector.rotated',
      metadata: {
        scopeCount: Array.isArray(connector.scopes) ? connector.scopes.length : 0,
        nextRotationAt: rotatesAt ? rotatesAt.toISOString() : null,
        ...metadata
      },
      transaction
    });

    return mapConnector(connector);
  });
}

export async function deleteServicemanByokConnector({ servicemanId, connectorId, actorId }) {
  const serviceman = await ensureServiceman(servicemanId);
  return sequelize.transaction(async (transaction) => {
    const profile = await ensureProfile(serviceman.id, { transaction });
    const connector = await ServicemanByokConnector.findOne({
      where: { id: connectorId, profileId: profile.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!connector) {
      throw byokError('Connector not found', 404);
    }

    const connectorSummary = mapConnector(connector);
    await connector.destroy({ transaction });

    await recordAuditEvent({
      profileId: profile.id,
      connectorId,
      actorId,
      action: 'connector.deleted',
      metadata: {
        provider: connectorSummary?.provider ?? null,
        environment: connectorSummary?.environment ?? null
      },
      transaction
    });

    return connectorSummary;
  });
}

export async function runServicemanByokDiagnostic({ servicemanId, connectorId, actorId }) {
  const serviceman = await ensureServiceman(servicemanId);
  const profile = await ensureProfile(serviceman.id);
  const connector = await ServicemanByokConnector.findOne({
    where: { id: connectorId, profileId: profile.id }
  });
  if (!connector) {
    throw byokError('Connector not found', 404);
  }

  const result = {
    connectorId: connector.id,
    provider: connector.provider,
    environment: connector.environment,
    status: connector.status === 'active' ? 'passed' : 'failed',
    issues:
      connector.status === 'active'
        ? []
        : ['Connector is not active. Activate the connector before running diagnostics.']
  };

  await recordAuditEvent({
    profileId: profile.id,
    connectorId: connector.id,
    actorId,
    action: 'connector.diagnostic',
    status: result.status === 'passed' ? 'success' : 'warning',
    message:
      result.status === 'passed'
        ? 'BYOK connector diagnostic completed successfully'
        : 'BYOK connector diagnostic detected issues',
    metadata: {
      environment: connector.environment,
      status: connector.status,
      issues: result.issues
    }
  });

  return result;
}

export async function searchServicemanByokProfiles({ search = '', limit = 20 } = {}) {
  const where = {};
  const trimmed = normaliseString(search);
  const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
  if (trimmed) {
    where[Op.or] = [
      { displayName: { [likeOperator]: `%${trimmed}%` } },
      { '$serviceman.first_name_encrypted$': { [likeOperator]: `%${trimmed}%` } }
    ];
  }

  const profiles = await ServicemanByokProfile.findAll({
    where,
    include: [
      {
        model: User,
        as: 'serviceman',
        attributes: ['id', 'type']
      }
    ],
    order: [['updatedAt', 'DESC']],
    limit: Math.min(Number(limit) || 20, 100)
  });

  return profiles.map((profile) => profile.toJSON());
}

export default {
  getServicemanByokState,
  upsertServicemanByokProfile,
  createServicemanByokConnector,
  updateServicemanByokConnector,
  rotateServicemanByokConnector,
  deleteServicemanByokConnector,
  runServicemanByokDiagnostic,
  searchServicemanByokProfiles
};
