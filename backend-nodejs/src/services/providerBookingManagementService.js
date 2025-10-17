import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import sequelize from '../config/database.js';
import {
  Booking,
  BookingAssignment,
  BookingHistoryEntry,
  BookingNote,
  ProviderBookingSetting,
  ServiceZone,
  User
} from '../models/index.js';
import {
  updateBookingStatus,
  updateBookingSchedule,
  updateBookingMetadata,
  getAllowedBookingStatusTransitions
} from './bookingService.js';
import { resolveCompanyForActor, buildHttpError } from './companyAccessService.js';

const HISTORY_TYPES = ['note', 'status_update', 'milestone', 'handoff', 'document'];
const HISTORY_STATUSES = ['open', 'in_progress', 'blocked', 'completed', 'cancelled'];
const HISTORY_ATTACHMENT_TYPES = ['image', 'document', 'link'];
const CONTACT_ROLES = new Set(['operations_manager', 'finance', 'service_lead', 'support', 'director']);
const DISPATCH_STRATEGIES = new Set(['round_robin', 'best_fit', 'manual_review']);
const DEFAULT_SETTINGS = {
  dispatchStrategy: 'round_robin',
  autoAssignEnabled: false,
  defaultSlaHours: 4,
  allowCustomerEdits: true,
  intakeChannels: ['marketplace'],
  escalationContacts: [],
  dispatchPlaybooks: [],
  notesTemplate: null,
  metadata: { quickReplies: [], assetLibrary: [] }
};

function sanitiseString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function sanitiseNullableString(value) {
  const trimmed = sanitiseString(value);
  return trimmed.length ? trimmed : null;
}

function toNumber(value, fallback = 0, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function toFloat(value, fallback = 0) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normaliseChannels(channels) {
  if (!channels) {
    return [];
  }
  const values = Array.isArray(channels) ? channels : sanitiseString(channels).split(',');
  return values.map((entry) => sanitiseString(entry).toLowerCase()).filter(Boolean).slice(0, 12);
}

function normaliseContacts(contacts = []) {
  if (!Array.isArray(contacts)) {
    return [];
  }
  const result = [];
  for (const contact of contacts) {
    if (!contact || typeof contact !== 'object') {
      continue;
    }
    const id = sanitiseString(contact.id) || randomUUID();
    const name = sanitiseNullableString(contact.name);
    if (!name) {
      continue;
    }
    const email = sanitiseNullableString(contact.email);
    const phone = sanitiseNullableString(contact.phone);
    const role = sanitiseString(contact.role).toLowerCase();
    result.push({
      id,
      name,
      email,
      phone,
      role: CONTACT_ROLES.has(role) ? role : 'operations_manager'
    });
  }
  return result.slice(0, 20);
}

function normalisePlaybooks(playbooks = []) {
  if (!Array.isArray(playbooks)) {
    return [];
  }
  const result = [];
  for (const playbook of playbooks) {
    if (!playbook || typeof playbook !== 'object') {
      continue;
    }
    const id = sanitiseString(playbook.id) || randomUUID();
    const name = sanitiseNullableString(playbook.name);
    if (!name) {
      continue;
    }
    result.push({
      id,
      name,
      summary: sanitiseNullableString(playbook.summary),
      version: toNumber(playbook.version, 1, { min: 1, max: 50 })
    });
  }
  return result.slice(0, 25);
}

function normaliseAssetLibrary(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  const assets = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const url = sanitiseString(item.url);
    if (!url) {
      continue;
    }
    assets.push({
      url,
      label: sanitiseString(item.label) || 'Asset',
      type: sanitiseString(item.type) || 'image'
    });
  }
  return assets.slice(0, 50);
}

function normaliseQuickReplies(values = []) {
  const replies = Array.isArray(values) ? values : sanitiseString(values).split(',');
  return replies.map((entry) => sanitiseString(entry)).filter(Boolean).slice(0, 24);
}

function formatSettings(record) {
  if (!record) {
    return { ...DEFAULT_SETTINGS };
  }
  const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata : {};
  return {
    dispatchStrategy: DISPATCH_STRATEGIES.has(record.dispatchStrategy)
      ? record.dispatchStrategy
      : DEFAULT_SETTINGS.dispatchStrategy,
    autoAssignEnabled: record.autoAssignEnabled === true,
    defaultSlaHours: record.defaultSlaHours ?? DEFAULT_SETTINGS.defaultSlaHours,
    allowCustomerEdits: record.allowCustomerEdits !== false,
    intakeChannels: Array.isArray(record.intakeChannels)
      ? record.intakeChannels.map((entry) => sanitiseString(entry)).filter(Boolean)
      : [...DEFAULT_SETTINGS.intakeChannels],
    escalationContacts: normaliseContacts(record.escalationContacts),
    dispatchPlaybooks: normalisePlaybooks(record.dispatchPlaybooks),
    notesTemplate: record.notesTemplate ?? DEFAULT_SETTINGS.notesTemplate,
    metadata: {
      quickReplies: normaliseQuickReplies(metadata.quickReplies ?? DEFAULT_SETTINGS.metadata.quickReplies),
      assetLibrary: normaliseAssetLibrary(metadata.assetLibrary ?? DEFAULT_SETTINGS.metadata.assetLibrary)
    }
  };
}

function buildStatusOptions(status) {
  const transitions = getAllowedBookingStatusTransitions(status);
  const unique = new Set([status, ...transitions]);
  return Array.from(unique).map((value) => ({ value, label: humaniseStatus(value) }));
}

function humaniseStatus(status) {
  if (!status) {
    return '';
  }
  return String(status)
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function mapNotes(notes = []) {
  return notes.slice(0, 8).map((note) => ({
    id: note.id,
    body: note.body,
    attachments: Array.isArray(note.attachments) ? note.attachments : [],
    authorId: note.authorId,
    authorType: note.authorType,
    createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : null
  }));
}

function mapHistory(entries = []) {
  return entries.slice(0, 12).map((entry) => ({
    id: entry.id,
    title: entry.title,
    entryType: entry.entryType,
    status: entry.status,
    summary: entry.summary,
    occurredAt: entry.occurredAt ? new Date(entry.occurredAt).toISOString() : null,
    attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
    actorName: entry.actorName || null,
    actorRole: entry.actorRole || null
  }));
}

function extractAssignments(booking) {
  if (!booking || !Array.isArray(booking.BookingAssignments)) {
    return [];
  }
  return booking.BookingAssignments.map((assignment) => ({
    id: assignment.id,
    providerId: assignment.providerId,
    role: assignment.role,
    status: assignment.status,
    assignedAt: assignment.assignedAt instanceof Date ? assignment.assignedAt.toISOString() : assignment.assignedAt ?? null,
    acknowledgedAt:
      assignment.acknowledgedAt instanceof Date ? assignment.acknowledgedAt.toISOString() : assignment.acknowledgedAt ?? null,
    provider: assignment.provider
      ? {
          id: assignment.provider.id,
          name: [assignment.provider.firstName, assignment.provider.lastName].filter(Boolean).join(' ') || null,
          email: assignment.provider.email ?? null
        }
      : null
  }));
}

function deriveTags(meta) {
  if (!meta) {
    return [];
  }
  if (Array.isArray(meta.tags)) {
    return meta.tags.map((tag) => sanitiseString(tag)).filter(Boolean);
  }
  const tags = sanitiseString(meta.tags || '')
    .split(',')
    .map((tag) => sanitiseString(tag))
    .filter(Boolean);
  return tags;
}

function deriveChecklist(meta) {
  if (!meta || !Array.isArray(meta.checklist)) {
    return [];
  }
  return meta.checklist
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const label = sanitiseString(item.label);
      if (!label) {
        return null;
      }
      return {
        id: sanitiseString(item.id) || `item-${index + 1}`,
        label,
        mandatory: item.mandatory === true
      };
    })
    .filter(Boolean);
}

function deriveAttachments(meta) {
  if (!meta || !Array.isArray(meta.attachments)) {
    return [];
  }
  return meta.attachments
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const label = sanitiseString(item.label);
      const url = sanitiseString(item.url);
      if (!label || !url) {
        return null;
      }
      const type = sanitiseString(item.type);
      return {
        label,
        url,
        type: HISTORY_ATTACHMENT_TYPES.includes(type) ? type : 'document'
      };
    })
    .filter(Boolean);
}

function deriveImages(meta) {
  if (!meta || !Array.isArray(meta.images)) {
    return [];
  }
  return meta.images
    .map((image) => {
      if (!image || typeof image !== 'object') {
        return null;
      }
      const url = sanitiseString(image.url);
      if (!url) {
        return null;
      }
      return {
        url,
        label: sanitiseString(image.label) || 'Site photo'
      };
    })
    .filter(Boolean);
}

function mapBookingRecord(booking, notes, history, timezone = 'UTC') {
  const meta = booking.meta && typeof booking.meta === 'object' ? booking.meta : {};
  const scheduledStart = booking.scheduledStart instanceof Date ? booking.scheduledStart.toISOString() : booking.scheduledStart;
  const scheduledEnd = booking.scheduledEnd instanceof Date ? booking.scheduledEnd.toISOString() : booking.scheduledEnd;
  const slaExpiresAt = booking.slaExpiresAt instanceof Date ? booking.slaExpiresAt.toISOString() : booking.slaExpiresAt;
  const demandLevel = booking.demandLevel || meta.demandLevel || 'standard';
  const travelMinutes = toNumber(meta.travelMinutes ?? booking.travelMinutes ?? 0, 0, { min: 0, max: 480 });

  return {
    bookingId: booking.id,
    title: sanitiseNullableString(meta.title) || booking.title || `Booking ${booking.id.slice(0, 8).toUpperCase()}`,
    status: booking.status,
    statusLabel: humaniseStatus(booking.status),
    statusOptions: buildStatusOptions(booking.status),
    scheduledStart,
    scheduledEnd,
    slaExpiresAt,
    lastStatusTransitionAt:
      booking.lastStatusTransitionAt instanceof Date
        ? booking.lastStatusTransitionAt.toISOString()
        : booking.lastStatusTransitionAt ?? null,
    timezone,
    location: sanitiseNullableString(booking.location) || sanitiseNullableString(meta.location),
    zone: booking.ServiceZone
      ? {
          id: booking.ServiceZone.id,
          name: booking.ServiceZone.name,
          demandLevel: booking.ServiceZone.demandLevel ?? demandLevel
        }
      : null,
    demandLevel,
    instructions: sanitiseNullableString(booking.instructions || meta.instructions) || '',
    summary: sanitiseNullableString(meta.summary) || '',
    customer: {
      name: sanitiseNullableString(meta.customerName || booking.customer?.firstName || booking.customer?.lastName),
      reference: sanitiseNullableString(meta.reference || booking.referenceCode || null),
      contact: {
        email: sanitiseNullableString(meta.contactEmail || booking.customer?.email || null),
        phone: sanitiseNullableString(meta.contactPhone || null)
      }
    },
    financial: {
      totalAmount: toFloat(booking.totalAmount, null),
      commissionAmount: toFloat(booking.commissionAmount, null),
      currency: booking.currency || meta.currency || 'GBP',
      baseAmount: toFloat(booking.baseAmount, null)
    },
    assignments: extractAssignments(booking),
    notes: mapNotes(notes),
    timeline: mapHistory(history),
    checklist: deriveChecklist(meta),
    attachments: deriveAttachments(meta),
    images: deriveImages(meta),
    tags: deriveTags(meta),
    autoAssignEnabled: Boolean(meta.autoAssignEnabled ?? booking.autoAssignEnabled ?? false),
    allowCustomerEdits: Boolean(meta.allowCustomerEdits ?? booking.allowCustomerEdits ?? true),
    travelMinutes,
    slaStatus:
      booking.slaExpiresAt instanceof Date
        ? DateTime.fromJSDate(booking.slaExpiresAt).diffNow('hours').hours <= 6
          ? 'at_risk'
          : 'healthy'
        : 'unknown',
    links: {
      orderWorkspace: `/dashboards/orders/${booking.id}`,
      bookingApi: `/api/bookings/${booking.id}`
    }
  };
}

function computeSummary(bookings = [], timezone = 'UTC') {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return {
      totalBookings: 0,
      scheduledBookings: 0,
      activeBookings: 0,
      awaitingDispatch: 0,
      completedThisMonth: 0,
      slaAtRisk: 0,
      revenueScheduled: 0,
      averageTravelMinutes: 0,
      currency: 'GBP'
    };
  }

  let scheduled = 0;
  let active = 0;
  let awaiting = 0;
  let completedWindow = 0;
  let slaRisk = 0;
  let travelTotal = 0;
  let travelSamples = 0;
  let revenue = 0;
  let currency = bookings[0].financial?.currency || 'GBP';
  const now = DateTime.now().setZone(timezone || 'UTC');

  for (const booking of bookings) {
    if (booking.status === 'scheduled') {
      scheduled += 1;
    }
    if (booking.status === 'in_progress') {
      active += 1;
    }
    if (['pending', 'awaiting_assignment'].includes(booking.status)) {
      awaiting += 1;
    }
    if (booking.status === 'completed') {
      if (booking.lastStatusTransitionAt) {
        const completedAt = DateTime.fromISO(booking.lastStatusTransitionAt, { zone: timezone || 'UTC' });
        if (completedAt.isValid && completedAt >= now.minus({ days: 30 })) {
          completedWindow += 1;
        }
      }
    }
    if (booking.slaStatus === 'at_risk') {
      slaRisk += 1;
    }
    if (Number.isFinite(booking.travelMinutes) && booking.travelMinutes > 0) {
      travelTotal += booking.travelMinutes;
      travelSamples += 1;
    }
    if (booking.financial?.commissionAmount != null) {
      revenue += Number.parseFloat(booking.financial.commissionAmount) || 0;
    }
    if (!currency && booking.financial?.currency) {
      currency = booking.financial.currency;
    }
  }

  return {
    totalBookings: bookings.length,
    scheduledBookings: scheduled,
    activeBookings: active,
    awaitingDispatch: awaiting,
    completedThisMonth: completedWindow,
    slaAtRisk: slaRisk,
    revenueScheduled: Math.round(revenue * 100) / 100,
    averageTravelMinutes: travelSamples ? Math.round(travelTotal / travelSamples) : 0,
    currency: currency || 'GBP'
  };
}

async function ensureCompanyBooking(companyId, bookingId) {
  const booking = await Booking.findByPk(bookingId, { attributes: ['id', 'companyId'] });
  if (!booking || booking.companyId !== companyId) {
    throw buildHttpError(404, 'booking_not_found');
  }
  return booking;
}

export async function getProviderBookingWorkspace({ companyId, timezone = 'UTC', actor } = {}) {
  if (!companyId) {
    throw buildHttpError(400, 'company_required');
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  const bookings = await Booking.findAll({
    where: { companyId: company.id },
    include: [
      {
        model: BookingAssignment,
        include: [{ model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      },
      { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: ServiceZone, attributes: ['id', 'name', 'demandLevel'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: 150
  });

  const bookingIds = bookings.map((booking) => booking.id);

  const [notes, history, settingsRecord] = await Promise.all([
    bookingIds.length
      ? BookingNote.findAll({
          where: { bookingId: { [Op.in]: bookingIds } },
          order: [['createdAt', 'DESC']],
          limit: 400
        })
      : [],
    bookingIds.length
      ? BookingHistoryEntry.findAll({
          where: { bookingId: { [Op.in]: bookingIds } },
          order: [['occurredAt', 'DESC']],
          limit: 400
        })
      : [],
    ProviderBookingSetting.findOne({ where: { companyId: company.id } })
  ]);

  const notesByBooking = new Map();
  for (const note of notes) {
    const list = notesByBooking.get(note.bookingId) ?? [];
    if (list.length < 8) {
      list.push(note.get({ plain: true }));
      notesByBooking.set(note.bookingId, list);
    }
  }

  const historyByBooking = new Map();
  for (const entry of history) {
    const list = historyByBooking.get(entry.bookingId) ?? [];
    if (list.length < 12) {
      list.push(entry.get({ plain: true }));
      historyByBooking.set(entry.bookingId, list);
    }
  }

  const mappedBookings = bookings.map((booking) =>
    mapBookingRecord(
      booking.get({ plain: true }),
      notesByBooking.get(booking.id) ?? [],
      historyByBooking.get(booking.id) ?? [],
      timezone
    )
  );

  return {
    companyId: company.id,
    timezone,
    summary: computeSummary(mappedBookings, timezone),
    bookings: mappedBookings,
    settings: formatSettings(settingsRecord ? settingsRecord.get({ plain: true }) : null)
  };
}

export async function updateProviderBookingSettings({ companyId, actor, updates = {} }) {
  if (!companyId) {
    throw buildHttpError(400, 'company_required');
  }
  const { company } = await resolveCompanyForActor({ companyId, actor });

  return sequelize.transaction(async (transaction) => {
    const [record] = await ProviderBookingSetting.findOrCreate({
      where: { companyId: company.id },
      defaults: { companyId: company.id },
      transaction
    });

    const strategy = sanitiseString(updates.dispatchStrategy).toLowerCase();
    if (DISPATCH_STRATEGIES.has(strategy)) {
      record.dispatchStrategy = strategy;
    }

    record.autoAssignEnabled = updates.autoAssignEnabled === true;
    record.defaultSlaHours = toNumber(updates.defaultSlaHours, record.defaultSlaHours ?? 4, { min: 1, max: 72 });
    record.allowCustomerEdits = updates.allowCustomerEdits !== false;
    record.intakeChannels = normaliseChannels(updates.intakeChannels);
    record.escalationContacts = normaliseContacts(updates.escalationContacts);
    record.dispatchPlaybooks = normalisePlaybooks(updates.dispatchPlaybooks);
    record.notesTemplate = sanitiseNullableString(updates.notesTemplate);

    const metadata = record.metadata && typeof record.metadata === 'object' ? { ...record.metadata } : {};
    if (Object.hasOwn(updates, 'metadata')) {
      const candidate = updates.metadata && typeof updates.metadata === 'object' ? updates.metadata : {};
      if (Object.hasOwn(candidate, 'quickReplies')) {
        metadata.quickReplies = normaliseQuickReplies(candidate.quickReplies);
      }
      if (Object.hasOwn(candidate, 'assetLibrary')) {
        metadata.assetLibrary = normaliseAssetLibrary(candidate.assetLibrary);
      }
      if (Object.hasOwn(candidate, 'notificationRecipients')) {
        const recipients = Array.isArray(candidate.notificationRecipients)
          ? candidate.notificationRecipients.map((entry) => sanitiseString(entry)).filter(Boolean)
          : [];
        metadata.notificationRecipients = recipients.slice(0, 25);
      }
    }
    record.metadata = metadata;

    await record.save({ transaction, actor: actor?.id ? { id: actor.id } : undefined });

    return formatSettings(record.get({ plain: true }));
  });
}

export async function updateProviderBookingStatus({ companyId, actor, bookingId, status, reason }) {
  if (!status) {
    throw buildHttpError(400, 'status_required');
  }
  const { company } = await resolveCompanyForActor({ companyId, actor });
  await ensureCompanyBooking(company.id, bookingId);

  const booking = await updateBookingStatus(bookingId, status, {
    actorId: actor?.id ?? company.userId ?? null,
    persona: 'provider',
    reason: sanitiseNullableString(reason) || 'provider_update'
  });
  return booking.get({ plain: true });
}

export async function updateProviderBookingSchedule({ companyId, actor, bookingId, schedule = {} }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  await ensureCompanyBooking(company.id, bookingId);

  const payload = {};
  if (schedule.scheduledStart) {
    payload.scheduledStart = schedule.scheduledStart;
  }
  if (schedule.scheduledEnd) {
    payload.scheduledEnd = schedule.scheduledEnd;
  }
  if (schedule.travelMinutes != null) {
    payload.travelMinutes = toNumber(schedule.travelMinutes, null, { min: 0, max: 480 });
  }

  const booking = await updateBookingSchedule(bookingId, payload, {
    actorId: actor?.id ?? company.userId ?? null,
    persona: 'provider'
  });
  return booking.get({ plain: true });
}

export async function updateProviderBookingDetails({ companyId, actor, bookingId, updates = {} }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  await ensureCompanyBooking(company.id, bookingId);

  const payload = {};
  if (Object.hasOwn(updates, 'instructions')) {
    payload.instructions = sanitiseNullableString(updates.instructions) || '';
  }
  if (Object.hasOwn(updates, 'summary')) {
    payload.summary = sanitiseNullableString(updates.summary) || '';
  }
  if (Object.hasOwn(updates, 'tags')) {
    payload.tags = deriveTags({ tags: updates.tags });
  }
  if (Object.hasOwn(updates, 'checklist')) {
    payload.checklist = deriveChecklist({ checklist: updates.checklist });
  }
  if (Object.hasOwn(updates, 'attachments')) {
    payload.attachments = deriveAttachments({ attachments: updates.attachments });
  }
  if (Object.hasOwn(updates, 'images')) {
    payload.images = deriveImages({ images: updates.images });
  }
  if (Object.hasOwn(updates, 'autoAssignEnabled')) {
    payload.autoAssignEnabled = updates.autoAssignEnabled === true;
  }
  if (Object.hasOwn(updates, 'allowCustomerEdits')) {
    payload.allowCustomerEdits = updates.allowCustomerEdits !== false;
  }

  const booking = await updateBookingMetadata(bookingId, payload, {
    actorId: actor?.id ?? company.userId ?? null,
    persona: 'provider'
  });
  return booking.get({ plain: true });
}

export async function createProviderBookingNote({ companyId, actor, bookingId, body, attachments = [] }) {
  if (!sanitiseString(body)) {
    throw buildHttpError(400, 'note_body_required');
  }
  const { company } = await resolveCompanyForActor({ companyId, actor });
  await ensureCompanyBooking(company.id, bookingId);

  const note = await BookingNote.create({
    bookingId,
    body: sanitiseString(body),
    authorId: actor?.id ?? company.userId ?? null,
    authorType: 'provider',
    attachments: deriveAttachments({ attachments })
  });

  return note.get({ plain: true });
}

export async function createProviderTimelineEntry({
  companyId,
  actor,
  bookingId,
  title,
  entryType,
  status,
  summary,
  occurredAt,
  attachments = []
}) {
  const safeTitle = sanitiseNullableString(title);
  if (!safeTitle) {
    throw buildHttpError(400, 'timeline_title_required');
  }
  const { company } = await resolveCompanyForActor({ companyId, actor });
  await ensureCompanyBooking(company.id, bookingId);

  const type = sanitiseString(entryType).toLowerCase();
  const resolvedType = HISTORY_TYPES.includes(type) ? type : 'note';
  const statusValue = sanitiseString(status).toLowerCase();
  const resolvedStatus = HISTORY_STATUSES.includes(statusValue) ? statusValue : 'open';

  const entry = await BookingHistoryEntry.create({
    bookingId,
    title: safeTitle,
    entryType: resolvedType,
    status: resolvedStatus,
    summary: sanitiseNullableString(summary),
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    attachments: deriveAttachments({ attachments }),
    actorId: actor?.id ?? company.userId ?? null,
    actorRole: 'provider',
    actorName: actor?.name ?? company.contactName ?? 'Provider operations'
  });

  return entry.get({ plain: true });
}

export default {
  getProviderBookingWorkspace,
  updateProviderBookingSettings,
  updateProviderBookingStatus,
  updateProviderBookingSchedule,
  updateProviderBookingDetails,
  createProviderBookingNote,
  createProviderTimelineEntry
};
