import {
  listToolRentalAssets,
  getToolRentalAsset,
  createToolRentalAsset,
  updateToolRentalAsset,
  createToolRentalPricingTier,
  updateToolRentalPricingTier,
  deleteToolRentalPricingTier,
  listToolRentalCoupons,
  createToolRentalCoupon,
  updateToolRentalCoupon,
  deleteToolRentalCoupon,
  getToolRentalAvailability
} from '../services/toolRentalService.js';

function resolveCompanyId(req) {
  return req.user?.companyId || req.query?.companyId || req.body?.companyId || null;
}

function handleError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ code: error.code, message: error.message });
  }
  return next(error);
}

export async function listAssets(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const assets = await listToolRentalAssets({ companyId });
    res.json({ assets, meta: { total: assets.length } });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function createAsset(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const asset = await createToolRentalAsset({ companyId, payload: req.body || {} });
    res.status(201).json({ asset });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function getAsset(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const asset = await getToolRentalAsset({ companyId, assetId: req.params.assetId });
    res.json({ asset });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function updateAsset(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const asset = await updateToolRentalAsset({
      companyId,
      assetId: req.params.assetId,
      payload: req.body || {}
    });
    res.json({ asset });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function createPricingTier(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const tier = await createToolRentalPricingTier({
      companyId,
      assetId: req.params.assetId,
      payload: req.body || {}
    });
    res.status(201).json({ tier });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function updatePricingTier(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const tier = await updateToolRentalPricingTier({
      companyId,
      assetId: req.params.assetId,
      pricingId: req.params.pricingId,
      payload: req.body || {}
    });
    res.json({ tier });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function deletePricingTier(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    await deleteToolRentalPricingTier({
      companyId,
      assetId: req.params.assetId,
      pricingId: req.params.pricingId
    });
    res.status(204).send();
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function listCoupons(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const coupons = await listToolRentalCoupons({ companyId });
    res.json({ coupons, meta: { total: coupons.length } });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const coupon = await createToolRentalCoupon({ companyId, payload: req.body || {} });
    res.status(201).json({ coupon });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const coupon = await updateToolRentalCoupon({
      companyId,
      couponId: req.params.couponId,
      payload: req.body || {}
    });
    res.json({ coupon });
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    await deleteToolRentalCoupon({ companyId, couponId: req.params.couponId });
    res.status(204).send();
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function getAvailability(req, res, next) {
  try {
    const companyId = resolveCompanyId(req);
    const availability = await getToolRentalAvailability({
      companyId,
      assetId: req.params.assetId,
      from: req.query?.from,
      to: req.query?.to
    });
    res.json({ availability });
  } catch (error) {
    handleError(res, next, error);
  }
}
