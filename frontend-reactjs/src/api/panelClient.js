const API_ROOT = '/api';
const REQUEST_TIMEOUT = 10000;
const CACHE_NAMESPACE = 'fixnado:panel-cache';

const memoryCache = new Map();

class PanelApiError extends Error {
  constructor(message, status, { code, details, cause } = {}) {
    super(message);
    this.name = 'PanelApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.cause = cause;
  }
}

function getStorage() {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch (error) {
    console.warn('[panelClient] sessionStorage unavailable:', error);
    return null;
  }
}

function storageKey(key) {
  return `${CACHE_NAMESPACE}:${key}`;
}

function readStorage(key) {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(storageKey(key));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.expires && parsed.expires < Date.now()) {
      storage.removeItem(storageKey(key));
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn('[panelClient] unable to parse cached payload', error);
    storage.removeItem(storageKey(key));
    return null;
  }
}

function writeStorage(key, data, ttl) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      storageKey(key),
      JSON.stringify({
        data,
        expires: Date.now() + ttl
      })
    );
  } catch (error) {
    console.warn('[panelClient] unable to persist cached payload', error);
  }
}

function clearStorage(key) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(storageKey(key));
}

function mergeAbortSignals(externalSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      externalSignal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener(
        'abort',
        () => externalSignal.removeEventListener('abort', abort),
        { once: true }
      );
    }
  }

  return { controller, timeoutId };
}

function resolveCacheKey(path, method, body) {
  if (!path) return null;
  const base = `${method}:${path}`;
  if (!body) return base;
  try {
    return `${base}:${JSON.stringify(body)}`;
  } catch (error) {
    console.warn('[panelClient] unable to serialise cache key payload', error);
    return base;
  }
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage?.getItem('fixnado:accessToken') ?? null;
  } catch (error) {
    console.warn('[panelClient] unable to read auth token', error);
    return null;
  }
}

async function request(path, {
  method = 'GET',
  body,
  signal,
  cacheKey: explicitCacheKey,
  ttl = 15000,
  headers: customHeaders,
  anonymous = false,
  forceRefresh = false
} = {}) {
  const cacheKey = explicitCacheKey ?? resolveCacheKey(path, method, body);
  const now = Date.now();

  if (cacheKey && !forceRefresh) {
    const cachedEntry = memoryCache.get(cacheKey);
    if (cachedEntry && cachedEntry.expires > now) {
      return { data: cachedEntry.data, meta: { fromCache: true, source: 'memory' } };
    }
  }

  if (cacheKey && !forceRefresh) {
    const persisted = readStorage(cacheKey);
    if (persisted) {
      memoryCache.set(cacheKey, { data: persisted, expires: now + ttl });
      return { data: persisted, meta: { fromCache: true, source: 'storage' } };
    }
  }

  const headers = new Headers(customHeaders ?? {});
  headers.set('Accept', 'application/json');
  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!anonymous) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const { controller, timeoutId } = mergeAbortSignals(signal);

  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
      signal: controller.signal,
      credentials: 'include'
    });

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (error) {
        // ignore JSON parsing failure — keep body as null
      }

      const errorMessage =
        errorBody?.message ||
        errorBody?.error ||
        response.statusText ||
        'Request failed';

      throw new PanelApiError(errorMessage, response.status, {
        code: errorBody?.code,
        details: errorBody?.errors || errorBody?.details,
        cause: errorBody
      });
    }

    if (response.status === 204) {
      return { data: null, meta: { fromCache: false } };
    }

    const payload = await response.json();

    if (cacheKey) {
      const cacheEntry = { data: payload, expires: now + ttl };
      memoryCache.set(cacheKey, cacheEntry);
      writeStorage(cacheKey, payload, ttl);
    }

    return { data: payload, meta: { fromCache: false } };
  } catch (error) {
    if (error instanceof PanelApiError) {
      if (error.status === 401) {
        clearStorage(cacheKey);
        memoryCache.delete(cacheKey);
      }
      throw error;
    }

    if (cacheKey) {
      const fallback = readStorage(cacheKey);
      if (fallback) {
        return { data: fallback, meta: { fromCache: true, source: 'storage', stale: true } };
      }
    }

    if (error.name === 'AbortError') {
      throw new PanelApiError('Request timed out', 408, { cause: error });
    }

    throw new PanelApiError('Network request failed', 503, { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value].filter(Boolean);
}

const percentageFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 1
});

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0
});

function normaliseProviderDashboard(payload = {}) {
  const provider = payload.provider || payload.profile || {};
  const metrics = payload.metrics || {};
  const finances = payload.finances || payload.finance || {};

  return {
    provider: {
      name: provider.legalName || provider.name || 'Provider',
      tradingName: provider.tradingName || provider.displayName || provider.legalName || provider.name,
      region: provider.region || provider.operatingRegion || 'United Kingdom',
      slug: provider.slug || payload.slug || 'provider',
      onboardingStatus: provider.onboardingStatus || 'active',
      supportEmail: provider.supportEmail || provider.contactEmail || payload.contactEmail || null,
      supportPhone: provider.supportPhone || provider.contactPhone || payload.contactPhone || null
    },
    metrics: {
      utilisation: metrics.utilisation ?? metrics.capacityUtilisation ?? 0.74,
      slaHitRate: metrics.slaHitRate ?? metrics.sla ?? 0.96,
      avgResponseMinutes: metrics.avgResponseMinutes ?? metrics.responseMinutes ?? 42,
      activeBookings: metrics.activeBookings ?? metrics.liveBookings ?? 18,
      satisfaction: metrics.customerSatisfaction ?? metrics.csat ?? 0.94
    },
    revenue: {
      monthToDate: finances.monthToDate ?? finances.mtd ?? 48600,
      forecast: finances.forecast ?? 72000,
      outstandingBalance: finances.outstandingBalance ?? finances.pendingPayout ?? 12400,
      nextPayoutDate: finances.nextPayoutDate || finances.nextPayout || null
    },
    alerts: ensureArray(payload.alerts).map((alert, index) => ({
      id: alert.id || `alert-${index}`,
      severity: alert.severity || 'medium',
      message: alert.message || alert.text || 'Operational insight requires review.',
      actionLabel: alert.actionLabel || alert.ctaLabel || null,
      actionHref: alert.actionHref || alert.ctaHref || null
    })),
    pipeline: {
      upcomingBookings: ensureArray(payload.pipeline?.upcomingBookings || payload.upcomingBookings).map((booking, index) => ({
        id: booking.id || `booking-${index}`,
        client: booking.client || booking.customer || 'Client',
        service: booking.service || booking.serviceName || 'Service request',
        eta: booking.eta || booking.scheduledFor || null,
        value: booking.value ?? booking.estimatedValue ?? null,
        zone: booking.zone || booking.location || 'Zone'
      })),
      expiringCompliance: ensureArray(payload.pipeline?.expiringCompliance).map((item, index) => ({
        id: item.id || `compliance-${index}`,
        name: item.name || item.document || 'Compliance document',
        expiresOn: item.expiresOn || item.expiry || null,
        owner: item.owner || item.assignee || 'Operations'
      }))
    },
    servicemen: ensureArray(payload.servicemen || payload.teams).map((member, index) => ({
      id: member.id || `serviceman-${index}`,
      name: member.name || member.displayName || 'Team member',
      role: member.role || member.specialism || 'Engineer',
      availability: member.availability ?? member.utilisation ?? 0.8,
      rating: member.rating ?? member.csat ?? 0.95
    }))
  };
}

function normaliseEnterprisePanel(payload = {}) {
  const enterprise = payload.enterprise || payload.account || {};
  const metrics = payload.metrics || {};
  const spend = payload.spend || payload.finance || {};

  return {
    enterprise: {
      name: enterprise.name || enterprise.legalName || 'Enterprise account',
      sector: enterprise.sector || enterprise.industry || 'Multi-site operations',
      accountManager: enterprise.accountManager || payload.accountManager || null,
      activeSites: enterprise.activeSites ?? enterprise.siteCount ?? 12,
      serviceMix: ensureArray(enterprise.serviceMix || payload.serviceMix)
    },
    delivery: {
      slaCompliance: metrics.slaCompliance ?? metrics.sla ?? 0.94,
      incidents: metrics.openIncidents ?? metrics.incidents ?? 2,
      avgResolutionHours: metrics.avgResolutionHours ?? metrics.resolutionHours ?? 5.5,
      nps: metrics.nps ?? metrics.customerScore ?? 47
    },
    spend: {
      monthToDate: spend.monthToDate ?? spend.mtd ?? 189000,
      budgetPacing: spend.budgetPacing ?? spend.pacing ?? 0.78,
      savingsIdentified: spend.savingsIdentified ?? spend.savings ?? 12400,
      invoicesAwaitingApproval: ensureArray(spend.invoicesAwaitingApproval || payload.invoices).map(
        (invoice, index) => ({
          id: invoice.id || `invoice-${index}`,
          vendor: invoice.vendor || invoice.provider || 'Vendor',
          amount: invoice.amount ?? invoice.total ?? 0,
          dueDate: invoice.dueDate || invoice.due || null,
          status: invoice.status || 'pending'
        })
      )
    },
    programmes: ensureArray(payload.programmes || payload.projects).map((programme, index) => ({
      id: programme.id || `programme-${index}`,
      name: programme.name || programme.title || 'Programme',
      status: programme.status || 'on-track',
      phase: programme.phase || 'Execution',
      health: programme.health || 'on-track',
      lastUpdated: programme.lastUpdated || programme.updatedAt || null
    })),
    escalations: ensureArray(payload.escalations).map((escalation, index) => ({
      id: escalation.id || `escalation-${index}`,
      title: escalation.title || escalation.summary || 'Escalation',
      owner: escalation.owner || escalation.assignee || 'Operations',
      openedAt: escalation.openedAt || escalation.createdAt || null,
      severity: escalation.severity || 'medium'
    }))
  };
}

function normaliseBusinessFront(payload = {}) {
  const profile = payload.profile || payload.provider || {};
  const stats = ensureArray(payload.stats || payload.metrics).map((metric, index) => ({
    id: metric.id || `metric-${index}`,
    label: metric.label || metric.name || 'Metric',
    value: metric.value ?? metric.stat ?? 0,
    format: metric.format || metric.type || 'number',
    caption: metric.caption || metric.description || null
  }));

  return {
    slug: profile.slug || payload.slug || 'featured',
    hero: {
      name: profile.displayName || profile.legalName || profile.name || 'Featured provider',
      strapline:
        payload.strapline ||
        profile.tagline ||
        'Escrow-backed field services, delivered by certified teams across the UK.',
      locations: ensureArray(profile.locations || payload.locations || []).map((location) =>
        typeof location === 'string'
          ? location
          : location.name || `${location.city}, ${location.country}`
      ),
      media: payload.media || profile.media || {}
    },
    testimonials: ensureArray(payload.testimonials).map((testimonial, index) => ({
      id: testimonial.id || `testimonial-${index}`,
      quote: testimonial.quote || testimonial.text || 'Outstanding delivery and communication.',
      client: testimonial.client || testimonial.attribution || 'Client partner',
      role: testimonial.role || testimonial.position || null
    })),
    packages: ensureArray(payload.packages).map((pkg, index) => ({
      id: pkg.id || `package-${index}`,
      name: pkg.name || pkg.title || 'Service package',
      description: pkg.description || pkg.summary || 'Comprehensive field services bundle.',
      price: pkg.price ?? pkg.monthly ?? null,
      currency: pkg.currency || 'GBP',
      highlights: ensureArray(pkg.highlights || pkg.features)
    })),
    certifications: ensureArray(payload.certifications || payload.compliance).map((cert, index) => ({
      id: cert.id || `cert-${index}`,
      name: cert.name || cert.title || 'Certification',
      issuer: cert.issuer || cert.authority || null,
      expiresOn: cert.expiresOn || cert.expiry || null
    })),
    support: {
      email: payload.support?.email || profile.supportEmail || payload.contactEmail || null,
      phone: payload.support?.phone || profile.supportPhone || payload.contactPhone || null,
      concierge: payload.support?.concierge || null
    },
    gallery: ensureArray(payload.gallery || payload.portfolio).map((item, index) => ({
      id: item.id || `gallery-${index}`,
      title: item.title || item.caption || 'Project highlight',
      description: item.description || null,
      image: item.image || item.url || null
    })),
    stats
  };
}

function normaliseAdminDashboard(payload = {}) {
  const timeframe = typeof payload.timeframe === 'string' ? payload.timeframe : '7d';
  const generatedAt = payload.generatedAt ? new Date(payload.generatedAt) : new Date();

  const timeframeOptions = ensureArray(payload.timeframeOptions).map((option) => ({
    value: typeof option?.value === 'string' ? option.value : `${option?.value ?? '7d'}`,
    label: option?.label || `${option?.value ?? '7 days'}`
  }));

  const tiles = ensureArray(payload.metrics?.command?.tiles).map((tile, index) => ({
    id: tile.id || tile.key || `metric-${index}`,
    label: tile.label || tile.name || `Metric ${index + 1}`,
    value: {
      amount: Number.parseFloat(tile.value?.amount ?? tile.valueAmount ?? tile.value ?? 0) || 0,
      currency: tile.value?.currency || tile.currency || null
    },
    valueLabel:
      tile.valueLabel ||
      (typeof tile.value === 'string' ? tile.value : tile.value?.amount != null ? String(tile.value.amount) : '—'),
    delta: tile.delta || tile.deltaLabel || '',
    deltaTone: tile.deltaTone || 'positive',
    caption: tile.caption || '',
    status: tile.status || null
  }));

  const summary = payload.metrics?.command?.summary || {};

  const escrowTrend = ensureArray(payload.charts?.escrowTrend?.buckets).map((bucket, index) => ({
    label: bucket.label || `Bucket ${index + 1}`,
    value: Number.parseFloat(bucket.value ?? bucket.actual ?? 0) || 0,
    target: Number.parseFloat(bucket.target ?? 0) || 0
  }));

  const disputeBreakdown = ensureArray(payload.charts?.disputeBreakdown?.buckets).map((bucket, index) => ({
    label: bucket.label || `Period ${index + 1}`,
    resolved: Number.parseInt(bucket.resolved ?? 0, 10) || 0,
    escalated: Number.parseInt(bucket.escalated ?? 0, 10) || 0
  }));

  const securitySignals = ensureArray(payload.security?.signals).map((signal, index) => ({
    label: signal.label || `Signal ${index + 1}`,
    valueLabel:
      signal.valueLabel ||
      (signal.value != null ? String(signal.value) : signal.percentage != null ? `${signal.percentage}%` : '—'),
    caption: signal.caption || '',
    tone: signal.tone || 'info'
  }));

  const automationBacklog = ensureArray(payload.security?.automationBacklog).map((item, index) => ({
    name: item.name || `Automation ${index + 1}`,
    status: item.status || 'Monitor',
    notes: item.notes || '',
    tone: item.tone || 'info'
  }));

  const queueBoards = ensureArray(payload.queues?.boards).map((board, index) => ({
    id: board.id || `board-${index}`,
    title: board.title || board.name || `Queue ${index + 1}`,
    summary: board.summary || '',
    updates: ensureArray(board.updates),
    owner: board.owner || 'Operations'
  }));

  const complianceControls = ensureArray(payload.queues?.complianceControls).map((control, index) => ({
    id: control.id || `control-${index}`,
    name: control.name || `Control ${index + 1}`,
    detail: control.detail || '',
    due: control.due || 'Due soon',
    owner: control.owner || 'Compliance Ops',
    tone: control.tone || 'info'
  }));

  const auditTimeline = ensureArray(payload.audit?.timeline).map((item, index) => ({
    time: item.time || '--:--',
    event: item.event || `Audit event ${index + 1}`,
    owner: item.owner || 'Operations',
    status: item.status || 'Scheduled'
  }));

  return {
    timeframe,
    timeframeLabel: payload.timeframeLabel || '7 days',
    generatedAt,
    timeframeOptions: timeframeOptions.length ? timeframeOptions : [
      { value: '7d', label: '7 days' },
      { value: '30d', label: '30 days' },
      { value: '90d', label: '90 days' }
    ],
    metrics: {
      command: {
        tiles,
        summary: {
          escrowTotal: Number.parseFloat(summary.escrowTotal ?? summary.escrowTotalAmount ?? 0) || 0,
          escrowTotalLabel: summary.escrowTotalLabel || summary.escrowTotal || '—',
          slaCompliance: Number.parseFloat(summary.slaCompliance ?? 0) || 0,
          slaComplianceLabel: summary.slaComplianceLabel || summary.slaCompliance || '—',
          openDisputes: Number.parseInt(summary.openDisputes ?? 0, 10) || 0,
          openDisputesLabel: summary.openDisputesLabel || `${summary.openDisputes ?? 0}`
        }
      }
    },
    charts: {
      escrowTrend: { buckets: escrowTrend },
      disputeBreakdown: { buckets: disputeBreakdown }
    },
    security: {
      signals: securitySignals,
      automationBacklog
    },
    queues: {
      boards: queueBoards,
      complianceControls
    },
    audit: {
      timeline: auditTimeline
    }
  };
}

const adminFallback = normaliseAdminDashboard({
  timeframe: '7d',
  timeframeLabel: '7 days',
  generatedAt: new Date().toISOString(),
  timeframeOptions: [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' }
  ],
  metrics: {
    command: {
      tiles: [
        {
          id: 'escrow',
          label: 'Escrow under management',
          value: { amount: 18_200_000, currency: 'GBP' },
          valueLabel: '£18.2m',
          delta: '+6.2%',
          deltaTone: 'positive',
          caption: 'Across 1,284 active bookings',
          status: { label: 'Stabilised', tone: 'info' }
        },
        {
          id: 'disputes',
          label: 'Disputes requiring action',
          value: { amount: 12 },
          valueLabel: '12',
          delta: '-2.1%',
          deltaTone: 'positive',
          caption: 'Median response 38 minutes',
          status: { label: 'Managed', tone: 'success' }
        },
        {
          id: 'jobs',
          label: 'Live jobs',
          value: { amount: 1204 },
          valueLabel: '1,204',
          delta: '+3.7%',
          deltaTone: 'positive',
          caption: 'Coverage across 92 zones',
          status: { label: 'Peak period', tone: 'warning' }
        },
        {
          id: 'sla',
          label: 'SLA compliance',
          value: { amount: 98.2 },
          valueLabel: '98.2%',
          delta: '+1.2%',
          deltaTone: 'positive',
          caption: 'Goal ≥ 97%',
          status: { label: 'On target', tone: 'success' }
        }
      ],
      summary: {
        escrowTotal: 18_200_000,
        escrowTotalLabel: '£18.2m',
        slaCompliance: 98.2,
        slaComplianceLabel: '98.2%',
        openDisputes: 12,
        openDisputesLabel: '12'
      }
    }
  },
  charts: {
    escrowTrend: {
      buckets: [
        { label: 'Mon', value: 17.6, target: 16.5 },
        { label: 'Tue', value: 17.9, target: 16.7 },
        { label: 'Wed', value: 18.1, target: 16.9 },
        { label: 'Thu', value: 18.4, target: 17.1 },
        { label: 'Fri', value: 18.7, target: 17.2 },
        { label: 'Sat', value: 18.5, target: 17.1 },
        { label: 'Sun', value: 18.2, target: 17.0 }
      ]
    },
    disputeBreakdown: {
      buckets: [
        { label: 'Mon', resolved: 52, escalated: 6 },
        { label: 'Tue', resolved: 48, escalated: 7 },
        { label: 'Wed', resolved: 50, escalated: 5 },
        { label: 'Thu', resolved: 46, escalated: 5 },
        { label: 'Fri', resolved: 58, escalated: 4 },
        { label: 'Sat', resolved: 49, escalated: 6 },
        { label: 'Sun', resolved: 43, escalated: 3 }
      ]
    }
  },
  security: {
    signals: [
      { label: 'MFA adoption', valueLabel: '96.4%', caption: 'Enterprise + provider portals', tone: 'success' },
      { label: 'Critical alerts', valueLabel: '0', caption: 'Security Operations Center overnight review', tone: 'success' },
      { label: 'Audit log ingestion', valueLabel: '100%', caption: '24h ingestion completeness from Splunk', tone: 'info' }
    ],
    automationBacklog: [
      {
        name: 'Escrow ledger reconciliation',
        status: 'Ready for QA',
        notes: 'Extends double-entry validation to rental deposits; requires finance sign-off.',
        tone: 'success'
      },
      {
        name: 'Compliance webhook retries',
        status: 'In build',
        notes: 'Retries failed submissions to insurance partners with exponential backoff.',
        tone: 'info'
      },
      {
        name: 'Dispute document summarisation',
        status: 'Discovery',
        notes: 'Pilot with AI summarisation flagged for accuracy review before production rollout.',
        tone: 'warning'
      }
    ]
  },
  queues: {
    boards: [
      {
        id: 1,
        title: 'Provider verification queue',
        summary:
          'Identity verifications, insurance checks, and DBS renewals are grouped into a single command queue with automation fallbacks.',
        updates: [
          '4 documents awaiting manual agent review after OCR warnings.',
          'Average handling time 1.2h (target ≤ 1.5h).',
          'Auto-reminders triggered for 12 providers via email + SMS.'
        ],
        owner: 'Compliance Ops'
      },
      {
        id: 2,
        title: 'Dispute resolution board',
        summary: 'High-risk disputes flagged for legal oversight with evidence packs collated via secure storage.',
        updates: [
          '3 disputes escalated to Stage 2 review.',
          'AI summarisation enabled for transcripts; manual review still required for regulated industries.',
          'Median time-to-resolution: 19 hours (goal 24 hours).'
        ],
        owner: 'Support & Legal'
      }
    ],
    complianceControls: [
      {
        id: 1,
        name: 'Provider KYC refresh',
        detail: '8 providers triggered by expiring IDs; automated reminders dispatched with secure upload links.',
        due: 'Due today',
        owner: 'Compliance Ops',
        tone: 'warning'
      },
      {
        id: 2,
        name: 'Insurance certificate review',
        detail: 'Three enterprise clients require renewed liability certificates before next milestone.',
        due: 'Due in 2 days',
        owner: 'Risk & Legal',
        tone: 'info'
      },
      {
        id: 3,
        name: 'GDPR DSAR queue',
        detail: 'Two data export requests awaiting legal approval; SLA 72 hours.',
        due: 'Due in 18 hours',
        owner: 'Privacy Office',
        tone: 'danger'
      }
    ]
  },
  audit: {
    timeline: [
      { time: '08:30', event: 'GDPR DSAR pack exported', owner: 'Legal', status: 'Completed' },
      { time: '09:45', event: 'Escrow reconciliation (daily)', owner: 'Finance Ops', status: 'In progress' },
      { time: '11:00', event: 'Provider onboarding review', owner: 'Compliance Ops', status: 'Scheduled' },
      { time: '14:30', event: 'Pen-test retest results review', owner: 'Security', status: 'Scheduled' }
    ]
  }
});

const providerFallback = normaliseProviderDashboard({
  provider: {
    legalName: 'Metro Power Services',
    tradingName: 'Metro Power Services',
    region: 'London & South East',
    slug: 'metro-power-services',
    supportEmail: 'ops@metropower.example',
    supportPhone: '+44 20 7946 0010'
  },
  metrics: {
    utilisation: 0.82,
    slaHitRate: 0.98,
    avgResponseMinutes: 38,
    activeBookings: 21,
    customerSatisfaction: 0.97
  },
  finances: {
    monthToDate: 54600,
    forecast: 81200,
    outstandingBalance: 9600,
    nextPayoutDate: new Date().toISOString().slice(0, 10)
  },
  alerts: [
    {
      severity: 'high',
      message: 'Lift modernisation at Riverside Campus requires compliance evidence upload.',
      actionLabel: 'Upload documents',
      actionHref: '/providers/metro-power-services/compliance'
    }
  ],
  pipeline: {
    upcomingBookings: [
      {
        client: 'Finova HQ',
        service: 'Critical power maintenance',
        eta: new Date(Date.now() + 86400000).toISOString(),
        value: 8600,
        zone: 'City of London'
      },
      {
        client: 'Northbank Serviced Offices',
        service: 'HVAC emergency call-out',
        eta: new Date(Date.now() + 172800000).toISOString(),
        value: 2400,
        zone: 'Westminster'
      }
    ],
    expiringCompliance: [
      {
        name: 'F-Gas certification',
        expiresOn: new Date(Date.now() + 1209600000).toISOString(),
        owner: 'Compliance team'
      }
    ]
  },
  servicemen: [
    { name: 'Amina Khan', role: 'Lead Electrical Engineer', availability: 0.68, rating: 0.99 },
    { name: 'Owen Davies', role: 'HVAC Specialist', availability: 0.54, rating: 0.94 },
    { name: 'Sophie Chen', role: 'Compliance Coordinator', availability: 0.87, rating: 0.92 }
  ]
});

const enterpriseFallback = normaliseEnterprisePanel({
  enterprise: {
    name: 'Albion Workspace Group',
    sector: 'Corporate real estate',
    accountManager: 'Danielle Rivers',
    activeSites: 48,
    serviceMix: ['Electrical', 'HVAC', 'Smart IoT']
  },
  metrics: {
    slaCompliance: 0.95,
    incidents: 3,
    avgResolutionHours: 4.2,
    nps: 51
  },
  spend: {
    monthToDate: 212400,
    budgetPacing: 0.74,
    savingsIdentified: 18600,
    invoicesAwaitingApproval: [
      {
        vendor: 'Metro Power Services',
        amount: 18400,
        dueDate: new Date(Date.now() + 604800000).toISOString(),
        status: 'pending'
      },
      {
        vendor: 'Skyline Elevation',
        amount: 9600,
        dueDate: new Date(Date.now() + 1209600000).toISOString(),
        status: 'pending'
      }
    ]
  },
  programmes: [
    {
      name: 'Data centre UPS refresh',
      status: 'on-track',
      phase: 'Execution',
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'Smart sensor rollout',
      status: 'at-risk',
      phase: 'Deployment',
      lastUpdated: new Date().toISOString()
    }
  ],
  escalations: [
    {
      title: 'Canary Wharf chilled water incident',
      owner: 'Incident response',
      openedAt: new Date(Date.now() - 86400000).toISOString(),
      severity: 'high'
    }
  ]
});

const businessFrontFallback = normaliseBusinessFront({
  slug: 'metro-power-services',
  profile: {
    displayName: 'Metro Power Services',
    tagline: 'Critical electrical & HVAC support for corporate campuses',
    locations: ['London', 'Essex', 'Kent']
  },
  stats: [
    { label: 'SLA hit rate', value: 0.98, format: 'percent', caption: 'Tracked weekly with telemetry exports' },
    { label: 'Avg. response', value: 38, format: 'minutes', caption: 'Engineer dispatch, Q3 rolling' },
    { label: 'Projects delivered', value: 164, format: 'number', caption: 'Enterprise programmes completed' }
  ],
  testimonials: [
    {
      quote: 'Metro Power keeps our trading floors online. Their proactive comms and telemetry are best-in-class.',
      client: 'Finova Facilities Director'
    }
  ],
  packages: [
    {
      name: 'Critical response retainer',
      description: '24/7 dispatch with under-45 minute arrival SLA, telemetry reporting, and quarterly compliance reviews.',
      price: 5400,
      highlights: ['45-minute urban SLA', 'Escrow-backed milestone billing', 'Telemetry dashboard access']
    },
    {
      name: 'Sustainable retrofit programme',
      description: 'Energy optimisation with IoT sensor network, HVAC upgrades, and capital project governance.',
      price: 12400,
      highlights: ['IoT monitoring stack', 'Dedicated programme manager', 'Regulatory submission support']
    }
  ],
  certifications: [
    { name: 'NICEIC Approved Contractor', issuer: 'NICEIC', expiresOn: new Date(Date.now() + 2505600000).toISOString() },
    { name: 'F-Gas Category 1', issuer: 'City & Guilds', expiresOn: new Date(Date.now() + 31536000000).toISOString() }
  ],
  support: {
    email: 'hello@metropower.example',
    phone: '+44 20 7946 0010',
    concierge: 'Dedicated enterprise operations manager'
  },
  gallery: [
    {
      title: 'Canary Wharf energy retrofit',
      description: 'HVAC and BMS upgrade reducing energy consumption by 18% across 14 floors.',
      image: '/media/metro-power/case-study-canary-wharf.jpg'
    },
    {
      title: 'Finova trading floor resilience',
      description: 'Critical electrical resiliency project delivering Tier 3 redundancy.',
      image: '/media/metro-power/case-study-finova.jpg'
    }
  ]
});

function withFallback(normaliser, fallback, fetcherFactory) {
  return async function handler(options = {}) {
    try {
      const { data, meta } = await fetcherFactory(options);
      const normalised = normaliser(data);
      if (meta.fromCache && meta.stale) {
        return { data: normalised, meta: { ...meta, fallback: true } };
      }
      return { data: normalised, meta };
    } catch (error) {
      if (error instanceof PanelApiError) {
        console.warn('[panelClient] falling back to cached payload', error);
      } else {
        console.error('[panelClient] unexpected error', error);
      }
      return {
        data: fallback,
        meta: {
          fromCache: true,
          source: 'fallback',
          fallback: true,
          error: error instanceof PanelApiError
            ? { message: error.message, status: error.status, code: error.code, details: error.details }
            : { message: 'Unexpected panel client failure' }
        }
      };
    }
  };
}

export const getAdminDashboard = withFallback(
  normaliseAdminDashboard,
  adminFallback,
  (options = {}) =>
    request(`/admin/dashboard?timeframe=${encodeURIComponent(options?.timeframe ?? '7d')}`, {
      cacheKey: `admin-dashboard:${options?.timeframe ?? '7d'}`,
      ttl: 20000,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    })
);

export const getProviderDashboard = withFallback(
  normaliseProviderDashboard,
  providerFallback,
  (options = {}) =>
    request('/panel/provider/dashboard', {
      cacheKey: 'provider-dashboard',
      ttl: 30000,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    })
);

export const getEnterprisePanel = withFallback(
  normaliseEnterprisePanel,
  enterpriseFallback,
  (options = {}) =>
    request('/panel/enterprise/overview', {
      cacheKey: 'enterprise-panel',
      ttl: 30000,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    })
);

const businessFrontFetcher = withFallback(
  normaliseBusinessFront,
  businessFrontFallback,
  (options = {}) =>
    request(`/business-fronts/${encodeURIComponent(options?.slug ?? 'featured')}`, {
      cacheKey: `business-front:${options?.slug ?? 'featured'}`,
      ttl: 60000,
      anonymous: true,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    })
);

export function getBusinessFront(slug = 'featured', options = {}) {
  return businessFrontFetcher({ ...options, slug });
}

export function clearPanelCache(keys) {
  if (!keys) {
    memoryCache.clear();
    return;
  }

  ensureArray(keys).forEach((key) => {
    memoryCache.delete(key);
    clearStorage(key);
  });
}

export { PanelApiError };

export const formatters = {
  percentage: (value) => percentageFormatter.format(value),
  currency: (value) => currencyFormatter.format(value),
  number: (value) => numberFormatter.format(value)
};

