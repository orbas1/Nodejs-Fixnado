const API_ROOT = '/api';
const REQUEST_TIMEOUT = 10000;
const CACHE_NAMESPACE = 'fixnado:panel-cache';
const DISPUTE_HEALTH_CACHE_KEY = 'admin-dispute-health';
const DISPUTE_HEALTH_CACHE_TTL = 12000;

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

async function request(path, {
  method = 'GET',
  body,
  signal,
  cacheKey: explicitCacheKey,
  ttl = 15000,
  headers: customHeaders,
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

function normaliseQueueAttachments(rawAttachments) {
  if (!Array.isArray(rawAttachments)) {
    return [];
  }
  return rawAttachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }
      const label = typeof attachment.label === 'string' && attachment.label.trim().length
        ? attachment.label.trim()
        : typeof attachment.title === 'string'
          ? attachment.title.trim()
          : null;
      const url = typeof attachment.url === 'string' && attachment.url.trim().length
        ? attachment.url.trim()
        : typeof attachment.href === 'string'
          ? attachment.href.trim()
          : null;
      if (!url) {
        return null;
      }
      const type = typeof attachment.type === 'string' && attachment.type.trim().length
        ? attachment.type.trim()
        : 'link';
      return { label: label || url, url, type };
    })
    .filter(Boolean);
}

function normaliseQueueUpdate(update, boardId, index) {
  if (!update || typeof update !== 'object') {
    const fallbackHeadline = typeof update === 'string' && update.trim().length ? update.trim() : `Update ${index + 1}`;
    return {
      id: `${boardId}-update-${index}`,
      headline: fallbackHeadline,
      body: '',
      tone: 'info',
      recordedAt: null,
      attachments: []
    };
  }

  const headline =
    (typeof update.headline === 'string' && update.headline.trim().length && update.headline.trim()) ||
    (typeof update.title === 'string' && update.title.trim().length && update.title.trim()) ||
    `Update ${index + 1}`;

  const body =
    (typeof update.body === 'string' && update.body.trim()) ||
    (typeof update.description === 'string' && update.description.trim()) ||
    '';

  const tone = typeof update.tone === 'string' && update.tone.trim().length ? update.tone.trim() : 'info';

  const recordedAt =
    (typeof update.recordedAt === 'string' && update.recordedAt) ||
    (typeof update.timestamp === 'string' && update.timestamp) ||
    null;

  return {
    id: update.id || `${boardId}-update-${index}`,
    headline,
    body,
    tone,
    recordedAt,
    attachments: normaliseQueueAttachments(update.attachments)
  };
}

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseOption(option, fallbackValue = 'value', fallbackLabel = 'Label') {
  if (!option || typeof option !== 'object') {
    return { value: fallbackValue, label: fallbackLabel };
  }
  const value = option.value ?? fallbackValue;
  const label = option.label ?? String(value ?? fallbackLabel);
  return { value, label };
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

function normaliseToolSaleCoupon(coupon, index) {
  if (!coupon) {
    return { id: `tool-sale-coupon-${index}`, name: 'Coupon', status: 'draft' };
  }
  return {
    id: coupon.id || `tool-sale-coupon-${index}`,
    name: coupon.name || coupon.code || 'Coupon',
    code: coupon.code || null,
    status: coupon.status || 'draft',
    discountType: coupon.discountType || 'percentage',
    discountValue: coupon.discountValue != null ? Number(coupon.discountValue) : null,
    currency: coupon.currency || 'GBP',
    autoApply: Boolean(coupon.autoApply),
    startsAt: coupon.startsAt || null,
    expiresAt: coupon.expiresAt || null
  };
}

function normaliseToolSaleListing(listing, index) {
  const coupons = ensureArray(listing?.coupons).map(normaliseToolSaleCoupon);
  const inventory = listing?.inventory || {};
  const metrics = listing?.metrics || {};
  return {
    id: listing?.id || `tool-sale-${index}`,
    name: listing?.name || listing?.tagline || 'Tool listing',
    tagline: listing?.tagline || '',
    description: listing?.description || '',
    heroImageUrl: listing?.heroImageUrl || null,
    showcaseVideoUrl: listing?.showcaseVideoUrl || null,
    galleryImages: ensureArray(listing?.galleryImages),
    tags: ensureArray(listing?.tags),
    keywordTags: ensureArray(listing?.keywordTags),
    listing: listing?.listing
      ? {
          status: listing.listing.status || 'draft',
          availability: listing.listing.availability || 'buy',
          pricePerDay: listing.listing.pricePerDay != null ? Number(listing.listing.pricePerDay) : null,
          purchasePrice: listing.listing.purchasePrice != null ? Number(listing.listing.purchasePrice) : null,
          location: listing.listing.location || 'UK-wide',
          insuredOnly: Boolean(listing.listing.insuredOnly)
        }
      : null,
    inventory: {
      quantityOnHand: inventory.quantityOnHand ?? 0,
      quantityReserved: inventory.quantityReserved ?? 0,
      safetyStock: inventory.safetyStock ?? 0,
      conditionRating: inventory.conditionRating || 'good'
    },
    coupons,
    metrics: {
      quantityAvailable: metrics.quantityAvailable ?? Math.max((inventory.quantityOnHand ?? 0) - (inventory.quantityReserved ?? 0), 0),
      activeCoupons: metrics.activeCoupons ?? coupons.filter((coupon) => coupon.status === 'active').length
    }
  };
}

function normaliseProviderDashboard(payload = {}) {
  const root = payload?.data ?? payload;
  const provider = root.provider || root.profile || {};
  const metrics = root.metrics || {};
  const finances = root.finances || root.finance || {};
  const serviceDelivery = root.serviceDelivery || root.delivery || {};
  const taxonomy = root.serviceTaxonomy || root.taxonomy || {};

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
    })),
    toolSales: {
      summary: {
        totalListings: root.toolSales?.summary?.totalListings ?? 0,
        draft: root.toolSales?.summary?.draft ?? 0,
        published: root.toolSales?.summary?.published ?? 0,
        suspended: root.toolSales?.summary?.suspended ?? 0,
        totalQuantity: root.toolSales?.summary?.totalQuantity ?? 0,
        activeCoupons: root.toolSales?.summary?.activeCoupons ?? 0
      },
      listings: ensureArray(root.toolSales?.listings).map(normaliseToolSaleListing)
    },
    serviceManagement: {
      health: ensureArray(serviceDelivery.health || root.serviceHealth).map((metric, index) => ({
        id: metric.id || metric.key || `metric-${index}`,
        label: metric.label || metric.name || 'Service metric',
        value: metric.value ?? metric.score ?? 0,
        format: metric.format || metric.type || 'number',
        caption: metric.caption || metric.description || '',
        target: metric.target ?? null
      })),
      deliveryBoard: ensureArray(serviceDelivery.board || root.serviceDeliveryBoard).map((column, index) => ({
        id: column.id || column.key || `column-${index}`,
        title: column.title || column.name || `Stage ${index + 1}`,
        description: column.description || '',
        items: ensureArray(column.items).map((item, itemIndex) => ({
          id: item.id || `delivery-${index}-${itemIndex}`,
          name: item.name || item.title || 'Engagement',
          client: item.client || item.account || 'Client partner',
          zone: item.zone || item.region || null,
          eta: item.eta || item.due || item.scheduledFor || null,
          owner: item.owner || item.manager || 'Operations',
          risk: item.risk || item.status || 'on-track',
          stage: item.stage || column.title || 'Stage',
          value: item.value ?? item.contractValue ?? null,
          currency: item.currency || 'GBP',
          services: ensureArray(item.services || item.serviceMix)
        }))
      })),
      packages: ensureArray(root.servicePackages || root.packages).map((pkg, index) => ({
        id: pkg.id || `package-${index}`,
        name: pkg.name || pkg.title || 'Service package',
        description: pkg.description || pkg.summary || 'Comprehensive field services bundle.',
        price: pkg.price ?? pkg.monthly ?? null,
        currency: pkg.currency || 'GBP',
        highlights: ensureArray(pkg.highlights || pkg.features),
        serviceId: pkg.serviceId || pkg.service || null,
        serviceName: pkg.serviceName || null
      })),
      categories: ensureArray(root.serviceCategories || taxonomy.categories).map((category, index) => ({
        id: category.id || category.slug || `category-${index}`,
        label: category.label || category.name || 'Service category',
        type: category.type || category.segment || 'general-services',
        description: category.description || '',
        activeServices: category.activeServices ?? category.count ?? 0,
        performance: category.performance ?? category.performanceScore ?? null
      })),
      catalogue: ensureArray(root.serviceCatalogue || root.services).map((service, index) => ({
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
        coverage: ensureArray(service.coverage)
      }))
    }
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

function normaliseToolSales(payload = {}) {
  const root = payload?.data ?? payload;
  return {
    summary: {
      totalListings: root.summary?.totalListings ?? 0,
      draft: root.summary?.draft ?? 0,
      published: root.summary?.published ?? 0,
      suspended: root.summary?.suspended ?? 0,
      totalQuantity: root.summary?.totalQuantity ?? 0,
      activeCoupons: root.summary?.activeCoupons ?? 0
    },
    listings: ensureArray(root.listings).map(normaliseToolSaleListing)
function normaliseStorefrontSettings(storefront = {}) {
  return {
    id: storefront.id || 'storefront',
    companyId: storefront.companyId || storefront.company_id || null,
    name: storefront.name || 'Provider storefront',
    slug: storefront.slug || 'provider-storefront',
    tagline: storefront.tagline || '',
    description: storefront.description || '',
    heroImageUrl: storefront.heroImageUrl || storefront.hero_image_url || '',
    contactEmail: storefront.contactEmail || storefront.contact_email || '',
    contactPhone: storefront.contactPhone || storefront.contact_phone || '',
    primaryColor: storefront.primaryColor || storefront.primary_color || '#0f172a',
    accentColor: storefront.accentColor || storefront.accent_color || '#38bdf8',
    status: storefront.status || 'draft',
    isPublished: Boolean(storefront.isPublished ?? storefront.is_published ?? false),
    publishedAt: storefront.publishedAt || storefront.published_at || null,
    reviewRequired: Boolean(storefront.reviewRequired ?? storefront.review_required ?? false),
    metadata: typeof storefront.metadata === 'object' && storefront.metadata ? storefront.metadata : {}
  };
}

function normaliseStorefrontInventory(item = {}, index = 0) {
  return {
    id: item.id || `inventory-${index}`,
    storefrontId: item.storefrontId || item.storefront_id || null,
    sku: item.sku || `SKU-${index}`,
    name: item.name || 'Inventory item',
    summary: item.summary || '',
    description: item.description || '',
    priceAmount: item.priceAmount != null ? Number(item.priceAmount) : Number(item.price_amount ?? 0),
    priceCurrency: item.priceCurrency || item.price_currency || 'GBP',
    stockOnHand: item.stockOnHand != null ? Number(item.stockOnHand) : Number(item.stock_on_hand ?? 0),
    reorderPoint: item.reorderPoint != null ? Number(item.reorderPoint) : Number(item.reorder_point ?? 0),
    restockAt: item.restockAt || item.restock_at || null,
    visibility: item.visibility || 'public',
    featured: Boolean(item.featured),
    imageUrl: item.imageUrl || item.image_url || '',
    metadata: typeof item.metadata === 'object' && item.metadata ? item.metadata : {}
  };
}

function normaliseStorefrontCoupon(coupon = {}, index = 0) {
  return {
    id: coupon.id || `coupon-${index}`,
    storefrontId: coupon.storefrontId || coupon.storefront_id || null,
    code: coupon.code || `COUPON-${index}`,
    name: coupon.name || 'Promotion',
    description: coupon.description || '',
    discountType: coupon.discountType || coupon.discount_type || 'percentage',
    discountValue: coupon.discountValue != null ? Number(coupon.discountValue) : Number(coupon.discount_value ?? 0),
    minOrderTotal:
      coupon.minOrderTotal != null
        ? Number(coupon.minOrderTotal)
        : coupon.min_order_total != null
          ? Number(coupon.min_order_total)
          : null,
    maxDiscountValue:
      coupon.maxDiscountValue != null
        ? Number(coupon.maxDiscountValue)
        : coupon.max_discount_value != null
          ? Number(coupon.max_discount_value)
          : null,
    startsAt: coupon.startsAt || coupon.starts_at || null,
    endsAt: coupon.endsAt || coupon.ends_at || null,
    usageLimit:
      coupon.usageLimit != null ? Number(coupon.usageLimit) : coupon.usage_limit != null ? Number(coupon.usage_limit) : null,
    usageCount:
      coupon.usageCount != null ? Number(coupon.usageCount) : coupon.usage_count != null ? Number(coupon.usage_count) : 0,
    status: coupon.status || 'draft',
    appliesTo: coupon.appliesTo || coupon.applies_to || '',
    metadata: typeof coupon.metadata === 'object' && coupon.metadata ? coupon.metadata : {}
  };
}

function normaliseProviderStorefrontWorkspace(payload = {}) {
  const root = payload?.data ?? payload;
  const storefront = normaliseStorefrontSettings(root.storefront || {});
  const inventory = ensureArray(root.inventory).map((item, index) => normaliseStorefrontInventory(item, index));
  const coupons = ensureArray(root.coupons).map((item, index) => normaliseStorefrontCoupon(item, index));
  const inventoryMeta = root.inventoryMeta || {
    total: inventory.length,
    published: inventory.filter((item) => item.visibility === 'public').length,
    archived: inventory.filter((item) => item.visibility === 'archived').length,
    lowStock: inventory.filter((item) => item.stockOnHand <= item.reorderPoint).length
  };
  const couponMeta = root.couponMeta || {
    total: coupons.length,
    active: coupons.filter((coupon) => coupon.status === 'active').length,
    expiringSoon: coupons.filter((coupon) => coupon.endsAt).length
  };

  return {
    storefront,
    inventory,
    coupons,
    inventoryMeta,
    couponMeta
  };
}

function normaliseEnterprisePanel(payload = {}) {
  const root = payload?.data ?? payload;
  const enterprise = root.enterprise || root.account || {};
  const metrics = root.metrics || {};
  const spend = root.spend || root.finance || {};
  const operations = root.operations || root.operationsCentre || {};
  const risk = root.risk || root.riskRegister || {};
  const governance = root.governance || root.compliance || {};
  const sustainability = operations.sustainability || root.sustainability || root.esg || {};
  const automation = operations.automation || root.automation || {};
  const commandCentre = root.actionCentre || operations.commandCentre || operations.actionCentre;
  const roadmapSource = root.roadmap || root.timeline || operations.roadmap;
  const auditSource = governance.audits || governance.auditSchedule || risk.audits;

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
    })),
    operations: {
      coverage: ensureArray(operations.coverage || operations.regions).map((region, index) => ({
        id: region.id || `coverage-${index}`,
        region: region.region || region.label || 'Region',
        uptime: region.uptime ?? region.availability ?? 0.98,
        activeSites: region.activeSites ?? region.sites ?? 0,
        automationScore: region.automationScore ?? region.automation ?? 0.75,
        incidents: region.incidents ?? region.alerts ?? 0,
        primaryService: region.primaryService || region.focus || null
      })),
      automation: {
        orchestrationRate: automation.orchestrationRate ?? automation.successRate ?? 0.82,
        runbookCoverage: automation.runbookCoverage ?? automation.coverage ?? 0.68,
        automationsLive: automation.automationsLive ?? automation.playbooks ?? 18,
        nextReview: automation.nextReview || automation.reviewAt || null,
        runbooks: ensureArray(automation.runbooks).map((runbook, index) => ({
          id: runbook.id || `runbook-${index}`,
          name: runbook.name || runbook.title || 'Automation runbook',
          adoption: runbook.adoption ?? runbook.coverage ?? 0.5,
          owner: runbook.owner || runbook.steward || null
        }))
      },
      sustainability: {
        carbonYtd: sustainability.carbonYtd ?? sustainability.emissionsYtd ?? 0,
        carbonTarget: sustainability.carbonTarget ?? sustainability.target ?? 0,
        renewableCoverage: sustainability.renewableCoverage ?? sustainability.renewables ?? 0,
        emissionTrend: sustainability.emissionTrend ?? sustainability.trend ?? 'steady'
      },
      actionCentre: ensureArray(commandCentre).map((item, index) => ({
        id: item.id || `action-${index}`,
        title: item.title || item.name || 'Action',
        detail: item.detail || item.description || '',
        due: item.due || item.dueDate || null,
        owner: item.owner || item.assignee || null,
        severity: item.severity || item.tone || 'medium'
      }))
    },
    governance: {
      complianceScore: governance.complianceScore ?? governance.score ?? 0.9,
      posture: governance.posture || governance.status || 'steady',
      dataResidency: governance.dataResidency || governance.residency || 'UK & EU',
      audits: ensureArray(auditSource).map((audit, index) => ({
        id: audit.id || `audit-${index}`,
        name: audit.name || audit.title || 'Audit',
        due: audit.due || audit.dueDate || null,
        status: audit.status || audit.state || 'scheduled',
        owner: audit.owner || audit.lead || null
      })),
      riskRegister: ensureArray(risk.items || risk.entries || risk.register).map((entry, index) => ({
        id: entry.id || `risk-${index}`,
        label: entry.label || entry.title || 'Risk',
        severity: entry.severity || entry.level || 'medium',
        owner: entry.owner || entry.assignee || null,
        due: entry.due || entry.dueDate || null,
        mitigation: entry.mitigation || entry.plan || null
      }))
    },
    roadmap: ensureArray(roadmapSource).map((item, index) => ({
      id: item.id || `milestone-${index}`,
      milestone: item.milestone || item.title || 'Milestone',
      quarter: item.quarter || item.timeline || null,
      status: item.status || item.state || 'on-track',
      owner: item.owner || item.lead || null,
      detail: item.detail || item.description || null
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
  const styleGuide = {
    palette: {
      primary: root.styleGuide?.palette?.primary || '#0B1D3A',
      accent: root.styleGuide?.palette?.accent || '#1F4ED8',
      highlight: root.styleGuide?.palette?.highlight || '#00BFA6',
      neutral: root.styleGuide?.palette?.neutral || '#F4F7FA',
      text: root.styleGuide?.palette?.text || '#FFFFFF'
    },
    typography: {
      heading: root.styleGuide?.typography?.heading || 'Inter',
      body: root.styleGuide?.typography?.body || 'Inter'
    }
  };

  const resolvePaletteValue = (value, fallback) => {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  };

  const carouselMedia = ensureArray(heroMedia.carousel || root.carousel).map((item, index) => ({
    id: item.id || `carousel-${index}`,
    title: item.title || item.name || `Showcase ${index + 1}`,
    description: item.description || '',
    image: item.image || item.url || null
  }));

  const bannerStyles = ensureArray(root.bannerStyles || root.hero?.bannerStyles).map((style, index) => {
    const paletteSource = style && typeof style.palette === 'object' ? style.palette : {};
    return {
      id: style?.id || `banner-${index}`,
      name: style?.name || `Banner style ${index + 1}`,
      description: style?.description || '',
      layout: style?.layout || 'full-bleed',
      recommendedUse: style?.recommendedUse || '',
      preview: style?.preview || style?.previewImage || style?.image || null,
      palette: {
        background: resolvePaletteValue(paletteSource.background, styleGuide.palette.primary),
        accent: resolvePaletteValue(paletteSource.accent, styleGuide.palette.accent),
        highlight: resolvePaletteValue(paletteSource.highlight, styleGuide.palette.highlight),
        text: resolvePaletteValue(paletteSource.text, styleGuide.palette.text)
      },
      supportsVideo: style?.supportsVideo !== false,
      supportsCarousel: style?.supportsCarousel !== false,
      textTone: style?.textTone || (style?.supportsVideo === false ? 'dark' : 'light'),
      badges: ensureArray(style?.badges || style?.tags).map((badge, badgeIndex) =>
        typeof badge === 'string' ? badge : `Badge ${badgeIndex + 1}`
      )
    };
  });

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
    createdAt: review.createdAt || review.created_at || null,
    updatedAt: review.updatedAt || review.updated_at || null,
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
    bannerStyles,
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
    taxonomy,
    styleGuide
  };
}

function normaliseMaterialsShowcase(payload = {}) {
  const root = payload?.data ?? payload;
  const heroMetrics = ensureArray(root.hero?.metrics).map((metric, index) => ({
    id: metric.id || metric.key || metric.label || `metric-${index}`,
    label: metric.label || metric.name || `Metric ${index + 1}`,
    value: Number.isFinite(Number.parseFloat(metric.value))
      ? Number.parseFloat(metric.value)
      : Number.isFinite(Number.parseFloat(metric.percentage))
      ? Number.parseFloat(metric.percentage)
      : metric.value ?? metric.percentage ?? null,
    unit: metric.unit || metric.suffix || null
  }));
  const heroActions = ensureArray(root.hero?.actions).map((action, index) => ({
    id: action.id || action.key || action.label || `action-${index}`,
    label: action.label || action.title || 'Action',
    href: action.href || action.url || '#',
    target: action.target || '_self'
  }));
  const hero = {
    title: root.hero?.title || 'Materials control tower',
    subtitle:
      root.hero?.subtitle ||
      root.hero?.description ||
      'Govern consumables, replenishment cadences, and supplier risk from one command surface.',
    metrics: heroMetrics,
    actions: heroActions
  };

  const statsRaw = root.stats || {};
  const stats = {
    totalSkus: Number.parseInt(statsRaw.totalSkus ?? statsRaw.total_skus ?? 0, 10) || 0,
    totalOnHand: Number.parseInt(statsRaw.totalOnHand ?? statsRaw.total_on_hand ?? 0, 10) || 0,
    valueOnHand: Number.parseFloat(statsRaw.valueOnHand ?? statsRaw.value_on_hand ?? 0) || 0,
    alerts: Number.parseInt(statsRaw.alerts ?? statsRaw.activeAlerts ?? 0, 10) || 0,
    fillRate: (() => {
      const raw = Number.parseFloat(statsRaw.fillRate ?? statsRaw.fill_rate ?? statsRaw.serviceLevel ?? 1);
      if (Number.isNaN(raw)) return 1;
      if (raw > 1 && raw <= 100) {
        return Math.max(0, Math.min(1, raw / 100));
      }
      return Math.max(0, Math.min(1, raw));
    })(),
    replenishmentEta: statsRaw.replenishmentEta || statsRaw.replenishment_eta || null
  };

  const categories = ensureArray(root.categories).map((category, index) => ({
    id: category.id || category.slug || `category-${index}`,
    name: category.name || category.label || 'Category',
    share: Number.parseFloat(category.share ?? category.percentage ?? 0) || 0,
    safetyStockBreaches:
      Number.parseInt(category.safetyStockBreaches ?? category.breaches ?? 0, 10) || 0,
    availability: (() => {
      const raw = Number.parseFloat(category.availability ?? category.fillRate ?? 1);
      if (Number.isNaN(raw)) return 1;
      if (raw > 1 && raw <= 100) {
        return Math.max(0, Math.min(1, raw / 100));
      }
      return Math.max(0, Math.min(1, raw));
    })()
  }));

  const inventory = ensureArray(root.inventory || root.materials || root.featured).map((item, index) => {
    const quantityOnHand = Number.parseFloat(item.quantityOnHand ?? item.onHand ?? 0) || 0;
    const quantityReserved = Number.parseFloat(item.quantityReserved ?? item.reserved ?? 0) || 0;
    const explicitAvailable = Number.parseFloat(item.available ?? item.onHandAvailable ?? NaN);
    const available = Number.isFinite(explicitAvailable)
      ? explicitAvailable
      : Math.max(quantityOnHand - quantityReserved, 0);
    const alerts = ensureArray(item.alerts).map((alert, alertIndex) => ({
      id: alert.id || alert.key || `alert-${alertIndex}`,
      type: alert.type || alert.category || 'alert',
      severity: alert.severity || alert.level || 'info',
      status: alert.status || 'active',
      triggeredAt: alert.triggeredAt || alert.createdAt || alert.updatedAt || null
    }));
    return {
      id: item.id || `material-${index}`,
      sku: item.sku || item.code || null,
      name: item.name || item.title || `Material ${index + 1}`,
      category: item.category || item.categoryName || 'Materials',
      unitType: item.unitType || item.unit || 'unit',
      quantityOnHand,
      quantityReserved,
      safetyStock: Number.parseFloat(item.safetyStock ?? item.safety_stock ?? 0) || 0,
      available,
      unitCost: Number.parseFloat(item.unitCost ?? item.unit_cost ?? item.cost ?? 0) || 0,
      supplier: item.supplier?.name || item.supplier || null,
      leadTimeDays: (() => {
        const raw =
          item.leadTimeDays ?? item.lead_time_days ?? item.leadTime ?? item.lead_time ?? null;
        if (raw == null) return null;
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : null;
      })(),
      compliance: ensureArray(item.compliance).map((entry) => String(entry)),
      nextArrival: item.nextArrival || item.next_arrival || null,
      alerts
    };
  });

  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const featured = ensureArray(root.featured).map((item, index) => {
    const material = inventoryById.get(item.id);
    if (material) {
      return material;
    }
    const fallback = inventory[index];
    return {
      ...(fallback || {}),
      id: item.id || fallback?.id || `material-featured-${index}`,
      name: item.name || item.title || fallback?.name || `Material ${index + 1}`
    };
  });

  const collections = ensureArray(root.collections).map((collection, index) => ({
    id: collection.id || collection.slug || `collection-${index}`,
    name: collection.name || collection.title || 'Collection',
    description: collection.description || collection.summary || '',
    composition: ensureArray(collection.composition || collection.items).map((entry) =>
      typeof entry === 'string' ? entry : entry?.name || entry?.title || ''
    ),
    slaHours: (() => {
      const raw = collection.slaHours ?? collection.sla_hours ?? collection.sla;
      if (raw == null) return null;
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
    coverageZones: ensureArray(collection.coverageZones || collection.zones || collection.regions).map(
      (zone) => (typeof zone === 'string' ? zone : zone?.name || '')
    ),
    automation: ensureArray(collection.automation || collection.automations || collection.workflows).map((entry) =>
      typeof entry === 'string' ? entry : entry?.title || ''
    )
  }));

  const suppliers = ensureArray(root.suppliers).map((supplier, index) => ({
    id: supplier.id || supplier.slug || `supplier-${index}`,
    name: supplier.name || supplier.vendor || 'Supplier',
    tier: supplier.tier || supplier.segment || 'Partner',
    leadTimeDays: (() => {
      const raw = supplier.leadTimeDays ?? supplier.lead_time_days ?? supplier.leadTime;
      if (raw == null) return null;
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
    reliability: (() => {
      const raw = supplier.reliability ?? supplier.performance;
      if (raw == null) return null;
      const parsed = Number.parseFloat(raw);
      if (Number.isNaN(parsed)) return null;
      if (parsed > 1 && parsed <= 100) {
        return Math.max(0, Math.min(1, parsed / 100));
      }
      return Math.max(0, Math.min(1, parsed));
    })(),
    annualSpend: Number.parseFloat(supplier.annualSpend ?? supplier.annual_spend ?? 0) || 0,
    carbonScore: Number.parseFloat(supplier.carbonScore ?? supplier.carbon_score ?? 0) || null
  }));

  const logistics = ensureArray(root.logistics).map((step, index) => ({
    id: step.id || step.key || `logistics-${index}`,
    label: step.label || step.name || 'Milestone',
    status: step.status || step.state || 'scheduled',
    eta: step.eta || step.expectedAt || step.dueAt || null,
    detail: step.detail || step.description || ''
  }));

  const complianceInsights = root.insights?.compliance || {};
  const sustainabilityInsights = root.insights?.sustainability || {};

  const insights = {
    compliance: {
      passingRate: (() => {
        const raw = complianceInsights.passingRate ?? complianceInsights.passRate;
        if (raw == null) return 1;
        const parsed = Number.parseFloat(raw);
        if (Number.isNaN(parsed)) return 1;
        if (parsed > 1 && parsed <= 100) {
          return Math.max(0, Math.min(1, parsed / 100));
        }
        return Math.max(0, Math.min(1, parsed));
      })(),
      upcomingAudits: Number.parseInt(
        complianceInsights.upcomingAudits ?? complianceInsights.audits ?? 0,
        10
      ) || 0,
      expiringCertifications: ensureArray(
        complianceInsights.expiringCertifications || complianceInsights.expiring
      ).map((entry, index) => ({
        id: entry.id || entry.key || `cert-${index}`,
        name: entry.name || entry.title || 'Certification',
        expiresAt: entry.expiresAt || entry.expiry || entry.dueAt || null
      }))
    },
    sustainability: {
      recycledShare: (() => {
        const raw = sustainabilityInsights.recycledShare ?? sustainabilityInsights.recycled;
        if (raw == null) return 0;
        const parsed = Number.parseFloat(raw);
        if (Number.isNaN(parsed)) return 0;
        if (parsed > 1 && parsed <= 100) {
          return Math.max(0, Math.min(1, parsed / 100));
        }
        return Math.max(0, Math.min(1, parsed));
      })(),
      co2SavingsTons:
        Number.parseFloat(sustainabilityInsights.co2SavingsTons ?? sustainabilityInsights.co2 ?? 0) || 0,
      initiatives: ensureArray(sustainabilityInsights.initiatives).map((entry) =>
        typeof entry === 'string' ? entry : entry?.title || ''
      )
    }
  };

  const sortedCategories = categories.slice().sort((a, b) => b.share - a.share);

  return {
    generatedAt: root.generatedAt || payload.generatedAt || new Date().toISOString(),
    hero,
    stats,
    categories: sortedCategories,
    featured,
    inventory,
    collections,
    suppliers,
    logistics,
    insights
  };
}

const materialsFallback = normaliseMaterialsShowcase({
  generatedAt: '2025-02-10T08:00:00.000Z',
  hero: {
    title: 'Materials control tower',
    subtitle:
      'Govern consumables, replenishment cadences, and supplier risk from one command surface.',
    metrics: [
      { label: 'Fill rate', value: 97 },
      { label: 'Stockouts this quarter', value: 1 },
      { label: 'Average lead time (days)', value: 4 }
    ],
    actions: [
      { label: 'Launch replenishment planner', href: '/materials/planner' },
      { label: 'Download compliance pack', href: '/materials/compliance-pack.pdf' }
    ]
  },
  stats: {
    totalSkus: 24,
    totalOnHand: 1820,
    valueOnHand: 28640,
    alerts: 3,
    fillRate: 0.97,
    replenishmentEta: '2025-02-18T08:00:00.000Z'
  },
  categories: [
    { id: 'cabling', name: 'Structured cabling', share: 0.34, safetyStockBreaches: 0, availability: 0.92 },
    { id: 'fire-safety', name: 'Fire safety', share: 0.27, safetyStockBreaches: 1, availability: 0.88 },
    { id: 'mechanical', name: 'Mechanical consumables', share: 0.21, safetyStockBreaches: 1, availability: 0.9 },
    { id: 'ppe', name: 'PPE & welfare', share: 0.18, safetyStockBreaches: 1, availability: 0.99 }
  ],
  inventory: [
    {
      id: 'material-1',
      sku: 'CAB-6A-500',
      name: 'Cat6A bulk cable drums',
      category: 'Structured cabling',
      unitType: 'drum',
      quantityOnHand: 24,
      quantityReserved: 6,
      safetyStock: 12,
      unitCost: 240,
      supplier: { name: 'Metro Cabling Co' },
      leadTimeDays: 3,
      compliance: ['CE', 'RoHS'],
      nextArrival: '2025-02-15T09:00:00.000Z',
      alerts: []
    },
    {
      id: 'material-2',
      sku: 'FS-CO2-60',
      name: '6kg CO2 extinguishers',
      category: 'Fire safety',
      unitType: 'unit',
      quantityOnHand: 56,
      quantityReserved: 12,
      safetyStock: 48,
      unitCost: 68,
      supplier: 'Civic Compliance',
      leadTimeDays: 5,
      compliance: ['BS EN3'],
      nextArrival: '2025-02-21T10:00:00.000Z',
      alerts: [
        {
          id: 'alert-1',
          type: 'low_stock',
          severity: 'warning',
          status: 'active',
          triggeredAt: '2025-02-05T08:30:00.000Z'
        }
      ]
    }
  ],
  featured: [
    {
      id: 'material-1',
      sku: 'CAB-6A-500',
      name: 'Cat6A bulk cable drums',
      category: 'Structured cabling',
      unitType: 'drum',
      quantityOnHand: 24,
      quantityReserved: 6,
      safetyStock: 12,
      unitCost: 240,
      supplier: { name: 'Metro Cabling Co' },
      leadTimeDays: 3,
      compliance: ['CE', 'RoHS'],
      nextArrival: '2025-02-15T09:00:00.000Z',
      alerts: []
    },
    {
      id: 'material-2',
      sku: 'FS-CO2-60',
      name: '6kg CO2 extinguishers',
      category: 'Fire safety',
      unitType: 'unit',
      quantityOnHand: 56,
      quantityReserved: 12,
      safetyStock: 48,
      unitCost: 68,
      supplier: 'Civic Compliance',
      leadTimeDays: 5,
      compliance: ['BS EN3'],
      nextArrival: '2025-02-21T10:00:00.000Z',
      alerts: [
        {
          id: 'alert-1',
          type: 'low_stock',
          severity: 'warning',
          status: 'active',
          triggeredAt: '2025-02-05T08:30:00.000Z'
        }
      ]
    }
  ],
  collections: [
    {
      id: 'rapid-response',
      name: 'Rapid response outage kit',
      description:
        'Pre-packed assemblies for campus outages including switchgear spares, fuses, PPE, and thermal paste.',
      composition: [
        '4 × Cat6A cable drums',
        '12 × MCCB kits',
        'Thermal imaging consumables',
        'Arc-flash PPE rotation pack'
      ],
      slaHours: 4,
      coverageZones: ['London Docklands', 'Canary Wharf'],
      automation: ['Auto-replenish to 2 kits per zone', 'Escrow-backed courier dispatch']
    },
    {
      id: 'planned-maintenance',
      name: 'Planned maintenance stack',
      description: '90-day rolling consumables aligned with monthly PPM schedules and vendor compliance expiries.',
      composition: [
        'Filter and belt assortment',
        'Sealant & lubrication caddies',
        'PAT testing consumables',
        'Permit documentation packs'
      ],
      slaHours: 24,
      coverageZones: ['Manchester Science Park', 'Birmingham Innovation Hub'],
      automation: ['Lead time buffers by supplier tier', 'Compliance auto-escalations']
    }
  ],
  suppliers: [
    {
      id: 'metro',
      name: 'Metro Cabling Co',
      tier: 'Preferred',
      leadTimeDays: 3,
      reliability: 0.98,
      annualSpend: 82000,
      carbonScore: 72
    },
    {
      id: 'civic',
      name: 'Civic Compliance',
      tier: 'Strategic',
      leadTimeDays: 5,
      reliability: 0.95,
      annualSpend: 61000,
      carbonScore: 66
    },
    {
      id: 'northern',
      name: 'Northern Plant Logistics',
      tier: 'Regional',
      leadTimeDays: 2,
      reliability: 0.91,
      annualSpend: 38000,
      carbonScore: 59
    }
  ],
  logistics: [
    {
      id: 'inbound',
      label: 'Inbound consolidation',
      status: 'on_track',
      eta: '2025-02-15T08:00:00.000Z',
      detail:
        'Consolidated supplier shipments staged at Milton Keynes hub with telemetry seal checks complete.'
    },
    {
      id: 'quality',
      label: 'Quality assurance',
      status: 'attention',
      eta: '2025-02-16T12:00:00.000Z',
      detail: 'Fire safety lot pending QA retest following revised BS EN3 documentation release.'
    },
    {
      id: 'last-mile',
      label: 'Last-mile dispatch',
      status: 'scheduled',
      eta: '2025-02-17T06:00:00.000Z',
      detail: 'Dedicated EV couriers aligned with SLAs and geofenced drop windows for Docklands campus.'
    }
  ],
  insights: {
    compliance: {
      passingRate: 0.94,
      upcomingAudits: 3,
      expiringCertifications: [
        { name: 'Fire suppression media', expiresAt: '2025-03-01T00:00:00.000Z' },
        { name: 'Lifting accessories', expiresAt: '2025-03-12T00:00:00.000Z' }
      ]
    },
    sustainability: {
      recycledShare: 0.32,
      co2SavingsTons: 18.4,
      initiatives: ['Closed-loop cable drum programme', 'EV last-mile fleet fully deployed']
    }
  }
});

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

  const commandSummary = payload.metrics?.command?.summary || {};

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
    tone: signal.tone || 'info',
    statusLabel: signal.statusLabel || signal.status || null,
    ownerRole: signal.ownerRole || signal.owner || null,
    runbookUrl: signal.runbookUrl || signal.runbook || null,
    metricKey: signal.metricKey || `signal-${index}`
  }));

  const automationBacklog = ensureArray(payload.security?.automationBacklog).map((item, index) => ({
    id: item.id || `automation-${index}`,
    name: item.name || `Automation ${index + 1}`,
    status: item.status || 'Monitor',
    notes: item.notes || '',
    tone: item.tone || 'info',
    owner: item.owner || null,
    runbookUrl: item.runbookUrl || null,
    dueAt: item.dueAt || null,
    priority: item.priority || 'medium',
    signalKey: item.signalKey || null
  }));

  const queueBoards = ensureArray(payload.queues?.boards).map((board, index) => {
    const id = board.id || `board-${index}`;
    const metadata = board.metadata && typeof board.metadata === 'object' ? board.metadata : {};
    const priority = Number.parseInt(board.priority ?? index + 1, 10);
    return {
      id,
      slug: board.slug || null,
      title: board.title || board.name || `Queue ${index + 1}`,
      summary: board.summary || '',
      owner: board.owner || 'Operations',
      status: board.status || 'operational',
      priority: Number.isFinite(priority) ? priority : index + 1,
      metadata,
      createdAt: board.createdAt || null,
      updatedAt: board.updatedAt || null,
      updates: ensureArray(board.updates).map((update, updateIndex) => normaliseQueueUpdate(update, id, updateIndex))
    };
  });
  const connectors = ensureArray(payload.security?.connectors).map((connector, index) => ({
    id: connector.id || `connector-${index}`,
    name: connector.name || `Connector ${index + 1}`,
    status: connector.status || 'healthy',
    description: connector.description || '',
    connectorType: connector.connectorType || connector.type || 'custom',
    region: connector.region || null,
    dashboardUrl: connector.dashboardUrl || connector.url || null,
    ingestionEndpoint: connector.ingestionEndpoint || null,
    eventsPerMinuteTarget:
      Number.parseInt(connector.eventsPerMinuteTarget ?? connector.target ?? 0, 10) || 0,
    eventsPerMinuteActual:
      Number.parseInt(connector.eventsPerMinuteActual ?? connector.actual ?? 0, 10) || 0,
    lastHealthCheckAt: connector.lastHealthCheckAt || connector.lastHealth || null,
    logoUrl: connector.logoUrl || null
  }));

  const securitySummary = payload.security?.summary || {
    connectorsHealthy: connectors.filter((connector) => connector.status === 'healthy').length,
    connectorsAttention: connectors.filter((connector) => connector.status !== 'healthy').length,
    automationOpen: automationBacklog.filter((item) => item.status !== 'Completed').length,
    signalsWarning: securitySignals.filter((signal) => signal.tone === 'warning').length,
    signalsDanger: securitySignals.filter((signal) => signal.tone === 'danger').length
  };

  const securityCapabilities = payload.security?.capabilities || {};

  const complianceControls = ensureArray(payload.queues?.complianceControls).map((control, index) => ({
    id: control.id || `control-${index}`,
    name: control.name || `Control ${index + 1}`,
    detail: control.detail || '',
    due: control.due || 'Due soon',
    owner: control.owner || 'Compliance Ops',
    tone: control.tone || 'info'
  }));

  let auditTimeline;
  if (Array.isArray(payload.audit?.timeline?.events)) {
    auditTimeline = {
      events: ensureArray(payload.audit.timeline.events).map((item, index) => ({
        id: item.id || `audit-${index}`,
        time: item.time || '--:--',
        event: item.event || `Audit event ${index + 1}`,
        owner: item.owner || 'Operations',
        ownerTeam: item.ownerTeam || null,
        status: item.status || 'Scheduled',
        category: item.category || 'other',
        summary: item.summary || '',
        attachments: ensureArray(item.attachments).map((attachment, attachmentIndex) => ({
          label: attachment?.label || `Attachment ${attachmentIndex + 1}`,
          url: attachment?.url || ''
        })),
        occurredAt: item.occurredAt || null,
        dueAt: item.dueAt || null,
        source: item.source || 'system',
        metadata: item.metadata || {}
      })),
      summary: {
        countsByCategory: payload.audit.timeline.summary?.countsByCategory ?? {},
        countsByStatus: payload.audit.timeline.summary?.countsByStatus ?? {},
        manualCounts: payload.audit.timeline.summary?.manualCounts ?? {},
        manualStatusCounts: payload.audit.timeline.summary?.manualStatusCounts ?? {},
        timeframe: payload.audit.timeline.summary?.timeframe || timeframe,
        timeframeLabel: payload.audit.timeline.summary?.timeframeLabel || payload.timeframeLabel || '7 days',
        timezone: payload.audit.timeline.summary?.timezone || 'Europe/London',
        range: payload.audit.timeline.summary?.range || null,
        lastUpdated: payload.audit.timeline.summary?.lastUpdated || generatedAt
      }
    };
  } else {
    const fallbackEvents = ensureArray(payload.audit?.timeline).map((item, index) => ({
      id: item.id || `audit-${index}`,
      time: item.time || '--:--',
      event: item.event || `Audit event ${index + 1}`,
      owner: item.owner || 'Operations',
      ownerTeam: item.ownerTeam || null,
      status: item.status || 'Scheduled',
      category: item.category || 'other',
      summary: item.summary || '',
      attachments: ensureArray(item.attachments).map((attachment, attachmentIndex) => ({
        label: attachment?.label || `Attachment ${attachmentIndex + 1}`,
        url: attachment?.url || ''
      })),
      occurredAt: item.occurredAt || null,
      dueAt: item.dueAt || null,
      source: item.source || 'system',
      metadata: item.metadata || {}
    }));
    auditTimeline = {
      events: fallbackEvents,
      summary: {
        countsByCategory: {},
        countsByStatus: {},
        manualCounts: {},
        manualStatusCounts: {},
        timeframe,
        timeframeLabel: payload.timeframeLabel || '7 days',
        timezone: 'Europe/London',
        range: null,
        lastUpdated: generatedAt
      }
    };
  }

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
          escrowTotal:
            Number.parseFloat(commandSummary.escrowTotal ?? commandSummary.escrowTotalAmount ?? 0) || 0,
          escrowTotalLabel: commandSummary.escrowTotalLabel || commandSummary.escrowTotal || '—',
          slaCompliance: Number.parseFloat(commandSummary.slaCompliance ?? 0) || 0,
          slaComplianceLabel: commandSummary.slaComplianceLabel || commandSummary.slaCompliance || '—',
          openDisputes: Number.parseInt(commandSummary.openDisputes ?? 0, 10) || 0,
          openDisputesLabel: commandSummary.openDisputesLabel || `${commandSummary.openDisputes ?? 0}`
        }
      }
    },
    charts: {
      escrowTrend: { buckets: escrowTrend },
      disputeBreakdown: { buckets: disputeBreakdown }
    },
    security: {
      signals: securitySignals,
      automationBacklog,
      connectors,
      summary: securitySummary,
      capabilities: {
        canManageSignals: Boolean(securityCapabilities.canManageSignals),
        canManageAutomation: Boolean(securityCapabilities.canManageAutomation),
        canManageConnectors: Boolean(securityCapabilities.canManageConnectors)
      }
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

function normaliseDisputeAttachment(attachment, index = 0, entryId = 'attachment') {
  if (!attachment) {
    return null;
  }

  if (typeof attachment === 'string') {
    const trimmed = attachment.trim();
    if (!trimmed) {
      return null;
    }
    return {
      id: `${entryId}-${index}`,
      label: trimmed,
      url: trimmed,
      type: 'link',
      thumbnail: null
    };
  }

  const url = typeof attachment.url === 'string' ? attachment.url.trim() : '';
  if (!url) {
    return null;
  }

  const label = typeof attachment.label === 'string' && attachment.label.trim().length > 0
    ? attachment.label.trim()
    : url;

  return {
    id: attachment.id ?? `${entryId}-${index}`,
    label,
    url,
    type: typeof attachment.type === 'string' ? attachment.type : 'link',
    thumbnail:
      typeof attachment.thumbnail === 'string' && attachment.thumbnail.trim().length > 0
        ? attachment.thumbnail.trim()
        : null
  };
}

function normaliseDisputeEntry(entry = {}, index = 0) {
  const attachments = ensureArray(entry.attachments)
    .map((item, attachmentIndex) => normaliseDisputeAttachment(item, attachmentIndex, entry.id ?? `entry-${index}`))
    .filter(Boolean);

  return {
    id: entry.id || null,
    bucketId: entry.bucketId || null,
    periodStart: entry.periodStart || null,
    periodEnd: entry.periodEnd || null,
    escalatedCount: Number.parseInt(entry.escalatedCount ?? 0, 10) || 0,
    resolvedCount: Number.parseInt(entry.resolvedCount ?? 0, 10) || 0,
    reopenedCount: Number.parseInt(entry.reopenedCount ?? 0, 10) || 0,
    backlogCount: Number.parseInt(entry.backlogCount ?? 0, 10) || 0,
    ownerNotes: entry.ownerNotes || '',
    attachments,
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
    createdBy: entry.createdBy || null,
    updatedBy: entry.updatedBy || null
  };
}

function normaliseDisputeBucket(bucket = {}, index = 0) {
  const entries = ensureArray(bucket.entries).map((entry, entryIndex) =>
    normaliseDisputeEntry(entry, entryIndex)
  );

  const latestEntry = bucket.latestEntry
    ? normaliseDisputeEntry(bucket.latestEntry, 0)
    : entries[0] ?? null;

  return {
    id: bucket.id || `bucket-${index}`,
    label: bucket.label || `Cadence bucket ${index + 1}`,
    cadence: bucket.cadence || 'Window',
    windowDurationHours: Number.parseInt(bucket.windowDurationHours ?? 24, 10) || 24,
    ownerName: bucket.ownerName || '',
    ownerRole: bucket.ownerRole || '',
    escalationContact: bucket.escalationContact || '',
    playbookUrl: bucket.playbookUrl || '',
    heroImageUrl: bucket.heroImageUrl || '',
    checklist: ensureArray(bucket.checklist).map((item) => String(item)),
    status: bucket.status || 'on_track',
    sortOrder: Number.parseInt(bucket.sortOrder ?? index, 10) || index,
    metrics: {
      latestResolutionRate: Number.parseFloat(bucket.metrics?.latestResolutionRate ?? 0) || 0,
      latestEscalated: Number.parseInt(bucket.metrics?.latestEscalated ?? 0, 10) || 0,
      latestResolved: Number.parseInt(bucket.metrics?.latestResolved ?? 0, 10) || 0,
      backlog: Number.parseInt(bucket.metrics?.backlog ?? 0, 10) || 0,
      trend: Number.parseFloat(bucket.metrics?.trend ?? 0) || 0
    },
    latestEntry,
    entries
  };
}

function normaliseDisputeHealthWorkspace(payload = {}) {
  const summary = {
    open: Number.parseInt(payload.summary?.open ?? 0, 10) || 0,
    underReview: Number.parseInt(payload.summary?.underReview ?? 0, 10) || 0,
    resolvedThisWindow: Number.parseInt(payload.summary?.resolvedThisWindow ?? 0, 10) || 0,
    openedThisWindow: Number.parseInt(payload.summary?.openedThisWindow ?? 0, 10) || 0,
    resolutionRate: Number.parseFloat(payload.summary?.resolutionRate ?? 0) || 0,
    backlogOlderThanTarget: Number.parseInt(payload.summary?.backlogOlderThanTarget ?? 0, 10) || 0,
    reopenedThisWindow: Number.parseInt(payload.summary?.reopenedThisWindow ?? 0, 10) || 0,
    windowStart: payload.summary?.windowStart || null,
    generatedAt: payload.summary?.generatedAt || new Date().toISOString()
  };

  const buckets = ensureArray(payload.buckets).map((bucket, index) =>
    normaliseDisputeBucket(bucket, index)
  );

  const insights = ensureArray(payload.insights).map((insight) => ({
    id: insight.id || null,
    label: insight.label || 'Cadence bucket',
    status: insight.status || 'on_track',
    latestResolutionRate: Number.parseFloat(insight.latestResolutionRate ?? 0) || 0,
    backlog: Number.parseInt(insight.backlog ?? 0, 10) || 0
  }));

  return {
    summary,
    buckets,
    insights
  };
}

function disputeHealthHistoryFallback() {
  return {
    bucket: null,
    entries: [],
    pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
    metrics: { latestResolutionRate: 0, latestEscalated: 0, latestResolved: 0, backlog: 0, trend: 0 }
  };
}

function normaliseDisputeHealthHistory(payload = {}) {
  const bucket = payload.bucket
    ? {
        id: payload.bucket.id || null,
        label: payload.bucket.label || 'Cadence bucket',
        cadence: payload.bucket.cadence || 'Window',
        status: payload.bucket.status || 'monitor',
        windowDurationHours: Number.parseInt(payload.bucket.windowDurationHours ?? 24, 10) || 24,
        ownerName: payload.bucket.ownerName || '',
        ownerRole: payload.bucket.ownerRole || '',
        escalationContact: payload.bucket.escalationContact || '',
        playbookUrl: payload.bucket.playbookUrl || '',
        heroImageUrl: payload.bucket.heroImageUrl || '',
        checklist: ensureArray(payload.bucket.checklist).map((item) => String(item))
      }
    : null;

  const entries = ensureArray(payload.entries).map((entry, index) => normaliseDisputeEntry(entry, index));

  const parsedTotal = Number.parseInt(payload.pagination?.total ?? entries.length, 10);
  const total = Number.isFinite(parsedTotal) && parsedTotal >= 0 ? parsedTotal : entries.length;
  const rawLimit = payload.pagination?.limit ?? (entries.length > 0 ? entries.length : 50);
  const parsedLimit = Number.parseInt(rawLimit, 10);
  const limitValue = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : entries.length > 0 ? entries.length : 50;
  const parsedOffset = Number.parseInt(payload.pagination?.offset ?? 0, 10);
  const offsetValue = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

  const pagination = {
    total,
    limit: limitValue,
    offset: offsetValue,
    hasMore: Boolean(payload.pagination?.hasMore)
  };

  const metrics = {
    latestResolutionRate: Number.parseFloat(payload.metrics?.latestResolutionRate ?? 0) || 0,
    latestEscalated: Number.parseInt(payload.metrics?.latestEscalated ?? 0, 10) || 0,
    latestResolved: Number.parseInt(payload.metrics?.latestResolved ?? 0, 10) || 0,
    backlog: Number.parseInt(payload.metrics?.backlog ?? 0, 10) || 0,
    trend: Number.parseFloat(payload.metrics?.trend ?? 0) || 0
  };

  return { bucket, entries, pagination, metrics };
}

function disputeHealthFallback() {
  return {
    summary: {
      open: 0,
      underReview: 0,
      resolvedThisWindow: 0,
      openedThisWindow: 0,
      resolutionRate: 0,
      backlogOlderThanTarget: 0,
      reopenedThisWindow: 0,
      windowStart: null,
      generatedAt: new Date().toISOString()
    },
    buckets: [],
    insights: []
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
      {
        label: 'MFA adoption',
        valueLabel: '96.4%',
        caption: 'Enterprise + provider portals',
        tone: 'success',
        statusLabel: 'On target',
        ownerRole: 'Security operations',
        runbookUrl: 'https://confluence.fixnado.com/runbooks/mfa-hardening',
        metricKey: 'mfa_adoption'
      },
      {
        label: 'Critical alerts',
        valueLabel: '0',
        caption: 'Security Operations Center overnight review',
        tone: 'success',
        statusLabel: 'No open alerts',
        ownerRole: 'Trust & safety',
        runbookUrl: 'https://confluence.fixnado.com/runbooks/critical-alerts',
        metricKey: 'critical_alerts_open'
      },
      {
        label: 'Audit log ingestion',
        valueLabel: '100%',
        caption: '24h ingestion completeness from Splunk',
        tone: 'info',
        statusLabel: 'Tracking plan',
        ownerRole: 'Platform engineering',
        runbookUrl: 'https://confluence.fixnado.com/runbooks/telemetry-pipeline-reset',
        metricKey: 'audit_ingestion_rate'
      }
    ],
    automationBacklog: [
      {
        id: 'auto-1',
        name: 'Escrow ledger reconciliation',
        status: 'Ready for QA',
        notes: 'Extends double-entry validation to rental deposits; requires finance sign-off.',
        tone: 'success',
        owner: 'Automation Guild',
        runbookUrl: 'https://confluence.fixnado.com/runbooks/escrow-ledger',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        signalKey: 'audit_ingestion_rate'
      },
      {
        id: 'auto-2',
        name: 'Compliance webhook retries',
        status: 'In progress',
        notes: 'Retries failed submissions to insurance partners with exponential backoff.',
        tone: 'info',
        owner: 'Compliance Ops',
        runbookUrl: 'https://confluence.fixnado.com/runbooks/compliance-retry-service',
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        signalKey: 'critical_alerts_open'
      },
      {
        id: 'auto-3',
        name: 'Dispute document summarisation',
        status: 'Planned',
        notes: 'Pilot with AI summarisation flagged for accuracy review before production rollout.',
        tone: 'warning',
        owner: 'Customer Advocacy',
        runbookUrl: null,
        dueAt: null,
        priority: 'urgent',
        signalKey: null
      }
    ],
    connectors: [
      {
        id: 'connector-1',
        name: 'Splunk Observability',
        status: 'healthy',
        description: 'Primary SIEM connector forwarding platform audit events.',
        connectorType: 'siem',
        region: 'eu-west-2',
        dashboardUrl: 'https://splunk.fixnado.com/app/sre/telemetry-overview',
        ingestionEndpoint: 'kinesis://splunk-audit',
        eventsPerMinuteTarget: 4800,
        eventsPerMinuteActual: 5120,
        lastHealthCheckAt: new Date().toISOString(),
        logoUrl: 'https://cdn.fixnado.com/logos/splunk.svg'
      },
      {
        id: 'connector-2',
        name: 'Azure Sentinel',
        status: 'warning',
        description: 'Regional SOC handoff for APAC enterprise tenants.',
        connectorType: 'siem',
        region: 'ap-southeast-2',
        dashboardUrl: 'https://portal.azure.com/#view/Microsoft_Azure_Security/SentinelMainBlade',
        ingestionEndpoint: 'eventhub://sentinel-apac',
        eventsPerMinuteTarget: 1800,
        eventsPerMinuteActual: 1540,
        lastHealthCheckAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        logoUrl: 'https://cdn.fixnado.com/logos/azure-sentinel.svg'
      }
    ],
    summary: {
      connectorsHealthy: 1,
      connectorsAttention: 1,
      automationOpen: 3,
      signalsWarning: 1,
      signalsDanger: 0
    },
    capabilities: {
      canManageSignals: true,
      canManageAutomation: true,
      canManageConnectors: true
    }
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
    timeline: {
      events: [
        {
          id: 'fallback-dsar',
          time: '08:30',
          event: 'GDPR DSAR pack exported',
          owner: 'Legal',
          ownerTeam: 'Privacy',
          status: 'Completed',
          category: 'compliance',
          summary: 'Evidence delivered to requester and archived in compliance vault.',
          attachments: [],
          occurredAt: null,
          dueAt: null,
          source: 'system',
          metadata: {}
        },
        {
          id: 'fallback-escrow',
          time: '09:45',
          event: 'Escrow reconciliation (daily)',
          owner: 'Finance Ops',
          ownerTeam: 'Finance',
          status: 'In progress',
          category: 'pipeline',
          summary: 'Validating settlement balances before release.',
          attachments: [],
          occurredAt: null,
          dueAt: null,
          source: 'system',
          metadata: {}
        },
        {
          id: 'fallback-onboarding',
          time: '11:00',
          event: 'Provider onboarding review',
          owner: 'Compliance Ops',
          ownerTeam: 'Compliance',
          status: 'Scheduled',
          category: 'compliance',
          summary: 'Reviewing high-risk provider onboarding artifacts.',
          attachments: [],
          occurredAt: null,
          dueAt: null,
          source: 'system',
          metadata: {}
        },
        {
          id: 'fallback-security',
          time: '14:30',
          event: 'Pen-test retest results review',
          owner: 'Security',
          ownerTeam: 'Security',
          status: 'Scheduled',
          category: 'security',
          summary: 'Confirming remediation of critical findings ahead of release.',
          attachments: [],
          occurredAt: null,
          dueAt: null,
          source: 'system',
          metadata: {}
        }
      ],
      summary: {
        countsByCategory: { compliance: 2, pipeline: 1, security: 1 },
        countsByStatus: { completed: 1, in_progress: 1, scheduled: 2 },
        manualCounts: {},
        manualStatusCounts: {},
        timeframe: '7d',
        timeframeLabel: '7 days',
        timezone: 'Europe/London',
        range: null,
        lastUpdated: null
      }
    }
  }
});

function normaliseProviderContact(contact = {}) {
  return {
    id: contact.id ?? `contact-${Math.random().toString(36).slice(2, 8)}`,
    name: contact.name ?? 'Provider contact',
    role: contact.role ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    type: contact.type ?? 'operations',
    isPrimary: Boolean(contact.isPrimary),
    notes: contact.notes ?? null,
    avatarUrl: contact.avatarUrl ?? null,
    createdAt: toDate(contact.createdAt),
    updatedAt: toDate(contact.updatedAt)
  };
}

function normaliseProviderCoverage(coverage = {}) {
  return {
    id: coverage.id ?? `coverage-${Math.random().toString(36).slice(2, 8)}`,
    zoneId: coverage.zoneId ?? coverage.zone?.id ?? 'zone',
    coverageType: coverage.coverageType ?? 'primary',
    coverageTypeLabel: coverage.coverageTypeLabel ?? coverage.coverageType ?? 'Primary',
    slaMinutes: toNumber(coverage.slaMinutes, 0),
    maxCapacity: toNumber(coverage.maxCapacity, 0),
    effectiveFrom: toDate(coverage.effectiveFrom),
    effectiveTo: toDate(coverage.effectiveTo),
    notes: coverage.notes ?? null,
    zone: coverage.zone
      ? {
          id: coverage.zone.id ?? coverage.zoneId ?? 'zone',
          name: coverage.zone.name ?? 'Coverage zone',
          companyId: coverage.zone.companyId ?? null
        }
      : null,
    createdAt: toDate(coverage.createdAt),
    updatedAt: toDate(coverage.updatedAt)
  };
}

function normaliseProviderDocument(document = {}) {
  return {
    id: document.id ?? `document-${Math.random().toString(36).slice(2, 8)}`,
    type: document.type ?? 'Document',
    status: document.status ?? 'submitted',
    fileName: document.fileName ?? 'document.pdf',
    fileSizeBytes: toNumber(document.fileSizeBytes, 0),
    mimeType: document.mimeType ?? 'application/pdf',
    issuedAt: toDate(document.issuedAt),
    expiryAt: toDate(document.expiryAt),
    submittedAt: toDate(document.submittedAt),
    reviewedAt: toDate(document.reviewedAt),
    reviewerId: document.reviewerId ?? null,
    rejectionReason: document.rejectionReason ?? null,
    metadata: document.metadata ?? {},
    downloadUrl: document.downloadUrl ?? null
  };
}

function normaliseProviderService(service = {}) {
  return {
    id: service.id ?? `service-${Math.random().toString(36).slice(2, 8)}`,
    title: service.title ?? 'Service',
    category: service.category ?? null,
    price: toNullableNumber(service.price),
    currency: service.currency ?? 'GBP',
    createdAt: toDate(service.createdAt),
    updatedAt: toDate(service.updatedAt)
  };
}

function normaliseAdminProviderDirectory(payload = {}) {
  const summary = payload.summary ?? {};
  const providers = ensureArray(payload.providers).map((provider) => ({
    id: provider.id ?? `provider-${Math.random().toString(36).slice(2, 8)}`,
    profileId: provider.profileId ?? null,
    displayName: provider.displayName ?? provider.tradingName ?? 'Provider',
    tradingName: provider.tradingName ?? provider.displayName ?? 'Provider',
    status: provider.status ?? 'prospect',
    statusLabel: provider.statusLabel ?? provider.status ?? 'Prospect',
    onboardingStage: provider.onboardingStage ?? 'intake',
    onboardingStageLabel: provider.onboardingStageLabel ?? provider.onboardingStage ?? 'Intake',
    tier: provider.tier ?? 'standard',
    tierLabel: provider.tierLabel ?? provider.tier ?? 'Standard',
    riskRating: provider.riskRating ?? 'medium',
    riskLabel: provider.riskLabel ?? provider.riskRating ?? 'Medium',
    supportEmail: provider.supportEmail ?? null,
    supportPhone: provider.supportPhone ?? null,
    coverageCount: toNumber(provider.coverageCount, 0),
    contactCount: toNumber(provider.contactCount, 0),
    servicesCount: toNumber(provider.servicesCount, 0),
    averageRating: toNumber(provider.averageRating, 0),
    jobsCompleted: toNumber(provider.jobsCompleted, 0),
    complianceScore: toNumber(provider.complianceScore, 0),
    verified: Boolean(provider.verified),
    insuredStatus: provider.insuredStatus ?? 'not_started',
    insuredStatusLabel: provider.insuredStatusLabel ?? provider.insuredStatus ?? 'Not started',
    insuredBadgeVisible: Boolean(provider.insuredBadgeVisible),
    storefrontSlug: provider.storefrontSlug ?? null,
    lastReviewAt: toDate(provider.lastReviewAt),
    updatedAt: toDate(provider.updatedAt),
    createdAt: toDate(provider.createdAt),
    region: provider.region ?? null
  }));

  return {
    summary: {
      total: toNumber(summary.total, providers.length),
      averageComplianceScore: toNumber(summary.averageComplianceScore, 0),
      lastUpdatedAt: toDate(summary.lastUpdatedAt),
      statusBreakdown: ensureArray(summary.statusBreakdown).map((entry) => ({
        value: entry.value ?? 'unknown',
        label: entry.label ?? (entry.value ?? 'Unknown'),
        count: toNumber(entry.count, 0)
      })),
      onboardingBreakdown: ensureArray(summary.onboardingBreakdown).map((entry) => ({
        value: entry.value ?? 'intake',
        label: entry.label ?? (entry.value ?? 'Intake'),
        count: toNumber(entry.count, 0)
      })),
      tierBreakdown: ensureArray(summary.tierBreakdown).map((entry) => ({
        value: entry.value ?? 'standard',
        label: entry.label ?? (entry.value ?? 'Standard'),
        count: toNumber(entry.count, 0)
      })),
      riskBreakdown: ensureArray(summary.riskBreakdown).map((entry) => ({
        value: entry.value ?? 'medium',
        label: entry.label ?? (entry.value ?? 'Medium'),
        count: toNumber(entry.count, 0)
      })),
      insuredBreakdown: ensureArray(summary.insuredBreakdown).map((entry) => ({
        value: entry.value ?? 'not_started',
        label: entry.label ?? (entry.value ?? 'Not started'),
        count: toNumber(entry.count, 0)
      }))
    },
    providers,
    pagination: {
      total: toNumber(payload.pagination?.total ?? summary.total ?? providers.length, providers.length),
      limit: toNumber(payload.pagination?.limit ?? providers.length, providers.length),
      offset: toNumber(payload.pagination?.offset ?? 0, 0),
      hasMore: Boolean(payload.pagination?.hasMore)
    },
    enums: {
      statuses: ensureArray(payload.enums?.statuses).map((option) => normaliseOption(option, 'prospect', 'Prospect')),
      onboardingStages: ensureArray(payload.enums?.onboardingStages).map((option) => normaliseOption(option, 'intake', 'Intake')),
      tiers: ensureArray(payload.enums?.tiers).map((option) => normaliseOption(option, 'standard', 'Standard')),
      riskLevels: ensureArray(payload.enums?.riskLevels).map((option) => normaliseOption(option, 'medium', 'Medium')),
      coverageTypes: ensureArray(payload.enums?.coverageTypes).map((option) => normaliseOption(option, 'primary', 'Primary')),
      insuredStatuses: ensureArray(payload.enums?.insuredStatuses).map((option) => normaliseOption(option, 'not_started', 'Not started')),
      regions: ensureArray(payload.enums?.regions).map((region) => ({
        id: region.id ?? region.code ?? `region-${Math.random().toString(36).slice(2, 8)}`,
        name: region.name ?? 'Region',
        code: region.code ?? null
      }))
    }
  };
}

function normaliseAdminProviderDetail(payload = {}) {
  const company = payload.company ?? {};
  const profile = payload.profile ?? {};

  return {
    company: {
      id: company.id ?? null,
      legalStructure: company.legalStructure ?? 'company',
      contactName: company.contactName ?? '',
      contactEmail: company.contactEmail ?? null,
      serviceRegions: company.serviceRegions ?? '',
      marketplaceIntent: company.marketplaceIntent ?? '',
      verified: Boolean(company.verified),
      insuredSellerStatus: company.insuredSellerStatus ?? 'not_started',
      insuredSellerBadgeVisible: Boolean(company.insuredSellerBadgeVisible),
      complianceScore: toNumber(company.complianceScore, 0),
      regionId: company.regionId ?? null,
      region: company.region
        ? {
            id: company.region.id ?? company.region.code ?? 'region',
            name: company.region.name ?? 'Region',
            code: company.region.code ?? null
          }
        : null
    },
    profile: {
      id: profile.id ?? null,
      displayName: profile.displayName ?? 'Provider',
      tradingName: profile.tradingName ?? profile.displayName ?? 'Provider',
      status: profile.status ?? 'prospect',
      onboardingStage: profile.onboardingStage ?? 'intake',
      tier: profile.tier ?? 'standard',
      riskRating: profile.riskRating ?? 'medium',
      supportEmail: profile.supportEmail ?? null,
      supportPhone: profile.supportPhone ?? null,
      websiteUrl: profile.websiteUrl ?? null,
      logoUrl: profile.logoUrl ?? null,
      heroImageUrl: profile.heroImageUrl ?? null,
      storefrontSlug: profile.storefrontSlug ?? null,
      operationsNotes: profile.operationsNotes ?? null,
      coverageNotes: profile.coverageNotes ?? null,
      averageRating: toNumber(profile.averageRating, 0),
      jobsCompleted: toNumber(profile.jobsCompleted, 0),
      lastReviewAt: toDate(profile.lastReviewAt),
      tags: Array.isArray(profile.tags) ? profile.tags : []
    },
    contacts: ensureArray(payload.contacts).map(normaliseProviderContact),
    coverage: ensureArray(payload.coverage).map(normaliseProviderCoverage),
    documents: ensureArray(payload.documents).map(normaliseProviderDocument),
    services: ensureArray(payload.services).map(normaliseProviderService),
    stats: {
      activeBookings: toNumber(payload.stats?.activeBookings, 0),
      completedBookings30d: toNumber(payload.stats?.completedBookings30d, 0),
      openDisputes: toNumber(payload.stats?.openDisputes, 0)
    },
    links: {
      storefront: payload.links?.storefront ?? null,
      dashboard: payload.links?.dashboard ?? null,
      compliance: payload.links?.compliance ?? null
    },
    enums: {
      statuses: ensureArray(payload.enums?.statuses).map((option) => normaliseOption(option, 'prospect', 'Prospect')),
      onboardingStages: ensureArray(payload.enums?.onboardingStages).map((option) => normaliseOption(option, 'intake', 'Intake')),
      tiers: ensureArray(payload.enums?.tiers).map((option) => normaliseOption(option, 'standard', 'Standard')),
      riskLevels: ensureArray(payload.enums?.riskLevels).map((option) => normaliseOption(option, 'medium', 'Medium')),
      coverageTypes: ensureArray(payload.enums?.coverageTypes).map((option) => normaliseOption(option, 'primary', 'Primary')),
      insuredStatuses: ensureArray(payload.enums?.insuredStatuses).map((option) => normaliseOption(option, 'not_started', 'Not started')),
      zones: ensureArray(payload.enums?.zones).map((zone) => ({
        id: zone.id ?? `zone-${Math.random().toString(36).slice(2, 8)}`,
        name: zone.name ?? 'Coverage zone',
        companyId: zone.companyId ?? null
      }))
    }
  };
}

const adminProviderDirectoryFallback = normaliseAdminProviderDirectory({
  summary: {
    total: 1,
    averageComplianceScore: 94.2,
    lastUpdatedAt: new Date().toISOString(),
    statusBreakdown: [{ value: 'active', label: 'Active', count: 1 }],
    onboardingBreakdown: [{ value: 'live', label: 'Live', count: 1 }],
    tierBreakdown: [{ value: 'strategic', label: 'Strategic', count: 1 }],
    riskBreakdown: [{ value: 'medium', label: 'Medium', count: 1 }],
    insuredBreakdown: [{ value: 'approved', label: 'Approved', count: 1 }]
  },
  providers: [
    {
      id: 'provider-metro-power',
      profileId: 'profile-metro-power',
      displayName: 'Metro Power Services',
      tradingName: 'Metro Power',
      status: 'active',
      statusLabel: 'Active',
      onboardingStage: 'live',
      onboardingStageLabel: 'Live',
      tier: 'strategic',
      tierLabel: 'Strategic',
      riskRating: 'medium',
      riskLabel: 'Medium',
      supportEmail: 'support@metro-power.example',
      supportPhone: '+44 20 7946 0000',
      coverageCount: 3,
      contactCount: 4,
      servicesCount: 6,
      averageRating: 4.9,
      jobsCompleted: 128,
      complianceScore: 96,
      verified: true,
      insuredStatus: 'approved',
      insuredStatusLabel: 'Approved',
      insuredBadgeVisible: true,
      storefrontSlug: 'metro-power-services',
      lastReviewAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      region: { id: 'region-london', name: 'London & South East', code: 'LDN' }
    }
  ],
  enums: {
    statuses: [
      { value: 'prospect', label: 'Prospect' },
      { value: 'onboarding', label: 'Onboarding' },
      { value: 'active', label: 'Active' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'archived', label: 'Archived' }
    ],
    onboardingStages: [
      { value: 'intake', label: 'Intake' },
      { value: 'documents', label: 'Document collection' },
      { value: 'compliance', label: 'Compliance review' },
      { value: 'go-live', label: 'Go-live preparation' },
      { value: 'live', label: 'Live' }
    ],
    tiers: [
      { value: 'standard', label: 'Standard' },
      { value: 'preferred', label: 'Preferred' },
      { value: 'strategic', label: 'Strategic' }
    ],
    riskLevels: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }
    ],
    coverageTypes: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'standby', label: 'Standby' }
    ],
    insuredStatuses: [
      { value: 'not_started', label: 'Not started' },
      { value: 'pending_documents', label: 'Pending documents' },
      { value: 'in_review', label: 'In review' },
      { value: 'approved', label: 'Approved' },
      { value: 'suspended', label: 'Suspended' }
    ],
    regions: [{ id: 'region-london', name: 'London & South East', code: 'LDN' }]
  },
  pagination: { total: 1, limit: 50, offset: 0, hasMore: false }
});

const adminProviderDetailFallback = normaliseAdminProviderDetail({
  company: {
    id: 'provider-metro-power',
    legalStructure: 'Ltd',
    contactName: 'Jordan Miles',
    contactEmail: 'ops@metro-power.example',
    serviceRegions: 'London & South East',
    marketplaceIntent: 'Critical power response',
    verified: true,
    insuredSellerStatus: 'approved',
    insuredSellerBadgeVisible: true,
    complianceScore: 96,
    regionId: 'region-london',
    region: { id: 'region-london', name: 'London & South East', code: 'LDN' }
  },
  profile: {
    id: 'profile-metro-power',
    displayName: 'Metro Power Services',
    tradingName: 'Metro Power',
    status: 'active',
    onboardingStage: 'live',
    tier: 'strategic',
    riskRating: 'medium',
    supportEmail: 'support@metro-power.example',
    supportPhone: '+44 20 7946 0000',
    websiteUrl: 'https://metro-power.example',
    logoUrl: 'https://cdn.fixnado.example/providers/metro-power/logo.svg',
    heroImageUrl: 'https://cdn.fixnado.example/providers/metro-power/hero.jpg',
    storefrontSlug: 'metro-power-services',
    operationsNotes: 'Maintains 4-person on-call rotation. Escalations routed via Slack #metro-power.',
    coverageNotes: 'Primary coverage across Central and Thames Valley zones.',
    averageRating: 4.9,
    jobsCompleted: 128,
    lastReviewAt: new Date().toISOString(),
    tags: ['electrical', 'critical-response', 'strategic']
  },
  contacts: [
    {
      id: 'contact-ops',
      name: 'Amelia Roberts',
      role: 'Operations Lead',
      email: 'amelia.roberts@example.com',
      phone: '+44 20 7946 1122',
      type: 'operations',
      isPrimary: true,
      notes: 'Escalations 06:00-18:00 GMT'
    },
    {
      id: 'contact-finance',
      name: 'Liam Patel',
      role: 'Finance Manager',
      email: 'liam.patel@example.com',
      phone: '+44 20 7946 2233',
      type: 'finance',
      isPrimary: false
    }
  ],
  coverage: [
    {
      id: 'coverage-central',
      zoneId: 'zone-central',
      coverageType: 'primary',
      coverageTypeLabel: 'Primary',
      slaMinutes: 180,
      maxCapacity: 12,
      effectiveFrom: new Date().toISOString(),
      notes: 'Priority window 06:00–22:00',
      zone: { id: 'zone-central', name: 'Central District', companyId: 'provider-metro-power' }
    },
    {
      id: 'coverage-east',
      zoneId: 'zone-east',
      coverageType: 'secondary',
      coverageTypeLabel: 'Secondary',
      slaMinutes: 240,
      maxCapacity: 8,
      zone: { id: 'zone-east', name: 'East Borough', companyId: 'provider-metro-power' }
    }
  ],
  documents: [
    {
      id: 'doc-insurance',
      type: 'Insurance certificate',
      status: 'approved',
      fileName: 'public-liability.pdf',
      fileSizeBytes: 120483,
      mimeType: 'application/pdf',
      issuedAt: new Date().toISOString(),
      expiryAt: new Date(Date.now() + 12096e5).toISOString(),
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewerId: 'compliance-ops',
      metadata: { coverage: '£5m', provider: 'Allied Insurance' },
      downloadUrl: '/api/v1/compliance/documents/doc-insurance/download'
    }
  ],
  services: [
    {
      id: 'service-critical',
      title: 'Critical electrical maintenance',
      category: 'Facilities',
      price: 480,
      currency: 'GBP',
      createdAt: new Date().toISOString()
    },
    {
      id: 'service-generator',
      title: 'Generator health check',
      category: 'Infrastructure',
      price: 320,
      currency: 'GBP',
      createdAt: new Date().toISOString()
    }
  ],
  stats: { activeBookings: 3, completedBookings30d: 18, openDisputes: 0 },
  links: {
    storefront: '/providers/metro-power-services',
    dashboard: '/provider/dashboard?companyId=provider-metro-power',
    compliance: '/admin/compliance?companyId=provider-metro-power'
  },
  enums: {
    statuses: [
      { value: 'prospect', label: 'Prospect' },
      { value: 'onboarding', label: 'Onboarding' },
      { value: 'active', label: 'Active' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'archived', label: 'Archived' }
    ],
    onboardingStages: [
      { value: 'intake', label: 'Intake' },
      { value: 'documents', label: 'Document collection' },
      { value: 'compliance', label: 'Compliance review' },
      { value: 'go-live', label: 'Go-live preparation' },
      { value: 'live', label: 'Live' }
    ],
    tiers: [
      { value: 'standard', label: 'Standard' },
      { value: 'preferred', label: 'Preferred' },
      { value: 'strategic', label: 'Strategic' }
    ],
    riskLevels: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }
    ],
    coverageTypes: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'standby', label: 'Standby' }
    ],
    insuredStatuses: [
      { value: 'not_started', label: 'Not started' },
      { value: 'pending_documents', label: 'Pending documents' },
      { value: 'in_review', label: 'In review' },
      { value: 'approved', label: 'Approved' },
      { value: 'suspended', label: 'Suspended' }
    ],
    zones: [
      { id: 'zone-central', name: 'Central District', companyId: 'provider-metro-power' },
      { id: 'zone-east', name: 'East Borough', companyId: 'provider-metro-power' }
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
  toolSales: {
    summary: {
      totalListings: 1,
      draft: 0,
      published: 1,
      suspended: 0,
      totalQuantity: 6,
      activeCoupons: 1
    },
    listings: [
      {
        name: 'Thermal imaging kit',
        tagline: 'Featured diagnostics kit',
        description: 'Handheld 640x480 thermal imaging kit with live telemetry integration and concierge logistics.',
        heroImageUrl: 'https://cdn.fixnado.test/tools/thermal.jpg',
        showcaseVideoUrl: 'https://cdn.fixnado.test/tools/thermal.mp4',
        galleryImages: [
          'https://cdn.fixnado.test/tools/thermal-1.jpg',
          'https://cdn.fixnado.test/tools/thermal-2.jpg'
        ],
        tags: ['thermal', 'diagnostics'],
        keywordTags: ['infrared', 'inspection'],
        listing: {
          status: 'approved',
          availability: 'both',
          pricePerDay: 140,
          purchasePrice: 1850,
          insuredOnly: true,
          location: 'London Docklands'
        },
        inventory: {
          quantityOnHand: 6,
          quantityReserved: 1,
          safetyStock: 1,
          conditionRating: 'excellent'
        },
        coupons: [
          {
            name: 'Spring diagnostics',
            code: 'THERM10',
            status: 'active',
            discountType: 'percentage',
            discountValue: 10,
            currency: 'GBP'
          }
        ],
        metrics: {
          quantityAvailable: 5,
          activeCoupons: 1
        }
      }
    ]
  },
  servicemen: [
    { name: 'Amina Khan', role: 'Lead Electrical Engineer', availability: 0.68, rating: 0.99 },
    { name: 'Owen Davies', role: 'HVAC Specialist', availability: 0.54, rating: 0.94 },
    { name: 'Sophie Chen', role: 'Compliance Coordinator', availability: 0.87, rating: 0.92 }
  ],
  serviceDelivery: {
    health: [
      { id: 'sla', label: 'SLA adherence', value: 0.97, format: 'percent', caption: 'Trailing 30 days' },
      { id: 'utilisation', label: 'Crew utilisation', value: 0.82, format: 'percent', caption: 'Live schedule coverage' },
      { id: 'incidents', label: 'Open incidents', value: 2, format: 'number', caption: 'Requires triage review' }
    ],
    board: [
      {
        id: 'intake',
        title: 'Intake & triage',
        items: [
          {
            id: 'triage-1',
            name: 'Riverside Campus UPS review',
            client: 'Finova HQ',
            zone: 'City of London',
            eta: new Date(Date.now() + 5400000).toISOString(),
            owner: 'Service desk',
            risk: 'on-track',
            services: ['Electrical'],
            value: 3200
          }
        ]
      },
      {
        id: 'scheduled',
        title: 'Scheduled',
        items: [
          {
            id: 'scheduled-1',
            name: 'Smart IoT retrofit pilot',
            client: 'Northbank Serviced Offices',
            zone: 'Westminster',
            eta: new Date(Date.now() + 86400000).toISOString(),
            owner: 'Programme PMO',
            risk: 'on-track',
            services: ['IoT', 'Electrical'],
            value: 14800
          },
          {
            id: 'scheduled-2',
            name: 'Emergency HVAC replacement',
            client: 'Thames Court',
            zone: 'City of London',
            eta: new Date(Date.now() + 172800000).toISOString(),
            owner: 'HVAC crew',
            risk: 'warning',
            services: ['HVAC'],
            value: 9200
          }
        ]
      },
      {
        id: 'in-flight',
        title: 'In delivery',
        items: [
          {
            id: 'delivery-1',
            name: 'Battery string modernisation',
            client: 'Albion Workspace Group',
            zone: 'Docklands',
            eta: new Date(Date.now() + 21600000).toISOString(),
            owner: 'Critical power crew',
            risk: 'on-track',
            services: ['Electrical'],
            value: 18600
          }
        ]
      },
      {
        id: 'qa',
        title: 'Verification',
        items: [
          {
            id: 'qa-1',
            name: 'Sustainable retrofit programme',
            client: 'Canary Wharf Holdings',
            zone: 'Canary Wharf',
            eta: new Date(Date.now() + 259200000).toISOString(),
            owner: 'Quality & compliance',
            risk: 'on-track',
            services: ['Electrical', 'HVAC'],
            value: 24800
          }
        ]
      }
    ]
  },
  servicePackages: [
    {
      id: 'critical-response',
      name: 'Critical response retainer',
      description: '24/7 dispatch with under-45 minute arrival SLA, telemetry reporting, and quarterly compliance reviews.',
      price: 5400,
      currency: 'GBP',
      highlights: ['45-minute urban SLA', 'Escrow-backed milestone billing', 'Telemetry dashboard access'],
      serviceId: 'critical-power-maintenance',
      serviceName: 'Critical power maintenance'
    },
    {
      id: 'retrofit',
      name: 'Sustainable retrofit programme',
      description: 'Energy optimisation with IoT sensor network, HVAC upgrades, and capital project governance.',
      price: 12400,
      currency: 'GBP',
      highlights: ['IoT monitoring stack', 'Dedicated programme manager', 'Regulatory submission support'],
      serviceId: 'iot-retrofit',
      serviceName: 'IoT retrofit & analytics'
    }
  ],
  serviceCategories: [
    {
      slug: 'critical-power',
      label: 'Critical power',
      type: 'trade-services',
      description: 'High-availability electrical services for trading floors and data centres.',
      activeServices: 4,
      performance: 0.98
    },
    {
      slug: 'hvac-emergency',
      label: 'HVAC emergency response',
      type: 'trade-services',
      description: 'Rapid deployment HVAC crews with telemetry-backed reporting.',
      activeServices: 3,
      performance: 0.95
    },
    {
      slug: 'smart-retrofit',
      label: 'Smart retrofit',
      type: 'professional-services',
      description: 'IoT, analytics, and sustainability programmes for enterprise estates.',
      activeServices: 5,
      performance: 0.92
    }
  ],
  serviceCatalogue: [
    {
      id: 'critical-power-maintenance',
      name: 'Critical power maintenance',
      description: 'Preventative UPS servicing, battery refresh programmes, and load testing.',
      category: 'Critical power',
      type: 'Trade services',
      price: 4200,
      currency: 'GBP',
      availability: { status: 'open', label: 'Available now', detail: '' },
      tags: ['UPS', 'Battery testing', '24/7 dispatch'],
      coverage: ['London', 'Essex', 'Kent']
    },
    {
      id: 'hvac-emergency',
      name: 'HVAC emergency call-out',
      description: 'Rapid-response HVAC crew with telemetry logging and compliance reporting.',
      category: 'HVAC emergency response',
      type: 'Trade services',
      price: 1850,
      currency: 'GBP',
      availability: { status: 'scheduled', label: 'Scheduled', detail: new Date(Date.now() + 86400000).toISOString() },
      tags: ['Emergency', '24/7'],
      coverage: ['City of London', 'Westminster']
    },
    {
      id: 'iot-retrofit',
      name: 'IoT retrofit & analytics',
      description: 'End-to-end smart building retrofit programme with analytics and governance.',
      category: 'Smart retrofit',
      type: 'Professional services',
      price: 14800,
      currency: 'GBP',
      availability: { status: 'open', label: 'Availability on request', detail: '' },
      tags: ['IoT', 'Analytics', 'Sustainability'],
      coverage: ['Docklands', 'Canary Wharf']
    }
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

const storefrontWorkspaceFallback = normaliseProviderStorefrontWorkspace({
  storefront: {
    id: 'demo-storefront',
    companyId: 'metro-power-services',
    name: 'Metro Power Services Storefront',
    slug: 'metro-power-services',
    tagline: 'Trusted electrical resilience partners',
    description:
      'Operate your storefront with confidence. Update hero imagery, contact details, and compliance badges from one control centre.',
    heroImageUrl: '/media/storefront/metro-power-hero.jpg',
    contactEmail: 'hello@metropower.example',
    contactPhone: '+44 20 7946 0010',
    primaryColor: '#0f172a',
    accentColor: '#38bdf8',
    status: 'live',
    isPublished: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    reviewRequired: false,
    metadata: {}
  },
  inventory: [
    {
      id: 'inventory-1',
      storefrontId: 'demo-storefront',
      sku: 'GEN-13KVA',
      name: '13kVA generator kit',
      summary: 'Escrow-backed generator with logistics concierge.',
      description: 'Includes ATS switchgear, telemetry sensors, and 24/7 dispatch readiness.',
      priceAmount: 420,
      priceCurrency: 'GBP',
      stockOnHand: 4,
      reorderPoint: 1,
      restockAt: null,
      visibility: 'public',
      featured: true,
      imageUrl: '/media/storefront/inventory-generator.jpg',
      metadata: { category: 'Critical power', insuranceRequired: true }
    },
    {
      id: 'inventory-2',
      storefrontId: 'demo-storefront',
      sku: 'HVAC-TUNE',
      name: 'HVAC telemetry kit',
      summary: 'SaaS-connected telemetry module for HVAC systems.',
      description: 'Installs in under two hours with remote monitoring and alerting.',
      priceAmount: 260,
      priceCurrency: 'GBP',
      stockOnHand: 7,
      reorderPoint: 2,
      restockAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      visibility: 'public',
      featured: false,
      imageUrl: '/media/storefront/inventory-hvac.jpg',
      metadata: { category: 'HVAC', certifications: ['F-Gas Category 1'] }
    },
    {
      id: 'inventory-3',
      storefrontId: 'demo-storefront',
      sku: 'ROOF-KIT',
      name: 'Roof access safety kit',
      summary: 'Full fall-arrest kit with telemetry enabled anchor points.',
      description: 'Restore marketplace visibility by closing out outstanding safety findings.',
      priceAmount: 120,
      priceCurrency: 'GBP',
      stockOnHand: 1,
      reorderPoint: 2,
      restockAt: null,
      visibility: 'archived',
      featured: false,
      imageUrl: '/media/storefront/inventory-roof.jpg',
      metadata: { category: 'Safety', status: 'awaiting_inspection' }
    }
  ],
  coupons: [
    {
      id: 'coupon-1',
      storefrontId: 'demo-storefront',
      code: 'WELCOME10',
      name: 'Welcome 10%',
      description: 'Applies to new enterprise storefront orders booked this quarter.',
      discountType: 'percentage',
      discountValue: 10,
      minOrderTotal: 500,
      maxDiscountValue: 1500,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      usageLimit: 25,
      usageCount: 6,
      status: 'active',
      appliesTo: 'All generator rentals',
      metadata: { channel: 'enterprise' }
    },
    {
      id: 'coupon-2',
      storefrontId: 'demo-storefront',
      code: 'FLEET25',
      name: 'Fleet bundle £250 off',
      description: 'Fixed discount on HVAC telemetry bundles booked in a single order.',
      discountType: 'fixed',
      discountValue: 250,
      minOrderTotal: 1500,
      maxDiscountValue: null,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      usageLimit: null,
      usageCount: 2,
      status: 'scheduled',
      appliesTo: 'HVAC telemetry kit',
      metadata: { channel: 'campaign' }
    }
  ],
  inventoryMeta: {
    total: 3,
    published: 2,
    archived: 1,
    lowStock: 1
  },
  couponMeta: {
    total: 2,
    active: 1,
    expiringSoon: 1
  }
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
  ],
  operations: {
    coverage: [
      {
        id: 'london-core',
        region: 'London core',
        uptime: 0.982,
        activeSites: 18,
        automationScore: 0.78,
        incidents: 1,
        primaryService: 'Critical power'
      },
      {
        id: 'northern-hub',
        region: 'Northern hub',
        uptime: 0.976,
        activeSites: 11,
        automationScore: 0.71,
        incidents: 0,
        primaryService: 'Smart HVAC'
      },
      {
        id: 'southern-campus',
        region: 'Southern campus',
        uptime: 0.988,
        activeSites: 9,
        automationScore: 0.69,
        incidents: 2,
        primaryService: 'Retrofit'
      }
    ],
    automation: {
      orchestrationRate: 0.84,
      runbookCoverage: 0.72,
      automationsLive: 26,
      nextReview: new Date(Date.now() + 1209600000).toISOString(),
      runbooks: [
        { id: 'dispatch', name: 'Dispatch orchestration', adoption: 0.86, owner: 'Ops automation' },
        { id: 'escalations', name: 'Incident escalation', adoption: 0.74, owner: 'Security' },
        { id: 'vendor-onboarding', name: 'Vendor onboarding', adoption: 0.63, owner: 'Supply chain' }
      ]
    },
    sustainability: {
      carbonYtd: 1180,
      carbonTarget: 1620,
      renewableCoverage: 0.64,
      emissionTrend: 'down'
    },
    actionCentre: [
      {
        id: 'ops-1',
        title: 'Confirm generator load tests',
        detail: 'Share telemetry artefacts before the risk council meets on Friday.',
        due: new Date(Date.now() + 172800000).toISOString(),
        owner: 'Operations',
        severity: 'high'
      },
      {
        id: 'ops-2',
        title: 'Approve automation pilot scope',
        detail: 'Automation guild awaiting sign-off for robotics cleaning rollout.',
        due: new Date(Date.now() + 345600000).toISOString(),
        owner: 'Automation PMO',
        severity: 'medium'
      },
      {
        id: 'ops-3',
        title: 'Upload safety certificates',
        detail: 'Final two southern campus certificates pending upload to governance vault.',
        due: null,
        owner: 'Facilities',
        severity: 'medium'
      }
    ]
  },
  governance: {
    complianceScore: 0.93,
    posture: 'proactive',
    dataResidency: 'UK & EU primary, NA secondary',
    audits: [
      {
        id: 'audit-1',
        name: 'ISO 27001 surveillance',
        due: new Date(Date.now() + 2419200000).toISOString(),
        status: 'scheduled',
        owner: 'Security assurance'
      },
      {
        id: 'audit-2',
        name: 'Fire safety portfolio review',
        due: new Date(Date.now() + 1296000000).toISOString(),
        status: 'preparation',
        owner: 'Facilities risk'
      }
    ],
    riskRegister: [
      {
        id: 'risk-1',
        label: 'Cooling redundancy at Canary Wharf',
        severity: 'high',
        owner: 'Engineering',
        due: new Date(Date.now() + 604800000).toISOString(),
        mitigation: 'Install temporary chiller and reroute load.'
      },
      {
        id: 'risk-2',
        label: 'Vendor onboarding backlog',
        severity: 'medium',
        owner: 'Supply chain',
        due: null,
        mitigation: 'Deploy automation runbook for document collection.'
      }
    ]
  },
  roadmap: [
    {
      id: 'milestone-1',
      milestone: 'Complete robotics cleaning expansion',
      quarter: 'Q2 2025',
      status: 'in-flight',
      owner: 'Automation guild',
      detail: 'Deploy robotics pilots to 12 additional facilities.'
    },
    {
      id: 'milestone-2',
      milestone: 'Launch sustainability command centre',
      quarter: 'Q3 2025',
      status: 'planned',
      owner: 'Sustainability office',
      detail: 'Real-time carbon dashboards and supplier scoring.'
    },
    {
      id: 'milestone-3',
      milestone: 'Board readiness for NA expansion',
      quarter: 'Q4 2025',
      status: 'planned',
      owner: 'Executive office',
      detail: 'Investment memo, staffing model, and compliance posture.'
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
  bannerStyles: [
    {
      id: 'impact-gradient',
      name: 'Impact gradient hero',
      description: 'Immersive gradient with luminous accent flare designed for enterprise showcases.',
      layout: 'full-bleed-gradient',
      recommendedUse: 'Use for flagship campaigns and enterprise onboarding moments.',
      preview: '/media/metro-power/banner-impact.jpg',
      palette: {
        background: '#0B1D3A',
        accent: '#1F4ED8',
        highlight: '#00BFA6',
        text: '#FFFFFF'
      },
      supportsVideo: true,
      supportsCarousel: true,
      textTone: 'light',
      badges: ['Escrow-backed CTA', 'Video overlay ready']
    },
    {
      id: 'precision-overlay',
      name: 'Precision overlay',
      description: 'Crisp photography treatment with translucent navy overlay and elevated typography lockup.',
      layout: 'image-overlay',
      recommendedUse: 'Best for operational updates and photographic storytelling across facilities.',
      preview: '/media/metro-power/banner-precision.jpg',
      palette: {
        background: '#0B1D3A',
        accent: '#152A52',
        highlight: '#1F4ED8',
        text: '#FFFFFF'
      },
      supportsVideo: false,
      supportsCarousel: true,
      textTone: 'light',
      badges: ['Photography safe', 'KPI ticker ready']
    },
    {
      id: 'elevated-minimal',
      name: 'Elevated minimal',
      description: 'Minimalist split layout with generous whitespace and accent underline for executive briefings.',
      layout: 'split-minimal',
      recommendedUse: 'Ideal for executive briefings, compliance renewals, and calm storytelling moments.',
      preview: '/media/metro-power/banner-minimal.jpg',
      palette: {
        background: '#F4F7FA',
        accent: '#0B1D3A',
        highlight: '#1F4ED8',
        text: '#0F172A'
      },
      supportsVideo: false,
      supportsCarousel: false,
      textTone: 'dark',
      badges: ['Accessibility AAA', 'Mobile parity certified']
    }
  ],
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
  styleGuide: {
    palette: {
      primary: '#0B1D3A',
      accent: '#1F4ED8',
      highlight: '#00BFA6',
      neutral: '#F4F7FA',
      text: '#FFFFFF'
    },
    typography: {
      heading: 'Inter SemiBold',
      body: 'Inter Regular'
    }
  },
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

function cacheDisputeHealthWorkspace(payload) {
  const normalised = normaliseDisputeHealthWorkspace(payload);
  const expires = Date.now() + DISPUTE_HEALTH_CACHE_TTL;
  memoryCache.set(DISPUTE_HEALTH_CACHE_KEY, { data: normalised, expires });
  writeStorage(DISPUTE_HEALTH_CACHE_KEY, normalised, DISPUTE_HEALTH_CACHE_TTL);
  return normalised;
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

export const getAdminProviderDirectory = withFallback(
  normaliseAdminProviderDirectory,
  adminProviderDirectoryFallback,
  (options = {}) => {
    const query = toQueryString({
      status: options?.status,
      search: options?.search,
      limit: options?.limit,
      offset: options?.offset
    });
    const cacheKeySuffix = query ? `:${query.slice(1)}` : '';
    return request(`/admin/providers${query}`, {
      cacheKey: `admin-providers${cacheKeySuffix}`,
      ttl: 15000,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    });
  }
);

export const getAdminProviderDetail = withFallback(
  normaliseAdminProviderDetail,
  adminProviderDetailFallback,
  (options = {}) => {
    const companyId = options?.companyId;
    if (!companyId) {
      throw new PanelApiError('Provider identifier required', 400);
    }
    return request(`/admin/providers/${encodeURIComponent(companyId)}`, {
      cacheKey: `admin-provider:${companyId}`,
      ttl: 15000,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    });
  }
);

export const getDisputeHealthWorkspace = withFallback(
  normaliseDisputeHealthWorkspace,
  disputeHealthFallback(),
  (options = {}) =>
    request('/admin/disputes/health', {
      cacheKey: DISPUTE_HEALTH_CACHE_KEY,
      ttl: DISPUTE_HEALTH_CACHE_TTL,
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    })
);

export const getDisputeHealthBucketHistory = withFallback(
  normaliseDisputeHealthHistory,
  disputeHealthHistoryFallback(),
  (options = {}) => {
    if (!options?.bucketId) {
      throw new Error('bucketId is required to load dispute history');
    }
    const query = toQueryString({ limit: options.limit, offset: options.offset });
    return request(
      `/admin/disputes/health/buckets/${encodeURIComponent(options.bucketId)}/history${query}`,
      {
        cacheKey: `${DISPUTE_HEALTH_CACHE_KEY}:history:${options.bucketId}${query}`,
        ttl: 5000,
        forceRefresh: options?.forceRefresh,
        signal: options?.signal
      }
    );
  }
);

export async function createDisputeHealthBucket(payload) {
  const { data } = await request('/admin/disputes/health/buckets', {
    method: 'POST',
    body: payload,
    forceRefresh: true
  });
  return cacheDisputeHealthWorkspace(data);
}

export async function updateDisputeHealthBucket(bucketId, payload) {
  const { data } = await request(`/admin/disputes/health/buckets/${encodeURIComponent(bucketId)}`, {
    method: 'PUT',
    body: payload,
    forceRefresh: true
  });
  return cacheDisputeHealthWorkspace(data);
}

export async function archiveDisputeHealthBucket(bucketId) {
  const { data } = await request(`/admin/disputes/health/buckets/${encodeURIComponent(bucketId)}`, {
    method: 'DELETE',
    forceRefresh: true
  });
  return cacheDisputeHealthWorkspace(data);
}

export async function createDisputeHealthEntry(payload) {
  const { data } = await request('/admin/disputes/health/entries', {
    method: 'POST',
    body: payload,
    forceRefresh: true
  });
  return cacheDisputeHealthWorkspace(data);
}

export async function updateDisputeHealthEntry(entryId, payload) {
  const { data } = await request(`/admin/disputes/health/entries/${encodeURIComponent(entryId)}`, {
    method: 'PUT',
    body: payload,
    forceRefresh: true
  });
  return cacheDisputeHealthWorkspace(data);
}

export async function deleteDisputeHealthEntry(entryId) {
  const { data } = await request(`/admin/disputes/health/entries/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
    forceRefresh: true
  });
  return cacheDisputeHealthWorkspace(data);
}

export function listAdminAuditEvents({ timeframe = '7d', category, status, signal, forceRefresh = false } = {}) {
  const query = toQueryString({ timeframe, category, status });
  return request(`/admin/audit/events${query}`, {
    cacheKey: `admin-audit-events:${timeframe}:${category ?? 'all'}:${status ?? 'all'}`,
    ttl: 10000,
    signal,
    forceRefresh
  });
}

export function createAdminAuditEvent(event, { signal } = {}) {
  return request('/admin/audit/events', {
    method: 'POST',
    body: JSON.stringify(event),
    headers: { 'Content-Type': 'application/json' },
    signal,
    cacheKey: null
  });
}

export function updateAdminAuditEvent(eventId, payload, { signal } = {}) {
  return request(`/admin/audit/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    signal,
    cacheKey: null
  });
}

export function deleteAdminAuditEvent(eventId, { signal } = {}) {
  return request(`/admin/audit/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    signal,
    cacheKey: null
  });
}

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
      headers: {
        'X-Fixnado-Role': options?.role ?? 'company',
        'X-Fixnado-Persona': options?.persona ?? 'provider'
      },
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    });
  }
);

function buildStorefrontHeaders(options = {}, includeContentType = false) {
  const headers = {
    'X-Fixnado-Role': options?.role ?? 'company',
    'X-Fixnado-Persona': options?.persona ?? 'provider'
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export const getProviderStorefrontWorkspace = withFallback(
  normaliseProviderStorefrontWorkspace,
  storefrontWorkspaceFallback,
  (options = {}) => {
    const query = toQueryString({ companyId: options?.companyId });
    const cacheKeySuffix = query ? `:${query.slice(1)}` : '';
    return request(`/panel/provider/storefront/workspace${query}`, {
      cacheKey: `provider-storefront-workspace${cacheKeySuffix}`,
      ttl: 20000,
      headers: buildStorefrontHeaders(options),
      forceRefresh: options?.forceRefresh,
      signal: options?.signal
    });
  }
);

export async function updateProviderStorefrontSettings(payload, options = {}) {
  const query = toQueryString({ companyId: options?.companyId });
  const response = await request(`/panel/provider/storefront/settings${query}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: buildStorefrontHeaders(options, true),
    cacheKey: null,
    forceRefresh: true
  });

  const storefront = response?.data ?? response;
  return normaliseStorefrontSettings(storefront);
}

export async function createProviderStorefrontInventory(payload, options = {}) {
  const query = toQueryString({ companyId: options?.companyId });
  const response = await request(`/panel/provider/storefront/inventory${query}`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: buildStorefrontHeaders(options, true),
    cacheKey: null,
    forceRefresh: true
  });

  const inventory = response?.data ?? response;
  return normaliseStorefrontInventory(inventory);
}

export async function updateProviderStorefrontInventory(inventoryId, payload, options = {}) {
  if (!inventoryId) {
    throw new PanelApiError('Inventory identifier required', 400);
  }

  const query = toQueryString({ companyId: options?.companyId });
  const response = await request(`/panel/provider/storefront/inventory/${encodeURIComponent(inventoryId)}${query}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: buildStorefrontHeaders(options, true),
    cacheKey: null,
    forceRefresh: true
  });

  const inventory = response?.data ?? response;
  return normaliseStorefrontInventory(inventory);
}

export async function archiveProviderStorefrontInventory(inventoryId, options = {}) {
  if (!inventoryId) {
    throw new PanelApiError('Inventory identifier required', 400);
  }

  const query = toQueryString({ companyId: options?.companyId });
  const response = await request(`/panel/provider/storefront/inventory/${encodeURIComponent(inventoryId)}${query}`, {
    method: 'DELETE',
    headers: buildStorefrontHeaders(options),
    cacheKey: null,
    forceRefresh: true
  });

  return response?.data ?? response;
}

export async function createProviderStorefrontCoupon(payload, options = {}) {
  const query = toQueryString({ companyId: options?.companyId });
  const response = await request(`/panel/provider/storefront/coupons${query}`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: buildStorefrontHeaders(options, true),
    cacheKey: null,
    forceRefresh: true
  });

  const coupon = response?.data ?? response;
  return normaliseStorefrontCoupon(coupon);
}

export async function updateProviderStorefrontCoupon(couponId, payload, options = {}) {
  if (!couponId) {
    throw new PanelApiError('Coupon identifier required', 400);
  }

  const query = toQueryString({ companyId: options?.companyId });
  const response = await request(`/panel/provider/storefront/coupons/${encodeURIComponent(couponId)}${query}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: buildStorefrontHeaders(options, true),
    cacheKey: null,
    forceRefresh: true
  });

  const coupon = response?.data ?? response;
  return normaliseStorefrontCoupon(coupon);
}

export async function updateProviderStorefrontCouponStatus(couponId, status, options = {}) {
  if (!couponId) {
    throw new PanelApiError('Coupon identifier required', 400);
  }

  const query = toQueryString({ companyId: options?.companyId });
  const response = await request(`/panel/provider/storefront/coupons/${encodeURIComponent(couponId)}/status${query}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: buildStorefrontHeaders(options, true),
    cacheKey: null,
    forceRefresh: true
  });

  return response?.data ?? response;
}

function invalidateProviderCache(companyId) {
  const keys = ['admin-providers'];
  if (companyId) {
    keys.push(`admin-provider:${companyId}`);
  }
  clearPanelCache(keys);
}

export async function getProviderToolSales(options = {}) {
  const response = await request('/panel/provider/tools', {
    cacheKey: 'provider-tool-sales',
    ttl: 15000,
    forceRefresh: options?.forceRefresh,
    signal: options?.signal
  });
  return {
    data: normaliseToolSales(response.data ?? response),
    meta: response.meta ?? {}
  };
}

export async function createProviderToolSale(payload, options = {}) {
  const response = await request('/panel/provider/tools', {
    method: 'POST',
    body: payload,
    forceRefresh: true,
    signal: options?.signal,
    cacheKey: null
  });
  return normaliseToolSaleListing(response.data ?? response, 0);
}

export async function updateProviderToolSale(profileId, payload, options = {}) {
  if (!profileId) {
    throw new PanelApiError('Tool sale profile identifier required', 400);
  }
  const response = await request(`/panel/provider/tools/${encodeURIComponent(profileId)}`, {
    method: 'PUT',
    body: payload,
    forceRefresh: true,
    signal: options?.signal,
    cacheKey: null
  });
  return normaliseToolSaleListing(response.data ?? response, 0);
}

export async function deleteProviderToolSale(profileId, options = {}) {
  if (!profileId) {
    throw new PanelApiError('Tool sale profile identifier required', 400);
  }
  await request(`/panel/provider/tools/${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
    signal: options?.signal,
    cacheKey: null,
    forceRefresh: true
  });
}

export async function createProviderToolSaleCoupon(profileId, payload, options = {}) {
  if (!profileId) {
    throw new PanelApiError('Tool sale profile identifier required', 400);
  }
  const response = await request(`/panel/provider/tools/${encodeURIComponent(profileId)}/coupons`, {
    method: 'POST',
    body: payload,
    forceRefresh: true,
    signal: options?.signal,
    cacheKey: null
  });
  return normaliseToolSaleListing(response.data ?? response, 0);
}

export async function updateProviderToolSaleCoupon(profileId, couponId, payload, options = {}) {
  if (!profileId || !couponId) {
    throw new PanelApiError('Coupon identifier required', 400);
  }
  const response = await request(
    `/panel/provider/tools/${encodeURIComponent(profileId)}/coupons/${encodeURIComponent(couponId)}`,
    {
      method: 'PUT',
      body: payload,
      forceRefresh: true,
      signal: options?.signal,
      cacheKey: null
    }
  );
  return normaliseToolSaleListing(response.data ?? response, 0);
}

export async function deleteProviderToolSaleCoupon(profileId, couponId, options = {}) {
  if (!profileId || !couponId) {
    throw new PanelApiError('Coupon identifier required', 400);
  }
  const response = await request(
    `/panel/provider/tools/${encodeURIComponent(profileId)}/coupons/${encodeURIComponent(couponId)}`,
    {
      method: 'DELETE',
      forceRefresh: true,
      signal: options?.signal,
      cacheKey: null
    }
  );
  return normaliseToolSaleListing(response.data ?? response, 0);
}

export async function createAdminProvider(payload) {
  const response = await request('/admin/providers', {
    method: 'POST',
    body: payload,
    forceRefresh: true
  });
  const normalised = normaliseAdminProviderDetail(response.data ?? response);
  invalidateProviderCache(normalised.company?.id ?? null);
  return normalised;
}

export async function updateAdminProvider(companyId, payload) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const response = await request(`/admin/providers/${encodeURIComponent(companyId)}`, {
    method: 'PUT',
    body: payload,
    forceRefresh: true
  });
  const normalised = normaliseAdminProviderDetail(response.data ?? response);
  invalidateProviderCache(companyId);
  return normalised;
}

export async function archiveAdminProvider(companyId, payload = {}) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const response = await request(`/admin/providers/${encodeURIComponent(companyId)}/archive`, {
    method: 'POST',
    body: payload,
    forceRefresh: true
  });
  const normalised = normaliseAdminProviderDetail(response.data ?? response);
  invalidateProviderCache(companyId);
  return normalised;
}

export async function upsertAdminProviderContact(companyId, contactId, payload) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const path = contactId
    ? `/admin/providers/${encodeURIComponent(companyId)}/contacts/${encodeURIComponent(contactId)}`
    : `/admin/providers/${encodeURIComponent(companyId)}/contacts`;
  const method = contactId ? 'PUT' : 'POST';
  const response = await request(path, {
    method,
    body: payload,
    forceRefresh: true
  });
  invalidateProviderCache(companyId);
  return normaliseProviderContact(response.data ?? response);
}

export async function deleteAdminProviderContact(companyId, contactId) {
  if (!companyId || !contactId) {
    throw new PanelApiError('Provider contact identifier required', 400);
  }
  await request(`/admin/providers/${encodeURIComponent(companyId)}/contacts/${encodeURIComponent(contactId)}`, {
    method: 'DELETE',
    forceRefresh: true
  });
  invalidateProviderCache(companyId);
}

export async function upsertAdminProviderCoverage(companyId, coverageId, payload) {
  if (!companyId) {
    throw new PanelApiError('Provider identifier required', 400);
  }
  const path = coverageId
    ? `/admin/providers/${encodeURIComponent(companyId)}/coverage/${encodeURIComponent(coverageId)}`
    : `/admin/providers/${encodeURIComponent(companyId)}/coverage`;
  const method = coverageId ? 'PUT' : 'POST';
  const response = await request(path, {
    method,
    body: payload,
    forceRefresh: true
  });
  invalidateProviderCache(companyId);
  return normaliseProviderCoverage(response.data ?? response);
}

export async function deleteAdminProviderCoverage(companyId, coverageId) {
  if (!companyId || !coverageId) {
    throw new PanelApiError('Provider coverage identifier required', 400);
  }
  await request(`/admin/providers/${encodeURIComponent(companyId)}/coverage/${encodeURIComponent(coverageId)}`, {
    method: 'DELETE',
    forceRefresh: true
  });
  invalidateProviderCache(companyId);
}

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

export const getMaterialsShowcase = withFallback(
  normaliseMaterialsShowcase,
  materialsFallback,
  (options = {}) => {
    const query = toQueryString({ companyId: options?.companyId });
    const cacheKeySuffix = query ? `:${query.slice(1)}` : '';
    return request(`/materials/showcase${query}`, {
      cacheKey: `materials-showcase${cacheKeySuffix}`,
      ttl: 45000,
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

