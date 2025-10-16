import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';
import {
  getMarketplaceOverview,
  createTool,
  updateTool,
  removeTool,
  createMaterial,
  updateMaterial,
  removeMaterial
} from '../controllers/adminMarketplaceController.js';

const router = Router();

const managePolicy = enforcePolicy('admin.marketplace.manage', {
  metadata: (req) => ({ method: req.method, path: req.path })
});

router.use(authenticate, managePolicy);

const optionalUuid = (field) => query(field).optional().isUUID(4);
const optionalLimit = query('limit').optional().isInt({ min: 1, max: 200 });

router.get('/overview', [optionalUuid('companyId'), optionalLimit], getMarketplaceOverview);

const tagsValidator = body('tags')
  .optional()
  .custom((value) => {
    if (Array.isArray(value)) {
      return value.every((entry) => typeof entry === 'string' || typeof entry === 'number');
    }
    return typeof value === 'string';
  });

const sharedValidators = [
  body('companyId').optional().isUUID(4),
  body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('sku').optional().isString().trim().isLength({ min: 1, max: 64 }),
  body('category').optional().isString().trim().isLength({ min: 1, max: 64 }),
  body('unitType').optional().isString().trim().isLength({ min: 1, max: 32 }),
  body('quantityOnHand').optional().isInt({ min: 0 }),
  body('quantityReserved').optional().isInt({ min: 0 }),
  body('safetyStock').optional().isInt({ min: 0 }),
  body('rentalRate').optional().isFloat({ min: 0 }),
  body('depositAmount').optional().isFloat({ min: 0 }),
  body('replacementCost').optional().isFloat({ min: 0 }),
  body('insuranceRequired').optional().isBoolean(),
  body('conditionRating')
    .optional()
    .isIn(['new', 'excellent', 'good', 'fair', 'needs_service']),
  body('imageUrl').optional().isURL(),
  body('datasheetUrl').optional().isURL(),
  body('notes').optional().isString().isLength({ max: 2000 }),
  tagsValidator
];

router.post(
  '/tools',
  [
    body('companyId').isUUID(4),
    body('name').isString().trim().isLength({ min: 1, max: 120 }),
    body('sku').isString().trim().isLength({ min: 1, max: 64 }),
    ...sharedValidators
  ],
  createTool
);

router.patch('/tools/:itemId', [param('itemId').isUUID(4), ...sharedValidators], updateTool);
router.delete('/tools/:itemId', [param('itemId').isUUID(4)], removeTool);

router.post(
  '/materials',
  [
    body('companyId').isUUID(4),
    body('name').isString().trim().isLength({ min: 1, max: 160 }),
    body('sku').isString().trim().isLength({ min: 1, max: 64 }),
    ...sharedValidators
  ],
  createMaterial
);

router.patch('/materials/:itemId', [param('itemId').isUUID(4), ...sharedValidators], updateMaterial);
router.delete('/materials/:itemId', [param('itemId').isUUID(4)], removeMaterial);

export default router;
