import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import TextInput from '../../components/ui/TextInput.jsx';
import ServiceFormModal from './ServiceFormModal.jsx';
import {
  getProviderServicesWorkspace,
  createProviderService,
  updateProviderService,
  deleteProviderService
} from '../../api/panelClient.js';

const DEFAULT_SUMMARY = {
  total: 0,
  draft: 0,
  published: 0,
  paused: 0,
  archived: 0,
  active: 0
};

const DEFAULT_FORM = {
  title: '',
  slug: '',
  tagline: '',
  shortDescription: '',
  description: '',
  displayUrl: '',
  heroImageUrl: '',
  showcaseVideoUrl: '',
  gallery: '',
  tags: '',
  keywordTags: '',
  status: 'draft',
  visibility: 'restricted',
  kind: 'standard',
  price: '',
  currency: 'GBP',
  crewSize: 1,
  pricingModel: '',
  pricingUnit: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  zoneAssignments: [],
  availability: [],
  mediaLibrary: [],
  categoryId: null
};

function generateId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

function formatList(values) {
  if (!Array.isArray(values)) {
    return '';
  }
  return values.filter(Boolean).join(', ');
}

function formatGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return '';
  }
  return gallery
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return item;
      }
      const url = item.url ?? '';
      const alt = item.altText ?? item.alt ?? '';
      return alt ? `${url} | ${alt}` : url;
    })
    .filter(Boolean)
    .join('\n');
}

function mapServiceToForm(service) {
  if (!service) {
    return { ...DEFAULT_FORM };
  }
  return {
    title: service.title ?? '',
    slug: service.slug ?? '',
    tagline: service.tagline ?? '',
    shortDescription: service.shortDescription ?? '',
    description: service.description ?? '',
    displayUrl: service.displayUrl ?? '',
    heroImageUrl: service.heroImageUrl ?? '',
    showcaseVideoUrl: service.showcaseVideoUrl ?? '',
    gallery: formatGallery(service.gallery),
    tags: formatList(service.tags),
    keywordTags: formatList(service.keywordTags),
    status: service.status ?? 'draft',
    visibility: service.visibility ?? 'restricted',
    kind: service.kind ?? 'standard',
    price:
      typeof service.price === 'number' && !Number.isNaN(service.price)
        ? service.price
        : service.price ?? '',
    currency: service.currency ?? 'GBP',
    crewSize: service.crewSize ?? 1,
    pricingModel: service.pricingModel ?? '',
    pricingUnit: service.pricingUnit ?? '',
    seoTitle: service.seo?.title ?? '',
    seoDescription: service.seo?.description ?? '',
    seoKeywords: formatList(service.seo?.keywords),
    zoneAssignments: Array.isArray(service.zoneAssignments)
      ? service.zoneAssignments.map((assignment) => ({
          ...assignment,
          localId: assignment.id || generateId('zone'),
          effectiveFrom: assignment.effectiveFrom ? assignment.effectiveFrom.slice(0, 10) : '',
          effectiveTo: assignment.effectiveTo ? assignment.effectiveTo.slice(0, 10) : ''
        }))
      : [],
    availability: Array.isArray(service.availabilityWindows)
      ? service.availabilityWindows.map((window) => ({
          ...window,
          localId: window.id || generateId('availability'),
          maxBookings: window.maxBookings ?? ''
        }))
      : [],
    mediaLibrary: Array.isArray(service.mediaLibrary)
      ? service.mediaLibrary.map((asset) => ({
          ...asset,
          localId: asset.id || generateId('media')
        }))
      : [],
    categoryId: service.categoryId ?? null
  };
}

function parseListInput(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseGalleryInput(value) {
  if (!value) {
    return [];
  }
  return value
    .split(/\n+/)
    .map((line) => {
      if (!line) return null;
      const [urlPart, altPart] = line.split('|');
      const url = urlPart?.trim();
      if (!url) return null;
      const altText = altPart?.trim() ?? '';
      return { url, altText };
    })
    .filter(Boolean);
}

function parseInteger(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildServicePayload(form, companyId) {
  const crewSize = parseInteger(form.crewSize, 1);
  const zoneAssignments = (form.zoneAssignments ?? []).map((assignment) => ({
    id: assignment.id ?? null,
    zoneId: assignment.zoneId || null,
    coverageType: assignment.coverageType ?? 'primary',
    priority: parseInteger(assignment.priority, 1),
    effectiveFrom: assignment.effectiveFrom || null,
    effectiveTo: assignment.effectiveTo || null,
    metadata: assignment.metadata && typeof assignment.metadata === 'object' ? assignment.metadata : {}
  }));

  const availability = (form.availability ?? []).map((window) => ({
    id: window.id ?? null,
    dayOfWeek: parseInteger(window.dayOfWeek, 0),
    startTime: window.startTime || '00:00',
    endTime: window.endTime || '23:59',
    maxBookings: parseInteger(window.maxBookings, null),
    label: window.label ?? '',
    isActive: window.isActive !== false,
    metadata: window.metadata && typeof window.metadata === 'object' ? window.metadata : {}
  }));

  const mediaLibrary = (form.mediaLibrary ?? [])
    .filter((asset) => asset && asset.url)
    .map((asset, index) => ({
      id: asset.id ?? null,
      mediaType: asset.mediaType ?? 'image',
      url: asset.url?.trim() ?? '',
      title: asset.title ?? '',
      altText: asset.altText ?? '',
      thumbnailUrl: asset.thumbnailUrl ?? '',
      sortOrder: parseInteger(asset.sortOrder, index),
      isPrimary: Boolean(asset.isPrimary),
      metadata: asset.metadata && typeof asset.metadata === 'object' ? asset.metadata : {}
    }));

  return {
    companyId,
    title: form.title ?? '',
    slug: form.slug || undefined,
    tagline: form.tagline || undefined,
    shortDescription: form.shortDescription || undefined,
    description: form.description || undefined,
    displayUrl: form.displayUrl || undefined,
    heroImageUrl: form.heroImageUrl || undefined,
    showcaseVideoUrl: form.showcaseVideoUrl || undefined,
    status: form.status ?? 'draft',
    visibility: form.visibility ?? 'restricted',
    kind: form.kind ?? 'standard',
    price: parseNumber(form.price, null),
    currency: form.currency || undefined,
    crewSize,
    pricingModel: form.pricingModel || undefined,
    pricingUnit: form.pricingUnit || undefined,
    gallery: parseGalleryInput(form.gallery),
    tags: parseListInput(form.tags),
    keywordTags: parseListInput(form.keywordTags),
    seo: {
      title: form.seoTitle || undefined,
      description: form.seoDescription || undefined,
      keywords: parseListInput(form.seoKeywords)
    },
    zoneAssignments,
    availability,
    mediaLibrary,
    categoryId: form.categoryId || null
  };
}

function formatCurrency(value, currency = 'GBP') {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    return `${currency} ${value}`;
  }
}

function resolveStatusTone(status) {
  switch (status) {
    case 'published':
      return 'success';
    case 'paused':
      return 'warning';
    case 'archived':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function ProviderServicesWorkspace() {
  const [state, setState] = useState({
    loading: true,
    data: { summary: DEFAULT_SUMMARY, services: [], categories: [], zones: [], companyId: null },
    error: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ open: false, mode: 'create', serviceId: null });
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      setState((current) => ({
        ...current,
        loading: current.loading || force,
        error: force ? null : current.error
      }));
      try {
        const result = await getProviderServicesWorkspace({ forceRefresh: force });
        setState({
          loading: false,
          data: {
            companyId: result.data.companyId ?? null,
            summary: { ...DEFAULT_SUMMARY, ...(result.data.summary ?? {}) },
            services: result.data.services ?? [],
            categories: result.data.categories ?? [],
            zones: result.data.zones ?? []
          },
          error: null
        });
      } catch (error) {
        setState((current) => ({ ...current, loading: false, error }));
      }
    },
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const filteredServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return state.data.services;
    }
    return state.data.services.filter((service) => {
      const haystack = [service.title, service.tagline, service.categoryRef?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [searchTerm, state.data.services]);

  const handleOpenCreate = () => {
    setFormState({ ...DEFAULT_FORM, zoneAssignments: [], availability: [], mediaLibrary: [] });
    setModalState({ open: true, mode: 'create', serviceId: null });
    setFormError('');
  };

  const handleOpenEdit = (service) => {
    setFormState(mapServiceToForm(service));
    setModalState({ open: true, mode: 'edit', serviceId: service.id });
    setFormError('');
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalState({ open: false, mode: 'create', serviceId: null });
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload = buildServicePayload(formState, state.data.companyId);
    setSaving(true);
    setFormError('');
    try {
      if (modalState.mode === 'create') {
        await createProviderService(payload);
        setStatusMessage('Service created successfully.');
      } else if (modalState.serviceId) {
        await updateProviderService(modalState.serviceId, payload);
        setStatusMessage('Service updated successfully.');
      }
      setModalState({ open: false, mode: 'create', serviceId: null });
      await refresh({ force: true });
    } catch (error) {
      setFormError(error?.message || 'Unable to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service) => {
    if (!service?.id) return;
    const confirmed = window.confirm(`Delete service “${service.title}”? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    try {
      setDeletingId(service.id);
      await deleteProviderService(service.id);
      setStatusMessage('Service deleted.');
      await refresh({ force: true });
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  if (state.loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={48} />
        <Skeleton height={240} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
          Unable to load provider services workspace. {state.error.message ?? 'An unexpected error occurred.'}
        </div>
        <Button variant="secondary" onClick={() => refresh({ force: true })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Provider / SME control centre</p>
          <h1 className="text-2xl font-semibold text-primary">Service catalogue management</h1>
          <p className="text-sm text-slate-600">
            Create, publish, and optimise services with zone coverage, pricing, availability, and SEO controls.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TextInput
            label="Search services"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, tagline, or category"
          />
          <Button type="button" variant="primary" onClick={handleOpenCreate}>
            Create service
          </Button>
        </div>
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total services" value={state.data.summary.total} />
        <SummaryCard label="Published" value={state.data.summary.published} tone="success" />
        <SummaryCard label="Draft" value={state.data.summary.draft} tone="neutral" />
        <SummaryCard label="Active coverage zones" value={state.data.zones.length} tone="info" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Services</h2>
          <span className="text-sm text-slate-500">{filteredServices.length} entries</span>
        </div>
        {filteredServices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
            No services found. Create a service or adjust your filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <article
                key={service.id}
                className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-primary">{service.title}</h3>
                      <StatusPill tone={resolveStatusTone(service.status)}>{service.status}</StatusPill>
                      <StatusPill tone="info">{service.visibility}</StatusPill>
                    </div>
                    {service.tagline ? (
                      <p className="text-sm text-slate-600">{service.tagline}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {service.categoryRef?.name ? (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">
                          {service.categoryRef.name}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">
                        {formatCurrency(service.price, service.currency)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">
                        {service.zoneAssignments?.length ?? 0} zones
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">
                        Crew size {service.crewSize ?? 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleOpenEdit(service)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      href={service.displayUrl || undefined}
                      target={service.displayUrl ? '_blank' : undefined}
                      rel={service.displayUrl ? 'noopener noreferrer' : undefined}
                      disabled={!service.displayUrl}
                    >
                      View page
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      loading={deletingId === service.id}
                      onClick={() => handleDelete(service)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {service.availabilitySummary ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                    Availability • {service.availabilitySummary.label}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <ServiceFormModal
        open={modalState.open}
        mode={modalState.mode}
        form={formState}
        categories={state.data.categories}
        zones={state.data.zones}
        saving={saving}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onClose={handleCloseModal}
      />
    </div>
  );
}

function SummaryCard({ label, value, tone = 'neutral' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-primary">{value}</p>
      <StatusPill tone={tone}>
        {tone === 'success' ? 'Healthy' : tone === 'warning' ? 'Attention' : tone === 'danger' ? 'Review' : 'Snapshot'}
      </StatusPill>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['neutral', 'success', 'warning', 'danger', 'info'])
};

SummaryCard.defaultProps = {
  tone: 'neutral'
};
