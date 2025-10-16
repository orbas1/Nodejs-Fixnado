import {
  getInboxSettings,
  updateInboxSettings,
  createEntryPoint,
  updateEntryPoint,
  deleteEntryPoint,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule
} from '../services/communicationsInboxService.js';

function handleServiceError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

function resolveTenantId(req) {
  const candidate =
    (typeof req.get === 'function' && req.get('x-tenant-id')) ||
    req.query?.tenantId ||
    req.body?.tenantId ||
    '';
  if (typeof candidate !== 'string') {
    const error = new Error('Tenant header x-tenant-id is required');
    error.statusCode = 401;
    throw error;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    const error = new Error('Tenant header x-tenant-id is required');
    error.statusCode = 401;
    throw error;
  }
  return trimmed;
}

function resolveActor(req) {
  const id = (typeof req.get === 'function' && req.get('x-user-id')) || req.get?.('x-user-email');
  const name = typeof req.get === 'function' ? req.get('x-user-name') : undefined;
  return id || name || null;
}

export async function fetchInboxSettings(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const payload = await getInboxSettings(tenantId);
    res.json(payload);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function putInboxSettings(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const actor = resolveActor(req);
    const payload = await updateInboxSettings(tenantId, req.body || {}, { actor });
    res.json(payload);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function postQuickReply(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const actor = resolveActor(req);
    const reply = await createQuickReply(tenantId, req.body || {}, { actor });
    res.status(201).json(reply);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function postEntryPoint(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const actor = resolveActor(req);
    const entryPoint = await createEntryPoint(tenantId, req.body || {}, { actor });
    res.status(201).json(entryPoint);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function patchEntryPoint(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const actor = resolveActor(req);
    const entryPoint = await updateEntryPoint(tenantId, req.params.entryPointId, req.body || {}, { actor });
    res.json(entryPoint);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function removeEntryPoint(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    await deleteEntryPoint(tenantId, req.params.entryPointId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function patchQuickReply(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const actor = resolveActor(req);
    const reply = await updateQuickReply(tenantId, req.params.quickReplyId, req.body || {}, { actor });
    res.json(reply);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function removeQuickReply(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    await deleteQuickReply(tenantId, req.params.quickReplyId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function postEscalationRule(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const actor = resolveActor(req);
    const rule = await createEscalationRule(tenantId, req.body || {}, { actor });
    res.status(201).json(rule);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function patchEscalationRule(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const actor = resolveActor(req);
    const rule = await updateEscalationRule(tenantId, req.params.escalationId, req.body || {}, { actor });
    res.json(rule);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function removeEscalationRule(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    await deleteEscalationRule(tenantId, req.params.escalationId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
