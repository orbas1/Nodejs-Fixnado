import { resolveSessionTelemetryContext } from '../utils/telemetry.js';

class CommunicationsApiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = 'CommunicationsApiError';
    this.status = status;
    if (cause) {
      this.cause = cause;
    }
  }
}

function buildRequestHeaders(additional = {}) {
  const context = resolveSessionTelemetryContext();
  const headers = {
    'content-type': 'application/json',
    ...additional
  };

  if (context?.tenantId) {
    headers['x-tenant-id'] = context.tenantId;
  }
  if (context?.userId) {
    headers['x-user-id'] = context.userId;
  }
  if (context?.role) {
    headers['x-user-role'] = context.role;
  }

  return headers;
}

async function requestJson(path, { method = 'GET', body, signal, headers } = {}) {
  const response = await fetch(path, {
    method,
    headers: buildRequestHeaders(headers),
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  if (!response.ok) {
    let message = `Communications request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // ignore json parse errors
    }
    throw new CommunicationsApiError(message, { status: response.status });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function createConversation(payload, options = {}) {
  return requestJson('/api/communications', { method: 'POST', body: payload, signal: options.signal });
}

export async function listConversations(participantId, options = {}) {
  const params = new URLSearchParams({ participantId });
  if (options.limit) {
    params.set('limit', String(options.limit));
  }
  return requestJson(`/api/communications?${params.toString()}`, { signal: options.signal });
}

export async function fetchConversation(conversationId, options = {}) {
  const params = new URLSearchParams();
  if (options.limit) {
    params.set('limit', String(options.limit));
  }
  const url = params.size > 0 ? `/api/communications/${conversationId}?${params.toString()}` : `/api/communications/${conversationId}`;
  return requestJson(url, { signal: options.signal });
}

export async function postMessage(conversationId, payload, options = {}) {
  return requestJson(`/api/communications/${conversationId}/messages`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export async function updateParticipantPreferences(conversationId, participantId, payload, options = {}) {
  return requestJson(`/api/communications/${conversationId}/participants/${participantId}`, {
    method: 'PATCH',
    body: payload,
    signal: options.signal
  });
}

export async function createVideoSession(conversationId, payload, options = {}) {
  return requestJson(`/api/communications/${conversationId}/video-session`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export async function fetchInboxSettings(options = {}) {
  return requestJson('/api/communications/settings/inbox', { signal: options.signal });
}

export async function saveInboxSettings(payload, options = {}) {
  return requestJson('/api/communications/settings/inbox', {
    method: 'PUT',
    body: payload,
    signal: options.signal
  });
}

export async function createInboxEntryPoint(payload, options = {}) {
  return requestJson('/api/communications/settings/inbox/entry-points', {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export async function updateInboxEntryPoint(entryPointId, payload, options = {}) {
  return requestJson(`/api/communications/settings/inbox/entry-points/${entryPointId}`, {
    method: 'PATCH',
    body: payload,
    signal: options.signal
  });
}

export async function deleteInboxEntryPoint(entryPointId, options = {}) {
  return requestJson(`/api/communications/settings/inbox/entry-points/${entryPointId}`, {
    method: 'DELETE',
    signal: options.signal
  });
}

export async function createInboxQuickReply(payload, options = {}) {
  return requestJson('/api/communications/settings/inbox/quick-replies', {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export async function updateInboxQuickReply(quickReplyId, payload, options = {}) {
  return requestJson(`/api/communications/settings/inbox/quick-replies/${quickReplyId}`, {
    method: 'PATCH',
    body: payload,
    signal: options.signal
  });
}

export async function deleteInboxQuickReply(quickReplyId, options = {}) {
  return requestJson(`/api/communications/settings/inbox/quick-replies/${quickReplyId}`, {
    method: 'DELETE',
    signal: options.signal
  });
}

export async function createInboxEscalationRule(payload, options = {}) {
  return requestJson('/api/communications/settings/inbox/escalations', {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export async function updateInboxEscalationRule(escalationId, payload, options = {}) {
  return requestJson(`/api/communications/settings/inbox/escalations/${escalationId}`, {
    method: 'PATCH',
    body: payload,
    signal: options.signal
  });
}

export async function deleteInboxEscalationRule(escalationId, options = {}) {
  return requestJson(`/api/communications/settings/inbox/escalations/${escalationId}`, {
    method: 'DELETE',
    signal: options.signal
  });
}

export { CommunicationsApiError };
