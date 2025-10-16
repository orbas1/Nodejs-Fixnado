import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  fetchUserProfileSettings,
  saveUserProfileSettings
} from '../controllers/userProfileController.js';

const router = Router();

router.get('/profile', authenticate, fetchUserProfileSettings);
router.put('/profile', authenticate, saveUserProfileSettings);
router.patch('/profile', authenticate, saveUserProfileSettings);

export default router;
