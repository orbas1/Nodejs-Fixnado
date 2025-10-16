import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createBookingHandler,
  listBookingsHandler,
  getBookingHandler,
  updateBookingStatusHandler,
  assignProvidersHandler,
  recordAssignmentResponseHandler,
  submitBidHandler,
  updateBidStatusHandler,
  addBidCommentHandler,
  triggerDisputeHandler,
  updateBookingHandler,
  listBookingNotesHandler,
  createBookingNoteHandler,
  updateBookingNoteHandler,
  deleteBookingNoteHandler,
  listBookingAssignmentsHandler,
  updateBookingAssignmentHandler,
  deleteBookingAssignmentHandler
} from '../controllers/bookingController.js';
import { getBookingCalendarHandler } from '../controllers/bookingCalendarController.js';

const router = Router();

const BOOKING_STATUSES = [
  'pending',
  'awaiting_assignment',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
];

const attachmentValidators = () => [
  body('attachments').optional().isArray({ max: 10 }),
  body('attachments.*.url').optional().isURL({ require_protocol: true }),
  body('attachments.*.label').optional().isString().isLength({ max: 160 }),
  body('attachments.*.type').optional().isString().isLength({ max: 32 })
];

const updateBookingValidators = [
  param('bookingId').isUUID(4),
  body('title').optional().isString().isLength({ max: 160 }),
  body('location').optional().isString().isLength({ max: 255 }),
  body('instructions').optional().isString(),
  body('status').optional().isIn(BOOKING_STATUSES),
  body('scheduledStart').optional().isISO8601(),
  body('scheduledEnd').optional().isISO8601(),
  body('demandLevel').optional().isIn(['low', 'medium', 'high']),
  body('metadata').optional().isObject(),
  body('actorId').optional().isUUID(4),
  body('statusReason').optional().isString().isLength({ max: 512 }),
  ...attachmentValidators()
];

const bookingNoteValidators = [
  param('bookingId').isUUID(4),
  body('body').isString().isLength({ min: 1 }),
  body('authorId').optional().isUUID(4),
  body('authorType').optional().isString().isLength({ max: 32 }),
  body('isPinned').optional().isBoolean(),
  ...attachmentValidators()
];

const bookingNoteUpdateValidators = [
  param('bookingId').isUUID(4),
  param('noteId').isUUID(4),
  body('body').optional().isString().isLength({ min: 1 }),
  body('authorType').optional().isString().isLength({ max: 32 }),
  body('isPinned').optional().isBoolean(),
  ...attachmentValidators()
];

const bookingNoteDeleteValidators = [param('bookingId').isUUID(4), param('noteId').isUUID(4)];

const bookingNoteListValidators = [param('bookingId').isUUID(4)];

const bookingAssignmentListValidators = [param('bookingId').isUUID(4)];

const bookingAssignmentUpdateValidators = [
  param('bookingId').isUUID(4),
  param('assignmentId').isUUID(4),
  body('role').optional().isIn(['lead', 'support']),
  body('status').optional().isIn(['pending', 'accepted', 'declined', 'withdrawn']),
  body('actorId').optional().isUUID(4)
];

const bookingAssignmentDeleteValidators = [
  param('bookingId').isUUID(4),
  param('assignmentId').isUUID(4),
  query('actorId').optional().isUUID(4)
];

const calendarValidators = [
  query('customerId').optional().isUUID(4),
  query('companyId').optional().isUUID(4),
  query('month').optional().matches(/^\d{4}-\d{2}$/),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('timezone').optional().isString().isLength({ min: 2, max: 64 }),
  query('status').optional().isString(),
  query('zoneId').optional().isUUID(4)
];

router.post('/', createBookingHandler);
router.get('/', listBookingsHandler);
router.get('/calendar', calendarValidators, getBookingCalendarHandler);
router.get('/:bookingId', getBookingHandler);
router.patch('/:bookingId', updateBookingValidators, updateBookingHandler);
router.patch('/:bookingId/status', updateBookingStatusHandler);
router.get('/:bookingId/notes', bookingNoteListValidators, listBookingNotesHandler);
router.post('/:bookingId/notes', bookingNoteValidators, createBookingNoteHandler);
router.patch('/:bookingId/notes/:noteId', bookingNoteUpdateValidators, updateBookingNoteHandler);
router.delete('/:bookingId/notes/:noteId', bookingNoteDeleteValidators, deleteBookingNoteHandler);
router.get('/:bookingId/assignments', bookingAssignmentListValidators, listBookingAssignmentsHandler);
router.post('/:bookingId/assignments', assignProvidersHandler);
router.patch(
  '/:bookingId/assignments/:assignmentId',
  bookingAssignmentUpdateValidators,
  updateBookingAssignmentHandler
);
router.delete(
  '/:bookingId/assignments/:assignmentId',
  bookingAssignmentDeleteValidators,
  deleteBookingAssignmentHandler
);
router.post('/:bookingId/assignments/response', recordAssignmentResponseHandler);
router.post('/:bookingId/bids', submitBidHandler);
router.patch('/:bookingId/bids/:bidId/status', updateBidStatusHandler);
router.post('/:bookingId/bids/:bidId/comments', addBidCommentHandler);
router.post('/:bookingId/disputes', triggerDisputeHandler);

export default router;
