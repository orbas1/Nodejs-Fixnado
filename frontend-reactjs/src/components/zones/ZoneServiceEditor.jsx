import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/index.js';

const COVERAGE_TYPES = [
  { value: 'primary', label: 'Primary coverage' },
  { value: 'secondary', label: 'Secondary coverage' },
  { value: 'supplementary', label: 'Supplementary coverage' }
];

function toLocalInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (input) => String(input).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromLocalInput(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export default function ZoneServiceEditor({
  open,
  services,
  coverage,
  onClose,
  onSubmit,
  saving,
  error,
  zoneName
}) {
  const mode = coverage ? 'edit' : 'create';
  const normalisedServices = useMemo(() => {
    if (coverage && !services.some((service) => service.id === coverage.serviceId)) {
      return [
        ...services,
        {
          id: coverage.serviceId,
          title: coverage.service?.title || 'Linked service',
          currency: coverage.service?.currency || 'GBP',
          price: typeof coverage.service?.price === 'number' ? coverage.service.price : null,
          metrics: coverage.service?.metrics || coverage.metadata?.metrics || {}
        }
      ];
    }
    return services;
  }, [services, coverage]);
  const [form, setForm] = useState(() => ({
    serviceId: coverage?.serviceId ?? '',
    coverageType: coverage?.coverageType ?? 'primary',
    priority: coverage?.priority ?? 1,
    effectiveFrom: toLocalInput(coverage?.effectiveFrom),
    effectiveTo: toLocalInput(coverage?.effectiveTo),
    notes: coverage?.metadata?.notes ?? ''
  }));

  useEffect(() => {
    setForm({
      serviceId: coverage?.serviceId ?? '',
      coverageType: coverage?.coverageType ?? 'primary',
      priority: coverage?.priority ?? 1,
      effectiveFrom: toLocalInput(coverage?.effectiveFrom),
      effectiveTo: toLocalInput(coverage?.effectiveTo),
      notes: coverage?.metadata?.notes ?? ''
    });
  }, [coverage]);

  useEffect(() => {
    if (!coverage && normalisedServices.length > 0) {
      setForm((current) => ({
        ...current,
        serviceId: current.serviceId || normalisedServices[0].id || ''
      }));
    }
  }, [normalisedServices, coverage]);

  const selectedService = useMemo(
    () => normalisedServices.find((service) => service.id === form.serviceId) ?? null,
    [form.serviceId, normalisedServices]
  );

  if (!open) {
    return null;
  }

  const handleChange = (field) => (event) => {
    const value = field === 'priority' ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      serviceId: form.serviceId,
      coverageType: form.coverageType,
      priority: Number.isFinite(form.priority) && form.priority > 0 ? Math.round(form.priority) : 1,
      effectiveFrom: fromLocalInput(form.effectiveFrom),
      effectiveTo: fromLocalInput(form.effectiveTo),
      notes: form.notes.trim()
    });
  };

  const formattedPrice = useMemo(() => {
    if (!selectedService || typeof selectedService.price !== 'number') {
      return null;
    }
    try {
      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: selectedService.currency || 'GBP',
        maximumFractionDigits: 2
      });
      return formatter.format(selectedService.price);
    } catch (formatError) {
      return `£${selectedService.price.toFixed?.(2) ?? selectedService.price}`;
    }
  }, [selectedService]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-2xl">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/60">
              {mode === 'edit' ? 'Update coverage' : 'Attach service'}
            </p>
            <h2 className="text-xl font-semibold text-primary">
              {mode === 'edit' ? `Edit coverage for ${selectedService?.title ?? 'service'}` : 'Connect a service to the zone'}
            </h2>
            <p className="text-sm text-slate-600">
              Linked services inherit RBAC from the zone company. Coverage windows control dispatch eligibility for crews in
              {zoneName ? ` ${zoneName}` : ' this zone'}.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-primary">
              Service
              <select
                value={form.serviceId}
                onChange={handleChange('serviceId')}
                disabled={mode === 'edit'}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              >
                {normalisedServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-primary">
              Coverage priority
              <input
                type="number"
                min="1"
                value={form.priority}
                onChange={handleChange('priority')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </label>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-primary">Coverage type</span>
            <div className="flex flex-wrap gap-3">
              {COVERAGE_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, coverageType: option.value }))}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    form.coverageType === option.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20'
                      : 'border-slate-200 bg-slate-100 text-slate-600'
                  }`}
                >
                  {form.coverageType === option.value ? (
                    <PlusIcon className="h-4 w-4 rotate-45" aria-hidden="true" />
                  ) : (
                    <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-primary">
              Effective from
              <input
                type="datetime-local"
                value={form.effectiveFrom}
                onChange={handleChange('effectiveFrom')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-primary">
              Effective to
              <input
                type="datetime-local"
                value={form.effectiveTo}
                onChange={handleChange('effectiveTo')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold text-primary">
            Dispatch notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={handleChange('notes')}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Control room instructions, SLAs, or escalation paths"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Button type="submit" loading={saving} icon={mode === 'edit' ? ArrowPathIcon : PlusIcon} iconPosition="start">
                {mode === 'edit' ? 'Update coverage' : 'Attach service'}
              </Button>
              <Button type="button" variant="ghost" icon={ClockIcon} onClick={() => setForm((current) => ({ ...current, effectiveFrom: '', effectiveTo: '' }))}>
                Clear window
              </Button>
            </div>
            {selectedService ? (
              <p className="text-xs text-slate-500">
                {selectedService.metrics?.activeOrders ?? 0} active orders
                {formattedPrice ? ` • ${formattedPrice}` : ''}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

ZoneServiceEditor.propTypes = {
  open: PropTypes.bool.isRequired,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      currency: PropTypes.string,
      price: PropTypes.number,
      metrics: PropTypes.shape({
        activeOrders: PropTypes.number
      })
    })
  ).isRequired,
  coverage: PropTypes.shape({
    id: PropTypes.string,
    serviceId: PropTypes.string.isRequired,
    coverageType: PropTypes.string,
    priority: PropTypes.number,
    effectiveFrom: PropTypes.string,
    effectiveTo: PropTypes.string,
    metadata: PropTypes.object
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string,
  zoneName: PropTypes.string
};

ZoneServiceEditor.defaultProps = {
  coverage: null,
  saving: false,
  error: null,
  zoneName: null
};
