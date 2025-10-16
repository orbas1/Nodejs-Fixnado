import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  fetchServicemanWebsitePreferences,
  saveServicemanWebsitePreferences
} from '../controllers/servicemanWebsitePreferencesController.js';

const router = Router();

router.get(
  '/website-preferences',
  authenticate,
  enforcePolicy('serviceman.website.read', {
    metadata: () => ({ section: 'serviceman-website-preferences', action: 'read' })
  }),
  fetchServicemanWebsitePreferences
);

router.put(
  '/website-preferences',
  authenticate,
  enforcePolicy('serviceman.website.write', {
    metadata: () => ({ section: 'serviceman-website-preferences', action: 'write' })
  }),
  saveServicemanWebsitePreferences
);

export default router;
