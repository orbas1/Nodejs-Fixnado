import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import FormField from '../../../components/ui/FormField.jsx';
import Button from '../../../components/ui/Button.jsx';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'unavailable', label: 'Unavailable' }
];

function AssetForm({ asset, mode, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    inventoryItemId: '',
    description: '',
    rentalRate: '',
    rentalRateCurrency: 'GBP',
    depositAmount: '',
    depositCurrency: 'GBP',
    quantityAvailable: '0',
    minHireDays: '1',
    maxHireDays: '',
    availabilityStatus: 'available',
    seoTitle: '',
    seoDescription: '',
    keywordTags: '',
    heroImageUrl: '',
    showcaseVideoUrl: '',
    gallery: ''
  });

  useEffect(() => {
    if (!asset) {
      setForm((current) => ({
        ...current,
        name: '',
        slug: '',
        inventoryItemId: '',
        description: '',
        rentalRate: '',
        depositAmount: '',
        quantityAvailable: '0',
        minHireDays: '1',
        maxHireDays: '',
        availabilityStatus: 'available',
        seoTitle: '',
        seoDescription: '',
        keywordTags: '',
        heroImageUrl: '',
        showcaseVideoUrl: '',
        gallery: ''
      }));
      return;
    }
    const keywordTags = Array.isArray(asset.keywordTags) ? asset.keywordTags.join(', ') : '';
    const gallery = Array.isArray(asset.gallery)
      ? asset.gallery
          .map((entry) => (typeof entry === 'string' ? entry : entry?.url))
          .filter(Boolean)
          .join('\n')
      : '';
    setForm({
      name: asset.name || '',
      slug: asset.slug || '',
      inventoryItemId: asset.inventoryItemId || '',
      description: asset.description || '',
      rentalRate: asset.rentalRate != null ? String(asset.rentalRate) : '',
      rentalRateCurrency: asset.rentalRateCurrency || 'GBP',
      depositAmount: asset.depositAmount != null ? String(asset.depositAmount) : '',
      depositCurrency: asset.depositCurrency || asset.rentalRateCurrency || 'GBP',
      quantityAvailable: asset.quantityAvailable != null ? String(asset.quantityAvailable) : '0',
      minHireDays: asset.minHireDays != null ? String(asset.minHireDays) : '1',
      maxHireDays: asset.maxHireDays != null ? String(asset.maxHireDays) : '',
      availabilityStatus: asset.availabilityStatus || 'available',
      seoTitle: asset.seoTitle || '',
      seoDescription: asset.seoDescription || '',
      keywordTags,
      heroImageUrl: asset.heroImageUrl || '',
      showcaseVideoUrl: asset.showcaseVideoUrl || '',
      gallery
    });
  }, [asset]);

  const galleryArray = useMemo(
    () =>
      form.gallery
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean),
    [form.gallery]
  );

  const handleChange = (event) => {
    const { name: fieldName, value } = event.target;
    setForm((current) => ({ ...current, [fieldName]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      inventoryItemId: form.inventoryItemId || undefined,
      description: form.description || undefined,
      rentalRate: form.rentalRate ? Number.parseFloat(form.rentalRate) : null,
      rentalRateCurrency: form.rentalRateCurrency || 'GBP',
      depositAmount: form.depositAmount ? Number.parseFloat(form.depositAmount) : null,
      depositCurrency: form.depositCurrency || form.rentalRateCurrency || 'GBP',
      quantityAvailable: form.quantityAvailable ? Number.parseInt(form.quantityAvailable, 10) : 0,
      minHireDays: form.minHireDays ? Number.parseInt(form.minHireDays, 10) : 1,
      maxHireDays: form.maxHireDays ? Number.parseInt(form.maxHireDays, 10) : null,
      availabilityStatus: form.availabilityStatus,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      keywordTags: form.keywordTags
        ? form.keywordTags
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [],
      heroImageUrl: form.heroImageUrl || undefined,
      showcaseVideoUrl: form.showcaseVideoUrl || undefined,
      gallery: galleryArray
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary">
          {mode === 'create' ? 'Create tool hire asset' : 'Asset details'}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Maintain listing content, SEO tags, and operational limits for this tool.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="asset-name" label="Name">
          <input
            id="asset-name"
            name="name"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.name}
            onChange={handleChange}
            required
          />
        </FormField>
        <FormField id="asset-slug" label="Slug" optionalLabel="Optional">
          <input
            id="asset-slug"
            name="slug"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.slug}
            onChange={handleChange}
            placeholder="tool-hire-slug"
          />
        </FormField>
        <FormField id="asset-inventory" label="Inventory item reference" optionalLabel="Optional">
          <input
            id="asset-inventory"
            name="inventoryItemId"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.inventoryItemId}
            onChange={handleChange}
            placeholder="Inventory item ID"
          />
        </FormField>
        <FormField id="asset-status" label="Availability status">
          <select
            id="asset-status"
            name="availabilityStatus"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.availabilityStatus}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField id="asset-description" label="Description" optionalLabel="Optional">
        <textarea
          id="asset-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField id="asset-rate" label="Daily rate" optionalLabel="Optional">
          <input
            id="asset-rate"
            name="rentalRate"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.rentalRate}
            onChange={handleChange}
            placeholder="120"
          />
        </FormField>
        <FormField id="asset-rate-currency" label="Rate currency">
          <input
            id="asset-rate-currency"
            name="rentalRateCurrency"
            maxLength={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase"
            value={form.rentalRateCurrency}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="asset-quantity" label="Available quantity">
          <input
            id="asset-quantity"
            name="quantityAvailable"
            type="number"
            min="0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.quantityAvailable}
            onChange={handleChange}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField id="asset-deposit" label="Deposit amount" optionalLabel="Optional">
          <input
            id="asset-deposit"
            name="depositAmount"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.depositAmount}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="asset-deposit-currency" label="Deposit currency">
          <input
            id="asset-deposit-currency"
            name="depositCurrency"
            maxLength={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase"
            value={form.depositCurrency}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="asset-min-days" label="Minimum hire days">
          <input
            id="asset-min-days"
            name="minHireDays"
            type="number"
            min="1"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.minHireDays}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="asset-max-days" label="Maximum hire days" optionalLabel="Optional">
          <input
            id="asset-max-days"
            name="maxHireDays"
            type="number"
            min="1"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.maxHireDays}
            onChange={handleChange}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="asset-seo-title" label="SEO title" optionalLabel="Optional">
          <input
            id="asset-seo-title"
            name="seoTitle"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.seoTitle}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="asset-seo-description" label="SEO description" optionalLabel="Optional">
          <textarea
            id="asset-seo-description"
            name="seoDescription"
            rows={3}
            value={form.seoDescription}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          />
        </FormField>
      </div>

      <FormField id="asset-keywords" label="Search keywords" optionalLabel="Optional" helper="Comma separated tags">
        <input
          id="asset-keywords"
          name="keywordTags"
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          value={form.keywordTags}
          onChange={handleChange}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="asset-hero" label="Hero image URL" optionalLabel="Optional">
          <input
            id="asset-hero"
            name="heroImageUrl"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.heroImageUrl}
            onChange={handleChange}
          />
        </FormField>
        <FormField id="asset-video" label="Showcase video URL" optionalLabel="Optional">
          <input
            id="asset-video"
            name="showcaseVideoUrl"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
            value={form.showcaseVideoUrl}
            onChange={handleChange}
          />
        </FormField>
      </div>

      <FormField
        id="asset-gallery"
        label="Gallery URLs"
        optionalLabel="Optional"
        helper="One image URL per line."
      >
        <textarea
          id="asset-gallery"
          name="gallery"
          rows={3}
          value={form.gallery}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
        />
      </FormField>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : mode === 'create' ? 'Create asset' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

AssetForm.propTypes = {
  asset: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']),
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
};

AssetForm.defaultProps = {
  asset: null,
  mode: 'edit',
  loading: false,
  error: null
};

export default AssetForm;
