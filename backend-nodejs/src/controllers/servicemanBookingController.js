import { validationResult } from 'express-validator';
import {
  getServicemanBookingWorkspace,
  updateServicemanBookingSettings,
  updateServicemanBookingStatus,
  updateServicemanBookingSchedule,
  updateServicemanBookingDetails,
  createServicemanBookingNote,
  createServicemanTimelineEntry
} from '../services/servicemanBookingService.js';

function resolveServicemanId(req) {
  return req.user?.id || req.params.servicemanId || req.body?.servicemanId || req.query?.servicemanId || null;
}

function handleValidation(req, res) {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    res.status(422).json({ message: 'Validation failed', errors: validation.array() });
    return false;
  }
  return true;
}

export async function getWorkspaceHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }

    const servicemanId = resolveServicemanId(req);
    const timezone = req.query?.timezone || 'UTC';

    const workspace = await getServicemanBookingWorkspace({ servicemanId, timezone });
    res.json({ workspace });
  } catch (error) {
    next(error);
  }
}

export async function updateSettingsHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }

    const servicemanId = resolveServicemanId(req);
    const settings = await updateServicemanBookingSettings(servicemanId, req.body ?? {}, req.user?.id ?? null);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updateStatusHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }

    const servicemanId = resolveServicemanId(req);
    const { status, reason } = req.body ?? {};
    const booking = await updateServicemanBookingStatus({
      servicemanId,
      bookingId: req.params.bookingId,
      status,
      reason,
      actorId: req.user?.id ?? servicemanId
    });
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function updateScheduleHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }

    const servicemanId = resolveServicemanId(req);
    const booking = await updateServicemanBookingSchedule({
      servicemanId,
      bookingId: req.params.bookingId,
      schedule: req.body ?? {},
      actorId: req.user?.id ?? servicemanId
    });
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function updateDetailsHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }

    const servicemanId = resolveServicemanId(req);
    const booking = await updateServicemanBookingDetails({
      servicemanId,
      bookingId: req.params.bookingId,
      updates: req.body ?? {},
      actorId: req.user?.id ?? servicemanId
    });
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function createNoteHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }

    const servicemanId = resolveServicemanId(req);
    const note = await createServicemanBookingNote({
      servicemanId,
      bookingId: req.params.bookingId,
      body: req.body?.body,
      attachments: req.body?.attachments ?? [],
      actorId: req.user?.id ?? servicemanId
    });
    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
}

export async function createTimelineEntryHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }

    const servicemanId = resolveServicemanId(req);
    const entry = await createServicemanTimelineEntry({
      servicemanId,
      bookingId: req.params.bookingId,
      title: req.body?.title,
      entryType: req.body?.entryType,
      status: req.body?.status,
      summary: req.body?.summary,
      occurredAt: req.body?.occurredAt,
      attachments: req.body?.attachments ?? [],
      meta: req.body?.meta ?? {},
      actorId: req.user?.id ?? servicemanId
    });
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
}

export default {
  getWorkspaceHandler,
  updateSettingsHandler,
  updateStatusHandler,
  updateScheduleHandler,
  updateDetailsHandler,
  createNoteHandler,
  createTimelineEntryHandler
};
