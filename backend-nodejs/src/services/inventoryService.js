import { Op } from 'sequelize';
import {
  InventoryAlert,
  InventoryCategory,
  InventoryItem,
  InventoryItemMedia,
  InventoryItemSupplier,
  InventoryItemTag,
  InventoryLedgerEntry,
  InventoryLocationZone,
  InventoryTag,
  Supplier,
  sequelize
} from '../models/index.js';

function inventoryError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
}

function normaliseQuantity(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw inventoryError(`${fieldName} must be a positive integer`);
  }
  return parsed;
}

function normaliseNonNegativeInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw inventoryError(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

function normaliseNonNegativeDecimal(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw inventoryError(`${fieldName} must be a non-negative number`);
  }
  return parsed;
}

function normaliseEnumValue(value, allowed, fieldName, { defaultValue = null, required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required && defaultValue == null) {
      throw inventoryError(`${fieldName} is required`);
    }
    return defaultValue;
  }

  if (typeof value !== 'string') {
    throw inventoryError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    if (required && defaultValue == null) {
      throw inventoryError(`${fieldName} is required`);
    }
    return defaultValue;
  }

  if (!allowed.includes(trimmed)) {
    throw inventoryError(`${fieldName} must be one of ${allowed.join(', ')}`);
  }

  return trimmed;
}

function uniqueStringArray(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    result.push(trimmed);
  });
  return result;
}

function generateSlug(input, maxLength = 160) {
  if (typeof input !== 'string') {
    return null;
  }
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
  return slug || null;
}

function trimToNull(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function normaliseCurrency(value, fieldName = 'currency', fallback = 'GBP') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value !== 'string') {
    throw inventoryError(`${fieldName} must be a currency code`);
  }
  const formatted = value.trim().toUpperCase();
  if (!formatted || formatted.length > 3) {
    throw inventoryError(`${fieldName} must be a 3-letter currency code`);
  }
  return formatted;
}

function availability(item) {
  return item.quantityOnHand - item.quantityReserved;
}

async function resolveCategory(categoryId, companyId, transaction) {
  if (!categoryId) {
    return null;
  }
  const category = await InventoryCategory.findByPk(categoryId, { transaction });
  if (!category) {
    throw inventoryError('Inventory category not found', 404);
  }
  if (companyId && category.companyId !== companyId) {
    throw inventoryError('Category does not belong to the same company', 403);
  }
  return category;
}

async function resolveLocationZone(zoneId, companyId, transaction) {
  if (!zoneId) {
    return null;
  }
  const zone = await InventoryLocationZone.findByPk(zoneId, { transaction });
  if (!zone) {
    throw inventoryError('Inventory location zone not found', 404);
  }
  if (companyId && zone.companyId !== companyId) {
    throw inventoryError('Zone does not belong to the same company', 403);
  }
  return zone;
}

async function resolveSupplier(supplierId, transaction) {
  if (!supplierId) {
    return null;
  }
  const supplier = await Supplier.findByPk(supplierId, { transaction });
  if (!supplier) {
    throw inventoryError('Supplier not found', 404);
  }
  return supplier;
}

async function ensureTags(tagIds, companyId, transaction) {
  const uniqueIds = Array.from(new Set(tagIds ?? [])).filter(Boolean);
  if (uniqueIds.length === 0) {
    return [];
  }
  const tags = await InventoryTag.findAll({ where: { id: uniqueIds }, transaction });
  if (tags.length !== uniqueIds.length) {
    throw inventoryError('One or more tags were not found', 404);
  }
  if (companyId) {
    const invalid = tags.find((tag) => tag.companyId !== companyId);
    if (invalid) {
      throw inventoryError('Tag does not belong to the same company', 403);
    }
  }
  return tags;
}

async function setItemTagsInternal(item, tagIds, transaction) {
  const tags = await ensureTags(tagIds, item.companyId, transaction);
  await InventoryItemTag.destroy({ where: { itemId: item.id }, transaction });
  if (tags.length) {
    await InventoryItemTag.bulkCreate(
      tags.map((tag, index) => ({
        itemId: item.id,
        tagId: tag.id,
        sortOrder: index
      })),
      { transaction }
    );
  }
  return tags;
}

function buildInventoryItemInclude(options = {}) {
  const include = [];
  if (options.includeAlerts) {
    include.push({
      model: InventoryAlert,
      required: false,
      where: { status: { [Op.in]: ['active', 'acknowledged'] } }
    });
  }
  include.push(
    { model: InventoryCategory, as: 'categoryRef' },
    { model: InventoryLocationZone, as: 'locationZone' },
    {
      model: InventoryTag,
      as: 'tags',
      through: { attributes: [] }
    },
    {
      model: InventoryItemMedia,
      as: 'media',
      separate: true,
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC']
      ]
    },
    {
      model: InventoryItemSupplier,
      as: 'supplierLinks',
      include: [{ model: Supplier, as: 'supplier' }]
    }
  );
  return include;
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
  categoryId = null,
  unitType = 'unit',
  quantityOnHand = 0,
  quantityReserved = 0,
  safetyStock = 0,
  locationZoneId = null,
  itemType = 'tool',
  fulfilmentType = 'purchase',
  status = 'active',
  tagline = null,
  description = null,
  rentalRate = null,
  rentalRateCurrency = null,
  depositAmount = null,
  depositCurrency = null,
  purchasePrice = null,
  purchasePriceCurrency = null,
  replacementCost = null,
  insuranceRequired = false,
  conditionRating = 'good',
  metadata = {},
  tagIds = [],
  primarySupplierId = null
}) {
export async function createInventoryItem(params, options = {}) {
  const {
    companyId,
    marketplaceItemId = null,
    name,
    sku,
    category,
    unitType = 'unit',
    quantityOnHand = 0,
    quantityReserved = 0,
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
  } = params;

  if (!companyId) {
    throw inventoryError('companyId is required');
  }
  if (!name || !sku) {
    throw inventoryError('name and sku are required');
  }

  const resolvedQuantityOnHand = normaliseNonNegativeInteger(quantityOnHand ?? 0, 'quantityOnHand');
  const resolvedQuantityReserved = normaliseNonNegativeInteger(quantityReserved ?? 0, 'quantityReserved');
  const resolvedSafetyStock = normaliseNonNegativeInteger(safetyStock ?? 0, 'safetyStock');

  if (resolvedQuantityReserved > resolvedQuantityOnHand) {
    throw inventoryError('quantityReserved cannot exceed quantityOnHand');
  }

  const rentalRateValue = normaliseNonNegativeDecimal(rentalRate, 'rentalRate');
  const depositAmountValue = normaliseNonNegativeDecimal(depositAmount, 'depositAmount');
  const replacementCostValue = normaliseNonNegativeDecimal(replacementCost, 'replacementCost');
  const purchasePriceValue = normaliseNonNegativeDecimal(purchasePrice, 'purchasePrice');

  if (metadata && typeof metadata !== 'object') {
    throw inventoryError('metadata must be an object when provided');
  }

  const trimmedName = typeof name === 'string' ? name.trim() : name;
  const trimmedSku = typeof sku === 'string' ? sku.trim() : sku;
  const trimmedCategory = typeof category === 'string' ? category.trim() : category;
  const trimmedTagline = typeof tagline === 'string' ? tagline.trim().slice(0, 160) : null;
  const descriptionValue = typeof description === 'string' && description.trim() ? description.trim() : null;

  const resolvedItemType = normaliseEnumValue(itemType, ['tool', 'material'], 'itemType', {
    defaultValue: 'tool',
    required: true
  });
  const resolvedFulfilmentType = normaliseEnumValue(fulfilmentType, ['purchase', 'rental', 'hybrid'], 'fulfilmentType', {
    defaultValue: 'purchase',
    required: true
  });
  const resolvedStatus = normaliseEnumValue(status, ['draft', 'active', 'inactive', 'retired'], 'status', {
    defaultValue: 'active',
    required: true
  });

  return sequelize.transaction(async (transaction) => {
    const categoryRecord = await resolveCategory(categoryId, companyId, transaction);
    const zoneRecord = await resolveLocationZone(locationZoneId, companyId, transaction);
    const primarySupplier = await resolveSupplier(primarySupplierId, transaction);
    const categoryLabel = categoryRecord?.name || trimmedCategory;

    if (!categoryLabel) {
      throw inventoryError('category is required');
    }

  const execute = async (transaction) => {
    const item = await InventoryItem.create(
      {
        companyId,
        marketplaceItemId,
        name: trimmedName,
        sku: trimmedSku,
        category: categoryLabel,
        categoryId: categoryRecord?.id ?? null,
        unitType,
        quantityOnHand: resolvedQuantityOnHand,
        quantityReserved: resolvedQuantityReserved,
        safetyStock: resolvedSafetyStock,
        locationZoneId: zoneRecord?.id ?? null,
        itemType: resolvedItemType,
        fulfilmentType: resolvedFulfilmentType,
        status: resolvedStatus,
        tagline: trimmedTagline,
        description: descriptionValue,
        rentalRate: rentalRateValue,
        rentalRateCurrency,
        depositAmount: depositAmountValue,
        depositCurrency,
        purchasePrice: purchasePriceValue,
        purchasePriceCurrency,
        replacementCost: replacementCostValue,
        insuranceRequired,
        conditionRating,
        metadata,
        primarySupplierId: primarySupplier?.id ?? null
      },
      { transaction }
    );

    if (Array.isArray(tagIds) && tagIds.length) {
      await setItemTagsInternal(item, tagIds, transaction);
    }

    if (item.quantityOnHand <= item.safetyStock) {
      await updateLowStockAlert(item, transaction);
    }

    return item;
  };

  if (options.transaction) {
    return execute(options.transaction);
  }

  return sequelize.transaction(execute);
}

export async function updateInventoryItem(itemId, updates = {}, options = {}) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }

  const stringFields = ['name', 'sku', 'unitType', 'rentalRateCurrency', 'depositCurrency', 'purchasePriceCurrency'];
  const textFields = ['tagline', 'description'];
  const integerFields = ['quantityOnHand', 'quantityReserved', 'safetyStock'];
  const decimalFields = ['rentalRate', 'depositAmount', 'replacementCost', 'purchasePrice'];

  const execute = async (transaction) => {
    const lock = transaction?.LOCK?.UPDATE ?? undefined;
    const item = await InventoryItem.findByPk(itemId, {
      transaction,
      lock
    });

    if (!item) {
      throw inventoryError('Inventory item not found', 404);
    }

    const patch = {};
    let tagsToUpdate = null;

    stringFields.forEach((field) => {
      if (Object.hasOwn(updates, field)) {
        const value = updates[field];
        if (value === undefined || value === null || value === '') {
          patch[field] = null;
        } else if (typeof value === 'string') {
          patch[field] = value.trim();
        } else {
          throw inventoryError(`${field} must be a string`);
        }
      }
    });

    textFields.forEach((field) => {
      if (Object.hasOwn(updates, field)) {
        const value = updates[field];
        if (value === undefined || value === null || value === '') {
          patch[field] = null;
        } else if (typeof value === 'string') {
          patch[field] = field === 'tagline' ? value.trim().slice(0, 160) : value.trim();
        } else {
          throw inventoryError(`${field} must be a string`);
        }
      }
    });

    integerFields.forEach((field) => {
      if (Object.hasOwn(updates, field)) {
        const parsed = normaliseNonNegativeInteger(updates[field], field);
        if (parsed !== null) {
          patch[field] = parsed;
        }
      }
    });

    decimalFields.forEach((field) => {
      if (Object.hasOwn(updates, field)) {
        const parsed = normaliseNonNegativeDecimal(updates[field], field);
        patch[field] = parsed;
      }
    });

    if (Object.hasOwn(updates, 'insuranceRequired')) {
      patch.insuranceRequired = Boolean(updates.insuranceRequired);
    }

    if (Object.hasOwn(updates, 'conditionRating')) {
      const allowed = ['new', 'excellent', 'good', 'fair', 'needs_service'];
      const rating = updates.conditionRating;
      if (rating === undefined || rating === null || rating === '') {
        patch.conditionRating = 'good';
      } else if (typeof rating === 'string' && allowed.includes(rating)) {
        patch.conditionRating = rating;
      } else {
        throw inventoryError(`conditionRating must be one of ${allowed.join(', ')}`);
      }
    }

    if (Object.hasOwn(updates, 'itemType')) {
      patch.itemType = normaliseEnumValue(updates.itemType, ['tool', 'material'], 'itemType', {
        defaultValue: item.itemType || 'tool',
        required: true
      });
    }

    if (Object.hasOwn(updates, 'fulfilmentType')) {
      patch.fulfilmentType = normaliseEnumValue(updates.fulfilmentType, ['purchase', 'rental', 'hybrid'], 'fulfilmentType', {
        defaultValue: item.fulfilmentType || 'purchase',
        required: true
      });
    }

    if (Object.hasOwn(updates, 'status')) {
      patch.status = normaliseEnumValue(updates.status, ['draft', 'active', 'inactive', 'retired'], 'status', {
        defaultValue: item.status || 'active',
        required: true
      });
    }

    if (Object.hasOwn(updates, 'categoryId')) {
      const categoryRecord = await resolveCategory(updates.categoryId, item.companyId, transaction);
      patch.categoryId = categoryRecord?.id ?? null;
      if (categoryRecord) {
        patch.category = categoryRecord.name;
      }
    }

    if (Object.hasOwn(updates, 'category') && !Object.hasOwn(patch, 'category')) {
      const value = updates.category;
      if (value === undefined || value === null || value === '') {
        patch.category = item.category;
      } else if (typeof value === 'string') {
        patch.category = value.trim();
        if (!Object.hasOwn(patch, 'categoryId')) {
          patch.categoryId = null;
        }
      } else {
        throw inventoryError('category must be a string');
      }
    }

    if (Object.hasOwn(updates, 'locationZoneId')) {
      const zoneRecord = await resolveLocationZone(updates.locationZoneId, item.companyId, transaction);
      patch.locationZoneId = zoneRecord?.id ?? null;
    }

    if (Object.hasOwn(updates, 'primarySupplierId')) {
      if (!updates.primarySupplierId) {
        patch.primarySupplierId = null;
      } else {
        const supplier = await resolveSupplier(updates.primarySupplierId, transaction);
        patch.primarySupplierId = supplier.id;
      }
    }

    if (Object.hasOwn(updates, 'metadata')) {
      if (updates.metadata && typeof updates.metadata !== 'object') {
        throw inventoryError('metadata must be an object when provided');
      }
      patch.metadata = updates.metadata || {};
    } else if (Object.hasOwn(updates, 'metadataPatch')) {
      if (!updates.metadataPatch || typeof updates.metadataPatch !== 'object') {
        throw inventoryError('metadataPatch must be an object when provided');
      }
      patch.metadata = { ...item.metadata, ...updates.metadataPatch };
    }

    if (Object.hasOwn(updates, 'tagIds')) {
      if (!Array.isArray(updates.tagIds)) {
        throw inventoryError('tagIds must be an array');
      }
      tagsToUpdate = updates.tagIds;
    }

    if (Object.keys(patch).length > 0) {
      await item.update(patch, { transaction });
    }

    const requiresAlertUpdate = ['quantityOnHand', 'quantityReserved', 'safetyStock'].some((field) =>
      Object.hasOwn(patch, field)
    );

    if (requiresAlertUpdate) {
      await updateLowStockAlert(item, transaction);
    }

    if (tagsToUpdate !== null) {
      await setItemTagsInternal(item, tagsToUpdate, transaction);
    }

    return item;
  };

  if (options.transaction) {
    return execute(options.transaction);
  }

  return sequelize.transaction(execute);
}

export async function deleteInventoryItem(itemId) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const item = await InventoryItem.findByPk(itemId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });

    if (!item) {
      throw inventoryError('Inventory item not found', 404);
    }

    await InventoryAlert.destroy({ where: { itemId: item.id }, transaction });
    await InventoryItemTag.destroy({ where: { itemId: item.id }, transaction });
    await InventoryItemMedia.destroy({ where: { itemId: item.id }, transaction });
    await InventoryItemSupplier.destroy({ where: { itemId: item.id }, transaction });
    await item.destroy({ transaction });
    return true;
  });
}

export async function listInventoryItems({
  companyId,
  category,
  categoryId,
  search,
  includeAlerts = false,
  includeRelations = false
} = {}) {
  const where = {};
  const andConditions = [];

  if (companyId) {
    where.companyId = companyId;
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  } else if (category === 'uncategorised') {
    andConditions.push({
      [Op.or]: [{ categoryId: null }, { category: null }, { category: '' }]
    });
  } else if (category && category !== 'all') {
    andConditions.push({ category });
  }

  if (search) {
    const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const keyword = `%${search}%`;
    andConditions.push({
      [Op.or]: [
        { name: { [likeOperator]: keyword } },
        { sku: { [likeOperator]: keyword } }
      ]
    });
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  let include = [];
  if (includeRelations) {
    include = buildInventoryItemInclude({ includeAlerts });
  } else if (includeAlerts) {
    include = [
      {
        model: InventoryAlert,
        required: false,
        where: { status: { [Op.in]: ['active', 'acknowledged'] } }
      }
    ];
  }

  return InventoryItem.findAll({
    where,
    include
  });
}

export function getInventoryItemById(id, options = {}) {
  const include = options.includeRelations
    ? buildInventoryItemInclude({ includeAlerts: options.includeAlerts })
    : options.includeAlerts
    ? [
        {
          model: InventoryAlert,
          required: false,
          where: { status: { [Op.in]: ['active', 'acknowledged'] } }
        }
      ]
    : options.include;

  return InventoryItem.findByPk(id, {
    ...options,
    include
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

export async function listInventoryCategories({ companyId, status } = {}) {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }
  if (status && status !== 'all') {
    where.status = status;
  }
  return InventoryCategory.findAll({
    where,
    order: [
      ['sortOrder', 'ASC'],
      ['name', 'ASC']
    ]
  });
}

export async function createInventoryCategory({
  companyId,
  name,
  description = null,
  status = 'active',
  sortOrder = 0,
  metadata = {}
}) {
  if (!companyId) {
    throw inventoryError('companyId is required');
  }
  const trimmedName = trimToNull(name);
  if (!trimmedName) {
    throw inventoryError('Category name is required');
  }
  if (metadata && typeof metadata !== 'object') {
    throw inventoryError('metadata must be an object when provided');
  }

  const resolvedStatus = normaliseEnumValue(status, ['active', 'inactive', 'archived'], 'status', {
    defaultValue: 'active',
    required: true
  });
  const orderValue = normaliseNonNegativeInteger(sortOrder, 'sortOrder');

  return sequelize.transaction(async (transaction) => {
    const existing = await InventoryCategory.findOne({
      where: { companyId, name: trimmedName },
      transaction
    });
    if (existing) {
      throw inventoryError('An inventory category with this name already exists', 409);
    }

    return InventoryCategory.create(
      {
        companyId,
        name: trimmedName,
        slug: generateSlug(trimmedName),
        description: trimToNull(description),
        status: resolvedStatus,
        sortOrder: orderValue ?? 0,
        metadata: metadata || {}
      },
      { transaction }
    );
  });
}

export async function updateInventoryCategory(categoryId, updates = {}) {
  if (!categoryId) {
    throw inventoryError('categoryId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const category = await InventoryCategory.findByPk(categoryId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!category) {
      throw inventoryError('Inventory category not found', 404);
    }

    const patch = {};

    if (Object.hasOwn(updates, 'name')) {
      const trimmedName = trimToNull(updates.name);
      if (!trimmedName) {
        throw inventoryError('Category name is required');
      }
      const duplicate = await InventoryCategory.findOne({
        where: {
          companyId: category.companyId,
          name: trimmedName,
          id: { [Op.ne]: category.id }
        },
        transaction
      });
      if (duplicate) {
        throw inventoryError('An inventory category with this name already exists', 409);
      }
      patch.name = trimmedName;
      patch.slug = generateSlug(trimmedName);
    }

    if (Object.hasOwn(updates, 'description')) {
      patch.description = trimToNull(updates.description);
    }

    if (Object.hasOwn(updates, 'status')) {
      patch.status = normaliseEnumValue(updates.status, ['active', 'inactive', 'archived'], 'status', {
        defaultValue: category.status,
        required: true
      });
    }

    if (Object.hasOwn(updates, 'sortOrder')) {
      const orderValue = normaliseNonNegativeInteger(updates.sortOrder, 'sortOrder');
      if (orderValue !== null) {
        patch.sortOrder = orderValue;
      }
    }

    if (Object.hasOwn(updates, 'metadata')) {
      if (updates.metadata && typeof updates.metadata !== 'object') {
        throw inventoryError('metadata must be an object when provided');
      }
      patch.metadata = updates.metadata || {};
    }

    if (Object.keys(patch).length === 0) {
      return category;
    }

    await category.update(patch, { transaction });
    return category;
  });
}

export async function deleteInventoryCategory(categoryId) {
  if (!categoryId) {
    throw inventoryError('categoryId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const category = await InventoryCategory.findByPk(categoryId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!category) {
      throw inventoryError('Inventory category not found', 404);
    }

    await InventoryItem.update(
      { categoryId: null },
      { where: { categoryId: category.id }, transaction }
    );

    await category.destroy({ transaction });
    return true;
  });
}

export async function listInventoryTags({ companyId, status } = {}) {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }
  if (status && status !== 'all') {
    where.status = status;
  }
  return InventoryTag.findAll({
    where,
    order: [['name', 'ASC']]
  });
}

export async function createInventoryTag({
  companyId,
  name,
  description = null,
  color = null,
  status = 'active',
  metadata = {}
}) {
  if (!companyId) {
    throw inventoryError('companyId is required');
  }
  const trimmedName = trimToNull(name);
  if (!trimmedName) {
    throw inventoryError('Tag name is required');
  }
  if (metadata && typeof metadata !== 'object') {
    throw inventoryError('metadata must be an object when provided');
  }

  const resolvedStatus = normaliseEnumValue(status, ['active', 'inactive'], 'status', {
    defaultValue: 'active',
    required: true
  });

  return sequelize.transaction(async (transaction) => {
    const existing = await InventoryTag.findOne({
      where: { companyId, name: trimmedName },
      transaction
    });
    if (existing) {
      throw inventoryError('An inventory tag with this name already exists', 409);
    }

    return InventoryTag.create(
      {
        companyId,
        name: trimmedName,
        slug: generateSlug(trimmedName, 120),
        description: trimToNull(description),
        color: trimToNull(color),
        status: resolvedStatus,
        metadata: metadata || {}
      },
      { transaction }
    );
  });
}

export async function updateInventoryTag(tagId, updates = {}) {
  if (!tagId) {
    throw inventoryError('tagId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const tag = await InventoryTag.findByPk(tagId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!tag) {
      throw inventoryError('Inventory tag not found', 404);
    }

    const patch = {};

    if (Object.hasOwn(updates, 'name')) {
      const trimmedName = trimToNull(updates.name);
      if (!trimmedName) {
        throw inventoryError('Tag name is required');
      }
      const duplicate = await InventoryTag.findOne({
        where: {
          companyId: tag.companyId,
          name: trimmedName,
          id: { [Op.ne]: tag.id }
        },
        transaction
      });
      if (duplicate) {
        throw inventoryError('An inventory tag with this name already exists', 409);
      }
      patch.name = trimmedName;
      patch.slug = generateSlug(trimmedName, 120);
    }

    if (Object.hasOwn(updates, 'description')) {
      patch.description = trimToNull(updates.description);
    }

    if (Object.hasOwn(updates, 'color')) {
      patch.color = trimToNull(updates.color);
    }

    if (Object.hasOwn(updates, 'status')) {
      patch.status = normaliseEnumValue(updates.status, ['active', 'inactive'], 'status', {
        defaultValue: tag.status,
        required: true
      });
    }

    if (Object.hasOwn(updates, 'metadata')) {
      if (updates.metadata && typeof updates.metadata !== 'object') {
        throw inventoryError('metadata must be an object when provided');
      }
      patch.metadata = updates.metadata || {};
    }

    if (Object.keys(patch).length === 0) {
      return tag;
    }

    await tag.update(patch, { transaction });
    return tag;
  });
}

export async function deleteInventoryTag(tagId) {
  if (!tagId) {
    throw inventoryError('tagId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const tag = await InventoryTag.findByPk(tagId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!tag) {
      throw inventoryError('Inventory tag not found', 404);
    }

    await InventoryItemTag.destroy({ where: { tagId: tag.id }, transaction });
    await tag.destroy({ transaction });
    return true;
  });
}

export async function setInventoryItemTags(itemId, tagIds = []) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const item = await InventoryItem.findByPk(itemId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!item) {
      throw inventoryError('Inventory item not found', 404);
    }

    await setItemTagsInternal(item, tagIds, transaction);
    return getInventoryItemById(itemId, {
      transaction,
      includeRelations: true,
      includeAlerts: false
    });
  });
}

export async function listInventoryZones({ companyId, status } = {}) {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }
  if (status && status !== 'all') {
    where.status = status;
  }
  return InventoryLocationZone.findAll({
    where,
    order: [['name', 'ASC']]
  });
}

export async function createInventoryZone({
  companyId,
  name,
  code = null,
  description = null,
  status = 'active',
  metadata = {}
}) {
  if (!companyId) {
    throw inventoryError('companyId is required');
  }
  const trimmedName = trimToNull(name);
  if (!trimmedName) {
    throw inventoryError('Zone name is required');
  }
  if (metadata && typeof metadata !== 'object') {
    throw inventoryError('metadata must be an object when provided');
  }

  const resolvedStatus = normaliseEnumValue(status, ['active', 'inactive'], 'status', {
    defaultValue: 'active',
    required: true
  });

  return sequelize.transaction(async (transaction) => {
    const existing = await InventoryLocationZone.findOne({
      where: { companyId, name: trimmedName },
      transaction
    });
    if (existing) {
      throw inventoryError('An inventory zone with this name already exists', 409);
    }

    return InventoryLocationZone.create(
      {
        companyId,
        name: trimmedName,
        code: trimToNull(code),
        description: trimToNull(description),
        status: resolvedStatus,
        metadata: metadata || {}
      },
      { transaction }
    );
  });
}

export async function updateInventoryZone(zoneId, updates = {}) {
  if (!zoneId) {
    throw inventoryError('zoneId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const zone = await InventoryLocationZone.findByPk(zoneId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!zone) {
      throw inventoryError('Inventory zone not found', 404);
    }

    const patch = {};

    if (Object.hasOwn(updates, 'name')) {
      const trimmedName = trimToNull(updates.name);
      if (!trimmedName) {
        throw inventoryError('Zone name is required');
      }
      const duplicate = await InventoryLocationZone.findOne({
        where: {
          companyId: zone.companyId,
          name: trimmedName,
          id: { [Op.ne]: zone.id }
        },
        transaction
      });
      if (duplicate) {
        throw inventoryError('An inventory zone with this name already exists', 409);
      }
      patch.name = trimmedName;
    }

    if (Object.hasOwn(updates, 'code')) {
      patch.code = trimToNull(updates.code);
    }

    if (Object.hasOwn(updates, 'description')) {
      patch.description = trimToNull(updates.description);
    }

    if (Object.hasOwn(updates, 'status')) {
      patch.status = normaliseEnumValue(updates.status, ['active', 'inactive'], 'status', {
        defaultValue: zone.status,
        required: true
      });
    }

    if (Object.hasOwn(updates, 'metadata')) {
      if (updates.metadata && typeof updates.metadata !== 'object') {
        throw inventoryError('metadata must be an object when provided');
      }
      patch.metadata = updates.metadata || {};
    }

    if (Object.keys(patch).length === 0) {
      return zone;
    }

    await zone.update(patch, { transaction });
    return zone;
  });
}

export async function deleteInventoryZone(zoneId) {
  if (!zoneId) {
    throw inventoryError('zoneId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const zone = await InventoryLocationZone.findByPk(zoneId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!zone) {
      throw inventoryError('Inventory zone not found', 404);
    }

    await InventoryItem.update(
      { locationZoneId: null },
      { where: { locationZoneId: zone.id }, transaction }
    );

    await zone.destroy({ transaction });
    return true;
  });
}

export async function listInventoryItemSuppliers(itemId) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }

  return InventoryItemSupplier.findAll({
    where: { itemId },
    include: [{ model: Supplier, as: 'supplier' }],
    order: [
      ['isPrimary', 'DESC'],
      ['createdAt', 'ASC']
    ]
  });
}

export async function upsertInventoryItemSupplier(itemId, supplierLinkId, payload = {}) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const item = await InventoryItem.findByPk(itemId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!item) {
      throw inventoryError('Inventory item not found', 404);
    }

    const unitPrice = payload.unitPrice !== undefined ? normaliseNonNegativeDecimal(payload.unitPrice, 'unitPrice') : null;
    const minimumOrderQuantity = payload.minimumOrderQuantity !== undefined
      ? normaliseNonNegativeInteger(payload.minimumOrderQuantity, 'minimumOrderQuantity')
      : null;
    const leadTimeDays = payload.leadTimeDays !== undefined
      ? normaliseNonNegativeInteger(payload.leadTimeDays, 'leadTimeDays')
      : null;
    const status = Object.hasOwn(payload, 'status')
      ? normaliseEnumValue(payload.status, ['active', 'inactive'], 'status', {
          defaultValue: 'active',
          required: true
        })
      : null;
    const notes = Object.hasOwn(payload, 'notes') ? trimToNull(payload.notes) : undefined;
    const metadata = Object.hasOwn(payload, 'metadata') ? payload.metadata : undefined;

    let link = null;
    if (supplierLinkId) {
      link = await InventoryItemSupplier.findOne({
        where: { id: supplierLinkId, itemId: item.id },
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined
      });
      if (!link) {
        throw inventoryError('Supplier association not found', 404);
      }
    }

    if (metadata !== undefined && metadata !== null && typeof metadata !== 'object') {
      throw inventoryError('metadata must be an object when provided');
    }

    const currency = Object.hasOwn(payload, 'currency')
      ? normaliseCurrency(payload.currency)
      : link?.currency ?? 'GBP';
    const isPrimary = Object.hasOwn(payload, 'isPrimary') ? Boolean(payload.isPrimary) : link?.isPrimary ?? false;

    if (!link) {
      if (!payload.supplierId) {
        throw inventoryError('supplierId is required');
      }
      if (unitPrice === null) {
        throw inventoryError('unitPrice is required');
      }
      const supplier = await resolveSupplier(payload.supplierId, transaction);
      link = await InventoryItemSupplier.create(
        {
          itemId: item.id,
          supplierId: supplier.id,
          unitPrice,
          currency,
          minimumOrderQuantity: minimumOrderQuantity ?? 1,
          leadTimeDays,
          isPrimary,
          status: status ?? 'active',
          notes: notes ?? null,
          metadata: metadata || {}
        },
        { transaction }
      );
    } else {
      const patch = {};
      if (payload.supplierId && payload.supplierId !== link.supplierId) {
        const supplier = await resolveSupplier(payload.supplierId, transaction);
        patch.supplierId = supplier.id;
      }
      if (unitPrice !== null) {
        patch.unitPrice = unitPrice;
      }
      if (minimumOrderQuantity !== null) {
        patch.minimumOrderQuantity = minimumOrderQuantity;
      }
      if (leadTimeDays !== null) {
        patch.leadTimeDays = leadTimeDays;
      }
      if (status) {
        patch.status = status;
      }
      if (notes !== undefined) {
        patch.notes = notes;
      }
      if (metadata !== undefined) {
        patch.metadata = metadata || {};
      }
      if (currency) {
        patch.currency = currency;
      }
      if (Object.hasOwn(payload, 'isPrimary')) {
        patch.isPrimary = isPrimary;
      }

      if (Object.keys(patch).length > 0) {
        await link.update(patch, { transaction });
      }
    }

    if (isPrimary) {
      await item.update({ primarySupplierId: link.supplierId }, { transaction });
    } else if (item.primarySupplierId && link.supplierId === item.primarySupplierId && !isPrimary) {
      await item.update({ primarySupplierId: null }, { transaction });
    }

    return link;
  });
}

export async function deleteInventoryItemSupplier(itemId, supplierLinkId) {
  if (!itemId || !supplierLinkId) {
    throw inventoryError('itemId and supplierLinkId are required');
  }

  return sequelize.transaction(async (transaction) => {
    const link = await InventoryItemSupplier.findOne({
      where: { id: supplierLinkId, itemId },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!link) {
      throw inventoryError('Supplier association not found', 404);
    }

    const item = await InventoryItem.findByPk(itemId, { transaction, lock: transaction ? transaction.LOCK.UPDATE : undefined });
    await link.destroy({ transaction });
    if (item && item.primarySupplierId === link.supplierId) {
      await item.update({ primarySupplierId: null }, { transaction });
    }
    return true;
  });
}

export async function listInventoryItemMedia(itemId) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }
  return InventoryItemMedia.findAll({
    where: { itemId },
    order: [
      ['sortOrder', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });
}

export async function createInventoryItemMedia(itemId, payload = {}) {
  if (!itemId) {
    throw inventoryError('itemId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const item = await InventoryItem.findByPk(itemId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!item) {
      throw inventoryError('Inventory item not found', 404);
    }

    const url = trimToNull(payload.url);
    if (!url) {
      throw inventoryError('Media url is required');
    }

    if (payload.metadata && typeof payload.metadata !== 'object') {
      throw inventoryError('metadata must be an object when provided');
    }

    const sortOrder = normaliseNonNegativeInteger(payload.sortOrder ?? 0, 'sortOrder');

    return InventoryItemMedia.create(
      {
        itemId: item.id,
        url,
        altText: trimToNull(payload.altText),
        caption: trimToNull(payload.caption),
        sortOrder: sortOrder ?? 0,
        metadata: payload.metadata || {}
      },
      { transaction }
    );
  });
}

export async function updateInventoryItemMedia(mediaId, updates = {}) {
  if (!mediaId) {
    throw inventoryError('mediaId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const media = await InventoryItemMedia.findByPk(mediaId, {
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!media) {
      throw inventoryError('Inventory media not found', 404);
    }

    const patch = {};
    if (Object.hasOwn(updates, 'url')) {
      const url = trimToNull(updates.url);
      if (!url) {
        throw inventoryError('Media url is required');
      }
      patch.url = url;
    }

    if (Object.hasOwn(updates, 'altText')) {
      patch.altText = trimToNull(updates.altText);
    }

    if (Object.hasOwn(updates, 'caption')) {
      patch.caption = trimToNull(updates.caption);
    }

    if (Object.hasOwn(updates, 'sortOrder')) {
      const sortOrder = normaliseNonNegativeInteger(updates.sortOrder, 'sortOrder');
      if (sortOrder !== null) {
        patch.sortOrder = sortOrder;
      }
    }

    if (Object.hasOwn(updates, 'metadata')) {
      if (updates.metadata && typeof updates.metadata !== 'object') {
        throw inventoryError('metadata must be an object when provided');
      }
      patch.metadata = updates.metadata || {};
    }

    if (Object.keys(patch).length === 0) {
      return media;
    }

    await media.update(patch, { transaction });
    return media;
  });
}

export async function deleteInventoryItemMedia(mediaId) {
  if (!mediaId) {
    throw inventoryError('mediaId is required');
  }

  return InventoryItemMedia.destroy({ where: { id: mediaId } }) > 0;
}

export async function listInventorySuppliers({ search, status } = {}) {
  const where = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  if (search) {
    const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const keyword = `%${search}%`;
    where[Op.or] = [
      { name: { [likeOperator]: keyword } },
      { contactName: { [likeOperator]: keyword } },
      { contactEmail: { [likeOperator]: keyword } }
    ];
  }

  return Supplier.findAll({
    where,
    order: [['name', 'ASC']]
  });
}
