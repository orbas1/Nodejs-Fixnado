import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryAdjustment,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  listZones,
  createZone,
  updateZone,
  deleteZone,
  listSuppliers,
  listItemSuppliers,
  upsertItemSupplier,
  deleteItemSupplier,
  listItemMedia,
  createItemMedia,
  updateItemMedia,
  deleteItemMedia
} from '../../../api/providerInventoryClient.js';
import {
  createEmptyCategoryForm,
  createEmptyItemForm,
  createEmptyMediaForm,
  createEmptySupplierLinkForm,
  createEmptyTagForm,
  createEmptyZoneForm
} from '../constants.js';

function toItemForm(item) {
  const base = createEmptyItemForm();
  if (!item) {
    return base;
  }

  return {
    ...base,
    ...item,
    id: item.id ?? base.id,
    companyId: item.companyId ?? base.companyId,
    name: item.name ?? '',
    sku: item.sku ?? '',
    categoryId: item.categoryId ?? base.categoryId,
    category: item.categoryRef?.name ?? item.category ?? '',
    unitType: item.unitType ?? base.unitType,
    itemType: item.itemType ?? base.itemType,
    fulfilmentType: item.fulfilmentType ?? base.fulfilmentType,
    status: item.status ?? base.status,
    tagline: item.tagline ?? '',
    description: item.description ?? '',
    quantityOnHand: item.quantityOnHand != null ? String(item.quantityOnHand) : base.quantityOnHand,
    quantityReserved: item.quantityReserved != null ? String(item.quantityReserved) : base.quantityReserved,
    safetyStock: item.safetyStock != null ? String(item.safetyStock) : base.safetyStock,
    rentalRate: item.rentalRate != null ? String(item.rentalRate) : '',
    rentalRateCurrency: item.rentalRateCurrency ?? base.rentalRateCurrency,
    depositAmount: item.depositAmount != null ? String(item.depositAmount) : '',
    depositCurrency: item.depositCurrency ?? base.depositCurrency,
    purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : '',
    purchasePriceCurrency: item.purchasePriceCurrency ?? base.purchasePriceCurrency,
    replacementCost: item.replacementCost != null ? String(item.replacementCost) : '',
    insuranceRequired: Boolean(item.insuranceRequired),
    conditionRating: item.conditionRating ?? base.conditionRating,
    locationZoneId: item.locationZoneId ?? '',
    tagIds: Array.isArray(item.tags) ? item.tags.map((tag) => tag.id) : item.tagIds ?? [],
    primarySupplierId: item.primarySupplierId ?? base.primarySupplierId,
    metadata: item.metadata ?? {}
  };
}

function formatMetadataDraft(metadata) {
  try {
    return JSON.stringify(metadata ?? {}, null, 2);
  } catch (error) {
    console.warn('[useProviderInventoryState] Failed to stringify metadata', error);
    return '{}';
  }
}

function parseMetadataDraft(metadataDraft) {
  if (metadataDraft === undefined || metadataDraft === null || metadataDraft === '') {
    return {};
  }

  if (typeof metadataDraft !== 'string') {
    return metadataDraft;
  }

  try {
    const parsed = JSON.parse(metadataDraft);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    const parseError = new Error('Metadata must be valid JSON');
    parseError.cause = error;
    throw parseError;
  }
}

function buildItemStats(items = []) {
  return items.reduce(
    (accumulator, item) => {
      accumulator.total += 1;
      const statusKey = item.status ?? 'unknown';
      accumulator.byStatus[statusKey] = (accumulator.byStatus[statusKey] ?? 0) + 1;

      const typeKey = item.itemType ?? 'unknown';
      accumulator.byType[typeKey] = (accumulator.byType[typeKey] ?? 0) + 1;

      const available = (item.quantityOnHand ?? 0) - (item.quantityReserved ?? 0);
      accumulator.totalAvailable += available;

      const stockValue = (item.purchasePrice ?? 0) * (item.quantityOnHand ?? 0);
      if (Number.isFinite(stockValue)) {
        accumulator.estimatedStockValue += stockValue;
      }
      return accumulator;
    },
    {
      total: 0,
      totalAvailable: 0,
      estimatedStockValue: 0,
      byStatus: {},
      byType: {}
    }
  );
}

export function useProviderInventoryState() {
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [itemFilters, setItemFilters] = useState({
    search: '',
    status: 'all',
    itemType: 'all',
    fulfilmentType: 'all',
    category: 'all'
  });

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemForm, setItemForm] = useState(() => createEmptyItemForm());
  const [itemMetadataDraft, setItemMetadataDraft] = useState(() => formatMetadataDraft({}));
  const [itemSaving, setItemSaving] = useState(false);
  const [itemDeleting, setItemDeleting] = useState(false);
  const [itemDetailLoading, setItemDetailLoading] = useState(false);
  const [itemFeedback, setItemFeedback] = useState(null);
  const [itemError, setItemError] = useState(null);

  const [adjustmentForm, setAdjustmentForm] = useState({ type: 'increment', quantity: '', note: '' });
  const [adjustmentSaving, setAdjustmentSaving] = useState(false);
  const [adjustmentFeedback, setAdjustmentFeedback] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryForm, setCategoryForm] = useState(() => createEmptyCategoryForm());
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState(null);
  const [categoryError, setCategoryError] = useState(null);

  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagForm, setTagForm] = useState(() => createEmptyTagForm());
  const [tagSaving, setTagSaving] = useState(false);
  const [tagFeedback, setTagFeedback] = useState(null);
  const [tagError, setTagError] = useState(null);

  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zoneForm, setZoneForm] = useState(() => createEmptyZoneForm());
  const [zoneSaving, setZoneSaving] = useState(false);
  const [zoneFeedback, setZoneFeedback] = useState(null);
  const [zoneError, setZoneError] = useState(null);

  const [supplierDirectory, setSupplierDirectory] = useState([]);
  const [supplierDirectoryLoading, setSupplierDirectoryLoading] = useState(true);
  const [supplierDirectoryError, setSupplierDirectoryError] = useState(null);

  const [itemSupplierLinks, setItemSupplierLinks] = useState([]);
  const [supplierLinkForm, setSupplierLinkForm] = useState(() => createEmptySupplierLinkForm());
  const [supplierLinkSaving, setSupplierLinkSaving] = useState(false);
  const [supplierLinkFeedback, setSupplierLinkFeedback] = useState(null);
  const [supplierLinkError, setSupplierLinkError] = useState(null);

  const [itemMedia, setItemMedia] = useState([]);
  const [mediaForm, setMediaForm] = useState(() => createEmptyMediaForm());
  const [mediaSaving, setMediaSaving] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState(null);
  const [mediaError, setMediaError] = useState(null);

  const itemStats = useMemo(() => buildItemStats(items), [items]);

  const filteredItems = useMemo(() => {
    const selectedCategory =
      itemFilters.category && itemFilters.category !== 'all' && itemFilters.category !== 'uncategorised'
        ? categories.find((entry) => entry.id === itemFilters.category)
        : null;

    return items.filter((item) => {
      if (itemFilters.status !== 'all' && item.status !== itemFilters.status) {
        return false;
      }
      if (itemFilters.itemType !== 'all' && item.itemType !== itemFilters.itemType) {
        return false;
      }
      if (itemFilters.fulfilmentType !== 'all' && item.fulfilmentType !== itemFilters.fulfilmentType) {
        return false;
      }
      if (itemFilters.category !== 'all') {
        if (itemFilters.category === 'uncategorised') {
          const hasCategory = Boolean(
            item.categoryId || item.category || item.categoryRef?.id || item.categoryRef?.name
          );
          if (hasCategory) {
            return false;
          }
        } else {
          const matchById =
            item.categoryId === itemFilters.category || item.categoryRef?.id === itemFilters.category;
          const matchByName = selectedCategory?.name
            ? (item.category ?? '').toLowerCase() === selectedCategory.name.toLowerCase()
            : false;
          if (!matchById && !matchByName) {
            return false;
          }
        }
      }
      if (itemFilters.search) {
        const keyword = itemFilters.search.toLowerCase();
        const haystack = `${item.name} ${item.sku} ${item.tagline ?? ''} ${item.category ?? ''}`.toLowerCase();
        if (!haystack.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }, [categories, itemFilters, items]);

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const params = {
        search: itemFilters.search || undefined,
        includeRelations: true
      };

      if (itemFilters.category !== 'all') {
        if (itemFilters.category === 'uncategorised') {
          params.category = 'uncategorised';
        } else if (typeof itemFilters.category === 'string' && /^[0-9a-fA-F-]{36}$/.test(itemFilters.category)) {
          params.categoryId = itemFilters.category;
        } else {
          params.category = itemFilters.category;
        }
      }

      const response = await listInventoryItems(params);
      setItems(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to load inventory items', error);
      setItemsError(error?.message ?? 'Unable to load inventory items');
    } finally {
      setItemsLoading(false);
    }
  }, [itemFilters.search, itemFilters.category]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const response = await listCategories();
      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to load categories', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadTags = useCallback(async () => {
    setTagsLoading(true);
    try {
      const response = await listTags();
      setTags(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to load tags', error);
    } finally {
      setTagsLoading(false);
    }
  }, []);

  const loadZones = useCallback(async () => {
    setZonesLoading(true);
    try {
      const response = await listZones();
      setZones(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to load zones', error);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  const loadSupplierDirectory = useCallback(async () => {
    setSupplierDirectoryLoading(true);
    setSupplierDirectoryError(null);
    try {
      const response = await listSuppliers();
      setSupplierDirectory(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to load suppliers', error);
      setSupplierDirectoryError(error?.message ?? 'Unable to load supplier directory');
    } finally {
      setSupplierDirectoryLoading(false);
    }
  }, []);

  const refreshItemAssociations = useCallback(
    async (itemId) => {
      if (!itemId) {
        setItemSupplierLinks([]);
        setItemMedia([]);
        return;
      }
      try {
        const [suppliersResponse, mediaResponse] = await Promise.all([
          listItemSuppliers(itemId),
          listItemMedia(itemId)
        ]);
        setItemSupplierLinks(Array.isArray(suppliersResponse) ? suppliersResponse : suppliersResponse?.data ?? []);
        setItemMedia(Array.isArray(mediaResponse) ? mediaResponse : mediaResponse?.data ?? []);
      } catch (error) {
        console.error('[useProviderInventoryState] Failed to refresh item associations', error);
      }
    },
    []
  );

  const refreshItemDetail = useCallback(
    async (itemId) => {
      if (!itemId) {
        setSelectedItemId(null);
        setSelectedItem(null);
        setItemForm(createEmptyItemForm());
        setItemMetadataDraft(formatMetadataDraft({}));
        setItemFeedback(null);
        setItemError(null);
        setAdjustmentForm({ type: 'increment', quantity: '', note: '' });
        setAdjustmentFeedback(null);
        setItemSupplierLinks([]);
        setItemMedia([]);
        return;
      }

      setItemDetailLoading(true);
      setItemError(null);
      try {
        const response = await getInventoryItem(itemId, { includeRelations: true });
        setSelectedItem(response ?? null);
        setItemForm(toItemForm(response));
        setItemMetadataDraft(formatMetadataDraft(response?.metadata ?? {}));
        setAdjustmentForm({ type: 'increment', quantity: '', note: '' });
        setItemSupplierLinks(response?.supplierLinks ?? []);
        setItemMedia(response?.media ?? []);
      } catch (error) {
        console.error('[useProviderInventoryState] Failed to load inventory item', error);
        setItemError(error?.message ?? 'Unable to load inventory item');
      } finally {
        setItemDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    loadCategories();
    loadTags();
    loadZones();
    loadSupplierDirectory();
  }, [loadCategories, loadTags, loadZones, loadSupplierDirectory]);

  useEffect(() => {
    if (selectedItemId) {
      refreshItemDetail(selectedItemId);
    }
  }, [selectedItemId, refreshItemDetail]);

  const handleItemFilterChange = useCallback((name, value) => {
    setItemFilters((current) => ({ ...current, [name]: value }));
  }, []);

  const handleItemSearchChange = useCallback((event) => {
    handleItemFilterChange('search', event.target.value);
  }, [handleItemFilterChange]);

  const handleItemSearchSubmit = useCallback((event) => {
    event.preventDefault();
    loadItems();
  }, [loadItems]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setItemFeedback(null);
    setItemError(null);
  }, []);

  const handleItemFieldChange = useCallback((field, value) => {
    setItemForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleItemTagToggle = useCallback((tagId) => {
    setItemForm((current) => {
      const exists = current.tagIds.includes(tagId);
      return {
        ...current,
        tagIds: exists ? current.tagIds.filter((id) => id !== tagId) : [...current.tagIds, tagId]
      };
    });
  }, []);

  const handleItemMetadataChange = useCallback((value) => {
    setItemMetadataDraft(value);
  }, []);

  const resetItemForm = useCallback(() => {
    setSelectedItemId(null);
    setSelectedItem(null);
    setItemForm(createEmptyItemForm());
    setItemMetadataDraft(formatMetadataDraft({}));
    setItemFeedback(null);
    setItemError(null);
    setItemSupplierLinks([]);
    setItemMedia([]);
  }, []);

  const handleItemSubmit = useCallback(async () => {
    setItemSaving(true);
    setItemFeedback(null);
    setItemError(null);
    try {
      const metadata = parseMetadataDraft(itemMetadataDraft);
      const payload = { ...itemForm, metadata, tagIds: itemForm.tagIds };
      const response = itemForm.id
        ? await updateInventoryItem(itemForm.id, payload)
        : await createInventoryItem(payload);

      setItemFeedback(itemForm.id ? 'Inventory item updated' : 'Inventory item created');
      const newId = response?.id ?? itemForm.id;
      setSelectedItemId(newId ?? null);
      setSelectedItem(response ?? null);
      setItemForm(toItemForm(response));
      setItemMetadataDraft(formatMetadataDraft(response?.metadata ?? metadata));
      setItemSupplierLinks(response?.supplierLinks ?? itemSupplierLinks);
      setItemMedia(response?.media ?? itemMedia);
      await loadItems();
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to save inventory item', error);
      setItemError(error?.message ?? 'Unable to save inventory item');
    } finally {
      setItemSaving(false);
    }
  }, [itemForm, itemMetadataDraft, itemSupplierLinks, itemMedia, loadItems]);

  const handleItemDelete = useCallback(async () => {
    if (!itemForm.id) {
      return;
    }
    setItemDeleting(true);
    setItemError(null);
    try {
      await deleteInventoryItem(itemForm.id);
      setItemFeedback('Inventory item deleted');
      resetItemForm();
      await loadItems();
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to delete inventory item', error);
      setItemError(error?.message ?? 'Unable to delete inventory item');
    } finally {
      setItemDeleting(false);
    }
  }, [itemForm.id, loadItems, resetItemForm]);

  const handleAdjustmentFieldChange = useCallback((field, value) => {
    setAdjustmentForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleAdjustmentSubmit = useCallback(async () => {
    if (!itemForm.id) {
      setAdjustmentFeedback('Select an inventory item before recording movement');
      return;
    }
    setAdjustmentSaving(true);
    setAdjustmentFeedback(null);
    try {
      await createInventoryAdjustment(itemForm.id, {
        type: adjustmentForm.type,
        quantity: adjustmentForm.quantity,
        note: adjustmentForm.note
      });
      setAdjustmentFeedback('Inventory movement recorded');
      setAdjustmentForm({ type: 'increment', quantity: '', note: '' });
      await Promise.all([refreshItemDetail(itemForm.id), loadItems()]);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to create inventory adjustment', error);
      setAdjustmentFeedback(error?.message ?? 'Unable to record inventory movement');
    } finally {
      setAdjustmentSaving(false);
    }
  }, [itemForm.id, adjustmentForm, refreshItemDetail, loadItems]);

  const handleCategoryFieldChange = useCallback((field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleCategoryEdit = useCallback((category) => {
    setCategoryForm(category ? { ...createEmptyCategoryForm(), ...category } : createEmptyCategoryForm());
    setCategoryFeedback(null);
    setCategoryError(null);
  }, []);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm(createEmptyCategoryForm());
    setCategoryFeedback(null);
    setCategoryError(null);
  }, []);

  const handleCategorySubmit = useCallback(async () => {
    setCategorySaving(true);
    setCategoryFeedback(null);
    setCategoryError(null);
    try {
      const payload = { ...categoryForm };
      if (payload.id) {
        await updateCategory(payload.id, payload);
        setCategoryFeedback('Category updated');
      } else {
        await createCategory(payload);
        setCategoryFeedback('Category created');
      }
      await loadCategories();
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to save category', error);
      setCategoryError(error?.message ?? 'Unable to save category');
    } finally {
      setCategorySaving(false);
    }
  }, [categoryForm, loadCategories]);

  const handleCategoryDelete = useCallback(
    async (categoryId) => {
      if (!categoryId) {
        return;
      }
      try {
        await deleteCategory(categoryId);
        await loadCategories();
        if (itemForm.categoryId === categoryId) {
          setItemForm((current) => ({ ...current, categoryId: '', category: '' }));
        }
      } catch (error) {
        console.error('[useProviderInventoryState] Failed to delete category', error);
        setCategoryError(error?.message ?? 'Unable to delete category');
      }
    },
    [itemForm.categoryId, loadCategories]
  );

  const handleTagFieldChange = useCallback((field, value) => {
    setTagForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleTagEdit = useCallback((tag) => {
    setTagForm(tag ? { ...createEmptyTagForm(), ...tag } : createEmptyTagForm());
    setTagFeedback(null);
    setTagError(null);
  }, []);

  const resetTagForm = useCallback(() => {
    setTagForm(createEmptyTagForm());
    setTagFeedback(null);
    setTagError(null);
  }, []);

  const handleTagSubmit = useCallback(async () => {
    setTagSaving(true);
    setTagFeedback(null);
    setTagError(null);
    try {
      const payload = { ...tagForm };
      if (payload.id) {
        await updateTag(payload.id, payload);
        setTagFeedback('Tag updated');
      } else {
        await createTag(payload);
        setTagFeedback('Tag created');
      }
      await loadTags();
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to save tag', error);
      setTagError(error?.message ?? 'Unable to save tag');
    } finally {
      setTagSaving(false);
    }
  }, [tagForm, loadTags]);

  const handleTagDelete = useCallback(
    async (tagId) => {
      if (!tagId) {
        return;
      }
      try {
        await deleteTag(tagId);
        await loadTags();
        setItemForm((current) => ({
          ...current,
          tagIds: current.tagIds.filter((currentTagId) => currentTagId !== tagId)
        }));
      } catch (error) {
        console.error('[useProviderInventoryState] Failed to delete tag', error);
        setTagError(error?.message ?? 'Unable to delete tag');
      }
    },
    [loadTags]
  );

  const handleZoneFieldChange = useCallback((field, value) => {
    setZoneForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleZoneEdit = useCallback((zone) => {
    setZoneForm(zone ? { ...createEmptyZoneForm(), ...zone } : createEmptyZoneForm());
    setZoneFeedback(null);
    setZoneError(null);
  }, []);

  const resetZoneForm = useCallback(() => {
    setZoneForm(createEmptyZoneForm());
    setZoneFeedback(null);
    setZoneError(null);
  }, []);

  const handleZoneSubmit = useCallback(async () => {
    setZoneSaving(true);
    setZoneFeedback(null);
    setZoneError(null);
    try {
      const payload = { ...zoneForm };
      if (payload.id) {
        await updateZone(payload.id, payload);
        setZoneFeedback('Zone updated');
      } else {
        await createZone(payload);
        setZoneFeedback('Zone created');
      }
      await loadZones();
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to save zone', error);
      setZoneError(error?.message ?? 'Unable to save zone');
    } finally {
      setZoneSaving(false);
    }
  }, [zoneForm, loadZones]);

  const handleZoneDelete = useCallback(
    async (zoneId) => {
      if (!zoneId) {
        return;
      }
      try {
        await deleteZone(zoneId);
        await loadZones();
        if (itemForm.locationZoneId === zoneId) {
          setItemForm((current) => ({ ...current, locationZoneId: '' }));
        }
      } catch (error) {
        console.error('[useProviderInventoryState] Failed to delete zone', error);
        setZoneError(error?.message ?? 'Unable to delete zone');
      }
    },
    [itemForm.locationZoneId, loadZones]
  );

  const handleSupplierLinkFieldChange = useCallback((field, value) => {
    setSupplierLinkForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSupplierLinkEdit = useCallback((link) => {
    setSupplierLinkForm(link ? { ...createEmptySupplierLinkForm(), ...link } : createEmptySupplierLinkForm());
    setSupplierLinkFeedback(null);
    setSupplierLinkError(null);
  }, []);

  const resetSupplierLinkForm = useCallback(() => {
    setSupplierLinkForm(createEmptySupplierLinkForm());
    setSupplierLinkFeedback(null);
    setSupplierLinkError(null);
  }, []);

  const handleSupplierLinkSubmit = useCallback(async () => {
    if (!itemForm.id) {
      setSupplierLinkError('Select an inventory item before linking suppliers');
      return;
    }
    setSupplierLinkSaving(true);
    setSupplierLinkFeedback(null);
    setSupplierLinkError(null);
    try {
      await upsertItemSupplier(itemForm.id, supplierLinkForm);
      setSupplierLinkFeedback(supplierLinkForm.id ? 'Supplier link updated' : 'Supplier linked');
      resetSupplierLinkForm();
      await refreshItemAssociations(itemForm.id);
      await refreshItemDetail(itemForm.id);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to save supplier link', error);
      setSupplierLinkError(error?.message ?? 'Unable to save supplier link');
    } finally {
      setSupplierLinkSaving(false);
    }
  }, [itemForm.id, supplierLinkForm, refreshItemAssociations, refreshItemDetail, resetSupplierLinkForm]);

  const handleSupplierLinkDelete = useCallback(
    async (linkId) => {
      if (!itemForm.id || !linkId) {
        return;
      }
      try {
        await deleteItemSupplier(itemForm.id, linkId);
        setSupplierLinkFeedback('Supplier link removed');
        await refreshItemAssociations(itemForm.id);
        await refreshItemDetail(itemForm.id);
      } catch (error) {
        console.error('[useProviderInventoryState] Failed to delete supplier link', error);
        setSupplierLinkError(error?.message ?? 'Unable to delete supplier link');
      }
    },
    [itemForm.id, refreshItemAssociations, refreshItemDetail]
  );

  const handleMediaFieldChange = useCallback((field, value) => {
    setMediaForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleMediaEdit = useCallback((media) => {
    setMediaForm(media ? { ...createEmptyMediaForm(), ...media } : createEmptyMediaForm());
    setMediaFeedback(null);
    setMediaError(null);
  }, []);

  const resetMediaForm = useCallback(() => {
    setMediaForm(createEmptyMediaForm());
    setMediaFeedback(null);
    setMediaError(null);
  }, []);

  const handleMediaSubmit = useCallback(async () => {
    if (!itemForm.id) {
      setMediaError('Select an inventory item before managing media');
      return;
    }
    setMediaSaving(true);
    setMediaFeedback(null);
    setMediaError(null);
    try {
      if (mediaForm.id) {
        await updateItemMedia(itemForm.id, mediaForm.id, mediaForm);
        setMediaFeedback('Media updated');
      } else {
        await createItemMedia(itemForm.id, mediaForm);
        setMediaFeedback('Media added');
      }
      resetMediaForm();
      await refreshItemAssociations(itemForm.id);
      await refreshItemDetail(itemForm.id);
    } catch (error) {
      console.error('[useProviderInventoryState] Failed to save media', error);
      setMediaError(error?.message ?? 'Unable to save media');
    } finally {
      setMediaSaving(false);
    }
  }, [itemForm.id, mediaForm, refreshItemAssociations, refreshItemDetail, resetMediaForm]);

  const handleMediaDelete = useCallback(
    async (mediaId) => {
      if (!itemForm.id || !mediaId) {
        return;
      }
      try {
        await deleteItemMedia(itemForm.id, mediaId);
        setMediaFeedback('Media removed');
        await refreshItemAssociations(itemForm.id);
        await refreshItemDetail(itemForm.id);
      } catch (error) {
        console.error('[useProviderInventoryState] Failed to delete media', error);
        setMediaError(error?.message ?? 'Unable to delete media');
      }
    },
    [itemForm.id, refreshItemAssociations, refreshItemDetail]
  );

  return {
    data: {
      items,
      filteredItems,
      itemsLoading,
      itemsError,
      itemFilters,
      selectedItem,
      itemForm,
      itemMetadataDraft,
      itemSaving,
      itemDeleting,
      itemDetailLoading,
      itemFeedback,
      itemError,
      itemStats,
      adjustmentForm,
      adjustmentSaving,
      adjustmentFeedback,
      categories,
      categoriesLoading,
      categoryForm,
      categorySaving,
      categoryFeedback,
      categoryError,
      tags,
      tagsLoading,
      tagForm,
      tagSaving,
      tagFeedback,
      tagError,
      zones,
      zonesLoading,
      zoneForm,
      zoneSaving,
      zoneFeedback,
      zoneError,
      supplierDirectory,
      supplierDirectoryLoading,
      supplierDirectoryError,
      itemSupplierLinks,
      supplierLinkForm,
      supplierLinkSaving,
      supplierLinkFeedback,
      supplierLinkError,
      itemMedia,
      mediaForm,
      mediaSaving,
      mediaFeedback,
      mediaError
    },
    actions: {
      loadItems,
      handleItemFilterChange,
      handleItemSearchChange,
      handleItemSearchSubmit,
      handleSelectItem,
      handleItemFieldChange,
      handleItemTagToggle,
      handleItemMetadataChange,
      handleItemSubmit,
      handleItemDelete,
      resetItemForm,
      handleAdjustmentFieldChange,
      handleAdjustmentSubmit,
      handleCategoryFieldChange,
      handleCategoryEdit,
      resetCategoryForm,
      handleCategorySubmit,
      handleCategoryDelete,
      handleTagFieldChange,
      handleTagEdit,
      resetTagForm,
      handleTagSubmit,
      handleTagDelete,
      handleZoneFieldChange,
      handleZoneEdit,
      resetZoneForm,
      handleZoneSubmit,
      handleZoneDelete,
      handleSupplierLinkFieldChange,
      handleSupplierLinkEdit,
      resetSupplierLinkForm,
      handleSupplierLinkSubmit,
      handleSupplierLinkDelete,
      handleMediaFieldChange,
      handleMediaEdit,
      resetMediaForm,
      handleMediaSubmit,
      handleMediaDelete,
      refreshItemDetail,
      refreshItemAssociations,
      loadCategories,
      loadTags,
      loadZones,
      loadSupplierDirectory
    }
  };
}

export default useProviderInventoryState;
