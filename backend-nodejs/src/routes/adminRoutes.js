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

router.get('/dashboard', authenticate, authorize(['admin']), dashboard);
router.get('/feature-toggles', authenticate, authorize(['admin']), getToggles);
router.get('/feature-toggles/:key', authenticate, authorize(['admin']), getToggle);
router.patch(
  '/feature-toggles/:key',
  authenticate,
  authorize(['admin']),
  upsertToggleValidators,
  updateToggle
);

router.get('/platform-settings', authenticate, authorize(['admin']), fetchPlatformSettings);
router.put('/platform-settings', authenticate, authorize(['admin']), savePlatformSettings);

export default router;
