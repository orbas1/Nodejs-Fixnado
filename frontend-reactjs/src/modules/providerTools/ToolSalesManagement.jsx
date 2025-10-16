import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import FormField from '../../components/ui/FormField.jsx';
import TextInput from '../../components/ui/TextInput.jsx';
import TextArea from '../../components/ui/TextArea.jsx';
import Select from '../../components/ui/Select.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import {
  getProviderToolSales,
  createProviderToolSale,
  updateProviderToolSale,
  deleteProviderToolSale,
  createProviderToolSaleCoupon,
  updateProviderToolSaleCoupon,
  deleteProviderToolSaleCoupon
} from '../../api/panelClient.js';

const defaultListingForm = {
  name: '',
  sku: '',
  category: '',
  tagline: '',
  shortDescription: '',
  longDescription: '',
  heroImageUrl: '',
  showcaseVideoUrl: '',
  galleryImages: '',
  tags: '',
  keywordTags: '',
  quantityOnHand: 0,
  quantityReserved: 0,
  safetyStock: 0,
  purchasePrice: '',
  pricePerDay: '',
  availability: 'buy',
  status: 'draft',
  insuredOnly: false
};

const defaultCouponForm = {
  name: '',
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  status: 'draft',
  autoApply: false
};

function toListInput(values) {
  if (!Array.isArray(values)) {
    return '';
  }
  return values.filter(Boolean).join(', ');
}

function toArrayFromInput(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toGalleryArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatCurrency(amount) {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount);
  } catch (error) {
    return `£${amount}`;
  }
}

function buildListingPayload(form) {
  return {
    name: form.name?.trim() || undefined,
    sku: form.sku?.trim() || undefined,
    category: form.category?.trim() || undefined,
    tagline: form.tagline?.trim() || undefined,
    shortDescription: form.shortDescription?.trim() || undefined,
    longDescription: form.longDescription?.trim() || undefined,
    heroImageUrl: form.heroImageUrl?.trim() || undefined,
    showcaseVideoUrl: form.showcaseVideoUrl?.trim() || undefined,
    galleryImages: toGalleryArray(form.galleryImages),
    tags: toArrayFromInput(form.tags),
    keywordTags: toArrayFromInput(form.keywordTags),
    quantityOnHand: Number.isFinite(Number(form.quantityOnHand)) ? Number(form.quantityOnHand) : undefined,
    quantityReserved: Number.isFinite(Number(form.quantityReserved)) ? Number(form.quantityReserved) : undefined,
    safetyStock: Number.isFinite(Number(form.safetyStock)) ? Number(form.safetyStock) : undefined,
    purchasePrice: form.purchasePrice !== '' && form.purchasePrice != null ? Number(form.purchasePrice) : undefined,
    pricePerDay: form.pricePerDay !== '' && form.pricePerDay != null ? Number(form.pricePerDay) : undefined,
    availability: form.availability,
    status: form.status,
    insuredOnly: Boolean(form.insuredOnly)
  };
}

function buildCouponPayload(form) {
  return {
    name: form.name?.trim() || undefined,
    code: form.code?.trim() || undefined,
    discountType: form.discountType,
    discountValue: Number.isFinite(Number(form.discountValue)) ? Number(form.discountValue) : undefined,
    status: form.status,
    autoApply: Boolean(form.autoApply)
  };
}

function mapListingToForm(listing) {
  return {
    name: listing?.name || '',
    sku: listing?.inventory?.sku || '',
    category: listing?.inventory?.category || '',
    tagline: listing?.tagline || '',
    shortDescription: listing?.description || '',
    longDescription: listing?.description || '',
    heroImageUrl: listing?.heroImageUrl || '',
    showcaseVideoUrl: listing?.showcaseVideoUrl || '',
    galleryImages: toListInput(listing?.galleryImages),
    tags: toListInput(listing?.tags),
    keywordTags: toListInput(listing?.keywordTags),
    quantityOnHand: listing?.inventory?.quantityOnHand ?? 0,
    quantityReserved: listing?.inventory?.quantityReserved ?? 0,
    safetyStock: listing?.inventory?.safetyStock ?? 0,
    purchasePrice: listing?.listing?.purchasePrice ?? '',
    pricePerDay: listing?.listing?.pricePerDay ?? '',
    availability: listing?.listing?.availability || 'buy',
    status: listing?.listing?.status || 'draft',
    insuredOnly: listing?.listing?.insuredOnly ?? false
  };
}

function ToolSalesManagement({ initialData }) {
  const [state, setState] = useState(() => ({
    loading: !initialData,
    data:
      initialData ?? {
        summary: { totalListings: 0, draft: 0, published: 0, suspended: 0, totalQuantity: 0, activeCoupons: 0 },
        listings: []
      },
    error: null
  }));
  const [statusMessage, setStatusMessage] = useState('');
  const [listingModal, setListingModal] = useState({ open: false, mode: 'create', listingId: null });
  const [listingForm, setListingForm] = useState(defaultListingForm);
  const [savingListing, setSavingListing] = useState(false);
  const [couponModal, setCouponModal] = useState({ open: false, listingId: null, couponId: null });
  const [couponForm, setCouponForm] = useState(defaultCouponForm);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [deletingListing, setDeletingListing] = useState(null);

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      setState((current) => ({ ...current, loading: current.loading || force, error: force ? null : current.error }));
      try {
        const result = await getProviderToolSales({ forceRefresh: force });
        setState({ loading: false, data: result.data, error: null });
      } catch (error) {
        setState((current) => ({ ...current, loading: false, error }));
      }
    },
    []
  );

  useEffect(() => {
    if (!initialData) {
      refresh();
      return;
    }

    setState((current) => {
      if (current.data === initialData && !current.loading && !current.error) {
        return current;
      }
      return { loading: false, data: initialData, error: null };
    });
  }, [initialData, refresh]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const listings = state.data.listings ?? [];
  const summary = state.data.summary ?? {};

  const summaryCards = useMemo(
    () => [
      { label: 'Total listings', value: summary.totalListings ?? 0 },
      { label: 'Published', value: summary.published ?? 0 },
      { label: 'Draft', value: summary.draft ?? 0 },
      { label: 'Quantity on hand', value: summary.totalQuantity ?? 0 }
    ],
    [summary]
  );

  const openCreateModal = () => {
    setListingForm(defaultListingForm);
    setListingModal({ open: true, mode: 'create', listingId: null });
  };

  const openEditModal = (listing) => {
    setListingForm(mapListingToForm(listing));
    setListingModal({ open: true, mode: 'edit', listingId: listing.id });
  };

  const closeListingModal = () => {
    setListingModal({ open: false, mode: 'create', listingId: null });
    setListingForm(defaultListingForm);
  };

  const handleListingFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setListingForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmitListing = async (event) => {
    event.preventDefault();
    setSavingListing(true);
    try {
      const payload = buildListingPayload(listingForm);
      if (listingModal.mode === 'create') {
        await createProviderToolSale(payload);
        setStatusMessage('Tool listing created successfully.');
      } else {
        await updateProviderToolSale(listingModal.listingId, payload);
        setStatusMessage('Tool listing updated successfully.');
      }
      closeListingModal();
      await refresh({ force: true });
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to save tool listing.');
    } finally {
      setSavingListing(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Remove this tool listing? This will hide it from the marketplace.')) {
      return;
    }
    setDeletingListing(listingId);
    try {
      await deleteProviderToolSale(listingId);
      setStatusMessage('Tool listing removed.');
      await refresh({ force: true });
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to remove tool listing.');
    } finally {
      setDeletingListing(null);
    }
  };

  const openCouponManager = (listing, coupon = null) => {
    setCouponForm({
      name: coupon?.name || '',
      code: coupon?.code || '',
      discountType: coupon?.discountType || 'percentage',
      discountValue: coupon?.discountValue ?? 10,
      status: coupon?.status || 'draft',
      autoApply: Boolean(coupon?.autoApply)
    });
    setCouponModal({ open: true, listingId: listing.id, couponId: coupon?.id || null });
  };

  const closeCouponModal = () => {
    setCouponModal({ open: false, listingId: null, couponId: null });
    setCouponForm(defaultCouponForm);
  };

  const handleCouponFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCouponForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmitCoupon = async (event) => {
    event.preventDefault();
    setSavingCoupon(true);
    try {
      const payload = buildCouponPayload(couponForm);
      if (couponModal.couponId) {
        await updateProviderToolSaleCoupon(couponModal.listingId, couponModal.couponId, payload);
        setStatusMessage('Coupon updated successfully.');
      } else {
        await createProviderToolSaleCoupon(couponModal.listingId, payload);
        setStatusMessage('Coupon created successfully.');
      }
      closeCouponModal();
      await refresh({ force: true });
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to save coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (listingId, couponId) => {
    if (!window.confirm('Remove this coupon? Existing redemptions will no longer be available.')) {
      return;
    }
    setSavingCoupon(true);
    try {
      await deleteProviderToolSaleCoupon(listingId, couponId);
      setStatusMessage('Coupon removed.');
      await refresh({ force: true });
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to remove coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Provider / SME control centre</p>
          <h2 className="text-2xl font-semibold text-primary">Tool sale management</h2>
          <p className="text-sm text-slate-600">
            Manage marketplace-ready tool listings, multimedia assets, pricing, and launch-ready coupons. Updates apply instantly
            across the provider dashboard and storefront surfaces.
          </p>
          {statusMessage ? <p className="text-sm font-medium text-emerald-600">{statusMessage}</p> : null}
        </div>
        <Button variant="primary" size="md" onClick={openCreateModal} data-qa="tool-sales-create">
          Create tool listing
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{card.value}</p>
          </article>
        ))}
      </div>

      {state.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : state.error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5">
          <p className="text-sm font-semibold text-rose-600">Unable to load tool sales</p>
          <p className="mt-1 text-xs text-rose-500">{state.error.message || 'Please retry shortly.'}</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => refresh({ force: true })}>
              Retry
            </Button>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-600">
          <p className="font-semibold text-primary">No tool listings yet</p>
          <p className="mt-2">
            Launch your first tool listing with imagery, showcase copy, and pricing to unlock marketplace visibility and storefront
            merchandising.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={openCreateModal}>
              Add your first tool listing
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => {
            const statusTone = listing.listing?.status === 'approved' ? 'success' : listing.listing?.status === 'suspended' ? 'danger' : 'info';
            const quantityLabel = `${listing.metrics.quantityAvailable} available / ${listing.inventory.quantityOnHand} on hand`;

            return (
              <article
                key={listing.id}
                className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:border-primary/40"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    {listing.heroImageUrl ? (
                      <img
                        src={listing.heroImageUrl}
                        alt={listing.name}
                        className="h-32 w-32 rounded-2xl object-cover shadow-sm"
                      />
                    ) : null}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-primary">{listing.name}</h3>
                        <StatusPill tone={statusTone}>
                          {listing.listing?.status ? listing.listing.status.replace(/_/g, ' ') : 'Draft'}
                        </StatusPill>
                      </div>
                      {listing.tagline ? <p className="text-sm text-slate-600">{listing.tagline}</p> : null}
                      {listing.description ? (
                        <p className="text-sm text-slate-500">{listing.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{quantityLabel}</span>
                        {listing.listing?.pricePerDay != null ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                            Daily {formatCurrency(listing.listing.pricePerDay)}
                          </span>
                        ) : null}
                        {listing.listing?.purchasePrice != null ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                            Purchase {formatCurrency(listing.listing.purchasePrice)}
                          </span>
                        ) : null}
                      </div>
                      {listing.tags?.length ? (
                        <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-primary/70">
                          {listing.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-primary/5 px-3 py-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {listing.keywordTags?.length ? (
                        <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                          {listing.keywordTags.map((tag) => (
                            <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => openEditModal(listing)}>
                      Edit details
                    </Button>
                    <Button variant="ghost" onClick={() => openCouponManager(listing)}>
                      Manage coupons ({listing.coupons.length})
                    </Button>
                    {listing.showcaseVideoUrl ? (
                      <Button
                        variant="ghost"
                        href={listing.showcaseVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch showcase
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      loading={deletingListing === listing.id}
                      onClick={() => handleDeleteListing(listing.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {listing.galleryImages?.length ? (
                  <div className="flex flex-wrap gap-3">
                    {listing.galleryImages.map((image) => (
                      <img key={image} src={image} alt="Gallery" className="h-16 w-16 rounded-xl object-cover" />
                    ))}
                  </div>
                ) : null}
                {listing.coupons.length ? (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">Active incentives</p>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {listing.coupons.map((coupon) => (
                        <li key={coupon.id} className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-primary">{coupon.name}</p>
                            <p className="text-xs text-slate-500">Code: {coupon.code || 'Auto-applied'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill tone={coupon.status === 'active' ? 'success' : coupon.status === 'archived' ? 'neutral' : 'info'}>
                              {coupon.status}
                            </StatusPill>
                            <Button variant="ghost" size="sm" onClick={() => openCouponManager(listing, coupon)}>
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCoupon(listing.id, coupon.id)}
                              disabled={savingCoupon}
                            >
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={listingModal.open}
        onClose={closeListingModal}
        title={listingModal.mode === 'create' ? 'Create tool listing' : 'Edit tool listing'}
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={closeListingModal} disabled={savingListing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitListing} loading={savingListing}>
              {listingModal.mode === 'create' ? 'Create listing' : 'Save changes'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmitListing}>
          <FormField id="tool-name" label="Name">
            <TextInput id="tool-name" name="name" value={listingForm.name} onChange={handleListingFormChange} required />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tool-sku" label="SKU">
              <TextInput id="tool-sku" name="sku" value={listingForm.sku} onChange={handleListingFormChange} required />
            </FormField>
            <FormField id="tool-category" label="Category">
              <TextInput id="tool-category" name="category" value={listingForm.category} onChange={handleListingFormChange} />
            </FormField>
          </div>
          <FormField id="tool-tagline" label="Tagline" optionalLabel="Optional">
            <TextInput id="tool-tagline" name="tagline" value={listingForm.tagline} onChange={handleListingFormChange} />
          </FormField>
          <FormField id="tool-short" label="Short description" optionalLabel="Optional">
            <TextArea
              id="tool-short"
              name="shortDescription"
              value={listingForm.shortDescription}
              onChange={handleListingFormChange}
              rows={2}
            />
          </FormField>
          <FormField id="tool-long" label="Detailed description" optionalLabel="Optional">
            <TextArea
              id="tool-long"
              name="longDescription"
              value={listingForm.longDescription}
              onChange={handleListingFormChange}
              rows={4}
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tool-hero" label="Hero image URL" optionalLabel="Optional">
              <TextInput id="tool-hero" name="heroImageUrl" value={listingForm.heroImageUrl} onChange={handleListingFormChange} />
            </FormField>
            <FormField id="tool-video" label="Showcase video URL" optionalLabel="Optional">
              <TextInput
                id="tool-video"
                name="showcaseVideoUrl"
                value={listingForm.showcaseVideoUrl}
                onChange={handleListingFormChange}
              />
            </FormField>
          </div>
          <FormField
            id="tool-gallery"
            label="Gallery image URLs"
            hint="Separate multiple URLs with commas or new lines."
            optionalLabel="Optional"
          >
            <TextArea
              id="tool-gallery"
              name="galleryImages"
              value={listingForm.galleryImages}
              onChange={handleListingFormChange}
              rows={3}
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tool-tags" label="Tags" hint="Comma separated" optionalLabel="Optional">
              <TextInput id="tool-tags" name="tags" value={listingForm.tags} onChange={handleListingFormChange} />
            </FormField>
            <FormField id="tool-keywords" label="Keyword tags" hint="Comma separated" optionalLabel="Optional">
              <TextInput id="tool-keywords" name="keywordTags" value={listingForm.keywordTags} onChange={handleListingFormChange} />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField id="tool-quantity" label="Quantity on hand">
              <TextInput
                id="tool-quantity"
                name="quantityOnHand"
                type="number"
                min="0"
                value={listingForm.quantityOnHand}
                onChange={handleListingFormChange}
              />
            </FormField>
            <FormField id="tool-reserved" label="Quantity reserved" optionalLabel="Optional">
              <TextInput
                id="tool-reserved"
                name="quantityReserved"
                type="number"
                min="0"
                value={listingForm.quantityReserved}
                onChange={handleListingFormChange}
              />
            </FormField>
            <FormField id="tool-safety" label="Safety stock" optionalLabel="Optional">
              <TextInput
                id="tool-safety"
                name="safetyStock"
                type="number"
                min="0"
                value={listingForm.safetyStock}
                onChange={handleListingFormChange}
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tool-purchase" label="Purchase price" optionalLabel="Optional">
              <TextInput
                id="tool-purchase"
                name="purchasePrice"
                type="number"
                min="0"
                value={listingForm.purchasePrice}
                onChange={handleListingFormChange}
              />
            </FormField>
            <FormField id="tool-rental" label="Daily price" optionalLabel="Optional">
              <TextInput
                id="tool-rental"
                name="pricePerDay"
                type="number"
                min="0"
                value={listingForm.pricePerDay}
                onChange={handleListingFormChange}
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="tool-availability" label="Availability">
              <Select
                id="tool-availability"
                name="availability"
                value={listingForm.availability}
                onChange={handleListingFormChange}
                options={[
                  { value: 'buy', label: 'Available to purchase' },
                  { value: 'rent', label: 'Available to rent' },
                  { value: 'both', label: 'Purchase or rent' }
                ]}
              />
            </FormField>
            <FormField id="tool-status" label="Status">
              <Select
                id="tool-status"
                name="status"
                value={listingForm.status}
                onChange={handleListingFormChange}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'approved', label: 'Published' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
              />
            </FormField>
          </div>
          <Checkbox
            id="tool-insured"
            name="insuredOnly"
            checked={Boolean(listingForm.insuredOnly)}
            onChange={handleListingFormChange}
          >
            Require insured customers only
          </Checkbox>
        </form>
      </Modal>

      <Modal
        open={couponModal.open}
        onClose={closeCouponModal}
        title={couponModal.couponId ? 'Edit coupon' : 'Create coupon'}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={closeCouponModal} disabled={savingCoupon}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitCoupon} loading={savingCoupon}>
              {couponModal.couponId ? 'Save coupon' : 'Create coupon'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmitCoupon}>
          <FormField id="coupon-name" label="Name">
            <TextInput id="coupon-name" name="name" value={couponForm.name} onChange={handleCouponFormChange} required />
          </FormField>
          <FormField id="coupon-code" label="Code" optionalLabel="Optional">
            <TextInput id="coupon-code" name="code" value={couponForm.code} onChange={handleCouponFormChange} />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="coupon-type" label="Discount type">
              <Select
                id="coupon-type"
                name="discountType"
                value={couponForm.discountType}
                onChange={handleCouponFormChange}
                options={[
                  { value: 'percentage', label: 'Percentage off' },
                  { value: 'fixed', label: 'Fixed amount' }
                ]}
              />
            </FormField>
            <FormField id="coupon-value" label="Discount value">
              <TextInput
                id="coupon-value"
                name="discountValue"
                type="number"
                min="0"
                value={couponForm.discountValue}
                onChange={handleCouponFormChange}
                required
              />
            </FormField>
          </div>
          <FormField id="coupon-status" label="Status">
            <Select
              id="coupon-status"
              name="status"
              value={couponForm.status}
              onChange={handleCouponFormChange}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'archived', label: 'Archived' }
              ]}
            />
          </FormField>
          <Checkbox id="coupon-auto" name="autoApply" checked={couponForm.autoApply} onChange={handleCouponFormChange}>
            Auto-apply coupon to eligible orders
          </Checkbox>
        </form>
      </Modal>
    </section>
  );
}

ToolSalesManagement.propTypes = {
  initialData: PropTypes.shape({
    summary: PropTypes.shape({
      totalListings: PropTypes.number,
      draft: PropTypes.number,
      published: PropTypes.number,
      suspended: PropTypes.number,
      totalQuantity: PropTypes.number,
      activeCoupons: PropTypes.number
    }),
    listings: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        tagline: PropTypes.string,
        description: PropTypes.string,
        heroImageUrl: PropTypes.string,
        showcaseVideoUrl: PropTypes.string,
        galleryImages: PropTypes.arrayOf(PropTypes.string),
        tags: PropTypes.arrayOf(PropTypes.string),
        keywordTags: PropTypes.arrayOf(PropTypes.string),
        listing: PropTypes.shape({
          status: PropTypes.string,
          availability: PropTypes.string,
          pricePerDay: PropTypes.number,
          purchasePrice: PropTypes.number,
          insuredOnly: PropTypes.bool,
          location: PropTypes.string
        }),
        inventory: PropTypes.shape({
          quantityOnHand: PropTypes.number,
          quantityReserved: PropTypes.number,
          safetyStock: PropTypes.number,
          conditionRating: PropTypes.string
        }),
        coupons: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            name: PropTypes.string,
            code: PropTypes.string,
            status: PropTypes.string
          })
        ),
        metrics: PropTypes.shape({
          quantityAvailable: PropTypes.number,
          activeCoupons: PropTypes.number
        })
      })
    )
  })
};

ToolSalesManagement.defaultProps = {
  initialData: null
};

export default ToolSalesManagement;
