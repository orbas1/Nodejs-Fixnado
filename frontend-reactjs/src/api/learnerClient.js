const LEARNER_API_ROOT = '/api/learning';

function randomId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normaliseDate(value) {
  if (!value) {
    return null;
  }
  try {
    return new Date(value);
  } catch (error) {
    return null;
  }
}

function normaliseString(value, { maxLength = 256 } = {}) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.slice(0, maxLength);
}

function normaliseNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.min(Math.max(numeric, min), max);
}

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
      value
        .map((entry) => (entry instanceof Date ? entry.toISOString() : String(entry ?? '')))
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((entry) => searchParams.append(key, entry));
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
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
      controller.signal.addEventListener('abort', () => signal.removeEventListener('abort', abort), {
        once: true
      });
    }
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    const networkError = new Error('Unable to reach Fixnado learning services.');
    networkError.cause = error;
    throw networkError;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  let payload = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[learnerClient] Failed to parse JSON payload', error);
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

function ensureArray(value, mapper = (entry) => entry) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      try {
        return mapper(entry);
      } catch (error) {
        console.warn('[learnerClient] mapper failed for entry', entry, error);
        return null;
      }
    })
    .filter(Boolean);
}

export async function fetchLearnerOverview({ timezone, horizonDays = 14 } = {}, { signal } = {}) {
  const query = buildQuery({ timezone, horizonDays });
  const payload = await request(`${LEARNER_API_ROOT}/overview${query}`, { signal });

  const progress = payload?.progress ?? {};
  const normalisedProgress = {
    completionRate: normaliseNumber(progress.completionRate, { min: 0, max: 1 }) ?? 0,
    avgPaceMinutes: normaliseNumber(progress.avgPaceMinutes, { min: 0 }) ?? 0,
    totalHours: normaliseNumber(progress.totalHours, { min: 0 }) ?? 0,
    targetHours: normaliseNumber(progress.targetHours, { min: 0 }) ?? null,
    streakDays: normaliseNumber(progress.streakDays, { min: 0 }) ?? 0,
    weeklyGoalMet: Boolean(progress.weeklyGoalMet)
  };

  const modules = ensureArray(payload?.activeModules, (module) => ({
    id: normaliseString(module.id, { maxLength: 64 }) || randomId('module'),
    title: normaliseString(module.title, { maxLength: 120 }),
    progress: normaliseNumber(module.progress, { min: 0, max: 1 }) ?? 0,
    dueAt: normaliseDate(module.dueAt)?.toISOString() ?? null,
    zone: normaliseString(module.zone, { maxLength: 64 }) || null,
    facilitator: normaliseString(module.facilitator, { maxLength: 80 }) || null,
    riskLevel: normaliseString(module.riskLevel, { maxLength: 24 }) || 'on-track',
    nextSessionAt: normaliseDate(module.nextSessionAt)?.toISOString() ?? null
  }));

  const skillHealth = ensureArray(payload?.skillHealth, (skill) => ({
    id: normaliseString(skill.id, { maxLength: 32 }) || randomId('skill'),
    skill: normaliseString(skill.skill, { maxLength: 80 }),
    trend: normaliseString(skill.trend, { maxLength: 24 }) || 'steady',
    score: normaliseNumber(skill.score, { min: 0, max: 1 }) ?? 0,
    benchmark: normaliseNumber(skill.benchmark, { min: 0, max: 1 }) ?? null
  }));

  const alerts = ensureArray(payload?.alerts, (alert) => ({
    id: normaliseString(alert.id, { maxLength: 64 }) || randomId('alert'),
    message: normaliseString(alert.message, { maxLength: 240 }),
    severity: normaliseString(alert.severity, { maxLength: 24 }) || 'info',
    actionLabel: normaliseString(alert.actionLabel, { maxLength: 80 }) || null,
    actionHref: normaliseString(alert.actionHref, { maxLength: 180 }) || null
  }));

  const activityTrend = ensureArray(payload?.activityTrend, (point) => ({
    date: normaliseDate(point.date)?.toISOString(),
    minutes: normaliseNumber(point.minutes, { min: 0 }) ?? 0
  }));

  return {
    learner: {
      id: normaliseString(payload?.learner?.id, { maxLength: 64 }) || null,
      name: normaliseString(payload?.learner?.name, { maxLength: 120 }) || 'Learner',
      programme: normaliseString(payload?.learner?.programme, { maxLength: 120 }) || null,
      cohort: normaliseString(payload?.learner?.cohort, { maxLength: 120 }) || null,
      timezone: normaliseString(payload?.learner?.timezone, { maxLength: 64 }) || timezone || 'UTC',
      advisor: normaliseString(payload?.learner?.advisor, { maxLength: 120 }) || null
    },
    progress: normalisedProgress,
    modules,
    skillHealth,
    alerts,
    activityTrend
  };
}

export async function fetchLearnerCalendar({ startDate, endDate, timezone } = {}, { signal } = {}) {
  const query = buildQuery({ startDate, endDate, timezone });
  const payload = await request(`${LEARNER_API_ROOT}/calendar${query}`, { signal });

  const sessions = ensureArray(payload?.sessions, (session) => ({
    id: normaliseString(session.id, { maxLength: 64 }) || randomId('session'),
    moduleId: normaliseString(session.moduleId, { maxLength: 64 }) || null,
    title: normaliseString(session.title, { maxLength: 160 }),
    startsAt: normaliseDate(session.startsAt)?.toISOString(),
    endsAt: normaliseDate(session.endsAt)?.toISOString(),
    location: normaliseString(session.location, { maxLength: 160 }) || null,
    zone: normaliseString(session.zone, { maxLength: 64 }) || timezone || 'UTC',
    facilitator: normaliseString(session.facilitator, { maxLength: 120 }) || null,
    status: normaliseString(session.status, { maxLength: 24 }) || 'scheduled',
    preparation: ensureArray(session.preparation, (item) => ({
      id: normaliseString(item.id, { maxLength: 64 }) || randomId('prep'),
      label: normaliseString(item.label, { maxLength: 160 }),
      completed: Boolean(item.completed)
    })),
    reflectionSubmittedAt: normaliseDate(session.reflectionSubmittedAt)?.toISOString() ?? null
  }));

  return {
    timezone: normaliseString(payload?.timezone, { maxLength: 64 }) || timezone || 'UTC',
    sessions,
    lastSyncedAt: normaliseDate(payload?.lastSyncedAt)?.toISOString() ?? new Date().toISOString()
  };
}

export async function updateSessionStatus(sessionId, status, { signal } = {}) {
  const id = normaliseString(sessionId, { maxLength: 64 });
  if (!id) {
    throw new Error('A session identifier is required');
  }
  const payload = await request(`${LEARNER_API_ROOT}/sessions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    signal,
    body: { status: normaliseString(status, { maxLength: 24 }) }
  });
  return payload;
}

export async function submitSessionReflection(sessionId, reflection, { signal } = {}) {
  const id = normaliseString(sessionId, { maxLength: 64 });
  if (!id) {
    throw new Error('A session identifier is required');
  }

  const body = {
    summary: normaliseString(reflection.summary, { maxLength: 480 }),
    sentiment: normaliseString(reflection.sentiment, { maxLength: 32 }),
    blockers: ensureArray(reflection.blockers, (item) => normaliseString(item, { maxLength: 160 })),
    submittedAt: new Date().toISOString()
  };

  return request(`${LEARNER_API_ROOT}/sessions/${encodeURIComponent(id)}/reflection`, {
    method: 'POST',
    signal,
    body
  });
}

export async function fetchLearnerAchievements({ signal } = {}) {
  const payload = await request(`${LEARNER_API_ROOT}/achievements`, { signal });
  const achievements = ensureArray(payload?.achievements, (achievement) => ({
    id: normaliseString(achievement.id, { maxLength: 64 }) || randomId('achievement'),
    title: normaliseString(achievement.title, { maxLength: 160 }),
    description: normaliseString(achievement.description, { maxLength: 360 }) || null,
    awardedAt: normaliseDate(achievement.awardedAt)?.toISOString(),
    points: normaliseNumber(achievement.points, { min: 0 }) ?? 0,
    pinned: Boolean(achievement.pinned)
  }));

  return {
    achievements,
    summary: {
      totalPoints: normaliseNumber(payload?.summary?.totalPoints, { min: 0 }) ?? 0,
      badgeCount: normaliseNumber(payload?.summary?.badgeCount, { min: 0 }) ?? achievements.length,
      recentAwardedAt:
        achievements.length > 0
          ? achievements
              .map((achievement) => achievement.awardedAt)
              .filter(Boolean)
              .sort()
              .slice(-1)[0]
          : null
    }
  };
}

export async function toggleAchievementPin(achievementId, pinned, { signal } = {}) {
  const id = normaliseString(achievementId, { maxLength: 64 });
  if (!id) {
    throw new Error('An achievement identifier is required');
  }

  return request(`${LEARNER_API_ROOT}/achievements/${encodeURIComponent(id)}/pin`, {
    method: 'POST',
    signal,
    body: { pinned: Boolean(pinned) }
  });
}

export async function fetchLearnerRecommendations({ limit = 6 } = {}, { signal } = {}) {
  const payload = await request(`${LEARNER_API_ROOT}/recommendations${buildQuery({ limit })}`, { signal });
  const recommendations = ensureArray(payload?.recommendations, (recommendation) => ({
    id: normaliseString(recommendation.id, { maxLength: 64 }) || randomId('rec'),
    title: normaliseString(recommendation.title, { maxLength: 160 }),
    description: normaliseString(recommendation.description, { maxLength: 360 }) || null,
    impact: normaliseString(recommendation.impact, { maxLength: 24 }) || 'medium',
    effortHours: normaliseNumber(recommendation.effortHours, { min: 0, max: 200 }) ?? null,
    confidence: normaliseNumber(recommendation.confidence, { min: 0, max: 1 }) ?? null,
    source: normaliseString(recommendation.source, { maxLength: 120 }) || null,
    expiresAt: normaliseDate(recommendation.expiresAt)?.toISOString() ?? null
  }));

  return {
    recommendations,
    generatedAt: normaliseDate(payload?.generatedAt)?.toISOString() ?? new Date().toISOString()
  };
}

export async function acknowledgeRecommendation(recommendationId, action, { signal } = {}) {
  const id = normaliseString(recommendationId, { maxLength: 64 });
  if (!id) {
    throw new Error('A recommendation identifier is required');
  }

  const body = {
    action: normaliseString(action, { maxLength: 24 }),
    occurredAt: new Date().toISOString()
  };

  return request(`${LEARNER_API_ROOT}/recommendations/${encodeURIComponent(id)}/acknowledge`, {
    method: 'POST',
    signal,
    body
  });
}

export async function submitRecommendationFeedback(recommendationId, feedback, { signal } = {}) {
  const id = normaliseString(recommendationId, { maxLength: 64 });
  if (!id) {
    throw new Error('A recommendation identifier is required');
  }

  const body = {
    rating: normaliseNumber(feedback.rating, { min: 1, max: 5 }),
    comment: normaliseString(feedback.comment, { maxLength: 360 }) || null,
    submittedAt: new Date().toISOString()
  };

  return request(`${LEARNER_API_ROOT}/recommendations/${encodeURIComponent(id)}/feedback`, {
    method: 'POST',
    signal,
    body
  });
}

export async function fetchLearnerProfile({ signal } = {}) {
  const payload = await request(`${LEARNER_API_ROOT}/profile`, { signal });

  return {
    id: normaliseString(payload?.id, { maxLength: 64 }) || null,
    name: normaliseString(payload?.name, { maxLength: 120 }) || '',
    title: normaliseString(payload?.title, { maxLength: 160 }) || '',
    timezone: normaliseString(payload?.timezone, { maxLength: 64 }) || 'UTC',
    location: normaliseString(payload?.location, { maxLength: 160 }) || '',
    avatar: normaliseString(payload?.avatar, { maxLength: 512 }) || '',
    bio: normaliseString(payload?.bio, { maxLength: 360 }) || '',
    focusAreas: ensureArray(payload?.focusAreas, (area) => normaliseString(area, { maxLength: 80 })),
    languages: ensureArray(payload?.languages, (language) => normaliseString(language, { maxLength: 64 })),
    updatedAt: normaliseDate(payload?.updatedAt)?.toISOString() ?? null
  };
}

export async function updateLearnerProfile(profile, { signal } = {}) {
  const body = {
    name: normaliseString(profile.name, { maxLength: 120 }),
    title: normaliseString(profile.title, { maxLength: 160 }),
    timezone: normaliseString(profile.timezone, { maxLength: 64 }),
    location: normaliseString(profile.location, { maxLength: 160 }),
    bio: normaliseString(profile.bio, { maxLength: 360 }),
    focusAreas: ensureArray(profile.focusAreas, (area) => normaliseString(area, { maxLength: 80 })),
    languages: ensureArray(profile.languages, (language) => normaliseString(language, { maxLength: 64 })),
    avatar: normaliseString(profile.avatar, { maxLength: 512 }) || null
  };

  return request(`${LEARNER_API_ROOT}/profile`, {
    method: 'PUT',
    signal,
    body
  });
}

export async function fetchLearnerPreferences({ signal } = {}) {
  const payload = await request(`${LEARNER_API_ROOT}/preferences`, { signal });
  return {
    weeklyTargetHours: normaliseNumber(payload?.weeklyTargetHours, { min: 1, max: 80 }) ?? 6,
    reminderDays: ensureArray(payload?.reminderDays, (day) => normaliseString(day, { maxLength: 12 })),
    notificationChannels: ensureArray(payload?.notificationChannels, (channel) =>
      normaliseString(channel, { maxLength: 32 })
    ),
    aiCoachEnabled: Boolean(payload?.aiCoachEnabled),
    zoneLock: Boolean(payload?.zoneLock),
    updatedAt: normaliseDate(payload?.updatedAt)?.toISOString() ?? null
  };
}

export async function updateLearnerPreferences(preferences, { signal } = {}) {
  const body = {
    weeklyTargetHours: normaliseNumber(preferences.weeklyTargetHours, { min: 1, max: 80 }),
    reminderDays: ensureArray(preferences.reminderDays, (day) => normaliseString(day, { maxLength: 12 })),
    notificationChannels: ensureArray(preferences.notificationChannels, (channel) =>
      normaliseString(channel, { maxLength: 32 })
    ),
    aiCoachEnabled: Boolean(preferences.aiCoachEnabled),
    zoneLock: Boolean(preferences.zoneLock)
  };

  return request(`${LEARNER_API_ROOT}/preferences`, {
    method: 'PUT',
    signal,
    body
  });
}

export async function recordLearnerTelemetry(event, details = {}, { signal } = {}) {
  const payload = {
    event: normaliseString(event, { maxLength: 64 }),
    details,
    occurredAt: new Date().toISOString()
  };

  return request(`${LEARNER_API_ROOT}/telemetry`, {
    method: 'POST',
    signal,
    body: payload
  });
}
