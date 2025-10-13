import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getProviderStorefront, PanelApiError } from '../api/panelClient.js';
import { useLocale } from '../hooks/useLocale.js';

const actionToneStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-primary/20 bg-primary/5 text-primary',
  neutral: 'border-slate-200 bg-white text-slate-600'
};

const iconToneStyles = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-rose-500',
  info: 'text-primary',
  neutral: 'text-slate-500'
};

function MetricCard({ icon: Icon, label, value, caption, tone }) {
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
        </div>
      </header>
      {caption ? <p className="mt-4 text-xs text-slate-500">{caption}</p> : null}
      {tone ? (
        <div className="mt-4">
          <StatusPill tone={tone}>{tone === 'danger' ? 'Action required' : tone === 'warning' ? 'Monitor closely' : 'On track'}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

function ListingCard({ listing, format, t }) {
  const availabilityKey = `providerStorefront.availability.${listing.availability}`;
  const availabilityLabel = t(availabilityKey) === availabilityKey ? listing.availability : t(availabilityKey);
  const statusKey = `providerStorefront.status.${listing.status}`;
  const statusLabel = t(statusKey) === statusKey ? listing.status.replace(/_/g, ' ') : t(statusKey);
  const toneStyle = actionToneStyles[listing.tone] ?? actionToneStyles.info;
  const iconTone = iconToneStyles[listing.tone] ?? iconToneStyles.info;

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{availabilityLabel}</p>
            <h3 className="mt-1 text-lg font-semibold text-primary">{listing.title}</h3>
            {listing.location ? <p className="text-xs text-slate-500">{listing.location}</p> : null}
          </div>
          <StatusPill tone={listing.tone}>{statusLabel}</StatusPill>
        </header>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerStorefront.listing.stats.requests')}</p>
            <p className="mt-1 text-lg font-semibold text-primary">{format.number(listing.requestVolume ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerStorefront.listing.stats.successful')}</p>
            <p className="mt-1 text-lg font-semibold text-primary">{format.number(listing.successfulAgreements ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerStorefront.listing.stats.duration')}</p>
            <p className="mt-1 text-lg font-semibold text-primary">
              {format.number(Math.round(listing.averageDurationDays ?? 0))} {t('providerStorefront.listing.days')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerStorefront.listing.stats.revenue')}</p>
            <p className="mt-1 text-lg font-semibold text-primary">
              {listing.projectedRevenue != null ? format.currency(listing.projectedRevenue) : t('common.notAvailable')}
            </p>
          </div>
        </div>

        {listing.insuredOnly ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
            {t('providerStorefront.listing.insuredOnly')}
          </div>
        ) : null}

        <dl className="mt-4 space-y-2 text-xs text-slate-500">
          {listing.complianceHoldUntil ? (
            <div>
              <dt className="font-semibold text-slate-600">{t('providerStorefront.listing.complianceHold')}</dt>
              <dd>{format.date(listing.complianceHoldUntil)}</dd>
            </div>
          ) : null}
          {listing.lastReviewedAt ? (
            <div>
              <dt className="font-semibold text-slate-600">{t('providerStorefront.listing.lastReviewed')}</dt>
              <dd>{format.date(listing.lastReviewedAt)}</dd>
            </div>
          ) : null}
        </dl>

        {listing.recommendedActions?.length ? (
          <div className="mt-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerStorefront.listing.actions')}</p>
            <ul className="space-y-2">
              {listing.recommendedActions.map((action) => {
                const actionTone = actionToneStyles[action.tone] ?? toneStyle;
                const iconToneClass = iconToneStyles[action.tone] ?? iconTone;
                return (
                  <li key={action.id} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${actionTone}`}>
                    <BoltIcon className={`mt-1 h-4 w-4 ${iconToneClass}`} aria-hidden="true" />
                    <span>{action.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {listing.agreements?.length ? (
          <div className="mt-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerStorefront.listing.timelineTitle')}</p>
            <ul className="space-y-2">
              {listing.agreements.map((agreement) => {
                const agreementKey = `providerStorefront.agreementStatus.${agreement.status}`;
                const agreementLabel = t(agreementKey) === agreementKey ? agreement.status.replace(/_/g, ' ') : t(agreementKey);
                return (
                  <li
                    key={agreement.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-primary">{agreement.renter ?? t('providerStorefront.listing.unknownRenter')}</p>
                      <p className="text-xs text-slate-500">
                        {t('providerStorefront.listing.agreementWindow', {
                          start: agreement.pickupAt ? format.date(agreement.pickupAt) : t('common.notAvailable'),
                          end: agreement.returnDueAt ? format.date(agreement.returnDueAt) : t('common.notAvailable')
                        })}
                      </p>
                    </div>
                    <StatusPill tone={resolveStatusTone(agreement.status)}>{agreementLabel}</StatusPill>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function resolveStatusTone(status) {
  if (!status) return 'info';
  if (status === 'settled' || status === 'approved' || status === 'completed') return 'success';
  if (status === 'pending_review' || status === 'in_use' || status === 'pickup_scheduled') return 'info';
  if (status === 'inspection_pending') return 'warning';
  if (status === 'disputed' || status === 'suspended' || status === 'rejected') return 'danger';
  return 'neutral';
}

function PlaybookCard({ playbook, t }) {
  const tone = actionToneStyles[playbook.tone] ?? actionToneStyles.info;
  const iconTone = iconToneStyles[playbook.tone] ?? iconToneStyles.info;
  return (
    <article className={`flex h-full flex-col gap-3 rounded-3xl border p-6 shadow-sm ${tone}`}>
      <header className="flex items-start gap-3">
        <SparklesIcon className={`h-5 w-5 ${iconTone}`} aria-hidden="true" />
        <h3 className="text-base font-semibold">{playbook.title}</h3>
      </header>
      <p className="text-sm">{playbook.detail}</p>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('providerStorefront.playbooks.tagline')}</p>
    </article>
  );
}

function TimelineEvent({ event, format, t }) {
  const tone = actionToneStyles[event.tone] ?? actionToneStyles.info;
  const iconTone = iconToneStyles[event.tone] ?? iconToneStyles.info;
  const typeKey = `providerStorefront.timeline.event.${event.type}`;
  const typeLabel = t(typeKey) === typeKey ? event.type.replace(/_/g, ' ') : t(typeKey);
  return (
    <li className={`flex flex-col gap-2 rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <DocumentTextIcon className={`mt-1 h-5 w-5 ${iconTone}`} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-primary">{t('providerStorefront.timeline.eventHeading', { type: typeLabel, listing: event.listingTitle })}</p>
          {event.actor ? <p className="text-xs text-slate-500">{t('providerStorefront.timeline.eventActor', { actor: event.actor })}</p> : null}
        </div>
      </div>
      <p className="text-sm text-slate-600">{event.detail || t('providerStorefront.timeline.eventDefaultDetail')}</p>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{format.dateTime(event.timestamp)}</p>
    </li>
  );
}

export default function ProviderStorefront() {
  const { t, format } = useLocale();
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });

  const loadStorefront = useCallback(async ({ forceRefresh = false, signal } = {}) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await getProviderStorefront({ forceRefresh, signal });
      setState({ loading: false, data: result.data, meta: result.meta, error: null });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load storefront', 500, { cause: error })
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStorefront({ signal: controller.signal });
    return () => controller.abort();
  }, [loadStorefront]);

  const storefront = state.data?.storefront;
  const company = storefront?.company;
  const metrics = storefront?.metrics;
  const listings = state.data?.listings ?? [];
  const playbooks = state.data?.playbooks ?? [];
  const timeline = state.data?.timeline ?? [];
  const snapshotTime = state.meta?.generatedAt ? format.dateTime(state.meta.generatedAt) : null;
  const badgeLabel = company?.badgeVisible
    ? t('providerStorefront.badge.visible')
    : t('providerStorefront.badge.hidden');

  const navigation = useMemo(
    () => [
      {
        id: 'provider-storefront-overview',
        label: t('providerStorefront.nav.overview'),
        description: t('providerStorefront.nav.overviewDescription')
      },
      {
        id: 'provider-storefront-listings',
        label: t('providerStorefront.nav.listings'),
        description: t('providerStorefront.nav.listingsDescription')
      },
      {
        id: 'provider-storefront-playbooks',
        label: t('providerStorefront.nav.playbooks'),
        description: t('providerStorefront.nav.playbooksDescription')
      },
      {
        id: 'provider-storefront-timeline',
        label: t('providerStorefront.nav.timeline'),
        description: t('providerStorefront.nav.timelineDescription')
      }
    ],
    [t]
  );

  const heroBadges = useMemo(() => {
    const complianceTone = company?.complianceScore >= 85 ? 'success' : company?.complianceScore >= 70 ? 'warning' : 'danger';
    const conversionTone = metrics?.conversionRate >= 0.6 ? 'success' : metrics?.conversionRate >= 0.4 ? 'info' : 'warning';
    return [
      {
        tone: complianceTone,
        label: t('providerStorefront.heroCompliance', { value: format.number(Math.round(company?.complianceScore ?? 0)) })
      },
      {
        tone: conversionTone,
        label: t('providerStorefront.heroConversion', {
          value: format.percentage(metrics?.conversionRate ?? 0)
        })
      }
    ];
  }, [company?.complianceScore, metrics?.conversionRate, format, t]);

  const heroAside = (
    <div className="flex flex-col items-start gap-3 lg:items-end">
      <div className="flex flex-wrap gap-3">
        <Link
          to="/provider/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
        >
          <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
          {t('providerStorefront.heroSecondaryCta')}
        </Link>
        <Link
          to={`/providers/${company?.id ?? 'featured'}`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <BuildingStorefrontIcon className="h-4 w-4" aria-hidden="true" />
          {t('providerStorefront.heroCta')}
        </Link>
      </div>
      <div className="flex flex-col items-start gap-1 text-xs text-slate-500 lg:items-end">
        {snapshotTime ? <span>{t('providerStorefront.sidebar.generatedAt', { time: snapshotTime })}</span> : null}
        <span>{badgeLabel}</span>
      </div>
    </div>
  );

  const sidebarMeta = [
    {
      label: t('providerStorefront.sidebar.complianceScore'),
      value: format.number(Math.round(company?.complianceScore ?? 0))
    },
    {
      label: t('providerStorefront.sidebar.badge'),
      value: badgeLabel
    },
    {
      label: t('providerStorefront.sidebar.listings'),
      value: format.number(metrics?.activeListings ?? 0)
    },
    {
      label: t('providerStorefront.sidebar.requests'),
      value: format.number(metrics?.totalRequests ?? 0)
    }
  ];

  const sidebar = {
    eyebrow: t('providerStorefront.sidebar.eyebrow'),
    title: t('providerStorefront.sidebar.title'),
    description: t('providerStorefront.sidebar.description'),
    meta: sidebarMeta
  };

  const handleRefresh = useCallback(() => {
    loadStorefront({ forceRefresh: true });
  }, [loadStorefront]);

  return (
    <div className="bg-slate-50 text-slate-900">
      <DashboardShell
        eyebrow={t('providerStorefront.heroEyebrow')}
        title={t('providerStorefront.heroTitle', { name: company?.name ?? 'Provider' })}
        subtitle={t('providerStorefront.heroSubtitle')}
        heroBadges={heroBadges}
        heroAside={heroAside}
        navigation={navigation}
        sidebar={sidebar}
      >
        <section id="provider-storefront-overview" className="space-y-4">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerStorefront.overview.heading')}</h2>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              {t('providerStorefront.refresh')}
            </button>
          </header>
          {state.loading && !state.data ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-40 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={CheckBadgeIcon}
                label={t('providerStorefront.metrics.active')}
                value={format.number(metrics?.activeListings ?? 0)}
              />
              <MetricCard
                icon={ClockIcon}
                label={t('providerStorefront.metrics.pending')}
                value={format.number(metrics?.pendingReview ?? 0)}
                tone={metrics?.pendingReview > 0 ? 'warning' : 'info'}
              />
              <MetricCard
                icon={DocumentTextIcon}
                label={t('providerStorefront.metrics.flagged')}
                value={format.number(metrics?.flagged ?? 0)}
                tone={metrics?.flagged > 0 ? 'danger' : 'info'}
              />
              <MetricCard
                icon={ArrowTrendingUpIcon}
                label={t('providerStorefront.metrics.conversion')}
                value={format.percentage(metrics?.conversionRate ?? 0)}
                caption={t('providerStorefront.metrics.requestsValue', {
                  value: format.number(metrics?.totalRequests ?? 0)
                })}
              />
            </div>
          )}

          {state.meta?.fallback ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700">
              {t('providerStorefront.offlineNotice')}
            </div>
          ) : null}

          {state.error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600">
              {t('providerStorefront.errorLoading')}
            </div>
          ) : null}
        </section>

        <section id="provider-storefront-listings" className="space-y-4">
          <header className="flex items-center gap-3">
            <BuildingStorefrontIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-primary">{t('providerStorefront.listings.heading')}</h2>
          </header>
          {state.loading && !state.data ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-72 rounded-3xl" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              {t('providerStorefront.listings.empty')}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} format={format} t={t} />
              ))}
            </div>
          )}
        </section>

        <section id="provider-storefront-playbooks" className="space-y-4">
          <header className="flex items-center gap-3">
            <BoltIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-primary">{t('providerStorefront.playbooks.heading')}</h2>
          </header>
          {playbooks.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              {t('providerStorefront.playbooks.empty')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {playbooks.map((playbook) => (
                <PlaybookCard key={playbook.id} playbook={playbook} t={t} />
              ))}
            </div>
          )}
        </section>

        <section id="provider-storefront-timeline" className="space-y-4">
          <header className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-primary">{t('providerStorefront.timeline.heading')}</h2>
          </header>
          {timeline.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              {t('providerStorefront.timeline.empty')}
            </div>
          ) : (
            <ul className="space-y-3">
              {timeline.map((event) => (
                <TimelineEvent key={event.id} event={event} format={format} t={t} />
              ))}
            </ul>
          )}
        </section>
      </DashboardShell>

      {state.loading && state.data ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/30" role="status" aria-live="polite">
          <Spinner className="h-10 w-10 text-primary" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : null}
    </div>
  );
}

