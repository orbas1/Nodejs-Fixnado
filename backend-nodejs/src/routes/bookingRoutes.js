import { Router } from 'express';
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
  listBookingHistoryHandler,
  createBookingHistoryEntryHandler,
  updateBookingHistoryEntryHandler,
  deleteBookingHistoryEntryHandler
} from '../controllers/bookingController.js';

const router = Router();

router.post('/', createBookingHandler);
router.get('/', listBookingsHandler);
router.get('/:bookingId', getBookingHandler);
router.patch('/:bookingId/status', updateBookingStatusHandler);
router.post('/:bookingId/assignments', assignProvidersHandler);
router.post('/:bookingId/assignments/response', recordAssignmentResponseHandler);
router.post('/:bookingId/bids', submitBidHandler);
router.patch('/:bookingId/bids/:bidId/status', updateBidStatusHandler);
router.post('/:bookingId/bids/:bidId/comments', addBidCommentHandler);
router.post('/:bookingId/disputes', triggerDisputeHandler);
router.get('/:bookingId/history', listBookingHistoryHandler);
router.post('/:bookingId/history', createBookingHistoryEntryHandler);
router.patch('/:bookingId/history/:entryId', updateBookingHistoryEntryHandler);
router.delete('/:bookingId/history/:entryId', deleteBookingHistoryEntryHandler);

export default router;
