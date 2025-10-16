import {
  listPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  recordPurchaseReceipt,
  addPurchaseAttachment,
  removePurchaseAttachment,
  listSuppliers,
  upsertSupplier,
  updateSupplierStatus,
  listPurchaseBudgets,
  upsertPurchaseBudget
} from '../services/purchaseManagementService.js';

export async function listPurchaseOrdersHandler(req, res, next) {
  try {
    const { total, orders } = await listPurchaseOrders(req.query ?? {});
    res.json({ data: orders, meta: { total } });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrderHandler(req, res, next) {
  try {
    const order = await getPurchaseOrderById(req.params.orderId);
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
}

export async function createPurchaseOrderHandler(req, res, next) {
  try {
    const order = await createPurchaseOrder({ actorId: req.user?.id, payload: req.body });
    res.status(201).json({ data: order });
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseOrderHandler(req, res, next) {
  try {
    const order = await updatePurchaseOrder({ orderId: req.params.orderId, payload: req.body, actorId: req.user?.id });
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseOrderStatusHandler(req, res, next) {
  try {
    const order = await updatePurchaseOrderStatus({
      orderId: req.params.orderId,
      nextStatus: req.body?.status,
      actorId: req.user?.id
    });
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
}

export async function recordPurchaseReceiptHandler(req, res, next) {
  try {
    const order = await recordPurchaseReceipt({
      orderId: req.params.orderId,
      items: req.body?.items ?? [],
      note: req.body?.note,
      actorId: req.user?.id
    });
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
}

export async function addPurchaseAttachmentHandler(req, res, next) {
  try {
    const attachment = await addPurchaseAttachment({
      orderId: req.params.orderId,
      payload: req.body,
      actorId: req.user?.id
    });
    res.status(201).json({ data: attachment });
  } catch (error) {
    next(error);
  }
}

export async function deletePurchaseAttachmentHandler(req, res, next) {
  try {
    const attachment = await removePurchaseAttachment({
      orderId: req.params.orderId,
      attachmentId: req.params.attachmentId
    });
    res.json({ data: attachment });
  } catch (error) {
    next(error);
  }
}

export async function listSuppliersHandler(req, res, next) {
  try {
    const suppliers = await listSuppliers(req.query ?? {});
    res.json({ data: suppliers });
  } catch (error) {
    next(error);
  }
}

export async function upsertSupplierHandler(req, res, next) {
  try {
    const supplier = await upsertSupplier({ supplierId: req.params.supplierId ?? null, payload: req.body, actorId: req.user?.id });
    res.json({ data: supplier });
  } catch (error) {
    next(error);
  }
}

export async function updateSupplierStatusHandler(req, res, next) {
  try {
    const supplier = await updateSupplierStatus({ supplierId: req.params.supplierId, status: req.body?.status });
    res.json({ data: supplier });
  } catch (error) {
    next(error);
  }
}

export async function listPurchaseBudgetsHandler(req, res, next) {
  try {
    const budgets = await listPurchaseBudgets(req.query ?? {});
    res.json({ data: budgets });
  } catch (error) {
    next(error);
  }
}

export async function upsertPurchaseBudgetHandler(req, res, next) {
  try {
    const budget = await upsertPurchaseBudget({
      budgetId: req.params.budgetId ?? null,
      payload: req.body,
      actorId: req.user?.id
    });
    const statusCode = req.method === 'POST' && !req.params.budgetId ? 201 : 200;
    res.status(statusCode).json({ data: budget });
  } catch (error) {
    next(error);
  }
}

export default {
  listPurchaseOrdersHandler,
  getPurchaseOrderHandler,
  createPurchaseOrderHandler,
  updatePurchaseOrderHandler,
  updatePurchaseOrderStatusHandler,
  recordPurchaseReceiptHandler,
  addPurchaseAttachmentHandler,
  deletePurchaseAttachmentHandler,
  listSuppliersHandler,
  upsertSupplierHandler,
  updateSupplierStatusHandler,
  listPurchaseBudgetsHandler,
  upsertPurchaseBudgetHandler
};
