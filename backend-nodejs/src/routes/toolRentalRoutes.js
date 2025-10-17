import { Router } from 'express';
import {
  listAssets,
  createAsset,
  getAsset,
  updateAsset,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAvailability
} from '../controllers/toolRentalController.js';
import { authenticate } from '../middleware/auth.js';
import { enforcePolicy } from '../middleware/policyMiddleware.js';

const router = Router();

router.use(
  authenticate,
  enforcePolicy('inventory.manage', {
    metadata: (req) => ({
      method: req.method,
      path: req.path,
      persona: req.headers['x-fixnado-persona'] || null
    })
  })
);

router.get('/assets', listAssets);
router.post('/assets', createAsset);
router.get('/assets/:assetId', getAsset);
router.patch('/assets/:assetId', updateAsset);
router.get('/assets/:assetId/availability', getAvailability);
router.post('/assets/:assetId/pricing', createPricingTier);
router.patch('/assets/:assetId/pricing/:pricingId', updatePricingTier);
router.delete('/assets/:assetId/pricing/:pricingId', deletePricingTier);

router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:couponId', updateCoupon);
router.delete('/coupons/:couponId', deleteCoupon);

export default router;
