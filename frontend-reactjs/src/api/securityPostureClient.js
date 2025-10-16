const BASE_URL = '/api/admin/security-posture';

function normaliseSignal(signal, index = 0) {
  if (!signal || typeof signal !== 'object') {
    return {
      id: null,
      metricKey: `signal-${index}`,
      label: `Signal ${index + 1}`,
      valueLabel: '—',
      caption: '',
      tone: 'info',
      statusLabel: null,
      ownerRole: null,
      runbookUrl: null
    };
  }

  return {
    id: signal.id ?? null,
    metricKey: signal.metricKey ?? `signal-${index}`,
    label: signal.label ?? signal.displayName ?? `Signal ${index + 1}`,
    valueLabel: signal.valueLabel ?? '—',
    caption: signal.caption ?? signal.description ?? '',
    tone: signal.tone ?? 'info',
    statusLabel: signal.statusLabel ?? signal.status ?? null,
    ownerRole: signal.ownerRole ?? signal.owner ?? null,
    runbookUrl: signal.runbookUrl ?? signal.runbook ?? null,
    unit: signal.unit ?? null,
    targetSuccess: signal.targetSuccess ?? null,
    targetWarning: signal.targetWarning ?? null,
    lowerIsBetter: Boolean(signal.lowerIsBetter),
    valueSource: signal.valueSource ?? 'computed',
    manualValue: signal.manualValue ?? null,
    manualValueLabel: signal.manualValueLabel ?? null,
    isActive: signal.isActive !== false,
    sortOrder: signal.sortOrder ?? 0
  };
}

function normaliseAutomationTask(task, index = 0) {
  if (!task || typeof task !== 'object') {
    return {
      id: `automation-${index}`,
      name: `Automation ${index + 1}`,
      status: 'Planned',
      notes: '',
      tone: 'info'
    };
  }

  return {
    id: task.id ?? `automation-${index}`,
    name: task.name ?? `Automation ${index + 1}`,
    status: task.status ?? 'Planned',
    notes: task.notes ?? '',
    tone: task.tone ?? 'info',
    owner: task.owner ?? null,
    runbookUrl: task.runbookUrl ?? null,
    dueAt: task.dueAt ?? null,
    priority: task.priority ?? 'medium',
    signalKey: task.signalKey ?? null,
    isActive: task.isActive !== false
  };
}

function normaliseConnector(connector, index = 0) {
  if (!connector || typeof connector !== 'object') {
    return {
      id: `connector-${index}`,
      name: `Connector ${index + 1}`,
      status: 'healthy',
      connectorType: 'custom'
    };
  }

  const parseIntOrNull = (value) => {
    const parsed = Number.parseInt(value ?? 0, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    id: connector.id ?? `connector-${index}`,
    name: connector.name ?? `Connector ${index + 1}`,
    status: connector.status ?? 'healthy',
    description: connector.description ?? '',
    connectorType: connector.connectorType ?? connector.type ?? 'custom',
    region: connector.region ?? null,
    dashboardUrl: connector.dashboardUrl ?? connector.url ?? null,
    ingestionEndpoint: connector.ingestionEndpoint ?? null,
    eventsPerMinuteTarget: parseIntOrNull(connector.eventsPerMinuteTarget ?? connector.target),
    eventsPerMinuteActual: parseIntOrNull(connector.eventsPerMinuteActual ?? connector.actual),
    lastHealthCheckAt: connector.lastHealthCheckAt ?? connector.lastHealth ?? null,
    logoUrl: connector.logoUrl ?? null,
    isActive: connector.isActive !== false
  };
}

function normaliseSummary(summary, signals, automationTasks, connectors) {
  if (!summary || typeof summary !== 'object') {
    return {
      connectorsHealthy: connectors.filter((connector) => connector.status === 'healthy').length,
      connectorsAttention: connectors.filter((connector) => connector.status !== 'healthy').length,
      automationOpen: automationTasks.filter((task) => task.status !== 'Completed').length,
      signalsWarning: signals.filter((signal) => signal.tone === 'warning').length,
      signalsDanger: signals.filter((signal) => signal.tone === 'danger').length
    };
  }

  return {
    connectorsHealthy: Number.parseInt(summary.connectorsHealthy ?? 0, 10) || 0,
    connectorsAttention: Number.parseInt(summary.connectorsAttention ?? 0, 10) || 0,
    automationOpen: Number.parseInt(summary.automationOpen ?? 0, 10) || 0,
    signalsWarning: Number.parseInt(summary.signalsWarning ?? 0, 10) || 0,
    signalsDanger: Number.parseInt(summary.signalsDanger ?? 0, 10) || 0
  };
}

export async function fetchSecurityPosture({ signal, includeInactive = true, timezone } = {}) {
  const query = new URLSearchParams();
  if (includeInactive) {
    query.set('includeInactive', 'true');
  }
  if (timezone) {
    query.set('timezone', timezone);
  }
  const requestUrl = query.size > 0 ? `${BASE_URL}?${query.toString()}` : BASE_URL;

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include',
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.message || 'Failed to load security posture';
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const payload = await response.json();
  const data = payload?.data ?? {};
  const signals = Array.isArray(data.signals) ? data.signals.map(normaliseSignal) : [];
  const automationTasks = Array.isArray(data.automationTasks)
    ? data.automationTasks.map(normaliseAutomationTask)
    : [];
  const connectors = Array.isArray(data.connectors) ? data.connectors.map(normaliseConnector) : [];
  const summary = normaliseSummary(data.summary, signals, automationTasks, connectors);
  const capabilities = {
    canManageSignals: Boolean(data.capabilities?.canManageSignals),
    canManageAutomation: Boolean(data.capabilities?.canManageAutomation),
    canManageConnectors: Boolean(data.capabilities?.canManageConnectors)
  };

  return {
    timezone: data.timezone ?? 'Europe/London',
    updatedAt: data.updatedAt ?? null,
    signals,
    automationTasks,
    connectors,
    summary,
    capabilities
  };
}

async function requestJson(url, { method, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.message || 'Security posture request failed';
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const payload = await response.json().catch(() => ({}));
  return payload?.data ?? null;
}

export function createSecuritySignal(payload) {
  return requestJson(`${BASE_URL}/signals`, { method: 'POST', body: payload });
}

export function updateSecuritySignal(id, payload) {
  return requestJson(`${BASE_URL}/signals/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
}

export function reorderSecuritySignals(orderedIds) {
  return requestJson(`${BASE_URL}/signals/reorder`, { method: 'PUT', body: { orderedIds } });
}

export function deleteSecuritySignal(id) {
  return requestJson(`${BASE_URL}/signals/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function createAutomationTask(payload) {
  return requestJson(`${BASE_URL}/automation`, { method: 'POST', body: payload });
}

export function updateAutomationTask(id, payload) {
  return requestJson(`${BASE_URL}/automation/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
}

export function deleteAutomationTask(id) {
  return requestJson(`${BASE_URL}/automation/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function createTelemetryConnector(payload) {
  return requestJson(`${BASE_URL}/connectors`, { method: 'POST', body: payload });
}

export function updateTelemetryConnector(id, payload) {
  return requestJson(`${BASE_URL}/connectors/${encodeURIComponent(id)}`, { method: 'PUT', body: payload });
}

export function deleteTelemetryConnector(id) {
  return requestJson(`${BASE_URL}/connectors/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
