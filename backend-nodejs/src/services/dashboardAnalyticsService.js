import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import config from '../config/index.js';
import {
  AdCampaign,
  Booking,
  BookingAssignment,
  BookingBid,
  CampaignDailyMetric,
  CampaignFraudSignal,
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

const DEFAULT_TIMEZONE = config.dashboards?.defaultTimezone || 'Europe/London';
const DEFAULT_WINDOW_DAYS = Math.max(config.dashboards?.defaultWindowDays ?? 28, 7);
const UPCOMING_LIMIT = Math.max(config.dashboards?.upcomingLimit ?? 8, 3);
const EXPORT_ROW_LIMIT = Math.max(config.dashboards?.exportRowLimit ?? 5000, 500);
const PERSONA_DEFAULTS = Object.freeze(config.dashboards?.defaults ?? {});

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

  const [
    user,
    bookings,
    previousBookings,
    orders,
    previousOrders,
    rentals,
    disputes,
    conversations
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
    ConversationParticipant.findAll({ where: conversationWhere })
  ]);

  const totalBookings = bookings.length;
  const previousTotalBookings = previousBookings.length;
  const completedBookings = bookings.filter((booking) => booking.status === 'completed').length;
  const previousCompletedBookings = previousBookings.filter((booking) => booking.status === 'completed').length;
  const activeBookings = bookings.filter((booking) =>
    ['pending', 'awaiting_assignment', 'scheduled', 'in_progress'].includes(booking.status)
  );

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
        return {
          title: order.Service?.title || `Order ${order.id.slice(0, 6).toUpperCase()}`,
          owner: order.Service?.category || 'Service order',
          value: formatCurrency(order.totalAmount, order.currency || order.Service?.currency || 'GBP'),
          eta: etaLabel
        };
      })
  }));

  const rentalRows = rentals.slice(0, EXPORT_ROW_LIMIT).map((rental) => [
    rental.rentalNumber,
    rental.InventoryItem?.name ?? 'Asset',
    humanise(rental.status),
    rental.returnDueAt
      ? DateTime.fromJSDate(rental.returnDueAt).setZone(window.timezone).toISODate()
      : '—',
    humanise(rental.depositStatus)
  ]);

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
    badge: `${formatNumber(supportConversations)} support`,
    status:
      disputes.length > 0
        ? { label: 'Escalations open', tone: 'danger' }
        : supportConversations > 0
        ? { label: 'Active conversations', tone: 'info' }
        : { label: 'Support quiet', tone: 'success' },
    highlights: [
      { label: 'Disputes', value: formatNumber(disputes.length) },
      { label: 'Conversations', value: formatNumber(supportConversations) }
    ]
  };

  const mfaEnabled = Boolean(user?.twoFactorApp || user?.twoFactorEmail);
  const settingsSidebar = {
    badge: mfaEnabled ? 'MFA secured' : 'Security review',
    status: mfaEnabled ? { label: 'MFA enabled', tone: 'success' } : { label: 'Enable MFA', tone: 'warning' },
    highlights: [
      { label: 'Timezone', value: timezoneLabel },
      { label: 'Currency', value: currency }
    ]
  };

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
          label: 'Contact email',
          value: user?.email ?? 'Not provided',
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
          label: 'Local timezone',
          value: timezoneLabel,
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
          enabled: Boolean(user?.twoFactorApp),
          helper: user?.twoFactorApp
            ? 'Time-based one-time passcodes are required on sign-in.'
            : 'Add an authenticator app to secure sign-ins.'
        },
        {
          type: 'toggle',
          label: 'Email verification codes',
          enabled: Boolean(user?.twoFactorEmail),
          helper: user?.twoFactorEmail
            ? 'Backup verification codes are delivered to your inbox.'
            : 'Enable email codes as a fallback second factor.'
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
          label: 'Support case updates',
          enabled: supportConversations > 0,
          helper: supportConversations > 0
            ? 'Email alerts active for current support cases.'
            : 'Alerts activate automatically when a case opens.'
        },
        {
          type: 'toggle',
          label: 'Job dispatch alerts',
          enabled: activeBookings.length > 0,
          helper:
            activeBookings.length > 0
              ? `${formatNumber(activeBookings.length)} active job${activeBookings.length === 1 ? '' : 's'} will send dispatch nudges.`
              : 'Dispatch alerts enable once you have active jobs.'
        },
        {
          type: 'value',
          label: 'Weekly summary',
          value: totalOrders > 0 ? 'Scheduled' : 'Paused',
          helper: totalOrders > 0
            ? 'A weekly health report will arrive each Monday.'
            : 'Resume once new orders are captured.'
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
          value: currency,
          helper: 'All new orders default to this currency.'
        },
        {
          type: 'value',
          label: 'Funded escrows',
          value: formatNumber(escrowFunded),
          helper: escrowFunded > 0
            ? 'Escrows release once jobs complete and pass inspection.'
            : 'Fund an order to initialise automated escrow releases.'
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
      totals: {
        bookings: totalBookings,
        activeBookings: activeBookings.length,
        spend,
        rentals: rentals.length,
        disputes: disputes.length,
        conversations: conversations.length
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
        id: 'rentals',
        label: 'Rental Assets',
        description: 'Track equipment associated with your jobs.',
        type: 'table',
        sidebar: rentalsSidebar,
        data: {
          headers: ['Rental', 'Asset', 'Status', 'Return Due', 'Deposit'],
          rows: rentalRows
        }
      },
      {
        id: 'account',
        label: 'Account & Support',
        description: 'Next best actions to keep everything running smoothly.',
        type: 'list',
        sidebar: accountSidebar,
        data: { items: accountItems }
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

  const [bookings, previousBookings, rentals, inventoryAlerts, complianceDocs, fraudSignals, campaignMetrics] = await Promise.all([
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
      }
    ]
  };
}

async function loadProviderData(context) {
  const { providerId, companyId, window } = context;

  const [assignments, previousAssignments, rentals, inventoryAlerts] = await Promise.all([
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
        completionRate
      }
    },
    navigation: [
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
        id: 'asset-alerts',
        label: 'Asset Alerts',
        description: 'Active inventory notifications requiring action.',
        type: 'list',
        data: { items: alertItems }
      }
    ]
  };
}

async function loadServicemanData(context) {
  const { providerId, window } = context;

  const providerFilter = providerId ? { providerId } : {};

  const [assignments, previousAssignments, bids, services] = await Promise.all([
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
    })
  ]);

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
      totals: {
        completed,
        inProgress,
        scheduled,
        revenue,
        autoMatched: autoMatchedCount,
        adsSourced: adsSourcedCount
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
