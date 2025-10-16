import { Router } from 'express';
import {
  addAdminRentalCheckpoint,
  approveAdminRental,
  cancelAdminRental,
  checkoutAdminRental,
  createAdminRental,
  getAdminRental,
  inspectAdminRental,
  listAdminRentals,
  markAdminRentalReturned,
  updateAdminRental,
  scheduleAdminRentalPickup
} from '../controllers/adminRentalController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', enforcePolicy('admin.rentals.read'), listAdminRentals);
router.post('/', enforcePolicy('admin.rentals.write'), createAdminRental);
router.get('/:rentalId', enforcePolicy('admin.rentals.read'), getAdminRental);
router.patch('/:rentalId', enforcePolicy('admin.rentals.write'), updateAdminRental);
router.post('/:rentalId/approve', enforcePolicy('admin.rentals.write'), approveAdminRental);
router.post('/:rentalId/schedule-pickup', enforcePolicy('admin.rentals.write'), scheduleAdminRentalPickup);
router.post('/:rentalId/checkout', enforcePolicy('admin.rentals.write'), checkoutAdminRental);
router.post('/:rentalId/return', enforcePolicy('admin.rentals.write'), markAdminRentalReturned);
router.post('/:rentalId/inspection', enforcePolicy('admin.rentals.write'), inspectAdminRental);
router.post('/:rentalId/cancel', enforcePolicy('admin.rentals.write'), cancelAdminRental);
router.post('/:rentalId/checkpoints', enforcePolicy('admin.rentals.write'), addAdminRentalCheckpoint);

export default router;
