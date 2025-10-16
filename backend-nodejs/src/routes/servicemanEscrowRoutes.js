import { Router } from 'express';
import {
  listServicemanEscrowsHandler,
  getServicemanEscrowHandler,
  updateServicemanEscrowHandler,
  addServicemanEscrowNoteHandler,
  deleteServicemanEscrowNoteHandler,
  upsertServicemanEscrowMilestoneHandler,
  deleteServicemanEscrowMilestoneHandler,
  createServicemanWorkLogHandler,
  updateServicemanWorkLogHandler,
  deleteServicemanWorkLogHandler
} from '../controllers/servicemanEscrowController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/escrows', enforcePolicy('serviceman.escrows.view'), listServicemanEscrowsHandler);
router.get('/escrows/:id', enforcePolicy('serviceman.escrows.view'), getServicemanEscrowHandler);
router.patch('/escrows/:id', enforcePolicy('serviceman.escrows.manage'), updateServicemanEscrowHandler);

router.post('/escrows/:id/notes', enforcePolicy('serviceman.escrows.manage'), addServicemanEscrowNoteHandler);
router.delete(
  '/escrows/:id/notes/:noteId',
  enforcePolicy('serviceman.escrows.manage'),
  deleteServicemanEscrowNoteHandler
);

router.post('/escrows/:id/milestones', enforcePolicy('serviceman.escrows.manage'), upsertServicemanEscrowMilestoneHandler);
router.patch(
  '/escrows/:id/milestones/:milestoneId',
  enforcePolicy('serviceman.escrows.manage'),
  upsertServicemanEscrowMilestoneHandler
);
router.delete(
  '/escrows/:id/milestones/:milestoneId',
  enforcePolicy('serviceman.escrows.manage'),
  deleteServicemanEscrowMilestoneHandler
);

router.post('/escrows/:id/work-logs', enforcePolicy('serviceman.escrows.manage'), createServicemanWorkLogHandler);
router.patch(
  '/escrows/:id/work-logs/:workLogId',
  enforcePolicy('serviceman.escrows.manage'),
  updateServicemanWorkLogHandler
);
router.delete(
  '/escrows/:id/work-logs/:workLogId',
  enforcePolicy('serviceman.escrows.manage'),
  deleteServicemanWorkLogHandler
);

export default router;
