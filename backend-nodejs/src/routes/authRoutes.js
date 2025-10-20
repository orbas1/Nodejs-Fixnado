import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, profile, refresh, logout, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

function normaliseBooleanInput(value) {
  if (value === undefined) {
    return { defined: false, value: undefined };
  }

  if (typeof value === 'boolean') {
    return { defined: true, value };
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return { defined: true, value: null };
    }
    if (value === 1) {
      return { defined: true, value: true };
    }
    if (value === 0) {
      return { defined: true, value: false };
    }
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === '') {
      return { defined: true, value: null };
    }
    if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
      return { defined: true, value: true };
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
      return { defined: true, value: false };
    }
  }

  return { defined: true, value: null };
}

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
    body('rememberMe').custom((value, { req }) => {
      const { defined, value: parsed } = normaliseBooleanInput(value);
      if (!defined) {
        return true;
      }

      if (parsed === null) {
        throw new Error('rememberMe must be a boolean value');
      }

      req.body.rememberMe = parsed;
      return true;
    }),
    body('clientType').optional().isString().isLength({ min: 2, max: 40 }),
    body('deviceLabel').optional().isString().isLength({ min: 2, max: 120 }),
    body('clientVersion').optional().isString().isLength({ min: 1, max: 40 })
  ],
  login
);
router.get('/me', authenticate, profile);
router.put('/me', authenticate, updateProfile);
router.post('/session/refresh', [body('refreshToken').optional().isString()], refresh);
router.post('/logout', authenticate, logout);

export default router;
