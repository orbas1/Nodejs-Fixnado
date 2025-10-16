import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import config from '../config/index.js';
import { annotateAdsSection, buildAdsFeatureMetadata } from '../utils/adsAccessPolicy.js';
import { buildMarketplaceDashboardSlice } from './adminMarketplaceService.js';
import { getUserProfileSettings } from './userProfileService.js';
import {
  AdCampaign,
  Booking,
  BookingAssignment,
  BookingBid,
  BookingHistoryEntry,
  CampaignDailyMetric,
  CampaignFraudSignal,
  CampaignFlight,
  CampaignInvoice,
  Company,
  ComplianceDocument,
  ConversationParticipant,
  Dispute,
  Escrow,
  InventoryAlert,
  InventoryItem,
  Order,
  RentalAgreement,
  Service,
  User
} from '../models/index.js';
import { listCustomerServiceManagement } from './customerServiceManagementService.js';
import { listTasks as listAccountSupportTasks } from './accountSupportService.js';
import { getWebsiteManagementSnapshot } from './websiteManagementService.js';
import { getWalletOverview } from './walletService.js';
import { getServicemanMetricsBundle } from './servicemanMetricsService.js';

const DEFAULT_TIMEZONE = config.dashboards?.defaultTimezone || 'Europe/London';
const DEFAULT_WINDOW_DAYS = Math.max(config.dashboards?.defaultWindowDays ?? 28, 7);
const UPCOMING_LIMIT = Math.max(config.dashboards?.upcomingLimit ?? 8, 3);
const EXPORT_ROW_LIMIT = Math.max(config.dashboards?.exportRowLimit ?? 5000, 500);
const PERSONA_DEFAULTS = Object.freeze(config.dashboards?.defaults ?? {});
const ORDER_HISTORY_ENTRY_TYPES = Object.freeze([
  { value: 'note', label: 'Note' },
  { value: 'status_update', label: 'Status update' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'handoff', label: 'Handoff' },
  { value: 'document', label: 'Document' }
]);
const ORDER_HISTORY_ACTOR_ROLES = Object.freeze([
  { value: 'customer', label: 'Customer' },
  { value: 'provider', label: 'Provider' },
  { value: 'operations', label: 'Operations' },
  { value: 'support', label: 'Support' },
  { value: 'finance', label: 'Finance' },
  { value: 'system', label: 'System' }
]);
const ORDER_HISTORY_ATTACHMENT_TYPES = Object.freeze(['image', 'document', 'link']);
const ORDER_HISTORY_TIMELINE_LIMIT = Math.max(config.dashboards?.historyTimelineLimit ?? 50, 10);
const ORDER_HISTORY_ACCESS = Object.freeze({
  level: 'manage',
  features: ['order-history:write', 'history:write']
});

const toIsoString = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  } catch (error) {
    return null;
  }
};

const CURRENCY_FORMATTER = (currency = 'GBP', locale = 'en-GB') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
const NUMBER_FORMATTER = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const PERCENT_FORMATTER = new Intl.NumberFormat('en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });

function normaliseUuid(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function inventoryAvailable(item) {
  const onHand = Number.parseInt(item.quantityOnHand ?? 0, 10);
  const reserved = Number.parseInt(item.quantityReserved ?? 0, 10);
  if (!Number.isFinite(onHand) || !Number.isFinite(reserved)) {
    return 0;
  }
  return Math.max(onHand - reserved, 0);
}

function inventoryStatus(item) {
  const available = inventoryAvailable(item);
  const safety = Number.parseInt(item.safetyStock ?? 0, 10);
  if (available <= 0) {
    return 'stockout';
  }
  if (Number.isFinite(safety) && available <= Math.max(safety, 0)) {
    return 'low_stock';
  }
  return 'healthy';
}

function resolvePersona(persona) {
  if (typeof persona !== 'string') {
    return null;
  }
  const normalised = persona.trim().toLowerCase();
  if (['admin', 'provider', 'serviceman', 'enterprise', 'user'].includes(normalised)) {
    return normalised;
  }
  return null;
}

function resolveWindow({ startDate, endDate, timezone }) {
  const tz = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : DEFAULT_TIMEZONE;
  const now = DateTime.now().setZone(tz);
  const end = endDate ? DateTime.fromISO(endDate, { zone: tz }) : now;
  const clampedEnd = end.isValid ? end : now;
  const start = startDate ? DateTime.fromISO(startDate, { zone: tz }) : clampedEnd.minus({ days: DEFAULT_WINDOW_DAYS });
  const clampedStart = start.isValid ? start : clampedEnd.minus({ days: DEFAULT_WINDOW_DAYS });

  if (clampedStart >= clampedEnd) {
    const adjustedStart = clampedEnd.minus({ days: DEFAULT_WINDOW_DAYS });
    return {
      start: adjustedStart,
      end: clampedEnd,
      timezone: tz,
      previousStart: adjustedStart.minus({ days: DEFAULT_WINDOW_DAYS }),
      previousEnd: adjustedStart,
      label: `Last ${DEFAULT_WINDOW_DAYS} days`
    };
  }

  const windowDays = Math.max(Math.round(clampedEnd.diff(clampedStart, 'days').days), 1);
  const previousDuration = { days: windowDays };

  return {
    start: clampedStart,
    end: clampedEnd,
    timezone: tz,
    previousStart: clampedStart.minus(previousDuration),
    previousEnd: clampedStart,
    label: `Last ${windowDays} days`
  };
}

function formatCurrency(amount, currency = 'GBP') {
  const numeric = Number.parseFloat(amount ?? 0);
  if (!Number.isFinite(numeric)) {
    return '£0';
  }
  return CURRENCY_FORMATTER(currency).format(numeric);
}

function formatNumber(value) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return NUMBER_FORMATTER.format(numeric);
}

function formatPercent(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return '0.0%';
  }
  return PERCENT_FORMATTER.format(part / total);
}

function safeAverage(total, count) {
  const numericTotal = Number.parseFloat(total ?? 0);
  const numericCount = Number.parseFloat(count ?? 0);
  if (!Number.isFinite(numericTotal) || !Number.isFinite(numericCount) || numericCount <= 0) {
    return 0;
  }
  return numericTotal / numericCount;
}

function safeShare(value, total) {
  const numericValue = Number.parseFloat(value ?? 0);
  const numericTotal = Number.parseFloat(total ?? 0);
  if (!Number.isFinite(numericValue) || !Number.isFinite(numericTotal) || numericTotal <= 0) {
    return 0;
  }
  return numericValue / numericTotal;
}

function normaliseChannel(campaign) {
  const candidates = [
    campaign.primaryChannel,
    campaign.channel,
    campaign.channels?.[0],
    campaign.placementType,
    campaign.objective
  ]
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : null))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes('search') || candidate.includes('marketplace')) {
      return 'marketplace_search';
    }
    if (candidate.includes('display') || candidate.includes('awareness') || candidate.includes('reach')) {
      return 'awareness_display';
    }
    if (candidate.includes('retarget') || candidate.includes('conversion') || candidate.includes('lead')) {
      return 'conversion';
    }
    if (candidate.includes('video')) {
      return 'video';
    }
  }

  return 'omnichannel';
}

function channelLabel(channel) {
  switch (channel) {
    case 'marketplace_search':
      return 'Marketplace & Search';
    case 'awareness_display':
      return 'Awareness & Display';
    case 'conversion':
      return 'Conversion & Remarketing';
    case 'video':
      return 'Video Placements';
    default:
      return 'Omnichannel Mix';
  }
}

function parseDecimal(value) {
  const parsed = Number.parseFloat(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asDateRange(start, end) {
  return { [Op.between]: [start.toJSDate(), end.toJSDate()] };
}

function toIso(dt) {
  return dt?.toISO?.({ suppressMilliseconds: true }) ?? null;
}

function computeTrend(current, previous, formatter = formatNumber, suffix = '') {
  const delta = current - previous;
  let trend = 'flat';
  if (delta > 0.0001) {
    trend = 'up';
  } else if (delta < -0.0001) {
    trend = 'down';
  }
  const formattedDelta = delta === 0 ? '0' : formatter(Math.abs(delta));
  const change = `${trend === 'down' ? '-' : '+'}${formattedDelta}${suffix}`;
  return { value: formatter(current), change, trend };
}

function trendStatus(trend) {
  if (trend === 'up') {
    return 'Scaling';
  }
  if (trend === 'down') {
    return 'Monitor';
  }
  return 'Steady';
}

function groupByWeek(records, accessor, window) {
  const buckets = [];
  let cursor = window.start.startOf('week');
  while (cursor < window.end) {
    const bucketEnd = cursor.plus({ weeks: 1 });
    buckets.push({
      start: cursor,
      end: bucketEnd,
      label: cursor.toFormat('dd LLL'),
      value: 0
    });
    cursor = bucketEnd;
  }

  for (const record of records) {
    const dt = DateTime.fromJSDate(accessor(record)).setZone(window.timezone);
    const target = buckets.find((bucket) => dt >= bucket.start && dt < bucket.end);
    if (target) {
      target.value += 1;
    }
  }

  return buckets.map((bucket) => ({ name: bucket.label, count: bucket.value }));
}

const PERSONA_METADATA = {
  user: {
    name: 'User Command Center',
    headline: 'Coordinate service orders, rentals, and support in a single workspace.'
  },
  admin: {
    name: 'Admin Control Tower',
    headline: 'Command multi-tenant operations, compliance, and SLA performance in real time.'
  },
  provider: {
    name: 'Provider Operations Studio',
    headline: 'Monitor revenue, crew utilisation, and asset readiness for every contract.'
  },
  serviceman: {
    name: 'Crew Performance Cockpit',
    headline: 'Stay ahead of assignments, travel buffers, and completion quality markers.'
  },
  enterprise: {
    name: 'Enterprise Performance Suite',
    headline: 'Track spend, campaign pacing, and risk signals across every facility.'
  }
};

async function resolveCompanyId({ companyId }) {
  const coerced = normaliseUuid(companyId);
  if (coerced) {
    return coerced;
  }
  const fallback = await Company.findOne({ attributes: ['id'], order: [['createdAt', 'ASC']] });
  return fallback?.id ?? null;
}

async function resolveUserId({ userId }) {
  const coerced = normaliseUuid(userId);
  if (coerced) {
    return coerced;
  }

  const fallback = await User.findOne({
    where: { type: 'user' },
    attributes: ['id'],
    order: [['createdAt', 'ASC']]
  });

  return fallback?.id ?? null;
}

function humanise(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function loadUserData(context) {
  const { userId, companyId, window } = context;

  const bookingWhere = {
    createdAt: asDateRange(window.start, window.end),
    ...(userId ? { customerId: userId } : {}),
    ...(companyId ? { companyId } : {})
  };

  const previousBookingWhere = {
    createdAt: asDateRange(window.previousStart, window.previousEnd),
    ...(userId ? { customerId: userId } : {}),
    ...(companyId ? { companyId } : {})
  };

  const orderWhere = {
    createdAt: asDateRange(window.start, window.end),
    ...(userId ? { buyerId: userId } : {})
  };

  const previousOrderWhere = {
    createdAt: asDateRange(window.previousStart, window.previousEnd),
    ...(userId ? { buyerId: userId } : {})
  };

  const rentalWhere = {
    createdAt: asDateRange(window.start, window.end),
    ...(userId ? { renterId: userId } : {})
  };

  const conversationWhere = {
    participantType: 'user',
    createdAt: asDateRange(window.start, window.end),
    ...(userId ? { participantReferenceId: userId } : {})
  };

  const companyPromise = companyId
    ? Company.findByPk(companyId, {
        attributes: ['id', 'name', 'contactName', 'contactEmail', 'contactPhone']
      })
    : Promise.resolve(null);

  const [
    user,
    bookings,
    previousBookings,
    orders,
    previousOrders,
    rentals,
    disputes,
    conversations,
    serviceManagement
    company
    walletOverview
  ] = await Promise.all([
    userId ? User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName', 'email', 'twoFactorEmail', 'twoFactorApp'] }) : null,
    Booking.findAll({ where: bookingWhere }),
    Booking.findAll({ where: previousBookingWhere }),
    Order.findAll({
      where: orderWhere,
      include: [
        { model: Service, attributes: ['title', 'category', 'currency'], required: false },
        { model: Escrow, required: false }
      ]
    }),
    Order.findAll({ where: previousOrderWhere }),
    RentalAgreement.findAll({
      where: rentalWhere,
      include: [
        {
          model: InventoryItem,
          attributes: ['name'],
          required: false
        }
      ]
    }),
    Dispute.findAll({
      where: { createdAt: asDateRange(window.start, window.end) },
      include: [
        {
          model: Escrow,
          required: true,
          include: [
            {
              model: Order,
              required: true,
              where: orderWhere,
              include: [{ model: Service, attributes: ['title'], required: false }]
            }
          ]
        }
      ]
    }),
    ConversationParticipant.findAll({ where: conversationWhere }),
    userId
      ? listCustomerServiceManagement({ customerId: userId }).catch((error) => {
          console.warn('Failed to load customer services management data', error);
          return null;
        })
      : Promise.resolve(null)
    companyPromise
    getWalletOverview({ userId, companyId })
  ]);

  const inventoryExtras = companyId
    ? await InventoryItem.findAll({
        where: { companyId },
        order: [['updatedAt', 'DESC']],
        limit: 24
      })
    : [];

  const normaliseDate = (value) => {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };
  let profileSettings = null;
  if (userId) {
    try {
      profileSettings = await getUserProfileSettings(userId);
    } catch (error) {
      console.warn('Failed to load profile settings for user dashboard', {
        userId,
        message: error.message
      });
    }
  const bookingIds = bookings.map((booking) => booking.id);
  let historyEntries = [];

  if (bookingIds.length > 0) {
    historyEntries = await BookingHistoryEntry.findAll({
      where: { bookingId: { [Op.in]: bookingIds } },
      order: [
        ['occurredAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: ORDER_HISTORY_TIMELINE_LIMIT
    });
  }

  const totalBookings = bookings.length;
  const previousTotalBookings = previousBookings.length;
  const completedBookings = bookings.filter((booking) => booking.status === 'completed').length;
  const previousCompletedBookings = previousBookings.filter((booking) => booking.status === 'completed').length;
  const activeBookings = bookings.filter((booking) =>
    ['pending', 'awaiting_assignment', 'scheduled', 'in_progress'].includes(booking.status)
  );

  const serviceManagementData =
    serviceManagement ?? {
      metrics: { activeOrders: 0, fundedEscrows: 0, disputedOrders: 0, totalOrders: 0, totalSpend: 0 },
      orders: [],
      catalogue: { services: [], zones: [] }
    };

  const bookingsMetric = computeTrend(totalBookings, previousTotalBookings, formatNumber, ' jobs');

  const completionRate = totalBookings ? completedBookings / totalBookings : 0;
  const previousCompletionRate = previousTotalBookings ? previousCompletedBookings / previousTotalBookings : 0;
  const completionDelta = (completionRate - previousCompletionRate) * 100;
  const completionMetric = {
    label: 'Completion rate',
    value: `${(completionRate * 100).toFixed(1)}%`,
    change:
      previousTotalBookings > 0
        ? `${completionDelta >= 0 ? '+' : '-'}${Math.abs(completionDelta).toFixed(1)} pts vs prev`
        : `${formatNumber(activeBookings.length)} active jobs`,
    trend: completionDelta > 0.1 ? 'up' : completionDelta < -0.1 ? 'down' : 'flat'
  };

  const spend = orders.reduce((sum, order) => sum + parseDecimal(order.totalAmount), 0);
  const previousSpend = previousOrders.reduce((sum, order) => sum + parseDecimal(order.totalAmount), 0);
  const currency = orders[0]?.currency || orders[0]?.Service?.currency || 'GBP';
  const spendMetric = computeTrend(spend, previousSpend, (value) => formatCurrency(value, currency));

  const conversationMetric = {
    label: 'Conversations touched',
    value: formatNumber(conversations.length),
    change:
      disputes.length > 0
        ? `${formatNumber(disputes.length)} dispute${disputes.length === 1 ? '' : 's'} open`
        : 'All clear',
    trend: conversations.length > 0 ? 'up' : 'flat'
  };

  const now = DateTime.now().setZone(window.timezone);
  const upcoming = bookings
    .filter((booking) => booking.scheduledStart)
    .filter((booking) => DateTime.fromJSDate(booking.scheduledStart).setZone(window.timezone) >= now)
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    .slice(0, UPCOMING_LIMIT)
    .map((booking) => ({
      title: booking.meta?.title || `Booking ${booking.id.slice(0, 6).toUpperCase()}`,
      when: DateTime.fromJSDate(booking.scheduledStart)
        .setZone(window.timezone)
        .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY),
      status: humanise(booking.status)
    }));

  const spendBuckets = orders.reduce((acc, order) => {
    const dateKey = DateTime.fromJSDate(order.createdAt).setZone(window.timezone).toISODate();
    if (!dateKey) {
      return acc;
    }
    const current = acc.get(dateKey) ?? 0;
    acc.set(dateKey, current + parseDecimal(order.totalAmount));
    return acc;
  }, new Map());

  const spendSeries = Array.from(spendBuckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, value]) => ({
      name: DateTime.fromISO(date, { zone: window.timezone }).toFormat('dd LLL'),
      value: Number.parseFloat(value.toFixed(2))
    }));

  const statusData = [
    { key: 'draft', label: 'Draft' },
    { key: 'funded', label: 'Funded' },
    { key: 'in_progress', label: 'In delivery' },
    { key: 'completed', label: 'Completed' },
    { key: 'disputed', label: 'Disputed' }
  ].map(({ key, label }) => ({
    name: label,
    count: orders.filter((order) => order.status === key).length
  }));

  const escrowFunded = orders.filter((order) => order.Escrow?.status === 'funded').length;
  const fundedOrders = orders.filter((order) => order.status === 'funded').length;
  const inProgressOrders = orders.filter((order) => order.status === 'in_progress').length;
  const awaitingActionOrders = orders.filter((order) => ['draft', 'disputed'].includes(order.status)).length;
  const timezoneLabel = window.timezone?.replace('_', ' ') ?? DEFAULT_TIMEZONE;
  const totalOrders = orders.length;
  const supportConversations = conversations.length;
  const rentalsDueSoon = rentals.filter((rental) => {
    if (!rental.returnDueAt) return false;
    const due = DateTime.fromJSDate(rental.returnDueAt).setZone(window.timezone);
    return due >= now && due.diff(now, 'days').days <= 3;
  }).length;
  const rentalsInUse = rentals.filter((rental) =>
    ['in_use', 'pickup_scheduled', 'return_pending', 'inspection_pending'].includes(rental.status)
  ).length;

  const overview = {
    metrics: [bookingsMetric, completionMetric, spendMetric, conversationMetric],
    charts: [
      {
        id: 'bookings-volume',
        title: 'Bookings per week',
        description: 'New bookings placed this window.',
        type: 'line',
        dataKey: 'count',
        data: groupByWeek(bookings, (booking) => booking.createdAt, window)
      },
      {
        id: 'order-spend',
        title: 'Service order spend',
        description: 'Escrow commitments captured per day.',
        type: 'area',
        dataKey: 'value',
        data: spendSeries
      },
      {
        id: 'order-status-mix',
        title: 'Order status mix',
        description: 'Pipeline distribution across your service orders.',
        type: 'bar',
        dataKey: 'count',
        data: statusData
      }
    ],
    upcoming,
    insights: [
      `${formatNumber(activeBookings.length)} active bookings across your workspace`,
      `${formatCurrency(spend, currency)} committed across ${formatNumber(orders.length)} service orders`,
      `${formatNumber(escrowFunded)} funded escrow${escrowFunded === 1 ? '' : 's'} ready for delivery`,
      rentalsDueSoon
        ? `${formatNumber(rentalsDueSoon)} rental${rentalsDueSoon === 1 ? '' : 's'} due within 72 hours`
        : `${formatNumber(rentalsInUse)} rental asset${rentalsInUse === 1 ? '' : 's'} currently in the field`
    ]
  };

  const orderBoardColumns = [
    {
      title: 'Quotes & Drafts',
      filter: (order) => order.status === 'draft'
    },
    {
      title: 'Escrow Funded',
      filter: (order) => order.status === 'funded'
    },
    {
      title: 'In Delivery',
      filter: (order) => order.status === 'in_progress'
    },
    {
      title: 'Wrap-up & Follow-up',
      filter: (order) => ['completed', 'disputed'].includes(order.status)
    }
  ].map((column) => ({
    title: column.title,
    items: orders
      .filter(column.filter)
      .slice(0, 4)
      .map((order) => {
        const etaLabel =
          order.status === 'disputed'
            ? 'Dispute in progress'
            : order.scheduledFor
            ? DateTime.fromJSDate(order.scheduledFor)
                .setZone(window.timezone)
                .toRelative({ base: window.end })
            : 'Schedule pending';
        const ownerLabel =
          order.metadata?.siteAddress ||
          order.metadata?.contactName ||
          order.Service?.category ||
          'Service order';
        const priorityLabel =
          order.priority && order.priority !== 'medium'
            ? `Priority: ${order.priority.replace(/_/g, ' ')}`
            : null;
        return {
          title: order.title || order.Service?.title || `Order ${order.id.slice(0, 6).toUpperCase()}`,
          owner: priorityLabel ? `${ownerLabel} • ${priorityLabel}` : ownerLabel,
          value: formatCurrency(order.totalAmount, order.currency || order.Service?.currency || 'GBP'),
          eta: etaLabel
        };
      })
  }));

  const depositStatusCounts = rentals.reduce(
    (acc, rental) => {
      const key = rental.depositStatus || 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    { pending: 0, held: 0, released: 0, forfeited: 0, partially_released: 0, unknown: 0 }
  );

  const depositAmountTotals = rentals.reduce(
    (acc, rental) => {
      const amount = Number.parseFloat(rental.depositAmount ?? NaN);
      if (!Number.isFinite(amount) || amount <= 0) {
        return acc;
      }
      const key = rental.depositStatus || 'pending';
      acc[key] = (acc[key] ?? 0) + amount;
      acc.total += amount;
      return acc;
    },
    { total: 0, pending: 0, held: 0, released: 0, forfeited: 0, partially_released: 0 }
  );

  const rentalsAtRisk = rentals.filter((rental) => ['disputed', 'inspection_pending'].includes(rental.status));

  const rentalSummaries = rentals.slice(0, 50).map((rental) => ({
    id: rental.id,
    rentalNumber: rental.rentalNumber,
    status: rental.status,
    depositStatus: rental.depositStatus,
    quantity: rental.quantity,
    renterId: rental.renterId,
    companyId: rental.companyId,
    bookingId: rental.bookingId,
    pickupAt: normaliseDate(rental.pickupAt),
    returnDueAt: normaliseDate(rental.returnDueAt),
    rentalStartAt: normaliseDate(rental.rentalStartAt),
    rentalEndAt: normaliseDate(rental.rentalEndAt),
    lastStatusTransitionAt: normaliseDate(rental.lastStatusTransitionAt),
    depositAmount: rental.depositAmount != null ? Number.parseFloat(rental.depositAmount) : null,
    depositCurrency: rental.depositCurrency || null,
    dailyRate: rental.dailyRate != null ? Number.parseFloat(rental.dailyRate) : null,
    rateCurrency: rental.rateCurrency || null,
    conditionOut: rental.conditionOut ?? {},
    conditionIn: rental.conditionIn ?? {},
    meta: rental.meta ?? {},
    item: rental.InventoryItem
      ? {
          id: rental.InventoryItem.id,
          name: rental.InventoryItem.name,
          sku: rental.InventoryItem.sku || null,
          rentalRate: rental.InventoryItem.rentalRate != null ? Number.parseFloat(rental.InventoryItem.rentalRate) : null,
          rentalRateCurrency: rental.InventoryItem.rentalRateCurrency || null,
          depositAmount:
            rental.InventoryItem.depositAmount != null ? Number.parseFloat(rental.InventoryItem.depositAmount) : null,
          depositCurrency: rental.InventoryItem.depositCurrency || null
        }
      : null,
    booking: rental.Booking
      ? {
          id: rental.Booking.id,
          status: rental.Booking.status,
          reference: rental.Booking.meta?.reference || null,
          title: rental.Booking.meta?.title || null
        }
      : null,
    timeline: Array.isArray(rental.RentalCheckpoints)
      ? rental.RentalCheckpoints.map((checkpoint) => ({
          id: checkpoint.id,
          type: checkpoint.type,
          description: checkpoint.description,
          recordedBy: checkpoint.recordedBy,
          recordedByRole: checkpoint.recordedByRole,
          occurredAt: normaliseDate(checkpoint.occurredAt),
          payload: checkpoint.payload ?? {}
        }))
      : []
  }));

  const inventoryCatalogueMap = new Map();
  rentals.forEach((rental) => {
    if (rental.InventoryItem) {
      const plain = rental.InventoryItem.get ? rental.InventoryItem.get({ plain: true }) : rental.InventoryItem;
      inventoryCatalogueMap.set(plain.id, plain);
    }
  });
  inventoryExtras.forEach((item) => {
    const plain = item.get ? item.get({ plain: true }) : item;
    inventoryCatalogueMap.set(plain.id, plain);
  });

  const inventoryCatalogue = Array.from(inventoryCatalogueMap.values()).slice(0, 40).map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku || null,
    category: item.category || null,
    rentalRate: item.rentalRate != null ? Number.parseFloat(item.rentalRate) : null,
    rentalRateCurrency: item.rentalRateCurrency || null,
    depositAmount: item.depositAmount != null ? Number.parseFloat(item.depositAmount) : null,
    depositCurrency: item.depositCurrency || null,
    quantityOnHand: item.quantityOnHand ?? null,
    quantityReserved: item.quantityReserved ?? null,
    safetyStock: item.safetyStock ?? null,
    metadata: item.metadata ?? {},
    imageUrl: item.metadata?.imageUrl || null,
    description: item.metadata?.description || null,
    availability: inventoryAvailable(item),
    status: inventoryStatus(item)
  }));

  const accountItems = [];

  if (disputes.length > 0) {
    disputes.slice(0, 4).forEach((dispute) => {
      const order = dispute.Escrow?.Order;
      accountItems.push({
        title: order?.Service?.title || 'Service dispute',
        description: dispute.reason || 'Resolution pending with Fixnado support.',
        status: humanise(dispute.status)
      });
    });
  } else {
    accountItems.push({
      title: 'Escrow and disputes',
      description: 'No disputes or chargebacks are currently open.',
      status: 'Healthy'
    });
  }

  if (rentalsDueSoon > 0) {
    accountItems.push({
      title: 'Rental returns due',
      description: `${formatNumber(rentalsDueSoon)} rental${rentalsDueSoon === 1 ? '' : 's'} need returning within 72 hours.`,
      status: 'Action required'
    });
  } else {
    accountItems.push({
      title: 'Rental logistics',
      description: 'All rental equipment is within the agreed return window.',
      status: 'On track'
    });
  }

  if (user && !(user.twoFactorApp || user.twoFactorEmail)) {
    accountItems.push({
      title: 'Secure your account',
      description: 'Enable two-factor authentication to protect bookings and escrow payouts.',
      status: 'Recommendation'
    });
  } else {
    accountItems.push({
      title: 'Account security',
      description: 'Multi-factor authentication is enabled for this account.',
      status: 'Compliant'
    });
  }

  if (conversations.length > 0) {
    accountItems.push({
      title: 'Support conversations',
      description: `${formatNumber(conversations.length)} support touchpoint${conversations.length === 1 ? '' : 's'} logged this window.`,
      status: 'In progress'
    });
  }

  const supportTasksResult = await listAccountSupportTasks({
    companyId,
    userId,
    limit: 25
  });

  const supportTaskMeta = supportTasksResult?.meta ?? {};
  const openSupportTasks =
    (supportTaskMeta.open ?? 0) +
    (supportTaskMeta.inProgress ?? 0) +
    (supportTaskMeta.waitingExternal ?? 0);

  const supportContacts = {
    email:
      company?.contactEmail ||
      config.integrations?.app?.supportEmail ||
      'support@fixnado.com',
    phone: company?.contactPhone || '+44 20 4520 9282',
    concierge: company?.contactName
      ? `Account managed by ${company.contactName}`
      : 'Fixnado concierge support',
    knowledgeBase: config.support?.knowledgeBaseUrl || 'https://support.fixnado.com/knowledge-base'
  };

  const overviewSidebar = {
    badge: `${formatNumber(totalBookings)} jobs`,
    status:
      disputes.length > 0
        ? { label: `${formatNumber(disputes.length)} dispute${disputes.length === 1 ? '' : 's'} open`, tone: 'warning' }
        : { label: 'Workspace healthy', tone: 'success' },
    highlights: [
      { label: 'Active bookings', value: formatNumber(activeBookings.length) },
      { label: 'Spend', value: formatCurrency(spend, currency) }
    ]
  };

  const ordersSidebar = {
    badge: `${formatNumber(totalOrders)} orders`,
    status:
      awaitingActionOrders > 0
        ? { label: `${formatNumber(awaitingActionOrders)} need action`, tone: 'warning' }
        : { label: 'Pipeline healthy', tone: 'success' },
    highlights: [
      { label: 'Escrow funded', value: formatNumber(fundedOrders) },
      { label: 'In delivery', value: formatNumber(inProgressOrders) }
    ]
  };

  const servicesManagementSidebar = {
    badge: `${formatNumber(serviceManagementData.metrics.totalOrders ?? 0)} managed`,
    status:
      (serviceManagementData.metrics.disputedOrders ?? 0) > 0
        ? {
            label: `${formatNumber(serviceManagementData.metrics.disputedOrders)} in dispute`,
            tone: 'warning'
          }
        : (serviceManagementData.metrics.activeOrders ?? 0) > 0
        ? {
            label: `${formatNumber(serviceManagementData.metrics.activeOrders)} in delivery`,
            tone: 'info'
          }
        : { label: 'No active orders', tone: 'success' },
    highlights: [
      { label: 'Active orders', value: formatNumber(serviceManagementData.metrics.activeOrders ?? 0) },
      { label: 'Funded escrows', value: formatNumber(serviceManagementData.metrics.fundedEscrows ?? 0) }
    ]
  const completedBookingsCount = bookings.filter((booking) => booking.status === 'completed').length;
  const escalatedBookings = bookings.filter((booking) => ['disputed', 'cancelled'].includes(booking.status)).length;
  const latestHistoryTransition = bookings.reduce((latest, booking) => {
    if (booking.lastStatusTransitionAt instanceof Date && !Number.isNaN(booking.lastStatusTransitionAt.getTime())) {
      return latest && latest > booking.lastStatusTransitionAt ? latest : booking.lastStatusTransitionAt;
    }
    return latest;
  }, null);
  const latestTimelineUpdate = historyEntries.reduce((latest, entry) => {
    const candidate = entry.occurredAt instanceof Date ? entry.occurredAt : entry.createdAt;
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) {
      return latest && latest > candidate ? latest : candidate;
    }
    return latest;
  }, null);
  const latestHistory = [latestHistoryTransition, latestTimelineUpdate].reduce((resolved, candidate) => {
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) {
      return resolved && resolved > candidate ? resolved : candidate;
    }
    return resolved;
  }, null);
  const lastUpdatedLabel = latestHistory
    ? DateTime.fromJSDate(latestHistory).setZone(window.timezone).toRelative({ base: window.end })
    : '—';

  const historySidebar = {
    badge: `${formatNumber(totalBookings)} records`,
    status:
      escalatedBookings > 0
        ? { label: `${formatNumber(escalatedBookings)} escalated`, tone: 'danger' }
        : { label: 'No escalations', tone: 'success' },
    highlights: [
      { label: 'Completed', value: formatNumber(completedBookingsCount) },
      { label: 'In flight', value: formatNumber(totalBookings - completedBookingsCount) }
    ],
    meta: [{ label: 'Last update', value: lastUpdatedLabel || '—' }]
  };

  const orderSummaries = bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, EXPORT_ROW_LIMIT)
    .map((order) => ({
      id: order.id,
      reference: order.id.slice(0, 8).toUpperCase(),
      status: order.status,
      serviceTitle: order.meta?.service || order.meta?.title || 'Service order',
      serviceCategory: order.meta?.category || null,
      totalAmount: Number.parseFloat(order.totalAmount ?? 0) || 0,
      currency: order.currency || 'GBP',
      scheduledFor: order.scheduledStart instanceof Date
        ? DateTime.fromJSDate(order.scheduledStart).setZone(window.timezone).toISO()
        : null,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : null,
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : null,
      lastStatusTransitionAt:
        order.lastStatusTransitionAt instanceof Date ? order.lastStatusTransitionAt.toISOString() : null,
      zoneId: order.zoneId || null,
      companyId: order.companyId || null,
      meta: order.meta || {}
    }));

  const statusOptions = Array.from(new Set(orderSummaries.map((order) => order.status).filter(Boolean))).map(
    (status) => ({ value: status, label: humanise(status) })
  );

  if (!statusOptions.some((option) => option.value === 'all')) {
    statusOptions.unshift({ value: 'all', label: 'All statuses' });
  }

  const historyEntriesPayload = historyEntries.map((entry) => ({
    id: entry.id,
    bookingId: entry.bookingId,
    title: entry.title,
    entryType: entry.entryType,
    status: entry.status,
    summary: entry.summary,
    actorRole: entry.actorRole,
    actorId: entry.actorId,
    occurredAt: toIsoString(entry.occurredAt),
    createdAt: toIsoString(entry.createdAt),
    updatedAt: toIsoString(entry.updatedAt),
    attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
    meta:
      entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)
        ? entry.meta
        : {}
  }));

  const historyData = {
    statusOptions,
    entryTypes: ORDER_HISTORY_ENTRY_TYPES,
    actorRoles: ORDER_HISTORY_ACTOR_ROLES,
    defaultFilters: { status: 'all', sort: 'desc', limit: 25 },
    attachments: { acceptedTypes: ORDER_HISTORY_ATTACHMENT_TYPES, maxPerEntry: 6 },
    context: {
      customerId: userId ?? null,
      companyId: companyId ?? null
    },
    orders: orderSummaries,
    entries: historyEntriesPayload,
    access: ORDER_HISTORY_ACCESS
  };

  const rentalsSidebar = {
    badge: `${formatNumber(rentals.length)} rentals`,
    status:
      rentalsDueSoon > 0
        ? { label: `${formatNumber(rentalsDueSoon)} due soon`, tone: 'warning' }
        : { label: 'All on schedule', tone: 'success' },
    highlights: [
      { label: 'In field', value: formatNumber(rentalsInUse) },
      { label: 'Due soon', value: formatNumber(rentalsDueSoon) }
    ]
  };

  const accountSidebar = {
    badge: `${formatNumber(openSupportTasks)} active`,
    status:
      disputes.length > 0
        ? { label: 'Escalations open', tone: 'danger' }
        : openSupportTasks > 0
        ? { label: 'Support actions pending', tone: 'warning' }
        : supportConversations > 0
        ? { label: 'Concierge engaged', tone: 'info' }
        : { label: 'Support quiet', tone: 'success' },
    highlights: [
      { label: 'Active tasks', value: formatNumber(openSupportTasks) },
      { label: 'Resolved', value: formatNumber(supportTaskMeta.resolved ?? 0) },
      { label: 'Conversations', value: formatNumber(supportConversations) }
    ]
  };

  const mfaEnabled = Boolean(user?.twoFactorApp || user?.twoFactorEmail);
  const profilePrefs = profileSettings?.profile ?? {};
  const notificationsPrefs = profileSettings?.notifications ?? {
    dispatch: { email: true, sms: false },
    support: { email: true, sms: false },
    weeklySummary: { email: true },
    concierge: { email: true, sms: false },
    quietHours: { enabled: false, start: null, end: null, timezone: timezoneLabel },
    escalationContacts: []
  };
  const billingPrefs = profileSettings?.billing ?? {
    preferredCurrency: currency,
    defaultPaymentMethod: null,
    paymentNotes: null,
    invoiceRecipients: []
  };
  const securityPrefs = profileSettings?.security?.twoFactor ?? {
    app: Boolean(user?.twoFactorApp),
    email: Boolean(user?.twoFactorEmail),
    methods: [],
    lastUpdated: null
  };

  const timezonePreference = profilePrefs.timezone ?? timezoneLabel;
  const preferredCurrency = billingPrefs.preferredCurrency ?? currency;
  const quietHours = notificationsPrefs.quietHours ?? {
    enabled: false,
    start: null,
    end: null,
    timezone: timezonePreference
  };
  const quietHoursLabel = quietHours.enabled
    ? `${quietHours.start ?? '--:--'} – ${quietHours.end ?? '--:--'} ${quietHours.timezone ?? timezonePreference}`
    : 'Disabled';
  const escalationCount = Array.isArray(notificationsPrefs.escalationContacts)
    ? notificationsPrefs.escalationContacts.length
    : 0;
  const invoiceRecipientCount = Array.isArray(billingPrefs.invoiceRecipients)
    ? billingPrefs.invoiceRecipients.length
    : 0;

  const settingsSidebar = {
    badge: profilePrefs.preferredName
      ? `${profilePrefs.preferredName}`
      : mfaEnabled
        ? 'MFA secured'
        : 'Security review',
    status: mfaEnabled ? { label: 'MFA enabled', tone: 'success' } : { label: 'Enable MFA', tone: 'warning' },
    highlights: [
      { label: 'Timezone', value: timezonePreference },
      { label: 'Currency', value: preferredCurrency }
    ]
  };

  const displayName = (() => {
    if (profilePrefs.firstName || profilePrefs.lastName) {
      return `${profilePrefs.firstName ?? ''} ${profilePrefs.lastName ?? ''}`.trim();
    }
    return user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Fixnado user' : 'Fixnado user';
  })();
  const walletCurrency = walletOverview?.account?.currency || currency;
  const walletSummary = walletOverview?.summary;
  const walletSidebar = walletOverview
    ? {
        badge: formatCurrency(walletSummary?.balance ?? 0, walletCurrency),
        status:
          walletSummary?.pending && walletSummary.pending > 0
            ? {
                label: `${formatCurrency(walletSummary.pending, walletCurrency)} held`,
                tone: 'warning'
              }
            : { label: 'Ready for release', tone: 'success' },
        highlights: [
          {
            label: 'Available',
            value: formatCurrency(
              walletSummary?.available ?? walletSummary?.balance ?? 0,
              walletCurrency
            )
          },
          { label: 'Methods', value: formatNumber(walletOverview?.methods?.length ?? 0) }
        ]
      }
    : null;

  const walletSection = walletOverview
    ? {
        id: 'wallet',
        label: 'Wallet & Payments',
        description: 'Manage wallet balance, autopayouts, and funding routes.',
        type: 'wallet',
        sidebar: walletSidebar,
        data: {
          account: walletOverview.account,
          accountId: walletOverview.account?.id ?? null,
          summary: walletSummary,
          autopayout: walletOverview.autopayout,
          methods: walletOverview.methods,
          user: walletOverview.user,
          company: walletOverview.company,
          currency: walletCurrency,
          policy: {
            canManage: true,
            canTransact:
              walletOverview.account?.status !== 'suspended' && walletOverview.account?.status !== 'closed',
            canEditMethods: true
          }
        }
      }
    : null;

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Fixnado user' : 'Fixnado user';
  const workspaceAlignment = companyId ? 'Linked to company workspace' : 'Standalone workspace';

  const settingsPanels = [
    {
      id: 'profile',
      title: 'Profile & Identity',
      description: 'Details shared with crews, providers, and support.',
      items: [
        {
          type: 'value',
          label: 'Full name',
          value: displayName,
          helper: 'Shown on bookings, receipts, and support conversations.'
        },
        {
          type: 'value',
          label: 'Preferred name',
          value: profilePrefs.preferredName ?? 'Not set',
          helper: 'Used on dashboards, receipts, and shared documents.'
        },
        {
          type: 'value',
          label: 'Contact email',
          value: profilePrefs.email ?? user?.email ?? 'Not provided',
          helper: 'Primary channel for booking updates and notifications.'
        },
        {
          type: 'value',
          label: 'Workspace alignment',
          value: workspaceAlignment,
          helper: companyId
            ? 'Bookings inherit company-approved rates and SLAs.'
            : 'Orders use personal preferences and payment methods.'
        },
        {
          type: 'value',
          label: 'Phone number',
          value: profilePrefs.phoneNumber ?? 'Not provided',
          helper: 'SMS alerts and concierge outreach use this number.'
        },
        {
          type: 'value',
          label: 'Language',
          value: profilePrefs.language ?? 'en-GB',
          helper: 'Applied to notifications and scheduling copy.'
        },
        {
          type: 'value',
          label: 'Local timezone',
          value: timezonePreference,
          helper: 'Applied to scheduling, reminders, and exports.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Access',
      description: 'Protect the account that controls bookings and payouts.',
      items: [
        {
          type: 'toggle',
          label: 'Authenticator app 2FA',
          enabled: Boolean(securityPrefs.app),
          helper: securityPrefs.app
            ? 'Time-based one-time passcodes are required on sign-in.'
            : 'Add an authenticator app to secure sign-ins.'
        },
        {
          type: 'toggle',
          label: 'Email verification codes',
          enabled: Boolean(securityPrefs.email),
          helper: securityPrefs.email
            ? 'Backup verification codes are delivered to your inbox.'
            : 'Enable email codes as a fallback second factor.'
        },
        {
          type: 'value',
          label: 'Registered methods',
          value:
            securityPrefs.methods && securityPrefs.methods.length > 0
              ? securityPrefs.methods.join(', ')
              : 'No secondary methods saved',
          helper: securityPrefs.lastUpdated
            ? `Last security review ${DateTime.fromISO(securityPrefs.lastUpdated).toRelative?.() ?? ''}`
            : 'Record MFA methods to keep access recovery options ready.'
        },
        {
          type: 'value',
          label: 'Dispute status',
          value: disputes.length > 0 ? `${formatNumber(disputes.length)} open` : 'None open',
          helper: disputes.length > 0
            ? 'Resolve disputes to restore full payout automation.'
            : 'All escrow payouts releasing automatically.'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control how Fixnado keeps you informed.',
      items: [
        {
          type: 'toggle',
          label: 'Dispatch email alerts',
          enabled: Boolean(notificationsPrefs.dispatch?.email),
          helper: 'Emails send whenever a crew assignment or ETA changes.'
        },
        {
          type: 'toggle',
          label: 'Dispatch SMS alerts',
          enabled: Boolean(notificationsPrefs.dispatch?.sms),
          helper: 'SMS nudges mirror urgent dispatch or SLA changes.'
        },
        {
          type: 'toggle',
          label: 'Support email updates',
          enabled: Boolean(notificationsPrefs.support?.email),
          helper: 'Escalations and concierge follow-ups trigger email updates.'
        },
        {
          type: 'value',
          label: 'Quiet hours',
          value: quietHoursLabel,
          helper: quietHours.enabled
            ? 'Notifications pause during these hours across channels.'
            : 'No quiet hours configured.'
        },
        {
          type: 'value',
          label: 'Escalation contacts',
          value: `${escalationCount} contact${escalationCount === 1 ? '' : 's'}`,
          helper: 'Escalation contacts mirror urgent disputes or incidents.'
        }
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      description: 'Manage escrow, invoices, and default payment settings.',
      items: [
        {
          type: 'value',
          label: 'Preferred currency',
          value: preferredCurrency,
          helper: 'All new orders default to this currency.'
        },
        {
          type: 'value',
          label: 'Default payment method',
          value: billingPrefs.defaultPaymentMethod ?? 'Not set',
          helper: 'Shown to finance teams when approving releases.'
        },
        {
          type: 'value',
          label: 'Invoice recipients',
          value: `${invoiceRecipientCount} contact${invoiceRecipientCount === 1 ? '' : 's'}`,
          helper: 'Contacts copied into every invoice and billing summary.'
        },
        {
          type: 'value',
          label: 'Invoices this window',
          value: formatNumber(totalOrders),
          helper: totalOrders > 0
            ? `${formatCurrency(spend, currency)} invoiced across service orders.`
            : 'No invoices generated during this window.'
        }
      ]
    }
  ];

  return {
    persona: 'user',
    name: PERSONA_METADATA.user.name,
    headline: PERSONA_METADATA.user.headline,
    window,
      metadata: {
        userId: userId ?? null,
        companyId: companyId ?? null,
        user: user
          ? {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`.trim(),
              email: user.email
            }
          : null,
        company: company
          ? {
              id: company.id,
              name: company.contactName || company.name || null,
              contactEmail: company.contactEmail || null,
              contactPhone: company.contactPhone || null
            }
          : null,
        totals: {
          bookings: totalBookings,
          activeBookings: activeBookings.length,
          spend,
          rentals: rentals.length,
          disputes: disputes.length,
          conversations: conversations.length
        },
        features: {
          ads: buildAdsFeatureMetadata('user')
        }
      },
    navigation: [
      {
        id: 'overview',
        label: 'Customer Overview',
        description: 'Bookings, spend, and support signals.',
        type: 'overview',
        analytics: overview,
        sidebar: overviewSidebar
      },
      {
        id: 'orders',
        label: 'Service Orders',
        description: 'Escrow, delivery, and follow-up pipeline.',
        type: 'board',
        sidebar: ordersSidebar,
        data: { columns: orderBoardColumns }
      },
      {
        id: 'services-management',
        label: 'Services Management',
        description: 'Create service orders, manage escrow, and launch disputes.',
        type: 'services-management',
        sidebar: servicesManagementSidebar,
        data: serviceManagementData
        id: 'history',
        label: 'Order History',
        description: 'Detailed audit trail for every service order.',
        type: 'history',
        access: ORDER_HISTORY_ACCESS,
        sidebar: historySidebar,
        data: historyData
      },
      {
        id: 'rentals',
        label: 'Rental Assets',
        description: 'Track equipment associated with your jobs.',
        type: 'rentals',
        sidebar: rentalsSidebar,
        data: {
          metrics: [
            { id: 'active', label: 'Active rentals', value: rentalsInUse },
            { id: 'dueSoon', label: 'Due within 72h', value: rentalsDueSoon },
            { id: 'held', label: 'Deposits held', value: depositStatusCounts.held ?? 0 },
            {
              id: 'released',
              label: 'Deposits released',
              value: (depositStatusCounts.released ?? 0) + (depositStatusCounts.partially_released ?? 0)
            },
            { id: 'atRisk', label: 'Disputes or inspections', value: rentalsAtRisk.length }
          ],
          rentals: rentalSummaries,
          inventoryCatalogue,
          endpoints: {
            list: '/api/rentals',
            request: '/api/rentals',
            approve: '/api/rentals/:rentalId/approve',
            schedulePickup: '/api/rentals/:rentalId/schedule-pickup',
            checkout: '/api/rentals/:rentalId/checkout',
            markReturned: '/api/rentals/:rentalId/return',
            inspection: '/api/rentals/:rentalId/inspection',
            cancel: '/api/rentals/:rentalId/cancel',
            checkpoint: '/api/rentals/:rentalId/checkpoints',
            deposit: '/api/rentals/:rentalId/deposit',
            dispute: '/api/rentals/:rentalId/dispute'
          },
          escrow: {
            totals: depositAmountTotals,
            currency,
            ledgerEndpoint: '/api/rentals/:rentalId/deposit'
          },
          defaults: {
            renterId: userId ?? null,
            companyId: companyId ?? null,
            timezone: window.timezone,
            currency
          },
          statusOptions: {
            rental: [
              { value: 'requested', label: 'Requested' },
              { value: 'approved', label: 'Approved' },
              { value: 'pickup_scheduled', label: 'Pickup scheduled' },
              { value: 'in_use', label: 'In use' },
              { value: 'return_pending', label: 'Return pending' },
              { value: 'inspection_pending', label: 'Inspection pending' },
              { value: 'settled', label: 'Settled' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'disputed', label: 'Disputed' }
            ],
            deposit: [
              { value: 'pending', label: 'Pending' },
              { value: 'held', label: 'Held' },
              { value: 'released', label: 'Released' },
              { value: 'partially_released', label: 'Partially released' },
              { value: 'forfeited', label: 'Forfeited' }
            ]
          }
        }
      },
      ...(walletSection ? [walletSection] : []),
      {
        id: 'account',
        label: 'Account & Support',
        description: 'Next best actions to keep everything running smoothly.',
        type: 'accountSupport',
        sidebar: accountSidebar,
        data: {
          insights: accountItems,
          tasks: supportTasksResult.tasks,
          stats: supportTaskMeta,
          contacts: supportContacts
        }
      },
      {
        id: 'settings',
        label: 'Account Settings',
        description: 'Identity, security, and notification preferences.',
        type: 'settings',
        sidebar: settingsSidebar,
        data: { panels: settingsPanels }
      }
    ]
  };
}

async function loadAdminData(context) {
  const { companyId, window } = context;

  const [
    bookings,
    previousBookings,
    rentals,
    inventoryAlerts,
    complianceDocs,
    fraudSignals,
    campaignMetrics
  ] = await Promise.all([
    Booking.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        createdAt: asDateRange(window.start, window.end)
      }
    }),
    Booking.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        createdAt: asDateRange(window.previousStart, window.previousEnd)
      }
    }),
    RentalAgreement.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        createdAt: asDateRange(window.start, window.end)
      }
    }),
    InventoryAlert.findAll({
      include: [
        {
          model: InventoryItem,
          where: companyId ? { companyId } : undefined,
          required: !!companyId
        }
      ],
      where: {
        createdAt: asDateRange(window.start, window.end)
      }
    }),
    ComplianceDocument.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        [Op.or]: [
          { expiryAt: { [Op.between]: [window.start.toJSDate(), window.end.plus({ days: 30 }).toJSDate()] } },
          { status: { [Op.in]: ['rejected', 'expired'] } }
        ]
      }
    }),
    CampaignFraudSignal.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['name'],
          where: companyId ? { companyId } : undefined,
          required: !!companyId
        }
      ],
      where: {
        detectedAt: asDateRange(window.start, window.end)
      }
    }),
    CampaignDailyMetric.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['currency', 'name'],
          where: companyId ? { companyId } : undefined,
          required: !!companyId
        }
      ],
      where: {
        metricDate: asDateRange(window.start, window.end)
      }
    })
  ]);

  const totalBookings = bookings.length;
  const previousTotal = previousBookings.length;
  const completed = bookings.filter((booking) => booking.status === 'completed').length;
  const completionRate = totalBookings ? completed / totalBookings : 0;
  const previousCompleted = previousBookings.filter((booking) => booking.status === 'completed').length;
  const previousCompletionRate = previousTotal ? previousCompleted / Math.max(previousTotal, 1) : 0;
  const disputed = bookings.filter((booking) => booking.status === 'disputed').length;

  const totalRevenue = bookings.reduce((sum, booking) => sum + parseDecimal(booking.totalAmount), 0);
  const previousRevenue = previousBookings.reduce((sum, booking) => sum + parseDecimal(booking.totalAmount), 0);
  const slaBreaches = bookings.filter(
    (booking) => booking.status !== 'completed' && booking.status !== 'cancelled' && DateTime.fromJSDate(booking.slaExpiresAt) < window.end
  ).length;

  const upcomingBookings = bookings
    .filter((booking) => booking.scheduledStart)
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    .slice(0, UPCOMING_LIMIT)
    .map((booking) => ({
      title: booking.meta?.title || `Job ${booking.id.slice(0, 6).toUpperCase()}`,
      when: DateTime.fromJSDate(booking.scheduledStart).setZone(window.timezone).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY),
      status: booking.status.replace(/_/g, ' ')
    }));

  const boardColumns = [
    {
      title: 'Intake',
      items: bookings
        .filter((booking) => ['draft', 'pending'].includes(booking.status))
        .slice(0, 4)
        .map((booking) => ({
          title: booking.meta?.title || `Request ${booking.id.slice(0, 4).toUpperCase()}`,
          owner: booking.meta?.requester || 'Unassigned',
          value: formatCurrency(booking.totalAmount, booking.currency),
          eta: booking.type === 'scheduled' ? 'Awaiting scheduling' : 'Requires triage'
        }))
    },
    {
      title: 'Scheduling',
      items: bookings
        .filter((booking) => ['awaiting_assignment', 'scheduled'].includes(booking.status))
        .slice(0, 4)
        .map((booking) => ({
          title: booking.meta?.title || `Visit ${booking.id.slice(0, 4).toUpperCase()}`,
          owner: booking.meta?.zoneName || 'Zone pending',
          value: formatCurrency(booking.totalAmount, booking.currency),
          eta: booking.scheduledStart
            ? DateTime.fromJSDate(booking.scheduledStart).setZone(window.timezone).toRelative({ base: window.end })
            : 'Scheduling required'
        }))
    },
    {
      title: 'In Delivery',
      items: bookings
        .filter((booking) => ['in_progress'].includes(booking.status))
        .slice(0, 4)
        .map((booking) => ({
          title: booking.meta?.title || `Job ${booking.id.slice(0, 4).toUpperCase()}`,
          owner: booking.meta?.primaryCrew || 'Crew TBD',
          value: formatCurrency(booking.totalAmount, booking.currency),
          eta: DateTime.fromJSDate(booking.slaExpiresAt).setZone(window.timezone).toRelative({ base: window.end })
        }))
    },
    {
      title: 'At Risk',
      items: bookings
        .filter((booking) =>
          ['disputed', 'cancelled'].includes(booking.status) ||
          (DateTime.fromJSDate(booking.slaExpiresAt) < window.end && booking.status !== 'completed')
        )
        .slice(0, 4)
        .map((booking) => ({
          title: booking.meta?.title || `Job ${booking.id.slice(0, 4).toUpperCase()}`,
          owner: booking.meta?.owner || 'Operations',
          value: formatCurrency(booking.totalAmount, booking.currency),
          eta: booking.status === 'disputed' ? 'Dispute pending' : 'SLA breached'
        }))
    }
  ];

  const complianceRows = [
    ...complianceDocs.slice(0, 5).map((doc) => [
      doc.type,
      doc.status.replace(/_/g, ' '),
      doc.expiryAt ? DateTime.fromJSDate(doc.expiryAt).setZone(window.timezone).toISODate() : '—',
      doc.reviewerId ? 'Assigned' : 'Awaiting review',
      doc.rejectionReason || '—'
    ]),
    ...fraudSignals.slice(0, 5).map((signal) => [
      `Campaign: ${signal.AdCampaign?.name ?? signal.campaignId.slice(0, 6)}`,
      signal.signalType.replace(/_/g, ' '),
      signal.severity,
      DateTime.fromJSDate(signal.detectedAt).setZone(window.timezone).toISODate(),
      signal.resolutionNote || 'Pending investigation'
    ])
  ];

  const rentalsAtRisk = rentals.filter((rental) => ['return_pending', 'inspection_pending', 'disputed'].includes(rental.status));
  const activeAlerts = inventoryAlerts.filter((alert) => alert.status === 'active');

  const campaignSpend = campaignMetrics.reduce((sum, metric) => sum + parseDecimal(metric.spend), 0);
  const campaignRevenue = campaignMetrics.reduce((sum, metric) => sum + parseDecimal(metric.revenue), 0);
  const campaignCurrency = campaignMetrics[0]?.AdCampaign?.currency || 'GBP';

  const insights = [
    `Completion rate ${formatPercent(completed, totalBookings)} • ${slaBreaches} bookings require SLA intervention`,
    `${rentalsAtRisk.length} rentals pending inspection or dispute review`,
    `${activeAlerts.length} active inventory alerts flagged this window`,
    `Campaign ROI ${campaignRevenue && campaignSpend ? formatPercent(campaignRevenue, campaignSpend) : '0.0%'} across ${campaignMetrics.length} metric days`
  ];

  const websiteSnapshot = await getWebsiteManagementSnapshot();

  const overview = {
    metrics: [
      computeTrend(totalBookings, previousTotal, formatNumber, ''),
      computeTrend(completionRate, previousCompletionRate, (value) => formatPercent(value, 1), ''),
      computeTrend(totalRevenue, previousRevenue, (value) => formatCurrency(value, campaignCurrency), ''),
      { value: formatNumber(disputed), change: `${formatNumber(slaBreaches)} SLA issues`, trend: disputed > 0 ? 'down' : 'up' }
    ].map((metric, index) => {
      const labels = ['Jobs Received', 'Completion Rate', 'Revenue Processed', 'Escalations'];
      return { label: labels[index], ...metric };
    }),
    charts: [
      {
        id: 'jobs-by-week',
        title: 'Jobs by Week',
        description: 'Volume of bookings created each week.',
        type: 'line',
        dataKey: 'count',
        data: groupByWeek(bookings, (booking) => booking.createdAt, window)
      },
      {
        id: 'campaign-spend',
        title: 'Campaign Spend vs Revenue',
        description: 'Ad spend compared to attributed revenue this window.',
        type: 'bar',
        dataKey: 'spend',
        secondaryKey: 'revenue',
        data: [
          {
            name: 'This window',
            spend: Number.parseFloat(campaignSpend.toFixed(2)),
            revenue: Number.parseFloat(campaignRevenue.toFixed(2))
          }
        ]
      }
    ],
    upcoming: upcomingBookings,
    insights
  };

  const marketplaceOverview = await buildMarketplaceDashboardSlice({ companyId });

  const marketplaceSection = marketplaceOverview
    ? {
        id: 'marketplace-workspace',
        label: 'Marketplace management',
        description: 'Tools, consumables, and listing governance workspace.',
        type: 'marketplace-workspace',
        icon: 'marketplace',
        data: {
          overview: marketplaceOverview,
          companyId: companyId ?? null,
          summary: {
            tools: marketplaceOverview.summary.tools,
            materials: marketplaceOverview.summary.materials,
            moderationQueue: marketplaceOverview.moderationQueue.length
          }
        }
      }
    : null;

  return {
    persona: 'admin',
    name: PERSONA_METADATA.admin.name,
    headline: PERSONA_METADATA.admin.headline,
    window,
    metadata: {
      companyId: companyId ?? null,
      totals: {
        bookings: totalBookings,
        revenue: totalRevenue,
        completionRate,
        disputed
      },
      features: {
        ads: buildAdsFeatureMetadata('admin')
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Executive Overview',
        description: 'Track bookings, spend, and SLA signals.',
        type: 'overview',
        analytics: overview
      },
      {
        id: 'operations',
        label: 'Operations Pipeline',
        description: 'Monitor intake through delivery and risk queues.',
        type: 'board',
        data: { columns: boardColumns }
      },
      {
        id: 'compliance',
        label: 'Compliance & Risk',
        description: 'Expiring evidence and campaign anomaly register.',
        type: 'table',
        data: {
          headers: ['Item', 'Status', 'Due / Detected', 'Owner', 'Notes'],
          rows: complianceRows.slice(0, EXPORT_ROW_LIMIT)
        }
      },
      {
        id: 'assets',
        label: 'Assets & Rentals',
        description: 'Rental lifecycle alerts and asset readiness.',
        type: 'list',
        data: {
          items: [
            {
              title: `${rentalsAtRisk.length} rentals pending return`,
              description: 'Ensure inspections and settlements are actioned.',
              status: rentalsAtRisk.length > 0 ? 'Attention required' : 'On track'
            },
            {
              title: `${activeAlerts.length} inventory alerts open`,
              description: 'Low stock and damage reports awaiting acknowledgement.',
              status: activeAlerts.length > 0 ? 'Investigate today' : 'Healthy'
            },
            {
              title: `${fraudSignals.length} active campaign alerts`,
              description: 'Overspend, delivery gaps, or suspicious conversions detected.',
              status: fraudSignals.length > 0 ? 'Escalated to marketing ops' : 'Clear'
            }
          ]
        }
      },
      marketplaceSection
    ].filter(Boolean)
      {
        id: 'home-builder',
        label: 'Home Page Builder',
        description: 'Launch the modular home page workspace to design, publish, and manage components.',
        type: 'link',
        href: '/admin/home-builder'
        id: 'website-management',
        label: 'Website management',
        description: 'Govern marketing pages, content blocks, and navigation coverage.',
        type: 'settings',
        data: {
          panels: [
            {
              id: 'pages-summary',
              title: 'Marketing pages',
              description: 'Lifecycle of enterprise marketing experiences.',
              status: `${websiteSnapshot.pages.published} published`,
              items: [
                { id: 'pages-total', label: 'Total pages', value: websiteSnapshot.pages.total },
                { id: 'pages-draft', label: 'Draft', value: websiteSnapshot.pages.draft },
                { id: 'pages-preview', label: 'Preview', value: websiteSnapshot.pages.preview },
                { id: 'pages-role-gated', label: 'Role gated', value: websiteSnapshot.pages.roleGated },
                {
                  id: 'pages-last-published',
                  label: 'Last publish',
                  value:
                    websiteSnapshot.pages.lastPublishedAt
                      ? DateTime.fromISO(websiteSnapshot.pages.lastPublishedAt)
                          .setZone(window.timezone)
                          .toLocaleString(DateTime.DATETIME_MED)
                      : 'No published pages yet'
                }
              ]
            },
            {
              id: 'blocks-summary',
              title: 'Content blocks',
              description: 'Reusable hero, feature, and CTA components.',
              items: [
                { id: 'blocks-total', label: 'Total blocks', value: websiteSnapshot.blocks.total },
                { id: 'blocks-visible', label: 'Visible blocks', value: websiteSnapshot.blocks.visible }
              ]
            },
            {
              id: 'navigation-summary',
              title: 'Navigation menus',
              description: 'Surface coverage for menus and external links.',
              items: [
                { id: 'menus-total', label: 'Menus', value: websiteSnapshot.navigation.menus },
                { id: 'menus-primary', label: 'Primary menus', value: websiteSnapshot.navigation.primaryMenus },
                { id: 'nav-items', label: 'Navigation items', value: websiteSnapshot.navigation.items },
                { id: 'nav-nested', label: 'Nested items', value: websiteSnapshot.navigation.nestedItems },
                {
                  id: 'nav-external',
                  label: 'External links',
                  value: websiteSnapshot.navigation.externalLinks,
                  helper: 'Links that leave Fixnado surfaces'
                },
                {
                  id: 'nav-restricted',
                  label: 'Restricted items',
                  value: websiteSnapshot.navigation.restrictedItems,
                  helper: 'Role-gated navigation entries'
                },
                {
                  id: 'website-editor-link',
                  label: 'Launch website manager',
                  type: 'action',
                  href: '/admin/website-management',
                  cta: 'Open manager'
                }
              ]
            }
          ]
        }
        id: 'tags-seo',
        label: 'Tags & SEO',
        description: 'Manage metadata defaults, indexing controls, and tag governance.',
        type: 'route',
        icon: 'seo',
        route: '/admin/seo'
      }
    ]
  };
}

async function loadProviderData(context) {
  const { providerId, companyId, window } = context;

  const campaignFilter = companyId ? { companyId } : undefined;

  const [
    assignments,
    previousAssignments,
    rentals,
    inventoryAlerts,
    inventoryItems,
    campaigns,
    campaignMetrics,
    previousCampaignMetrics,
    campaignInvoices,
    campaignSignals
  ] = await Promise.all([
    BookingAssignment.findAll({
      where: {
        ...(providerId ? { providerId } : {}),
        createdAt: asDateRange(window.start, window.end)
      },
      include: [{ model: Booking }]
    }),
    BookingAssignment.findAll({
      where: {
        ...(providerId ? { providerId } : {}),
        createdAt: asDateRange(window.previousStart, window.previousEnd)
      },
      include: [{ model: Booking }]
    }),
    RentalAgreement.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        createdAt: asDateRange(window.start, window.end)
      }
    }),
    InventoryAlert.findAll({
      include: [
        {
          model: InventoryItem,
          where: companyId ? { companyId } : undefined,
          required: !!companyId
        }
      ],
      where: {
        createdAt: asDateRange(window.start, window.end)
      }
    }),
    InventoryItem.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        updatedAt: {
          [Op.lte]: window.end.toJSDate()
        }
      },
      include: [
        {
          model: InventoryAlert,
          required: false,
          where: { status: { [Op.in]: ['active', 'acknowledged'] } }
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: EXPORT_ROW_LIMIT
    }),
    AdCampaign.findAll({
      where: campaignFilter,
      include: [{ model: CampaignFlight, as: 'flights' }],
      order: [['updatedAt', 'DESC']],
      limit: EXPORT_ROW_LIMIT
    }),
    CampaignDailyMetric.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['id', 'name', 'currency', 'companyId'],
          where: campaignFilter,
          required: !!campaignFilter
        },
        {
          model: CampaignFlight,
          attributes: ['id', 'name', 'status', 'startAt', 'endAt'],
          required: false
        }
      ],
      where: {
        metricDate: asDateRange(window.start, window.end)
      }
    }),
    CampaignDailyMetric.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['id', 'name', 'currency', 'companyId'],
          where: campaignFilter,
          required: !!campaignFilter
        }
      ],
      where: {
        metricDate: asDateRange(window.previousStart, window.previousEnd)
      }
    }),
    CampaignInvoice.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['id', 'name', 'currency'],
          where: campaignFilter,
          required: !!campaignFilter
        },
        {
          model: CampaignFlight,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      where: {
        issuedAt: asDateRange(window.start, window.end)
      },
      order: [['issuedAt', 'DESC']],
      limit: EXPORT_ROW_LIMIT
    }),
    CampaignFraudSignal.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['id', 'name'],
          where: campaignFilter,
          required: !!campaignFilter
        },
        {
          model: CampaignFlight,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      where: {
        detectedAt: asDateRange(window.start, window.end)
      },
      order: [['detectedAt', 'DESC']],
      limit: EXPORT_ROW_LIMIT
    })
  ]);

  const totalAssignments = assignments.length;
  const previousTotal = previousAssignments.length;
  const accepted = assignments.filter((assignment) => assignment.status === 'accepted').length;
  const acceptedPrevious = previousAssignments.filter((assignment) => assignment.status === 'accepted').length;
  const completed = assignments.filter((assignment) => assignment.Booking?.status === 'completed').length;
  const revenue = assignments.reduce((sum, assignment) => sum + parseDecimal(assignment.Booking?.totalAmount), 0);
  const previousRevenue = previousAssignments.reduce((sum, assignment) => sum + parseDecimal(assignment.Booking?.totalAmount), 0);
  const activeAssignments = assignments.filter((assignment) => ['pending', 'accepted'].includes(assignment.status));

  const upcoming = assignments
    .filter((assignment) => assignment.Booking?.scheduledStart)
    .sort((a, b) => new Date(a.Booking.scheduledStart) - new Date(b.Booking.scheduledStart))
    .slice(0, UPCOMING_LIMIT)
    .map((assignment) => ({
      title: assignment.Booking.meta?.title || `Job ${assignment.Booking.id.slice(0, 4).toUpperCase()}`,
      when: DateTime.fromJSDate(assignment.Booking.scheduledStart)
        .setZone(window.timezone)
        .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY),
      status: assignment.status
    }));

  const acceptanceRate = totalAssignments ? accepted / totalAssignments : 0;
  const previousAcceptanceRate = previousTotal ? acceptedPrevious / previousTotal : 0;
  const completionRate = totalAssignments ? completed / totalAssignments : 0;

  const assignmentsMetric = computeTrend(totalAssignments, previousTotal, formatNumber, '');
  const acceptanceMetric = computeTrend(
    acceptanceRate,
    previousAcceptanceRate,
    (value) => formatPercent(value, 1),
    ''
  );
  const revenueMetric = computeTrend(revenue, previousRevenue, (value) => formatCurrency(value, 'GBP'), '');

  const overview = {
    metrics: [
      { label: 'Assignments Received', ...assignmentsMetric },
      { label: 'Acceptance Rate', ...acceptanceMetric },
      { label: 'Revenue Recognised', ...revenueMetric },
      { label: 'Crew On-schedule', value: formatPercent(completionRate, 1), change: `${formatNumber(activeAssignments.length)} active`, trend: 'up' }
    ],
    charts: [
      {
        id: 'assignments-week',
        title: 'Assignments Received',
        description: 'Work orders allocated each week.',
        type: 'line',
        dataKey: 'count',
        data: groupByWeek(assignments, (assignment) => assignment.createdAt, window)
      },
      {
        id: 'revenue-by-type',
        title: 'Revenue by Booking Type',
        description: 'Mix of on-demand vs scheduled revenue.',
        type: 'bar',
        dataKey: 'value',
        secondaryKey: 'scheduled',
        data: [
          {
            name: 'On-demand',
            value: assignments
              .filter((assignment) => assignment.Booking?.type === 'on_demand')
              .reduce((sum, assignment) => sum + parseDecimal(assignment.Booking?.totalAmount), 0),
            scheduled: assignments
              .filter((assignment) => assignment.Booking?.type === 'scheduled')
              .reduce((sum, assignment) => sum + parseDecimal(assignment.Booking?.totalAmount), 0)
          }
        ]
      }
    ],
    upcoming,
    insights: [
      `${formatPercent(acceptanceRate, 1)} acceptance rate with ${formatNumber(totalAssignments)} orders received`,
      `${formatNumber(activeAssignments.length)} active jobs require confirmation`,
      `${formatCurrency(revenue, 'GBP')} recognised this window`,
      `${inventoryAlerts.length} asset alerts logged • ${rentals.length} rentals active`
    ]
  };

  const boardColumns = [
    {
      title: 'New',
      items: assignments
        .filter((assignment) => assignment.status === 'pending')
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: assignment.role === 'lead' ? 'Lead crew' : 'Support crew',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency)
        }))
    },
    {
      title: 'Confirmed',
      items: assignments
        .filter((assignment) => assignment.status === 'accepted' && assignment.Booking?.status === 'scheduled')
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: assignment.Booking?.meta?.zoneName || 'Zone',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency),
          eta: assignment.Booking?.scheduledStart
            ? DateTime.fromJSDate(assignment.Booking.scheduledStart).setZone(window.timezone).toRelative({ base: window.end })
            : 'Awaiting schedule'
        }))
    },
    {
      title: 'In Progress',
      items: assignments
        .filter((assignment) => assignment.Booking?.status === 'in_progress')
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: assignment.Booking?.meta?.primaryCrew || 'Crew',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency),
          eta: DateTime.fromJSDate(assignment.Booking?.slaExpiresAt).setZone(window.timezone).toRelative({ base: window.end })
        }))
    },
    {
      title: 'Follow-up',
      items: assignments
        .filter((assignment) => ['cancelled', 'disputed'].includes(assignment.Booking?.status))
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: 'Account manager',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency),
          eta: assignment.Booking?.status === 'disputed' ? 'Investigate dispute' : 'Client cancelled'
        }))
    }
  ];

  const rentalRows = rentals.slice(0, EXPORT_ROW_LIMIT).map((rental) => [
    rental.rentalNumber,
    rental.status.replace(/_/g, ' '),
    rental.pickupAt ? DateTime.fromJSDate(rental.pickupAt).setZone(window.timezone).toISODate() : '—',
    rental.returnDueAt ? DateTime.fromJSDate(rental.returnDueAt).setZone(window.timezone).toISODate() : '—',
    rental.depositStatus.replace(/_/g, ' ')
  ]);

  const alertItems = inventoryAlerts.slice(0, 4).map((alert) => ({
    title: `${alert.type.replace(/_/g, ' ')} • ${alert.severity}`,
    description: alert.metadata?.note || 'Resolve alert to restore asset health.',
    status: alert.status
  }));

  const rentalsByItem = rentals.reduce((acc, rental) => {
    const activeStatuses = new Set([
      'requested',
      'approved',
      'ready_for_pickup',
      'checked_out',
      'in_progress'
    ]);
    if (rental.itemId && activeStatuses.has(rental.status)) {
      acc.set(rental.itemId, (acc.get(rental.itemId) ?? 0) + rental.quantity);
    }
    return acc;
  }, new Map());

  const severityRank = { critical: 3, warning: 2, info: 1 };

  const mapInventoryRecord = (item) => {
    const onHand = Number.parseInt(item.quantityOnHand ?? 0, 10) || 0;
    const reserved = Number.parseInt(item.quantityReserved ?? 0, 10) || 0;
    const safetyStock = Number.parseInt(item.safetyStock ?? 0, 10) || 0;
    const available = inventoryAvailable(item);
    const alerts = Array.isArray(item.InventoryAlerts) ? item.InventoryAlerts : [];
    const activeAlert = alerts
      .filter((alert) => alert.status === 'active')
      .sort((a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0))[0];

    return {
      id: item.id || item.sku || item.name,
      name: item.name,
      sku: item.sku,
      category: item.category,
      status: inventoryStatus(item),
      available,
      onHand,
      reserved,
      safetyStock,
      unitType: item.unitType,
      condition: item.conditionRating,
      location: item.metadata?.warehouse || item.metadata?.location || null,
      nextMaintenanceDue: item.metadata?.nextServiceDue || item.metadata?.inspectionDue || null,
      notes: item.metadata?.notes || null,
      activeAlerts: alerts.filter((alert) => alert.status === 'active').length,
      alertSeverity: activeAlert?.severity || null,
      activeRentals: rentalsByItem.get(item.id) ?? 0,
      rentalRate: item.rentalRate ? Number.parseFloat(item.rentalRate) : null,
      rentalRateCurrency: item.rentalRateCurrency || 'GBP',
      depositAmount: item.depositAmount ? Number.parseFloat(item.depositAmount) : null,
      depositCurrency: item.depositCurrency || item.rentalRateCurrency || 'GBP'
    };
  };

  const inventorySummary = inventoryItems.reduce(
    (acc, item) => {
      const available = inventoryAvailable(item);
      const reserved = Number.parseInt(item.quantityReserved ?? 0, 10);
      const onHand = Number.parseInt(item.quantityOnHand ?? 0, 10);
      const alerts = Array.isArray(item.InventoryAlerts) ? item.InventoryAlerts : [];
      const hasActiveAlert = alerts.some((alert) => alert.status === 'active');
      return {
        onHand: acc.onHand + (Number.isFinite(onHand) ? onHand : 0),
        reserved: acc.reserved + (Number.isFinite(reserved) ? reserved : 0),
        available: acc.available + available,
        alerts: acc.alerts + (hasActiveAlert || inventoryStatus(item) !== 'healthy' ? 1 : 0)
      };
    },
    { onHand: 0, reserved: 0, available: 0, alerts: 0 }
  );

  const lower = (value) => (typeof value === 'string' ? value.toLowerCase() : String(value ?? '').toLowerCase());

  const materialsInventory = inventoryItems
    .filter((item) => {
      const category = lower(item.category);
      const type = lower(item.metadata?.type);
      const usage = lower(item.metadata?.usage);
      const hasRental = Number.isFinite(Number.parseFloat(item.rentalRate ?? NaN));
      if (hasRental) {
        return false;
      }
      if (category.includes('tool')) {
        return false;
      }
      if (category.includes('material') || type === 'material' || usage === 'consumable') {
        return true;
      }
      return true;
    })
    .slice(0, 10)
    .map(mapInventoryRecord);

  const toolsInventory = inventoryItems
    .filter((item) => {
      const category = lower(item.category);
      if (category.includes('tool')) {
        return true;
      }
      return Number.isFinite(Number.parseFloat(item.rentalRate ?? NaN));
    })
    .slice(0, 10)
    .map(mapInventoryRecord);
  const aggregateCampaignMetrics = (collection) => {
    const totals = { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0, target: 0 };
    const byCampaign = new Map();

    for (const metric of collection) {
      const id = metric.campaignId;
      if (!id) continue;
      const entry = byCampaign.get(id) ?? {
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        target: 0,
        lastMetricDate: null
      };

      entry.spend += parseDecimal(metric.spend);
      entry.revenue += parseDecimal(metric.revenue);
      entry.impressions += Number(metric.impressions ?? 0);
      entry.clicks += Number(metric.clicks ?? 0);
      entry.conversions += Number(metric.conversions ?? 0);
      entry.target += parseDecimal(metric.spendTarget ?? 0);
      if (metric.metricDate) {
        entry.lastMetricDate = DateTime.fromJSDate(metric.metricDate).setZone(window.timezone).toISODate();
      }

      byCampaign.set(id, entry);

      totals.spend += parseDecimal(metric.spend);
      totals.revenue += parseDecimal(metric.revenue);
      totals.impressions += Number(metric.impressions ?? 0);
      totals.clicks += Number(metric.clicks ?? 0);
      totals.conversions += Number(metric.conversions ?? 0);
      totals.target += parseDecimal(metric.spendTarget ?? 0);
    }

    return { totals, byCampaign };
  };

  const { totals: currentCampaignTotals, byCampaign: metricsByCampaign } = aggregateCampaignMetrics(campaignMetrics);
  const { totals: previousCampaignTotals, byCampaign: previousMetricsByCampaign } = aggregateCampaignMetrics(previousCampaignMetrics);

  const adsSourcedCount = assignments.filter((assignment) => assignment.Booking?.meta?.source === 'fixnado_ads').length;
  const previousAdsSourced = previousAssignments.filter((assignment) => assignment.Booking?.meta?.source === 'fixnado_ads').length;
  const adsShare = totalAssignments ? adsSourcedCount / totalAssignments : 0;
  const previousAdsShare = previousTotal ? previousAdsSourced / Math.max(previousTotal, 1) : 0;

  const currency =
    campaigns[0]?.currency ||
    campaignMetrics[0]?.AdCampaign?.currency ||
    campaignInvoices[0]?.currency ||
    'GBP';

  const activeCampaigns = campaigns.filter((campaign) => ['active', 'scheduled'].includes(campaign.status));

  const spendTrend = computeTrend(
    currentCampaignTotals.spend,
    previousCampaignTotals.spend,
    (value) => formatCurrency(value, currency)
  );
  const revenueTrend = computeTrend(
    currentCampaignTotals.revenue,
    previousCampaignTotals.revenue,
    (value) => formatCurrency(value, currency)
  );
  const impressionsTrend = computeTrend(
    currentCampaignTotals.impressions,
    previousCampaignTotals.impressions,
    formatNumber
  );
  const clicksTrend = computeTrend(
    currentCampaignTotals.clicks,
    previousCampaignTotals.clicks,
    formatNumber
  );
  const conversionsTrend = computeTrend(
    currentCampaignTotals.conversions,
    previousCampaignTotals.conversions,
    formatNumber
  );
  const shareTrend = computeTrend(adsShare, previousAdsShare, (value) => formatPercent(value, 1));

  const summaryCards = [
    {
      title: 'Managed spend',
      ...spendTrend,
      helper: `${formatNumber(activeCampaigns.length)} active campaigns`
    },
    {
      title: 'Attributed revenue',
      ...revenueTrend,
      helper:
        currentCampaignTotals.spend > 0
          ? `ROAS ${formatPercent(currentCampaignTotals.revenue, currentCampaignTotals.spend)}`
          : 'ROAS 0.0%'
    },
    {
      title: 'Conversions',
      ...conversionsTrend,
      helper:
        currentCampaignTotals.conversions > 0
          ? `CPA ${formatCurrency(currentCampaignTotals.spend / currentCampaignTotals.conversions, currency)}`
          : `CPA ${formatCurrency(0, currency)}`
    },
    {
      title: 'Fixnado Ads share',
      value: shareTrend.value,
      change: shareTrend.change,
      trend: shareTrend.trend,
      helper: `${formatNumber(adsSourcedCount)} jobs attributed`
    }
  ];

  const ctr = currentCampaignTotals.impressions
    ? currentCampaignTotals.clicks / currentCampaignTotals.impressions
    : 0;
  const cvr = currentCampaignTotals.clicks
    ? currentCampaignTotals.conversions / currentCampaignTotals.clicks
    : 0;

  const funnelStages = [
    {
      title: 'Impressions',
      value: formatNumber(currentCampaignTotals.impressions),
      helper:
        currentCampaignTotals.impressions > 0
          ? `${formatPercent(currentCampaignTotals.clicks, currentCampaignTotals.impressions)} CTR`
          : 'No delivery'
    },
    {
      title: 'Clicks',
      value: formatNumber(currentCampaignTotals.clicks),
      helper: currentCampaignTotals.clicks > 0 ? `${formatPercent(cvr, 1)} CVR` : 'Awaiting engagement'
    },
    {
      title: 'Conversions',
      value: formatNumber(currentCampaignTotals.conversions),
      helper: `${formatCurrency(currentCampaignTotals.spend, currency)} spend`
    },
    {
      title: 'Jobs won',
      value: formatNumber(adsSourcedCount),
      helper:
        currentCampaignTotals.conversions > 0
          ? `${formatPercent(adsSourcedCount, currentCampaignTotals.conversions)} of conversions`
          : 'Link bookings for attribution'
    }
  ];

  const campaignsData = campaigns.slice(0, 8).map((campaign) => {
    const metrics = metricsByCampaign.get(campaign.id) ?? {
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      target: 0,
      lastMetricDate: null
    };
    const previous = previousMetricsByCampaign.get(campaign.id) ?? {
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      target: 0,
      lastMetricDate: null
    };

    const spendByCampaign = computeTrend(
      metrics.spend,
      previous.spend,
      (value) => formatCurrency(value, campaign.currency ?? currency)
    );
    const conversionsByCampaign = computeTrend(metrics.conversions, previous.conversions, formatNumber);
    const roasValue = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
    const previousRoasValue = previous.spend > 0 ? previous.revenue / previous.spend : 0;
    const roasTrend = computeTrend(roasValue, previousRoasValue, (value) => formatPercent(value, 1));
    const pacingRatio = metrics.target > 0 ? metrics.spend / metrics.target : 0;

    return {
      id: campaign.id,
      name: campaign.name,
      status: humanise(campaign.status),
      objective: humanise(campaign.objective),
      spend: spendByCampaign.value,
      spendChange: spendByCampaign.change,
      conversions: conversionsByCampaign.value,
      conversionsChange: conversionsByCampaign.change,
      cpa:
        metrics.conversions > 0
          ? formatCurrency(metrics.spend / metrics.conversions, campaign.currency ?? currency)
          : formatCurrency(metrics.spend, campaign.currency ?? currency),
      roas: roasTrend.value,
      roasChange: roasTrend.change,
      pacing: pacingRatio > 0 ? `${Math.min(Math.round(pacingRatio * 100), 999)}% of target` : 'No pacing target',
      lastMetricDate: metrics.lastMetricDate,
      flights: (campaign.flights ?? []).length,
      window: `${campaign.startAt ? DateTime.fromJSDate(campaign.startAt).setZone(window.timezone).toISODate() : '—'} → ${
        campaign.endAt ? DateTime.fromJSDate(campaign.endAt).setZone(window.timezone).toISODate() : '—'
      }`
    };
  });

  const overdueInvoices = campaignInvoices.filter((invoice) => invoice.status === 'overdue');
  const invoiceRows = campaignInvoices.slice(0, EXPORT_ROW_LIMIT).map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    campaign: invoice.AdCampaign?.name ?? 'Campaign',
    status: humanise(invoice.status),
    amountDue: formatCurrency(
      parseDecimal(invoice.amountDue),
      invoice.currency || invoice.AdCampaign?.currency || currency
    ),
    amountPaid: formatCurrency(
      parseDecimal(invoice.amountPaid),
      invoice.currency || invoice.AdCampaign?.currency || currency
    ),
    dueDate: DateTime.fromJSDate(invoice.dueDate).setZone(window.timezone).toISODate()
  }));

  const adsAlerts = [
    ...campaignSignals.slice(0, 5).map((signal) => ({
      title: `${humanise(signal.signalType)} • ${signal.AdCampaign?.name ?? 'Campaign'}`,
      severity: humanise(signal.severity),
      description: signal.resolutionNote || 'Investigate flagged performance.',
      detectedAt: DateTime.fromJSDate(signal.detectedAt).setZone(window.timezone).toISODate(),
      flight: signal.CampaignFlight?.name ?? null
    })),
    ...overdueInvoices.slice(0, 3).map((invoice) => ({
      title: `Invoice ${invoice.invoiceNumber}`,
      severity: 'Warning',
      description: `Overdue • ${formatCurrency(
        parseDecimal(invoice.amountDue) - parseDecimal(invoice.amountPaid),
        invoice.currency || invoice.AdCampaign?.currency || currency
      )} outstanding for ${invoice.AdCampaign?.name ?? 'campaign'}.`,
      detectedAt: DateTime.fromJSDate(invoice.dueDate).setZone(window.timezone).toISODate(),
      flight: invoice.CampaignFlight?.name ?? null
    }))
  ];

  const timeline = campaigns
    .flatMap((campaign) =>
      (campaign.flights ?? []).map((flight) => ({
        title: `${flight.name} • ${campaign.name}`,
        status: humanise(flight.status),
        start: DateTime.fromJSDate(flight.startAt).setZone(window.timezone).toISODate(),
        end: DateTime.fromJSDate(flight.endAt).setZone(window.timezone).toISODate(),
        budget: formatCurrency(parseDecimal(flight.budget), campaign.currency ?? currency)
      }))
    )
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 6);

  const recommendations = [];
  if (adsShare < 0.2 && campaigns.length > 0) {
    recommendations.push({
      title: 'Expand Fixnado Ads coverage',
      description: 'Increase daily caps or add high-intent zones to lift attributed bookings.',
      action: 'Review targeting'
    });
  }
  if (ctr < 0.015) {
    recommendations.push({
      title: 'Refresh creative set',
      description: 'CTR below marketplace benchmark. Rotate creatives or optimise headlines.',
      action: 'Update creatives'
    });
  }
  if (overdueInvoices.length > 0) {
    recommendations.push({
      title: 'Resolve overdue invoices',
      description: `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? '' : 's'} require payment to keep delivery uninterrupted.`,
      action: 'Open billing centre'
    });
  }
  if (campaignSignals.some((signal) => signal.severity === 'critical')) {
    recommendations.push({
      title: 'Investigate critical fraud alerts',
      description: 'Critical anomalies detected. Validate traffic sources and pause impacted flights.',
      action: 'View fraud centre'
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Maintain optimisation cadence',
      description: 'Delivery, pacing, and billing are healthy. Continue monitoring automated guardrails.',
      action: 'Schedule weekly review'
    });
  }

  const costPerClick = safeAverage(currentCampaignTotals.spend, currentCampaignTotals.clicks);
  const costPerConversion = safeAverage(currentCampaignTotals.spend, currentCampaignTotals.conversions);
  const costPerMille = safeAverage(currentCampaignTotals.spend, currentCampaignTotals.impressions) * 1000;
  const ctrValue = safeShare(currentCampaignTotals.clicks, currentCampaignTotals.impressions);
  const cvrValue = safeShare(currentCampaignTotals.conversions, currentCampaignTotals.clicks);

  const pricingModels = [
    {
      id: 'ppc',
      label: 'Pay-per-click (PPC)',
      spend: spendTrend.value,
      unitCost: formatCurrency(costPerClick, currency),
      unitLabel: 'Cost per click',
      performance: `${formatPercent(
        currentCampaignTotals.clicks,
        currentCampaignTotals.impressions || currentCampaignTotals.clicks || 1
      )} CTR`,
      status: trendStatus(clicksTrend.trend)
    },
    {
      id: 'pp-conversion',
      label: 'Pay-per-conversion',
      spend: formatCurrency(currentCampaignTotals.spend, currency),
      unitCost: formatCurrency(costPerConversion, currency),
      unitLabel: 'Cost per conversion',
      performance: `${formatPercent(adsSourcedCount, currentCampaignTotals.conversions || adsSourcedCount || 1)} attributed`,
      status: trendStatus(conversionsTrend.trend)
    },
    {
      id: 'ppi',
      label: 'Pay-per-impression (PPI)',
      spend: formatCurrency(currentCampaignTotals.spend, currency),
      unitCost: formatCurrency(costPerMille, currency),
      unitLabel: 'CPM',
      performance: `${formatNumber(currentCampaignTotals.impressions)} impressions`,
      status: trendStatus(impressionsTrend.trend)
    }
  ];

  const channelAggregates = new Map();
  for (const campaign of campaigns) {
    const channel = normaliseChannel(campaign);
    const metrics = metricsByCampaign.get(campaign.id) ?? {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0
    };
    const aggregate = channelAggregates.get(channel) ?? {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      campaigns: 0
    };

    aggregate.spend += metrics.spend;
    aggregate.impressions += metrics.impressions;
    aggregate.clicks += metrics.clicks;
    aggregate.conversions += metrics.conversions;
    aggregate.campaigns += 1;

    channelAggregates.set(channel, aggregate);
  }

  const channelBreakdown = Array.from(channelAggregates.entries())
    .map(([channel, values]) => {
      const conversionShare = safeShare(values.conversions, currentCampaignTotals.conversions || values.conversions || 1);
      let status = 'Test';
      if (conversionShare >= 0.4) {
        status = 'Scaling';
      } else if (conversionShare >= 0.2) {
        status = 'Steady';
      }
      return {
        id: channel,
        label: channelLabel(channel),
        spend: formatCurrency(values.spend, currency),
        share: formatPercent(values.spend, currentCampaignTotals.spend || values.spend || 1),
        performance:
          values.clicks > 0 ? `${formatPercent(values.conversions, values.clicks)} CVR` : '0.0% CVR',
        status,
        campaigns: values.campaigns,
        _sort: values.spend
      };
    })
    .sort((a, b) => b._sort - a._sort)
    .map(({ _sort, ...rest }) => rest);

  if (channelBreakdown.length === 0) {
    channelBreakdown.push({
      id: 'omnichannel',
      label: 'Omnichannel Mix',
      spend: formatCurrency(currentCampaignTotals.spend, currency),
      share: formatPercent(currentCampaignTotals.spend, currentCampaignTotals.spend || 1),
      performance: `${formatPercent(currentCampaignTotals.conversions, currentCampaignTotals.clicks || 1)} CVR`,
      status: trendStatus(conversionsTrend.trend),
      campaigns: campaigns.length
    });
  }

  const adsAttributedAssignments = assignments.filter(
    (assignment) => assignment.Booking?.meta?.source === 'fixnado_ads'
  );
  const regionBreakdown = new Map();
  const propertyBreakdown = new Map();

  for (const assignment of adsAttributedAssignments) {
    const region = assignment.Booking?.meta?.region;
    if (typeof region === 'string' && region.trim()) {
      const key = region.trim();
      regionBreakdown.set(key, (regionBreakdown.get(key) ?? 0) + 1);
    }

    const propertyType = assignment.Booking?.meta?.propertyType;
    if (typeof propertyType === 'string' && propertyType.trim()) {
      const key = propertyType.trim();
      propertyBreakdown.set(key, (propertyBreakdown.get(key) ?? 0) + 1);
    }
  }

  const totalAdsAssignments = adsAttributedAssignments.length;
  const autoMatchedAds = adsAttributedAssignments.filter((assignment) => assignment.Booking?.meta?.autoMatched);
  const automationShare = safeShare(autoMatchedAds.length, totalAdsAssignments || 1);

  const regionSegments = Array.from(regionBreakdown.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([region, count], index) => {
      const share = safeShare(count, totalAdsAssignments || count || 1);
      const status = share >= 0.4 ? 'Primary' : share >= 0.2 ? 'Scaling' : 'Explore';
      return {
        id: `region-${index}`,
        label: region,
        metric: `${formatNumber(count)} jobs`,
        share: formatPercent(count, totalAdsAssignments || count || 1),
        status,
        helper: 'Regional reach from Fixnado Ads'
      };
    });

  const propertySegments = Array.from(propertyBreakdown.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([property, count], index) => {
      const share = safeShare(count, totalAdsAssignments || count || 1);
      const status = share >= 0.3 ? 'High intent' : share >= 0.15 ? 'Growing' : 'Niche';
      return {
        id: `property-${index}`,
        label: `${property} properties`,
        metric: `${formatNumber(count)} jobs`,
        share: formatPercent(count, totalAdsAssignments || count || 1),
        status,
        helper: 'Property segment performance'
      };
    });

  const targetingSegments = [...regionSegments, ...propertySegments];

  if (totalAdsAssignments > 0) {
    targetingSegments.push({
      id: 'automation',
      label: 'Auto-matched routing',
      metric: `${formatPercent(autoMatchedAds.length, totalAdsAssignments || 1)} of ads jobs`,
      share: formatPercent(autoMatchedAds.length, totalAdsAssignments || autoMatchedAds.length || 1),
      status: automationShare >= 0.4 ? 'Scaling' : automationShare >= 0.2 ? 'Steady' : 'Enable',
      helper: 'Automation coverage for ad-sourced jobs'
    });
  }

  if (targetingSegments.length === 0) {
    targetingSegments.push({
      id: 'coverage',
      label: 'Campaign coverage',
      metric: `${formatNumber(adsSourcedCount)} attributed jobs`,
      share: formatPercent(adsSourcedCount, totalAssignments || adsSourcedCount || 1),
      status: adsSourcedCount > 0 ? 'Scaling' : 'Pending',
      helper: 'Attribution from Fixnado Ads'
    });
  }

  const severityOrder = { critical: 4, high: 3, warning: 2, info: 1 };
  const signalSummaries = new Map();
  for (const signal of campaignSignals) {
    const type = typeof signal.signalType === 'string' ? signal.signalType.toLowerCase() : 'performance';
    const severity = typeof signal.severity === 'string' ? signal.severity.toLowerCase() : 'info';
    const rank = severityOrder[severity] ?? 1;
    const existing = signalSummaries.get(type);
    if (!existing || rank > existing.rank) {
      signalSummaries.set(type, {
        label: humanise(signal.signalType) || 'Campaign signal',
        severity,
        description: signal.resolutionNote || 'Guardrail triggered',
        detectedAt: DateTime.fromJSDate(signal.detectedAt).setZone(window.timezone).toISODate(),
        rank
      });
    }
  }

  const contentInsights = Array.from(signalSummaries.values()).map((summary, index) => ({
    id: `signal-${index}`,
    label: summary.label,
    severity: humanise(summary.severity),
    message: summary.description,
    detectedAt: summary.detectedAt
  }));

  const insightNow = DateTime.now().setZone(window.timezone).toISODate();
  let ctrSeverity = 'Healthy';
  if (ctrValue < 0.015) {
    ctrSeverity = 'Critical';
  } else if (ctrValue < 0.025) {
    ctrSeverity = 'Warning';
  }
  contentInsights.push({
    id: 'ctr-health',
    label: 'Click-through rate',
    severity: ctrSeverity,
    message: `CTR ${formatPercent(
      currentCampaignTotals.clicks,
      currentCampaignTotals.impressions || currentCampaignTotals.clicks || 1
    )} across placements.`,
    detectedAt: insightNow
  });

  let cvrSeverity = 'Healthy';
  if (cvrValue < 0.04) {
    cvrSeverity = 'Monitor';
  } else if (cvrValue < 0.06) {
    cvrSeverity = 'Warning';
  }
  contentInsights.push({
    id: 'cvr-health',
    label: 'Conversion rate',
    severity: cvrSeverity,
    message: `CVR ${formatPercent(
      currentCampaignTotals.conversions,
      currentCampaignTotals.clicks || currentCampaignTotals.conversions || 1
    )} with ${formatNumber(adsSourcedCount)} bookings.`,
    detectedAt: insightNow
  });

  const seenInsights = new Set();
  const uniqueContentInsights = [];
  for (const insight of contentInsights) {
    const key = `${insight.label}-${insight.severity}`;
    if (seenInsights.has(key)) {
      continue;
    }
    seenInsights.add(key);
    uniqueContentInsights.push(insight);
  }

  if (uniqueContentInsights.length === 0) {
    uniqueContentInsights.push({
      id: 'creative-health',
      label: 'Creative health',
      severity: 'Healthy',
      message: 'No guardrail breaches detected in the current window.',
      detectedAt: insightNow
    });
  }

  const adsData = {
    summaryCards,
    funnel: funnelStages,
    campaigns: campaignsData,
    invoices: invoiceRows.slice(0, 8),
    alerts: adsAlerts.slice(0, 6),
    recommendations,
    timeline,
    pricingModels,
    channelMix: channelBreakdown,
    targeting: targetingSegments,
    creativeInsights: uniqueContentInsights
  };

  const navigation = [
    {
      id: 'overview',
      label: 'Provider Overview',
      description: 'Bookings, acceptance, and crew utilisation trends.',
      type: 'overview',
      analytics: overview
    },
    {
      id: 'workboard',
      label: 'Workboard',
      description: 'Track assignments through confirmation and follow-up.',
      type: 'board',
      data: { columns: boardColumns }
    },
    {
      id: 'rentals',
      label: 'Rental Lifecycle',
      description: 'Monitor rental fulfilment and deposit status.',
      type: 'table',
      data: {
        headers: ['Rental', 'Status', 'Pickup', 'Return Due', 'Deposit'],
        rows: rentalRows
      }
    },
    {
      id: 'inventory',
      label: 'Tools & Materials',
      description: 'Inventory availability, low-stock signals, and maintenance cadence.',
      type: 'inventory',
      data: {
        summary: [
          {
            id: 'available',
            label: 'Available units',
            value: inventorySummary.available,
            helper: `${formatNumber(inventoryItems.length)} SKUs tracked`,
            tone: 'info'
          },
          {
            id: 'reserved',
            label: 'Reserved',
            value: inventorySummary.reserved,
            helper: `${formatNumber(inventorySummary.onHand)} on hand`,
            tone: 'accent'
          },
          {
            id: 'alerts',
            label: 'Alerts',
            value: inventorySummary.alerts,
            helper: inventorySummary.alerts > 0 ? 'Action required' : 'All healthy',
            tone: inventorySummary.alerts > 0 ? 'warning' : 'positive'
          }
        ],
        groups: [
          { id: 'materials', label: 'Materials', items: materialsInventory },
          { id: 'tools', label: 'Tools', items: toolsInventory }
        ]
      }
    }
  ];

  const adsSection = annotateAdsSection('provider', {
    id: 'fixnado-ads',
    label: 'Fixnado Ads',
    description: 'Campaign pacing, spend, guardrails, and billing.',
    icon: 'analytics',
    type: 'ads',
    data: adsData
  });

  if (adsSection) {
    navigation.push(adsSection);
  }

  navigation.push({
    id: 'asset-alerts',
    label: 'Asset Alerts',
    description: 'Active inventory notifications requiring action.',
    type: 'list',
    data: { items: alertItems }
  });

  return {
    persona: 'provider',
    name: PERSONA_METADATA.provider.name,
    headline: PERSONA_METADATA.provider.headline,
    window,
    metadata: {
      providerId: providerId ?? null,
      companyId: companyId ?? null,
      totals: {
        assignments: totalAssignments,
        revenue,
        acceptanceRate,
        completionRate,
        inventory: {
          onHand: inventorySummary.onHand,
          reserved: inventorySummary.reserved,
          available: inventorySummary.available,
          skuCount: inventoryItems.length,
          alerts: inventorySummary.alerts
        },
        ads: {
          spend: currentCampaignTotals.spend,
          revenue: currentCampaignTotals.revenue,
          conversions: currentCampaignTotals.conversions,
          share: adsShare,
          jobs: adsSourcedCount
        }
      },
      features: {
        ads: buildAdsFeatureMetadata('provider')
      }
    },
    navigation
  };
}

async function loadServicemanData(context) {
  const { providerId, window } = context;

  const providerFilter = providerId ? { providerId } : {};

  const [assignments, previousAssignments, bids, services, metricsBundle] = await Promise.all([
    BookingAssignment.findAll({
      where: {
        ...providerFilter,
        createdAt: asDateRange(window.start, window.end)
      },
      include: [{ model: Booking }]
    }),
    BookingAssignment.findAll({
      where: {
        ...providerFilter,
        createdAt: asDateRange(window.previousStart, window.previousEnd)
      },
      include: [{ model: Booking }]
    }),
    BookingBid.findAll({
      where: {
        ...providerFilter,
        submittedAt: asDateRange(window.start, window.end)
      },
      include: [{ model: Booking }],
      order: [['submittedAt', 'DESC']]
    }),
    Service.findAll({
      where: providerFilter,
      limit: EXPORT_ROW_LIMIT,
      order: [['updatedAt', 'DESC']]
    }),
    getServicemanMetricsBundle({ includeInactiveCards: true })
  ]);

  const { settings: metricsSettings, cards: metricsCards } = metricsBundle;

  const providerIds = Array.from(
    new Set(assignments.map((assignment) => assignment.providerId).filter(Boolean))
  );

  const crewRecords = providerIds.length
    ? await User.findAll({
        where: { id: { [Op.in]: providerIds } },
        attributes: ['id', 'firstName', 'lastName', 'type', 'createdAt']
      })
    : [];

  const completed = assignments.filter((assignment) => assignment.Booking?.status === 'completed').length;
  const inProgress = assignments.filter((assignment) => assignment.Booking?.status === 'in_progress').length;
  const scheduled = assignments.filter((assignment) => assignment.Booking?.status === 'scheduled').length;
  const revenue = assignments.reduce((sum, assignment) => sum + parseDecimal(assignment.Booking?.commissionAmount), 0);

  const previousCompleted = previousAssignments.filter((assignment) => assignment.Booking?.status === 'completed').length;
  const previousScheduled = previousAssignments.filter((assignment) => assignment.Booking?.status === 'scheduled').length;
  const previousInProgress = previousAssignments.filter((assignment) => assignment.Booking?.status === 'in_progress').length;
  const previousRevenue = previousAssignments.reduce(
    (sum, assignment) => sum + parseDecimal(assignment.Booking?.commissionAmount),
    0
  );

  const crewSummaries = crewRecords.map((record) => {
    const crewAssignments = assignments.filter((assignment) => assignment.providerId === record.id);
    const completedAssignments = crewAssignments.filter((assignment) => assignment.Booking?.status === 'completed').length;
    const activeAssignments = crewAssignments.filter((assignment) =>
      ['scheduled', 'in_progress'].includes(assignment.Booking?.status)
    ).length;
    const leadAssignments = crewAssignments.filter((assignment) => assignment.role === 'lead').length;

    return {
      id: record.id,
      name: [record.firstName, record.lastName].filter(Boolean).join(' ') || 'Crew member',
      role: leadAssignments > 0 ? 'Lead technician' : 'Field technician',
      assignments: crewAssignments.length,
      completed: completedAssignments,
      active: activeAssignments
    };
  });

  crewSummaries.sort((a, b) => b.assignments - a.assignments || a.name.localeCompare(b.name));

  const crewLead = crewSummaries.find((member) => member.role === 'Lead technician') ?? crewSummaries[0] ?? null;

  const coverageRegions = assignments
    .map((assignment) => assignment.Booking?.meta?.region)
    .filter((region) => typeof region === 'string' && region.trim().length > 0);

  const primaryRegion = coverageRegions[0] ?? 'Multi-zone coverage';

  const travelBufferMinutes = assignments.reduce((sum, assignment) => {
    const metaMinutes = Number.parseInt(assignment.Booking?.meta?.travelMinutes ?? 0, 10);
    return sum + (Number.isFinite(metaMinutes) ? metaMinutes : 0);
  }, 0);
  const previousTravelBufferMinutes = previousAssignments.reduce((sum, assignment) => {
    const metaMinutes = Number.parseInt(assignment.Booking?.meta?.travelMinutes ?? 0, 10);
    return sum + (Number.isFinite(metaMinutes) ? metaMinutes : 0);
  }, 0);

  const avgTravelMinutes = assignments.length ? Math.round(travelBufferMinutes / assignments.length) : 0;
  const previousAvgTravelMinutes = previousAssignments.length
    ? Math.round(previousTravelBufferMinutes / previousAssignments.length)
    : 0;

  const autoMatchedAssignments = assignments.filter((assignment) => assignment.Booking?.meta?.autoMatched);
  const autoMatchedCount = autoMatchedAssignments.length;
  const adsSourcedCount = assignments.filter(
    (assignment) => assignment.Booking?.meta?.source === 'fixnado_ads'
  ).length;

  const bookingCurrency = assignments[0]?.Booking?.currency ?? 'GBP';

  const scheduledUpcoming = assignments
    .filter((assignment) => assignment.Booking?.scheduledStart)
    .sort((a, b) => new Date(a.Booking.scheduledStart) - new Date(b.Booking.scheduledStart))
    .slice(0, UPCOMING_LIMIT)
    .map((assignment) => {
      const scheduledStart = assignment.Booking?.scheduledStart;
      const status = assignment.Booking?.status ?? 'scheduled';
      const statusLabel = status.replace(/_/g, ' ');
      return {
        title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
        when: scheduledStart
          ? DateTime.fromJSDate(scheduledStart)
              .setZone(window.timezone)
              .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
          : 'Awaiting schedule',
        status: statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)
      };
    });

  const weeklyVelocityBuckets = [];
  let cursor = window.start.startOf('week');
  while (cursor < window.end) {
    const bucketEnd = cursor.plus({ weeks: 1 });
    weeklyVelocityBuckets.push({
      start: cursor,
      end: bucketEnd,
      label: cursor.toFormat('dd LLL'),
      accepted: 0,
      autoMatches: 0
    });
    cursor = bucketEnd;
  }

  for (const assignment of assignments) {
    const assignedAt = assignment.assignedAt ?? assignment.createdAt;
    if (!assignedAt) continue;
    const dt = DateTime.fromJSDate(assignedAt).setZone(window.timezone);
    const bucket = weeklyVelocityBuckets.find((entry) => dt >= entry.start && dt < entry.end);
    if (!bucket) continue;
    if (assignment.status === 'accepted') {
      bucket.accepted += 1;
    }
    if (assignment.Booking?.meta?.autoMatched) {
      bucket.autoMatches += 1;
    }
  }

  const overview = {
    metrics: [
      {
        label: 'Assignments Completed',
        ...computeTrend(completed, previousCompleted, formatNumber, ' jobs')
      },
      {
        label: 'In Progress',
        ...computeTrend(inProgress, previousInProgress, formatNumber, ' jobs')
      },
      {
        label: 'Scheduled',
        ...computeTrend(scheduled, previousScheduled, formatNumber, ' jobs')
      },
      {
        label: 'Avg. Travel Buffer',
        ...computeTrend(
          avgTravelMinutes,
          previousAvgTravelMinutes,
          (value) => `${formatNumber(value)} mins`
        )
      },
      {
        label: 'Commission Earned',
        ...computeTrend(revenue, previousRevenue, (value) => formatCurrency(value, bookingCurrency))
      }
    ],
    charts: [
      {
        id: 'assignment-status-mix',
        title: 'Status Mix',
        description: 'Current allocation of assignments by status.',
        type: 'bar',
        dataKey: 'count',
        data: [
          { name: 'Pending', count: assignments.filter((assignment) => assignment.status === 'pending').length },
          { name: 'Accepted', count: assignments.filter((assignment) => assignment.status === 'accepted').length },
          { name: 'Declined', count: assignments.filter((assignment) => assignment.status === 'declined').length }
        ]
      },
      {
        id: 'assignment-velocity',
        title: 'Assignment Velocity',
        description: 'Accepted jobs and auto-matches per week.',
        type: 'bar',
        dataKey: 'accepted',
        secondaryKey: 'autoMatches',
        data: weeklyVelocityBuckets.map((bucket) => ({
          name: bucket.label,
          accepted: bucket.accepted,
          autoMatches: bucket.autoMatches
        }))
      }
    ],
    upcoming: scheduledUpcoming,
    insights: [
      `${formatNumber(inProgress)} active jobs and ${formatNumber(scheduled)} scheduled this window`,
      `${formatCurrency(revenue, bookingCurrency)} commission accrued after platform fees`,
      `${formatNumber(autoMatchedCount)} assignments auto-matched • ${formatNumber(adsSourcedCount)} sourced via Fixnado Ads`
    ]
  };

  const boardColumns = [
    {
      title: 'Today',
      items: assignments
        .filter((assignment) => {
          if (!assignment.Booking?.scheduledStart) return false;
          const dt = DateTime.fromJSDate(assignment.Booking.scheduledStart).setZone(window.timezone);
          return dt.hasSame(window.end, 'day');
        })
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: assignment.Booking?.meta?.siteContact || assignment.Booking?.meta?.requester || 'Contact pending',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency),
          eta: assignment.Booking?.scheduledStart
            ? DateTime.fromJSDate(assignment.Booking.scheduledStart).setZone(window.timezone).toRelative({ base: window.end })
            : 'Scheduled soon'
        }))
    },
    {
      title: 'This Week',
      items: assignments
        .filter((assignment) => {
          if (!assignment.Booking?.scheduledStart) return false;
          const dt = DateTime.fromJSDate(assignment.Booking.scheduledStart).setZone(window.timezone);
          return dt >= window.end.startOf('week') && dt <= window.end.endOf('week');
        })
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: assignment.Booking?.meta?.zoneName || assignment.Booking?.meta?.owner || 'Zone pending',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency),
          eta: assignment.Booking?.scheduledStart
            ? DateTime.fromJSDate(assignment.Booking.scheduledStart).setZone(window.timezone).toRelative({ base: window.end })
            : 'Scheduled soon'
        }))
    },
    {
      title: 'Requires Attention',
      items: assignments
        .filter((assignment) => assignment.Booking?.status === 'disputed')
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: assignment.Booking?.meta?.owner || 'Support',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency),
          eta: 'Dispute open'
        }))
    },
    {
      title: 'Completed',
      items: assignments
        .filter((assignment) => assignment.Booking?.status === 'completed')
        .slice(0, 4)
        .map((assignment) => ({
          title: assignment.Booking?.meta?.title || `Job ${assignment.Booking?.id?.slice(0, 4)}`,
          owner: assignment.Booking?.meta?.customerName || assignment.Booking?.meta?.requester || 'Client',
          value: formatCurrency(assignment.Booking?.totalAmount, assignment.Booking?.currency),
          eta: 'Feedback requested'
        }))
    }
  ];

  const bidStageLookup = {
    new: 'New Requests',
    negotiation: 'Negotiation',
    awarded: 'Awarded',
    closed: 'Closed Out'
  };

  const determineBidStage = (bid) => {
    if (bid.status === 'accepted') {
      return 'awarded';
    }
    if (bid.status === 'declined' || bid.status === 'withdrawn') {
      return 'closed';
    }
    const revisions = Array.isArray(bid.revisionHistory) ? bid.revisionHistory.length : 0;
    const audits = Array.isArray(bid.auditLog) ? bid.auditLog.length : 0;
    if (revisions > 0 || audits > 0) {
      return 'negotiation';
    }
    return 'new';
  };

  const bidColumns = Object.entries(bidStageLookup).map(([stage, title]) => ({
    stage,
    title,
    items: []
  }));

  for (const bid of bids) {
    const booking = bid.Booking;
    const column = bidColumns.find((col) => col.stage === determineBidStage(bid));
    if (!column) continue;
    const submittedAt = bid.submittedAt ? DateTime.fromJSDate(bid.submittedAt).setZone(window.timezone) : null;
    column.items.push({
      title: booking?.meta?.title || `Bid ${bid.id.slice(0, 6)}`,
      owner: booking?.meta?.requester || booking?.meta?.owner || 'Client',
      value: formatCurrency(bid.amount, bid.currency || booking?.currency || bookingCurrency),
      eta: submittedAt ? `Submitted ${submittedAt.toRelative({ base: window.end })}` : 'Submission pending'
    });
  }

  const serviceLookup = new Map(services.map((service) => [service.id, service]));
  const serviceStats = new Map();

  for (const assignment of assignments) {
    const booking = assignment.Booking;
    if (!booking?.meta?.serviceId) continue;
    const service = serviceLookup.get(booking.meta.serviceId);
    if (!service) continue;
    const currentStats = serviceStats.get(service.id) ?? {
      total: 0,
      active: 0,
      completed: 0,
      revenue: 0,
      autoMatches: 0,
      sources: {}
    };
    currentStats.total += 1;
    if (booking.status === 'completed') {
      currentStats.completed += 1;
    } else if (['scheduled', 'in_progress'].includes(booking.status)) {
      currentStats.active += 1;
    }
    currentStats.revenue += parseDecimal(booking.totalAmount);
    if (booking.meta?.autoMatched) {
      currentStats.autoMatches += 1;
    }
    const source = booking.meta?.source ?? 'marketplace';
    currentStats.sources[source] = (currentStats.sources[source] ?? 0) + 1;
    serviceStats.set(service.id, currentStats);
  }

  const sourceLabels = {
    fixnado_ads: 'Fixnado Ads',
    marketplace: 'Marketplace',
    partner_referral: 'Partner referral'
  };

  const serviceCards = services.slice(0, 9).map((service) => {
    const stats = serviceStats.get(service.id) ?? {
      total: 0,
      active: 0,
      completed: 0,
      revenue: 0,
      autoMatches: 0,
      sources: {}
    };
    const averageValue = stats.total ? stats.revenue / stats.total : 0;
    const topSourceEntry = Object.entries(stats.sources).sort((a, b) => b[1] - a[1])[0];
    const topSourceLabel = topSourceEntry ? sourceLabels[topSourceEntry[0]] ?? topSourceEntry[0] : 'Marketplace';

    return {
      title: service.title,
      details: [
        `${formatNumber(stats.completed)} completed • ${formatNumber(stats.active)} active`,
        `Avg value ${formatCurrency(averageValue, service.currency ?? bookingCurrency)}`,
        stats.autoMatches > 0
          ? `${formatNumber(stats.autoMatches)} auto-matched wins`
          : 'Awaiting auto-match wins',
        `Top source: ${topSourceLabel}`
      ],
      accent: 'from-sky-50 via-white to-indigo-100'
    };
  });

  const automationItems = [
    {
      title: 'Auto-match performance',
      description: `${formatPercent(autoMatchedCount, assignments.length || 1)} of jobs auto-routed to your crew this window`,
      status: autoMatchedCount / Math.max(assignments.length, 1) >= 0.5 ? 'On track' : 'Needs review'
    },
    {
      title: 'Fixnado Ads impact',
      description: `${formatNumber(adsSourcedCount)} jobs sourced via Fixnado Ads in the current window`,
      status: adsSourcedCount > 0 ? 'Active campaigns' : 'Launch campaign'
    },
    {
      title: 'Travel buffer health',
      description: `Average buffer ${formatNumber(avgTravelMinutes)} mins across ${formatNumber(assignments.length)} jobs`,
      status: avgTravelMinutes > 45 ? 'Optimise routing' : 'Efficient routing'
    }
  ];

  return {
    persona: 'serviceman',
    name: PERSONA_METADATA.serviceman.name,
    headline: PERSONA_METADATA.serviceman.headline,
    window,
    metadata: {
      providerId: providerId ?? null,
      region: primaryRegion,
      crewLead,
      crew: crewSummaries,
      velocity: {
        travelMinutes: avgTravelMinutes,
        previousTravelMinutes: previousAvgTravelMinutes,
        weekly: weeklyVelocityBuckets.map((bucket) => ({
          label: bucket.label,
          accepted: bucket.accepted,
          autoMatches: bucket.autoMatches
        }))
      },
      totals: {
        completed,
        inProgress,
        scheduled,
        revenue,
        autoMatched: autoMatchedCount,
        adsSourced: adsSourcedCount
      },
      features: {
        ads: buildAdsFeatureMetadata('serviceman')
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Crew Overview',
        description: 'Assignments, travel buffers, and earnings.',
        type: 'overview',
        analytics: overview
      },
      {
        id: 'metrics',
        label: 'Metrics',
        description: 'Crew KPIs, readiness checklists, and automation guardrails.',
        type: 'serviceman-metrics',
        access: {
          label: 'Crew metrics control',
          level: 'manage',
          features: ['targets', 'checklists', 'automation']
        },
        data: {
          settings: metricsSettings,
          cards: metricsCards,
          metadata: metricsSettings?.metadata ?? {},
          operations: metricsSettings?.operations ?? {}
        }
      },
      {
        id: 'schedule',
        label: 'Schedule Board',
        description: 'Daily and weekly workload.',
        type: 'board',
        data: { columns: boardColumns }
      },
      {
        id: 'bid-pipeline',
        label: 'Bid Pipeline',
        description: 'Track bids from submission through award.',
        type: 'board',
        data: { columns: bidColumns.map(({ title, items }) => ({ title, items })) }
      },
      {
        id: 'service-catalogue',
        label: 'Service Catalogue',
        description: 'Performance of services offered to Fixnado clients.',
        type: 'grid',
        data: { cards: serviceCards }
      },
      {
        id: 'automation',
        label: 'Automation & Growth',
        description: 'Auto-match, routing, and acquisition insights.',
        type: 'list',
        data: { items: automationItems }
      }
    ]
  };
}

async function loadEnterpriseData(context) {
  const { companyId, window } = context;

  const [bookings, campaignMetrics, complianceDocs, participants] = await Promise.all([
    Booking.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        createdAt: asDateRange(window.start, window.end)
      }
    }),
    CampaignDailyMetric.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['currency', 'name'],
          where: companyId ? { companyId } : undefined,
          required: !!companyId
        }
      ],
      where: {
        metricDate: asDateRange(window.start, window.end)
      }
    }),
    ComplianceDocument.findAll({
      where: {
        ...(companyId ? { companyId } : {}),
        status: { [Op.in]: ['approved', 'expired', 'rejected'] }
      }
    }),
    ConversationParticipant.findAll({
      where: {
        participantType: 'enterprise',
        participantReferenceId: companyId ? companyId : null,
        createdAt: asDateRange(window.start, window.end)
      }
    })
  ]);

  const spend = campaignMetrics.reduce((sum, metric) => sum + parseDecimal(metric.spend), 0);
  const revenue = campaignMetrics.reduce((sum, metric) => sum + parseDecimal(metric.revenue), 0);
  const currency = campaignMetrics[0]?.AdCampaign?.currency || 'GBP';
  const ctr = campaignMetrics.reduce((sum, metric) => sum + parseDecimal(metric.ctr), 0) / Math.max(campaignMetrics.length, 1);
  const cvr = campaignMetrics.reduce((sum, metric) => sum + parseDecimal(metric.cvr), 0) / Math.max(campaignMetrics.length, 1);
  const activeContracts = complianceDocs.filter((doc) => doc.status === 'approved').length;
  const expiredContracts = complianceDocs.filter((doc) => doc.status === 'expired').length;

  const overview = {
    metrics: [
      { label: 'Campaign Spend', value: formatCurrency(spend, currency), change: `${campaignMetrics.length} metric days`, trend: 'up' },
      { label: 'Campaign Revenue', value: formatCurrency(revenue, currency), change: formatPercent(revenue, spend), trend: 'up' },
      { label: 'Average CTR', value: formatPercent(ctr, 1), change: 'Blended channel performance', trend: 'up' },
      { label: 'Average CVR', value: formatPercent(cvr, 1), change: 'Bookings attributed to campaigns', trend: 'up' }
    ],
    charts: [
      {
        id: 'campaign-pacing',
        title: 'Campaign Pacing',
        description: 'Daily spend compared to target.',
        type: 'line',
        dataKey: 'spend',
        secondaryKey: 'target',
        data: campaignMetrics.slice(0, 14).map((metric) => ({
          name: DateTime.fromJSDate(metric.metricDate).setZone(window.timezone).toFormat('dd LLL'),
          spend: Number.parseFloat(parseDecimal(metric.spend).toFixed(2)),
          target: Number.parseFloat(parseDecimal(metric.spendTarget ?? metric.spend).toFixed(2))
        }))
      }
    ],
    upcoming: bookings
      .filter((booking) => booking.scheduledStart)
      .slice(0, UPCOMING_LIMIT)
      .map((booking) => ({
        title: booking.meta?.title || `Service ${booking.id.slice(0, 4).toUpperCase()}`,
        when: DateTime.fromJSDate(booking.scheduledStart).setZone(window.timezone).toLocaleString(DateTime.DATETIME_MED),
        status: booking.status
      })),
    insights: [
      `${formatCurrency(spend, currency)} spend managed across enterprise campaigns`,
      `${activeContracts} active compliance artefacts • ${expiredContracts} expired`,
      `${participants.length} enterprise participants engaged in communications`
    ]
  };

  const complianceRows = complianceDocs.slice(0, EXPORT_ROW_LIMIT).map((doc) => [
    doc.type,
    doc.status,
    doc.expiryAt ? DateTime.fromJSDate(doc.expiryAt).setZone(window.timezone).toISODate() : '—',
    doc.reviewerId ? 'Reviewed' : 'Pending',
    doc.rejectionReason || '—'
  ]);

  return {
    persona: 'enterprise',
    name: PERSONA_METADATA.enterprise.name,
    headline: PERSONA_METADATA.enterprise.headline,
    window,
    metadata: {
      companyId: companyId ?? null,
      totals: {
        spend,
        revenue,
        activeContracts,
        communications: participants.length
      },
      features: {
        ads: buildAdsFeatureMetadata('enterprise')
      }
    },
    navigation: [
      {
        id: 'overview',
        label: 'Enterprise Overview',
        description: 'Campaign pacing, attributed bookings, and compliance.',
        type: 'overview',
        analytics: overview
      },
      {
        id: 'compliance',
        label: 'Compliance Library',
        description: 'Review enterprise contract health.',
        type: 'table',
        data: {
          headers: ['Document', 'Status', 'Expiry', 'Reviewer', 'Notes'],
          rows: complianceRows
        }
      }
    ]
  };
}

async function resolveContext(persona, query, window) {
  const defaults = PERSONA_DEFAULTS[persona] ?? {};

  switch (persona) {
    case 'admin':
      return {
        persona,
        window,
        companyId: await resolveCompanyId({ companyId: query.companyId ?? defaults.companyId })
      };
    case 'provider':
      return {
        persona,
        window,
        providerId: normaliseUuid(query.providerId ?? defaults.providerId),
        companyId: await resolveCompanyId({ companyId: query.companyId ?? defaults.companyId })
      };
    case 'serviceman':
      return {
        persona,
        window,
        providerId: normaliseUuid(query.providerId ?? defaults.providerId)
      };
    case 'enterprise':
      return {
        persona,
        window,
        companyId: await resolveCompanyId({ companyId: query.companyId ?? defaults.companyId })
      };
    case 'user': {
      const resolvedUserId = await resolveUserId({ userId: query.userId ?? defaults.userId });
      const shouldResolveCompany = query.companyId || defaults.companyId;
      const resolvedCompanyId = shouldResolveCompany
        ? await resolveCompanyId({ companyId: query.companyId ?? defaults.companyId })
        : null;
      return { persona, window, userId: resolvedUserId, companyId: resolvedCompanyId };
    }
    default:
      throw new Error('Unsupported persona');
  }
}

export async function getPersonaDashboard(personaInput, query = {}) {
  const persona = resolvePersona(personaInput);
  if (!persona) {
    const error = new Error('persona_not_supported');
    error.statusCode = 404;
    throw error;
  }

  const window = resolveWindow(query);
  const context = await resolveContext(persona, query, window);

  if (persona === 'user') {
    return loadUserData(context);
  }
  if (persona === 'admin') {
    return loadAdminData(context);
  }
  if (persona === 'provider') {
    return loadProviderData(context);
  }
  if (persona === 'serviceman') {
    return loadServicemanData(context);
  }
  if (persona === 'enterprise') {
    return loadEnterpriseData(context);
  }

  const error = new Error('persona_not_supported');
  error.statusCode = 404;
  throw error;
}

function escapeCsvValue(value) {
  if (value == null) {
    return '';
  }
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function flattenOverview(overview) {
  const rows = [['Metric', 'Value', 'Change', 'Trend']];
  for (const metric of overview.metrics ?? []) {
    rows.push([metric.label, metric.value, metric.change, metric.trend]);
  }
  rows.push([]);
  rows.push(['Chart', 'Description', 'Data']);
  for (const chart of overview.charts ?? []) {
    rows.push([chart.title, chart.description, JSON.stringify(chart.data)]);
  }
  rows.push([]);
  rows.push(['Upcoming']);
  for (const event of overview.upcoming ?? []) {
    rows.push([event.title, event.when, event.status]);
  }
  rows.push([]);
  rows.push(['Insights']);
  for (const insight of overview.insights ?? []) {
    rows.push([insight]);
  }
  return rows;
}

function flattenSection(section) {
  if (section.type === 'overview') {
    return flattenOverview(section.analytics ?? {});
  }

  if (section.type === 'table') {
    const rows = [section.data?.headers ?? []];
    for (const row of section.data?.rows ?? []) {
      rows.push(row);
    }
    return rows;
  }

  if (section.type === 'board') {
    const rows = [['Stage', 'Item', 'Owner', 'Value', 'ETA']];
    for (const column of section.data?.columns ?? []) {
      for (const item of column.items ?? []) {
        rows.push([column.title, item.title, item.owner ?? '', item.value ?? '', item.eta ?? '']);
      }
    }
    return rows;
  }

  if (section.type === 'list') {
    const rows = [['Title', 'Description', 'Status']];
    for (const item of section.data?.items ?? []) {
      rows.push([item.title, item.description, item.status]);
    }
    return rows;
  }

  if (section.type === 'grid') {
    const rows = [['Card', 'Details']];
    for (const card of section.data?.cards ?? []) {
      rows.push([card.title, (card.details ?? []).join(' | ')]);
    }
    return rows;
  }

  if (section.type === 'ads') {
    const rows = [['Category', 'Name', 'Value', 'Notes']];
    for (const card of section.data?.summaryCards ?? []) {
      rows.push(['Summary', card.title, card.value, `${card.change ?? ''} ${card.helper ?? ''}`.trim()]);
    }
    for (const stage of section.data?.funnel ?? []) {
      rows.push(['Funnel', stage.title, stage.value, stage.helper ?? '']);
    }
    for (const campaign of section.data?.campaigns ?? []) {
      rows.push([
        'Campaign',
        campaign.name,
        campaign.spend,
        `Status ${campaign.status} · ${campaign.pacing} · ROAS ${campaign.roas ?? ''}`.trim()
      ]);
    }
    for (const invoice of section.data?.invoices ?? []) {
      rows.push(['Invoice', invoice.invoiceNumber ?? '', invoice.amountDue ?? '', `${invoice.campaign ?? ''} • ${invoice.status ?? ''} • due ${invoice.dueDate ?? ''}`.trim()]);
    }
    for (const alert of section.data?.alerts ?? []) {
      rows.push(['Alert', alert.title ?? '', alert.severity ?? '', `${alert.description ?? ''} ${alert.detectedAt ?? ''}`.trim()]);
    }
    return rows;
  }

  if (section.type === 'settings') {
    const rows = [['Panel', 'Setting', 'Value', 'Details']];
    for (const panel of section.data?.panels ?? []) {
      for (const item of panel.items ?? []) {
        const value =
          item.type === 'toggle'
            ? item.enabled
              ? 'Enabled'
              : 'Disabled'
            : item.value ?? '';
        rows.push([panel.title ?? panel.id ?? 'Panel', item.label ?? '', value, item.helper ?? '']);
      }
    }
    return rows;
  }

  return [];
}

export function buildDashboardExport(dashboard) {
  const lines = [];
  lines.push(['Persona', dashboard.persona]);
  lines.push(['Name', dashboard.name]);
  lines.push(['Window Start', toIso(dashboard.window?.start)]);
  lines.push(['Window End', toIso(dashboard.window?.end)]);
  lines.push(['Timezone', dashboard.window?.timezone ?? DEFAULT_TIMEZONE]);
  lines.push([]);

  for (const section of dashboard.navigation ?? []) {
    lines.push([section.label ?? section.id ?? 'Section']);
    for (const row of flattenSection(section)) {
      lines.push(row);
    }
    lines.push([]);
  }

  return lines
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
}

export function buildExportPath(persona, query = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') continue;
    searchParams.set(key, value);
  }
  const suffix = searchParams.toString();
  return `/api/analytics/dashboards/${persona}/export${suffix ? `?${suffix}` : ''}`;
}
