import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  getServicemanIdentity,
  updateServicemanIdentity,
  createServicemanIdentityDocument,
  updateServicemanIdentityDocument,
  deleteServicemanIdentityDocument,
  createServicemanIdentityCheck,
  updateServicemanIdentityCheck,
  deleteServicemanIdentityCheck,
  addServicemanIdentityWatcher,
  updateServicemanIdentityWatcher,
  removeServicemanIdentityWatcher,
  createServicemanIdentityEvent
} from '../controllers/servicemanIdentityController.js';

const router = Router({ mergeParams: true });

router.use(
  '/:servicemanId/identity',
  authenticate,
  enforcePolicy('servicemen.identity.manage', {
    metadata: (req) => ({
      servicemanId: req.params.servicemanId,
      method: req.method,
      path: req.originalUrl
    })
  })
);

router.get('/:servicemanId/identity', getServicemanIdentity);
router.put('/:servicemanId/identity', updateServicemanIdentity);

router.post('/:servicemanId/identity/documents', createServicemanIdentityDocument);
router.put('/:servicemanId/identity/documents/:documentId', updateServicemanIdentityDocument);
router.delete('/:servicemanId/identity/documents/:documentId', deleteServicemanIdentityDocument);

router.post('/:servicemanId/identity/checks', createServicemanIdentityCheck);
router.put('/:servicemanId/identity/checks/:checkId', updateServicemanIdentityCheck);
router.delete('/:servicemanId/identity/checks/:checkId', deleteServicemanIdentityCheck);

router.post('/:servicemanId/identity/watchers', addServicemanIdentityWatcher);
router.put('/:servicemanId/identity/watchers/:watcherId', updateServicemanIdentityWatcher);
router.delete('/:servicemanId/identity/watchers/:watcherId', removeServicemanIdentityWatcher);

router.post('/:servicemanId/identity/events', createServicemanIdentityEvent);

export default router;
