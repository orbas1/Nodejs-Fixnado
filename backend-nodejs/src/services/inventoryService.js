import { Op } from 'sequelize';
import {
  InventoryAlert,
  InventoryItem,
  InventoryLedgerEntry,
  sequelize
} from '../models/index.js';

function inventoryError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseQuantity(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw inventoryError(`${fieldName} must be a positive integer`);
  }
  return parsed;
}

function availability(item) {
  return item.quantityOnHand - item.quantityReserved;
}

async function updateLowStockAlert(item, transaction) {
  const available = availability(item);
  const alert = await InventoryAlert.findOne({
    where: {
      itemId: item.id,
      type: 'low_stock',
      status: { [Op.in]: ['active', 'acknowledged'] }
    },
    order: [['triggeredAt', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  if (available < item.safetyStock) {
    if (!alert) {
      await InventoryAlert.create(
        {
          itemId: item.id,
          type: 'low_stock',
          severity: available <= 0 ? 'critical' : 'warning',
          status: 'active',
          metadata: {
            available,
            safetyStock: item.safetyStock
          }
        },
        { transaction }
      );
    } else if (alert.status === 'acknowledged') {
      await alert.update(
        {
          status: 'active',
          metadata: {
            ...alert.metadata,
            available,
            safetyStock: item.safetyStock
          }
        },
        { transaction }
      );
    }
  } else if (alert) {
    await alert.update(
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionNote: 'Stock restored above safety threshold',
        metadata: {
          ...alert.metadata,
          available,
          safetyStock: item.safetyStock
        }
      },
      { transaction }
    );
  }
}

async function applyInventoryAdjustment(item, type, quantity) {
  const currentAvailability = availability(item);

  switch (type) {
    case 'reservation': {
      if (currentAvailability < quantity) {
        throw inventoryError('Insufficient inventory available to reserve', 409);
      }
      item.quantityReserved += quantity;
      break;
    }
    case 'reservation_release': {
      if (item.quantityReserved < quantity) {
        throw inventoryError('Cannot release more reserved quantity than currently held');
      }
      item.quantityReserved -= quantity;
      break;
    }
    case 'checkout': {
      if (item.quantityReserved < quantity) {
        throw inventoryError('Checkout requires reserved inventory quantity');
      }
      if (item.quantityOnHand < quantity) {
        throw inventoryError('Insufficient on-hand quantity to checkout');
      }
      item.quantityReserved -= quantity;
      item.quantityOnHand -= quantity;
      break;
    }
    case 'return': {
      item.quantityOnHand += quantity;
      break;
    }
    case 'write_off': {
      if (item.quantityOnHand < quantity) {
        throw inventoryError('Cannot write off more units than available on hand');
      }
      item.quantityOnHand -= quantity;
      break;
    }
    case 'restock': {
      item.quantityOnHand += quantity;
      break;
    }
    case 'adjustment': {
      const newBalance = item.quantityOnHand + quantity;
      if (newBalance < 0) {
        throw inventoryError('Adjustment cannot reduce on-hand quantity below zero');
      }
      item.quantityOnHand = newBalance;
      break;
    }
    default:
      throw inventoryError(`Unsupported inventory adjustment type: ${type}`);
  }

  return item.save();
}

export async function createInventoryItem({
  companyId,
  marketplaceItemId = null,
  name,
  sku,
  category,
  unitType = 'unit',
  quantityOnHand = 0,
  safetyStock = 0,
  locationZoneId = null,
  rentalRate = null,
  rentalRateCurrency = null,
  depositAmount = null,
  depositCurrency = null,
  replacementCost = null,
  insuranceRequired = false,
  conditionRating = 'good',
  metadata = {}
}) {
  if (!companyId) {
    throw inventoryError('companyId is required');
  }
  if (!name || !sku || !category) {
    throw inventoryError('name, sku, and category are required');
  }

  return sequelize.transaction(async (transaction) => {
    const item = await InventoryItem.create(
      {
        companyId,
        marketplaceItemId,
        name,
        sku,
        category,
        unitType,
        quantityOnHand,
        safetyStock,
        locationZoneId,
        rentalRate,
        rentalRateCurrency,
        depositAmount,
        depositCurrency,
        replacementCost,
        insuranceRequired,
        conditionRating,
        metadata
      },
      { transaction }
    );

    if (item.quantityOnHand <= item.safetyStock) {
      await updateLowStockAlert(item, transaction);
    }

    return item;
  });
}

export async function listInventoryItems({
  companyId,
  category,
  search,
  includeAlerts = false
} = {}) {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }
  if (category) {
    where.category = category;
  }
  if (search) {
    const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const keyword = `%${search}%`;
    where[Op.or] = [
      { name: { [likeOperator]: keyword } },
      { sku: { [likeOperator]: keyword } }
    ];
  }

  return InventoryItem.findAll({
    where,
    include: includeAlerts
      ? [
          {
            model: InventoryAlert,
            required: false,
            where: { status: { [Op.in]: ['active', 'acknowledged'] } }
          }
        ]
      : []
  });
}

export function getInventoryItemById(id, options = {}) {
  return InventoryItem.findByPk(id, {
    ...options,
    include: options.includeAlerts
      ? [
          {
            model: InventoryAlert,
            required: false,
            where: { status: { [Op.in]: ['active', 'acknowledged'] } }
          }
        ]
      : undefined
  });
}

export async function recordInventoryAdjustment(
  {
    itemId,
    quantity,
    type,
    source = 'system',
    note = null,
    actorId = null,
    reference = null,
    metadata = {}
  },
  outerTransaction
) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }

  const parsedQuantity = normaliseQuantity(quantity, 'quantity');

  const applyWithTransaction = async (transaction) => {
    const item = await InventoryItem.findByPk(itemId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });

    if (!item) {
      throw inventoryError('Inventory item not found', 404);
    }

    await applyInventoryAdjustment(item, type, parsedQuantity);

    const ledgerEntry = await InventoryLedgerEntry.create(
      {
        itemId: item.id,
        type,
        quantity: parsedQuantity,
        balanceAfter: availability(item),
        referenceId: reference?.id || null,
        referenceType: reference?.type || null,
        source,
        note,
        metadata: {
          ...metadata,
          actorId
        }
      },
      { transaction }
    );

    await updateLowStockAlert(item, transaction);

    return { item, ledgerEntry };
  };

  if (outerTransaction) {
    return applyWithTransaction(outerTransaction);
  }

  return sequelize.transaction(async (transaction) => applyWithTransaction(transaction));
}

export async function acknowledgeInventoryAlert(alertId, { actorId, note }) {
  const alert = await InventoryAlert.findByPk(alertId);
  if (!alert) {
    throw inventoryError('Alert not found', 404);
  }
  if (alert.status !== 'active') {
    return alert;
  }

  await alert.update({
    status: 'acknowledged',
    metadata: {
      ...alert.metadata,
      acknowledgedBy: actorId || null,
      acknowledgementNote: note || null,
      acknowledgementAt: new Date().toISOString()
    }
  });

  return alert;
}

export async function resolveInventoryAlert(alertId, { actorId, note }) {
  const alert = await InventoryAlert.findByPk(alertId);
  if (!alert) {
    throw inventoryError('Alert not found', 404);
  }
  if (alert.status === 'resolved') {
    return alert;
  }

  await alert.update({
    status: 'resolved',
    resolvedAt: new Date(),
    resolutionNote: note || 'Resolved via API',
    metadata: {
      ...alert.metadata,
      resolvedBy: actorId || null,
      resolutionAt: new Date().toISOString()
    }
  });

  return alert;
}

export function getInventoryHealthSummary(item) {
  const available = availability(item);
  return {
    itemId: item.id,
    companyId: item.companyId,
    onHand: item.quantityOnHand,
    reserved: item.quantityReserved,
    available,
    safetyStock: item.safetyStock,
    status: available <= 0 ? 'stockout' : available <= item.safetyStock ? 'warning' : 'healthy'
  };
}
