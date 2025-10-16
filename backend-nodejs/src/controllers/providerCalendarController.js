import { validationResult } from 'express-validator';
import {
  getProviderCalendar,
  upsertProviderCalendarSettings,
  createProviderCalendarEvent,
  updateProviderCalendarEvent,
  deleteProviderCalendarEvent,
  updateProviderBookingSchedule,
  createProviderBooking
} from '../services/providerCalendarService.js';

function respondWithError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

export async function getProviderCalendarHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { data, meta } = await getProviderCalendar({
      companyId: req.query.companyId,
      start: req.query.start,
      end: req.query.end,
      timezone: req.query.timezone
    });
    return res.json({ data, meta });
  } catch (error) {
    return respondWithError(res, next, error);
  }
}

export async function updateProviderCalendarSettingsHandler(req, res, next) {
  try {
    const settings = await upsertProviderCalendarSettings({
      companyId: req.body.companyId || req.query.companyId,
      payload: req.body
    });
    return res.json({ settings });
  } catch (error) {
    return respondWithError(res, next, error);
  }
}

export async function createProviderCalendarEventHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const event = await createProviderCalendarEvent({
      companyId: req.body.companyId || req.query.companyId,
      payload: req.body,
      actor: req.auth?.actor || req.user
    });
    return res.status(201).json({ event });
  } catch (error) {
    return respondWithError(res, next, error);
  }
}

export async function updateProviderCalendarEventHandler(req, res, next) {
  try {
    const event = await updateProviderCalendarEvent({
      companyId: req.body.companyId || req.query.companyId,
      eventId: req.params.eventId,
      payload: req.body,
      actor: req.auth?.actor || req.user
    });
    return res.json({ event });
  } catch (error) {
    return respondWithError(res, next, error);
  }
}

export async function deleteProviderCalendarEventHandler(req, res, next) {
  try {
    await deleteProviderCalendarEvent({
      companyId: req.query.companyId,
      eventId: req.params.eventId
    });
    return res.status(204).end();
  } catch (error) {
    return respondWithError(res, next, error);
  }
}

export async function updateProviderCalendarBookingHandler(req, res, next) {
  try {
    const booking = await updateProviderBookingSchedule({
      companyId: req.body.companyId || req.query.companyId,
      bookingId: req.params.bookingId,
      payload: req.body,
      actor: req.auth?.actor || req.user
    });
    return res.json({ booking });
  } catch (error) {
    return respondWithError(res, next, error);
  }
}

export async function createProviderCalendarBookingHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const booking = await createProviderBooking({
      companyId: req.body.companyId || req.query.companyId,
      payload: req.body,
      actor: req.auth?.actor || req.user
    });
    return res.status(201).json({ booking });
  } catch (error) {
    return respondWithError(res, next, error);
  }
}
