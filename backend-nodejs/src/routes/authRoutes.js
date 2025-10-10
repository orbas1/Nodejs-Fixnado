import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, profile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 120 })
      .withMessage('First name must be 120 characters or fewer'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 120 })
      .withMessage('Last name must be 120 characters or fewer'),
    body('email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('A valid email address is required'),
    body('password')
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })
      .withMessage(
        'Password must be at least 12 characters and include upper, lower, number, and symbol characters'
      ),
    body('type')
      .isIn(['user', 'company', 'servicemen'])
      .withMessage('Account type must be user, company, or servicemen'),
    body('age')
      .optional({ nullable: true })
      .isInt({ min: 16, max: 120 })
      .withMessage('Age must be a number between 16 and 120'),
    body('company')
      .if(body('type').equals('company'))
      .custom((value) => {
        if (!value || typeof value !== 'object') {
          throw new Error('Company details are required for company accounts');
        }
        const requiredFields = ['legalStructure', 'contactName'];
        const missing = requiredFields.filter(
          (field) => !value[field] || `${value[field]}`.trim().length === 0
        );
        if (missing.length) {
          throw new Error(`Company details missing: ${missing.join(', ')}`);
        }
        if (
          value.contactEmail &&
          !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.contactEmail.trim())
        ) {
          throw new Error('Company contactEmail must be a valid email address');
        }
        if (
          value.serviceRegions &&
          !(
            typeof value.serviceRegions === 'string' ||
            Array.isArray(value.serviceRegions)
          )
        ) {
          throw new Error('Company serviceRegions must be a string or array of strings');
        }
        return true;
      })
  ],
  register
);

router.post(
  '/login',
  [
    body('email')
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('A valid email address is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);
router.get('/me', authenticate, profile);

export default router;
