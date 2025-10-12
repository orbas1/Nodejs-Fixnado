import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getProviderDashboard,
  formatters,
  PanelApiError
} from '../api/panelClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const availabilityFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 0
});

const ratingFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 1
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function MetricCard({ icon: Icon, label, value, caption, tone, 'data-qa': dataQa }) {
  return (
    <article
      className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
      data-qa={dataQa}
    >
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
        </div>
      </header>
      {caption ? (
        <p className="mt-4 text-xs text-slate-500" data-qa={`${dataQa}-caption`}>
          {caption}
        </p>
      ) : null}
      {tone ? (
        <div className="mt-4">
          <StatusPill tone={tone}>{tone === 'danger' ? 'Action required' : 'On track'}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

function AlertBanner({ alert }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5"
      data-qa={`provider-dashboard-alert-${alert.id}`}
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="mt-1 h-5 w-5 text-amber-500" aria-hidden="true" />
        <p className="text-sm text-slate-700">{alert.message}</p>
      </div>
      {alert.actionHref ? (
        <Link
          to={alert.actionHref}
          className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-600 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
        >
          {alert.actionLabel || 'Review now'}
        </Link>
      ) : null}
    </div>
  );
}

function ServicemanRow({ member }) {
  return (
    <li
      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:border-primary/40"
      data-qa={`provider-dashboard-serviceman-${member.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{member.name}</p>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{member.role}</p>
        </div>
        <StatusPill tone={member.availability > 0.75 ? 'success' : member.availability < 0.5 ? 'warning' : 'neutral'}>
          {availabilityFormatter.format(member.availability)} available
        </StatusPill>
      </div>
      <p className="text-xs text-slate-500">
        Satisfaction score:{' '}
        <span className="font-semibold text-primary">{ratingFormatter.format((member.rating ?? 0) * 100)}%</span>
      </p>
    </li>
  );
}

function BookingRow({ booking }) {
  return (
    <li
      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4"
      data-qa={`provider-dashboard-booking-${booking.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-primary">{booking.client}</p>
          <p className="text-xs text-slate-500">{booking.service}</p>
        </div>
        {booking.value != null ? (
          <p className="text-sm font-semibold text-primary">{formatters.currency(booking.value)}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {booking.eta ? dateFormatter.format(new Date(booking.eta)) : 'TBC'}
        </span>
        <span className="inline-flex items-center gap-1">
          <ChartBarIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {booking.zone}
        </span>
      </div>
    </li>
  );
}

export default function ProviderDashboard() {
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });

  const loadDashboard = useCallback(async ({ forceRefresh = false, signal } = {}) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await getProviderDashboard({ forceRefresh, signal });
      setState({ loading: false, data: result.data, meta: result.meta, error: result.meta?.error || null });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof PanelApiError ? error : new PanelApiError('Unable to load dashboard', 500, { cause: error })
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDashboard]);

  const provider = state.data?.provider;
  const metrics = state.data?.metrics;
  const revenue = state.data?.revenue;
  const alerts = state.data?.alerts ?? [];
  const bookings = state.data?.pipeline?.upcomingBookings ?? [];
  const compliance = state.data?.pipeline?.expiringCompliance ?? [];
  const servicemen = state.data?.servicemen ?? [];

  const heroStatusTone = useMemo(() => {
    if (!metrics) return 'neutral';
    if (metrics.slaHitRate < 0.92) return 'danger';
    if (metrics.utilisation < 0.55) return 'warning';
    return 'success';
  }, [metrics]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-qa="provider-dashboard">
      <div className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Provider dashboard</p>
            <h1 className="text-3xl font-semibold text-primary" data-qa="provider-dashboard-name">
              {provider?.tradingName || provider?.name || 'Provider'}
            </h1>
            <p className="text-sm text-slate-600" data-qa="provider-dashboard-region">
              Operating region: {provider?.region}
            </p>
            <div className="flex flex-wrap gap-3">
              <StatusPill tone={heroStatusTone}>{`SLA ${formatters.percentage(metrics?.slaHitRate ?? 0)}`}</StatusPill>
              <StatusPill tone="info">{`Utilisation ${formatters.percentage(metrics?.utilisation ?? 0)}`}</StatusPill>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link
              to={`/providers/${provider?.slug ?? 'featured'}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              View business front
            </Link>
            <div className="flex gap-3 text-xs text-slate-500">
              {provider?.supportEmail ? <span>{provider.supportEmail}</span> : null}
              {provider?.supportPhone ? <span>{provider.supportPhone}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {state.loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading metrics">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-3xl" />
            ))}
          </div>
        ) : null}

        {!state.loading && state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5" role="alert">
            <p className="text-sm font-semibold text-rose-600">We could not refresh live metrics.</p>
            <p className="mt-1 text-xs text-rose-500">
              {state.error.message}
              {state.meta?.fallback
                ? ' — showing the most recently cached snapshot. Check your network connection and retry.'
                : ''}
            </p>
          </div>
        ) : null}

        <section aria-labelledby="provider-dashboard-kpis" className="space-y-6">
          <header className="flex items-center justify-between">
            <h2 id="provider-dashboard-kpis" className="text-lg font-semibold text-primary">
              Operational KPIs
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
              onClick={() => loadDashboard({ forceRefresh: true })}
            >
              <ClockIcon className="h-4 w-4" aria-hidden="true" /> Refresh metrics
            </button>
          </header>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-qa="provider-dashboard-kpi-grid">
            <MetricCard
              icon={ClockIcon}
              label="Avg. response"
              value={`${Math.round(metrics?.avgResponseMinutes ?? 0)} mins`}
              caption="Based on dispatch telemetry across the last 7 days"
              data-qa="provider-dashboard-metric-response"
            />
            <MetricCard
              icon={ChartBarIcon}
              label="Active bookings"
              value={formatters.number(metrics?.activeBookings ?? 0)}
              caption="Live engagements across enterprise + marketplace"
              data-qa="provider-dashboard-metric-bookings"
            />
            <MetricCard
              icon={UsersIcon}
              label="Utilisation"
              value={formatters.percentage(metrics?.utilisation ?? 0)}
              caption="Capacity utilisation averaged across teams"
              data-qa="provider-dashboard-metric-utilisation"
            />
            <MetricCard
              icon={LifebuoyIcon}
              label="Satisfaction"
              value={`${ratingFormatter.format((metrics?.satisfaction ?? 0) * 100)} / 100`}
              caption="CSAT from post-job surveys and comms feedback"
              data-qa="provider-dashboard-metric-satisfaction"
            />
          </div>
        </section>

        <section aria-labelledby="provider-dashboard-revenue" className="space-y-4">
          <header className="flex items-center gap-3">
            <ChartBarIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="provider-dashboard-revenue" className="text-lg font-semibold text-primary">
              Revenue & payouts
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="provider-dashboard-revenue-mtd">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Month-to-date revenue</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{formatters.currency(revenue?.monthToDate ?? 0)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="provider-dashboard-revenue-forecast">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Forecast</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{formatters.currency(revenue?.forecast ?? 0)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="provider-dashboard-revenue-outstanding">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Outstanding balance</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{formatters.currency(revenue?.outstandingBalance ?? 0)}</p>
              {revenue?.nextPayoutDate ? (
                <p className="mt-2 text-xs text-slate-500">Next payout {dateFormatter.format(new Date(revenue.nextPayoutDate))}</p>
              ) : null}
            </article>
          </div>
        </section>

        {alerts.length > 0 ? (
          <section aria-labelledby="provider-dashboard-alerts" className="space-y-4">
            <header className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <h2 id="provider-dashboard-alerts" className="text-lg font-semibold text-primary">
                Alerts & follow-ups
              </h2>
            </header>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertBanner key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="provider-dashboard-pipeline" className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <header className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="provider-dashboard-pipeline" className="text-lg font-semibold text-primary">
                Upcoming bookings
              </h2>
            </header>
            <ul className="space-y-3">
              {bookings.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  No upcoming bookings captured for the next 7 days.
                </li>
              ) : (
                bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)
              )}
            </ul>
          </div>
          <div className="space-y-4">
            <header className="flex items-center gap-3">
              <LifebuoyIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">Compliance watchlist</h2>
            </header>
            <ul className="space-y-3">
              {compliance.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  All compliance artefacts are in good standing.
                </li>
              ) : (
                compliance.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4"
                    data-qa={`provider-dashboard-compliance-${item.id}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-primary">{item.name}</p>
                      <p className="text-xs text-slate-500">Owner: {item.owner}</p>
                    </div>
                    <StatusPill tone="warning">
                      Expires {item.expiresOn ? dateFormatter.format(new Date(item.expiresOn)) : 'soon'}
                    </StatusPill>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section aria-labelledby="provider-dashboard-servicemen" className="space-y-4">
          <header className="flex items-center gap-3">
            <UsersIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="provider-dashboard-servicemen" className="text-lg font-semibold text-primary">
              Field team performance
            </h2>
          </header>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servicemen.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                We have not received team telemetry for this provider yet.
              </li>
            ) : (
              servicemen.map((member) => <ServicemanRow key={member.id} member={member} />)
            )}
          </ul>
        </section>
      </div>

      {state.loading && !state.data ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/30" role="status" aria-live="polite">
          <Spinner />
          <span className="sr-only">Loading provider dashboard</span>
        </div>
      ) : null}
    </div>
  );
}

