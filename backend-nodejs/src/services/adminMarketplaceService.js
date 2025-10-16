import { Op } from 'sequelize';
import { MarketplaceItem, MarketplaceModerationAction } from '../models/index.js';
import {
  createInventoryItem,
  getInventoryHealthSummary,
  getInventoryItemById,
  listInventoryItems,
  updateInventoryItem,
  deleteInventoryItem
} from './inventoryService.js';

function inferClassification(source = {}) {
  const metaValue = source.metadata?.classification || source.classification;
  if (typeof metaValue === 'string') {
    const trimmed = metaValue.trim().toLowerCase();
    if (['tool', 'tools'].includes(trimmed)) {
      return 'tool';
    }
    if (['material', 'materials', 'consumable', 'consumables'].includes(trimmed)) {
      return 'material';
    }
  }

  const category = typeof source.category === 'string' ? source.category.toLowerCase() : '';
  if (category.includes('tool')) {
    return 'tool';
  }
  if (category.includes('material') || category.includes('consumable')) {
    return 'material';
  }
  return 'inventory';
}

function calculateAvailability(item) {
  const onHand = Number.parseInt(item.quantityOnHand ?? 0, 10);
  const reserved = Number.parseInt(item.quantityReserved ?? 0, 10);
  if (!Number.isFinite(onHand) || !Number.isFinite(reserved)) {
    return 0;
  }
  return Math.max(onHand - reserved, 0);
}

function resolveHealthStatus(item) {
  const available = calculateAvailability(item);
  const safety = Number.parseInt(item.safetyStock ?? 0, 10);
  if (available <= 0) {
    return 'stockout';
  }
  if (Number.isFinite(safety) && available <= Math.max(0, safety)) {
    return 'warning';
  }
  return 'healthy';
}

function formatAlert(alert) {
  if (!alert) {
    return null;
  }
  return {
    id: alert.id,
    type: alert.type,
    status: alert.status,
    severity: alert.severity,
    triggeredAt: alert.triggeredAt,
    metadata: alert.metadata ?? {}
  };
}

function formatInventoryRecord(item) {
  const json = typeof item.toJSON === 'function' ? item.toJSON() : item;
  const metadata = json.metadata && typeof json.metadata === 'object' ? json.metadata : {};
  const classification = inferClassification(json);
  const alerts = Array.isArray(item.InventoryAlerts)
    ? item.InventoryAlerts.map(formatAlert).filter(Boolean)
    : [];

  return {
    id: json.id,
    companyId: json.companyId,
    name: json.name,
    sku: json.sku,
    category: json.category,
    unitType: json.unitType,
    quantityOnHand: Number(json.quantityOnHand ?? 0),
    quantityReserved: Number(json.quantityReserved ?? 0),
    safetyStock: Number(json.safetyStock ?? 0),
    rentalRate: json.rentalRate != null ? Number(json.rentalRate) : null,
    rentalRateCurrency: json.rentalRateCurrency ?? null,
    depositAmount: json.depositAmount != null ? Number(json.depositAmount) : null,
    depositCurrency: json.depositCurrency ?? null,
    replacementCost: json.replacementCost != null ? Number(json.replacementCost) : null,
    insuranceRequired: Boolean(json.insuranceRequired),
    conditionRating: json.conditionRating ?? 'good',
    metadata,
    classification,
    imageUrl: metadata.imageUrl ?? null,
    datasheetUrl: metadata.datasheetUrl ?? null,
    notes: metadata.notes ?? null,
    tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : [],
    health: getInventoryHealthSummary(json),
    alerts,
    updatedAt: json.updatedAt ?? null,
    createdAt: json.createdAt ?? null
  };
}

function aggregateCollection(items = []) {
  const totals = {
    count: items.length,
    onHand: 0,
    reserved: 0,
    available: 0,
    alerts: 0
  };

  items.forEach((item) => {
    totals.onHand += Number.parseInt(item.quantityOnHand ?? 0, 10) || 0;
    totals.reserved += Number.parseInt(item.quantityReserved ?? 0, 10) || 0;
    totals.available += calculateAvailability(item);
    if (resolveHealthStatus(item) !== 'healthy') {
      totals.alerts += 1;
    }
  });

  return totals;
}

function buildMetadataPatch(payload = {}, classification) {
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((entry) => String(entry).trim()).filter(Boolean)
    : typeof payload.tags === 'string'
      ? payload.tags
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [];

  const patch = {
    classification,
    imageUrl: payload.imageUrl || null,
    datasheetUrl: payload.datasheetUrl || null,
    notes: payload.notes || null,
    tags
  };

  if (payload.metadata && typeof payload.metadata === 'object') {
    return { ...payload.metadata, ...patch };
  }

  return patch;
}

function normaliseInventoryPayload(payload = {}, classification) {
  return {
    companyId: payload.companyId,
    name: payload.name?.trim(),
    sku: payload.sku?.trim(),
    category: payload.category?.trim() || (classification === 'tool' ? 'Tools' : 'Materials'),
    unitType: payload.unitType?.trim() || 'unit',
    quantityOnHand: Number.parseInt(payload.quantityOnHand ?? 0, 10) || 0,
    quantityReserved: Number.parseInt(payload.quantityReserved ?? 0, 10) || 0,
    safetyStock: Number.parseInt(payload.safetyStock ?? 0, 10) || 0,
    rentalRate: payload.rentalRate ?? null,
    rentalRateCurrency: payload.rentalRateCurrency || (payload.rentalRate ? 'GBP' : null),
    depositAmount: payload.depositAmount ?? null,
    depositCurrency:
      payload.depositCurrency || payload.rentalRateCurrency || (payload.depositAmount ? 'GBP' : null),
    replacementCost: payload.replacementCost ?? null,
    insuranceRequired: Boolean(payload.insuranceRequired),
    conditionRating: payload.conditionRating || 'good',
    metadata: buildMetadataPatch(payload, classification)
  };
}

async function fetchModerationQueue({ companyId, limit = 8 } = {}) {
  const where = {
    status: {
      [Op.in]: ['pending_review', 'rejected', 'suspended']
    }
  };

  if (companyId) {
    where.companyId = companyId;
  }

  const items = await MarketplaceItem.findAll({
    where,
    include: [
      {
        model: MarketplaceModerationAction,
        as: 'moderationActions',
        separate: true,
        limit: 1,
        order: [['createdAt', 'DESC']]
      }
    ],
    order: [['updatedAt', 'DESC']],
    limit
  });

  return items.map((item) => {
    const lastAction = Array.isArray(item.moderationActions) ? item.moderationActions[0] : null;
    return {
      id: item.id,
      companyId: item.companyId,
      title: item.title,
      status: item.status,
      availability: item.availability,
      insuredOnly: item.insuredOnly,
      complianceHoldUntil: item.complianceHoldUntil,
      lastReviewedAt: item.lastReviewedAt,
      moderationNotes: item.moderationNotes,
      lastAction: lastAction ? { action: lastAction.action, reason: lastAction.reason, createdAt: lastAction.createdAt } : null
    };
  });
}

export async function getMarketplaceManagementOverview({ companyId = null, limit = 25 } = {}) {
  const inventoryItems = await listInventoryItems({ companyId, includeAlerts: true });
  const tools = inventoryItems.filter((item) => inferClassification(item) === 'tool');
  const materials = inventoryItems.filter((item) => inferClassification(item) === 'material');

  const toolRecords = tools.slice(0, limit).map(formatInventoryRecord);
  const materialRecords = materials.slice(0, limit).map(formatInventoryRecord);
  const queue = await fetchModerationQueue({ companyId, limit: 10 });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      tools: aggregateCollection(tools),
      materials: aggregateCollection(materials)
    },
    tools: toolRecords,
    materials: materialRecords,
    moderationQueue: queue
  };
}

export async function createMarketplaceTool(payload) {
  const normalised = normaliseInventoryPayload(payload, 'tool');
  if (!normalised.companyId) {
    throw new Error('companyId is required');
  }
  if (!normalised.name || !normalised.sku) {
    throw new Error('name and sku are required');
  }

  const item = await createInventoryItem(normalised);
  return formatInventoryRecord(item);
}

export async function updateMarketplaceTool(itemId, payload) {
  const metadataPatch = buildMetadataPatch(payload, 'tool');
  await updateInventoryItem(itemId, {
    ...payload,
    metadataPatch
  });
  const updated = await getInventoryItemById(itemId, { includeAlerts: true });
  if (!updated) {
    throw new Error('Inventory item not found');
  }
  return formatInventoryRecord(updated);
}

export async function deleteMarketplaceTool(itemId) {
  await deleteInventoryItem(itemId);
}

export async function createMarketplaceMaterial(payload) {
  const normalised = normaliseInventoryPayload(payload, 'material');
  if (!normalised.companyId) {
    throw new Error('companyId is required');
  }
  if (!normalised.name || !normalised.sku) {
    throw new Error('name and sku are required');
  }
  const item = await createInventoryItem(normalised);
  return formatInventoryRecord(item);
}

export async function updateMarketplaceMaterial(itemId, payload) {
  const metadataPatch = buildMetadataPatch(payload, 'material');
  await updateInventoryItem(itemId, {
    ...payload,
    metadataPatch
  });
  const updated = await getInventoryItemById(itemId, { includeAlerts: true });
  if (!updated) {
    throw new Error('Inventory item not found');
  }
  return formatInventoryRecord(updated);
}

export async function deleteMarketplaceMaterial(itemId) {
  await deleteInventoryItem(itemId);
}

export async function buildMarketplaceDashboardSlice({ companyId }) {
  const overview = await getMarketplaceManagementOverview({ companyId, limit: 8 });
  return overview;
}

export { inferClassification };
