import { Router } from 'express';
import { body, query } from 'express-validator';
import { submitConsent, latestConsent, consentHistory } from '../controllers/consentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAnyPermission } from '../middleware/permissions.js';

const router = Router();

router.post(
  '/',
  [
    body('consentType').isString().isLength({ min: 2, max: 64 }),
    body('consentVersion').isString().isLength({ min: 1, max: 32 }),
    body('granted').isBoolean(),
    body('metadata').optional().isObject()
  ],
  submitConsent
);

const CONSENT_PERMISSIONS = ['consent.view.self', 'consent.audit.org', 'consent.audit.global'];

router.get(
  '/latest',
  [authenticate, requireAnyPermission(CONSENT_PERMISSIONS), query('type').isString().notEmpty()],
  latestConsent
);

router.get(
  '/history',
  [authenticate, requireAnyPermission(CONSENT_PERMISSIONS), query('limit').optional().isInt({ min: 1, max: 200 })],
  consentHistory
);

export default router;
