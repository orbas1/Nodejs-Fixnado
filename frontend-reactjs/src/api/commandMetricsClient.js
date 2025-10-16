const CONFIG_ENDPOINT = '/api/admin/command-metrics/config';
const SETTINGS_ENDPOINT = '/api/admin/command-metrics/settings';
const CARDS_ENDPOINT = '/api/admin/command-metrics/cards';

async function parseResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // ignore parse errors
  }
  const message = payload?.message || fallbackMessage;
  const error = new Error(message);
  error.status = response.status;
  error.details = payload?.details;
  throw error;
}

function normaliseSummary(summary) {
  const notes = Array.isArray(summary?.highlightNotes) ? summary.highlightNotes : [];
  return {
    highlightNotes: notes.map((note) => (typeof note === 'string' ? note : '')).filter(Boolean)
  };
}

function normaliseMetrics(metrics = {}) {
  return {
    escrow: {
      targetHigh: metrics?.escrow?.targetHigh ?? null,
      targetMedium: metrics?.escrow?.targetMedium ?? null,
      captionNote: metrics?.escrow?.captionNote ?? ''
    },
    disputes: {
      thresholdLow: metrics?.disputes?.thresholdLow ?? null,
      thresholdMedium: metrics?.disputes?.thresholdMedium ?? null,
      targetMedianMinutes: metrics?.disputes?.targetMedianMinutes ?? null,
      captionNote: metrics?.disputes?.captionNote ?? ''
    },
    jobs: {
      targetHigh: metrics?.jobs?.targetHigh ?? null,
      targetMedium: metrics?.jobs?.targetMedium ?? null,
      captionNote: metrics?.jobs?.captionNote ?? ''
    },
    sla: {
      target: metrics?.sla?.target ?? null,
      warning: metrics?.sla?.warning ?? null,
      captionNote: metrics?.sla?.captionNote ?? ''
    }
  };
}

function normaliseSettings(settings = {}) {
  return {
    summary: normaliseSummary(settings.summary),
    metrics: normaliseMetrics(settings.metrics ?? {}),
    metadata: {
      updatedAt: settings.metadata?.updatedAt ?? null
    }
  };
}

function normaliseCard(card) {
  if (!card) {
    return null;
  }
  return {
    id: card.id,
    title: card.title ?? '',
    tone: card.tone ?? 'info',
    details: Array.isArray(card.details) ? card.details : [],
    displayOrder: card.displayOrder ?? 100,
    isActive: card.isActive !== false,
    mediaUrl: card.mediaUrl ?? '',
    mediaAlt: card.mediaAlt ?? '',
    cta: card.cta
      ? {
          label: card.cta.label ?? '',
          href: card.cta.href ?? '',
          external: Boolean(card.cta.external)
        }
      : { label: '', href: '', external: false },
    updatedAt: card.updatedAt ?? null,
    updatedBy: card.updatedBy ?? null
  };
}

function normaliseCards(cards = []) {
  return cards.map(normaliseCard).filter(Boolean);
}

export async function fetchCommandMetricsConfig({ signal } = {}) {
  const response = await fetch(CONFIG_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  const payload = await parseResponse(response, 'Failed to load command metrics configuration');
  return {
    settings: normaliseSettings(payload?.data?.settings ?? {}),
    cards: normaliseCards(payload?.data?.cards ?? [])
  };
}

export async function saveCommandMetricsSettings(body) {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const payload = await parseResponse(response, 'Failed to save command metrics settings');
  return {
    settings: normaliseSettings(payload?.data?.settings ?? {}),
    cards: normaliseCards(payload?.data?.cards ?? [])
  };
}

export async function createCommandMetricCard(payload) {
  const response = await fetch(CARDS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(response, 'Failed to create command metric card');
  return normaliseCard(data?.data);
}

export async function updateCommandMetricCardRequest(id, payload) {
  const response = await fetch(`${CARDS_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(response, 'Failed to update command metric card');
  return normaliseCard(data?.data);
}

export async function deleteCommandMetricCardRequest(id) {
  const response = await fetch(`${CARDS_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  await parseResponse(response, 'Failed to delete command metric card');
}

export default {
  fetchCommandMetricsConfig,
  saveCommandMetricsSettings,
  createCommandMetricCard,
  updateCommandMetricCardRequest,
  deleteCommandMetricCardRequest
};
