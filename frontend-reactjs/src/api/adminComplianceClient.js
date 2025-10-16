const BASE_ENDPOINT = '/api/admin/compliance/controls';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
      return;
    }

    query.append(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : '';
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  const message = payload?.message || fallbackMessage;
  const error = new Error(message);
  error.status = response.status;
  error.details = payload?.details;
  throw error;
}

function normaliseControl(control) {
  if (!control || typeof control !== 'object') {
    return null;
  }

  return {
    id: control.id,
    title: control.title,
    category: control.category,
    controlType: control.controlType,
    status: control.status,
    reviewFrequency: control.reviewFrequency,
    nextReviewAt: control.nextReviewAt,
    lastReviewAt: control.lastReviewAt,
    ownerTeam: control.ownerTeam,
    ownerEmail: control.ownerEmail,
    owner: control.owner ?? null,
    company: control.company ?? null,
    evidenceRequired: Boolean(control.evidenceRequired),
    evidenceLocation: control.evidenceLocation ?? '',
    documentationUrl: control.documentationUrl ?? '',
    escalationPolicy: control.escalationPolicy ?? '',
    notes: control.notes ?? '',
    tags: Array.isArray(control.tags) ? control.tags : [],
    watchers: Array.isArray(control.watchers) ? control.watchers : [],
    metadata: typeof control.metadata === 'object' && control.metadata !== null ? control.metadata : {},
    dueLabel: control.dueLabel ?? '',
    dueStatus: control.dueStatus ?? 'on-track'
  };
}

function normaliseCollection(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      controls: [],
      summary: { total: 0, overdue: 0, dueSoon: 0, monitoring: 0 },
      automation: {},
      evidence: [],
      exceptions: [],
      filters: { statuses: [], categories: [], reviewFrequencies: [], controlTypes: [], ownerTeams: [] }
    };
  }

  return {
    controls: Array.isArray(payload.controls) ? payload.controls.map(normaliseControl).filter(Boolean) : [],
    summary: {
      total: Number.parseInt(payload.summary?.total ?? 0, 10) || 0,
      overdue: Number.parseInt(payload.summary?.overdue ?? 0, 10) || 0,
      dueSoon: Number.parseInt(payload.summary?.dueSoon ?? 0, 10) || 0,
      monitoring: Number.parseInt(payload.summary?.monitoring ?? 0, 10) || 0
    },
    automation:
      typeof payload.automation === 'object' && payload.automation !== null ? payload.automation : { autoReminders: true },
    evidence: Array.isArray(payload.evidence) ? payload.evidence : [],
    exceptions: Array.isArray(payload.exceptions) ? payload.exceptions : [],
    filters: {
      statuses: Array.isArray(payload.filters?.statuses) ? payload.filters.statuses : [],
      categories: Array.isArray(payload.filters?.categories) ? payload.filters.categories : [],
      reviewFrequencies: Array.isArray(payload.filters?.reviewFrequencies) ? payload.filters.reviewFrequencies : [],
      controlTypes: Array.isArray(payload.filters?.controlTypes) ? payload.filters.controlTypes : [],
      ownerTeams: Array.isArray(payload.filters?.ownerTeams) ? payload.filters.ownerTeams : []
    }
  };
}

export async function fetchComplianceControls({ query = {}, signal } = {}) {
  const response = await fetch(`${BASE_ENDPOINT}${toQueryString(query)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load compliance controls');
  return normaliseCollection(payload);
}

export async function createComplianceControl(payload) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const result = await handleResponse(response, 'Failed to create compliance control');
  return normaliseControl(result?.control);
}

export async function updateComplianceControl(controlId, payload) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(controlId)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const result = await handleResponse(response, 'Failed to update compliance control');
  return normaliseControl(result?.control);
}

export async function deleteComplianceControl(controlId) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(controlId)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  await handleResponse(response, 'Failed to delete compliance control');
}

export async function updateComplianceAutomation(settings) {
  const response = await fetch(`${BASE_ENDPOINT}/automation`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(settings)
  });

  const payload = await handleResponse(response, 'Failed to update automation settings');
  return payload?.settings ?? settings;
}

