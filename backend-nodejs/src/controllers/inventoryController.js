import {
  acknowledgeInventoryAlert,
  createInventoryItem as createInventoryItemRecord,
  getInventoryHealthSummary,
  getInventoryItemById,
  listInventoryItems,
  recordInventoryAdjustment,
  resolveInventoryAlert
} from '../services/inventoryService.js';

function handleServiceError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

export async function createInventoryItem(req, res, next) {
  try {
    const item = await createInventoryItemRecord(req.body);
    res.status(201).json(item.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listInventory(req, res, next) {
  try {
    const { companyId, category, search, includeAlerts } = req.query;
    const items = await listInventoryItems({
      companyId,
      category,
      search,
      includeAlerts: includeAlerts === 'true'
    });
    res.json(items.map((item) => item.toJSON()));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getInventoryItem(req, res, next) {
  try {
    const item = await getInventoryItemById(req.params.itemId, {
      includeAlerts: req.query.includeAlerts === 'true'
    });
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found' });
      return;
    }
    res.json({
      ...item.toJSON(),
      health: getInventoryHealthSummary(item)
    });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createInventoryAdjustment(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity, type, note, actorId, reference, source, metadata } = req.body;
    const result = await recordInventoryAdjustment(
      {
        itemId,
        quantity,
        type,
        note,
        actorId,
        reference,
        source,
        metadata
      }
    );
    res.status(201).json({
      item: result.item.toJSON(),
      ledgerEntry: result.ledgerEntry.toJSON(),
      health: getInventoryHealthSummary(result.item)
    });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function acknowledgeAlert(req, res, next) {
  try {
    const alert = await acknowledgeInventoryAlert(req.params.alertId, req.body || {});
    res.json(alert.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function resolveAlert(req, res, next) {
  try {
    const alert = await resolveInventoryAlert(req.params.alertId, req.body || {});
    res.json(alert.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
