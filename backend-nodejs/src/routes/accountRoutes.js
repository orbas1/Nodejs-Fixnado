import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createNotificationRecipientHandler,
  deleteNotificationRecipientHandler,
  getAccountSettingsHandler,
  updateAccountPreferencesHandler,
  updateAccountProfileHandler,
  updateAccountSecurityHandler,
  updateNotificationRecipientHandler
} from '../controllers/accountSettingsController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

const profileValidators = [
  body('firstName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('lastName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('email').optional().isString().trim().isEmail().isLength({ max: 320 }),
  body('phoneNumber').optional().isString().trim().isLength({ min: 7, max: 32 }),
  body('profileImageUrl').optional().isURL({ require_protocol: true })
];

const preferenceValidators = [
  body('timezone').optional().isString().trim().isLength({ min: 2, max: 120 }),
  body('locale').optional().isString().trim().isLength({ min: 2, max: 24 }),
  body('defaultCurrency').optional().isString().trim().isLength({ min: 3, max: 12 }),
  body('weeklySummaryEnabled').optional().isBoolean(),
  body('dispatchAlertsEnabled').optional().isBoolean(),
  body('escrowAlertsEnabled').optional().isBoolean(),
  body('conciergeAlertsEnabled').optional().isBoolean(),
  body('quietHoursStart').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('quietHoursEnd').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/)
];

const securityValidators = [
  body('twoFactorApp').optional().isBoolean(),
  body('twoFactorEmail').optional().isBoolean()
];

const recipientValidators = [
  body('label').isString().trim().isLength({ min: 1, max: 120 }),
  body('channel').isString().trim().isLength({ min: 2, max: 32 }),
  body('role').optional().isString().trim().isLength({ min: 2, max: 32 }),
  body('target').isString().trim().isLength({ min: 3, max: 320 }),
  body('enabled').optional().isBoolean()
];

const recipientIdParam = [param('recipientId').isUUID(4)];

router.use(
  authenticate,
  enforcePolicy('account.settings.manage', {
    metadata: (req) => ({ userId: req.user?.id ?? null })
  })
);

router.get('/settings', getAccountSettingsHandler);
router.put('/settings/profile', profileValidators, updateAccountProfileHandler);
router.put('/settings/preferences', preferenceValidators, updateAccountPreferencesHandler);
router.put('/settings/security', securityValidators, updateAccountSecurityHandler);
router.post('/settings/recipients', recipientValidators, createNotificationRecipientHandler);
router.patch(
  '/settings/recipients/:recipientId',
  [...recipientIdParam, ...recipientValidators.map((validator) => validator.optional())],
  updateNotificationRecipientHandler
);
router.delete('/settings/recipients/:recipientId', recipientIdParam, deleteNotificationRecipientHandler);

export default router;
