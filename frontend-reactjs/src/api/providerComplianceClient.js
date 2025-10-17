import { PanelApiError } from './panelClient.js';

function parseJsonSafely(payload) {
  if (!payload) {
    return {};
  }

  if (typeof payload === 'object') {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch (error) {
    const parseError = new PanelApiError('Invalid metadata payload supplied', 400, { cause: error });
    throw parseError;
  }
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    const payload = await response.json();
    return payload ?? null;
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const message = body?.message || fallbackMessage || 'Compliance request failed';
  throw new PanelApiError(message, response.status, { cause: body });
}

async function requestCompliance(path, { method = 'GET', body, signal } = {}) {
  const init = {
    method,
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  };

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`/api/compliance${path}`, init);
  return handleResponse(response, 'Compliance service request failed');
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function normaliseDocument(document = {}) {
  return {
    id: document.id ?? `compliance-doc-${Math.random().toString(36).slice(2, 8)}`,
    companyId: document.companyId ?? null,
    type: document.type ?? 'document',
    status: document.status ?? 'submitted',
    storageKey: document.storageKey ?? null,
    fileName: document.fileName ?? 'document.pdf',
    fileSizeBytes: Number.parseInt(document.fileSizeBytes ?? document.size ?? 0, 10) || 0,
    mimeType: document.mimeType ?? 'application/pdf',
    issuedAt: toIsoDate(document.issuedAt),
    expiryAt: toIsoDate(document.expiryAt),
    submittedAt: toIsoDate(document.submittedAt),
    reviewedAt: toIsoDate(document.reviewedAt),
    reviewerId: document.reviewerId ?? null,
    rejectionReason: document.rejectionReason ?? null,
    metadata: typeof document.metadata === 'object' && document.metadata !== null ? document.metadata : {},
    checksum: document.checksum ?? null,
    downloadUrl:
      document.downloadUrl ||
      (document.id ? `/api/v1/compliance/documents/${encodeURIComponent(document.id)}/download` : null)
  };
}

function normaliseRequiredDocument(entry = {}) {
  return {
    type: entry.type ?? 'document',
    label: entry.label ?? entry.type ?? 'Document',
    status: entry.status ?? 'missing',
    documentId: entry.documentId ?? null,
    expiryAt: toIsoDate(entry.expiryAt),
    expiresInDays:
      typeof entry.expiresInDays === 'number' || typeof entry.expiresInDays === 'string'
        ? Number(entry.expiresInDays)
        : null,
    renewalDue: Boolean(entry.renewalDue)
  };
}

function normaliseApplication(application) {
  if (!application) {
    return null;
  }

  return {
    id: application.id ?? null,
    companyId: application.companyId ?? null,
    status: application.status ?? 'pending_documents',
    complianceScore: Number.parseFloat(application.complianceScore ?? application.score ?? 0) || 0,
    badgeEnabled: Boolean(application.badgeEnabled),
    expiresAt: toIsoDate(application.expiresAt),
    submittedAt: toIsoDate(application.submittedAt),
    approvedAt: toIsoDate(application.approvedAt),
    lastEvaluatedAt: toIsoDate(application.lastEvaluatedAt),
    requiredDocuments: Array.isArray(application.requiredDocuments)
      ? application.requiredDocuments.map(normaliseRequiredDocument)
      : []
  };
}

function normaliseSummary(payload = {}) {
  return {
    application: normaliseApplication(payload.application),
    documents: Array.isArray(payload.documents) ? payload.documents.map(normaliseDocument) : []
  };
}

export async function getProviderComplianceSummary(companyId, { signal } = {}) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const payload = await requestCompliance(`/companies/${encodeURIComponent(companyId)}`, { method: 'GET', signal });
  return normaliseSummary(payload ?? {});
}

export async function submitProviderComplianceDocument(payload, { signal } = {}) {
  if (!payload?.companyId) {
    throw new PanelApiError('companyId is required to upload a document', 400);
  }

  const body = { ...payload };
  if (body.metadata) {
    body.metadata = parseJsonSafely(body.metadata);
  }

  const document = await requestCompliance('/documents', { method: 'POST', body, signal });
  return normaliseDocument(document ?? {});
}

export async function reviewProviderComplianceDocument(documentId, payload, { signal } = {}) {
  if (!documentId) {
    throw new PanelApiError('Document identifier required', 400);
  }

  const body = { ...payload };
  if (body.metadata) {
    body.metadata = parseJsonSafely(body.metadata);
  }

  const document = await requestCompliance(`/documents/${encodeURIComponent(documentId)}/review`, {
    method: 'POST',
    body,
    signal
  });
  return normaliseDocument(document ?? {});
}

export async function evaluateProviderCompliance(companyId, payload = {}, { signal } = {}) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const application = await requestCompliance(`/companies/${encodeURIComponent(companyId)}/evaluate`, {
    method: 'POST',
    body: payload,
    signal
  });
  return normaliseApplication(application);
}

export async function toggleProviderBadge(companyId, { visible, actorId = null } = {}, { signal } = {}) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const application = await requestCompliance(`/companies/${encodeURIComponent(companyId)}/badge`, {
    method: 'POST',
    body: { visible: Boolean(visible), actorId },
    signal
  });
  return normaliseApplication(application);
}

export async function suspendProviderCompliance(companyId, payload = {}, { signal } = {}) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const application = await requestCompliance(`/companies/${encodeURIComponent(companyId)}/suspend`, {
    method: 'POST',
    body: payload,
    signal
  });
  return normaliseApplication(application);
}

