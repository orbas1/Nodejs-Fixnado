import { body, param, query, validationResult } from 'express-validator';
import {
  getProviderStorefrontWorkspace,
  upsertProviderStorefrontSettings,
  createStorefrontInventoryItem,
  updateStorefrontInventoryItem,
  archiveStorefrontInventoryItem,
  createStorefrontCoupon,
  updateStorefrontCoupon,
  updateStorefrontCouponStatus
} from '../services/providerStorefrontManagementService.js';

function handleValidation(req, res) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(400).json({ message: 'validation_failed', errors: result.array() });
    return false;
  }
  return true;
}

export const validateStorefrontWorkspace = [query('companyId').optional().isUUID()];

export async function getStorefrontWorkspaceHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await getProviderStorefrontWorkspace({ companyId: req.query.companyId, actor: req.user });
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateStorefrontSettings = [
  query('companyId').optional().isUUID(),
  body('name').optional().isString().isLength({ min: 2, max: 160 }),
  body('slug').optional().isString().isLength({ min: 3, max: 160 }),
  body('tagline').optional().isString().isLength({ max: 200 }),
  body('description').optional().isString(),
  body('heroImageUrl').optional().isURL(),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString().isLength({ max: 40 }),
  body('primaryColor').optional().isString().isLength({ max: 16 }),
  body('accentColor').optional().isString().isLength({ max: 16 }),
  body('status').optional().isIn(['draft', 'live', 'archived']),
  body('isPublished').optional().isBoolean(),
  body('reviewRequired').optional().isBoolean()
];

export async function updateStorefrontSettingsHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await upsertProviderStorefrontSettings({
      companyId: req.query.companyId,
      actor: req.user,
      payload: req.body || {}
    });
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateCreateInventory = [
  query('companyId').optional().isUUID(),
  body('sku').isString().isLength({ min: 1, max: 64 }),
  body('name').isString().isLength({ min: 2, max: 160 }),
  body('summary').optional().isString().isLength({ max: 240 }),
  body('description').optional().isString(),
  body('priceAmount').optional().isFloat({ min: 0 }),
  body('priceCurrency').optional().isString().isLength({ min: 3, max: 3 }),
  body('stockOnHand').optional().isInt({ min: 0 }),
  body('reorderPoint').optional().isInt({ min: 0 }),
  body('restockAt').optional().isISO8601(),
  body('visibility').optional().isIn(['public', 'private', 'archived']),
  body('featured').optional().isBoolean(),
  body('imageUrl').optional().isString()
];

export async function createInventoryItemHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await createStorefrontInventoryItem({
      companyId: req.query.companyId,
      actor: req.user,
      payload: req.body || {}
    });
    res.status(201).json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateUpdateInventory = [
  query('companyId').optional().isUUID(),
  param('inventoryId').isUUID(),
  body('sku').optional().isString().isLength({ min: 1, max: 64 }),
  body('name').optional().isString().isLength({ min: 2, max: 160 }),
  body('summary').optional().isString().isLength({ max: 240 }),
  body('description').optional().isString(),
  body('priceAmount').optional().isFloat({ min: 0 }),
  body('priceCurrency').optional().isString().isLength({ min: 3, max: 3 }),
  body('stockOnHand').optional().isInt({ min: 0 }),
  body('reorderPoint').optional().isInt({ min: 0 }),
  body('restockAt').optional().isISO8601(),
  body('visibility').optional().isIn(['public', 'private', 'archived']),
  body('featured').optional().isBoolean(),
  body('imageUrl').optional().isString()
];

export async function updateInventoryItemHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await updateStorefrontInventoryItem({
      companyId: req.query.companyId,
      actor: req.user,
      inventoryId: req.params.inventoryId,
      payload: req.body || {}
    });
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateArchiveInventory = [query('companyId').optional().isUUID(), param('inventoryId').isUUID()];

export async function archiveInventoryItemHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await archiveStorefrontInventoryItem({
      companyId: req.query.companyId,
      actor: req.user,
      inventoryId: req.params.inventoryId
    });
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateCreateCoupon = [
  query('companyId').optional().isUUID(),
  body('code').isString().isLength({ min: 2, max: 40 }),
  body('name').isString().isLength({ min: 2, max: 160 }),
  body('description').optional().isString(),
  body('discountType').optional().isIn(['percentage', 'fixed']),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('minOrderTotal').optional().isFloat({ min: 0 }),
  body('maxDiscountValue').optional().isFloat({ min: 0 }),
  body('startsAt').optional().isISO8601(),
  body('endsAt').optional().isISO8601(),
  body('usageLimit').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['draft', 'scheduled', 'active', 'expired', 'disabled']),
  body('appliesTo').optional().isString()
];

export async function createCouponHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await createStorefrontCoupon({
      companyId: req.query.companyId,
      actor: req.user,
      payload: req.body || {}
    });
    res.status(201).json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateUpdateCoupon = [
  query('companyId').optional().isUUID(),
  param('couponId').isUUID(),
  body('code').optional().isString().isLength({ min: 2, max: 40 }),
  body('name').optional().isString().isLength({ min: 2, max: 160 }),
  body('description').optional().isString(),
  body('discountType').optional().isIn(['percentage', 'fixed']),
  body('discountValue').optional().isFloat({ min: 0 }),
  body('minOrderTotal').optional().isFloat({ min: 0 }),
  body('maxDiscountValue').optional().isFloat({ min: 0 }),
  body('startsAt').optional().isISO8601(),
  body('endsAt').optional().isISO8601(),
  body('usageLimit').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['draft', 'scheduled', 'active', 'expired', 'disabled']),
  body('appliesTo').optional().isString()
];

export async function updateCouponHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await updateStorefrontCoupon({
      companyId: req.query.companyId,
      actor: req.user,
      couponId: req.params.couponId,
      payload: req.body || {}
    });
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const validateUpdateCouponStatus = [
  query('companyId').optional().isUUID(),
  param('couponId').isUUID(),
  body('status').isIn(['draft', 'scheduled', 'active', 'expired', 'disabled'])
];

export async function updateCouponStatusHandler(req, res, next) {
  if (!handleValidation(req, res)) {
    return;
  }

  try {
    const payload = await updateStorefrontCouponStatus({
      companyId: req.query.companyId,
      actor: req.user,
      couponId: req.params.couponId,
      status: req.body.status
    });
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}
