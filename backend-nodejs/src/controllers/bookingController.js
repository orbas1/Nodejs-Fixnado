import {
  createBooking,
  updateBookingStatus,
  assignProviders,
  recordAssignmentResponse,
  submitBid,
  updateBidStatus,
  addBidComment,
  triggerDispute,
  listBookings,
  getBookingById
} from '../services/bookingService.js';

function handleServiceError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return next(error);
}

export async function createBookingHandler(req, res, next) {
  try {
    const booking = await createBooking(req.body);
    res.status(201).json(booking);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listBookingsHandler(req, res, next) {
  try {
    const bookings = await listBookings(req.query || {});
    res.json(bookings);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getBookingHandler(req, res, next) {
  try {
    const booking = await getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    return res.json(booking);
  } catch (error) {
    return handleServiceError(res, next, error);
  }
}

export async function updateBookingStatusHandler(req, res, next) {
  try {
    const booking = await updateBookingStatus(req.params.bookingId, req.body.status, {
      actorId: req.body.actorId,
      reason: req.body.reason
    });
    res.json(booking);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function assignProvidersHandler(req, res, next) {
  try {
    const assignments = await assignProviders(req.params.bookingId, req.body.assignments, req.body.actorId);
    res.status(201).json(assignments);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function recordAssignmentResponseHandler(req, res, next) {
  try {
    const result = await recordAssignmentResponse({
      bookingId: req.params.bookingId,
      providerId: req.body.providerId,
      status: req.body.status
    });
    res.json(result);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function submitBidHandler(req, res, next) {
  try {
    const bid = await submitBid({
      bookingId: req.params.bookingId,
      providerId: req.body.providerId,
      amount: req.body.amount,
      currency: req.body.currency,
      message: req.body.message
    });
    res.status(201).json(bid);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateBidStatusHandler(req, res, next) {
  try {
    const bid = await updateBidStatus({
      bookingId: req.params.bookingId,
      bidId: req.params.bidId,
      status: req.body.status,
      actorId: req.body.actorId
    });
    res.json(bid);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function addBidCommentHandler(req, res, next) {
  try {
    const comment = await addBidComment({
      bookingId: req.params.bookingId,
      bidId: req.params.bidId,
      authorId: req.body.authorId,
      authorType: req.body.authorType,
      body: req.body.body
    });
    res.status(201).json(comment);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function triggerDisputeHandler(req, res, next) {
  try {
    const booking = await triggerDispute({
      bookingId: req.params.bookingId,
      reason: req.body.reason,
      actorId: req.body.actorId
    });
    res.json(booking);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
