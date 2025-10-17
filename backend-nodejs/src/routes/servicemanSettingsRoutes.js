import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  getServicemanProfileSettingsHandler,
  updateServicemanProfileSettingsHandler
} from '../controllers/servicemanSettingsController.js';

const router = Router();

router.use(
  authenticate,
  enforcePolicy('serviceman.profile.manage', {
    metadata: (req) => ({ userId: req.user?.id ?? null })
  })
);

router.get('/profile', getServicemanProfileSettingsHandler);
router.put('/profile', updateServicemanProfileSettingsHandler);

export default router;
