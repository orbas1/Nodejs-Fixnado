import { Router } from 'express';
import {
  getOverview,
  createProfileHandler,
  updateProfileHandler,
  deleteProfileHandler,
  createShiftHandler,
  updateShiftHandler,
  deleteShiftHandler,
  createCertificationHandler,
  updateCertificationHandler,
  deleteCertificationHandler
} from '../controllers/servicemanManagementController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();
const policy = enforcePolicy('admin.servicemen.manage', {
  metadata: (req) => ({
    companyId: req.query.companyId || req.body?.companyId || null,
    method: req.method
  })
});

router.get('/', authenticate, policy, getOverview);
router.post('/', authenticate, policy, createProfileHandler);
router.put('/:profileId', authenticate, policy, updateProfileHandler);
router.delete('/:profileId', authenticate, policy, deleteProfileHandler);

router.post('/:profileId/shifts', authenticate, policy, createShiftHandler);
router.put('/:profileId/shifts/:shiftId', authenticate, policy, updateShiftHandler);
router.delete('/:profileId/shifts/:shiftId', authenticate, policy, deleteShiftHandler);

router.post('/:profileId/certifications', authenticate, policy, createCertificationHandler);
router.put('/:profileId/certifications/:certificationId', authenticate, policy, updateCertificationHandler);
router.delete('/:profileId/certifications/:certificationId', authenticate, policy, deleteCertificationHandler);

export default router;
