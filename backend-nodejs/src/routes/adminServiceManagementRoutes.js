import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  listListings,
  createListing,
  updateListing,
  updateListingStatus,
  archiveListing,
  getServiceSnapshot
} from '../controllers/adminServiceManagementController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.get(
  '/categories',
  authenticate,
  enforcePolicy('admin.services.read', { metadata: () => ({ entity: 'categories' }) }),
  listCategories
);

router.post(
  '/categories',
  authenticate,
  enforcePolicy('admin.services.write', { metadata: () => ({ entity: 'categories' }) }),
  [
    body('name').isString().isLength({ min: 3 }),
    body('slug').optional().isString().isLength({ min: 3 }),
    body('description').optional().isString(),
    body('icon').optional().isString(),
    body('accentColour').optional().isString(),
    body('parentId').optional({ nullable: true }).isUUID(),
    body('ordering').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    body('metadata').optional().isObject()
  ],
  createCategory
);

router.put(
  '/categories/:categoryId',
  authenticate,
  enforcePolicy('admin.services.write', { metadata: (req) => ({ entity: 'categories', categoryId: req.params.categoryId }) }),
  [
    param('categoryId').isUUID().withMessage('categoryId must be a valid UUID'),
    body('name').optional().isString().isLength({ min: 3 }),
    body('slug').optional().isString().isLength({ min: 3 }),
    body('description').optional().isString(),
    body('icon').optional().isString(),
    body('accentColour').optional().isString(),
    body('ordering').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    body('parentId').optional({ nullable: true }).isUUID(),
    body('metadata').optional().isObject()
  ],
  updateCategory
);

router.delete(
  '/categories/:categoryId',
  authenticate,
  enforcePolicy('admin.services.write', { metadata: (req) => ({ entity: 'categories', categoryId: req.params.categoryId }) }),
  [param('categoryId').isUUID().withMessage('categoryId must be a valid UUID')],
  archiveCategory
);

router.get(
  '/listings',
  authenticate,
  enforcePolicy('admin.services.read', { metadata: () => ({ entity: 'listings' }) }),
  listListings
);

const companyOrProviderRequired = body().custom((value, { req }) => {
  if (!req.body.companyId && !req.body.providerId) {
    throw new Error('companyId or providerId is required to create a listing');
  }
  return true;
});

router.post(
  '/listings',
  authenticate,
  enforcePolicy('admin.services.write', { metadata: () => ({ entity: 'listings' }) }),
  [
    body('title').isString().isLength({ min: 3 }),
    body('description').optional().isString(),
    body('price').isFloat({ gt: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('status').optional().isString(),
    body('visibility').optional().isString(),
    body('kind').optional().isString(),
    body('slug').optional().isString().isLength({ min: 3 }),
    body('companyId').optional().isUUID(),
    body('providerId').optional().isUUID(),
    body('categoryId').optional().isUUID(),
    body('gallery').optional().isArray(),
    body('coverage').optional().isArray(),
    body('tags').optional().isArray(),
    body('metadata').optional().isObject(),
    companyOrProviderRequired
  ],
  createListing
);

router.put(
  '/listings/:serviceId',
  authenticate,
  enforcePolicy('admin.services.write', { metadata: (req) => ({ entity: 'listings', serviceId: req.params.serviceId }) }),
  [
    param('serviceId').isUUID().withMessage('serviceId must be a valid UUID'),
    body('title').optional().isString().isLength({ min: 3 }),
    body('description').optional().isString(),
    body('price').optional().isFloat({ gt: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('status').optional().isString(),
    body('visibility').optional().isString(),
    body('kind').optional().isString(),
    body('slug').optional().isString().isLength({ min: 3 }),
    body('heroImageUrl').optional().isString(),
    body('gallery').optional().isArray(),
    body('coverage').optional().isArray(),
    body('tags').optional().isArray(),
    body('metadata').optional().isObject(),
    body('categoryId').optional({ nullable: true }).isUUID().withMessage('categoryId must be a valid UUID')
  ],
  updateListing
);

router.patch(
  '/listings/:serviceId/status',
  authenticate,
  enforcePolicy('admin.services.write', { metadata: (req) => ({ entity: 'listings', serviceId: req.params.serviceId }) }),
  [
    param('serviceId').isUUID().withMessage('serviceId must be a valid UUID'),
    body('status').isString().isLength({ min: 3 })
  ],
  updateListingStatus
);

router.delete(
  '/listings/:serviceId',
  authenticate,
  enforcePolicy('admin.services.write', { metadata: (req) => ({ entity: 'listings', serviceId: req.params.serviceId }) }),
  [param('serviceId').isUUID().withMessage('serviceId must be a valid UUID')],
  archiveListing
);

router.get(
  '/summary',
  authenticate,
  enforcePolicy('admin.services.read', { metadata: () => ({ entity: 'summary' }) }),
  getServiceSnapshot
);

export default router;
