import {
  fetchBookingManagementOverview,
  fetchBookingSettings,
  updateBookingSettings,
  createAdminBooking,
  loadAdminBooking,
  transitionBookingStatus,
  rescheduleAdminBooking,
  updateAdminBookingMeta,
  applyTemplateToBooking
} from '../services/adminBookingService.js';
import {
  listBookingTemplates,
  createBookingTemplate,
  updateBookingTemplate,
  archiveBookingTemplate,
  getBookingTemplateById
} from '../services/bookingTemplateService.js';

function actorIdFromRequest(req) {
  return req.user?.id || null;
}

export async function bookingOverview(req, res, next) {
  try {
    const payload = await fetchBookingManagementOverview({
      timeframe: req.query.timeframe,
      timezone: req.query.timezone,
      limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : 20,
      offset: req.query.offset ? Number.parseInt(req.query.offset, 10) : 0,
      status: req.query.status || undefined,
      type: req.query.type || undefined,
      demandLevel: req.query.demandLevel || undefined,
      search: req.query.search || undefined,
      companyId: req.query.companyId || undefined,
      zoneId: req.query.zoneId || undefined
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function getBookingSettings(req, res, next) {
  try {
    const settings = await fetchBookingSettings();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function saveBookingSettings(req, res, next) {
  try {
    const settings = await updateBookingSettings(req.body || {}, actorIdFromRequest(req));
    res.json({ settings });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(error.statusCode || 422).json({
        message: error.message,
        details: error.details || []
      });
    }
    next(error);
  }
}

export async function createBookingHandler(req, res, next) {
  try {
    const booking = await createAdminBooking(req.body || {}, actorIdFromRequest(req));
    res.status(201).json(booking.get({ plain: true }));
  } catch (error) {
    next(error);
  }
}

export async function getBookingHandler(req, res, next) {
  try {
    const booking = await loadAdminBooking(req.params.bookingId);
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatusHandler(req, res, next) {
  try {
    const booking = await transitionBookingStatus(
      req.params.bookingId,
      req.body?.status,
      actorIdFromRequest(req),
      req.body?.reason
    );
    res.json(booking.get({ plain: true }));
  } catch (error) {
    next(error);
  }
}

export async function updateBookingScheduleHandler(req, res, next) {
  try {
    const booking = await rescheduleAdminBooking(req.params.bookingId, req.body || {}, actorIdFromRequest(req));
    res.json(booking.get({ plain: true }));
  } catch (error) {
    next(error);
  }
}

export async function updateBookingMetaHandler(req, res, next) {
  try {
    const booking = await updateAdminBookingMeta(req.params.bookingId, req.body || {}, actorIdFromRequest(req));
    res.json(booking.get({ plain: true }));
  } catch (error) {
    next(error);
  }
}

export async function applyTemplateHandler(req, res, next) {
  try {
    const booking = await applyTemplateToBooking(req.params.bookingId, req.body?.templateId, actorIdFromRequest(req));
    res.json(booking.get({ plain: true }));
  } catch (error) {
    next(error);
  }
}

export async function listTemplatesHandler(req, res, next) {
  try {
    const templates = await listBookingTemplates({ includeRetired: req.query.includeRetired === 'true' });
    res.json({ templates });
  } catch (error) {
    next(error);
  }
}

export async function createTemplateHandler(req, res, next) {
  try {
    const template = await createBookingTemplate(req.body || {}, actorIdFromRequest(req));
    res.status(201).json({ template });
  } catch (error) {
    next(error);
  }
}

export async function updateTemplateHandler(req, res, next) {
  try {
    const template = await updateBookingTemplate(req.params.templateId, req.body || {}, actorIdFromRequest(req));
    res.json({ template });
  } catch (error) {
    next(error);
  }
}

export async function archiveTemplateHandler(req, res, next) {
  try {
    const template = await archiveBookingTemplate(req.params.templateId, actorIdFromRequest(req));
    res.json({ template });
  } catch (error) {
    next(error);
  }
}

export async function getTemplateHandler(req, res, next) {
  try {
    const template = await getBookingTemplateById(req.params.templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json({ template });
  } catch (error) {
    next(error);
  }
}
