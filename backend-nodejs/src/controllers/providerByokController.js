import { validationResult } from 'express-validator';
import {
  archiveProviderByokIntegration,
  getProviderByokSnapshot,
  listProviderByokAuditLogs,
  saveProviderByokIntegration,
  testProviderByokIntegration
} from '../services/providerByokService.js';
import { Company } from '../models/index.js';

async function resolveCompanyIdForRequest(req) {
  if (!req.user || !req.user.id) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  if (req.user.type !== 'company') {
    const error = new Error('persona_forbidden');
    error.statusCode = 403;
    throw error;
  }
  const company = await Company.findOne({ where: { userId: req.user.id }, attributes: ['id'], raw: true });
  if (!company) {
    const error = new Error('company_not_found');
    error.statusCode = 404;
    throw error;
  }
  return company.id;
}

function handleValidation(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.details = result.array();
    throw error;
  }
}

export async function listProviderByokIntegrationsHandler(req, res, next) {
  try {
    handleValidation(req);
    const companyId = await resolveCompanyIdForRequest(req);
    const snapshot = await getProviderByokSnapshot({ companyId });
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
}

export async function createProviderByokIntegrationHandler(req, res, next) {
  try {
    handleValidation(req);
    const companyId = await resolveCompanyIdForRequest(req);
    const payload = req.body ?? {};
    const integration = await saveProviderByokIntegration({
      companyId,
      integration: payload.integration,
      displayName: payload.displayName,
      status: payload.status,
      settings: payload.settings,
      credentials: payload.credentials,
      metadata: payload.metadata,
      actor: { id: req.user.id, type: req.user.type }
    });
    res.status(201).json({ data: integration });
  } catch (error) {
    next(error);
  }
}

export async function updateProviderByokIntegrationHandler(req, res, next) {
  try {
    handleValidation(req);
    const companyId = await resolveCompanyIdForRequest(req);
    const payload = req.body ?? {};
    const integration = await saveProviderByokIntegration({
      companyId,
      integrationId: req.params.integrationId,
      displayName: payload.displayName,
      status: payload.status,
      settings: payload.settings,
      credentials: payload.credentials,
      metadata: payload.metadata,
      actor: { id: req.user.id, type: req.user.type }
    });
    res.json({ data: integration });
  } catch (error) {
    next(error);
  }
}

export async function archiveProviderByokIntegrationHandler(req, res, next) {
  try {
    handleValidation(req);
    const companyId = await resolveCompanyIdForRequest(req);
    const integration = await archiveProviderByokIntegration({
      companyId,
      integrationId: req.params.integrationId,
      actor: { id: req.user.id, type: req.user.type }
    });
    res.json({ data: integration });
  } catch (error) {
    next(error);
  }
}

export async function testProviderByokIntegrationHandler(req, res, next) {
  try {
    handleValidation(req);
    const companyId = await resolveCompanyIdForRequest(req);
    const result = await testProviderByokIntegration({
      companyId,
      integrationId: req.params.integrationId,
      actor: { id: req.user.id, type: req.user.type }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listProviderByokAuditLogsHandler(req, res, next) {
  try {
    handleValidation(req);
    const companyId = await resolveCompanyIdForRequest(req);
    const limitCandidate = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitCandidate)
      ? Math.max(1, Math.min(limitCandidate, 100))
      : 25;
    const audit = await listProviderByokAuditLogs({
      companyId,
      integrationId: req.params.integrationId ?? null,
      limit
    });
    res.json({ data: audit });
  } catch (error) {
    next(error);
  }
}
