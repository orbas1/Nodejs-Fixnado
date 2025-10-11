import { Router } from 'express';
import {
  addRentalCheckpoint,
  approveRental,
  cancelRental,
  checkoutRental,
  completeInspection,
  getRental,
  listRentals,
  markReturned,
  requestRental,
  schedulePickup
} from '../controllers/rentalController.js';

const router = Router();

router.post('/', requestRental);
router.get('/', listRentals);
router.get('/:rentalId', getRental);
router.post('/:rentalId/approve', approveRental);
router.post('/:rentalId/schedule-pickup', schedulePickup);
router.post('/:rentalId/checkout', checkoutRental);
router.post('/:rentalId/return', markReturned);
router.post('/:rentalId/inspection', completeInspection);
router.post('/:rentalId/cancel', cancelRental);
router.post('/:rentalId/checkpoints', addRentalCheckpoint);

export default router;
