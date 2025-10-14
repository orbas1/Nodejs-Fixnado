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

function toQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
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
      } catch {
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

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  const root = payload?.data ?? payload;
  const provider = root.provider || root.profile || {};
  const metrics = root.metrics || {};
  const finances = root.finances || root.finance || {};

  return {
    provider: {
      name: provider.legalName || provider.name || 'Provider',
      tradingName: provider.tradingName || provider.displayName || provider.legalName || provider.name,
      region: provider.region || provider.operatingRegion || 'United Kingdom',
      slug: provider.slug || root.slug || 'provider',
      onboardingStatus: provider.onboardingStatus || 'active',
      supportEmail: provider.supportEmail || provider.contactEmail || root.contactEmail || null,
      supportPhone: provider.supportPhone || provider.contactPhone || root.contactPhone || null
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
    alerts: ensureArray(root.alerts).map((alert, index) => ({
      id: alert.id || `alert-${index}`,
      severity: alert.severity || 'medium',
      message: alert.message || alert.text || 'Operational insight requires review.',
      actionLabel: alert.actionLabel || alert.ctaLabel || null,
      actionHref: alert.actionHref || alert.ctaHref || null
    })),
    pipeline: {
      upcomingBookings: ensureArray(root.pipeline?.upcomingBookings || root.upcomingBookings).map((booking, index) => ({
        id: booking.id || `booking-${index}`,
        client: booking.client || booking.customer || 'Client',
        service: booking.service || booking.serviceName || 'Service request',
        eta: booking.eta || booking.scheduledFor || null,
        value: booking.value ?? booking.estimatedValue ?? null,
        zone: booking.zone || booking.location || 'Zone'
      })),
      expiringCompliance: ensureArray(root.pipeline?.expiringCompliance).map((item, index) => ({
        id: item.id || `compliance-${index}`,
        name: item.name || item.document || 'Compliance document',
        expiresOn: item.expiresOn || item.expiry || null,
        owner: item.owner || item.assignee || 'Operations'
      }))
    },
    servicemen: ensureArray(root.servicemen || root.teams).map((member, index) => ({
      id: member.id || `serviceman-${index}`,
      name: member.name || member.displayName || 'Team member',
      role: member.role || member.specialism || 'Engineer',
      availability: member.availability ?? member.utilisation ?? 0.8,
      rating: member.rating ?? member.csat ?? 0.95
    }))
  };
}

function resolveListingTone(status) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending_review':
      return 'warning';
    case 'rejected':
    case 'suspended':
      return 'danger';
    default:
      return 'info';
  }
}

function normaliseProviderStorefront(payload = {}) {
  const root = payload?.data ?? payload;
  const storefront = root.storefront || {};
  const company = storefront.company || {};
  const metrics = storefront.metrics || {};
  const health = storefront.health || {};

  const listings = ensureArray(root.listings).map((listing, index) => {
    const tone = resolveListingTone(listing.status);
    return {
      id: listing.id || `storefront-listing-${index}`,
      title: listing.title || 'Marketplace listing',
      status: listing.status || 'draft',
      tone,
      availability: listing.availability || 'rent',
      pricePerDay: listing.pricePerDay != null ? Number(listing.pricePerDay) : null,
      purchasePrice: listing.purchasePrice != null ? Number(listing.purchasePrice) : null,
      location: listing.location || 'Unknown location',
      insuredOnly: Boolean(listing.insuredOnly),
      complianceHoldUntil: listing.complianceHoldUntil || null,
      lastReviewedAt: listing.lastReviewedAt || null,
      moderationNotes: listing.moderationNotes || null,
      requestVolume: listing.requestVolume ?? 0,
      activeAgreements: listing.activeAgreements ?? 0,
      successfulAgreements: listing.successfulAgreements ?? listing.conversions ?? 0,
      projectedRevenue: listing.projectedRevenue != null ? Number(listing.projectedRevenue) : null,
      averageDurationDays: listing.averageDurationDays ?? 0,
      recommendedActions: ensureArray(listing.recommendedActions).map((action, actionIndex) => ({
        id: action.id || `listing-${index}-action-${actionIndex}`,
        label: action.label || action.description || 'Review next best action.',
        tone: action.tone || tone
      })),
      agreements: ensureArray(listing.agreements).map((agreement, agreementIndex) => ({
        id: agreement.id || `listing-${index}-agreement-${agreementIndex}`,
        status: agreement.status || 'requested',
        renter: agreement.renter || agreement.customer || null,
        pickupAt: agreement.pickupAt || agreement.rentalStartAt || null,
        returnDueAt: agreement.returnDueAt || agreement.rentalEndAt || null,
        lastStatusTransitionAt: agreement.lastStatusTransitionAt || null,
        depositStatus: agreement.depositStatus || null,
        dailyRate: agreement.dailyRate != null ? Number(agreement.dailyRate) : null,
        meta: agreement.meta || {}
      }))
    };
  });

  const playbooks = ensureArray(root.playbooks).map((playbook, index) => ({
    id: playbook.id || `playbook-${index}`,
    title: playbook.title || 'Operational playbook',
    detail: playbook.detail || playbook.description || 'Prioritise this workflow to unlock marketplace growth.',
    tone: playbook.tone || 'info'
  }));

  const timeline = ensureArray(root.timeline).map((event, index) => ({
    id: event.id || `timeline-${index}`,
    timestamp: event.timestamp || event.createdAt || new Date().toISOString(),
    type: event.type || event.action || 'update',
    listingId: event.listingId || null,
    listingTitle: event.listingTitle || event.listing || 'Listing',
    actor: event.actor || event.user || null,
    tone: event.tone || resolveListingTone(event.metadata?.status || event.type),
    detail: event.detail || event.description || 'Activity logged with marketplace operations.',
    metadata: event.metadata || {}
  }));

  return {
    storefront: {
      company: {
        id: company.id || 'company',
        name: company.name || 'Provider storefront',
        complianceScore: company.complianceScore != null ? Number(company.complianceScore) : 0,
        insuredSellerStatus: company.insuredSellerStatus || 'approved',
        insuredSellerExpiresAt: company.insuredSellerExpiresAt || null,
        badgeVisible: Boolean(company.badgeVisible ?? company.insuredSellerBadgeVisible),
        applicationId: company.applicationId || company.application_id || null
      },
      metrics: {
        activeListings: metrics.activeListings ?? metrics.active ?? listings.filter((item) => item.status === 'approved').length,
        pendingReview: metrics.pendingReview ?? metrics.pending ?? 0,
        flagged: metrics.flagged ?? metrics.suspended ?? 0,
        insuredOnly: metrics.insuredOnly ?? metrics.insured ?? 0,
        holdExpiring: metrics.holdExpiring ?? metrics.expiring ?? 0,
        avgDailyRate: metrics.avgDailyRate != null ? Number(metrics.avgDailyRate) : null,
        conversionRate: metrics.conversionRate != null ? Number(metrics.conversionRate) : 0,
        totalRequests: metrics.totalRequests ?? metrics.requests ?? 0,
        totalRevenue: metrics.totalRevenue != null ? Number(metrics.totalRevenue) : 0
      },
      health: {
        badgeVisible: Boolean(health.badgeVisible ?? company.badgeVisible),
        complianceScore: health.complianceScore != null ? Number(health.complianceScore) : Number(company.complianceScore || 0),
        expiresAt: health.expiresAt || company.insuredSellerExpiresAt || null,
        pendingReviewCount: health.pendingReviewCount ?? metrics.pendingReview ?? 0,
        flaggedCount: health.flaggedCount ?? metrics.flagged ?? 0,
        holdExpiringCount: health.holdExpiringCount ?? metrics.holdExpiring ?? 0
      }
    },
    listings,
    playbooks,
    timeline
  };
}

function normaliseEnterprisePanel(payload = {}) {
  const root = payload?.data ?? payload;
  const enterprise = root.enterprise || root.account || {};
  const metrics = root.metrics || {};
  const spend = root.spend || root.finance || {};

  return {
    enterprise: {
      name: enterprise.name || enterprise.legalName || 'Enterprise account',
      sector: enterprise.sector || enterprise.industry || 'Multi-site operations',
      accountManager: enterprise.accountManager || root.accountManager || null,
      activeSites: enterprise.activeSites ?? enterprise.siteCount ?? 12,
      serviceMix: ensureArray(enterprise.serviceMix || root.serviceMix)
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
      invoicesAwaitingApproval: ensureArray(spend.invoicesAwaitingApproval || root.invoices).map(
        (invoice, index) => ({
          id: invoice.id || `invoice-${index}`,
          vendor: invoice.vendor || invoice.provider || 'Vendor',
          amount: invoice.amount ?? invoice.total ?? 0,
          dueDate: invoice.dueDate || invoice.due || null,
          status: invoice.status || 'pending'
        })
      )
    },
    programmes: ensureArray(root.programmes || root.projects).map((programme, index) => ({
      id: programme.id || `programme-${index}`,
      name: programme.name || programme.title || 'Programme',
      status: programme.status || 'on-track',
      phase: programme.phase || 'Execution',
      health: programme.health || 'on-track',
      lastUpdated: programme.lastUpdated || programme.updatedAt || null
    })),
    escalations: ensureArray(root.escalations).map((escalation, index) => ({
      id: escalation.id || `escalation-${index}`,
      title: escalation.title || escalation.summary || 'Escalation',
      owner: escalation.owner || escalation.assignee || 'Operations',
      openedAt: escalation.openedAt || escalation.createdAt || null,
      severity: escalation.severity || 'medium'
    }))
  };
}

function normaliseBusinessFront(payload = {}) {
  const root = payload?.data ?? payload;
  const profile = root.profile || root.provider || {};
  const normaliseScore = (input, fallbackValue) => {
    if (input == null && fallbackValue == null) {
      return null;
    }

    const source = input && typeof input === 'object' ? input : {};
    const resolvedValue = Number.parseFloat(source.value ?? fallbackValue);
    if (!Number.isFinite(resolvedValue)) {
      return null;
    }

    const sampleRaw = source.sampleSize ?? source.sample ?? source.count;
    const sampleSize = Number.isFinite(Number.parseInt(sampleRaw, 10)) ? Number.parseInt(sampleRaw, 10) : null;

    return {
      value: Number(resolvedValue.toFixed(source.precision ?? (resolvedValue % 1 === 0 ? 0 : 2))),
      band: source.band || source.tier || null,
      confidence: source.confidence || null,
      sampleSize,
      caption: source.caption || null,
      breakdown: source.breakdown && typeof source.breakdown === 'object' ? { ...source.breakdown } : null,
      distribution: source.distribution && typeof source.distribution === 'object' ? { ...source.distribution } : null,
      updatedAt: source.updatedAt || source.calculatedAt || source.generatedAt || null
    };
  };

  const stats = ensureArray(root.stats || root.metrics).map((metric, index) => ({
    id: metric.id || `metric-${index}`,
    label: metric.label || metric.name || 'Metric',
    value: metric.value ?? metric.stat ?? 0,
    format: metric.format || metric.type || 'number',
    caption: metric.caption || metric.description || null
  }));

  const heroMedia = root.hero?.media || root.media || {};
  const carouselMedia = ensureArray(heroMedia.carousel || root.carousel).map((item, index) => ({
    id: item.id || `carousel-${index}`,
    title: item.title || item.name || `Showcase ${index + 1}`,
    description: item.description || '',
    image: item.image || item.url || null
  }));

  const taxonomy = {
    categories: ensureArray(root.taxonomy?.categories).map((category, index) => ({
      slug: category.slug || category.id || `category-${index}`,
      label: category.label || category.name || 'Service category',
      type: category.type || 'general-services',
      defaultTags: ensureArray(category.defaultTags)
    })),
    types: ensureArray(root.taxonomy?.types).map((entry, index) => ({
      type: entry.type || entry.id || `type-${index}`,
      label: entry.label || entry.name || 'Service type',
      description: entry.description || '',
      categories: ensureArray(entry.categories)
    }))
  };

  const serviceCatalogue = ensureArray(root.serviceCatalogue || root.services).map((service, index) => ({
    id: service.id || `catalogue-${index}`,
    name: service.name || service.title || 'Service',
    description: service.description || '',
    category: service.category || service.categoryLabel || 'General services',
    type: service.type || service.typeLabel || 'General services',
    price: service.price ?? null,
    currency: service.currency || 'GBP',
    availability: service.availability
      ? {
          status: service.availability.status || 'open',
          label: service.availability.label || 'Availability',
          detail: service.availability.detail || ''
        }
      : {
          status: 'open',
          label: 'Availability',
          detail: ''
        },
    tags: ensureArray(service.tags),
    coverage: ensureArray(service.coverage),
    provider: service.provider || null,
    providerId: service.providerId || null
  }));

  const previousJobs = ensureArray(root.previousJobs || root.jobs).map((job, index) => ({
    id: job.id || `job-${index}`,
    title: job.title || job.name || `Project ${index + 1}`,
    description: job.description || '',
    completedOn: job.completedOn || job.completed_at || job.date || null,
    zone: job.zone || job.location || null,
    value: job.value ?? null,
    currency: job.currency || 'GBP',
    image: job.image || job.thumbnail || null
  }));

  const reviews = ensureArray(root.reviews).map((review, index) => ({
    id: review.id || `review-${index}`,
    reviewer: review.reviewer || review.client || 'Client partner',
    rating: Number.isFinite(Number.parseFloat(review.rating ?? review.score))
      ? Number.parseFloat(review.rating ?? review.score)
      : 0,
    comment: review.comment || review.quote || '',
    job: review.job || review.project || null,
    submittedAt: review.submittedAt || review.createdAt || review.updatedAt || null,
    verified: review.verified !== false,
    response: review.response || review.reply || null,
    responseTimeMinutes: Number.isFinite(Number(review.responseTimeMinutes))
      ? Number(review.responseTimeMinutes)
      : null,
    visibility: review.visibility || 'public'
  }));

  const reviewSummaryRaw = root.reviewSummary || {};
  const reviewSummary = {
    averageRating: Number.isFinite(Number(reviewSummaryRaw.averageRating))
      ? Number(reviewSummaryRaw.averageRating)
      : (reviews.length ? reviews.reduce((total, entry) => total + (entry.rating ?? 0), 0) / reviews.length : null),
    totalReviews: Number.isFinite(Number(reviewSummaryRaw.totalReviews))
      ? Number(reviewSummaryRaw.totalReviews)
      : reviews.length,
    verifiedShare: Number.isFinite(Number(reviewSummaryRaw.verifiedShare))
      ? Number(reviewSummaryRaw.verifiedShare)
      : (reviews.length ? reviews.filter((review) => review.verified).length / reviews.length : 0),
    ratingBuckets: ensureArray(reviewSummaryRaw.ratingBuckets).length
      ? ensureArray(reviewSummaryRaw.ratingBuckets).map((bucket, index) => ({
          score: Number.isFinite(Number(bucket.score)) ? Number(bucket.score) : index + 1,
          count: Number.isFinite(Number(bucket.count)) ? Number(bucket.count) : 0
        }))
      : [1, 2, 3, 4, 5].map((score) => ({
          score,
          count: reviews.filter((review) => Math.round(review.rating ?? 0) === score).length
        })),
    lastReviewAt: reviewSummaryRaw.lastReviewAt || null,
    responseRate: Number.isFinite(Number(reviewSummaryRaw.responseRate))
      ? Number(reviewSummaryRaw.responseRate)
      : (reviews.length
          ? reviews.filter((review) => Number.isFinite(review.responseTimeMinutes)).length / reviews.length
          : 0),
    highlightedReviewId: reviewSummaryRaw.highlightedReviewId || reviews[0]?.id || null,
    latestReviewId: reviewSummaryRaw.latestReviewId || reviews.find((review) => review.submittedAt)?.id || null,
    excerpt: reviewSummaryRaw.excerpt || (reviews[0]?.comment ? `${reviews[0].comment.slice(0, 200)}${reviews[0].comment.length > 200 ? '…' : ''}` : null)
  };
    createdAt: review.createdAt || review.created_at || null
  }));

  const rawScores = root.scores || {};
  const trustScore = normaliseScore(rawScores.trust, root.trustScore ?? root.trust?.value);
  const reviewScore = normaliseScore(rawScores.review, root.reviewScore ?? root.review?.value ?? root.rating ?? root.score);

  const deals = ensureArray(root.deals).map((deal, index) => ({
    id: deal.id || `deal-${index}`,
    title: deal.title || `Deal ${index + 1}`,
    description: deal.description || '',
    savings: deal.savings ?? null,
    currency: deal.currency || 'GBP',
    validUntil: deal.validUntil || deal.expiresOn || null,
    tags: ensureArray(deal.tags)
  }));

  const materials = ensureArray(root.materials).map((item, index) => ({
    id: item.id || `material-${index}`,
    name: item.name || `Material ${index + 1}`,
    category: item.category || 'Materials',
    sku: item.sku || null,
    quantityOnHand: toNullableNumber(item.quantityOnHand),
    quantityReserved: toNullableNumber(item.quantityReserved),
    availability: toNullableNumber(item.availability ?? item.quantityOnHand),
    safetyStock: toNullableNumber(item.safetyStock),
    unitType: item.unitType || null,
    status: item.status || 'healthy',
    condition: item.condition || item.conditionRating || null,
    location: item.location || null,
    nextMaintenanceDue: item.nextMaintenanceDue || null,
    notes: item.notes || null,
    activeAlerts: toNumber(item.activeAlerts, 0),
    alertSeverity: item.alertSeverity || null,
    activeRentals: toNumber(item.activeRentals, 0),
    image: item.image || null
  }));

  const tools = ensureArray(root.tools).map((item, index) => ({
    id: item.id || `tool-${index}`,
    name: item.name || `Tool ${index + 1}`,
    category: item.category || 'Tools',
    sku: item.sku || null,
    quantityOnHand: toNullableNumber(item.quantityOnHand),
    quantityReserved: toNullableNumber(item.quantityReserved),
    availability: toNullableNumber(item.availability ?? item.quantityOnHand),
    safetyStock: toNullableNumber(item.safetyStock),
    unitType: item.unitType || null,
    status: item.status || 'healthy',
    condition: item.condition || item.conditionRating || null,
    location: item.location || null,
    nextMaintenanceDue: item.nextMaintenanceDue || null,
    notes: item.notes || null,
    activeAlerts: toNumber(item.activeAlerts, 0),
    alertSeverity: item.alertSeverity || null,
    activeRentals: toNumber(item.activeRentals, 0),
    rentalRate: toNullableNumber(item.rentalRate),
    rentalRateCurrency: item.rentalRateCurrency || item.currency || 'GBP',
    depositAmount: toNullableNumber(item.depositAmount),
    depositCurrency: item.depositCurrency || item.rentalRateCurrency || item.currency || 'GBP',
    image: item.image || null
  }));

  const servicemen = ensureArray(root.servicemen || root.servicers).map((member, index) => ({
    id: member.id || `serviceman-${index}`,
    name: member.name || member.fullName || `Serviceman ${index + 1}`,
    trades: ensureArray(member.trades || member.skills),
    availability: member.availability || 'Available',
    avatar: member.avatar || member.image || null
  }));

  const serviceZones = ensureArray(root.serviceZones || root.zones).map((zone, index) => ({
    id: zone.id || `zone-${index}`,
    name: zone.name || `Zone ${index + 1}`,
    demandLevel: zone.demandLevel || zone.demand || 'medium',
    metadata: zone.metadata || {}
  }));

  return {
    slug: profile.slug || root.slug || 'featured',
    hero: {
      name: profile.displayName || profile.legalName || profile.name || 'Featured provider',
      strapline:
        root.strapline ||
        profile.tagline ||
        'Escrow-backed field services, delivered by certified teams across the UK.',
      tagline: root.hero?.tagline || profile.tagline || null,
      bio: root.hero?.bio || root.bio || profile.bio || null,
      locations: ensureArray(profile.locations || root.locations || []).map((location) =>
        typeof location === 'string'
          ? location
          : location.name || `${location.city}, ${location.country}`
      ),
      tags: ensureArray(root.hero?.tags || root.tags),
      categories: ensureArray(root.hero?.categories || root.serviceCategories),
      media: {
        ...(heroMedia || {}),
        heroImage: heroMedia.heroImage || root.media?.heroImage || null,
        bannerImage: heroMedia.bannerImage || null,
        brandImage: heroMedia.brandImage || null,
        profileImage: heroMedia.profileImage || null,
        showcaseVideo: heroMedia.showcaseVideo || heroMedia.video || null,
        carousel: carouselMedia
      }
    },
    testimonials: ensureArray(root.testimonials).map((testimonial, index) => ({
      id: testimonial.id || `testimonial-${index}`,
      quote: testimonial.quote || testimonial.text || 'Outstanding delivery and communication.',
      client: testimonial.client || testimonial.attribution || 'Client partner',
      role: testimonial.role || testimonial.position || null
    })),
    packages: ensureArray(root.packages).map((pkg, index) => ({
      id: pkg.id || `package-${index}`,
      name: pkg.name || pkg.title || 'Service package',
      description: pkg.description || pkg.summary || 'Comprehensive field services bundle.',
      price: pkg.price ?? pkg.monthly ?? null,
      currency: pkg.currency || 'GBP',
      highlights: ensureArray(pkg.highlights || pkg.features)
    })),
    certifications: ensureArray(root.certifications || root.compliance).map((cert, index) => ({
      id: cert.id || `cert-${index}`,
      name: cert.name || cert.title || 'Certification',
      issuer: cert.issuer || cert.authority || null,
      expiresOn: cert.expiresOn || cert.expiry || null
    })),
    support: {
      email: root.support?.email || profile.supportEmail || root.contactEmail || null,
      phone: root.support?.phone || profile.supportPhone || root.contactPhone || null,
      concierge: root.support?.concierge || null
    },
    gallery: ensureArray(root.gallery || root.portfolio).map((item, index) => ({
      id: item.id || `gallery-${index}`,
      title: item.title || item.caption || 'Project highlight',
      description: item.description || null,
      image: item.image || item.url || null
    })),
    stats,
    serviceCatalogue,
    previousJobs,
    reviews,
    reviewSummary,
    deals,
    materials,
    tools,
    inventorySummary: (() => {
      const raw = {
        skuCount: toNullableNumber(root.inventorySummary?.skuCount),
        onHand: toNullableNumber(root.inventorySummary?.onHand),
        reserved: toNullableNumber(root.inventorySummary?.reserved),
        available: toNullableNumber(root.inventorySummary?.available),
        alerts: toNullableNumber(root.inventorySummary?.alerts)
      };
      const fallbackOnHand =
        materials.reduce((sum, item) => sum + toNumber(item.quantityOnHand, 0), 0) +
        tools.reduce((sum, item) => sum + toNumber(item.quantityOnHand, 0), 0);
      const fallbackReserved =
        materials.reduce((sum, item) => sum + toNumber(item.quantityReserved, 0), 0) +
        tools.reduce((sum, item) => sum + toNumber(item.quantityReserved, 0), 0);
      const fallbackAvailable =
        materials.reduce((sum, item) => sum + toNumber(item.availability, 0), 0) +
        tools.reduce((sum, item) => sum + toNumber(item.availability, 0), 0);
      const fallbackAlerts =
        materials.filter((item) => item.status !== 'healthy').length +
        tools.filter((item) => item.status !== 'healthy').length;

      return {
        skuCount: raw.skuCount ?? materials.length + tools.length,
        onHand: raw.onHand ?? fallbackOnHand,
        reserved: raw.reserved ?? fallbackReserved,
        available: raw.available ?? fallbackAvailable,
        alerts: raw.alerts ?? fallbackAlerts
      };
    })(),
    servicemen,
    serviceZones,
    scores: {
      trust: trustScore,
      review: reviewScore
    },
    taxonomy
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

const storefrontFallback = normaliseProviderStorefront({
  storefront: {
    company: {
      id: 'metro-power-services',
      name: 'Metro Power Services Storefront',
      complianceScore: 92,
      insuredSellerStatus: 'approved',
      insuredSellerExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
      badgeVisible: true
    },
    metrics: {
      activeListings: 3,
      pendingReview: 1,
      flagged: 1,
      insuredOnly: 2,
      holdExpiring: 1,
      avgDailyRate: 415,
      conversionRate: 0.62,
      totalRequests: 28,
      totalRevenue: 18400
    }
  },
  listings: [
    {
      id: 'generator-kit',
      title: '13kVA generator kit',
      status: 'approved',
      availability: 'both',
      pricePerDay: 420,
      purchasePrice: 68000,
      location: 'London Docklands',
      insuredOnly: true,
      complianceHoldUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
      lastReviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      requestVolume: 18,
      activeAgreements: 2,
      successfulAgreements: 12,
      projectedRevenue: 12600,
      averageDurationDays: 6,
      recommendedActions: [
        {
          id: 'generator-promote',
          label: 'Bundle logistics concierge for enterprise deals to lift conversions.',
          tone: 'info'
        }
      ],
      agreements: [
        {
          id: 'ra-901',
          status: 'in_use',
          renter: 'Finova HQ',
          pickupAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          returnDueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          lastStatusTransitionAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          depositStatus: 'held',
          dailyRate: 420,
          meta: { project: 'Emergency backup' }
        },
        {
          id: 'ra-812',
          status: 'settled',
          renter: 'Northbank Campus',
          pickupAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
          returnDueAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
          lastStatusTransitionAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 34).toISOString(),
          depositStatus: 'released',
          dailyRate: 390,
          meta: { project: 'Refit programme' }
        }
      ]
    },
    {
      id: 'hvac-diagnostics',
      title: 'HVAC telemetry deployment',
      status: 'pending_review',
      availability: 'rent',
      pricePerDay: 260,
      location: 'Canary Wharf',
      insuredOnly: false,
      requestVolume: 6,
      activeAgreements: 0,
      successfulAgreements: 2,
      projectedRevenue: 3100,
      averageDurationDays: 4,
      recommendedActions: [
        {
          id: 'hvac-review',
          label: 'Attach telemetry calibration certificates to unlock moderation.',
          tone: 'warning'
        }
      ],
      agreements: []
    },
    {
      id: 'roof-access',
      title: 'Roof access safety kit',
      status: 'suspended',
      availability: 'rent',
      pricePerDay: 120,
      location: 'Stratford',
      insuredOnly: false,
      requestVolume: 4,
      activeAgreements: 0,
      successfulAgreements: 0,
      projectedRevenue: 0,
      averageDurationDays: 0,
      moderationNotes: 'Missing inspection evidence for harness lifelines.',
      recommendedActions: [
        {
          id: 'roof-inspection',
          label: 'Upload harness inspection results to reinstate the listing.',
          tone: 'danger'
        }
      ],
      agreements: []
    }
  ],
  playbooks: [
    {
      id: 'playbook-review',
      title: 'Accelerate moderation',
      detail: 'Supply supporting documents for HVAC telemetry deployment to clear review backlog.',
      tone: 'warning'
    },
    {
      id: 'playbook-suspension',
      title: 'Resolve suspension',
      detail: 'Close out safety findings for the roof access kit to restore search placement.',
      tone: 'danger'
    },
    {
      id: 'playbook-growth',
      title: 'Promote insured bundles',
      detail: 'Enable concierge packages for insured-only listings to increase conversion velocity.',
      tone: 'info'
    }
  ],
  timeline: [
    {
      id: 'timeline-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      type: 'suspended',
      listingTitle: 'Roof access safety kit',
      actor: 'Trust & Safety',
      tone: 'danger',
      detail: 'Suspended pending submission of harness inspection evidence.'
    },
    {
      id: 'timeline-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      type: 'submitted_for_review',
      listingTitle: 'HVAC telemetry deployment',
      actor: 'Metro Power Services',
      tone: 'warning',
      detail: 'Submitted listing for moderation with preliminary telemetry schematics.'
    },
    {
      id: 'timeline-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      type: 'approved',
      listingTitle: '13kVA generator kit',
      actor: 'Marketplace Ops',
      tone: 'success',
      detail: 'Approved listing following compliance refresh and updated imagery.'
    }
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
  hero: {
    name: 'Metro Power Services',
    strapline: 'Critical electrical & HVAC support for corporate campuses',
    tagline: 'NICEIC electricians • HVAC engineers • Logistics crews',
    bio: 'Trusted SME delivering escrow-backed, telemetry-visible field services across the South East.',
    locations: ['London', 'Essex', 'Kent'],
    tags: ['High-voltage certified', '24/7 dispatch', 'Telemetry enabled', 'Geo-zonal routing'],
    categories: ['Trade services', 'Logistics & removals'],
    media: {
      heroImage: '/media/metro-power/hero.jpg',
      bannerImage: '/media/metro-power/banner.jpg',
      brandImage: '/media/metro-power/brand.png',
      profileImage: '/media/metro-power/profile.jpg',
      showcaseVideo: '/media/metro-power/showcase.mp4',
      carousel: [
        {
          title: 'London Docklands zone',
          description: 'Imported GeoJSON polygon from enterprise CAFM.',
          image: '/media/metro-power/zone-1.jpg'
        },
        {
          title: 'Canary Wharf UPS deployment',
          description: 'Telemetry tracked installation',
          image: '/media/metro-power/zone-2.jpg'
        }
      ]
    }
  },
  stats: [
    { label: 'Trust score', value: 93, format: 'number', caption: 'Escrow-governed programmes with telemetry oversight' },
    { label: 'Review score', value: 4.8, format: 'number', caption: 'Based on 128 verified enterprise reviews' },
    { label: 'SLA hit rate', value: 0.98, format: 'percent', caption: 'Tracked weekly with telemetry exports' },
    { label: 'Avg. response', value: 38, format: 'minutes', caption: 'Engineer dispatch, Q3 rolling' },
    { label: 'Projects delivered', value: 164, format: 'number', caption: 'Enterprise programmes completed' },
    { label: 'Service zones', value: 9, format: 'number', caption: 'Imported from GeoJSON polygon library' }
  ],
  testimonials: [
    {
      quote: 'Metro Power keeps our trading floors online. Their proactive comms and telemetry are best-in-class.',
      client: 'Finova Facilities Director'
    }
  ],
  scores: {
    trust: {
      value: 93,
      band: 'gold',
      confidence: 'high',
      sampleSize: 212,
      caption: 'Telemetry-governed execution across 212 orchestrated jobs',
      breakdown: {
        reliability: 95,
        punctuality: 97,
        compliance: 88,
        sentiment: 94,
        cancellations: 96,
        coverage: 82
      }
    },
    review: {
      value: 4.8,
      band: 'worldClass',
      confidence: 'high',
      sampleSize: 128,
      caption: '128 verified client reviews',
      distribution: {
        promoters: 92,
        positive: 26,
        neutral: 8,
        detractors: 2
      }
    }
  },
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
  ],
  serviceCatalogue: [
    {
      name: 'Electrical LV & HV response',
      description: 'NICEIC certified electricians with telemetry-enabled incident response kits.',
      category: 'Carpentry',
      type: 'Trade services',
      price: 320,
      currency: 'GBP',
      availability: { status: 'open', label: 'Available now', detail: 'Same-day dispatch windows' },
      tags: ['High-voltage', 'Permit to work'],
      coverage: ['London Docklands', 'City of London']
    },
    {
      name: 'Data hall HVAC stabilisation',
      description: 'Critical environment HVAC engineers with remote telemetry and redundancy planning.',
      category: 'Painting & decorating',
      type: 'Trade services',
      price: 680,
      currency: 'GBP',
      availability: { status: 'scheduled', label: 'Next availability', detail: new Date(Date.now() + 86400000).toISOString() },
      tags: ['HVAC', 'Telemetry'],
      coverage: ['Slough', 'Reading']
    }
  ],
  previousJobs: [
    {
      title: 'Trading floor resilience upgrade',
      description: 'Tier 3 UPS build with escrow-backed milestones and 0 downtime.',
      completedOn: new Date(Date.now() - 1209600000).toISOString().slice(0, 10),
      zone: 'Canary Wharf',
      value: 86000,
      currency: 'GBP',
      image: '/media/metro-power/jobs-1.jpg'
    }
  ],
  reviews: [
    {
      reviewer: 'Campus Operations Lead',
      rating: 4.9,
      comment: 'Engineers arrive on time, telemetry updates are constant, and escrow settlements are seamless.',
      job: 'Campus SLA Programme'
    }
  ],
  reviewSummary: {
    averageRating: 4.9,
    totalReviews: 1,
    verifiedShare: 1,
    responseRate: 0.92,
    ratingBuckets: [
      { score: 5, count: 1 },
      { score: 4, count: 0 },
      { score: 3, count: 0 },
      { score: 2, count: 0 },
      { score: 1, count: 0 }
    ],
    lastReviewAt: new Date().toISOString(),
    highlightedReviewId: 'review-0',
    latestReviewId: 'review-0',
    excerpt: 'Engineers arrive on time, telemetry updates are constant, and escrow settlements are seamless.'
  },
  deals: [
    {
      title: 'Multi-site electrical cover',
      description: 'Bundle high-voltage response with HVAC standby across 3 geo-zones.',
      savings: 1200,
      currency: 'GBP',
      validUntil: new Date(Date.now() + 604800000).toISOString(),
      tags: ['Trade services', 'Bundle']
    }
  ],
  materials: [
    {
      name: 'Cat6A bulk cable drums',
      category: 'Materials',
      sku: 'CAB-6A-500',
      quantityOnHand: 24,
      unitType: 'drum',
      image: '/media/metro-power/materials-1.jpg'
    }
  ],
  tools: [
    {
      name: 'Thermal imaging kit',
      category: 'Tools',
      rentalRate: 145,
      rentalRateCurrency: 'GBP',
      condition: 'excellent',
      image: '/media/metro-power/tools-1.jpg'
    }
  ],
  servicemen: [
    {
      name: 'Amelia Shaw',
      trades: ['Electrical lead', 'Fire systems'],
      availability: 'Available this week',
      avatar: '/media/metro-power/provider-1.jpg'
    },
    {
      name: 'Callum Price',
      trades: ['HVAC engineer'],
      availability: 'Booked until 12 Mar',
      avatar: '/media/metro-power/provider-2.jpg'
    }
  ],
  serviceZones: [
    { name: 'London Docklands', demandLevel: 'high', metadata: { client: 'Finova' } },
    { name: 'Canary Wharf', demandLevel: 'high', metadata: { client: 'Finova' } }
  ],
  taxonomy: {
    categories: [
      { slug: 'carpentry', label: 'Carpentry', type: 'trade-services', defaultTags: ['Fit-outs'] },
      { slug: 'removals', label: 'Removals', type: 'logistics', defaultTags: ['Crate management'] }
    ],
    types: [
      { type: 'trade-services', label: 'Trade services', description: 'Certified trades', categories: ['carpentry', 'painting'] },
      { type: 'logistics', label: 'Logistics & removals', description: 'Move and delivery crews', categories: ['removals'] }
    ]
  }
});

function withFallback(normaliser, fallback, fetcherFactory) {
  return async function handler(options = {}) {
    try {
      const { data, meta: transportMeta } = await fetcherFactory(options);
      const payload = data?.data ?? data;
      const serverMeta = data?.meta;
      const resolvedMeta = serverMeta
        ? { ...(transportMeta ?? {}), ...serverMeta }
        : { ...(transportMeta ?? {}) };
      const normalised = normaliser(payload);
      if (resolvedMeta.fromCache && resolvedMeta.stale) {
        return { data: normalised, meta: { ...resolvedMeta, fallback: true } };
      }
      return { data: normalised, meta: resolvedMeta };
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

export const getProviderStorefront = withFallback(
  normaliseProviderStorefront,
  storefrontFallback,
  (options = {}) => {
    const query = toQueryString({ companyId: options?.companyId });
    const cacheKeySuffix = query ? `:${query.slice(1)}` : '';
    return request(`/panel/provider/storefront${query}`, {
      cacheKey: `provider-storefront${cacheKeySuffix}`,
      ttl: 20000,
      headers: { 'X-Fixnado-Role': options?.role ?? 'company' },
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    });
  }
);

export const getEnterprisePanel = withFallback(
  normaliseEnterprisePanel,
  enterpriseFallback,
  (options = {}) => {
    const query = toQueryString({
      companyId: options?.companyId,
      timezone: options?.timezone
    });
    const cacheKeySuffix = query ? `:${query.slice(1)}` : '';
    return request(`/panel/enterprise/overview${query}`, {
      cacheKey: `enterprise-panel${cacheKeySuffix}`,
      ttl: 30000,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    });
  }
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

