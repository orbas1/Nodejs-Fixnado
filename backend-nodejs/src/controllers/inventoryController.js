import {
  acknowledgeInventoryAlert,
  createInventoryItem as createInventoryItemRecord,
  deleteInventoryCategory,
  deleteInventoryItem,
  deleteInventoryItemMedia,
  deleteInventoryItemSupplier,
  deleteInventoryTag,
  deleteInventoryZone,
  getInventoryHealthSummary,
  getInventoryItemById,
  listInventoryCategories,
  listInventoryItemMedia,
  listInventoryItemSuppliers,
  listInventoryItems,
  listInventorySuppliers,
  listInventoryTags,
  listInventoryZones,
  recordInventoryAdjustment,
  resolveInventoryAlert,
  setInventoryItemTags,
  createInventoryCategory,
  createInventoryItemMedia,
  createInventoryTag,
  createInventoryZone,
  updateInventoryCategory,
  updateInventoryItem,
  updateInventoryItemMedia,
  updateInventoryTag,
  updateInventoryZone,
  upsertInventoryItemSupplier
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
    const hydrated = await getInventoryItemById(item.id, {
      includeAlerts: req.query.includeAlerts === 'true',
      includeRelations: true
    });
    res.status(201).json({
      ...hydrated.toJSON(),
      health: getInventoryHealthSummary(hydrated)
    });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listInventory(req, res, next) {
  try {
    const { companyId, category, categoryId, search, includeAlerts, includeRelations } = req.query;
    const items = await listInventoryItems({
      companyId,
      category,
      categoryId,
      search,
      includeAlerts: includeAlerts === 'true',
      includeRelations: includeRelations === 'true'
    });
    res.json(
      items.map((item) => ({
        ...item.toJSON(),
        health: getInventoryHealthSummary(item)
      }))
    );
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getInventoryItem(req, res, next) {
  try {
    const item = await getInventoryItemById(req.params.itemId, {
      includeAlerts: req.query.includeAlerts === 'true',
      includeRelations: req.query.includeRelations === 'true'
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

export async function updateInventoryItemController(req, res, next) {
  try {
    const updated = await updateInventoryItem(req.params.itemId, req.body || {});
    const item = await getInventoryItemById(updated.id, {
      includeAlerts: req.query.includeAlerts === 'true',
      includeRelations: req.query.includeRelations !== 'false'
    });
    res.json({
      ...item.toJSON(),
      health: getInventoryHealthSummary(item)
    });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteInventoryItemController(req, res, next) {
  try {
    await deleteInventoryItem(req.params.itemId);
    res.status(204).send();
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

export async function listCategories(req, res, next) {
  try {
    const categories = await listInventoryCategories({
      companyId: req.query.companyId,
      status: req.query.status
    });
    res.json(categories.map((category) => category.toJSON()));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await createInventoryCategory(req.body || {});
    res.status(201).json(category.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await updateInventoryCategory(req.params.categoryId, req.body || {});
    res.json(category.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    await deleteInventoryCategory(req.params.categoryId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listTags(req, res, next) {
  try {
    const tags = await listInventoryTags({
      companyId: req.query.companyId,
      status: req.query.status
    });
    res.json(tags.map((tag) => tag.toJSON()));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createTag(req, res, next) {
  try {
    const tag = await createInventoryTag(req.body || {});
    res.status(201).json(tag.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateTag(req, res, next) {
  try {
    const tag = await updateInventoryTag(req.params.tagId, req.body || {});
    res.json(tag.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteTag(req, res, next) {
  try {
    await deleteInventoryTag(req.params.tagId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function setItemTagsController(req, res, next) {
  try {
    const item = await setInventoryItemTags(req.params.itemId, req.body?.tagIds || []);
    res.json({
      ...item.toJSON(),
      health: getInventoryHealthSummary(item)
    });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listZones(req, res, next) {
  try {
    const zones = await listInventoryZones({
      companyId: req.query.companyId,
      status: req.query.status
    });
    res.json(zones.map((zone) => zone.toJSON()));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createZone(req, res, next) {
  try {
    const zone = await createInventoryZone(req.body || {});
    res.status(201).json(zone.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateZone(req, res, next) {
  try {
    const zone = await updateInventoryZone(req.params.zoneId, req.body || {});
    res.json(zone.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteZone(req, res, next) {
  try {
    await deleteInventoryZone(req.params.zoneId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listItemSuppliersController(req, res, next) {
  try {
    const suppliers = await listInventoryItemSuppliers(req.params.itemId);
    res.json(suppliers.map((link) => link.toJSON()));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function upsertItemSupplierController(req, res, next) {
  try {
    const link = await upsertInventoryItemSupplier(
      req.params.itemId,
      req.params.supplierLinkId,
      req.body || {}
    );
    res.status(req.params.supplierLinkId ? 200 : 201).json(link.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteItemSupplierController(req, res, next) {
  try {
    await deleteInventoryItemSupplier(req.params.itemId, req.params.supplierLinkId);
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listItemMediaController(req, res, next) {
  try {
    const media = await listInventoryItemMedia(req.params.itemId);
    res.json(media.map((entry) => entry.toJSON()));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createItemMediaController(req, res, next) {
  try {
    const media = await createInventoryItemMedia(req.params.itemId, req.body || {});
    res.status(201).json(media.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateItemMediaController(req, res, next) {
  try {
    const media = await updateInventoryItemMedia(req.params.mediaId, req.body || {});
    res.json(media.toJSON());
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteItemMediaController(req, res, next) {
  try {
    const deleted = await deleteInventoryItemMedia(req.params.mediaId);
    if (!deleted) {
      res.status(404).json({ message: 'Inventory media not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listSuppliersDirectory(req, res, next) {
  try {
    const suppliers = await listInventorySuppliers({
      search: req.query.search,
      status: req.query.status
    });
    res.json(suppliers.map((supplier) => supplier.toJSON()));
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
