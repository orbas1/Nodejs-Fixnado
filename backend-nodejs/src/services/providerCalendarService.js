import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import ProviderCalendarSetting from '../models/providerCalendarSetting.js';
import ProviderCalendarEvent from '../models/providerCalendarEvent.js';
import {
  Booking,
  BookingAssignment,
  Company,
  ServiceZone,
  User
} from '../models/index.js';

function calendarError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
}

const DEFAULT_SETTINGS = {
  timezone: 'Europe/London',
  weekStartsOn: 'monday',
  defaultView: 'month',
  workdayStart: '08:00',
  workdayEnd: '18:00',
  allowOverlapping: true,
  autoAcceptAssignments: false,
  notificationRecipients: []
};

function parseIsoDate(value, { zone }) {
  if (!value) {
    return null;
  }
  const date = DateTime.fromISO(value, { zone });
  if (!date.isValid) {
    return null;
  }
  return date;
}

function parseTime(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const match = /^([0-2]\d):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    return null;
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function normaliseSettings(record) {
  if (!record) {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    timezone: record.timezone || DEFAULT_SETTINGS.timezone,
    weekStartsOn: record.weekStartsOn || DEFAULT_SETTINGS.weekStartsOn,
    defaultView: record.defaultView || DEFAULT_SETTINGS.defaultView,
    workdayStart: record.workdayStart || DEFAULT_SETTINGS.workdayStart,
    workdayEnd: record.workdayEnd || DEFAULT_SETTINGS.workdayEnd,
    allowOverlapping:
      typeof record.allowOverlapping === 'boolean' ? record.allowOverlapping : DEFAULT_SETTINGS.allowOverlapping,
    autoAcceptAssignments:
      typeof record.autoAcceptAssignments === 'boolean'
        ? record.autoAcceptAssignments
        : DEFAULT_SETTINGS.autoAcceptAssignments,
    notificationRecipients: Array.isArray(record.notificationRecipients)
      ? record.notificationRecipients
      : [...DEFAULT_SETTINGS.notificationRecipients]
  };
}

function resolveWeekdayIndex(weekStartsOn) {
  return weekStartsOn === 'sunday' ? 7 : 1;
}

function buildLegend() {
  return [
    { id: 'booking-confirmed', label: 'Confirmed booking', status: 'confirmed' },
    { id: 'booking-pending', label: 'Pending booking', status: 'pending' },
    { id: 'booking-risk', label: 'Escalation / hold', status: 'risk' },
    { id: 'event-standby', label: 'Standby window', status: 'standby' },
    { id: 'event-travel', label: 'Travel', status: 'travel' }
  ];
}

function mapAssignmentCrew(assignments = []) {
  return assignments
    .filter((assignment) => assignment?.provider)
    .map((assignment) => ({
      id: assignment.provider.id,
      name: [assignment.provider.firstName, assignment.provider.lastName].filter(Boolean).join(' ') || 'Crew member',
      role: assignment.role,
      status: assignment.status
    }));
}

function mapBookingRecord(booking, timezone) {
  const start = booking.scheduledStart ? DateTime.fromJSDate(booking.scheduledStart).setZone(timezone) : null;
  const end = booking.scheduledEnd ? DateTime.fromJSDate(booking.scheduledEnd).setZone(timezone) : null;
  const sla = booking.slaExpiresAt ? DateTime.fromJSDate(booking.slaExpiresAt).setZone(timezone) : null;
  const assignments = Array.isArray(booking.BookingAssignments) ? booking.BookingAssignments : [];

  return {
    id: booking.id,
    title: booking.meta?.title || booking.meta?.name || `Booking ${booking.id.slice(0, 6).toUpperCase()}`,
    status: booking.status,
    type: booking.type,
    start: start ? start.toISO() : null,
    end: end ? end.toISO() : null,
    slaExpiresAt: sla ? sla.toISO() : null,
    zoneId: booking.zoneId,
    zoneName: booking.ServiceZone?.name || booking.meta?.zoneName || null,
    customerId: booking.customerId,
    customerName: booking.meta?.customer || booking.meta?.requester || null,
    value: booking.totalAmount != null ? Number(booking.totalAmount) : null,
    currency: booking.currency,
    crew: mapAssignmentCrew(assignments),
    notes: booking.meta?.notes || null,
    metadata: booking.meta || {},
    lastStatusTransitionAt: booking.lastStatusTransitionAt
      ? DateTime.fromJSDate(booking.lastStatusTransitionAt).setZone(timezone).toISO()
      : null
  };
}

function mapEventRecord(event, timezone) {
  const start = DateTime.fromJSDate(event.startAt).setZone(timezone);
  const end = event.endAt ? DateTime.fromJSDate(event.endAt).setZone(timezone) : null;
  return {
    id: event.id,
    bookingId: event.bookingId,
    title: event.title,
    description: event.description || null,
    status: event.status,
    type: event.eventType,
    visibility: event.visibility,
    start: start.toISO(),
    end: end ? end.toISO() : null,
    createdBy: event.createdBy,
    updatedBy: event.updatedBy,
    metadata: event.metadata || {}
  };
}

function mapDayEvents({ events, bookings, dayStart, dayEnd, timezone }) {
  const startMs = dayStart.toMillis();
  const endMs = dayEnd.toMillis();

  const bookingEvents = bookings
    .filter((booking) => {
      const start = booking.start ? DateTime.fromISO(booking.start).toMillis() : null;
      const end = booking.end ? DateTime.fromISO(booking.end).toMillis() : null;
      if (start == null && end == null) {
        return false;
      }
      const effectiveEnd = end ?? start;
      return start <= endMs && effectiveEnd >= startMs;
    })
    .map((booking) => ({
      id: `booking-${booking.id}`,
      title: booking.title,
      status:
        booking.status === 'scheduled'
          ? 'confirmed'
          : booking.status === 'in_progress'
            ? 'travel'
            : booking.status === 'cancelled'
              ? 'risk'
              : booking.status,
      time: booking.start
        ? DateTime.fromISO(booking.start).setZone(timezone).toFormat('HH:mm')
        : 'All day',
      kind: 'booking'
    }));

  const calendarEvents = events
    .filter((event) => {
      const start = DateTime.fromISO(event.start).toMillis();
      const end = event.end ? DateTime.fromISO(event.end).toMillis() : start;
      return start <= endMs && end >= startMs;
    })
    .map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      status: event.status === 'planned' ? (event.type === 'hold' ? 'standby' : 'pending') : event.status,
      time: DateTime.fromISO(event.start).setZone(timezone).toFormat('HH:mm'),
      kind: 'event'
    }));

  return [...bookingEvents, ...calendarEvents];
}

function buildCalendarGrid({
  start,
  end,
  timezone,
  settings,
  bookings,
  events
}) {
  const weekStartIndex = resolveWeekdayIndex(settings.weekStartsOn);
  let cursor = start.startOf('day');
  while (cursor.weekday !== weekStartIndex) {
    cursor = cursor.minus({ days: 1 });
  }

  let gridEnd = end.endOf('day');
  while (gridEnd.weekday !== (weekStartIndex === 7 ? 6 : 7)) {
    gridEnd = gridEnd.plus({ days: 1 });
  }

  const days = [];
  let pointer = cursor;
  while (pointer <= gridEnd) {
    const dayStart = pointer.startOf('day');
    const dayEnd = pointer.endOf('day');
    const dayEvents = mapDayEvents({
      events,
      bookings,
      dayStart,
      dayEnd,
      timezone
    });

    days.push({
      date: pointer.day.toString(),
      iso: pointer.toISODate(),
      isCurrentMonth: pointer.month === start.month,
      isToday: pointer.hasSame(DateTime.now().setZone(timezone), 'day'),
      capacity: null,
      events: dayEvents
    });

    pointer = pointer.plus({ days: 1 });
  }

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function computeUtilisation({ bookings, settings, start, end }) {
  const startTime = parseTime(settings.workdayStart) || { hours: 8, minutes: 0 };
  const endTime = parseTime(settings.workdayEnd) || { hours: 18, minutes: 0 };
  const totalDays = Math.max(Math.round(end.diff(start, 'days').days) + 1, 1);
  const totalWorkMinutes = totalDays * ((endTime.hours - startTime.hours) * 60 + (endTime.minutes - startTime.minutes));
  if (totalWorkMinutes <= 0) {
    return 0;
  }

  const bookedMinutes = bookings.reduce((acc, booking) => {
    if (!booking.start) {
      return acc;
    }
    const startAt = DateTime.fromISO(booking.start);
    const endAt = booking.end ? DateTime.fromISO(booking.end) : startAt;
    const diff = Math.max(endAt.diff(startAt, 'minutes').minutes, 0);
    return acc + diff;
  }, 0);

  return bookedMinutes / totalWorkMinutes;
}

function buildSummary({ bookings, events, settings, start, end }) {
  const totals = bookings.reduce(
    (acc, booking) => {
      acc.total += 1;
      acc.byStatus[booking.status] = (acc.byStatus[booking.status] || 0) + 1;
      if (booking.status === 'scheduled' || booking.status === 'in_progress') {
        acc.active += 1;
      }
      return acc;
    },
    { total: 0, active: 0, byStatus: {} }
  );

  const utilisation = computeUtilisation({ bookings, settings, start, end });

  return {
    totals,
    utilisation,
    holds: events.filter((event) => event.type === 'hold').length,
    travel: events.filter((event) => event.type === 'travel').length,
    upcoming:
      bookings.filter((booking) => {
        if (!booking.start) {
          return false;
        }
        const startAt = DateTime.fromISO(booking.start);
        return startAt > DateTime.now().setZone(settings.timezone);
      }).length
  };
}

async function ensureCompany(companyId) {
  if (!companyId) {
    throw calendarError('company_id_required', 400);
  }
  const company = await Company.findByPk(companyId);
  if (!company) {
    throw calendarError('company_not_found', 404);
  }
  return company;
}

async function ensureSettings(companyId) {
  const existing = await ProviderCalendarSetting.findOne({ where: { companyId } });
  if (existing) {
    return existing;
  }
  return ProviderCalendarSetting.create({ companyId, ...DEFAULT_SETTINGS });
}

export async function getProviderCalendar({
  companyId,
  start: startInput,
  end: endInput,
  timezone: timezoneInput
}) {
  const company = await ensureCompany(companyId);
  const settingsRecord = await ensureSettings(companyId);
  const settings = normaliseSettings(settingsRecord);
  const timezone = timezoneInput || settings.timezone || DEFAULT_SETTINGS.timezone;

  const startCandidate = parseIsoDate(startInput, { zone: timezone });
  const start = (startCandidate || DateTime.now().setZone(timezone)).startOf('month');
  const endCandidate = parseIsoDate(endInput, { zone: timezone });
  const end = (endCandidate || start.endOf('month')).endOf('day');

  const windowStart = start.startOf('day');
  const windowEnd = end.endOf('day');

  const dbStart = windowStart.toUTC().toJSDate();
  const dbEnd = windowEnd.toUTC().toJSDate();

  const [zones, bookingsRaw, eventsRaw] = await Promise.all([
    ServiceZone.findAll({ where: { companyId }, attributes: ['id', 'name'], order: [['name', 'ASC']] }),
    Booking.findAll({
      where: {
        companyId,
        [Op.or]: [
          { scheduledStart: { [Op.between]: [dbStart, dbEnd] } },
          { scheduledEnd: { [Op.between]: [dbStart, dbEnd] } },
          {
            scheduledStart: { [Op.lte]: dbStart },
            scheduledEnd: { [Op.gte]: dbStart }
          }
        ]
      },
      include: [
        {
          model: BookingAssignment,
          required: false,
          include: [{ model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName'] }]
        },
        { model: ServiceZone, attributes: ['id', 'name'], required: false }
      ]
    }),
    ProviderCalendarEvent.findAll({
      where: {
        companyId,
        startAt: { [Op.lte]: dbEnd },
        [Op.or]: [{ endAt: { [Op.gte]: dbStart } }, { endAt: null }]
      }
    })
  ]);

  const bookings = bookingsRaw.map((booking) => mapBookingRecord(booking, timezone));
  const events = eventsRaw.map((event) => mapEventRecord(event, timezone));

  const weeks = buildCalendarGrid({
    start: windowStart,
    end: windowEnd,
    timezone,
    settings,
    bookings,
    events
  });

  const summary = buildSummary({ bookings, events, settings: { ...settings, timezone }, start: windowStart, end: windowEnd });

  const zoneOptions = zones.map((zone) => ({ id: zone.id, label: zone.name }));

  return {
    data: {
      calendar: {
        monthLabel: start.toFormat('LLLL yyyy'),
        rangeStart: windowStart.toISO(),
        rangeEnd: windowEnd.toISO(),
        legend: buildLegend(),
        weeks
      },
      summary,
      bookings,
      events,
      settings: { ...settings, timezone },
      options: {
        zones: zoneOptions,
        eventTypes: [
          { value: 'internal', label: 'Internal activity' },
          { value: 'hold', label: 'Scheduling hold' },
          { value: 'travel', label: 'Travel window' },
          { value: 'maintenance', label: 'Asset maintenance' },
          { value: 'booking', label: 'Booking marker' }
        ],
        eventStatuses: [
          { value: 'planned', label: 'Planned' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'standby', label: 'Standby' },
          { value: 'travel', label: 'Travel' },
          { value: 'tentative', label: 'Tentative' },
          { value: 'cancelled', label: 'Cancelled' }
        ],
        bookingStatuses: [
          { value: 'pending', label: 'Pending' },
          { value: 'awaiting_assignment', label: 'Awaiting assignment' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'disputed', label: 'Disputed' }
        ]
      },
      permissions: {
        canManageBookings: true,
        canManageEvents: true,
        canEditSettings: true
      },
      links: {
        fetch: `/api/providers/calendar?companyId=${companyId}&timezone=${encodeURIComponent(timezone)}`,
        events: '/api/providers/calendar/events',
        settings: '/api/providers/calendar/settings',
        bookings: '/api/providers/calendar/bookings'
      }
    },
    meta: {
      companyId,
      timezone,
      start: windowStart.toISO(),
      end: windowEnd.toISO(),
      generatedAt: DateTime.now().setZone(timezone).toISO(),
      companyName: company.contactName || company.legalName || null
    }
  };
}

export async function upsertProviderCalendarSettings({ companyId, payload }) {
  await ensureCompany(companyId);
  const settings = normaliseSettings(payload || {});
  const record = await ensureSettings(companyId);
  Object.assign(record, settings);
  await record.save();
  return normaliseSettings(record);
}

function validateEventPayload(payload) {
  if (!payload?.title) {
    throw calendarError('event_title_required', 422);
  }
  if (!payload?.start) {
    throw calendarError('event_start_required', 422);
  }
  const timezone = payload.timezone || DEFAULT_SETTINGS.timezone;
  const start = parseIsoDate(payload.start, { zone: timezone });
  if (!start) {
    throw calendarError('invalid_event_start', 422);
  }
  const end = parseIsoDate(payload.end, { zone: timezone });
  if (end && end < start) {
    throw calendarError('event_end_before_start', 422);
  }
  return { start, end, timezone };
}

export async function createProviderCalendarEvent({ companyId, payload, actor }) {
  await ensureCompany(companyId);
  const { start, end, timezone } = validateEventPayload(payload);
  const event = await ProviderCalendarEvent.create({
    companyId,
    bookingId: payload.bookingId || null,
    title: payload.title,
    description: payload.description || null,
    status: payload.status || 'planned',
    eventType: payload.type || 'internal',
    visibility: payload.visibility || 'internal',
    startAt: start.toUTC().toJSDate(),
    endAt: end ? end.toUTC().toJSDate() : null,
    createdBy: actor?.actorId || actor?.id || null,
    updatedBy: actor?.actorId || actor?.id || null,
    metadata: payload.metadata || {}
  });
  return mapEventRecord(event, timezone);
}

export async function updateProviderCalendarEvent({ companyId, eventId, payload, actor }) {
  const event = await ProviderCalendarEvent.findOne({ where: { id: eventId, companyId } });
  if (!event) {
    throw calendarError('event_not_found', 404);
  }
  const timezone = payload?.timezone || DEFAULT_SETTINGS.timezone;
  let start = null;
  let end = null;
  if (payload?.start || payload?.end) {
    ({ start, end } = validateEventPayload({ ...payload, start: payload.start ?? event.startAt, timezone }));
  }
  if (payload?.title) {
    event.title = payload.title;
  }
  if (payload?.description !== undefined) {
    event.description = payload.description || null;
  }
  if (payload?.status) {
    event.status = payload.status;
  }
  if (payload?.type) {
    event.eventType = payload.type;
  }
  if (payload?.visibility) {
    event.visibility = payload.visibility;
  }
  if (payload?.metadata) {
    event.metadata = payload.metadata;
  }
  if (start) {
    event.startAt = start.toUTC().toJSDate();
  }
  if (payload?.end !== undefined) {
    event.endAt = end ? end.toUTC().toJSDate() : null;
  }
  event.updatedBy = actor?.actorId || actor?.id || null;
  await event.save();
  return mapEventRecord(event, timezone);
}

export async function deleteProviderCalendarEvent({ companyId, eventId }) {
  const deleted = await ProviderCalendarEvent.destroy({ where: { id: eventId, companyId } });
  if (!deleted) {
    throw calendarError('event_not_found', 404);
  }
  return { success: true };
}

function resolveBookingStatus(status) {
  const allowed = new Set([
    'pending',
    'awaiting_assignment',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
    'disputed'
  ]);
  if (!status || !allowed.has(status)) {
    throw calendarError('invalid_booking_status', 422);
  }
  return status;
}

export async function updateProviderBookingSchedule({ companyId, bookingId, payload, actor }) {
  const booking = await Booking.findOne({ where: { id: bookingId, companyId } });
  if (!booking) {
    throw calendarError('booking_not_found', 404);
  }
  const timezone = payload?.timezone || DEFAULT_SETTINGS.timezone;
  const start = payload?.start ? parseIsoDate(payload.start, { zone: timezone }) : null;
  const end = payload?.end ? parseIsoDate(payload.end, { zone: timezone }) : null;
  if (payload?.start && !start) {
    throw calendarError('invalid_booking_start', 422);
  }
  if (payload?.end && !end) {
    throw calendarError('invalid_booking_end', 422);
  }
  if (start) {
    booking.scheduledStart = start.toUTC().toJSDate();
    booking.lastStatusTransitionAt = new Date();
  }
  if (payload?.end !== undefined) {
    booking.scheduledEnd = end ? end.toUTC().toJSDate() : null;
  }
  if (payload?.status) {
    booking.status = resolveBookingStatus(payload.status);
    booking.lastStatusTransitionAt = new Date();
  }
  if (payload?.meta) {
    booking.meta = { ...booking.meta, ...payload.meta };
  }
  if (booking.scheduledEnd) {
    booking.slaExpiresAt = booking.scheduledEnd;
  } else if (booking.scheduledStart) {
    booking.slaExpiresAt = DateTime.fromJSDate(booking.scheduledStart).plus({ hours: 6 }).toUTC().toJSDate();
  }
  booking.updatedBy = actor?.actorId || actor?.id || null;
  await booking.save();
  return mapBookingRecord(booking, timezone);
}

export async function createProviderBooking({ companyId, payload, actor }) {
  const company = await ensureCompany(companyId);
  const timezone = payload?.timezone || DEFAULT_SETTINGS.timezone;
  const start = payload?.start ? parseIsoDate(payload.start, { zone: timezone }) : null;
  if (!start) {
    throw calendarError('booking_start_required', 422);
  }
  const end = payload?.end ? parseIsoDate(payload.end, { zone: timezone }) : null;
  if (end && end < start) {
    throw calendarError('booking_end_before_start', 422);
  }
  if (!payload?.zoneId) {
    throw calendarError('zone_id_required', 422);
  }
  const status = resolveBookingStatus(payload.status || 'scheduled');
  const totalAmount = payload?.value != null ? Number(payload.value) : 0;
  const commissionAmount = payload?.commissionAmount != null ? Number(payload.commissionAmount) : 0;
  const taxAmount = payload?.taxAmount != null ? Number(payload.taxAmount) : 0;
  const booking = await Booking.create({
    customerId: company.userId,
    companyId,
    zoneId: payload.zoneId,
    status,
    type: payload.type || 'scheduled',
    scheduledStart: start.toUTC().toJSDate(),
    scheduledEnd: end ? end.toUTC().toJSDate() : null,
    slaExpiresAt: end ? end.toUTC().toJSDate() : start.plus({ hours: 6 }).toUTC().toJSDate(),
    baseAmount: totalAmount,
    currency: payload.currency || 'GBP',
    totalAmount,
    commissionAmount,
    taxAmount,
    meta: {
      title: payload.title || `Booking ${Date.now()}`,
      customer: payload.customerName || company.contactName,
      notes: payload.notes || null,
      createdBy: actor?.actorId || actor?.id || null,
      source: 'provider-calendar'
    },
    lastStatusTransitionAt: new Date()
  });
  return mapBookingRecord(booking, timezone);
}
