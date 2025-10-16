import { DateTime } from 'luxon';
import { Op, fn, col, cast } from 'sequelize';
import {
  sequelize,
  Booking,
  BookingAssignment,
  BookingTemplate,
  Company,
  ServiceZone,
  User
} from '../models/index.js';
import {
  createBooking,
  updateBookingStatus,
  updateBookingSchedule,
  updateBookingMetadata
} from './bookingService.js';
import { getBookingTemplateById } from './bookingTemplateService.js';
import {
  getPlatformSettings,
  updatePlatformSettings
} from './platformSettingsService.js';

const TIMEFRAMES = {
  '7d': { label: '7 days', days: 7 },
  '30d': { label: '30 days', days: 30 },
  '90d': { label: '90 days', days: 90 }
};

const ACTIVE_STATUSES = ['pending', 'awaiting_assignment', 'scheduled', 'in_progress'];
const COMPLETED_STATUSES = ['completed'];
const CANCELLED_STATUSES = ['cancelled'];

function resolveTimeframe(timeframe, timezone = 'UTC') {
  const key = TIMEFRAMES[timeframe] ? timeframe : '7d';
  const config = TIMEFRAMES[key];
  const now = DateTime.now().setZone(timezone);
  const end = now.endOf('day');
  const start = end.minus({ days: config.days - 1 }).startOf('day');

  return { key, label: config.label, start, end };
}

function parseAmount(value) {
  if (value == null) return 0;
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toPlainCompany(company) {
  if (!company) return null;
  const plain = company.get({ plain: true });
  return {
    id: plain.id,
    name: plain.contactName || plain.marketplaceIntent || 'Company',
    intent: plain.marketplaceIntent || null
  };
}

function toPlainZone(zone) {
  if (!zone) return null;
  const plain = zone.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    companyId: plain.companyId
  };
}

function toPlainCustomer(customer) {
  if (!customer) return null;
  const plain = customer.get({ plain: true });
  const nameParts = [plain.firstName, plain.lastName].filter(Boolean);
  return {
    id: plain.id,
    name: nameParts.join(' ') || 'Customer',
    email: plain.email || null
  };
}

function toPlainBookingRow(booking) {
  const plain = booking.get({ plain: true });
  const meta = plain.meta || {};
  const assignments = Array.isArray(plain.BookingAssignments) ? plain.BookingAssignments : [];
  const outstandingAssignments = assignments.filter((assignment) => assignment.status === 'pending');

  return {
    id: plain.id,
    reference: meta.reference || plain.id.slice(0, 8).toUpperCase(),
    status: plain.status,
    type: plain.type,
    demandLevel: meta.demandLevel || meta.quotedDemand || 'medium',
    scheduledStart: plain.scheduledStart ? new Date(plain.scheduledStart).toISOString() : null,
    scheduledEnd: plain.scheduledEnd ? new Date(plain.scheduledEnd).toISOString() : null,
    slaExpiresAt: plain.slaExpiresAt ? new Date(plain.slaExpiresAt).toISOString() : null,
    totalAmount: parseAmount(plain.totalAmount),
    currency: plain.currency,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    lastStatusTransitionAt: plain.lastStatusTransitionAt
      ? new Date(plain.lastStatusTransitionAt).toISOString()
      : null,
    customer: toPlainCustomer(booking.customer || plain.customer || null),
    company: toPlainCompany(booking.Company || plain.Company || null),
    zone: toPlainZone(booking.ServiceZone || plain.ServiceZone || null),
    checklist: Array.isArray(meta.checklist) ? meta.checklist : [],
    attachments: Array.isArray(meta.attachments) ? meta.attachments : [],
    heroImageUrl: meta.heroImageUrl || null,
    images: Array.isArray(meta.images) ? meta.images : [],
    summary: meta.summary || null,
    instructions: meta.instructions || null,
    notes: meta.notes || null,
    templateId: meta.templateId || null,
    autoAssignEnabled: meta.autoAssignEnabled !== false,
    allowCustomerEdits: meta.allowCustomerEdits === true,
    outstandingAssignments: outstandingAssignments.length,
    tags: Array.isArray(meta.tags) ? meta.tags : []
  };
}

function computeMetrics(bookings = [], timeframe) {
  if (!bookings.length) {
    return {
      totals: { total: 0, active: 0, disputed: 0, revenue: 0 },
      sla: { onTimePercentage: 100, averageCompletionMinutes: 0 },
      cancellations: { cancelled: 0, rate: 0 }
    };
  }

  const totals = {
    total: bookings.length,
    active: bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)).length,
    disputed: bookings.filter((booking) => booking.status === 'disputed').length,
    revenue: bookings.reduce((sum, booking) => sum + parseAmount(booking.totalAmount), 0)
  };

  const completed = bookings.filter((booking) => COMPLETED_STATUSES.includes(booking.status));
  const punctual = completed.filter((booking) => {
    if (!booking.lastStatusTransitionAt || !booking.slaExpiresAt) {
      return true;
    }
    return booking.lastStatusTransitionAt.getTime() <= booking.slaExpiresAt.getTime();
  });
  const durations = completed
    .map((booking) => {
      if (!booking.scheduledStart || !booking.lastStatusTransitionAt) {
        return null;
      }
      return (
        new Date(booking.lastStatusTransitionAt).getTime() - new Date(booking.scheduledStart).getTime()
      ) / 60000;
    })
    .filter((value) => Number.isFinite(value) && value >= 0);

  const sla = {
    onTimePercentage:
      completed.length === 0 ? 100 : Math.round((punctual.length / completed.length) * 100),
    averageCompletionMinutes:
      durations.length === 0
        ? 0
        : Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
  };

  const cancelled = bookings.filter((booking) => CANCELLED_STATUSES.includes(booking.status)).length;
  const cancellations = {
    cancelled,
    rate: bookings.length === 0 ? 0 : Math.round((cancelled / bookings.length) * 100)
  };

  return { totals, sla, cancellations };
}

function buildWhere({ filters = {}, range }) {
  const where = {
    createdAt: {
      [Op.between]: [range.start.toJSDate(), range.end.toJSDate()]
    }
  };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.demandLevel) {
    where.meta = where.meta || {};
    where.meta.demandLevel = filters.demandLevel;
  }
  if (filters.companyId) {
    where.companyId = filters.companyId;
  }
  if (filters.zoneId) {
    where.zoneId = filters.zoneId;
  }

  if (filters.search) {
    const search = filters.search.trim().toLowerCase();
    if (search) {
      where[Op.or] = [
        { id: filters.search.trim() },
        sequelize.where(
          fn('lower', cast(col('Booking.meta'), 'TEXT')),
          {
            [Op.like]: `%${search}%`
          }
        )
      ];
    }
  }

  return where;
}

export async function fetchBookingManagementOverview({
  timeframe = '7d',
  timezone = 'UTC',
  limit = 20,
  offset = 0,
  status,
  type,
  demandLevel,
  search,
  companyId,
  zoneId
} = {}) {
  const range = resolveTimeframe(timeframe, timezone);
  const filters = { status, type, demandLevel, search, companyId, zoneId };
  const where = buildWhere({ filters, range });

  const include = [
    { model: Company },
    { model: ServiceZone },
    { model: User, as: 'customer' },
    { model: BookingAssignment }
  ];

  const [paged, metricSource, outstandingAssignments, templates, companies, zones, customers] =
    await Promise.all([
      Booking.findAndCountAll({
        where,
        include,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      }),
      Booking.findAll({
        where,
        attributes: ['id', 'status', 'totalAmount', 'currency', 'scheduledStart', 'scheduledEnd', 'slaExpiresAt', 'lastStatusTransitionAt'],
        order: [['createdAt', 'DESC']]
      }),
      BookingAssignment.findAll({
        where: {
          status: {
            [Op.in]: ['pending']
          }
        },
        include: [{ model: Booking, include: [{ model: Company }, { model: ServiceZone }] }],
        order: [['assignedAt', 'DESC']],
        limit: 10
      }),
      BookingTemplate.findAll({
        where: { status: { [Op.ne]: 'retired' } },
        order: [['updatedAt', 'DESC']],
        limit: 8
      }),
      Company.findAll({ order: [['createdAt', 'DESC']], limit: 25 }),
      ServiceZone.findAll({ order: [['createdAt', 'DESC']], limit: 25 }),
      User.findAll({ where: { type: 'user' }, order: [['createdAt', 'DESC']], limit: 25 })
    ]);

  const bookings = paged.rows.map((booking) => toPlainBookingRow(booking));
  const metrics = computeMetrics(metricSource, range);

  const assignments = {
    outstanding: outstandingAssignments.map((assignment) => {
      const plain = assignment.get({ plain: true });
      return {
        id: plain.id,
        bookingId: plain.bookingId,
        role: plain.role,
        status: plain.status,
        assignedAt: plain.assignedAt ? new Date(plain.assignedAt).toISOString() : null,
        booking: plain.Booking ? toPlainBookingRow(assignment.Booking) : null
      };
    }),
    upcoming: bookings
      .filter((booking) => booking.status === 'scheduled')
      .slice(0, 6)
      .map((booking) => ({
        id: booking.id,
        scheduledStart: booking.scheduledStart,
        zone: booking.zone,
        company: booking.company,
        title: booking.summary || booking.reference
      }))
  };

  const templateSummaries = templates.map((template) => {
    const plain = template.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      status: plain.status,
      defaultType: plain.defaultType,
      defaultDemandLevel: plain.defaultDemandLevel
    };
  });

  const timeframeOptions = Object.entries(TIMEFRAMES).map(([value, config]) => ({
    value,
    label: config.label
  }));

  return {
    timeframe: range.key,
    timeframeLabel: range.label,
    generatedAt: new Date().toISOString(),
    metrics,
    filters: {
      statuses: [
        { value: '', label: 'All statuses' },
        ...['pending', 'awaiting_assignment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'disputed'].map((value) => ({
          value,
          label: value.replace(/_/g, ' ')
        }))
      ],
      types: [
        { value: '', label: 'All booking types' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'on_demand', label: 'On-demand' }
      ],
      demandLevels: [
        { value: '', label: 'All demand levels' },
        { value: 'high', label: 'High demand' },
        { value: 'medium', label: 'Balanced demand' },
        { value: 'low', label: 'Emerging demand' }
      ],
      timeframeOptions
    },
    bookings,
    pagination: {
      total: paged.count,
      limit,
      offset,
      hasMore: offset + limit < paged.count
    },
    assignments,
    templates: templateSummaries,
    referenceData: {
      companies: companies.map((company) => toPlainCompany(company)),
      zones: zones.map((zone) => toPlainZone(zone)),
      customers: customers.map((customer) => toPlainCustomer(customer))
    }
  };
}

export async function fetchBookingSettings() {
  const settings = await getPlatformSettings();
  return settings.bookings || {};
}

export async function updateBookingSettings(updates, actor) {
  const settings = await updatePlatformSettings({ bookings: updates }, actor || 'system');
  return settings.bookings || {};
}

async function resolveCustomer(payload = {}) {
  if (payload.customerId) {
    const existing = await User.findByPk(payload.customerId);
    if (existing) {
      return existing.id;
    }
  }

  if (payload.customerEmail) {
    const email = payload.customerEmail.trim().toLowerCase();
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return existing.id;
    }

    const firstName = payload.customerFirstName || 'Customer';
    const lastName = payload.customerLastName || 'Admin';
    const created = await User.create({
      firstName,
      lastName,
      email,
      passwordHash: '!',
      type: 'user'
    });
    return created.id;
  }

  throw new Error('A customerId or customerEmail is required to create a booking.');
}

export async function createAdminBooking(payload = {}, actorId = null) {
  const customerId = await resolveCustomer(payload);
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? { ...payload.metadata } : {};

  if (payload.templateId) {
    const template = await getBookingTemplateById(payload.templateId);
    if (template) {
      metadata.templateId = template.id;
      if (!metadata.title) metadata.title = template.name;
      if (!metadata.summary) metadata.summary = template.description || null;
      metadata.checklist = Array.isArray(metadata.checklist) ? metadata.checklist : template.checklist || [];
      metadata.attachments = Array.isArray(metadata.attachments)
        ? metadata.attachments
        : template.attachments || [];
      if (!metadata.instructions) metadata.instructions = template.instructions || null;
      if (!metadata.heroImageUrl) metadata.heroImageUrl = template.heroImageUrl || null;
      metadata.demandLevel = metadata.demandLevel || template.defaultDemandLevel;
    }
  }

  if (payload.heroImageUrl) {
    metadata.heroImageUrl = payload.heroImageUrl;
  }
  if (payload.summary) {
    metadata.summary = payload.summary;
  }
  if (payload.checklist) {
    metadata.checklist = payload.checklist;
  }
  if (payload.attachments) {
    metadata.attachments = payload.attachments;
  }
  if (payload.notes) {
    metadata.notes = payload.notes;
  }
  if (payload.demandLevel) {
    metadata.demandLevel = payload.demandLevel;
  }

  const booking = await createBooking(
    {
      customerId,
      companyId: payload.companyId,
      zoneId: payload.zoneId,
      type: payload.type === 'on_demand' ? 'on_demand' : 'scheduled',
      demandLevel: metadata.demandLevel || payload.demandLevel || 'medium',
      baseAmount: payload.baseAmount,
      currency: payload.currency || 'GBP',
      scheduledStart: payload.scheduledStart,
      scheduledEnd: payload.scheduledEnd,
      metadata,
      actor: actorId ? { id: actorId, type: 'admin' } : null
    },
    {}
  );

  return booking.reload({ include: [{ model: Company }, { model: ServiceZone }, { model: User, as: 'customer' }] });
}

export async function loadAdminBooking(bookingId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Company },
      { model: ServiceZone },
      { model: User, as: 'customer' },
      { model: BookingAssignment }
    ]
  });
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }
  return toPlainBookingRow(booking);
}

export async function transitionBookingStatus(bookingId, status, actorId, reason) {
  const booking = await updateBookingStatus(bookingId, status, { actorId, reason });
  return booking.reload({ include: [{ model: Company }, { model: ServiceZone }, { model: User, as: 'customer' }] });
}

export async function rescheduleAdminBooking(bookingId, schedule, actorId) {
  const booking = await updateBookingSchedule(bookingId, schedule, { actorId });
  return booking.reload({ include: [{ model: Company }, { model: ServiceZone }, { model: User, as: 'customer' }] });
}

export async function updateAdminBookingMeta(bookingId, updates, actorId) {
  const booking = await updateBookingMetadata(bookingId, updates, { actorId });
  return booking.reload({ include: [{ model: Company }, { model: ServiceZone }, { model: User, as: 'customer' }] });
}

export async function applyTemplateToBooking(bookingId, templateId, actorId) {
  const template = await getBookingTemplateById(templateId);
  if (!template) {
    const error = new Error('Template not found');
    error.statusCode = 404;
    throw error;
  }
  const updates = {
    title: template.name,
    summary: template.description,
    instructions: template.instructions,
    checklist: template.checklist,
    attachments: template.attachments,
    heroImageUrl: template.heroImageUrl,
    templateId: template.id,
    demandLevel: template.defaultDemandLevel
  };
  const booking = await updateBookingMetadata(bookingId, updates, { actorId });
  return booking.reload({ include: [{ model: Company }, { model: ServiceZone }, { model: User, as: 'customer' }] });
}

export default {
  fetchBookingManagementOverview,
  fetchBookingSettings,
  updateBookingSettings,
  createAdminBooking,
  loadAdminBooking,
  transitionBookingStatus,
  rescheduleAdminBooking,
  updateAdminBookingMeta,
  applyTemplateToBooking
};
