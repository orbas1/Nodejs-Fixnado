import {
  listToolSales,
  createToolSale,
  updateToolSale,
  deleteToolSale,
  createToolSaleCoupon,
  updateToolSaleCoupon,
  deleteToolSaleCoupon
} from '../services/toolSalesService.js';

export async function listToolSalesHandler(req, res, next) {
  try {
    const result = await listToolSales({ companyId: req.query.companyId, actor: req.user });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function createToolSaleHandler(req, res, next) {
  try {
    const listing = await createToolSale(req.body ?? {}, { companyId: req.body?.companyId ?? req.query.companyId, actor: req.user });
    res.status(201).json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function updateToolSaleHandler(req, res, next) {
  try {
    const listing = await updateToolSale(req.params.profileId, req.body ?? {}, {
      companyId: req.body?.companyId ?? req.query.companyId,
      actor: req.user
    });
    res.json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function deleteToolSaleHandler(req, res, next) {
  try {
    await deleteToolSale(req.params.profileId, {
      companyId: req.body?.companyId ?? req.query.companyId,
      actor: req.user
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function createToolSaleCouponHandler(req, res, next) {
  try {
    const listing = await createToolSaleCoupon(req.params.profileId, req.body ?? {}, {
      companyId: req.body?.companyId ?? req.query.companyId,
      actor: req.user
    });
    res.status(201).json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function updateToolSaleCouponHandler(req, res, next) {
  try {
    const listing = await updateToolSaleCoupon(req.params.profileId, req.params.couponId, req.body ?? {}, {
      companyId: req.body?.companyId ?? req.query.companyId,
      actor: req.user
    });
    res.json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function deleteToolSaleCouponHandler(req, res, next) {
  try {
    const listing = await deleteToolSaleCoupon(req.params.profileId, req.params.couponId, {
      companyId: req.body?.companyId ?? req.query.companyId,
      actor: req.user
    });
    res.json({ data: listing });
  } catch (error) {
    next(error);
  }
}
