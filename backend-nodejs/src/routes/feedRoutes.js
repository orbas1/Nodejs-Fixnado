import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getLiveFeed,
  getMarketplaceFeed,
  createLiveFeedPostHandler,
  submitCustomJobBidHandler,
  addCustomJobBidMessageHandler
} from '../controllers/feedController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/live', authenticate, authorize(['servicemen', 'company', 'user']), getLiveFeed);

router.post(
  '/live',
  authenticate,
  authorize(['user', 'company']),
  [
    body('title').isString().trim().isLength({ min: 5, max: 160 }),
    body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 4000 }),
    body('budgetLabel').optional({ checkFalsy: true }).isString().trim().isLength({ max: 160 }),
    body('budgetAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('budgetCurrency')
      .optional({ checkFalsy: true })
      .isString()
      .matches(/^[A-Za-z]{3}$/),
    body('category').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('categoryOther').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
    body('metadata').optional().isObject(),
    body('images')
      .optional()
      .isArray()
      .bail()
      .custom((images) => images.length <= 6)
      .withMessage('A maximum of 6 images is allowed'),
    body('images.*').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('location').optional({ checkFalsy: true }).isString().trim().isLength({ max: 240 }),
    body('zoneId').optional({ checkFalsy: true }).isUUID(),
    body('allowOutOfZone').optional().isBoolean(),
    body('bidDeadline').optional({ checkFalsy: true }).isISO8601()
  ],
  createLiveFeedPostHandler
);

router.post(
  '/live/:postId/bids',
  authenticate,
  authorize(['servicemen', 'company']),
  [
    param('postId').isUUID(),
    body('amount').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
    body('currency')
      .optional({ checkFalsy: true })
      .isString()
      .matches(/^[A-Za-z]{3}$/),
    body('message').optional({ checkFalsy: true }).isString().trim().isLength({ max: 2000 }),
    body('attachments').optional().isArray({ max: 5 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  submitCustomJobBidHandler
);

router.post(
  '/live/:postId/bids/:bidId/messages',
  authenticate,
  authorize(['servicemen', 'company', 'user']),
  [
    param('postId').isUUID(),
    param('bidId').isUUID(),
    body('body').isString().trim().isLength({ min: 1, max: 2000 }),
    body('attachments').optional().isArray({ max: 5 }),
    body('attachments.*.url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('attachments.*.label').optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 })
  ],
  addCustomJobBidMessageHandler
);

router.get('/marketplace', getMarketplaceFeed);

export default router;
