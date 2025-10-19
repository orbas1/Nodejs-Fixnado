const COMMUNITY_API_ROOT = '/api/community';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof Date) {
      searchParams.append(key, value.toISOString());
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry === undefined || entry === null) {
          return;
        }
        const trimmed = `${entry}`.trim();
        if (trimmed) {
          searchParams.append(key, trimmed);
        }
      });
      return;
    }

    if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false');
      return;
    }

    const trimmed = `${value}`.trim();
    if (trimmed) {
      searchParams.append(key, trimmed);
    }
  });

  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

function sanitisePayload(payload = {}) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (value instanceof Date) {
      acc[key] = value.toISOString();
      return acc;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return acc;
      }
      acc[key] = trimmed;
      return acc;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }

    if (typeof value === 'object') {
      acc[key] = sanitisePayload(value);
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener(
        'abort',
        () => signal.removeEventListener('abort', abort),
        { once: true }
      );
    }
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    const networkError = new Error('Unable to reach Fixnado community services.');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[communityClient] unable to parse JSON response', error);
    }
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

export async function fetchCommunitySummary({ persona, limit = 6 } = {}, { signal } = {}) {
  const query = buildQuery(sanitisePayload({ persona, limit }));
  const payload = await request(`${COMMUNITY_API_ROOT}/summary${query}`, { signal });

  if (!payload || typeof payload !== 'object') {
    return {
      metrics: {},
      highlights: [],
      trending: [],
      recommendations: []
    };
  }

  return {
    metrics: payload.metrics ?? {},
    highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
    trending: Array.isArray(payload.trending) ? payload.trending : [],
    recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : []
  };
}

export async function fetchCommunityPost(postId, { signal } = {}) {
  if (!postId) {
    throw new Error('A postId is required to load community content');
  }

  const payload = await request(`${COMMUNITY_API_ROOT}/posts/${encodeURIComponent(postId)}`, { signal });

  if (!payload || typeof payload !== 'object') {
    throw new Error('Post not found');
  }

  return payload;
}

export async function fetchCommunityEvents({ from, to, limit = 12, zone } = {}, { signal } = {}) {
  const query = buildQuery(
    sanitisePayload({ from, to, limit, zone })
  );
  const payload = await request(`${COMMUNITY_API_ROOT}/events${query}`, { signal });

  return Array.isArray(payload?.events) ? payload.events : Array.isArray(payload) ? payload : [];
}

export async function fetchCommunityMessages({ channelId, limit = 50 } = {}, { signal } = {}) {
  const query = buildQuery(sanitisePayload({ channelId, limit }));
  const payload = await request(`${COMMUNITY_API_ROOT}/messages${query}`, { signal });

  return {
    conversations: Array.isArray(payload?.conversations) ? payload.conversations : [],
    messages: Array.isArray(payload?.messages) ? payload.messages : []
  };
}

export async function fetchModerationQueue({ status = 'open', limit = 20 } = {}, { signal } = {}) {
  const query = buildQuery(sanitisePayload({ status, limit }));
  const payload = await request(`${COMMUNITY_API_ROOT}/moderation${query}`, { signal });

  return Array.isArray(payload?.cases) ? payload.cases : Array.isArray(payload) ? payload : [];
}

export async function resolveModerationCase(caseId, decision, payload = {}) {
  if (!caseId) {
    throw new Error('A moderation caseId is required');
  }
  if (!decision) {
    throw new Error('A moderation decision is required');
  }

  const body = sanitisePayload({ decision, ...payload });
  return request(`${COMMUNITY_API_ROOT}/moderation/${encodeURIComponent(caseId)}`, {
    method: 'PATCH',
    body
  });
}

export async function sendCommunityMessage(channelId, payload) {
  if (!channelId) {
    throw new Error('A channelId is required to send a message');
  }

  const body = sanitisePayload(payload);
  return request(`${COMMUNITY_API_ROOT}/messages/${encodeURIComponent(channelId)}`, {
    method: 'POST',
    body
  });
}

export async function recordPostReaction(postId, reaction) {
  if (!postId || !reaction) {
    throw new Error('postId and reaction are required');
  }

  const body = sanitisePayload({ reaction });
  return request(`${COMMUNITY_API_ROOT}/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'POST',
    body
  });
}

export async function createPostComment(postId, payload) {
  if (!postId) {
    throw new Error('A postId is required to add a comment');
  }

  const body = sanitisePayload(payload);
  return request(`${COMMUNITY_API_ROOT}/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body
  });
}

export default {
  fetchCommunitySummary,
  fetchCommunityPost,
  fetchCommunityEvents,
  fetchCommunityMessages,
  fetchModerationQueue,
  resolveModerationCase,
  sendCommunityMessage,
  recordPostReaction,
  createPostComment
};
