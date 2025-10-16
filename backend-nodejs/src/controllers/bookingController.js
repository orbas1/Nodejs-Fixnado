import { validationResult } from 'express-validator';
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
  getBookingById,
  updateBooking,
  listBookingNotes,
  createBookingNote,
  updateBookingNote,
  deleteBookingNote,
  listBookingAssignments,
  updateBookingAssignment,
  removeBookingAssignment
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

export async function updateBookingHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const booking = await updateBooking(req.params.bookingId, req.body);
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

export async function listBookingNotesHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const notes = await listBookingNotes(req.params.bookingId);
    res.json(notes);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createBookingNoteHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const note = await createBookingNote(req.params.bookingId, req.body);
    res.status(201).json(note);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateBookingNoteHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const note = await updateBookingNote(req.params.bookingId, req.params.noteId, req.body);
    res.json(note);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteBookingNoteHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    await deleteBookingNote(req.params.bookingId, req.params.noteId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listBookingAssignmentsHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const assignments = await listBookingAssignments(req.params.bookingId);
    res.json(assignments);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateBookingAssignmentHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const assignment = await updateBookingAssignment(
      req.params.bookingId,
      req.params.assignmentId,
      req.body,
      req.body.actorId
    );
    res.json(assignment);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteBookingAssignmentHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    await removeBookingAssignment(req.params.bookingId, req.params.assignmentId, req.query.actorId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
