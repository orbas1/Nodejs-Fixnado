import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
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
import { useSession } from '../hooks/useSession.js';
import { formatRoleLabel, PROVIDER_STOREFRONT_ALLOWED_ROLES } from '../constants/accessControl.js';
import ProviderDashboardTheme from './providerDashboard/components/ProviderDashboardTheme.jsx';

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

function MetricCard({ icon: Icon, label, value, caption, tone, toneLabel }) {
  return (
    <article className="provider-dashboard__card">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--provider-border)] bg-[var(--provider-accent-soft)] text-[var(--provider-accent)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="provider-dashboard__card-label">{label}</p>
          <p className="provider-dashboard__card-title text-2xl">{value}</p>
        </div>
      </header>
      {caption ? <p className="provider-dashboard__card-meta">{caption}</p> : null}
      {tone ? (
        <div>
          <StatusPill tone={tone}>{toneLabel ?? 'Status update'}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
  caption: PropTypes.node,
  tone: PropTypes.oneOf(['success', 'warning', 'danger', 'info', 'neutral']),
  toneLabel: PropTypes.string
};

MetricCard.defaultProps = {
  caption: null,
  tone: null,
  toneLabel: null
};

function ListingCard({ listing, format, t }) {
  const availabilityKey = `providerStorefront.availability.${listing.availability}`;
  const availabilityLabel = t(availabilityKey) === availabilityKey ? listing.availability : t(availabilityKey);
  const statusKey = `providerStorefront.status.${listing.status}`;
  const statusLabel = t(statusKey) === statusKey ? listing.status.replace(/_/g, ' ') : t(statusKey);
  const toneStyle = actionToneStyles[listing.tone] ?? actionToneStyles.info;
  const iconTone = iconToneStyles[listing.tone] ?? iconToneStyles.info;

  return (
    <article className="provider-dashboard__card h-full">
      <header className="provider-dashboard__section-header">
        <div>
          <p className="provider-dashboard__card-label text-[var(--provider-accent)] opacity-75">{availabilityLabel}</p>
          <h3 className="provider-dashboard__card-title text-xl">{listing.title}</h3>
          {listing.location ? (
            <p className="provider-dashboard__card-meta">{listing.location}</p>
          ) : null}
        </div>
        <StatusPill tone={listing.tone}>{statusLabel}</StatusPill>
      </header>
      <div className="provider-dashboard__grid provider-dashboard__grid--wide sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="provider-dashboard__card-label">{t('providerStorefront.listing.stats.requests')}</p>
          <p className="provider-dashboard__card-title text-xl">{format.number(listing.requestVolume ?? 0)}</p>
        </div>
        <div>
          <p className="provider-dashboard__card-label">{t('providerStorefront.listing.stats.successful')}</p>
          <p className="provider-dashboard__card-title text-xl">{format.number(listing.successfulAgreements ?? 0)}</p>
        </div>
        <div>
          <p className="provider-dashboard__card-label">{t('providerStorefront.listing.stats.duration')}</p>
          <p className="provider-dashboard__card-title text-xl">
            {format.number(Math.round(listing.averageDurationDays ?? 0))} {t('providerStorefront.listing.days')}
          </p>
        </div>
        <div>
          <p className="provider-dashboard__card-label">{t('providerStorefront.listing.stats.revenue')}</p>
          <p className="provider-dashboard__card-title text-xl">
            {listing.projectedRevenue != null ? format.currency(listing.projectedRevenue) : t('common.notAvailable')}
          </p>
        </div>
      </div>

      {listing.insuredOnly ? (
        <div className="provider-dashboard__pill mt-4 inline-flex items-center gap-2">
          <CheckBadgeIcon className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span className="font-semibold text-[var(--provider-text-primary)]">
            {t('providerStorefront.listing.insuredOnly')}
          </span>
        </div>
      ) : null}

      <dl className="provider-dashboard__list provider-dashboard__list--dense text-xs text-[var(--provider-text-secondary)]">
        {listing.complianceHoldUntil ? (
          <div>
            <dt className="font-semibold text-[var(--provider-text-primary)]">
              {t('providerStorefront.listing.complianceHold')}
            </dt>
            <dd>{format.date(listing.complianceHoldUntil)}</dd>
          </div>
        ) : null}
        {listing.lastReviewedAt ? (
          <div>
            <dt className="font-semibold text-[var(--provider-text-primary)]">
              {t('providerStorefront.listing.lastReviewed')}
            </dt>
            <dd>{format.date(listing.lastReviewedAt)}</dd>
          </div>
        ) : null}
      </dl>

      {listing.recommendedActions?.length ? (
        <div className="provider-dashboard__list mt-6">
          <p className="provider-dashboard__card-label">{t('providerStorefront.listing.actions')}</p>
          <ul className="provider-dashboard__list">
            {listing.recommendedActions.map((action) => {
              const actionTone = actionToneStyles[action.tone] ?? toneStyle;
              const iconToneClass = iconToneStyles[action.tone] ?? iconTone;
              return (
                <li
                  key={action.id}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${actionTone}`}
                >
                  <BoltIcon className={`mt-1 h-4 w-4 ${iconToneClass}`} aria-hidden="true" />
                  <span>{action.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {listing.agreements?.length ? (
        <div className="provider-dashboard__list mt-6">
          <p className="provider-dashboard__card-label">{t('providerStorefront.listing.timelineTitle')}</p>
          <ul className="provider-dashboard__list">
            {listing.agreements.map((agreement) => {
              const agreementKey = `providerStorefront.agreementStatus.${agreement.status}`;
              const agreementLabel = t(agreementKey) === agreementKey ? agreement.status.replace(/_/g, ' ') : t(agreementKey);
              return (
                <li
                  key={agreement.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--provider-border)] bg-[var(--provider-surface-muted)] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--provider-text-primary)]">
                      {agreement.renter ?? t('providerStorefront.listing.unknownRenter')}
                    </p>
                    <p className="text-xs text-[var(--provider-text-secondary)]">
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
    </article>
  );
}

ListingCard.propTypes = {
  listing: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    availability: PropTypes.string,
    status: PropTypes.string,
    tone: PropTypes.string,
    title: PropTypes.string.isRequired,
    location: PropTypes.string,
    requestVolume: PropTypes.number,
    successfulAgreements: PropTypes.number,
    averageDurationDays: PropTypes.number,
    projectedRevenue: PropTypes.number,
    insuredOnly: PropTypes.bool,
    complianceHoldUntil: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    lastReviewedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    recommendedActions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        tone: PropTypes.string
      })
    ),
    agreements: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        renter: PropTypes.string,
        status: PropTypes.string,
        pickupAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        returnDueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
      })
    )
  }).isRequired,
  format: PropTypes.shape({
    number: PropTypes.func.isRequired,
    currency: PropTypes.func,
    date: PropTypes.func.isRequired,
    dateTime: PropTypes.func
  }).isRequired,
  t: PropTypes.func.isRequired
};

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
    <article className={`provider-dashboard__card h-full ${tone}`}>
      <header className="flex items-start gap-3">
        <SparklesIcon className={`h-5 w-5 ${iconTone}`} aria-hidden="true" />
        <h3 className="provider-dashboard__card-title text-lg">{playbook.title}</h3>
      </header>
      <p className="provider-dashboard__card-meta text-sm">{playbook.detail}</p>
      <p className="provider-dashboard__card-label text-xs">
        {t('providerStorefront.playbooks.tagline')}
      </p>
    </article>
  );
}

PlaybookCard.propTypes = {
  playbook: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    detail: PropTypes.string.isRequired,
    tone: PropTypes.string
  }).isRequired,
  t: PropTypes.func.isRequired
};

function TimelineEvent({ event, format, t }) {
  const tone = actionToneStyles[event.tone] ?? actionToneStyles.info;
  const iconTone = iconToneStyles[event.tone] ?? iconToneStyles.info;
  const typeKey = `providerStorefront.timeline.event.${event.type}`;
  const typeLabel = t(typeKey) === typeKey ? event.type.replace(/_/g, ' ') : t(typeKey);
  return (
    <li className={`provider-dashboard__card ${tone}`}>
      <div className="flex items-start gap-3">
        <DocumentTextIcon className={`mt-1 h-5 w-5 ${iconTone}`} aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-[var(--provider-text-primary)]">
            {t('providerStorefront.timeline.eventHeading', { type: typeLabel, listing: event.listingTitle })}
          </p>
          {event.actor ? (
            <p className="text-xs text-[var(--provider-text-secondary)]">
              {t('providerStorefront.timeline.eventActor', { actor: event.actor })}
            </p>
          ) : null}
        </div>
      </div>
      <p className="provider-dashboard__card-meta text-sm">
        {event.detail || t('providerStorefront.timeline.eventDefaultDetail')}
      </p>
      <p className="provider-dashboard__card-label text-xs">{format.dateTime(event.timestamp)}</p>
    </li>
  );
}

TimelineEvent.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    tone: PropTypes.string,
    type: PropTypes.string.isRequired,
    listingTitle: PropTypes.string,
    actor: PropTypes.string,
    detail: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
  }).isRequired,
  format: PropTypes.shape({
    dateTime: PropTypes.func.isRequired
  }).isRequired,
  t: PropTypes.func.isRequired
};

export default function ProviderStorefront() {
  const { t, format } = useLocale();
  const { role } = useSession();
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });

  const panelRole = role === 'admin' ? 'admin' : role === 'provider' ? 'company' : null;
  const panelPersona = role === 'admin' ? 'admin' : role === 'provider' ? 'provider' : null;
  const allowedRoleLabel = useMemo(
    () => PROVIDER_STOREFRONT_ALLOWED_ROLES.map((entry) => formatRoleLabel(entry)).join(' or '),
    []
  );
  const accessDenied = state.error?.status === 403;

  const loadStorefront = useCallback(async ({ forceRefresh = false, signal } = {}) => {
    if (!panelRole || !panelPersona) {
      setState((current) => {
        if (current.error?.status === 403 && !current.loading) {
          return current;
        }
        return { loading: false, data: null, meta: null, error: new PanelApiError('Access denied', 403) };
      });
      return;
    }
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await getProviderStorefront({ forceRefresh, signal, role: panelRole, persona: panelPersona });
      setState({ loading: false, data: result.data, meta: result.meta, error: null });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load storefront', 500, { cause: error })
      }));
    }
  }, [panelPersona, panelRole]);

  useEffect(() => {
    if (!panelRole || !panelPersona) {
      setState((current) => {
        if (current.error?.status === 403 && !current.loading) {
          return current;
        }
        return { loading: false, data: null, meta: null, error: new PanelApiError('Access denied', 403) };
      });
      return undefined;
    }
    const controller = new AbortController();
    loadStorefront({ signal: controller.signal });
    return () => controller.abort();
  }, [loadStorefront, panelPersona, panelRole]);

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

  const toneLabels = useMemo(
    () => ({
      danger: t('providerStorefront.metrics.pill.danger'),
      warning: t('providerStorefront.metrics.pill.warning'),
      success: t('providerStorefront.metrics.pill.success'),
      info: t('providerStorefront.metrics.pill.info'),
      neutral: t('providerStorefront.metrics.pill.neutral')
    }),
    [t]
  );

  const getToneLabel = useCallback((tone) => toneLabels[tone] ?? toneLabels.info, [toneLabels]);

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
    <div className="provider-dashboard__aside provider-dashboard__aside--end">
      <div className="provider-dashboard__badge-list">
        <Link
          to="/provider/dashboard"
          className="provider-dashboard__button provider-dashboard__button--outline text-xs"
        >
          <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
          {t('providerStorefront.heroSecondaryCta')}
        </Link>
        <Link
          to={`/providers/${company?.id ?? 'featured'}`}
          className="provider-dashboard__button provider-dashboard__button--primary text-xs"
        >
          <BuildingStorefrontIcon className="h-4 w-4" aria-hidden="true" />
          {t('providerStorefront.heroCta')}
        </Link>
      </div>
      <div className="flex flex-col items-start gap-1 text-xs text-[var(--provider-text-secondary)] lg:items-end">
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

  const pendingTone = metrics?.pendingReview > 0 ? 'warning' : 'info';
  const flaggedTone = metrics?.flagged > 0 ? 'danger' : 'info';
  const conversionTone = metrics?.conversionRate >= 0.6 ? 'success' : metrics?.conversionRate >= 0.4 ? 'info' : 'warning';

  return (
    <DashboardShell
      eyebrow={t('providerStorefront.heroEyebrow')}
      title={t('providerStorefront.heroTitle', { name: company?.name ?? 'Provider' })}
      subtitle={t('providerStorefront.heroSubtitle')}
      heroBadges={heroBadges}
      heroAside={heroAside}
      navigation={navigation}
      sidebar={sidebar}
      contentClassName="provider-dashboard-shell"
      fullWidth
    >
      <ProviderDashboardTheme
        as="div"
        className="provider-dashboard provider-dashboard--storefront"
        variant="daybreak"
      >
        {accessDenied ? (
          <section className="provider-dashboard__section provider-dashboard__section--muted">
            <header className="provider-dashboard__section-header">
              <div className="provider-dashboard__section-header-title">
                <ShieldCheckIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
                <h2 className="provider-dashboard__section-heading">
                  {t('providerStorefront.guard.title')}
                </h2>
              </div>
            </header>
            <p className="provider-dashboard__card-label">
              {t('providerStorefront.guard.restricted')}
            </p>
            <p className="provider-dashboard__card-meta text-sm">
              {t('providerStorefront.guard.body', { roles: allowedRoleLabel })}
            </p>
            <p className="provider-dashboard__card-meta text-sm">
              {t('providerStorefront.guard.help')}
            </p>
          </section>
        ) : (
          <>
            <section id="provider-storefront-overview" className="provider-dashboard__section provider-dashboard__section--muted">
              <header className="provider-dashboard__section-header">
                <div className="provider-dashboard__section-header-title">
                  <ShieldCheckIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
                  <div>
                    <h2 className="provider-dashboard__section-heading">
                      {t('providerStorefront.overview.heading')}
                    </h2>
                    <p className="provider-dashboard__section-description">
                      {t('providerStorefront.overview.description')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="provider-dashboard__button provider-dashboard__button--outline text-xs"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  {t('providerStorefront.refresh')}
                </button>
              </header>
              {state.loading && !state.data ? (
                <div className="provider-dashboard__grid provider-dashboard__grid--wide">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-40 rounded-[var(--provider-radius-md)] bg-white/40"
                    />
                  ))}
                </div>
              ) : (
                <div className="provider-dashboard__grid provider-dashboard__grid--wide">
                  <MetricCard
                    icon={CheckBadgeIcon}
                    label={t('providerStorefront.metrics.active')}
                    value={format.number(metrics?.activeListings ?? 0)}
                  />
                  <MetricCard
                    icon={ClockIcon}
                    label={t('providerStorefront.metrics.pending')}
                    value={format.number(metrics?.pendingReview ?? 0)}
                    tone={pendingTone}
                    toneLabel={getToneLabel(pendingTone)}
                  />
                  <MetricCard
                    icon={DocumentTextIcon}
                    label={t('providerStorefront.metrics.flagged')}
                    value={format.number(metrics?.flagged ?? 0)}
                    tone={flaggedTone}
                    toneLabel={getToneLabel(flaggedTone)}
                  />
                  <MetricCard
                    icon={ArrowTrendingUpIcon}
                    label={t('providerStorefront.metrics.conversion')}
                    value={format.percentage(metrics?.conversionRate ?? 0)}
                    caption={t('providerStorefront.metrics.requestsValue', {
                      value: format.number(metrics?.totalRequests ?? 0)
                    })}
                    tone={conversionTone}
                    toneLabel={getToneLabel(conversionTone)}
                  />
                </div>
              )}

              {state.meta?.fallback ? (
                <div className="provider-dashboard__card provider-dashboard__card-muted text-amber-600">
                  {t('providerStorefront.offlineNotice')}
                </div>
              ) : null}

              {state.error && state.error.status !== 403 ? (
                <div className="provider-dashboard__card provider-dashboard__card-muted text-rose-500">
                  {t('providerStorefront.errorLoading')}
                </div>
              ) : null}
            </section>

            <section id="provider-storefront-listings" className="provider-dashboard__section provider-dashboard__section--muted">
              <header className="provider-dashboard__section-header">
                <div className="provider-dashboard__section-header-title">
                  <BuildingStorefrontIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
                  <div>
                    <h2 className="provider-dashboard__section-heading">
                      {t('providerStorefront.listings.heading')}
                    </h2>
                    <p className="provider-dashboard__section-description">
                      {t('providerStorefront.listings.description')}
                    </p>
                  </div>
                </div>
              </header>
              {state.loading && !state.data ? (
                <div className="provider-dashboard__grid">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-72 rounded-[var(--provider-radius-md)] bg-white/40"
                    />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="provider-dashboard__card provider-dashboard__card-muted text-sm text-[var(--provider-text-secondary)]">
                  {t('providerStorefront.listings.empty')}
                </div>
              ) : (
                <div className="provider-dashboard__grid xl:grid-cols-2">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} format={format} t={t} />
                  ))}
                </div>
              )}
            </section>

            <section id="provider-storefront-playbooks" className="provider-dashboard__section provider-dashboard__section--muted">
              <header className="provider-dashboard__section-header">
                <div className="provider-dashboard__section-header-title">
                  <BoltIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
                  <div>
                    <h2 className="provider-dashboard__section-heading">
                      {t('providerStorefront.playbooks.heading')}
                    </h2>
                    <p className="provider-dashboard__section-description">
                      {t('providerStorefront.playbooks.description')}
                    </p>
                  </div>
                </div>
              </header>
              {playbooks.length === 0 ? (
                <div className="provider-dashboard__card provider-dashboard__card-muted text-sm text-[var(--provider-text-secondary)]">
                  {t('providerStorefront.playbooks.empty')}
                </div>
              ) : (
                <div className="provider-dashboard__grid md:grid-cols-2">
                  {playbooks.map((playbook) => (
                    <PlaybookCard key={playbook.id} playbook={playbook} t={t} />
                  ))}
                </div>
              )}
            </section>

            <section id="provider-storefront-timeline" className="provider-dashboard__section provider-dashboard__section--muted">
              <header className="provider-dashboard__section-header">
                <div className="provider-dashboard__section-header-title">
                  <ClockIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
                  <div>
                    <h2 className="provider-dashboard__section-heading">
                      {t('providerStorefront.timeline.heading')}
                    </h2>
                    <p className="provider-dashboard__section-description">
                      {t('providerStorefront.timeline.description')}
                    </p>
                  </div>
                </div>
              </header>
              {timeline.length === 0 ? (
                <div className="provider-dashboard__card provider-dashboard__card-muted text-sm text-[var(--provider-text-secondary)]">
                  {t('providerStorefront.timeline.empty')}
                </div>
              ) : (
                <ul className="provider-dashboard__list">
                  {timeline.map((event) => (
                    <TimelineEvent key={event.id} event={event} format={format} t={t} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </ProviderDashboardTheme>

      {state.loading && state.data ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/30 backdrop-blur" role="status" aria-live="polite">
          <Spinner className="h-10 w-10 text-primary" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : null}
    </DashboardShell>
  );
}

