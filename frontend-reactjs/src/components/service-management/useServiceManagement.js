import { useCallback, useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' }
];

const VISIBILITY_OPTIONS = [
  { value: 'restricted', label: 'Restricted' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' }
];

const KIND_OPTIONS = [
  { value: 'standard', label: 'Standard listing' },
  { value: 'package', label: 'Bundled package' }
];

const INITIAL_CATEGORY_FORM = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  accentColour: '',
  parentId: '',
  ordering: 0,
  metadata: '{\n}',
  isActive: true
};

const INITIAL_LISTING_FORM = {
  title: '',
  slug: '',
  description: '',
  price: '',
  currency: 'GBP',
  status: 'draft',
  visibility: 'restricted',
  kind: 'standard',
  companyId: '',
  providerId: '',
  categoryId: '',
  heroImageUrl: '',
  coverage: '',
  tags: '',
  gallery: '',
  metadata: '{\n}'
};

function toInput(value) {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value;
}

function parseCommaList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMetadataInput(value) {
  if (!value || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // fallthrough handled below
  }

  throw new Error('Metadata must be a valid JSON object');
}

function parseGalleryInput(value) {
  if (!value || !value.trim()) {
    return [];
  }

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((entry) => {
      const [urlPart, ...altParts] = entry.split('|');
      const url = urlPart?.trim();
      if (!url) {
        return null;
      }
      const altText = altParts.join('|').trim();
      return { url, altText };
    })
    .filter(Boolean);
}

export function useServiceManagement(section) {
  const data = section?.data ?? {};
  const categories = data.categories ?? [];
  const listings = data.catalogue ?? [];
  const packages = data.packages ?? [];
  const health = data.health ?? [];
  const deliveryBoard = data.deliveryBoard ?? [];
  const alerts = data.alerts ?? null;
  const loading = Boolean(data.loading);
  const error = data.error ?? null;

  const [activeTab, setActiveTab] = useState('listings');
  const [categoryForm, setCategoryForm] = useState(() => ({ ...INITIAL_CATEGORY_FORM }));
  const [editingCategory, setEditingCategory] = useState(null);
  const [listingForm, setListingForm] = useState(() => ({ ...INITIAL_LISTING_FORM }));
  const [editingListing, setEditingListing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterKind, setFilterKind] = useState('all');
  const [formFeedback, setFormFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormFeedback(null);
  }, [activeTab]);

  useEffect(() => {
    if (filterCategory === 'all') {
      return;
    }
    const exists = categories.some((category) => category.id === filterCategory);
    if (!exists) {
      setFilterCategory('all');
    }
  }, [categories, filterCategory]);

  useEffect(() => {
    if (!editingCategory) {
      return;
    }
    const current = categories.find((category) => category.id === editingCategory.id);
    if (!current) {
      setEditingCategory(null);
      setCategoryForm({ ...INITIAL_CATEGORY_FORM });
    }
  }, [categories, editingCategory]);

  useEffect(() => {
    if (!editingListing) {
      return;
    }
    const current = listings.find((listing) => listing.id === editingListing.id);
    if (!current) {
      setEditingListing(null);
      setListingForm({ ...INITIAL_LISTING_FORM });
    }
  }, [listings, editingListing]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (filterStatus !== 'all' && listing.status !== filterStatus) {
        return false;
      }
      if (filterCategory !== 'all' && listing.categoryId !== filterCategory) {
        return false;
      }
      if (filterKind !== 'all' && listing.kind !== filterKind) {
        return false;
      }
      if (
        filterQuery &&
        !`${listing.title} ${listing.category ?? ''}`.toLowerCase().includes(filterQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [listings, filterStatus, filterCategory, filterKind, filterQuery]);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm({ ...INITIAL_CATEGORY_FORM });
    setEditingCategory(null);
  }, []);

  const resetListingForm = useCallback(() => {
    setListingForm({ ...INITIAL_LISTING_FORM });
    setEditingListing(null);
  }, []);

  const handleCategorySubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!data.onCreateCategory || !data.onUpdateCategory) return;

      setSubmitting(true);
      try {
        const metadata = parseMetadataInput(categoryForm.metadata);
        const payload = {
          name: categoryForm.name,
          slug: categoryForm.slug?.trim() || undefined,
          description: categoryForm.description?.trim() || undefined,
          icon: categoryForm.icon?.trim() || undefined,
          accentColour: categoryForm.accentColour?.trim() || undefined,
          parentId: categoryForm.parentId?.trim() || undefined,
          ordering: Number.isFinite(Number(categoryForm.ordering))
            ? Number(categoryForm.ordering)
            : undefined,
          isActive: Boolean(categoryForm.isActive),
          metadata
        };

        if (editingCategory) {
          await data.onUpdateCategory(editingCategory.id, payload);
          setFormFeedback({ type: 'success', message: 'Category updated' });
        } else {
          await data.onCreateCategory(payload);
          setFormFeedback({ type: 'success', message: 'Category created' });
        }
        resetCategoryForm();
      } catch (caught) {
        console.error('[ServiceManagement] category submission failed', caught);
        const message = caught?.message ?? 'Unable to save category';
        setFormFeedback({ type: 'error', message });
      } finally {
        setSubmitting(false);
      }
    },
    [data, editingCategory, categoryForm, resetCategoryForm]
  );

  const handleListingSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!data.onCreateListing || !data.onUpdateListing) return;

      const companyId = listingForm.companyId?.trim() ?? '';
      const providerId = listingForm.providerId?.trim() ?? '';
      const categoryId = listingForm.categoryId?.trim() ?? '';
      const heroImageUrl = listingForm.heroImageUrl?.trim() ?? '';

      let metadata;
      try {
        metadata = parseMetadataInput(listingForm.metadata);
      } catch (caught) {
        setFormFeedback({ type: 'error', message: caught.message });
        return;
      }

      const payload = {
        title: listingForm.title.trim(),
        slug: listingForm.slug?.trim() || undefined,
        description: listingForm.description?.trim() || undefined,
        price: listingForm.price ? Number.parseFloat(listingForm.price) : undefined,
        currency: listingForm.currency,
        status: listingForm.status,
        visibility: listingForm.visibility,
        kind: listingForm.kind,
        companyId: companyId || undefined,
        providerId: providerId || undefined,
        categoryId: categoryId || undefined,
        heroImageUrl: heroImageUrl || undefined,
        coverage: parseCommaList(listingForm.coverage),
        tags: parseCommaList(listingForm.tags),
        gallery: parseGalleryInput(listingForm.gallery),
        metadata
      };

      if (!payload.title || !payload.price) {
        setFormFeedback({ type: 'error', message: 'Title and price are required' });
        return;
      }

      if (!payload.companyId && !payload.providerId) {
        setFormFeedback({ type: 'error', message: 'Company ID or provider ID is required' });
        return;
      }

      setSubmitting(true);
      try {
        if (editingListing) {
          await data.onUpdateListing(editingListing.id, payload);
          setFormFeedback({ type: 'success', message: 'Listing updated' });
        } else {
          await data.onCreateListing(payload);
          setFormFeedback({ type: 'success', message: 'Listing created' });
        }
        resetListingForm();
      } catch (caught) {
        console.error('[ServiceManagement] listing submission failed', caught);
        setFormFeedback({ type: 'error', message: caught?.message ?? 'Unable to save listing' });
      } finally {
        setSubmitting(false);
      }
    },
    [data, editingListing, listingForm, resetListingForm]
  );

  const handleEditCategory = useCallback((category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug ?? '',
      description: category.description ?? '',
      icon: category.icon ?? '',
      accentColour: category.accentColour ?? '',
      parentId: category.parentId ?? '',
      ordering: Number.isFinite(Number(category.ordering)) ? Number(category.ordering) : 0,
      metadata: JSON.stringify(category.metadata ?? {}, null, 2),
      isActive: category.isActive ?? true
    });
    setActiveTab('categories');
  }, []);

  const handleArchiveCategory = useCallback(
    async (category) => {
      if (!data.onArchiveCategory) return;
      try {
        await data.onArchiveCategory(category.id);
        setFormFeedback({ type: 'success', message: `Archived ${category.name}` });
        if (editingCategory?.id === category.id) {
          resetCategoryForm();
        }
      } catch (caught) {
        console.error('[ServiceManagement] archive category failed', caught);
        setFormFeedback({ type: 'error', message: caught?.message ?? 'Unable to archive category' });
      }
    },
    [data, editingCategory, resetCategoryForm]
  );

  const handleEditListing = useCallback((listing) => {
    setEditingListing(listing);
    setActiveTab('listings');
    setListingForm({
      title: listing.title ?? '',
      slug: listing.slug ?? '',
      description: listing.description ?? '',
      price: listing.price != null ? String(listing.price) : '',
      currency: listing.currency ?? 'GBP',
      status: listing.status ?? 'draft',
      visibility: listing.visibility ?? 'restricted',
      kind: listing.kind ?? 'standard',
      companyId: listing.company?.id ?? '',
      providerId: listing.provider?.id ?? '',
      categoryId: listing.categoryId ?? '',
      heroImageUrl: listing.heroImageUrl ?? '',
      coverage: toInput(listing.coverage),
      tags: toInput(listing.tags),
      gallery: (listing.gallery ?? [])
        .map((item) => (item.altText ? `${item.url} | ${item.altText}` : item.url))
        .join('\n'),
      metadata: JSON.stringify(listing.metadata ?? {}, null, 2)
    });
  }, []);

  const handleListingStatusChange = useCallback(
    async (listing, nextStatus) => {
      if (!data.onUpdateListingStatus) return;
      try {
        await data.onUpdateListingStatus(listing.id, nextStatus);
        setFormFeedback({ type: 'success', message: `Listing marked ${nextStatus}` });
      } catch (caught) {
        console.error('[ServiceManagement] listing status change failed', caught);
        setFormFeedback({ type: 'error', message: caught?.message ?? 'Unable to update listing status' });
      }
    },
    [data]
  );

  const handleArchiveListing = useCallback(
    async (listing) => {
      if (!data.onArchiveListing) return;
      try {
        await data.onArchiveListing(listing.id);
        setFormFeedback({ type: 'success', message: 'Listing archived' });
        if (editingListing?.id === listing.id) {
          resetListingForm();
        }
      } catch (caught) {
        console.error('[ServiceManagement] archive listing failed', caught);
        setFormFeedback({ type: 'error', message: caught?.message ?? 'Unable to archive listing' });
      }
    },
    [data, editingListing, resetListingForm]
  );

  const beginCreatePackage = useCallback(() => {
    setActiveTab('listings');
    setEditingListing(null);
    setListingForm({
      ...INITIAL_LISTING_FORM,
      kind: 'package',
      status: 'draft'
    });
  }, []);

  return {
    categories,
    listings,
    packages,
    health,
    deliveryBoard,
    alerts,
    loading,
    error,
    activeTab,
    setActiveTab,
    categoryForm,
    setCategoryForm,
    editingCategory,
    listingForm,
    setListingForm,
    editingListing,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterQuery,
    setFilterQuery,
    filterKind,
    setFilterKind,
    formFeedback,
    setFormFeedback,
    submitting,
    handleCategorySubmit,
    handleListingSubmit,
    handleEditCategory,
    handleArchiveCategory,
    handleEditListing,
    handleListingStatusChange,
    handleArchiveListing,
    resetCategoryForm,
    resetListingForm,
    filteredListings,
    statusOptions: STATUS_OPTIONS,
    visibilityOptions: VISIBILITY_OPTIONS,
    kindOptions: KIND_OPTIONS,
    beginCreatePackage
  };
}

export const serviceFormInitialState = {
  category: { ...INITIAL_CATEGORY_FORM },
  listing: { ...INITIAL_LISTING_FORM }
};
