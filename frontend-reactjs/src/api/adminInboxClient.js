const BASE_ENDPOINT = '/api/admin/inbox';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  const errorPayload = await response.json().catch(() => ({}));
  const error = new Error(errorPayload?.message || fallbackMessage);
  error.status = response.status;
  error.details = errorPayload?.details;
  throw error;
}

function normaliseConfiguration(configuration = {}) {
  return {
    autoAssignEnabled: configuration.autoAssignEnabled !== false,
    quietHoursStart: configuration.quietHoursStart || null,
    quietHoursEnd: configuration.quietHoursEnd || null,
    attachmentsEnabled: configuration.attachmentsEnabled !== false,
    maxAttachmentMb: Number.parseInt(configuration.maxAttachmentMb ?? 25, 10) || 25,
    allowedFileTypes: Array.isArray(configuration.allowedFileTypes)
      ? configuration.allowedFileTypes
      : typeof configuration.allowedFileTypes === 'string'
        ? configuration.allowedFileTypes.split(',').map((item) => item.trim()).filter(Boolean)
        : ['jpg', 'png', 'pdf'],
    aiAssistEnabled: configuration.aiAssistEnabled !== false,
    aiAssistProvider: configuration.aiAssistProvider || '',
    firstResponseSlaMinutes: Number.parseInt(configuration.firstResponseSlaMinutes ?? 10, 10) || 10,
    resolutionSlaMinutes: Number.parseInt(configuration.resolutionSlaMinutes ?? 120, 10) || 120,
    escalationPolicy: configuration.escalationPolicy || { levelOneMinutes: 15, levelTwoMinutes: 45 },
    brandColor: configuration.brandColor || '#0ea5e9',
    signature: configuration.signature || '',
    roleRestrictions: Array.isArray(configuration.roleRestrictions)
      ? configuration.roleRestrictions
      : [],
    defaultQueueId: configuration.defaultQueueId || null,
    quietHours: configuration.quietHours || null
  };
}

function normaliseQueue(queue = {}) {
  return {
    id: queue.id || queue.queueId || null,
    name: queue.name || 'Queue',
    description: queue.description || '',
    slaMinutes: Number.parseInt(queue.slaMinutes ?? queue.sla_minutes ?? 15, 10) || 15,
    escalationMinutes: Number.parseInt(queue.escalationMinutes ?? queue.escalation_minutes ?? 45, 10) || 45,
    allowedRoles: Array.isArray(queue.allowedRoles)
      ? queue.allowedRoles
      : typeof queue.allowedRoles === 'string'
        ? queue.allowedRoles.split(',').map((item) => item.trim()).filter(Boolean)
        : ['support'],
    autoResponderEnabled: queue.autoResponderEnabled !== false,
    triageFormUrl: queue.triageFormUrl || '',
    channels: Array.isArray(queue.channels)
      ? queue.channels
      : typeof queue.channels === 'string'
        ? queue.channels.split(',').map((item) => item.trim()).filter(Boolean)
        : ['in-app'],
    accentColor: queue.accentColor || '#0ea5e9',
    backlog: Number.parseInt(queue.backlog ?? 0, 10) || 0,
    awaitingResponse: Number.parseInt(queue.awaitingResponse ?? 0, 10) || 0,
    breachRisk: Number.parseInt(queue.breachRisk ?? 0, 10) || 0,
    averageFirstResponseMinutes: queue.averageFirstResponseMinutes ?? null
  };
}

function normaliseTemplate(template = {}) {
  return {
    id: template.id || null,
    queueId: template.queueId || null,
    name: template.name || '',
    category: template.category || '',
    locale: template.locale || 'en-GB',
    subject: template.subject || '',
    body: template.body || '',
    isActive: template.isActive !== false,
    tags: Array.isArray(template.tags)
      ? template.tags
      : typeof template.tags === 'string'
        ? template.tags.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    previewImageUrl: template.previewImageUrl || '',
    updatedBy: template.updatedBy || ''
  };
}

function normaliseMetrics(metrics = {}) {
  return {
    queues: Number.parseInt(metrics.queues ?? 0, 10) || 0,
    backlog: Number.parseInt(metrics.backlog ?? 0, 10) || 0,
    awaitingResponse: Number.parseInt(metrics.awaitingResponse ?? 0, 10) || 0,
    breachRisk: Number.parseInt(metrics.breachRisk ?? 0, 10) || 0,
    conversationsWithoutAssignment:
      Number.parseInt(metrics.conversationsWithoutAssignment ?? 0, 10) || 0,
    averageFirstResponseMinutes:
      metrics.averageFirstResponseMinutes != null
        ? Number(metrics.averageFirstResponseMinutes)
        : null,
    templatesActive: Number.parseInt(metrics.templatesActive ?? 0, 10) || 0,
    templatesInactive: Number.parseInt(metrics.templatesInactive ?? 0, 10) || 0
  };
}

function normaliseSnapshot(snapshot = {}) {
  return {
    configuration: normaliseConfiguration(snapshot.configuration ?? {}),
    queues: Array.isArray(snapshot.queues) ? snapshot.queues.map(normaliseQueue) : [],
    templates: Array.isArray(snapshot.templates) ? snapshot.templates.map(normaliseTemplate) : [],
    metrics: snapshot.metrics ? normaliseMetrics(snapshot.metrics.totals ?? snapshot.metrics) : normaliseMetrics(),
    queueMetrics: Array.isArray(snapshot.metrics?.queues)
      ? snapshot.metrics.queues.map(normaliseQueue)
      : []
  };
}

export async function fetchAdminInboxSnapshot({ signal } = {}) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  const payload = await handleResponse(response, 'Failed to load inbox settings');
  return normaliseSnapshot(payload ?? {});
}

export async function updateAdminInboxConfiguration(body) {
  const response = await fetch(`${BASE_ENDPOINT}/configuration`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const payload = await handleResponse(response, 'Failed to save inbox configuration');
  return normaliseSnapshot(payload ?? {});
}

export async function saveInboxQueue(queue) {
  const hasId = Boolean(queue?.id);
  const endpoint = hasId ? `${BASE_ENDPOINT}/queues/${queue.id}` : `${BASE_ENDPOINT}/queues`;
  const response = await fetch(endpoint, {
    method: hasId ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(queue)
  });
  const payload = await handleResponse(response, 'Failed to save inbox queue');
  return normaliseSnapshot(payload ?? {});
}

export async function deleteInboxQueue(queueId) {
  const response = await fetch(`${BASE_ENDPOINT}/queues/${queueId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  const payload = await handleResponse(response, 'Failed to delete inbox queue');
  return normaliseSnapshot(payload ?? {});
}

export async function saveInboxTemplate(template) {
  const hasId = Boolean(template?.id);
  const endpoint = hasId ? `${BASE_ENDPOINT}/templates/${template.id}` : `${BASE_ENDPOINT}/templates`;
  const response = await fetch(endpoint, {
    method: hasId ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(template)
  });
  const payload = await handleResponse(response, 'Failed to save inbox template');
  return normaliseSnapshot(payload ?? {});
}

export async function deleteInboxTemplate(templateId) {
  const response = await fetch(`${BASE_ENDPOINT}/templates/${templateId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  const payload = await handleResponse(response, 'Failed to delete inbox template');
  return normaliseSnapshot(payload ?? {});
}
