import { Op, fn, col } from 'sequelize';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseAttachment,
  Supplier,
  PurchaseBudget,
  sequelize
} from '../models/index.js';

const ORDER_STATUSES = [
  'draft',
  'awaiting_approval',
  'approved',
  'sent',
  'partial',
  'received',
  'closed',
  'cancelled'
];

const STATUS_TRANSITIONS = new Map([
  ['draft', new Set(['awaiting_approval', 'approved', 'sent', 'cancelled'])],
  ['awaiting_approval', new Set(['approved', 'sent', 'draft', 'cancelled'])],
  ['approved', new Set(['sent', 'cancelled'])],
  ['sent', new Set(['partial', 'received', 'cancelled'])],
  ['partial', new Set(['received', 'cancelled'])],
  ['received', new Set(['closed'])],
  ['closed', new Set()],
  ['cancelled', new Set(['draft'])]
]);

const TERMINAL_STATUSES = new Set(['closed', 'cancelled']);

function purchaseError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseCurrency(value) {
  if (!value) return 'GBP';
  return String(value).trim().toUpperCase().slice(0, 3) || 'GBP';
}

function coerceDate(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function roundCurrency(value) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
}

function mapDecimal(value) {
  if (value == null) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapInteger(value) {
  if (value == null) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateBudgetRollupFromOrder(order) {
  if (!order) {
    return { committed: 0, spent: 0 };
  }

  const total = mapDecimal(order.total);
  const items = Array.isArray(order.items) ? order.items : [];

  const rawSpent = items.reduce((acc, item) => {
    const receivedQuantity = mapDecimal(item.receivedQuantity ?? item.received_quantity ?? 0);
    const unitCost = mapDecimal(item.unitCost ?? item.unit_cost ?? 0);
    const taxRate = mapDecimal(item.taxRate ?? item.tax_rate ?? 0);
    if (receivedQuantity <= 0 || unitCost <= 0) {
      return acc;
    }
    const line = receivedQuantity * unitCost;
    const tax = line * (taxRate / 100);
    return acc + line + tax;
  }, 0);

  const spent = Math.min(roundCurrency(rawSpent), total);
  const shouldCommit =
    Boolean(order.status) && !TERMINAL_STATUSES.has(order.status) && order.status !== 'draft';
  const committed = shouldCommit ? Math.max(roundCurrency(total - spent), 0) : 0;

  return { committed, spent };
}

async function recalculateBudgets(budgetIds, { transaction } = {}) {
  const uniqueIds = [...new Set((budgetIds ?? []).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return;
  }

  const orders = await PurchaseOrder.findAll({
    where: { budgetId: uniqueIds },
    include: [{ model: PurchaseOrderItem, as: 'items' }],
    transaction
  });

  const totalsByBudget = new Map();
  for (const order of orders) {
    const { committed, spent } = calculateBudgetRollupFromOrder(order);
    const entry = totalsByBudget.get(order.budgetId) ?? { committed: 0, spent: 0 };
    entry.committed += committed;
    entry.spent += spent;
    totalsByBudget.set(order.budgetId, entry);
  }

  await Promise.all(
    uniqueIds.map(async (budgetId) => {
      const budget = await PurchaseBudget.findByPk(budgetId, {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined
      });
      if (!budget) {
        throw purchaseError('Budget not found', 404);
      }
      const totals = totalsByBudget.get(budgetId) ?? { committed: 0, spent: 0 };
      await budget.update(
        {
          committed: roundCurrency(totals.committed),
          spent: roundCurrency(totals.spent)
        },
        { transaction }
      );
    })
  );
}

function mapOrderInstance(order) {
  if (!order) return null;
  const plain = order.toJSON();
  const budgetImpact = calculateBudgetRollupFromOrder(plain);
  return {
    ...plain,
    budgetId: plain.budgetId ?? null,
    budget: plain.budget
      ? {
          id: plain.budget.id,
          category: plain.budget.category,
          fiscalYear: plain.budget.fiscalYear,
          currency: plain.budget.currency
        }
      : null,
    budgetImpact,
    subtotal: mapDecimal(plain.subtotal),
    taxTotal: mapDecimal(plain.taxTotal),
    total: mapDecimal(plain.total),
    approvalRequired: Boolean(plain.approvalRequired),
    items: Array.isArray(plain.items)
      ? plain.items.map((item) => ({
          ...item,
          quantity: mapInteger(item.quantity),
          receivedQuantity: mapInteger(item.receivedQuantity),
          unitCost: mapDecimal(item.unitCost),
          taxRate: mapDecimal(item.taxRate),
          lineTotal: mapDecimal(item.lineTotal)
        }))
      : [],
    attachments: Array.isArray(plain.attachments)
      ? plain.attachments.map((attachment) => ({
          ...attachment
        }))
      : []
  };
}

function normaliseItems(items, currency) {
  if (!Array.isArray(items) || items.length === 0) {
    throw purchaseError('At least one line item is required');
  }

  let subtotal = 0;
  let taxTotal = 0;

  const normalised = items.map((item, index) => {
    const itemName = String(item.itemName ?? item.name ?? '').trim();
    if (!itemName) {
      throw purchaseError(`Line ${index + 1}: itemName is required`);
    }

    const quantity = mapInteger(item.quantity ?? 1);
    if (quantity <= 0) {
      throw purchaseError(`Line ${index + 1}: quantity must be greater than zero`);
    }

    const unitCost = mapDecimal(item.unitCost ?? item.price ?? 0);
    if (unitCost < 0) {
      throw purchaseError(`Line ${index + 1}: unit cost cannot be negative`);
    }

    const taxRate = mapDecimal(item.taxRate ?? item.taxRatePercent ?? 0);
    if (taxRate < 0) {
      throw purchaseError(`Line ${index + 1}: tax rate cannot be negative`);
    }

    const lineSubtotal = quantity * unitCost;
    const lineTax = roundCurrency((lineSubtotal * taxRate) / 100);
    const lineTotal = roundCurrency(lineSubtotal + lineTax);

    subtotal += roundCurrency(lineSubtotal);
    taxTotal += lineTax;

    const record = {
      lineNumber: Number.isFinite(item.lineNumber) ? item.lineNumber : index + 1,
      itemName,
      description: item.description ? String(item.description).trim() : null,
      sku: item.sku ? String(item.sku).trim() : null,
      quantity,
      unitCost: roundCurrency(unitCost),
      taxRate: roundCurrency(taxRate),
      lineTotal,
      currency: normaliseCurrency(item.currency ?? currency),
      expectedAt: coerceDate(item.expectedAt),
      receivedQuantity: Math.min(mapInteger(item.receivedQuantity ?? 0), quantity),
      status: item.status && ['open', 'backordered', 'received', 'cancelled'].includes(item.status)
        ? item.status
        : 'open',
      imageUrl: item.imageUrl ? String(item.imageUrl).trim() : null
    };

    if (item.id) {
      record.id = String(item.id);
    }
    if (item.purchaseOrderId) {
      record.purchaseOrderId = String(item.purchaseOrderId);
    }

    return record;
  });

  subtotal = roundCurrency(subtotal);
  taxTotal = roundCurrency(taxTotal);

  return {
    items: normalised,
    subtotal,
    taxTotal,
    total: roundCurrency(subtotal + taxTotal)
  };
}

function ensureEditable(order) {
  if (!order) {
    throw purchaseError('Purchase order not found', 404);
  }
  if (TERMINAL_STATUSES.has(order.status)) {
    throw purchaseError(`Purchase order is ${order.status} and cannot be modified`, 409);
  }
}

function applyStatusTimestamp(order, nextStatus) {
  const now = new Date();
  switch (nextStatus) {
    case 'awaiting_approval':
    case 'sent':
      if (!order.submittedAt) order.submittedAt = now;
      break;
    case 'approved':
      order.approvedAt = now;
      break;
    case 'partial':
      if (!order.receivedAt) order.receivedAt = now;
      break;
    case 'received':
      order.receivedAt = now;
      break;
    case 'closed':
      order.closedAt = now;
      break;
    case 'cancelled':
      order.cancelledAt = now;
      break;
    case 'draft':
      if (order.status === 'cancelled') {
        order.cancelledAt = null;
      }
      break;
    default:
      break;
  }
}

function buildSearchPredicate(fields, term) {
  if (!term) return null;
  const value = `%${term.trim().toLowerCase()}%`;
  if (!value || value === '%%') return null;
  return {
    [Op.or]: fields.map((field) =>
      sequelize.where(fn('lower', col(field)), {
        [Op.like]: value
      })
    )
  };
}

export async function listPurchaseOrders({
  status = 'all',
  supplierId = null,
  search = '',
  limit = 25,
  offset = 0
} = {}) {
  const where = {};
  if (status && status !== 'all') {
    if (!ORDER_STATUSES.includes(status)) {
      throw purchaseError(`Unsupported status filter: ${status}`);
    }
    where.status = status;
  }
  if (supplierId) {
    where.supplierId = supplierId;
  }

  const searchPredicate = buildSearchPredicate(['PurchaseOrder.reference', 'PurchaseOrder.supplier_name'], search);
  if (searchPredicate) {
    Object.assign(where, searchPredicate);
  }

  const pageSize = Math.max(1, Math.min(Number(limit) || 25, 100));
  const pageOffset = Math.max(0, Number(offset) || 0);

  const [rows, total] = await Promise.all([
    PurchaseOrder.findAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'status'] },
        {
          model: PurchaseOrderItem,
          as: 'items',
          attributes: ['id', 'quantity', 'receivedQuantity', 'unitCost', 'taxRate']
        },
        { model: PurchaseBudget, as: 'budget', attributes: ['id', 'category', 'fiscalYear', 'currency'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: pageOffset
    }),
    PurchaseOrder.count({ where })
  ]);

  const orders = rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    supplier:
      row.supplier && row.supplier.id
        ? { id: row.supplier.id, name: row.supplier.name, status: row.supplier.status }
        : null,
    currency: row.currency,
    subtotal: mapDecimal(row.subtotal),
    taxTotal: mapDecimal(row.taxTotal),
    total: mapDecimal(row.total),
    expectedAt: row.expectedAt,
    createdAt: row.createdAt,
    approvalRequired: Boolean(row.approvalRequired),
    itemCount: Array.isArray(row.items) ? row.items.length : 0,
    budgetId: row.budgetId ?? null,
    budget: row.budget
      ? {
          id: row.budget.id,
          category: row.budget.category,
          fiscalYear: row.budget.fiscalYear,
          currency: row.budget.currency
        }
      : null,
    budgetImpact: calculateBudgetRollupFromOrder(row)
  }));

  return { total, orders };
}

export async function getPurchaseOrderById(orderId) {
  if (!orderId) {
    throw purchaseError('orderId is required');
  }

  const order = await PurchaseOrder.findByPk(orderId, {
    include: [
      { model: PurchaseOrderItem, as: 'items' },
      { model: PurchaseAttachment, as: 'attachments' },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'status'] },
      { model: PurchaseBudget, as: 'budget', attributes: ['id', 'category', 'fiscalYear', 'currency'] }
    ],
    order: [
      [{ model: PurchaseOrderItem, as: 'items' }, 'line_number', 'ASC'],
      [{ model: PurchaseAttachment, as: 'attachments' }, 'created_at', 'DESC']
    ]
  });

  if (!order) {
    throw purchaseError('Purchase order not found', 404);
  }

  return mapOrderInstance(order);
}

function resolveSupplierName({ supplierId, supplierName, supplier }) {
  if (supplier) {
    return supplier.name;
  }
  if (supplierName) {
    return String(supplierName).trim();
  }
  if (supplierId) {
    throw purchaseError('Supplier not found', 404);
  }
  throw purchaseError('Supplier name is required');
}

function generateReference(base) {
  const trimmed = base ? String(base).trim() : '';
  if (trimmed) {
    return trimmed;
  }
  const now = new Date();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PO-${now.getFullYear()}-${random}`;
}

export async function createPurchaseOrder({ actorId, payload }) {
  if (!actorId) {
    throw purchaseError('actorId is required to create purchase orders', 401);
  }
  const body = payload ?? {};

  const currency = normaliseCurrency(body.currency);
  const { items, subtotal, taxTotal, total } = normaliseItems(body.items, currency);

  try {
    const created = await sequelize.transaction(async (transaction) => {
      const supplier = body.supplierId
        ? await Supplier.findByPk(body.supplierId, { transaction })
        : null;
      const supplierName = resolveSupplierName({
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        supplier
      });

      let budgetId = null;
      if (body.budgetId) {
        const candidate = String(body.budgetId).trim();
        const budget = await PurchaseBudget.findByPk(candidate, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!budget) {
          throw purchaseError('Budget not found', 404);
        }
        budgetId = budget.id;
      }

      const order = await PurchaseOrder.create(
        {
          reference: generateReference(body.reference),
          status: ORDER_STATUSES.includes(body.status) ? body.status : 'draft',
          supplierId: supplier ? supplier.id : null,
          supplierName,
          budgetId,
          currency,
          subtotal,
          taxTotal,
          total,
          expectedAt: coerceDate(body.expectedAt),
          notes: body.notes ? String(body.notes).trim() : null,
          approvalRequired: Boolean(body.approvalRequired),
          createdBy: actorId,
          updatedBy: actorId
        },
        { transaction }
      );

      await PurchaseOrderItem.bulkCreate(
        items.map((item, index) => ({
          ...item,
          purchaseOrderId: order.id,
          lineNumber: index + 1
        })),
        { transaction }
      );

      await recalculateBudgets([order.budgetId], { transaction });

      await order.reload({
        include: [
          { model: PurchaseOrderItem, as: 'items' },
          { model: PurchaseAttachment, as: 'attachments' },
          { model: PurchaseBudget, as: 'budget', attributes: ['id', 'category', 'fiscalYear', 'currency'] }
        ],
        transaction
      });

      return order;
    });

    return mapOrderInstance(created);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw purchaseError('Purchase order reference already exists', 409);
    }
    throw error;
  }
}

export async function updatePurchaseOrder({ orderId, payload, actorId }) {
  if (!orderId) {
    throw purchaseError('orderId is required to update purchase orders');
  }
  if (!actorId) {
    throw purchaseError('actorId is required to update purchase orders', 401);
  }

  const body = payload ?? {};
  const currency = normaliseCurrency(body.currency);
  const { items, subtotal, taxTotal, total } = normaliseItems(body.items, currency);

  const updated = await sequelize.transaction(async (transaction) => {
    const order = await PurchaseOrder.findByPk(orderId, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    ensureEditable(order);

    const supplier = body.supplierId ? await Supplier.findByPk(body.supplierId, { transaction }) : null;
    const supplierName = resolveSupplierName({ supplierId: body.supplierId, supplierName: body.supplierName, supplier });

    const previousBudgetId = order.budgetId;
    let nextBudgetId = order.budgetId;
    if (Object.hasOwn(body, 'budgetId')) {
      if (body.budgetId) {
        const candidate = String(body.budgetId).trim();
        const budget = await PurchaseBudget.findByPk(candidate, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!budget) {
          throw purchaseError('Budget not found', 404);
        }
        nextBudgetId = budget.id;
      } else {
        nextBudgetId = null;
      }
    }

    const updates = {
      supplierId: supplier ? supplier.id : null,
      supplierName,
      budgetId: nextBudgetId,
      currency,
      subtotal,
      taxTotal,
      total,
      expectedAt: coerceDate(body.expectedAt),
      notes: body.notes ? String(body.notes).trim() : null,
      approvalRequired: Boolean(body.approvalRequired),
      updatedBy: actorId
    };

    if (body.reference && body.reference !== order.reference) {
      updates.reference = generateReference(body.reference);
    }

    if (body.status && body.status !== order.status) {
      if (!ORDER_STATUSES.includes(body.status)) {
        throw purchaseError(`Unsupported status: ${body.status}`);
      }
      const allowed = STATUS_TRANSITIONS.get(order.status) ?? new Set();
      if (!allowed.has(body.status) && body.status !== order.status) {
        throw purchaseError(`Cannot transition purchase order from ${order.status} to ${body.status}`, 409);
      }
      applyStatusTimestamp(order, body.status);
      updates.status = body.status;
    }

    await order.update(updates, { transaction });

    const existing = new Map(order.items.map((item) => [item.id, item]));
    const seen = new Set();

    for (const [index, item] of items.entries()) {
      if (item.id && existing.has(item.id)) {
        const current = existing.get(item.id);
        seen.add(item.id);
        await current.update(
          {
            itemName: item.itemName,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitCost: item.unitCost,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
            currency: item.currency,
            expectedAt: item.expectedAt,
            receivedQuantity: Math.min(item.receivedQuantity ?? current.receivedQuantity, item.quantity),
            status: item.status,
            imageUrl: item.imageUrl,
            lineNumber: index + 1
          },
          { transaction }
        );
      } else {
        await PurchaseOrderItem.create(
          {
            ...item,
            purchaseOrderId: order.id,
            lineNumber: index + 1
          },
          { transaction }
        );
      }
    }

    const removable = order.items.filter((item) => !seen.has(item.id));
    if (removable.length > 0) {
      const removableIds = removable.map((item) => item.id);
      await PurchaseOrderItem.destroy({ where: { id: removableIds }, transaction });
    }

    await recalculateBudgets([previousBudgetId, nextBudgetId], { transaction });

    const reloaded = await PurchaseOrder.findByPk(order.id, {
      include: [
        { model: PurchaseOrderItem, as: 'items' },
        { model: PurchaseAttachment, as: 'attachments' },
        { model: PurchaseBudget, as: 'budget', attributes: ['id', 'category', 'fiscalYear', 'currency'] }
      ],
      transaction
    });

    return reloaded;
  });

  return mapOrderInstance(updated);
}

export async function updatePurchaseOrderStatus({ orderId, nextStatus, actorId }) {
  if (!orderId) {
    throw purchaseError('orderId is required to update status');
  }
  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw purchaseError(`Unsupported status: ${nextStatus}`);
  }

  const updated = await sequelize.transaction(async (transaction) => {
    const order = await PurchaseOrder.findByPk(orderId, { transaction, lock: transaction.LOCK.UPDATE });
    ensureEditable(order);

    if (order.status === nextStatus) {
      return order;
    }

    const allowed = STATUS_TRANSITIONS.get(order.status) ?? new Set();
    if (!allowed.has(nextStatus)) {
      throw purchaseError(`Cannot transition purchase order from ${order.status} to ${nextStatus}`, 409);
    }

    applyStatusTimestamp(order, nextStatus);
    order.status = nextStatus;
    order.updatedBy = actorId ?? order.updatedBy;
    await order.save({ transaction });
    await recalculateBudgets([order.budgetId], { transaction });
    await order.reload({
      include: [
        { model: PurchaseOrderItem, as: 'items' },
        { model: PurchaseAttachment, as: 'attachments' },
        { model: PurchaseBudget, as: 'budget', attributes: ['id', 'category', 'fiscalYear', 'currency'] }
      ],
      transaction
    });
    return order;
  });

  return mapOrderInstance(updated);
}

export async function recordPurchaseReceipt({ orderId, items = [], note = null, actorId }) {
  if (!orderId) {
    throw purchaseError('orderId is required to record receipts');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw purchaseError('Provide at least one line item update to record a receipt');
  }

  const updated = await sequelize.transaction(async (transaction) => {
    const order = await PurchaseOrder.findByPk(orderId, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    ensureEditable(order);

    const itemMap = new Map(order.items.map((item) => [item.id, item]));
    let anyPartial = false;
    let allReceived = true;

    for (const entry of items) {
      const target = itemMap.get(entry.id);
      if (!target) {
        throw purchaseError(`Line item ${entry.id} does not belong to this purchase order`, 404);
      }
      const receivedQuantity = Math.min(mapInteger(entry.receivedQuantity ?? entry.quantity ?? 0), target.quantity);
      if (receivedQuantity < target.quantity) {
        allReceived = false;
      }
      if (receivedQuantity > 0 && receivedQuantity < target.quantity) {
        anyPartial = true;
      }
      target.receivedQuantity = receivedQuantity;
      target.status = receivedQuantity >= target.quantity ? 'received' : receivedQuantity > 0 ? 'open' : target.status;
      await target.save({ transaction });
    }

    if (!anyPartial) {
      allReceived = order.items.every((item) => item.receivedQuantity >= item.quantity);
    }

    if (allReceived) {
      order.status = 'received';
      order.receivedAt = new Date();
    } else if (anyPartial || order.items.some((item) => item.receivedQuantity > 0)) {
      order.status = 'partial';
      if (!order.receivedAt) {
        order.receivedAt = new Date();
      }
    }

    if (note) {
      const stamp = new Date().toISOString();
      const entry = `[Receiving ${stamp}] ${String(note).trim()}`;
      order.notes = order.notes ? `${order.notes}\n\n${entry}` : entry;
    }

    order.updatedBy = actorId ?? order.updatedBy;
    await order.save({ transaction });

    await recalculateBudgets([order.budgetId], { transaction });

    const reloaded = await PurchaseOrder.findByPk(order.id, {
      include: [
        { model: PurchaseOrderItem, as: 'items' },
        { model: PurchaseAttachment, as: 'attachments' },
        { model: PurchaseBudget, as: 'budget', attributes: ['id', 'category', 'fiscalYear', 'currency'] }
      ],
      transaction
    });

    return reloaded;
  });

  return mapOrderInstance(updated);
}

export async function addPurchaseAttachment({ orderId, payload, actorId }) {
  if (!orderId) {
    throw purchaseError('orderId is required to add attachments');
  }
  if (!actorId) {
    throw purchaseError('actorId is required to add attachments', 401);
  }

  const body = payload ?? {};
  const fileName = String(body.fileName ?? '').trim();
  const fileUrl = String(body.fileUrl ?? '').trim();
  if (!fileName || !fileUrl) {
    throw purchaseError('fileName and fileUrl are required for attachments');
  }

  const category = body.category && ['quote', 'invoice', 'packing_slip', 'receiving', 'other'].includes(body.category)
    ? body.category
    : 'other';

  const attachment = await sequelize.transaction(async (transaction) => {
    const order = await PurchaseOrder.findByPk(orderId, { transaction });
    if (!order) {
      throw purchaseError('Purchase order not found', 404);
    }

    const created = await PurchaseAttachment.create(
      {
        purchaseOrderId: order.id,
        fileName,
        fileUrl,
        category,
        uploadedBy: actorId,
        notes: body.notes ? String(body.notes).trim() : null
      },
      { transaction }
    );

    return created;
  });

  return attachment.toJSON();
}

export async function removePurchaseAttachment({ orderId, attachmentId }) {
  if (!orderId || !attachmentId) {
    throw purchaseError('orderId and attachmentId are required to delete attachments');
  }

  const removed = await sequelize.transaction(async (transaction) => {
    const attachment = await PurchaseAttachment.findOne({
      where: { id: attachmentId, purchaseOrderId: orderId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!attachment) {
      throw purchaseError('Attachment not found', 404);
    }

    await attachment.destroy({ transaction });
    return attachment;
  });

  return removed.toJSON();
}

export async function listSuppliers({ status = 'active', search = '' } = {}) {
  const where = {};
  if (status && status !== 'all') {
    if (!['active', 'on_hold', 'inactive'].includes(status)) {
      throw purchaseError(`Unsupported supplier status filter: ${status}`);
    }
    where.status = status;
  }

  const predicate = buildSearchPredicate(['Supplier.name', 'Supplier.contact_name', 'Supplier.contact_email'], search);
  if (predicate) {
    Object.assign(where, predicate);
  }

  const suppliers = await Supplier.findAll({
    where,
    order: [['name', 'ASC']]
  });

  return suppliers.map((supplier) => ({
    ...supplier.toJSON(),
    leadTimeDays: mapInteger(supplier.leadTimeDays),
    paymentTermsDays: mapInteger(supplier.paymentTermsDays),
    rating: mapDecimal(supplier.rating)
  }));
}

export async function upsertSupplier({ supplierId = null, payload, actorId }) {
  if (!payload) {
    throw purchaseError('Supplier payload is required');
  }

  const body = payload;
  const name = String(body.name ?? '').trim();
  if (!name) {
    throw purchaseError('Supplier name is required');
  }

  const updates = {
    name,
    contactName: body.contactName ? String(body.contactName).trim() : null,
    contactEmail: body.contactEmail ? String(body.contactEmail).trim() : null,
    contactPhone: body.contactPhone ? String(body.contactPhone).trim() : null,
    website: body.website ? String(body.website).trim() : null,
    addressLine1: body.addressLine1 ? String(body.addressLine1).trim() : null,
    addressLine2: body.addressLine2 ? String(body.addressLine2).trim() : null,
    city: body.city ? String(body.city).trim() : null,
    region: body.region ? String(body.region).trim() : null,
    postcode: body.postcode ? String(body.postcode).trim() : null,
    country: body.country ? String(body.country).trim() : null,
    leadTimeDays: body.leadTimeDays != null ? mapInteger(body.leadTimeDays) : null,
    paymentTermsDays: body.paymentTermsDays != null ? mapInteger(body.paymentTermsDays) : null,
    rating: body.rating != null ? roundCurrency(body.rating) : null,
    notes: body.notes ? String(body.notes).trim() : null,
    tags: Array.isArray(body.tags)
      ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : body.tags
        ? String(body.tags)
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    lastReviewedAt: coerceDate(body.lastReviewedAt)
  };

  if (!Array.isArray(updates.tags)) {
    updates.tags = [];
  }

  const requestedStatus = ['active', 'on_hold', 'inactive'].includes(body.status)
    ? body.status
    : undefined;
  if (requestedStatus) {
    updates.status = requestedStatus;
  }

  let supplier;
  if (supplierId) {
    supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      throw purchaseError('Supplier not found', 404);
    }
    await supplier.update(updates);
  } else {
    supplier = await Supplier.create({ ...updates, status: requestedStatus ?? 'active' });
  }

  if (actorId && !supplier.lastReviewedAt) {
    await supplier.update({ lastReviewedAt: new Date() });
  }

  return supplier.toJSON();
}

export async function updateSupplierStatus({ supplierId, status }) {
  if (!supplierId) {
    throw purchaseError('supplierId is required to update status');
  }
  if (!['active', 'on_hold', 'inactive'].includes(status)) {
    throw purchaseError(`Unsupported status: ${status}`);
  }

  const supplier = await Supplier.findByPk(supplierId);
  if (!supplier) {
    throw purchaseError('Supplier not found', 404);
  }

  await supplier.update({ status });
  return supplier.toJSON();
}

export async function listPurchaseBudgets({ fiscalYear = null } = {}) {
  const where = {};
  if (fiscalYear != null) {
    where.fiscalYear = mapInteger(fiscalYear);
  }

  const budgets = await PurchaseBudget.findAll({
    where,
    order: [['fiscalYear', 'DESC'], ['category', 'ASC']]
  });

  return budgets.map((budget) => ({
    ...budget.toJSON(),
    allocated: mapDecimal(budget.allocated),
    spent: mapDecimal(budget.spent),
    committed: mapDecimal(budget.committed)
  }));
}

export async function upsertPurchaseBudget({ budgetId = null, payload, actorId }) {
  if (!payload) {
    throw purchaseError('Budget payload is required');
  }

  const body = payload;
  const category = String(body.category ?? '').trim();
  if (!category) {
    throw purchaseError('Budget category is required');
  }
  const fiscalYear = mapInteger(body.fiscalYear ?? new Date().getFullYear());
  if (fiscalYear < 2000) {
    throw purchaseError('Fiscal year must be 2000 or later');
  }

  const updates = {
    category,
    fiscalYear,
    owner: body.owner ? String(body.owner).trim() : null,
    allocated: roundCurrency(body.allocated ?? 0),
    spent: roundCurrency(body.spent ?? 0),
    committed: roundCurrency(body.committed ?? 0),
    currency: normaliseCurrency(body.currency),
    notes: body.notes ? String(body.notes).trim() : null,
    updatedBy: actorId ?? null
  };

  let budget;
  if (budgetId) {
    budget = await PurchaseBudget.findByPk(budgetId);
    if (!budget) {
      throw purchaseError('Budget row not found', 404);
    }
    await budget.update(updates);
  } else {
    budget = await PurchaseBudget.findOne({ where: { category, fiscalYear } });
    if (budget) {
      await budget.update(updates);
    } else {
      budget = await PurchaseBudget.create(updates);
    }
  }

  return {
    ...budget.toJSON(),
    allocated: mapDecimal(budget.allocated),
    spent: mapDecimal(budget.spent),
    committed: mapDecimal(budget.committed)
  };
}

export default {
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
};
