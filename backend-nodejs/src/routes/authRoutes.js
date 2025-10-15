import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, profile, refresh, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('type').isIn(['user', 'company', 'servicemen', 'provider_admin', 'operations_admin'])
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
    body('securityToken').optional().isString(),
    body('rememberMe').optional().isBoolean(),
    body('clientType').optional().isString().isLength({ min: 2, max: 40 }),
    body('deviceLabel').optional().isString().isLength({ min: 2, max: 120 }),
    body('clientVersion').optional().isString().isLength({ min: 1, max: 40 })
  ],
  login
);
router.get('/me', authenticate, profile);
router.post('/session/refresh', [body('refreshToken').optional().isString()], refresh);
router.post('/logout', authenticate, logout);

export default router;
