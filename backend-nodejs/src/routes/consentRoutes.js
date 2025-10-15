import { Router } from 'express';
import {
  listConsentRequirements,
  submitConsentDecision,
  verifyConsentStatus
} from '../controllers/consentController.js';
import { maybeAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/requirements', maybeAuthenticate, listConsentRequirements);
router.post('/events', maybeAuthenticate, submitConsentDecision);
router.post('/verify', maybeAuthenticate, verifyConsentStatus);

export default router;
