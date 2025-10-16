import { Op } from 'sequelize';
import {
  listEscrows,
  getEscrowById,
  updateEscrow,
  addEscrowNote,
  deleteEscrowNote,
  upsertEscrowMilestone,
  deleteEscrowMilestone,
  createManualEscrow
} from './escrowManagementService.js';
import { ProviderEscrowPolicy, Company, Order, Service } from '../models/index.js';

function validationError(message) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  return error;
}

function toUniqueStrings(value) {
  if (!value) {
    return [];
  }
  const values = Array.isArray(value) ? value : `${value}`.split(/\r?\n|;/);
  const seen = new Set();
  const result = [];
  values
    .map((entry) => `${entry ?? ''}`.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const key = entry.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(entry);
      }
    });
  return result;
}

function parseInteger(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseAmount(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

async function resolveProviderScope(user) {
  const providerId = user?.id ?? null;
  const companyIds = new Set();

  if (user?.companyId) {
    companyIds.add(`${user.companyId}`.trim());
  }

  if (user?.metadata) {
    const { companyId, companyIds: metaCompanies } = user.metadata;
    if (companyId) {
      companyIds.add(`${companyId}`.trim());
    }
    if (Array.isArray(metaCompanies)) {
      metaCompanies.filter(Boolean).forEach((id) => companyIds.add(`${id}`.trim()));
    }
  }

  if (providerId) {
    const owned = await Company.findAll({ where: { userId: providerId }, attributes: ['id'] });
    owned.forEach((company) => {
      if (company?.id) {
        companyIds.add(`${company.id}`.trim());
      }
    });
  }

  return {
    providerId: providerId ? `${providerId}`.trim() : null,
    companyIds: Array.from(companyIds).filter(Boolean)
  };
}

function buildEscrowContext(scope) {
  const context = {};
  if (scope.providerId) {
    context.providerId = scope.providerId;
    context.providerIds = [scope.providerId];
  }
  if (scope.companyIds?.length) {
    context.companyIds = scope.companyIds;
  }
  return context;
}

function serialisePolicy(policy) {
  if (!policy) {
    return null;
  }
  const maxAmount = policy.maxAmount != null ? Number.parseFloat(policy.maxAmount) : null;
  return {
    id: policy.id,
    name: policy.name,
    description: policy.description || '',
    autoReleaseDays: parseInteger(policy.autoReleaseDays, 0),
    requiresDualApproval: Boolean(policy.requiresDualApproval),
    maxAmount: Number.isFinite(maxAmount) ? maxAmount : null,
    notifyRoles: Array.isArray(policy.notifyRoles) ? [...policy.notifyRoles] : [],
    documentChecklist: Array.isArray(policy.documentChecklist) ? [...policy.documentChecklist] : [],
    releaseConditions: Array.isArray(policy.releaseConditions) ? [...policy.releaseConditions] : []
  };
}

function buildPolicyScope(scope) {
  const conditions = [];
  if (scope.providerId) {
    conditions.push({ providerId: scope.providerId });
  }
  if (scope.companyIds?.length) {
    conditions.push({ companyId: { [Op.in]: scope.companyIds } });
  }
  if (conditions.length === 0) {
    return { providerId: null };
  }
  if (conditions.length === 1) {
    return conditions[0];
  }
  return { [Op.or]: conditions };
}

export async function listProviderEscrows(user, params = {}) {
  const scope = await resolveProviderScope(user);
  if (!scope.providerId && scope.companyIds.length === 0) {
    return {
      items: [],
      pagination: { page: 1, pageSize: params.pageSize ?? 20, totalItems: 0, totalPages: 1 },
      summary: { totalAmount: 0, totalAmountFormatted: '£0.00', onHold: 0, disputed: 0, readyForRelease: 0 },
      filters: { statuses: ['pending', 'funded', 'released', 'disputed'], policies: [] },
      settings: { releasePolicies: [] },
      meta: { restricted: true }
    };
  }

  const context = buildEscrowContext(scope);
  const payload = await listEscrows(params, context);
  const policies = await listProviderReleasePolicies(scope);

  const filters = {
    ...(payload.filters ?? {}),
    policies: policies.map((policy) => ({ id: policy.id, name: policy.name }))
  };

  const settings = {
    ...(payload.settings ?? {}),
    releasePolicies: policies
  };

  return {
    ...payload,
    filters,
    settings
  };
}

export async function getProviderEscrow(user, escrowId) {
  const scope = await resolveProviderScope(user);
  const context = buildEscrowContext(scope);
  return getEscrowById(escrowId, { context });
}

export async function updateProviderEscrow(user, escrowId, updates, actorId) {
  const scope = await resolveProviderScope(user);
  const context = buildEscrowContext(scope);
  return updateEscrow(escrowId, updates, actorId, { context });
}

export async function addProviderEscrowNote(user, escrowId, payload, actorId) {
  const scope = await resolveProviderScope(user);
  const context = buildEscrowContext(scope);
  return addEscrowNote(escrowId, payload.body, {
    authorId: actorId,
    pinned: Boolean(payload.pinned),
    context
  });
}

export async function deleteProviderEscrowNote(user, escrowId, noteId) {
  const scope = await resolveProviderScope(user);
  const context = buildEscrowContext(scope);
  return deleteEscrowNote(escrowId, noteId, { context });
}

export async function upsertProviderEscrowMilestone(user, escrowId, milestone) {
  const scope = await resolveProviderScope(user);
  const context = buildEscrowContext(scope);
  return upsertEscrowMilestone(escrowId, milestone, { context });
}

export async function deleteProviderEscrowMilestone(user, escrowId, milestoneId) {
  const scope = await resolveProviderScope(user);
  const context = buildEscrowContext(scope);
  return deleteEscrowMilestone(escrowId, milestoneId, { context });
}

export async function createProviderManualEscrow(user, payload, actorId) {
  const scope = await resolveProviderScope(user);
  const context = buildEscrowContext(scope);
  if (!payload?.orderId) {
    throw validationError('orderId is required to create an escrow.');
  }

  const order = await Order.findByPk(payload.orderId, {
    include: [
      {
        model: Service,
        attributes: ['id', 'providerId', 'companyId']
      }
    ]
  });

  if (!order) {
    throw validationError('Order not found.');
  }

  const service = order.Service;
  if (context.providerId) {
    const providerMatch = service?.providerId ? `${service.providerId}`.trim() : null;
    if (!providerMatch || providerMatch !== context.providerId) {
      throw validationError('Escrow not found for provider context.');
    }
  }

  if (context.companyIds?.length) {
    const companyMatch = service?.companyId ? `${service.companyId}`.trim() : null;
    if (!companyMatch || !context.companyIds.includes(companyMatch)) {
      throw validationError('Escrow not found for provider context.');
    }
  }

  return createManualEscrow(payload, actorId, { context });
}

export async function listProviderReleasePolicies(scopeOrUser) {
  const scope = scopeOrUser?.providerId || scopeOrUser?.companyIds ? scopeOrUser : await resolveProviderScope(scopeOrUser);
  const where = buildPolicyScope(scope);
  const policies = await ProviderEscrowPolicy.findAll({ where, order: [['createdAt', 'DESC']] });
  return policies.map((policy) => serialisePolicy(policy));
}

export async function createProviderReleasePolicy(user, payload = {}, actorId) {
  const scope = await resolveProviderScope(user);
  if (!scope.providerId && scope.companyIds.length === 0) {
    throw validationError('Provider context is required to create policies.');
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    throw validationError('Policy name is required.');
  }

  const record = await ProviderEscrowPolicy.create({
    providerId: scope.providerId,
    companyId: scope.companyIds[0] ?? null,
    name,
    description: typeof payload.description === 'string' ? payload.description.trim() : null,
    autoReleaseDays: parseInteger(payload.autoReleaseDays, 0),
    requiresDualApproval: Boolean(payload.requiresDualApproval),
    maxAmount: parseAmount(payload.maxAmount),
    notifyRoles: toUniqueStrings(payload.notifyRoles),
    documentChecklist: toUniqueStrings(payload.documentChecklist),
    releaseConditions: toUniqueStrings(payload.releaseConditions),
    metadata: {
      createdAt: new Date().toISOString(),
      createdBy: actorId ?? scope.providerId ?? 'system'
    },
    createdBy: actorId ?? scope.providerId ?? null,
    updatedBy: actorId ?? scope.providerId ?? null
  });

  const policies = await listProviderReleasePolicies(scope);
  const policy = serialisePolicy(record);
  return { policy, policies };
}

export async function updateProviderReleasePolicy(user, policyId, payload = {}, actorId) {
  const scope = await resolveProviderScope(user);
  if (!policyId) {
    throw validationError('Policy id is required.');
  }

  const where = { id: policyId, ...buildPolicyScope(scope) };
  const record = await ProviderEscrowPolicy.findOne({ where });
  if (!record) {
    throw validationError('Policy not found.');
  }

  if (payload.name !== undefined) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name) {
      throw validationError('Policy name is required.');
    }
    record.name = name;
  }

  if (payload.description !== undefined) {
    record.description = typeof payload.description === 'string' ? payload.description.trim() : null;
  }

  if (payload.autoReleaseDays !== undefined) {
    record.autoReleaseDays = parseInteger(payload.autoReleaseDays, record.autoReleaseDays ?? 0);
  }

  if (payload.requiresDualApproval !== undefined) {
    record.requiresDualApproval = Boolean(payload.requiresDualApproval);
  }

  if (payload.maxAmount !== undefined) {
    record.maxAmount = parseAmount(payload.maxAmount);
  }

  if (payload.notifyRoles !== undefined) {
    record.notifyRoles = toUniqueStrings(payload.notifyRoles);
  }

  if (payload.documentChecklist !== undefined) {
    record.documentChecklist = toUniqueStrings(payload.documentChecklist);
  }

  if (payload.releaseConditions !== undefined) {
    record.releaseConditions = toUniqueStrings(payload.releaseConditions);
  }

  record.updatedBy = actorId ?? scope.providerId ?? null;
  const metadata = { ...(record.metadata ?? {}) };
  metadata.updatedAt = new Date().toISOString();
  metadata.updatedBy = record.updatedBy;
  record.metadata = metadata;

  await record.save();

  const policies = await listProviderReleasePolicies(scope);
  return { policy: serialisePolicy(record), policies };
}

export async function deleteProviderReleasePolicy(user, policyId) {
  const scope = await resolveProviderScope(user);
  if (!policyId) {
    throw validationError('Policy id is required.');
  }
  const where = { id: policyId, ...buildPolicyScope(scope) };
  const deleted = await ProviderEscrowPolicy.destroy({ where });
  if (deleted === 0) {
    throw validationError('Policy not found.');
  }
  const policies = await listProviderReleasePolicies(scope);
  return { policies };
}
