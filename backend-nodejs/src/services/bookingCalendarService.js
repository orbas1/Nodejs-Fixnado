import { Op, fn, col } from 'sequelize';
import { DateTime } from 'luxon';
import { Booking, BookingNote, ServiceZone } from '../models/index.js';

const DEFAULT_TIMEZONE = 'Europe/London';
const DAILY_CAPACITY = 4;
const STATUS_MAP = {
  pending: 'pending',
  awaiting_assignment: 'pending',
  scheduled: 'confirmed',
  in_progress: 'travel',
  completed: 'confirmed',
  cancelled: 'risk',
  disputed: 'risk'
};

const STATUS_FILTERS = [
  { value: 'confirmed', label: 'Confirmed visits' },
  { value: 'pending', label: 'Awaiting assignment' },
  { value: 'travel', label: 'In progress & travel' },
  { value: 'risk', label: 'Escalations & disputes' },
  { value: 'standby', label: 'Standby / rest day' }
];

const LEGEND = [
  { label: 'Confirmed visit', status: 'confirmed' },
  { label: 'Pending assignment', status: 'pending' },
  { label: 'Travel / prep', status: 'travel' },
  { label: 'Escalation risk', status: 'risk' },
  { label: 'Standby crew', status: 'standby' }
];

const STATUS_LABEL = {
  pending: 'Awaiting assignment',
  awaiting_assignment: 'Awaiting assignment',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed'
};

const BACKLOG_STATUSES = ['pending', 'awaiting_assignment', 'scheduled', 'in_progress'];

const currencyFormatter = (currency = 'GBP') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 });

function mapCalendarStatus(status) {
  if (!status) {
    return 'standby';
  }
  return STATUS_MAP[status] || 'standby';
}

function resolveTimezone(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return DEFAULT_TIMEZONE;
}

function normaliseStatusFilter(filterValue) {
  if (!filterValue) {
    return [];
  }
  const tokens = Array.isArray(filterValue) ? filterValue : filterValue.split(',');
  const cleaned = tokens
    .map((token) => token && typeof token === 'string' ? token.trim().toLowerCase() : null)
    .filter(Boolean);

  const result = new Set();
  cleaned.forEach((token) => {
    switch (token) {
      case 'confirmed':
        result.add('scheduled');
        result.add('in_progress');
        result.add('completed');
        break;
      case 'pending':
        result.add('pending');
        result.add('awaiting_assignment');
        break;
      case 'risk':
        result.add('disputed');
        result.add('cancelled');
        break;
      case 'travel':
        result.add('in_progress');
        break;
      case 'standby':
        result.add('awaiting_assignment');
        break;
      default:
        result.add(token);
        break;
    }
  });

  return Array.from(result);
}

function resolveFocusDate({ month, startDate, timezone }) {
  const tz = resolveTimezone(timezone);
  if (typeof month === 'string' && month.match(/^\d{4}-\d{2}$/)) {
    const date = DateTime.fromISO(`${month}-01`, { zone: tz });
    if (date.isValid) {
      return { focus: date, timezone: tz };
    }
  }

  if (typeof startDate === 'string') {
    const date = DateTime.fromISO(startDate, { zone: tz });
    if (date.isValid) {
      return { focus: date, timezone: tz };
    }
  }

  return { focus: DateTime.now().setZone(tz), timezone: tz };
}

function buildGridRange(focus) {
  const monthStart = focus.startOf('month');
  const monthEnd = focus.endOf('month');
  const gridStart = monthStart.minus({ days: monthStart.weekday - 1 });
  const gridEnd = monthEnd.plus({ days: 7 - monthEnd.weekday });
  return { monthStart, monthEnd, gridStart, gridEnd };
}

function buildSummary(bookings) {
  const totals = bookings.reduce(
    (acc, booking) => {
      acc.total += 1;
      if (booking.status === 'scheduled' || booking.status === 'in_progress') {
        acc.active += 1;
      }
      if (booking.status === 'awaiting_assignment' || booking.status === 'pending') {
        acc.awaiting += 1;
      }
      if (booking.status === 'disputed' || booking.status === 'cancelled') {
        acc.risk += 1;
      }
      if (booking.status === 'completed') {
        acc.completed += 1;
      }
      return acc;
    },
    { total: 0, active: 0, awaiting: 0, risk: 0, completed: 0 }
  );

  return [
    { id: 'total', label: 'Total bookings', value: totals.total },
    { id: 'active', label: 'In progress', value: totals.active },
    { id: 'awaiting', label: 'Awaiting assignment', value: totals.awaiting },
    { id: 'completed', label: 'Completed this month', value: totals.completed },
    { id: 'risk', label: 'Needs attention', value: totals.risk }
  ];
}

function computeCapacityLabel(eventCount) {
  if (eventCount >= DAILY_CAPACITY) {
    return 'Full';
  }
  const remaining = DAILY_CAPACITY - eventCount;
  return `${remaining} slot${remaining === 1 ? '' : 's'} left`;
}

function toValueLabel(amount, currency) {
  if (!Number.isFinite(Number(amount))) {
    return null;
  }
  try {
    return currencyFormatter(currency || 'GBP').format(Number(amount));
  } catch {
    return currencyFormatter('GBP').format(Number(amount));
  }
}

export async function getBookingCalendar({
  customerId = null,
  companyId = null,
  month = null,
  startDate = null,
  endDate = null,
  timezone = DEFAULT_TIMEZONE,
  status: statusFilter = [],
  zoneId = null
} = {}) {
  const { focus, timezone: resolvedTimezone } = resolveFocusDate({ month, startDate, timezone });
  const { monthStart, gridStart, gridEnd } = buildGridRange(focus);
  const explicitStart = startDate ? DateTime.fromISO(startDate, { zone: resolvedTimezone }) : null;
  const explicitEnd = endDate ? DateTime.fromISO(endDate, { zone: resolvedTimezone }) : null;
  const windowStart = explicitStart?.isValid ? explicitStart.startOf('day') : gridStart;
  const windowEnd = explicitEnd?.isValid ? explicitEnd.endOf('day') : gridEnd;
  const baseWhere = {};
  if (customerId) {
    baseWhere.customerId = customerId;
  }
  if (companyId) {
    baseWhere.companyId = companyId;
  }
  if (zoneId) {
    baseWhere.zoneId = zoneId;
  }

  const statusFilters = normaliseStatusFilter(statusFilter);
  if (statusFilters.length > 0) {
    baseWhere.status = { [Op.in]: statusFilters };
  }

  const scheduledWhere = {
    ...baseWhere,
    type: 'scheduled',
    scheduledStart: { [Op.lte]: windowEnd.toJSDate() },
    scheduledEnd: { [Op.gte]: windowStart.toJSDate() }
  };

  const backlogWhere = {
    ...baseWhere,
    type: 'on_demand',
    status: baseWhere.status ? baseWhere.status : { [Op.in]: BACKLOG_STATUSES }
  };

  if (explicitStart?.isValid || explicitEnd?.isValid) {
    backlogWhere.createdAt = {};
    if (explicitStart?.isValid) {
      backlogWhere.createdAt[Op.gte] = explicitStart.startOf('day').toJSDate();
    }
    if (explicitEnd?.isValid) {
      backlogWhere.createdAt[Op.lte] = explicitEnd.endOf('day').toJSDate();
    }
    if (Object.keys(backlogWhere.createdAt).length === 0) {
      delete backlogWhere.createdAt;
    }
  }

  const [scheduledBookings, backlogBookings] = await Promise.all([
    Booking.findAll({
      where: scheduledWhere,
      include: [{ model: ServiceZone, attributes: ['id', 'name'] }],
      order: [['scheduledStart', 'ASC']]
    }),
    Booking.findAll({
      where: backlogWhere,
      include: [{ model: ServiceZone, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: 20
    })
  ]);

  const noteBookingIds = Array.from(
    new Set([...scheduledBookings, ...backlogBookings].map((booking) => booking.id))
  );
  let noteMap = new Map();
  if (noteBookingIds.length > 0) {
    const noteAggregates = await BookingNote.findAll({
      attributes: ['bookingId', [fn('COUNT', col('id')), 'count']],
      where: { bookingId: { [Op.in]: noteBookingIds } },
      group: ['bookingId']
    });
    noteMap = new Map(
      noteAggregates.map((row) => [row.get('bookingId'), Number(row.get('count')) || 0])
    );
  }

  const eventsByDay = new Map();
  const zones = new Map();
  const now = DateTime.now().setZone(resolvedTimezone);

  scheduledBookings.forEach((booking) => {
    const start = DateTime.fromJSDate(booking.scheduledStart).setZone(resolvedTimezone);
    const end = DateTime.fromJSDate(booking.scheduledEnd).setZone(resolvedTimezone);
    const iso = start.toISODate();
    const calendarStatus = mapCalendarStatus(booking.status);
    const valueLabel = toValueLabel(booking.totalAmount, booking.currency);
    const event = {
      id: booking.id,
      title: booking.title || booking.meta?.title || `Booking ${booking.id.slice(0, 6)}`,
      status: calendarStatus,
      statusRaw: booking.status,
      time:
        booking.scheduledStart && booking.scheduledEnd
          ? `${start.toFormat('HH:mm')} – ${end.toFormat('HH:mm')}`
          : null,
      start: booking.scheduledStart,
      end: booking.scheduledEnd,
      zone: booking.ServiceZone?.name || booking.meta?.zoneName || 'Unassigned zone',
      zoneId: booking.zoneId,
      location: booking.location || booking.meta?.location || null,
      crew: booking.meta?.primaryCrew || null,
      demandLevel: booking.meta?.demandLevel || null,
      value: valueLabel,
      currency: booking.currency || 'GBP',
      notesCount: noteMap.get(booking.id) || 0,
      attachments: Array.isArray(booking.meta?.attachments) ? booking.meta.attachments : []
    };

    if (!eventsByDay.has(iso)) {
      eventsByDay.set(iso, []);
    }
    eventsByDay.get(iso).push(event);

    if (booking.zoneId && !zones.has(booking.zoneId)) {
      zones.set(booking.zoneId, event.zone);
    }
  });

  const weeks = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const iso = cursor.toISODate();
      const dayEvents = (eventsByDay.get(iso) || []).sort((a, b) => {
        const aTime = a.start ? new Date(a.start).getTime() : 0;
        const bTime = b.start ? new Date(b.start).getTime() : 0;
        return aTime - bTime;
      });
      week.push({
        isoDate: iso,
        date: String(cursor.day),
        isCurrentMonth: cursor.month === monthStart.month,
        isToday: cursor.hasSame(now, 'day'),
        capacity: computeCapacityLabel(dayEvents.length),
        overbooked: dayEvents.length > DAILY_CAPACITY,
        events: dayEvents
      });
      cursor = cursor.plus({ days: 1 });
    }
    weeks.push(week);
  }

  const zonesFilter = Array.from(zones.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const backlog = [];
  backlogBookings.forEach((booking) => {
    if (['completed', 'cancelled', 'disputed'].includes(booking.status)) {
      return;
    }
    const zoneLabel = booking.ServiceZone?.name || booking.meta?.zoneName || 'Unassigned zone';
    backlog.push({
      id: booking.id,
      title: booking.title || booking.meta?.title || `Booking ${booking.id.slice(0, 6)}`,
      status: booking.status,
      statusLabel: STATUS_LABEL[booking.status] || booking.status,
      requestedAt: booking.createdAt ? booking.createdAt.toISOString() : null,
      zone: zoneLabel,
      zoneId: booking.zoneId,
      value: toValueLabel(booking.totalAmount, booking.currency),
      currency: booking.currency || 'GBP',
      demandLevel: booking.meta?.demandLevel || null,
      notesCount: noteMap.get(booking.id) || 0,
      attachments: Array.isArray(booking.meta?.attachments) ? booking.meta.attachments : []
    });

    if (booking.zoneId && !zones.has(booking.zoneId)) {
      zones.set(booking.zoneId, zoneLabel);
    }
  });

  const summary = buildSummary(scheduledBookings);

  return {
    month: monthStart.toFormat('LLLL yyyy'),
    monthValue: monthStart.toFormat('yyyy-LL'),
    start: windowStart.startOf('day').toISO(),
    end: windowEnd.endOf('day').toISO(),
    timezone: resolvedTimezone,
    legend: LEGEND,
    summary,
    filters: {
      statuses: STATUS_FILTERS,
      zones: zonesFilter
    },
    weeks,
    backlog,
    controls: {
      month: monthStart.toFormat('yyyy-LL'),
      previousMonth: monthStart.minus({ months: 1 }).toFormat('yyyy-LL'),
      nextMonth: monthStart.plus({ months: 1 }).toFormat('yyyy-LL'),
      start: windowStart.startOf('day').toISO(),
      end: windowEnd.endOf('day').toISO()
    },
    context: {
      customerId,
      companyId,
      timezone: resolvedTimezone
    },
    permissions: {
      canCreate: true,
      canEdit: true,
      canManageNotes: true,
      canManageCrew: true
    }
  };
}

export default { getBookingCalendar };
