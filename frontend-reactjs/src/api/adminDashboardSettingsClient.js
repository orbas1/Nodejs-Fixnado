const SETTINGS_ENDPOINT = '/api/admin/dashboard/overview-settings';

const DEFAULT_SETTINGS = Object.freeze({
  metrics: {
    escrow: {
      label: 'Escrow under management',
      caption: '',
      targetHighMultiplier: 1.05,
      targetMediumMultiplier: 0.9
    },
    disputes: {
      label: 'Disputes requiring action',
      caption: '',
      thresholdLowMultiplier: 0.7,
      thresholdMediumMultiplier: 1.1
    },
    jobs: {
      label: 'Live jobs',
      caption: '',
      targetHighMultiplier: 1.2,
      targetMediumMultiplier: 0.9
    },
    sla: {
      label: 'SLA compliance',
      caption: '',
      goal: 97,
      warningThreshold: 94
    }
  },
  charts: {
    escrow: {
      targetDivisor: 1_000_000,
      targetLabel: 'Baseline target'
    }
  },
  insights: { manual: [] },
  timeline: { manual: [] },
  security: { manualSignals: [] },
  automation: { manualBacklog: [] },
  queues: { manualBoards: [], manualComplianceControls: [] },
  audit: { manualTimeline: [] }
});

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  let errorPayload = null;
  try {
    errorPayload = await response.json();
  } catch {
    // ignore parse error
  }

  const error = new Error(errorPayload?.message || fallbackMessage);
  error.status = response.status;
  throw error;
}

function normaliseMetric(metric = {}, defaults = {}) {
  return {
    label: typeof metric.label === 'string' ? metric.label : defaults.label || '',
    caption: typeof metric.caption === 'string' ? metric.caption : defaults.caption || '',
    targetHighMultiplier:
      typeof metric.targetHighMultiplier === 'number'
        ? metric.targetHighMultiplier
        : typeof defaults.targetHighMultiplier === 'number'
          ? defaults.targetHighMultiplier
          : 0,
    targetMediumMultiplier:
      typeof metric.targetMediumMultiplier === 'number'
        ? metric.targetMediumMultiplier
        : typeof defaults.targetMediumMultiplier === 'number'
          ? defaults.targetMediumMultiplier
          : 0,
    thresholdLowMultiplier:
      typeof metric.thresholdLowMultiplier === 'number'
        ? metric.thresholdLowMultiplier
        : typeof defaults.thresholdLowMultiplier === 'number'
          ? defaults.thresholdLowMultiplier
          : 0,
    thresholdMediumMultiplier:
      typeof metric.thresholdMediumMultiplier === 'number'
        ? metric.thresholdMediumMultiplier
        : typeof defaults.thresholdMediumMultiplier === 'number'
          ? defaults.thresholdMediumMultiplier
          : 0,
    goal: typeof metric.goal === 'number' ? metric.goal : typeof defaults.goal === 'number' ? defaults.goal : 0,
    warningThreshold:
      typeof metric.warningThreshold === 'number'
        ? metric.warningThreshold
        : typeof defaults.warningThreshold === 'number'
          ? defaults.warningThreshold
          : 0
  };
}

function normaliseChart(chart = {}, defaults = {}) {
  return {
    targetDivisor:
      typeof chart.targetDivisor === 'number'
        ? chart.targetDivisor
        : typeof defaults.targetDivisor === 'number'
          ? defaults.targetDivisor
          : 1_000_000,
    targetLabel:
      typeof chart.targetLabel === 'string' && chart.targetLabel.trim().length > 0
        ? chart.targetLabel
        : defaults.targetLabel || 'Baseline target'
  };
}

function normaliseInsights(insights = {}) {
  const manual = Array.isArray(insights.manual)
    ? insights.manual.map((entry) => (typeof entry === 'string' ? entry : '')).filter(Boolean)
    : [];
  return { manual };
}

function normaliseTimeline(timeline = {}) {
  const manual = Array.isArray(timeline.manual)
    ? timeline.manual
        .map((entry) => ({
          title: typeof entry?.title === 'string' ? entry.title : '',
          when: typeof entry?.when === 'string' ? entry.when : '',
          status: typeof entry?.status === 'string' ? entry.status : ''
        }))
        .filter((entry) => entry.title && entry.when)
    : [];
  return { manual };
}

function normaliseSecurity(security = {}) {
  const manualSignals = Array.isArray(security.manualSignals)
    ? security.manualSignals
        .map((signal) => ({
          label: typeof signal?.label === 'string' ? signal.label : '',
          caption: typeof signal?.caption === 'string' ? signal.caption : '',
          valueLabel: typeof signal?.valueLabel === 'string' ? signal.valueLabel : '',
          tone: typeof signal?.tone === 'string' ? signal.tone : 'info'
        }))
        .filter((signal) => signal.label && signal.valueLabel)
    : [];
  return { manualSignals };
}

function normaliseAutomation(automation = {}) {
  const manualBacklog = Array.isArray(automation.manualBacklog)
    ? automation.manualBacklog
        .map((item) => ({
          name: typeof item?.name === 'string' ? item.name : '',
          status: typeof item?.status === 'string' ? item.status : '',
          notes: typeof item?.notes === 'string' ? item.notes : '',
          tone: typeof item?.tone === 'string' ? item.tone : 'info'
        }))
        .filter((item) => item.name && item.status)
    : [];
  return { manualBacklog };
}

function normaliseQueues(queues = {}) {
  const manualBoards = Array.isArray(queues.manualBoards)
    ? queues.manualBoards.map((board) => ({
        title: typeof board?.title === 'string' ? board.title : '',
        summary: typeof board?.summary === 'string' ? board.summary : '',
        owner: typeof board?.owner === 'string' ? board.owner : '',
        updates: Array.isArray(board?.updates)
          ? board.updates.map((update) => (typeof update === 'string' ? update : '')).filter(Boolean)
          : []
      }))
    : [];
  const manualComplianceControls = Array.isArray(queues.manualComplianceControls)
    ? queues.manualComplianceControls
        .map((control) => ({
          name: typeof control?.name === 'string' ? control.name : '',
          detail: typeof control?.detail === 'string' ? control.detail : '',
          due: typeof control?.due === 'string' ? control.due : '',
          owner: typeof control?.owner === 'string' ? control.owner : '',
          tone: typeof control?.tone === 'string' ? control.tone : 'info'
        }))
        .filter((control) => control.name && control.detail && control.due)
    : [];
  return { manualBoards, manualComplianceControls };
}

function normaliseAudit(audit = {}) {
  const manualTimeline = Array.isArray(audit.manualTimeline)
    ? audit.manualTimeline
        .map((entry) => ({
          time: typeof entry?.time === 'string' ? entry.time : '',
          event: typeof entry?.event === 'string' ? entry.event : '',
          owner: typeof entry?.owner === 'string' ? entry.owner : '',
          status: typeof entry?.status === 'string' ? entry.status : ''
        }))
        .filter((entry) => entry.time && entry.event)
    : [];
  return { manualTimeline };
}

function normaliseSettings(settings = {}) {
  const metrics = settings.metrics ?? {};
  const charts = settings.charts ?? {};
  return {
    metrics: {
      escrow: normaliseMetric(metrics.escrow, DEFAULT_SETTINGS.metrics.escrow),
      disputes: normaliseMetric(metrics.disputes, DEFAULT_SETTINGS.metrics.disputes),
      jobs: normaliseMetric(metrics.jobs, DEFAULT_SETTINGS.metrics.jobs),
      sla: normaliseMetric(metrics.sla, DEFAULT_SETTINGS.metrics.sla)
    },
    charts: {
      escrow: normaliseChart(charts.escrow, DEFAULT_SETTINGS.charts.escrow)
    },
    insights: normaliseInsights(settings.insights),
    timeline: normaliseTimeline(settings.timeline),
    security: normaliseSecurity(settings.security),
    automation: normaliseAutomation(settings.automation),
    queues: normaliseQueues(settings.queues),
    audit: normaliseAudit(settings.audit)
  };
}

export async function fetchAdminDashboardOverviewSettings({ signal } = {}) {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load overview settings');
  const settings = payload?.settings ?? {};
  return normaliseSettings(settings);
}

export async function persistAdminDashboardOverviewSettings(body) {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to save overview settings');
  const settings = payload?.settings ?? {};
  return normaliseSettings(settings);
}
