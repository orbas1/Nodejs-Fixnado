import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getProviderDashboard, PanelApiError } from '../api/panelClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StatusPill from '../components/ui/StatusPill.jsx';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  MapPinIcon,
  TagIcon,
  UsersIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { useLocale } from '../hooks/useLocale.js';
import useRoleAccess from '../hooks/useRoleAccess.js';
import useSession from '../hooks/useSession.js';
import DashboardRoleGuard from '../components/dashboard/DashboardRoleGuard.jsx';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';

function MetricCard({ icon: Icon, label, value, caption, tone, toneLabel, 'data-qa': dataQa }) {
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
          <StatusPill tone={tone}>{toneLabel}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

function AlertBanner({ alert }) {
  const { t } = useLocale();

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5"
      role="alert"
      aria-live="assertive"
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
          {alert.actionLabel || t('providerDashboard.alertAction')}
        </Link>
      ) : null}
    </div>
  );
}

function ServicemanRow({ member }) {
  const { t, format } = useLocale();
  const availability = typeof member.availability === 'number' ? member.availability : 0;
  const availabilityTone = availability > 0.75 ? 'success' : availability < 0.5 ? 'warning' : 'neutral';
  const availabilityLabel = format.percentage(availability, { maximumFractionDigits: 0 });
  const satisfactionLabel = format.percentage(member.rating ?? 0, { maximumFractionDigits: 0 });

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
        <StatusPill tone={availabilityTone}>
          {t('providerDashboard.servicemanAvailability', { value: availabilityLabel })}
        </StatusPill>
      </div>
      <p className="text-xs text-slate-500">
        {t('providerDashboard.servicemanSatisfaction', {
          value: satisfactionLabel
        })}
      </p>
    </li>
  );
}

function BookingRow({ booking }) {
  const { t, format } = useLocale();
  const etaLabel = booking.eta ? format.dateTime(booking.eta) : t('providerDashboard.bookingsEtaUnknown');

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
          <p className="text-sm font-semibold text-primary">{format.currency(booking.value)}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {etaLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <ChartBarIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {booking.zone}
        </span>
      </div>
    </li>
  );
}

function ServiceHealthCard({ metric }) {
  const { format } = useLocale();

  let valueLabel;
  switch (metric.format) {
    case 'percent':
    case 'percentage':
      valueLabel = format.percentage(metric.value ?? 0, { maximumFractionDigits: 0 });
      break;
    case 'currency':
      valueLabel = format.currency(metric.value ?? 0);
      break;
    default:
      valueLabel = format.number(metric.value ?? 0);
  }

  return (
    <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa={`provider-dashboard-service-metric-${metric.id}`}>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{metric.label}</p>
        <p className="mt-2 text-2xl font-semibold text-primary">{valueLabel}</p>
      </div>
      {metric.caption ? <p className="mt-4 text-xs text-slate-500">{metric.caption}</p> : null}
      {metric.target != null ? (
        <p className="mt-2 text-[0.7rem] uppercase tracking-[0.25em] text-slate-400">Target • {format.number(metric.target)}</p>
      ) : null}
    </article>
  );
}

function resolveRiskTone(risk) {
  const value = typeof risk === 'string' ? risk.toLowerCase() : '';
  if (value.includes('critical') || value.includes('risk')) return 'danger';
  if (value.includes('warning') || value.includes('watch')) return 'warning';
  if (value.includes('hold') || value.includes('paused')) return 'info';
  return 'success';
}

function ServiceDeliveryColumn({ column }) {
  const { format, t } = useLocale();

  return (
    <div className="flex h-full min-h-[18rem] flex-col rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm" data-qa={`provider-dashboard-delivery-column-${column.id}`}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('providerDashboard.serviceDeliveryStage')}</p>
          <h3 className="mt-1 text-lg font-semibold text-primary">{column.title}</h3>
        </div>
        <StatusPill tone="neutral">{column.items.length}</StatusPill>
      </header>
      {column.description ? <p className="mt-2 text-xs text-slate-500">{column.description}</p> : null}
      <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {column.items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
            {t('providerDashboard.serviceDeliveryEmpty')}
          </li>
        ) : (
          column.items.map((item) => {
            const eta = item.eta ? format.dateTime(item.eta) : t('providerDashboard.serviceDeliveryEtaPending');
            const valueLabel = item.value != null ? format.currency(item.value, { currency: item.currency || 'GBP' }) : null;
            const tone = resolveRiskTone(item.risk);

            return (
              <li
                key={item.id}
                className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                data-qa={`provider-dashboard-delivery-item-${item.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.client}</p>
                  </div>
                  <StatusPill tone={tone}>{item.risk || t('providerDashboard.serviceDeliveryOnTrack')}</StatusPill>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                    {t('providerDashboard.serviceDeliveryEta', { date: eta })}
                  </span>
                  {item.zone ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {item.zone}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                    {item.owner}
                  </span>
                  {valueLabel ? <span className="inline-flex items-center gap-1 text-primary font-semibold">{valueLabel}</span> : null}
                </div>
                {item.services?.length ? (
                  <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-primary/60">
                    {item.services.map((service) => (
                      <span key={service} className="rounded-full bg-primary/5 px-3 py-1">
                        {service}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function ServicePackageCard({ pkg }) {
  const { format, t } = useLocale();
  const priceLabel = pkg.price != null ? format.currency(pkg.price, { currency: pkg.currency || 'GBP' }) : t('common.notAvailable');

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-primary/10 bg-primary/5 p-6 shadow-sm" data-qa={`provider-dashboard-package-${pkg.id}`}>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/70">{t('providerDashboard.servicePackageLabel')}</p>
        <h3 className="mt-2 text-lg font-semibold text-primary">{pkg.name}</h3>
        <p className="mt-2 text-sm text-slate-600">{pkg.description}</p>
      </div>
      {pkg.highlights?.length ? (
        <ul className="mt-4 space-y-2 text-sm text-primary">
          {pkg.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <CheckBadgeIcon className="mt-1 h-4 w-4" aria-hidden="true" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 text-sm font-semibold text-primary/90">{priceLabel}</div>
      {pkg.serviceName ? (
        <p className="mt-2 text-[0.7rem] uppercase tracking-[0.3em] text-slate-400">
          {t('providerDashboard.servicePackageLinkedService', { name: pkg.serviceName })}
        </p>
      ) : null}
    </article>
  );
}

function ServiceCategoryCard({ category }) {
  const { format, t } = useLocale();
  const performanceLabel = category.performance != null ? format.percentage(category.performance, { maximumFractionDigits: 0 }) : null;

  return (
    <article className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm" data-qa={`provider-dashboard-category-${category.id}`}>
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{category.type}</p>
        <h3 className="mt-1 text-lg font-semibold text-primary">{category.label}</h3>
      </header>
      {category.description ? <p className="text-sm text-slate-600">{category.description}</p> : null}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <TagIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('providerDashboard.serviceCategoryServices', { count: category.activeServices })}
        </span>
        {performanceLabel ? (
          <span className="inline-flex items-center gap-1 text-primary font-semibold">
            <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
            {performanceLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ServiceCatalogueCard({ service }) {
  const { format, t } = useLocale();
  const priceLabel = service.price != null ? format.currency(service.price, { currency: service.currency || 'GBP' }) : t('common.notAvailable');
  const availabilityLabel = service.availability?.detail
    ? t('providerDashboard.serviceAvailabilityScheduled', { date: format.dateTime(service.availability.detail) })
    : service.availability?.label || t('providerDashboard.serviceAvailabilityDefault');

  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm" data-qa={`provider-dashboard-catalogue-${service.id}`}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{service.type}</p>
          <h3 className="mt-1 text-lg font-semibold text-primary">{service.name}</h3>
        </div>
        <span className="text-sm font-semibold text-primary">{priceLabel}</span>
      </header>
      <p className="text-sm text-slate-600">{service.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <TagIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {service.category}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {availabilityLabel}
        </span>
      </div>
      {service.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {service.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-primary/70">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {service.coverage?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {service.coverage.slice(0, 4).map((zone) => (
            <span key={zone} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
              <MapPinIcon className="h-4 w-4 text-primary" aria-hidden="true" />
              {zone}
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export default function ProviderDashboard() {
  const { t, format } = useLocale();
  const { role, hasAccess } = useRoleAccess(['provider'], { allowFallbackRoles: ['admin'] });
  const session = useSession();
  const providerRoleMeta = useMemo(
    () => DASHBOARD_ROLES.find((role) => role.id === 'provider') || null,
    []
  );
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });
  const hasProviderAccess = session.dashboards.includes('provider');
  const allowProviderDashboard = session.isAuthenticated && hasProviderAccess;

  const loadDashboard = useCallback(
    async ({ forceRefresh = false, signal } = {}) => {
      if (!hasAccess || !allowProviderDashboard) {
        setState((current) => ({ ...current, loading: false }));
        return;
      }

      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const result = await getProviderDashboard({ forceRefresh, signal });
        setState({
          loading: false,
          data: result.data,
          meta: result.meta,
          error: result.meta?.error || null
        });
      } catch (error) {
        if (error instanceof PanelApiError && error.status === 408 && error.cause?.name === 'AbortError') {
          return;
        }
        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof PanelApiError
              ? error
              : new PanelApiError('Unable to load dashboard', 500, { cause: error })
        }));
      }
    },
    [allowProviderDashboard, hasAccess]
  );

  useEffect(() => {
    if (!allowProviderDashboard) {
      setState({ loading: false, data: null, meta: null, error: null });
    }
  }, [allowProviderDashboard]);

  useEffect(() => {
    if (!hasAccess) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }
  }, [hasAccess]);

  useEffect(() => {
    if (!allowProviderDashboard) {
      return undefined;
    }

    const controller = new AbortController();
    loadDashboard({ signal: controller.signal });

    return () => controller.abort();
  }, [allowProviderDashboard, loadDashboard]);

  const provider = state.data?.provider;
  const metrics = state.data?.metrics;
  const revenue = state.data?.revenue;
  const alerts = state.data?.alerts ?? [];
  const bookings = state.data?.pipeline?.upcomingBookings ?? [];
  const compliance = state.data?.pipeline?.expiringCompliance ?? [];
  const servicemen = state.data?.servicemen ?? [];
  const serviceManagement = state.data?.serviceManagement ?? {};
  const serviceHealth = serviceManagement.health ?? [];
  const deliveryBoard = serviceManagement.deliveryBoard ?? [];
  const servicePackages = serviceManagement.packages ?? [];
  const serviceCategories = serviceManagement.categories ?? [];
  const serviceCatalogue = serviceManagement.catalogue ?? [];

  const heroStatusTone = useMemo(() => {
    if (!metrics) return 'neutral';
    if (metrics.slaHitRate < 0.92) return 'danger';
    if (metrics.utilisation < 0.55) return 'warning';
    return 'success';
  }, [metrics]);

  const navigation = useMemo(() => {
    const items = [
      {
        id: 'provider-dashboard-kpis',
        label: t('providerDashboard.metricsHeadline'),
        description: t('providerDashboard.nav.metrics')
      },
      {
        id: 'provider-dashboard-revenue',
        label: t('providerDashboard.revenueHeadline'),
        description: t('providerDashboard.nav.revenue')
      },
      alerts.length > 0
        ? {
            id: 'provider-dashboard-alerts',
            label: t('providerDashboard.alertsHeadline'),
            description: t('providerDashboard.nav.alerts')
          }
        : null,
      {
        id: 'provider-dashboard-pipeline',
        label: t('providerDashboard.pipelineHeadline'),
        description: t('providerDashboard.nav.pipeline')
      },
      serviceHealth.length
        ? {
            id: 'provider-dashboard-service-health',
            label: t('providerDashboard.serviceHealthHeadline'),
            description: t('providerDashboard.nav.serviceHealth')
          }
        : null,
      deliveryBoard.length
        ? {
            id: 'provider-dashboard-service-delivery',
            label: t('providerDashboard.serviceDeliveryHeadline'),
            description: t('providerDashboard.nav.serviceDelivery')
          }
        : null,
      servicePackages.length
        ? {
            id: 'provider-dashboard-service-packages',
            label: t('providerDashboard.servicePackagesHeadline'),
            description: t('providerDashboard.nav.servicePackages')
          }
        : null,
      serviceCategories.length
        ? {
            id: 'provider-dashboard-service-categories',
            label: t('providerDashboard.serviceCategoriesHeadline'),
            description: t('providerDashboard.nav.serviceCategories')
          }
        : null,
      serviceCatalogue.length
        ? {
            id: 'provider-dashboard-service-catalogue',
            label: t('providerDashboard.serviceCatalogueHeadline'),
            description: t('providerDashboard.nav.serviceCatalogue')
          }
        : null,
      {
        id: 'provider-dashboard-servicemen',
        label: t('providerDashboard.servicemenHeadline'),
        description: t('providerDashboard.nav.servicemen')
      }
    ];

    return items.filter(Boolean);
  }, [alerts.length, deliveryBoard.length, serviceCatalogue.length, serviceCategories.length, serviceHealth.length, servicePackages.length, t]);

  const heroBadges = useMemo(
    () => [
      {
        tone: heroStatusTone,
        label: t('common.slaStatus', { value: format.percentage(metrics?.slaHitRate ?? 0) })
      },
      {
        tone: 'info',
        label: t('common.utilisationStatus', { value: format.percentage(metrics?.utilisation ?? 0) })
      }
    ],
    [format, heroStatusTone, metrics?.slaHitRate, metrics?.utilisation, t]
  );

  const snapshotTime = state.meta?.generatedAt ? format.dateTime(state.meta.generatedAt) : null;
  const onboardingKey = provider?.onboardingStatus
    ? `providerDashboard.onboardingStatus.${provider.onboardingStatus}`
    : 'providerDashboard.onboardingStatus.active';
  const onboardingTranslation = t(onboardingKey);
  const onboardingStatus = onboardingTranslation === onboardingKey
    ? provider?.onboardingStatus ?? t('providerDashboard.onboardingStatus.active')
    : onboardingTranslation;

  const heroAside = (
    <>
      <Link
        to="/provider/storefront"
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
      >
        {t('providerDashboard.storefrontCta')}
      </Link>
      <Link
        to={`/providers/${provider?.slug ?? 'featured'}`}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
      >
        {t('providerDashboard.businessFrontCta')}
      </Link>
      <div className="flex flex-col items-start gap-1 text-xs text-slate-500 lg:items-end lg:text-right">
        {provider?.supportEmail ? (
          <span>{t('providerDashboard.supportEmail', { email: provider.supportEmail })}</span>
        ) : null}
        {provider?.supportPhone ? (
          <span>{t('providerDashboard.supportPhone', { phone: provider.supportPhone })}</span>
        ) : null}
        {snapshotTime ? <span>{t('providerDashboard.snapshotGenerated', { time: snapshotTime })}</span> : null}
      </div>
    </>
  );

  const sidebarMeta = [
    {
      label: t('providerDashboard.sidebarRegionLabel'),
      value: provider?.region ?? t('common.notAvailable')
    },
    {
      label: t('providerDashboard.sidebarOnboardingLabel'),
      value: onboardingStatus
    },
    {
      label: t('providerDashboard.sidebarActiveBookingsLabel'),
      value: format.number(metrics?.activeBookings ?? 0)
    }
  ];

  if (snapshotTime) {
    sidebarMeta.push({
      label: t('providerDashboard.sidebarSnapshotLabel'),
      value: snapshotTime
    });
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/provider/dashboard' }} />;
  }

  if (!hasAccess) {
    return <DashboardRoleGuard roleMeta={providerRoleMeta} sessionRole={role || session.role} />;
  }

  if (!hasProviderAccess) {
    return <DashboardRoleGuard roleMeta={providerRoleMeta} sessionRole={session.role} />;
  }

  return (
    <div data-qa="provider-dashboard">
      <DashboardShell
        eyebrow={t('providerDashboard.title')}
        title={provider?.tradingName || provider?.name || t('providerDashboard.defaultName')}
        subtitle={t('common.operatingRegion', { region: provider?.region ?? t('common.notAvailable') })}
        heroBadges={heroBadges}
        heroAside={heroAside}
        navigation={navigation}
        sidebar={{
          eyebrow: t('providerDashboard.sidebarEyebrow'),
          title: t('providerDashboard.sidebarTitle'),
          description: t('providerDashboard.sidebarDescription'),
          meta: sidebarMeta
        }}
      >
        {state.loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" aria-label={t('common.loading')}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-3xl" />
            ))}
          </div>
        ) : null}

        {!state.loading && state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5" role="alert">
            <p className="text-sm font-semibold text-rose-600">{t('providerDashboard.errorSummary')}</p>
            <p className="mt-1 text-xs text-rose-500">
              {state.error.message}
              {state.meta?.fallback ? ` — ${t('providerDashboard.errorFallbackHint')}` : ''}
            </p>
          </div>
        ) : null}

        <section id="provider-dashboard-kpis" aria-labelledby="provider-dashboard-kpis" className="space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.metricsHeadline')}</h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
              onClick={() => loadDashboard({ forceRefresh: true })}
            >
              <ClockIcon className="h-4 w-4" aria-hidden="true" /> {t('providerDashboard.refresh')}
            </button>
          </header>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-qa="provider-dashboard-kpi-grid">
            <MetricCard
              icon={ClockIcon}
              label={t('providerDashboard.metricFirstResponse')}
              value={t('providerDashboard.metricResponseValue', {
                value: format.number(metrics?.avgResponseMinutes ?? 0, { maximumFractionDigits: 0 })
              })}
              caption={t('providerDashboard.metricCaptionResponse')}
              data-qa="provider-dashboard-metric-response"
            />
            <MetricCard
              icon={ChartBarIcon}
              label={t('providerDashboard.metricActiveBookings')}
              value={format.number(metrics?.activeBookings ?? 0)}
              caption={t('providerDashboard.metricCaptionBookings')}
              data-qa="provider-dashboard-metric-bookings"
            />
            <MetricCard
              icon={UsersIcon}
              label={t('providerDashboard.metricUtilisation')}
              value={format.percentage(metrics?.utilisation ?? 0)}
              caption={t('providerDashboard.metricCaptionUtilisation')}
              tone={heroStatusTone}
              toneLabel={t(heroStatusTone === 'danger' || heroStatusTone === 'warning' ? 'common.actionRequired' : 'common.onTrack')}
              data-qa="provider-dashboard-metric-utilisation"
            />
            <MetricCard
              icon={LifebuoyIcon}
              label={t('providerDashboard.metricAverageRating')}
              value={t('providerDashboard.metricSatisfactionValue', {
                value: format.number(Math.round((metrics?.satisfaction ?? 0) * 100))
              })}
              caption={t('providerDashboard.metricCaptionRating')}
              data-qa="provider-dashboard-metric-satisfaction"
            />
          </div>
        </section>

        <section id="provider-dashboard-revenue" aria-labelledby="provider-dashboard-revenue" className="space-y-4">
          <header className="flex items-center gap-3">
            <ChartBarIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.revenueHeadline')}</h2>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="provider-dashboard-revenue-mtd">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerDashboard.revenueMonthToDate')}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{format.currency(revenue?.monthToDate ?? 0)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="provider-dashboard-revenue-forecast">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerDashboard.revenueForecast')}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{format.currency(revenue?.forecast ?? 0)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="provider-dashboard-revenue-outstanding">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('providerDashboard.revenueOutstanding')}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{format.currency(revenue?.outstandingBalance ?? 0)}</p>
              {revenue?.nextPayoutDate ? (
                <p className="mt-2 text-xs text-slate-500">
                  {t('providerDashboard.nextPayout', { date: format.date(revenue.nextPayoutDate) })}
                </p>
              ) : null}
            </article>
          </div>
        </section>

        {alerts.length > 0 ? (
          <section id="provider-dashboard-alerts" aria-labelledby="provider-dashboard-alerts" className="space-y-4">
            <header className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.alertsHeadline')}</h2>
            </header>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertBanner key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        ) : null}

        <section id="provider-dashboard-pipeline" aria-labelledby="provider-dashboard-pipeline" className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <header className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.pipelineBookings')}</h2>
            </header>
            <ul className="space-y-3">
              {bookings.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  {t('providerDashboard.emptyBookings')}
                </li>
              ) : (
                bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)
              )}
            </ul>
          </div>
          <div className="space-y-4">
            <header className="flex items-center gap-3">
              <LifebuoyIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.pipelineCompliance')}</h2>
            </header>
            <ul className="space-y-3">
              {compliance.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  {t('providerDashboard.allComplianceHealthy')}
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
                      <p className="text-xs text-slate-500">{t('providerDashboard.complianceOwner', { name: item.owner })}</p>
                    </div>
                    <StatusPill tone="warning">
                      {item.expiresOn
                        ? t('providerDashboard.complianceExpires', { date: format.date(item.expiresOn) })
                        : t('providerDashboard.complianceExpiresSoon')}
                    </StatusPill>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {serviceHealth.length ? (
          <section id="provider-dashboard-service-health" aria-labelledby="provider-dashboard-service-health" className="space-y-4">
            <header className="flex items-center gap-3">
              <ChartBarIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.serviceHealthHeadline')}</h2>
            </header>
            <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
              {serviceHealth.map((metric) => (
                <ServiceHealthCard key={metric.id} metric={metric} />
              ))}
            </div>
          </section>
        ) : null}

        {deliveryBoard.length ? (
          <section id="provider-dashboard-service-delivery" aria-labelledby="provider-dashboard-service-delivery" className="space-y-4">
            <header className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.serviceDeliveryHeadline')}</h2>
            </header>
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              {deliveryBoard.map((column) => (
                <ServiceDeliveryColumn key={column.id} column={column} />
              ))}
            </div>
          </section>
        ) : null}

        {servicePackages.length ? (
          <section id="provider-dashboard-service-packages" aria-labelledby="provider-dashboard-service-packages" className="space-y-4">
            <header className="flex items-center gap-3">
              <LifebuoyIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.servicePackagesHeadline')}</h2>
            </header>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {servicePackages.map((pkg) => (
                <ServicePackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        ) : null}

        {serviceCategories.length ? (
          <section id="provider-dashboard-service-categories" aria-labelledby="provider-dashboard-service-categories" className="space-y-4">
            <header className="flex items-center gap-3">
              <TagIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.serviceCategoriesHeadline')}</h2>
            </header>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {serviceCategories.map((category) => (
                <ServiceCategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        ) : null}

        {serviceCatalogue.length ? (
          <section id="provider-dashboard-service-catalogue" aria-labelledby="provider-dashboard-service-catalogue" className="space-y-4">
            <header className="flex items-center gap-3">
              <UsersIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.serviceCatalogueHeadline')}</h2>
            </header>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serviceCatalogue.map((service) => (
                <ServiceCatalogueCard key={service.id} service={service} />
              ))}
            </ul>
          </section>
        ) : null}

        <section id="provider-dashboard-servicemen" aria-labelledby="provider-dashboard-servicemen" className="space-y-4">
          <header className="flex items-center gap-3">
            <UsersIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-primary">{t('providerDashboard.servicemenSection')}</h2>
          </header>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servicemen.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('providerDashboard.servicemenEmpty')}
              </li>
            ) : (
              servicemen.map((member) => <ServicemanRow key={member.id} member={member} />)
            )}
          </ul>
        </section>
      </DashboardShell>

      {state.loading && !state.data ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/30" role="status" aria-live="polite">
          <Spinner />
          <span className="sr-only">{t('providerDashboard.loadingOverlay')}</span>
        </div>
      ) : null}
    </div>
  );
}

