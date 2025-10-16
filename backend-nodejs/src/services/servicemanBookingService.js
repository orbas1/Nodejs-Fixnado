import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import sequelize from '../config/database.js';
import {
  Booking,
  BookingAssignment,
  BookingHistoryEntry,
  BookingNote,
  ServicemanBookingSetting
} from '../models/index.js';
import {
  updateBookingStatus,
  updateBookingSchedule,
  updateBookingMetadata,
  getAllowedBookingStatusTransitions
} from './bookingService.js';

const HISTORY_TYPES = new Set(['note', 'status_update', 'milestone', 'handoff', 'document']);
const HISTORY_STATUSES = new Set(['open', 'in_progress', 'blocked', 'completed', 'cancelled']);
const HISTORY_ACTOR_ROLE = 'provider';
const CONTACT_CHANNELS = new Set(['sms', 'call', 'email', 'push']);
const MAX_ATTACHMENTS = 10;
const MAX_QUICK_REPLIES = 12;
const MAX_CHECKLIST_ITEMS = 20;

const DEFAULT_SETTINGS = {
  autoAcceptAssignments: false,
  travelBufferMinutes: 30,
  maxDailyJobs: 8,
  preferredContactChannel: 'sms',
  defaultArrivalWindow: { start: null, end: null },
  notesTemplate: null,
  safetyBriefTemplate: null,
  quickReplies: [],
  defaultChecklist: [],
  assetLibrary: []
};

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

function normaliseTimeWindow(value) {
  const trimmed = sanitiseString(value);
  if (!trimmed) {
    return null;
  }
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

function normaliseChecklist(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  const entries = [];
  for (let index = 0; index < items.length && entries.length < MAX_CHECKLIST_ITEMS; index += 1) {
    const item = items[index];
    if (!item || typeof item !== 'object') {
      continue;
    }
    const label = sanitiseString(item.label);
    if (!label) {
      continue;
    }
    const id = sanitiseString(item.id) || `item-${index + 1}`;
    entries.push({ id, label, mandatory: item.mandatory === true });
  }
  return entries;
}

function normaliseAttachments(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  const attachments = [];
  for (let index = 0; index < items.length && attachments.length < MAX_ATTACHMENTS; index += 1) {
    const item = items[index];
    if (!item || typeof item !== 'object') {
      continue;
    }
    const url = sanitiseString(item.url);
    if (!url) {
      continue;
    }
    const label = sanitiseString(item.label) || `Attachment ${attachments.length + 1}`;
    const type = sanitiseString(item.type) || 'link';
    attachments.push({ url, label, type });
  }
  return attachments;
}

function normaliseAssetLibrary(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  const assets = [];
  for (let index = 0; index < items.length && assets.length < MAX_ATTACHMENTS; index += 1) {
    const item = items[index];
    if (!item || typeof item !== 'object') {
      continue;
    }
    const url = sanitiseString(item.url);
    if (!url) {
      continue;
    }
    const label = sanitiseString(item.label) || `Asset ${assets.length + 1}`;
    const type = sanitiseString(item.type) || 'image';
    assets.push({ url, label, type });
  }
  return assets;
}

function normaliseQuickReplies(values = []) {
  const replies = Array.isArray(values) ? values : sanitiseString(values).split(',');
  return replies
    .map((entry) => sanitiseString(entry))
    .filter((entry) => entry.length)
    .slice(0, MAX_QUICK_REPLIES);
}

function formatSettings(record) {
  if (!record) {
    return { ...DEFAULT_SETTINGS };
  }
  const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata : {};
  return {
    autoAcceptAssignments: record.autoAcceptAssignments ?? DEFAULT_SETTINGS.autoAcceptAssignments,
    travelBufferMinutes: record.travelBufferMinutes ?? DEFAULT_SETTINGS.travelBufferMinutes,
    maxDailyJobs: record.maxDailyJobs ?? DEFAULT_SETTINGS.maxDailyJobs,
    preferredContactChannel:
      CONTACT_CHANNELS.has(record.preferredContactChannel)
        ? record.preferredContactChannel
        : DEFAULT_SETTINGS.preferredContactChannel,
    defaultArrivalWindow: {
      start: record.defaultArrivalWindowStart || DEFAULT_SETTINGS.defaultArrivalWindow.start,
      end: record.defaultArrivalWindowEnd || DEFAULT_SETTINGS.defaultArrivalWindow.end
    },
    notesTemplate: record.notesTemplate ?? DEFAULT_SETTINGS.notesTemplate,
    safetyBriefTemplate: record.safetyBriefTemplate ?? DEFAULT_SETTINGS.safetyBriefTemplate,
    quickReplies: Array.isArray(metadata.quickReplies)
      ? metadata.quickReplies.map((entry) => sanitiseString(entry)).filter(Boolean)
      : [...DEFAULT_SETTINGS.quickReplies],
    defaultChecklist: Array.isArray(metadata.defaultChecklist)
      ? normaliseChecklist(metadata.defaultChecklist)
      : [...DEFAULT_SETTINGS.defaultChecklist],
    assetLibrary: Array.isArray(metadata.assetLibrary)
      ? normaliseAssetLibrary(metadata.assetLibrary)
      : [...DEFAULT_SETTINGS.assetLibrary]
  };
}

function ensureAssignment(servicemanId, bookingId, transaction) {
  return BookingAssignment.findOne({
    where: { providerId: servicemanId, bookingId },
    transaction
  });
}

function humaniseStatus(status) {
  if (!status) {
    return '';
  }
  return status
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function deriveTags(meta) {
  if (!meta) {
    return [];
  }
  if (Array.isArray(meta.tags)) {
    return meta.tags.map((tag) => sanitiseString(tag)).filter(Boolean);
  }
  if (typeof meta.tagsText === 'string') {
    return meta.tagsText
      .split(',')
      .map((tag) => sanitiseString(tag))
      .filter(Boolean);
  }
  return [];
}

function deriveImages(meta) {
  if (!meta) {
    return [];
  }
  if (Array.isArray(meta.images)) {
    return meta.images
      .map((image) => ({
        url: sanitiseString(image.url),
        label: sanitiseString(image.label) || 'Image',
        type: sanitiseString(image.type) || 'image'
      }))
      .filter((image) => image.url.length);
  }
  if (meta.heroImageUrl) {
    return [{ url: sanitiseString(meta.heroImageUrl), label: 'Hero image', type: 'image' }];
  }
  return [];
}

function mapNotes(notes = []) {
  return notes.map((note) => ({
    id: note.id,
    body: note.body,
    createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
    authorId: note.authorId ?? null,
    authorType: note.authorType ?? null,
    attachments: Array.isArray(note.attachments) ? note.attachments : [],
    isPinned: note.isPinned === true
  }));
}

function mapHistory(entries = []) {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    entryType: entry.entryType,
    status: entry.status,
    summary: entry.summary ?? null,
    occurredAt: entry.occurredAt instanceof Date ? entry.occurredAt.toISOString() : entry.occurredAt,
    actorId: entry.actorId ?? null,
    actorRole: entry.actorRole ?? null,
    attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
    meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : {}
  }));
}

function buildStatusOptions(current) {
  const transitions = getAllowedBookingStatusTransitions(current);
  const unique = new Set([current, ...transitions]);
  return Array.from(unique).map((status) => ({ value: status, label: humaniseStatus(status) }));
}

export async function getServicemanBookingWorkspace({ servicemanId, timezone = 'UTC' }) {
  if (!servicemanId) {
    const error = new Error('serviceman_required');
    error.statusCode = 400;
    throw error;
  }

  const assignments = await BookingAssignment.findAll({
    where: { providerId: servicemanId },
    include: [{ model: Booking }],
    order: [['assignedAt', 'DESC']]
  });

  const bookingIds = assignments.map((assignment) => assignment.bookingId);

  const [notes, history, settingsRecord] = await Promise.all([
    bookingIds.length
      ? BookingNote.findAll({
          where: { bookingId: { [Op.in]: bookingIds } },
          order: [['createdAt', 'DESC']],
          limit: 200
        })
      : [],
    bookingIds.length
      ? BookingHistoryEntry.findAll({
          where: { bookingId: { [Op.in]: bookingIds } },
          order: [['occurredAt', 'DESC']],
          limit: 200
        })
      : [],
    ServicemanBookingSetting.findOne({ where: { servicemanId } })
  ]);

  const notesByBooking = new Map();
  for (const note of notes) {
    const current = notesByBooking.get(note.bookingId) ?? [];
    if (current.length < 8) {
      current.push(note.get({ plain: true }));
      notesByBooking.set(note.bookingId, current);
    }
  }

  const historyByBooking = new Map();
  for (const entry of history) {
    const current = historyByBooking.get(entry.bookingId) ?? [];
    if (current.length < 12) {
      current.push(entry.get({ plain: true }));
      historyByBooking.set(entry.bookingId, current);
    }
  }

  const now = DateTime.now().setZone(timezone || 'UTC');
  let revenueEarned = 0;
  let travelMinutesAggregate = 0;
  let travelSamples = 0;
  let slaAtRisk = 0;
  let scheduledCount = 0;
  let inProgressCount = 0;
  let awaitingCount = 0;
  let completedThisMonth = 0;

  const bookings = assignments.map((assignment) => {
    const booking = assignment.Booking;
    if (!booking) {
      return null;
    }
    const meta = booking.meta && typeof booking.meta === 'object' ? booking.meta : {};
    const status = booking.status;

    if (status === 'scheduled') {
      scheduledCount += 1;
    } else if (status === 'in_progress') {
      inProgressCount += 1;
    } else if (status === 'pending' || status === 'awaiting_assignment' || assignment.status === 'pending') {
      awaitingCount += 1;
    }

    const commission = toFloat(booking.commissionAmount, 0);
    revenueEarned += commission;

    const travelMinutes = toNumber(meta.travelMinutes, 0, { min: 0, max: 480 });
    if (travelMinutes > 0) {
      travelMinutesAggregate += travelMinutes;
      travelSamples += 1;
    }

    if (booking.slaExpiresAt instanceof Date && status !== 'completed' && status !== 'cancelled') {
      const expiry = DateTime.fromJSDate(booking.slaExpiresAt).setZone(timezone || 'UTC');
      if (expiry <= now.plus({ hours: 6 })) {
        slaAtRisk += 1;
      }
    }

    if (status === 'completed' && booking.lastStatusTransitionAt instanceof Date) {
      const completedAt = DateTime.fromJSDate(booking.lastStatusTransitionAt).setZone(timezone || 'UTC');
      if (completedAt >= now.minus({ days: 30 })) {
        completedThisMonth += 1;
      }
    }

    const plainNotes = mapNotes(notesByBooking.get(booking.id) ?? []);
    const plainHistory = mapHistory(historyByBooking.get(booking.id) ?? []);

    return {
      bookingId: booking.id,
      assignmentId: assignment.id,
      assignmentStatus: assignment.status,
      role: assignment.role,
      title: sanitiseString(meta.title) || booking.title || `Booking ${booking.id.slice(0, 8).toUpperCase()}`,
      status,
      statusLabel: humaniseStatus(status),
      statusOptions: buildStatusOptions(status),
      scheduledStart:
        booking.scheduledStart instanceof Date ? booking.scheduledStart.toISOString() : booking.scheduledStart ?? null,
      scheduledEnd: booking.scheduledEnd instanceof Date ? booking.scheduledEnd.toISOString() : booking.scheduledEnd ?? null,
      slaExpiresAt: booking.slaExpiresAt instanceof Date ? booking.slaExpiresAt.toISOString() : booking.slaExpiresAt ?? null,
      acknowledgedAt:
        assignment.acknowledgedAt instanceof Date ? assignment.acknowledgedAt.toISOString() : assignment.acknowledgedAt ?? null,
      assignedAt: assignment.assignedAt instanceof Date ? assignment.assignedAt.toISOString() : assignment.assignedAt ?? null,
      location: sanitiseNullableString(booking.location) || sanitiseNullableString(meta.location),
      siteContact: {
        name: sanitiseNullableString(meta.siteContact || meta.requester || meta.customerName || meta.owner || null),
        phone: sanitiseNullableString(meta.siteContactPhone || meta.contactPhone || null),
        email: sanitiseNullableString(meta.siteContactEmail || meta.contactEmail || null)
      },
      customer: {
        name: sanitiseNullableString(meta.customerName || meta.companyName || null),
        reference: sanitiseNullableString(meta.reference || booking.referenceCode || null)
      },
      demandLevel: sanitiseNullableString(booking.demandLevel || meta.demandLevel) || 'medium',
      instructions: sanitiseNullableString(booking.instructions || meta.instructions) || '',
      summary: sanitiseNullableString(meta.summary) || '',
      notes: plainNotes,
      timeline: plainHistory,
      checklist: Array.isArray(meta.checklist) ? normaliseChecklist(meta.checklist) : [],
      attachments: Array.isArray(meta.attachments) ? normaliseAttachments(meta.attachments) : [],
      images: deriveImages(meta),
      tags: deriveTags(meta),
      autoAssignEnabled: Boolean(meta.autoAssignEnabled ?? booking.autoAssignEnabled ?? false),
      allowCustomerEdits: Boolean(meta.allowCustomerEdits ?? false),
      travelMinutes,
      totalAmount: toFloat(booking.totalAmount, null),
      commissionAmount: commission,
      currency: booking.currency || meta.currency || 'GBP',
      slaStatus: booking.slaExpiresAt instanceof Date
        ? DateTime.fromJSDate(booking.slaExpiresAt).setZone(timezone || 'UTC') <= now.plus({ hours: 6 })
          ? 'at_risk'
          : 'healthy'
        : 'unknown',
      links: {
        orderWorkspace: `/dashboards/orders/${booking.id}`,
        bookingApi: `/api/bookings/${booking.id}`
      }
    };
  }).filter(Boolean);

  const avgTravelMinutes = travelSamples ? Math.round(travelMinutesAggregate / travelSamples) : 0;

  const summaryCurrency = bookings[0]?.currency || 'GBP';

  return {
    servicemanId,
    timezone,
    summary: {
      totalAssignments: assignments.length,
      scheduledAssignments: scheduledCount,
      activeAssignments: inProgressCount,
      awaitingResponse: awaitingCount,
      completedThisMonth,
      slaAtRisk,
      revenueEarned,
      averageTravelMinutes: avgTravelMinutes,
      currency: summaryCurrency
    },
    bookings,
    settings: formatSettings(settingsRecord ? settingsRecord.get({ plain: true }) : null)
  };
}

export async function updateServicemanBookingSettings(servicemanId, updates = {}, actorId = null) {
  if (!servicemanId) {
    const error = new Error('serviceman_required');
    error.statusCode = 400;
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const [record] = await ServicemanBookingSetting.findOrCreate({
      where: { servicemanId },
      defaults: { servicemanId },
      transaction
    });

    record.autoAcceptAssignments = updates.autoAcceptAssignments === true;
    record.travelBufferMinutes = toNumber(updates.travelBufferMinutes, record.travelBufferMinutes ?? 30, {
      min: 0,
      max: 480
    });
    record.maxDailyJobs = toNumber(updates.maxDailyJobs, record.maxDailyJobs ?? 8, { min: 1, max: 24 });

    const contactChannel = sanitiseString(updates.preferredContactChannel).toLowerCase();
    record.preferredContactChannel = CONTACT_CHANNELS.has(contactChannel)
      ? contactChannel
      : record.preferredContactChannel;

    record.defaultArrivalWindowStart = normaliseTimeWindow(
      updates.defaultArrivalWindow?.start ?? updates.defaultArrivalWindowStart
    );
    record.defaultArrivalWindowEnd = normaliseTimeWindow(
      updates.defaultArrivalWindow?.end ?? updates.defaultArrivalWindowEnd
    );

    record.notesTemplate = sanitiseNullableString(updates.notesTemplate ?? record.notesTemplate ?? null);
    record.safetyBriefTemplate = sanitiseNullableString(updates.safetyBriefTemplate ?? record.safetyBriefTemplate ?? null);

    const metadata = record.metadata && typeof record.metadata === 'object' ? { ...record.metadata } : {};

    if (Object.hasOwn(updates, 'quickReplies')) {
      metadata.quickReplies = normaliseQuickReplies(updates.quickReplies);
    }

    if (Object.hasOwn(updates, 'defaultChecklist')) {
      metadata.defaultChecklist = normaliseChecklist(updates.defaultChecklist);
    }

    if (Object.hasOwn(updates, 'assetLibrary')) {
      metadata.assetLibrary = normaliseAssetLibrary(updates.assetLibrary);
    }

    record.metadata = metadata;

    await record.save({ transaction, actor: actorId ? { id: actorId } : undefined });

    return formatSettings(record.get({ plain: true }));
  });
}

export async function updateServicemanBookingStatus({ servicemanId, bookingId, status, actorId, reason }) {
  const assignment = await ensureAssignment(servicemanId, bookingId);
  if (!assignment) {
    const error = new Error('booking_assignment_not_found');
    error.statusCode = 404;
    throw error;
  }
  if (!status) {
    const error = new Error('status_required');
    error.statusCode = 400;
    throw error;
  }

  const booking = await updateBookingStatus(bookingId, status, {
    actorId,
    reason: sanitiseNullableString(reason) || 'serviceman_update',
    persona: 'serviceman'
  });
  return booking.get({ plain: true });
}

export async function updateServicemanBookingSchedule({ servicemanId, bookingId, schedule = {}, actorId }) {
  const assignment = await ensureAssignment(servicemanId, bookingId);
  if (!assignment) {
    const error = new Error('booking_assignment_not_found');
    error.statusCode = 404;
    throw error;
  }

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
    actorId,
    persona: 'serviceman'
  });
  return booking.get({ plain: true });
}

export async function updateServicemanBookingDetails({ servicemanId, bookingId, updates = {}, actorId }) {
  const assignment = await ensureAssignment(servicemanId, bookingId);
  if (!assignment) {
    const error = new Error('booking_assignment_not_found');
    error.statusCode = 404;
    throw error;
  }

  const payload = {};
  if (Object.hasOwn(updates, 'instructions')) {
    payload.instructions = sanitiseNullableString(updates.instructions) || '';
  }
  if (Object.hasOwn(updates, 'summary')) {
    payload.summary = sanitiseNullableString(updates.summary) || '';
  }
  if (Object.hasOwn(updates, 'notes')) {
    payload.notes = sanitiseNullableString(updates.notes) || '';
  }
  if (Object.hasOwn(updates, 'checklist')) {
    payload.checklist = normaliseChecklist(updates.checklist);
  }
  if (Object.hasOwn(updates, 'attachments')) {
    payload.attachments = normaliseAttachments(updates.attachments);
  }
  if (Object.hasOwn(updates, 'tags')) {
    const tags = Array.isArray(updates.tags)
      ? updates.tags.map((tag) => sanitiseString(tag)).filter(Boolean)
      : sanitiseString(updates.tags)
          .split(',')
          .map((tag) => sanitiseString(tag))
          .filter(Boolean);
    payload.tags = tags;
  }
  if (Object.hasOwn(updates, 'images')) {
    payload.images = normaliseAssetLibrary(updates.images);
  }

  const booking = await updateBookingMetadata(bookingId, payload, {
    actorId,
    persona: 'serviceman'
  });
  return booking.get({ plain: true });
}

export async function createServicemanBookingNote({ servicemanId, bookingId, body, attachments = [], actorId }) {
  if (!sanitiseString(body)) {
    const error = new Error('note_body_required');
    error.statusCode = 400;
    throw error;
  }

  const assignment = await ensureAssignment(servicemanId, bookingId);
  if (!assignment) {
    const error = new Error('booking_assignment_not_found');
    error.statusCode = 404;
    throw error;
  }

  const note = await BookingNote.create({
    bookingId,
    body: sanitiseString(body),
    authorId: actorId ?? servicemanId,
    authorType: 'serviceman',
    attachments: normaliseAttachments(attachments)
  });

  return note.get({ plain: true });
}

export async function createServicemanTimelineEntry({
  servicemanId,
  bookingId,
  title,
  entryType = 'note',
  status = 'open',
  summary = null,
  occurredAt = null,
  attachments = [],
  meta = {},
  actorId
}) {
  const assignment = await ensureAssignment(servicemanId, bookingId);
  if (!assignment) {
    const error = new Error('booking_assignment_not_found');
    error.statusCode = 404;
    throw error;
  }

  const resolvedType = HISTORY_TYPES.has(entryType) ? entryType : 'note';
  const resolvedStatus = HISTORY_STATUSES.has(status) ? status : 'open';
  const occurred = occurredAt ? new Date(occurredAt) : new Date();
  if (Number.isNaN(occurred.getTime())) {
    const error = new Error('invalid_occurred_at');
    error.statusCode = 400;
    throw error;
  }

  const entry = await BookingHistoryEntry.create({
    bookingId,
    title: sanitiseString(title) || 'Timeline update',
    entryType: resolvedType,
    status: resolvedStatus,
    summary: sanitiseNullableString(summary),
    actorId: actorId ?? servicemanId,
    actorRole: HISTORY_ACTOR_ROLE,
    occurredAt: occurred,
    attachments: normaliseAttachments(attachments),
    meta: meta && typeof meta === 'object' ? meta : {}
  });

  return entry.get({ plain: true });
}

export default {
  getServicemanBookingWorkspace,
  updateServicemanBookingSettings,
  updateServicemanBookingStatus,
  updateServicemanBookingSchedule,
  updateServicemanBookingDetails,
  createServicemanBookingNote,
  createServicemanTimelineEntry
};
