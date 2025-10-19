const INSTRUCTOR_API_ROOT = '/api/instructor';

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
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

function normaliseString(value, { maxLength = 256, fallback = '' } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function normaliseNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = null } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(Math.max(numeric, min), max);
}

function normaliseBoolean(value, { fallback = false } = {}) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalised)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  return fallback;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
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

function attachAbortSignal(signal) {
  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener(
        'abort',
        () => {
          signal.removeEventListener('abort', abort);
        },
        { once: true }
      );
    }
  }
  return controller;
}

async function request(path, { method = 'GET', body, signal, headers: customHeaders } = {}) {
  const controller = attachAbortSignal(signal);
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      headers.set(key, value);
    });
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'include',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    const networkError = new Error('Unable to reach Fixnado instructor services.');
    networkError.cause = error;
    throw networkError;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  let payload = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[instructorClient] Failed to parse JSON payload', error);
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
        console.warn('[instructorClient] mapper failed for entry', entry, error);
        return null;
      }
    })
    .filter(Boolean);
}

function normaliseMoney(value) {
  const numeric = normaliseNumber(value, { min: 0, fallback: 0 });
  return numeric === null ? 0 : numeric;
}

export async function fetchInstructorOverview({ timezone, horizonDays = 14 } = {}, { signal } = {}) {
  const query = buildQuery({ timezone, horizonDays });
  const payload = await request(`${INSTRUCTOR_API_ROOT}/overview${query}`, { signal });

  const instructor = {
    id: normaliseString(payload?.instructor?.id, { maxLength: 64 }) || null,
    name: normaliseString(payload?.instructor?.name, { maxLength: 120 }) || 'Instructor',
    brand: normaliseString(payload?.instructor?.brand, { maxLength: 120 }) || null,
    timezone: normaliseString(payload?.instructor?.timezone, { maxLength: 64 }) || timezone || 'UTC',
    storefrontUrl: normaliseString(payload?.instructor?.storefrontUrl, { maxLength: 200 }) || null,
    storefrontStatus: normaliseString(payload?.instructor?.storefrontStatus, { maxLength: 24 }) || 'draft',
    supportEmail: normaliseString(payload?.instructor?.supportEmail, { maxLength: 160 }) || null,
    supportPhone: normaliseString(payload?.instructor?.supportPhone, { maxLength: 64 }) || null,
    riskLevel: normaliseString(payload?.instructor?.riskLevel, { maxLength: 24 }) || 'healthy'
  };

  const metrics = ensureArray(payload?.metrics, (metric) => ({
    id: normaliseString(metric.id, { maxLength: 64 }) || randomId('metric'),
    label: normaliseString(metric.label, { maxLength: 120 }),
    value: normaliseNumber(metric.value, { fallback: 0 }),
    displayValue: normaliseString(metric.displayValue, { maxLength: 64 }) || null,
    change: normaliseString(metric.change, { maxLength: 64 }) || null,
    trend: normaliseString(metric.trend, { maxLength: 16 }) || 'flat'
  }));

  const revenueTrend = ensureArray(payload?.revenueTrend, (point) => ({
    date: normaliseDate(point.date)?.toISOString(),
    gross: normaliseMoney(point.gross),
    net: normaliseMoney(point.net)
  }));

  const topProducts = ensureArray(payload?.topProducts, (product) => ({
    id: normaliseString(product.id, { maxLength: 64 }) || randomId('product'),
    name: normaliseString(product.name, { maxLength: 160 }),
    category: normaliseString(product.category, { maxLength: 64 }) || 'course',
    revenue: normaliseMoney(product.revenue),
    orders: normaliseNumber(product.orders, { min: 0, fallback: 0 }) ?? 0
  }));

  const alerts = ensureArray(payload?.alerts, (alert) => ({
    id: normaliseString(alert.id, { maxLength: 64 }) || randomId('alert'),
    severity: normaliseString(alert.severity, { maxLength: 24 }) || 'info',
    message: normaliseString(alert.message, { maxLength: 240 }),
    actionLabel: normaliseString(alert.actionLabel, { maxLength: 80 }) || null,
    actionHref: normaliseString(alert.actionHref, { maxLength: 160 }) || null
  }));

  const tasks = ensureArray(payload?.tasks, (task) => ({
    id: normaliseString(task.id, { maxLength: 64 }) || randomId('task'),
    label: normaliseString(task.label, { maxLength: 160 }),
    dueAt: normaliseDate(task.dueAt)?.toISOString() || null,
    status: normaliseString(task.status, { maxLength: 24 }) || 'pending'
  }));

  const pipeline = ensureArray(payload?.pipeline?.stages, (stage) => ({
    id: normaliseString(stage.id, { maxLength: 64 }) || randomId('stage'),
    label: normaliseString(stage.label, { maxLength: 80 }),
    targetSlaHours: normaliseNumber(stage.targetSlaHours, { min: 0, fallback: null }),
    orders: ensureArray(stage.orders, (order) => ({
      id: normaliseString(order.id, { maxLength: 64 }) || randomId('order'),
      reference: normaliseString(order.reference, { maxLength: 80 }),
      learner: normaliseString(order.learner, { maxLength: 120 }) || 'Learner',
      product: normaliseString(order.product, { maxLength: 160 }) || 'Course',
      total: normaliseMoney(order.total),
      status: normaliseString(order.status, { maxLength: 32 }) || 'pending',
      placedAt: normaliseDate(order.placedAt)?.toISOString() || null,
      dueAt: normaliseDate(order.dueAt)?.toISOString() || null,
      slaBreachRisk: normaliseBoolean(order.slaBreachRisk)
    }))
  }));

  const payouts = {
    nextPayoutAt: normaliseDate(payload?.payouts?.nextPayoutAt)?.toISOString() || null,
    pendingAmount: normaliseMoney(payload?.payouts?.pendingAmount),
    releasedAmount: normaliseMoney(payload?.payouts?.releasedAmount),
    withheldAmount: normaliseMoney(payload?.payouts?.withheldAmount),
    currency: normaliseString(payload?.payouts?.currency, { maxLength: 8 }) || 'USD'
  };

  return {
    instructor,
    metrics,
    revenueTrend,
    topProducts,
    alerts,
    tasks,
    pipeline,
    payouts
  };
}

export async function fetchInstructorCourses(
  { page = 1, pageSize = 25, search, status, deliveryMode } = {},
  { signal } = {}
) {
  const query = buildQuery({ page, pageSize, search, status, deliveryMode });
  const payload = await request(`${INSTRUCTOR_API_ROOT}/courses${query}`, { signal });

  const courses = ensureArray(payload?.data, (course) => ({
    id: normaliseString(course.id, { maxLength: 64 }) || randomId('course'),
    title: normaliseString(course.title, { maxLength: 160 }),
    slug: normaliseString(course.slug, { maxLength: 160 }) || null,
    status: normaliseString(course.status, { maxLength: 24 }) || 'draft',
    isPublished: normaliseBoolean(course.isPublished),
    deliveryMode: normaliseString(course.deliveryMode, { maxLength: 24 }) || 'on-demand',
    price: normaliseMoney(course.price),
    currency: normaliseString(course.currency, { maxLength: 8 }) || payload?.currency || 'USD',
    learnersEnrolled: normaliseNumber(course.learnersEnrolled, { min: 0, fallback: 0 }) ?? 0,
    satisfactionScore: normaliseNumber(course.satisfactionScore, { min: 0, max: 100, fallback: null }),
    updatedAt: normaliseDate(course.updatedAt)?.toISOString() || null,
    tags: ensureArray(course.tags, (tag) => normaliseString(tag, { maxLength: 48 })).slice(0, 8)
  }));

  return {
    courses,
    pagination: {
      page: normaliseNumber(payload?.pagination?.page, { min: 1, fallback: page }) ?? page,
      pageSize: normaliseNumber(payload?.pagination?.pageSize, { min: 1, fallback: pageSize }) ?? pageSize,
      totalItems: normaliseNumber(payload?.pagination?.totalItems, { min: 0, fallback: courses.length }) ?? courses.length,
      totalPages: normaliseNumber(payload?.pagination?.totalPages, { min: 1, fallback: 1 }) ?? 1
    },
    filters: {
      statuses: ensureArray(payload?.filters?.statuses, (entry) => normaliseString(entry, { maxLength: 24 })).filter(Boolean),
      deliveryModes: ensureArray(payload?.filters?.deliveryModes, (entry) => normaliseString(entry, { maxLength: 24 })).filter(
        Boolean
      )
    }
  };
}

export async function updateCoursePublishing(courseId, { isPublished, scheduledAt } = {}, { signal } = {}) {
  if (!courseId) {
    throw new Error('courseId is required');
  }
  const payload = await request(`${INSTRUCTOR_API_ROOT}/courses/${courseId}/publishing`, {
    method: 'PATCH',
    body: {
      isPublished: Boolean(isPublished),
      scheduledAt: scheduledAt ? normaliseDate(scheduledAt)?.toISOString() : null
    },
    signal
  });

  return {
    id: normaliseString(payload?.id, { maxLength: 64 }) || courseId,
    isPublished: normaliseBoolean(payload?.isPublished, { fallback: Boolean(isPublished) }),
    scheduledAt: normaliseDate(payload?.scheduledAt)?.toISOString() || null,
    status: normaliseString(payload?.status, { maxLength: 24 }) || 'draft'
  };
}

export async function fetchCommerceCatalogue(
  { search, type, availability, page = 1, pageSize = 50 } = {},
  { signal } = {}
) {
  const query = buildQuery({ search, type, availability, page, pageSize });
  const payload = await request(`${INSTRUCTOR_API_ROOT}/catalogue${query}`, { signal });

  const items = ensureArray(payload?.data, (item) => ({
    id: normaliseString(item.id, { maxLength: 64 }) || randomId('item'),
    sku: normaliseString(item.sku, { maxLength: 64 }) || null,
    name: normaliseString(item.name, { maxLength: 160 }),
    type: normaliseString(item.type, { maxLength: 24 }) || 'service',
    unitPrice: normaliseMoney(item.unitPrice),
    currency: normaliseString(item.currency, { maxLength: 8 }) || payload?.currency || 'USD',
    availability: normaliseString(item.availability, { maxLength: 24 }) || 'available',
    leadTimeDays: normaliseNumber(item.leadTimeDays, { min: 0, fallback: null }),
    inventoryOnHand: normaliseNumber(item.inventoryOnHand, { min: 0, fallback: null }),
    reservations: normaliseNumber(item.reservations, { min: 0, fallback: 0 }) ?? 0,
    updatedAt: normaliseDate(item.updatedAt)?.toISOString() || null
  }));

  return {
    items,
    pagination: {
      page: normaliseNumber(payload?.pagination?.page, { min: 1, fallback: page }) ?? page,
      pageSize: normaliseNumber(payload?.pagination?.pageSize, { min: 1, fallback: pageSize }) ?? pageSize,
      totalItems: normaliseNumber(payload?.pagination?.totalItems, { min: 0, fallback: items.length }) ?? items.length,
      totalPages: normaliseNumber(payload?.pagination?.totalPages, { min: 1, fallback: 1 }) ?? 1
    }
  };
}

export async function updateCatalogueItemAvailability(
  itemId,
  { availability, inventoryOnHand, leadTimeDays } = {},
  { signal } = {}
) {
  if (!itemId) {
    throw new Error('itemId is required');
  }
  const payload = await request(`${INSTRUCTOR_API_ROOT}/catalogue/${itemId}`, {
    method: 'PATCH',
    body: {
      availability: availability ? normaliseString(availability, { maxLength: 24 }) : undefined,
      inventoryOnHand: inventoryOnHand != null ? normaliseNumber(inventoryOnHand, { min: 0, fallback: 0 }) : undefined,
      leadTimeDays: leadTimeDays != null ? normaliseNumber(leadTimeDays, { min: 0, fallback: 0 }) : undefined
    },
    signal
  });

  return {
    id: normaliseString(payload?.id, { maxLength: 64 }) || itemId,
    availability: normaliseString(payload?.availability, { maxLength: 24 }) || availability || 'available',
    inventoryOnHand: normaliseNumber(payload?.inventoryOnHand, { min: 0, fallback: null }),
    leadTimeDays: normaliseNumber(payload?.leadTimeDays, { min: 0, fallback: null })
  };
}

export async function fetchOrderPipeline({ status, stage, page = 1, pageSize = 40 } = {}, { signal } = {}) {
  const query = buildQuery({ status, stage, page, pageSize });
  const payload = await request(`${INSTRUCTOR_API_ROOT}/orders${query}`, { signal });

  const stages = ensureArray(payload?.stages, (entry) => ({
    id: normaliseString(entry.id, { maxLength: 64 }) || randomId('stage'),
    label: normaliseString(entry.label, { maxLength: 80 }),
    slaHours: normaliseNumber(entry.slaHours, { min: 0, fallback: null }),
    orderCount: normaliseNumber(entry.orderCount, { min: 0, fallback: 0 }) ?? 0
  }));

  const orders = ensureArray(payload?.orders, (order) => ({
    id: normaliseString(order.id, { maxLength: 64 }) || randomId('order'),
    reference: normaliseString(order.reference, { maxLength: 80 }),
    status: normaliseString(order.status, { maxLength: 32 }) || 'pending',
    stageId: normaliseString(order.stageId, { maxLength: 64 }) || null,
    learner: normaliseString(order.learner, { maxLength: 120 }) || 'Learner',
    product: normaliseString(order.product, { maxLength: 160 }) || 'Course',
    total: normaliseMoney(order.total),
    currency: normaliseString(order.currency, { maxLength: 8 }) || payload?.currency || 'USD',
    placedAt: normaliseDate(order.placedAt)?.toISOString() || null,
    fulfilBy: normaliseDate(order.fulfilBy)?.toISOString() || null,
    notes: normaliseString(order.notes, { maxLength: 240 }) || null
  }));

  return {
    stages,
    orders,
    pagination: {
      page: normaliseNumber(payload?.pagination?.page, { min: 1, fallback: page }) ?? page,
      pageSize: normaliseNumber(payload?.pagination?.pageSize, { min: 1, fallback: pageSize }) ?? pageSize,
      totalItems: normaliseNumber(payload?.pagination?.totalItems, { min: 0, fallback: orders.length }) ?? orders.length,
      totalPages: normaliseNumber(payload?.pagination?.totalPages, { min: 1, fallback: 1 }) ?? 1
    }
  };
}

export async function acknowledgeOrderStage(orderId, { action = 'advance', notes } = {}, { signal } = {}) {
  if (!orderId) {
    throw new Error('orderId is required');
  }
  const payload = await request(`${INSTRUCTOR_API_ROOT}/orders/${orderId}/stage`, {
    method: 'POST',
    body: {
      action: normaliseString(action, { maxLength: 24, fallback: 'advance' }),
      notes: notes ? normaliseString(notes, { maxLength: 240 }) : undefined
    },
    signal
  });

  return {
    id: normaliseString(payload?.id, { maxLength: 64 }) || orderId,
    status: normaliseString(payload?.status, { maxLength: 32 }) || 'pending',
    stageId: normaliseString(payload?.stageId, { maxLength: 64 }) || null,
    updatedAt: normaliseDate(payload?.updatedAt)?.toISOString() || new Date().toISOString()
  };
}

export async function fetchPayoutSummary({ range = '30d' } = {}, { signal } = {}) {
  const query = buildQuery({ range });
  const payload = await request(`${INSTRUCTOR_API_ROOT}/payouts${query}`, { signal });

  const summary = {
    range: normaliseString(payload?.range, { maxLength: 24 }) || range,
    currency: normaliseString(payload?.currency, { maxLength: 8 }) || 'USD',
    grossSales: normaliseMoney(payload?.grossSales),
    netRevenue: normaliseMoney(payload?.netRevenue),
    payoutsReleased: normaliseMoney(payload?.payoutsReleased),
    payoutsPending: normaliseMoney(payload?.payoutsPending),
    fees: normaliseMoney(payload?.fees)
  };

  const payouts = ensureArray(payload?.payouts, (entry) => ({
    id: normaliseString(entry.id, { maxLength: 64 }) || randomId('payout'),
    amount: normaliseMoney(entry.amount),
    status: normaliseString(entry.status, { maxLength: 24 }) || 'pending',
    scheduledAt: normaliseDate(entry.scheduledAt)?.toISOString() || null,
    releasedAt: normaliseDate(entry.releasedAt)?.toISOString() || null,
    reference: normaliseString(entry.reference, { maxLength: 80 }) || null,
    depositAccount: normaliseString(entry.depositAccount, { maxLength: 80 }) || null
  }));

  const disputes = ensureArray(payload?.disputes, (entry) => ({
    id: normaliseString(entry.id, { maxLength: 64 }) || randomId('dispute'),
    amount: normaliseMoney(entry.amount),
    status: normaliseString(entry.status, { maxLength: 24 }) || 'open',
    openedAt: normaliseDate(entry.openedAt)?.toISOString() || null,
    reason: normaliseString(entry.reason, { maxLength: 120 }) || null
  }));

  return { summary, payouts, disputes };
}

export async function requestPayoutStatement({ range = '30d', format = 'csv' } = {}, { signal } = {}) {
  const payload = await request(`${INSTRUCTOR_API_ROOT}/payouts/export`, {
    method: 'POST',
    body: { range, format },
    signal
  });

  return {
    exportId: normaliseString(payload?.exportId, { maxLength: 64 }) || randomId('export'),
    expiresAt: normaliseDate(payload?.expiresAt)?.toISOString() || null,
    url: normaliseString(payload?.url, { maxLength: 200 }) || null
  };
}

export async function fetchSupportInbox({ status, priority, page = 1, pageSize = 25 } = {}, { signal } = {}) {
  const query = buildQuery({ status, priority, page, pageSize });
  const payload = await request(`${INSTRUCTOR_API_ROOT}/support${query}`, { signal });

  const tickets = ensureArray(payload?.tickets, (ticket) => ({
    id: normaliseString(ticket.id, { maxLength: 64 }) || randomId('ticket'),
    subject: normaliseString(ticket.subject, { maxLength: 160 }),
    status: normaliseString(ticket.status, { maxLength: 24 }) || 'open',
    priority: normaliseString(ticket.priority, { maxLength: 16 }) || 'medium',
    createdAt: normaliseDate(ticket.createdAt)?.toISOString() || null,
    updatedAt: normaliseDate(ticket.updatedAt)?.toISOString() || null,
    requester: normaliseString(ticket.requester, { maxLength: 120 }) || 'Learner',
    lastMessagePreview: normaliseString(ticket.lastMessagePreview, { maxLength: 200 }) || null,
    unreadCount: normaliseNumber(ticket.unreadCount, { min: 0, fallback: 0 }) ?? 0
  }));

  return {
    tickets,
    pagination: {
      page: normaliseNumber(payload?.pagination?.page, { min: 1, fallback: page }) ?? page,
      pageSize: normaliseNumber(payload?.pagination?.pageSize, { min: 1, fallback: pageSize }) ?? pageSize,
      totalItems: normaliseNumber(payload?.pagination?.totalItems, { min: 0, fallback: tickets.length }) ?? tickets.length,
      totalPages: normaliseNumber(payload?.pagination?.totalPages, { min: 1, fallback: 1 }) ?? 1
    }
  };
}

export async function replyToSupportTicket(ticketId, { message, visibility = 'public' } = {}, { signal } = {}) {
  if (!ticketId) {
    throw new Error('ticketId is required');
  }
  if (!message || !message.trim()) {
    throw new Error('message is required');
  }

  const payload = await request(`${INSTRUCTOR_API_ROOT}/support/${ticketId}/messages`, {
    method: 'POST',
    body: {
      message: normaliseString(message, { maxLength: 5000 }),
      visibility: normaliseString(visibility, { maxLength: 24, fallback: 'public' })
    },
    signal
  });

  return {
    id: normaliseString(payload?.id, { maxLength: 64 }) || randomId('message'),
    ticketId: normaliseString(payload?.ticketId, { maxLength: 64 }) || ticketId,
    createdAt: normaliseDate(payload?.createdAt)?.toISOString() || new Date().toISOString(),
    visibility: normaliseString(payload?.visibility, { maxLength: 24 }) || visibility,
    author: normaliseString(payload?.author, { maxLength: 120 }) || 'You'
  };
}

export async function fetchStorefrontSettings({ signal } = {}) {
  const payload = await request(`${INSTRUCTOR_API_ROOT}/storefront`, { signal });

  return {
    id: normaliseString(payload?.id, { maxLength: 64 }) || randomId('storefront'),
    isPublished: normaliseBoolean(payload?.isPublished),
    url: normaliseString(payload?.url, { maxLength: 200 }) || null,
    theme: normaliseString(payload?.theme, { maxLength: 32 }) || 'light',
    heroHeadline: normaliseString(payload?.heroHeadline, { maxLength: 160 }) || '',
    heroSubheadline: normaliseString(payload?.heroSubheadline, { maxLength: 240 }) || '',
    featuredProductIds: ensureArray(payload?.featuredProductIds, (id) => normaliseString(id, { maxLength: 64 })),
    conversionRate: normaliseNumber(payload?.conversionRate, { min: 0, max: 1, fallback: null }),
    lastPublishedAt: normaliseDate(payload?.lastPublishedAt)?.toISOString() || null
  };
}

export async function updateStorefrontSettings(settings = {}, { signal } = {}) {
  const payload = await request(`${INSTRUCTOR_API_ROOT}/storefront`, {
    method: 'PATCH',
    body: {
      isPublished: settings.isPublished,
      heroHeadline: settings.heroHeadline,
      heroSubheadline: settings.heroSubheadline,
      theme: settings.theme,
      featuredProductIds: Array.isArray(settings.featuredProductIds) ? settings.featuredProductIds : undefined
    },
    signal
  });

  return {
    id: normaliseString(payload?.id, { maxLength: 64 }) || settings.id || randomId('storefront'),
    isPublished: normaliseBoolean(payload?.isPublished, { fallback: Boolean(settings.isPublished) }),
    heroHeadline: normaliseString(payload?.heroHeadline, { maxLength: 160 }) || settings.heroHeadline || '',
    heroSubheadline: normaliseString(payload?.heroSubheadline, { maxLength: 240 }) || settings.heroSubheadline || '',
    theme: normaliseString(payload?.theme, { maxLength: 32 }) || settings.theme || 'light',
    featuredProductIds: ensureArray(payload?.featuredProductIds, (id) => normaliseString(id, { maxLength: 64 })),
    updatedAt: normaliseDate(payload?.updatedAt)?.toISOString() || new Date().toISOString()
  };
}

export async function simulateCheckout(body = {}, { signal } = {}) {
  if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw new Error('At least one item is required to simulate checkout');
  }

  const payload = await request(`${INSTRUCTOR_API_ROOT}/checkout/simulate`, {
    method: 'POST',
    body: {
      items: body.items.map((item) => ({
        id: normaliseString(item.id, { maxLength: 64 }) || randomId('item'),
        quantity: normaliseNumber(item.quantity, { min: 1, fallback: 1 }) ?? 1,
        price: normaliseMoney(item.price),
        name: normaliseString(item.name, { maxLength: 160 }) || 'Item'
      })),
      discounts: ensureArray(body.discounts, (discount) => ({
        code: normaliseString(discount.code, { maxLength: 32 }),
        amount: normaliseMoney(discount.amount)
      })),
      paymentMethod: normaliseString(body.paymentMethod, { maxLength: 32 }) || 'card',
      country: normaliseString(body.country, { maxLength: 2 }) || 'US'
    },
    signal
  });

  const totals = payload?.totals ?? {};

  return {
    checkoutId: normaliseString(payload?.checkoutId, { maxLength: 64 }) || randomId('checkout'),
    currency: normaliseString(payload?.currency, { maxLength: 8 }) || 'USD',
    subtotal: normaliseMoney(totals.subtotal),
    discounts: normaliseMoney(totals.discounts),
    tax: normaliseMoney(totals.tax),
    fees: normaliseMoney(totals.fees),
    total: normaliseMoney(totals.total),
    estimatedPayout: normaliseMoney(payload?.estimatedPayout)
  };
}

export default {
  fetchInstructorOverview,
  fetchInstructorCourses,
  updateCoursePublishing,
  fetchCommerceCatalogue,
  updateCatalogueItemAvailability,
  fetchOrderPipeline,
  acknowledgeOrderStage,
  fetchPayoutSummary,
  requestPayoutStatement,
  fetchSupportInbox,
  replyToSupportTicket,
  fetchStorefrontSettings,
  updateStorefrontSettings,
  simulateCheckout
};
