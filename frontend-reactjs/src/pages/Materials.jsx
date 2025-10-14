import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  BoltIcon,
  BuildingOfficeIcon,
  CubeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { getMaterialsShowcase, PanelApiError } from '../api/panelClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import { useRoleAccess } from '../hooks/useRoleAccess.js';

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const percentageFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0
});

const roleLabelMap = {
  company: 'Company operations',
  servicemen: 'Field service crews',
  provider: 'Provider operations'
};

function AccessDenied({ onRefresh, deniedReason, allowedRoles }) {
  const roleList = Array.from(new Set(allowedRoles)).map((roleKey) => {
    const label = roleLabelMap[roleKey];
    if (label) {
      return label;
    }
    const formatted = roleKey?.charAt(0).toUpperCase() + roleKey?.slice(1);
    return formatted ?? null;
  });
  const rolesText = roleList.filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldExclamationIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Access control</p>
                <h1 className="text-2xl font-semibold text-primary">
                  Materials workspace requires operations credentials
                </h1>
                <p className="text-sm text-slate-600">
                  The materials control tower is reserved for company operations leads and certified field crews.
                  {deniedReason === 'role-missing'
                    ? ' Choose an authorised workspace role to continue.'
                    : ' Switch to a provisioned role to inspect stock, compliance and vendor automations.'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Permitted roles</p>
                <p className="mt-2 text-sm text-slate-600">{rolesText || 'Authorised operations cohorts'}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/dashboards/provider"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                >
                  Open operations workspace
                </Link>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-5 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/50"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  Refresh status
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Need access? Contact operations enablement so we can align telemetry rehearsal and escrow governance before activating this workspace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, caption, tone = 'default' }) {
  const toneClasses = {
    default: 'text-primary',
    positive: 'text-emerald-600',
    warning: 'text-amber-600',
    neutral: 'text-slate-600'
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClasses[tone] ?? toneClasses.default}`}>{value}</p>
      {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
    </div>
  );
}

function CategoryCard({ category }) {
  const percentage = Math.min(Math.max(category.share, 0), 1);
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Category share</p>
          <h3 className="mt-1 text-lg font-semibold text-primary">{category.name}</h3>
        </div>
        <CubeIcon className="h-6 w-6 text-primary/70" aria-hidden="true" />
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-primary">{percentageFormatter.format(percentage)}</span>
          <span className="text-xs text-slate-500">of stocked units</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percentage * 100}%` }} />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <dt>Safety breaches</dt>
          <dd className="font-semibold text-slate-700">{numberFormatter.format(category.safetyStockBreaches ?? 0)}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd className="font-semibold text-slate-700">{percentageFormatter.format(Math.min(Math.max(category.availability ?? 1, 0), 1))}</dd>
        </div>
      </dl>
    </article>
  );
}

function LogisticsStep({ step, index }) {
  const statusPalette = {
    on_track: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    attention: 'bg-amber-100 text-amber-700 border-amber-200',
    scheduled: 'bg-primary/10 text-primary border-primary/20'
  };
  const status = step.status?.toLowerCase?.() ?? 'scheduled';
  const palette = statusPalette[status] ?? statusPalette.scheduled;
  const etaLabel = step.eta ? new Date(step.eta).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Pending';

  return (
    <li className="relative pl-10">
      <div className="absolute left-0 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        {index === 0 ? <SparklesIcon className="h-4 w-4" aria-hidden="true" /> : <TruckIcon className="h-4 w-4" aria-hidden="true" />}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">{step.label}</p>
            <p className="text-xs text-slate-500">{etaLabel}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${palette}`}>{status.replace(/_/g, ' ')}</span>
        </div>
        <p className="mt-3 text-sm text-slate-600">{step.detail}</p>
      </div>
    </li>
  );
}

export default function Materials() {
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });
  const [filters, setFilters] = useState({ category: 'all', supplier: 'all', search: '', alertsOnly: false });

  const { allowed, deniedReason, status, refresh, allowedRoles, role } = useRoleAccess({
    allowedRoles: ['company', 'servicemen'],
    defaultRole: 'company'
  });

  const loadShowcase = useCallback(
    async (options = {}) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const result = await getMaterialsShowcase(options);
        setState({ loading: false, data: result.data, meta: result.meta, error: null });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        const message = error instanceof PanelApiError ? error.message : 'Unable to load materials showcase';
        setState((current) => ({ ...current, loading: false, error: message }));
      }
    },
    []
  );

  useEffect(() => {
    if (!allowed) {
      return;
    }
    const controller = new AbortController();
    loadShowcase({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [allowed, loadShowcase]);

  const data = state.data ?? materialsFallbackView();

  const suppliers = useMemo(() => data.suppliers ?? [], [data.suppliers]);
  const categories = useMemo(() => data.categories ?? [], [data.categories]);
  const inventory = useMemo(() => data.inventory ?? [], [data.inventory]);
  const collections = useMemo(() => data.collections ?? [], [data.collections]);
  const logistics = useMemo(() => data.logistics ?? [], [data.logistics]);
  const insights = data.insights ?? {};

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = filters.search
        ? item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          (item.sku ?? '').toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const matchesCategory = filters.category === 'all' || item.category.toLowerCase() === filters.category;
      const matchesSupplier =
        filters.supplier === 'all' || (item.supplier ?? '').toLowerCase() === filters.supplier;
      const matchesAlerts = !filters.alertsOnly || (item.alerts?.length ?? 0) > 0;
      return matchesSearch && matchesCategory && matchesSupplier && matchesAlerts;
    });
  }, [filters, inventory]);

  const stats = data.stats ?? {};
  const hero = data.hero ?? {};

  const heroActions = hero.actions ?? [];

  const handleSearch = (event) => {
    setFilters((current) => ({ ...current, search: event.target.value }));
  };

  const handleCategoryChange = (event) => {
    setFilters((current) => ({ ...current, category: event.target.value }));
  };

  const handleSupplierChange = (event) => {
    setFilters((current) => ({ ...current, supplier: event.target.value }));
  };

  const toggleAlerts = () => {
    setFilters((current) => ({ ...current, alertsOnly: !current.alertsOnly }));
  };

  const handleRefresh = () => {
    if (!allowed) {
      refresh();
      return;
    }
    loadShowcase({ forceRefresh: true }).catch(() => {});
  };

  if (!allowed && status === 'denied') {
    return <AccessDenied onRefresh={handleRefresh} deniedReason={deniedReason} allowedRoles={allowedRoles} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-gradient-to-br from-primary/95 via-primary/80 to-accent/60 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">Materials command</p>
                <h1 className="mt-2 text-4xl font-semibold">{hero.title ?? 'Materials control tower'}</h1>
              </div>
              <p className="max-w-2xl text-sm text-white/80">{hero.subtitle ?? 'Real-time view of consumables, replenishment cadences, compliance signals, and supplier performance for operations leaders.'}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {hero.metrics?.map((metric) => {
                  const numericValue = Number.isFinite(Number(metric.value)) ? Number(metric.value) : metric.value;
                  const displayValue =
                    typeof numericValue === 'number'
                      ? metric.unit === '%' || (numericValue > 0 && numericValue <= 1)
                        ? percentageFormatter.format(numericValue > 1 ? numericValue / 100 : numericValue)
                        : numberFormatter.format(numericValue)
                      : metric.value;
                  return (
                    <div key={metric.id} className="rounded-3xl border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/80">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{displayValue}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {heroActions.map((action) => (
                  <Link
                    key={action.id}
                    to={action.href || '#'}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-5 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/30"
                  >
                    <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/30 bg-white/10 p-6 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Live posture</p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold text-white/90 transition hover:border-white/50"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  Refresh
                </button>
              </div>
              <div className="grid gap-3 text-sm text-white">
                <div className="flex items-center justify-between">
                  <span>Value on hand</span>
                  <span className="font-semibold">{currencyFormatter.format(stats.valueOnHand ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active alerts</span>
                  <span className="font-semibold">{numberFormatter.format(stats.alerts ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fill rate</span>
                  <span className="font-semibold">{percentageFormatter.format(Math.min(Math.max(stats.fillRate ?? 1, 0), 1))}</span>
                </div>
                {stats.replenishmentEta ? (
                  <div className="flex items-center justify-between">
                    <span>Next replenishment</span>
                    <span className="font-semibold">{new Date(stats.replenishmentEta).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-white/70">Workspace role: <span className="font-semibold uppercase tracking-wide">{role ?? 'guest'}</span></p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        {state.meta?.fallback ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
              <p>
                Showing resilient cached dataset while the live panel synchronises. Metrics remain export-ready and will refresh automatically once connectivity returns.
              </p>
            </div>
          </div>
        ) : null}
        {state.meta?.error?.message ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5 text-sm text-rose-700 shadow-sm">
            <p>Live data is temporarily unavailable: {state.meta.error.message}. We will reconnect as soon as the control plane responds.</p>
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Operational posture</h2>
              <p className="text-sm text-slate-500">Snapshot of fulfilment performance, SLA readiness, and replenishment guardrails.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <span>Search</span>
                <input
                  type="search"
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-40 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  placeholder="SKU or material"
                />
              </label>
              <select
                value={filters.category}
                onChange={handleCategoryChange}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name.toLowerCase()}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.supplier}
                onChange={handleSupplierChange}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="all">All suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.name.toLowerCase()}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={toggleAlerts}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  filters.alertsOnly
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                }`}
                aria-pressed={filters.alertsOnly}
              >
                <ShieldExclamationIcon className="h-4 w-4" aria-hidden="true" />
                Alerts only
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total SKUs" value={numberFormatter.format(stats.totalSkus ?? 0)} />
            <StatCard label="On-hand units" value={numberFormatter.format(stats.totalOnHand ?? 0)} />
            <StatCard label="Fill rate" value={percentageFormatter.format(Math.min(Math.max(stats.fillRate ?? 1, 0), 1))} tone="positive" />
            <StatCard label="Value on hand" value={currencyFormatter.format(stats.valueOnHand ?? 0)} tone="neutral" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Live inventory</h2>
              <p className="text-sm text-slate-500">Every SKU is compliance tagged and tracked with telemetry-backed availability signals.</p>
            </div>
            {state.loading ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white px-4 py-2 text-sm font-medium text-primary">
                <Spinner className="h-4 w-4 text-primary" />
                Syncing inventory
              </div>
            ) : null}
          </div>

          {state.error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5 text-sm text-rose-700">
              <div className="flex items-center justify-between gap-3">
                <p>{state.error}</p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          {state.loading && !inventory.length ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : null}

          {!state.loading && filteredInventory.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
              <p>No materials match the current filters. Adjust filters or refresh to check for new replenishments.</p>
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredInventory.map((item) => {
              const alert = item.alerts?.[0];
              const available = item.available ?? Math.max((item.quantityOnHand ?? 0) - (item.quantityReserved ?? 0), 0);
              return (
                <article key={item.id} className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">SKU {item.sku ?? '—'}</p>
                      <h3 className="mt-2 text-lg font-semibold text-primary">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                    <BuildingOfficeIcon className="h-6 w-6 text-primary/70" aria-hidden="true" />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <dt>On hand</dt>
                      <dd className="font-semibold text-slate-800">{numberFormatter.format(item.quantityOnHand ?? 0)} {item.unitType}</dd>
                    </div>
                    <div>
                      <dt>Reserved</dt>
                      <dd className="font-semibold text-slate-800">{numberFormatter.format(item.quantityReserved ?? 0)}</dd>
                    </div>
                    <div>
                      <dt>Available</dt>
                      <dd className="font-semibold text-primary">{numberFormatter.format(available)}</dd>
                    </div>
                    <div>
                      <dt>Supplier</dt>
                      <dd className="font-semibold text-slate-800">{item.supplier ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Lead time</dt>
                      <dd className="font-semibold text-slate-800">{item.leadTimeDays != null ? `${item.leadTimeDays} days` : '—'}</dd>
                    </div>
                    <div>
                      <dt>Unit cost</dt>
                      <dd className="font-semibold text-slate-800">{item.unitCost ? currencyFormatter.format(item.unitCost) : '—'}</dd>
                    </div>
                  </dl>
                  {item.compliance?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {item.compliance.map((entry) => (
                        <span key={entry} className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                          {entry}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {alert ? (
                    <div className="mt-auto rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs font-semibold text-amber-700">
                      <div className="flex items-center gap-2">
                        <ShieldExclamationIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{alert.type?.replace(/_/g, ' ') ?? 'Alert active'}</span>
                      </div>
                      <p className="mt-1 text-[0.7rem] font-normal text-amber-800">Triggered {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'recently'}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Category dynamics</h2>
            {categories.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
                Category telemetry will appear once inventory syncs from the live panel.
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">Collections & ready-made stacks</h2>
            {collections.length ? (
              <div className="space-y-4">
                {collections.map((collection) => (
                  <article key={collection.id} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Collection</p>
                        <h3 className="mt-1 text-lg font-semibold text-primary">{collection.name}</h3>
                      </div>
                      <BoltIcon className="h-6 w-6 text-primary/70" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{collection.description}</p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-500">
                      {collection.composition?.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span aria-hidden="true">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem] text-slate-500">
                      {collection.coverageZones?.map((zone) => (
                        <span key={zone} className="rounded-full bg-primary/5 px-3 py-1 text-primary">
                          {zone}
                        </span>
                      ))}
                      {collection.automation?.map((automation) => (
                        <span key={automation} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                          {automation}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
                Ready-made kits will surface here once orchestration rules are configured.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Supplier performance</h2>
          <p className="text-sm text-slate-500">Tiering, lead times, and sustainability signals for all marketplace partners.</p>
          {suppliers.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                <thead className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Supplier</th>
                    <th scope="col" className="px-4 py-3">Tier</th>
                    <th scope="col" className="px-4 py-3">Lead time</th>
                    <th scope="col" className="px-4 py-3">Reliability</th>
                    <th scope="col" className="px-4 py-3">Annual spend</th>
                    <th scope="col" className="px-4 py-3">Carbon score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="px-4 py-3 font-semibold text-slate-700">{supplier.name}</td>
                      <td className="px-4 py-3">{supplier.tier}</td>
                      <td className="px-4 py-3">{supplier.leadTimeDays != null ? `${supplier.leadTimeDays.toFixed(1)} days` : '—'}</td>
                      <td className="px-4 py-3">{supplier.reliability != null ? percentageFormatter.format(Math.min(Math.max(supplier.reliability, 0), 1)) : '—'}</td>
                      <td className="px-4 py-3">{currencyFormatter.format(supplier.annualSpend ?? 0)}</td>
                      <td className="px-4 py-3">{supplier.carbonScore != null ? supplier.carbonScore : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
              Supplier analytics will populate once vendor telemetry is connected.
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-primary">Logistics & last-mile timeline</h2>
            <p className="text-sm text-slate-500">Every milestone is telemetry backed with SLA commitments.</p>
            {logistics.length ? (
              <ul className="mt-5 space-y-4">
                {logistics.map((step, index) => (
                  <LogisticsStep key={step.id} step={step} index={index} />
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
                No in-flight logistics events yet. Last-mile milestones will stream in as shipments are scheduled.
              </div>
            )}
          </div>
          <div className="space-y-6">
            <article className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-emerald-900">Compliance posture</h2>
              <p className="text-sm text-emerald-800">{percentageFormatter.format(Math.min(Math.max(insights.compliance?.passingRate ?? 1, 0), 1))} passing rate across governed materials.</p>
              <p className="mt-2 text-xs text-emerald-700">Upcoming audits: {insights.compliance?.upcomingAudits ?? 0}</p>
              <ul className="mt-3 space-y-2 text-xs text-emerald-800">
                {insights.compliance?.expiringCertifications?.map((item) => (
                  <li key={item.id ?? item.name} className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {item.name} · {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'expiry pending'}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-sky-900">Sustainability impact</h2>
              <p className="text-sm text-sky-800">{percentageFormatter.format(Math.min(Math.max(insights.sustainability?.recycledShare ?? 0, 0), 1))} of units sourced from recycled or low-carbon programmes.</p>
              <p className="mt-2 text-xs text-sky-700">CO₂ savings: {insights.sustainability?.co2SavingsTons?.toFixed?.(1) ?? '0.0'} tonnes</p>
              <ul className="mt-3 space-y-2 text-xs text-sky-800">
                {insights.sustainability?.initiatives?.map((initiative) => (
                  <li key={initiative} className="flex items-center gap-2">
                    <BoltIcon className="h-4 w-4" aria-hidden="true" />
                    <span>{initiative}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

function materialsFallbackView() {
  return {
    hero: {
      title: 'Materials control tower',
      subtitle: 'Govern consumables, replenishment cadences, and supplier risk from one command surface.',
      metrics: [
        { id: 'fill-rate', label: 'Fill rate', value: 97, unit: '%' },
        { id: 'stockouts', label: 'Stockouts this quarter', value: 1 },
        { id: 'lead-time', label: 'Average lead time (days)', value: 4 }
      ],
      actions: []
    },
    stats: { totalSkus: 0, totalOnHand: 0, fillRate: 1, alerts: 0, valueOnHand: 0 },
    categories: [],
    suppliers: [],
    inventory: [],
    featured: [],
    collections: [],
    logistics: [],
    insights: {
      compliance: { passingRate: 1, upcomingAudits: 0, expiringCertifications: [] },
      sustainability: { recycledShare: 0, co2SavingsTons: 0, initiatives: [] }
    }
  };
}

AccessDenied.propTypes = {
  onRefresh: PropTypes.func.isRequired,
  deniedReason: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

AccessDenied.defaultProps = {
  deniedReason: null,
  allowedRoles: []
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.string,
  tone: PropTypes.oneOf(['default', 'positive', 'warning', 'neutral'])
};

StatCard.defaultProps = {
  caption: null,
  tone: 'default'
};

CategoryCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    share: PropTypes.number.isRequired,
    safetyStockBreaches: PropTypes.number,
    availability: PropTypes.number
  }).isRequired
};

LogisticsStep.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    status: PropTypes.string,
    eta: PropTypes.string,
    detail: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired
};
