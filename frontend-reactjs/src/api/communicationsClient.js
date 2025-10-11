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

async function requestJson(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  if (!response.ok) {
    let message = `Communications request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch (error) {
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

export { CommunicationsApiError };
