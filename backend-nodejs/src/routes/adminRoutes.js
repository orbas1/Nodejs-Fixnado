import { Router } from 'express';
import { dashboard } from '../controllers/adminController.js';
import {
  getToggle,
  getToggles,
  updateToggle,
  upsertToggleValidators
} from '../controllers/featureToggleController.js';
import {
  fetchPlatformSettings,
  savePlatformSettings
} from '../controllers/platformSettingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, authorize(['company']), dashboard);
router.get('/feature-toggles', authenticate, authorize(['company']), getToggles);
router.get('/feature-toggles/:key', authenticate, authorize(['company']), getToggle);
router.patch(
  '/feature-toggles/:key',
  authenticate,
  authorize(['company']),
  upsertToggleValidators,
  updateToggle
);

router.get('/platform-settings', authenticate, authorize(['company']), fetchPlatformSettings);
router.put('/platform-settings', authenticate, authorize(['company']), savePlatformSettings);

export default router;
