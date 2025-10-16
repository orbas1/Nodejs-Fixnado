import { validationResult } from 'express-validator';
import { getBookingCalendar } from '../services/bookingCalendarService.js';

export async function getBookingCalendarHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = await getBookingCalendar({
      customerId: req.query.customerId || null,
      companyId: req.query.companyId || null,
      month: req.query.month || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      timezone: req.query.timezone || null,
      status: req.query.status || [],
      zoneId: req.query.zoneId || null
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export default { getBookingCalendarHandler };
