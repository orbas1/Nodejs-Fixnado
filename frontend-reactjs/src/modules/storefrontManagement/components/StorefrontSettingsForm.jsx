import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { BoltIcon, CheckCircleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'live', label: 'Live' },
  { value: 'archived', label: 'Archived' }
];

function toneForStatus(status) {
  if (status === 'live') return 'success';
  if (status === 'archived') return 'danger';
  return 'info';
}

function buildFormState(storefront) {
  return {
    name: storefront.name || '',
    slug: storefront.slug || '',
    tagline: storefront.tagline || '',
    description: storefront.description || '',
    heroImageUrl: storefront.heroImageUrl || '',
    contactEmail: storefront.contactEmail || '',
    contactPhone: storefront.contactPhone || '',
    primaryColor: storefront.primaryColor || '#0f172a',
    accentColor: storefront.accentColor || '#38bdf8',
    status: storefront.status || 'draft',
    isPublished: Boolean(storefront.isPublished),
    reviewRequired: Boolean(storefront.reviewRequired)
  };
}

export default function StorefrontSettingsForm({ storefront, saving, onSubmit, onRefresh }) {
  const [formState, setFormState] = useState(() => buildFormState(storefront));
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    setFormState(buildFormState(storefront));
  }, [storefront]);

  const statusTone = useMemo(() => toneForStatus(formState.status), [formState.status]);
  const publishedTone = formState.isPublished ? 'success' : 'warning';

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(null);
    try {
      await onSubmit(formState);
      setSuccessMessage('Changes saved');
      window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save changes');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Storefront identity</p>
            <h3 className="mt-2 text-lg font-semibold text-primary">Branding & contact details</h3>
            <p className="mt-2 text-sm text-slate-600">
              Update how your storefront appears to customers across Fixnado and connected marketplaces.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill tone={statusTone}>{formState.status}</StatusPill>
            <StatusPill tone={publishedTone}>{formState.isPublished ? 'Published' : 'Not published'}</StatusPill>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Storefront name
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Metro Power Services Storefront"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Storefront slug
            <input
              type="text"
              name="slug"
              value={formState.slug}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="metro-power"
            />
            <span className="text-xs text-slate-500">Used for public URLs. Keep it simple and human-readable.</span>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
            Tagline
            <input
              type="text"
              name="tagline"
              value={formState.tagline}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Trusted electrical resilience partners"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
            Description
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Share the services, assurances, and differentiators that keep customers coming back."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Hero image URL
            <input
              type="url"
              name="heroImageUrl"
              value={formState.heroImageUrl}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="https://cdn.fixnado.com/hero.jpg"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Contact email
            <input
              type="email"
              name="contactEmail"
              value={formState.contactEmail}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="hello@yourcompany.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Contact phone
            <input
              type="tel"
              name="contactPhone"
              value={formState.contactPhone}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="+44 20 0000 0000"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Primary colour
            <input
              type="text"
              name="primaryColor"
              value={formState.primaryColor}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="#0f172a"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Accent colour
            <input
              type="text"
              name="accentColor"
              value={formState.accentColor}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="#38bdf8"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Workflow status
            <select
              name="status"
              value={formState.status}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="isPublished"
                checked={formState.isPublished}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Publish storefront
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="reviewRequired"
                checked={formState.reviewRequired}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Require compliance review before publishing updates
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" loading={saving} icon={CheckCircleIcon} iconPosition="start">
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => onRefresh?.()} icon={BoltIcon} iconPosition="start">
            Refresh snapshot
          </Button>
          <Button
            type="button"
            variant="ghost"
            href={storefront.slug ? `/providers/${storefront.slug}` : undefined}
            icon={GlobeAltIcon}
            iconPosition="start"
            disabled={!storefront.slug}
          >
            View public storefront
          </Button>
        </div>

        {successMessage ? (
          <p className="mt-3 text-sm font-medium text-emerald-600">{successMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 text-sm font-medium text-rose-600">{errorMessage}</p>
        ) : null}
      </div>
    </form>
  );
}

StorefrontSettingsForm.propTypes = {
  storefront: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string,
    tagline: PropTypes.string,
    description: PropTypes.string,
    heroImageUrl: PropTypes.string,
    contactEmail: PropTypes.string,
    contactPhone: PropTypes.string,
    primaryColor: PropTypes.string,
    accentColor: PropTypes.string,
    status: PropTypes.string,
    isPublished: PropTypes.bool,
    reviewRequired: PropTypes.bool
  }).isRequired,
  saving: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onRefresh: PropTypes.func
};

StorefrontSettingsForm.defaultProps = {
  saving: false,
  onRefresh: undefined
};
