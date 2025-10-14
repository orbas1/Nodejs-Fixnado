import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, profile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('type').isIn(['user', 'company', 'servicemen'])
  ],
  register
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty(), body('securityToken').optional().isString()],
  login
);
router.get('/me', authenticate, profile);

export default router;
