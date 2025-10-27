import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  LifebuoyIcon
} from '@heroicons/react/24/outline';
import { getProviderDashboard, PanelApiError } from '../api/panelClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import useRoleAccess from '../hooks/useRoleAccess.js';
import useSession from '../hooks/useSession.js';
import { useLocale } from '../hooks/useLocale.js';
import DashboardRoleGuard from '../components/dashboard/DashboardRoleGuard.jsx';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import TabbedSection from './providerDashboard/components/TabbedSection.jsx';
import ProviderDashboardTheme from './providerDashboard/components/ProviderDashboardTheme.jsx';
import { createOverviewTabs } from './providerDashboard/sections/overview.jsx';
import { createOperationsTabs } from './providerDashboard/sections/operations.jsx';
import { createCommerceTabs } from './providerDashboard/sections/commerce.jsx';
import { createWorkspaceTabs } from './providerDashboard/sections/workspace.jsx';
import { resolveRiskTone } from './providerDashboard/utils.js';

export default function ProviderDashboard() {
  const { t, format } = useLocale();
  const { role, hasAccess } = useRoleAccess(['provider'], { allowFallbackRoles: ['admin'] });
  const session = useSession();
  const providerRoleMeta = useMemo(
    () => DASHBOARD_ROLES.find((item) => item.id === 'provider') || null,
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

  const handleWebsitePreferencesUpdated = useCallback((nextPreferences) => {
    setState((current) => {
      if (!current.data) {
        return current;
      }
      return {
        ...current,
        data: {
          ...current.data,
          websitePreferences: nextPreferences
        }
      };
    });
  }, []);

  const provider = state.data?.provider;
  const metrics = state.data?.metrics;
  const revenue = state.data?.revenue;
  const alerts = state.data?.alerts ?? [];
  const walletSection = state.data?.wallet ?? null;
  const bookings = state.data?.pipeline?.upcomingBookings ?? [];
  const compliance = state.data?.pipeline?.expiringCompliance ?? [];
  const servicemanFinance = state.data?.servicemanFinance ?? null;
  const toolSales = state.data?.toolSales ?? null;
  const serviceManagement = state.data?.serviceManagement ?? {};
  const serviceHealth = serviceManagement.health ?? [];
  const deliveryBoard = serviceManagement.deliveryBoard ?? [];
  const servicePackages = serviceManagement.packages ?? [];
  const serviceCategories = serviceManagement.categories ?? [];
  const serviceCatalogue = serviceManagement.catalogue ?? [];
  const websitePreferences = state.data?.websitePreferences ?? null;
  const enterpriseUpgrade = state.data?.enterpriseUpgrade ?? null;
  const adsWorkspace = state.data?.ads || null;
  const adsCompanyId = state.meta?.companyId || adsWorkspace?.company?.id || null;
  const hasAdsWorkspace = Boolean(adsWorkspace);
  const companyId = state.meta?.companyId || provider?.id || null;

  const heroStatusTone = useMemo(() => {
    if (!metrics) return 'neutral';
    if (metrics.slaHitRate < 0.92) return 'danger';
    if (metrics.utilisation < 0.55) return 'warning';
    return 'success';
  }, [metrics]);

  const hasCalendarAccess = Boolean(state.meta?.companyId);

  const spotlightItems = useMemo(() => {
    const items = [];

    if (bookings.length) {
      const sortedBookings = [...bookings].sort((a, b) => {
        const valueDifference = (b.value ?? 0) - (a.value ?? 0);
        if (valueDifference !== 0) {
          return valueDifference;
        }
        const aTime = a.eta ? new Date(a.eta).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.eta ? new Date(b.eta).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });
      const topBooking = sortedBookings[0];
      const bookingMeta = [
        topBooking.value != null ? format.currency(topBooking.value) : null,
        topBooking.eta ? format.dateTime(topBooking.eta) : null
      ]
        .filter(Boolean)
        .join(' • ');

      items.push({
        id: 'spotlight-booking',
        icon: CalendarDaysIcon,
        eyebrow: t('providerDashboard.spotlight.bookingEyebrow'),
        title: topBooking.client,
        meta: bookingMeta,
        description: t('providerDashboard.spotlight.bookingDescription', { service: topBooking.service }),
        tone: 'success',
        toneLabel: t('providerDashboard.spotlight.status.positive')
      });
    }

    const flaggedDeliveries = deliveryBoard
      .flatMap((column) =>
        column.items.map((item) => ({
          ...item,
          columnTitle: column.title,
          tone: resolveRiskTone(item.risk)
        }))
      )
      .filter((item) => item.tone === 'danger' || item.tone === 'warning')
      .sort((a, b) => {
        if (a.tone === 'danger' && b.tone !== 'danger') return -1;
        if (b.tone === 'danger' && a.tone !== 'danger') return 1;
        const aTime = a.eta ? new Date(a.eta).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.eta ? new Date(b.eta).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      });

    if (flaggedDeliveries.length) {
      const delivery = flaggedDeliveries[0];
      const deliveryMeta = [delivery.columnTitle, delivery.eta ? format.dateTime(delivery.eta) : null]
        .filter(Boolean)
        .join(' • ');

      items.push({
        id: 'spotlight-delivery',
        icon: ClockIcon,
        eyebrow: t('providerDashboard.spotlight.deliveryEyebrow'),
        title: delivery.name,
        meta: deliveryMeta,
        description: t('providerDashboard.spotlight.deliveryDescription', {
          client: delivery.client,
          owner: delivery.owner
        }),
        tone: delivery.tone,
        toneLabel:
          delivery.tone === 'danger'
            ? t('providerDashboard.spotlight.status.action')
            : t('providerDashboard.spotlight.status.warning')
      });
    }

    const complianceTimeline = [...compliance]
      .filter((item) => item.expiresOn)
      .sort((a, b) => new Date(a.expiresOn).getTime() - new Date(b.expiresOn).getTime());

    if (complianceTimeline.length) {
      const nextCompliance = complianceTimeline[0];
      items.push({
        id: 'spotlight-compliance',
        icon: LifebuoyIcon,
        eyebrow: t('providerDashboard.spotlight.complianceEyebrow'),
        title: nextCompliance.name,
        meta: format.date(nextCompliance.expiresOn),
        description: t('providerDashboard.spotlight.complianceDescription', { owner: nextCompliance.owner }),
        tone: 'warning',
        toneLabel: t('providerDashboard.spotlight.status.warning')
      });
    } else if (compliance.length) {
      const fallbackCompliance = compliance[0];
      items.push({
        id: 'spotlight-compliance',
        icon: LifebuoyIcon,
        eyebrow: t('providerDashboard.spotlight.complianceEyebrow'),
        title: fallbackCompliance.name,
        meta: t('providerDashboard.spotlight.complianceNoDate'),
        description: t('providerDashboard.spotlight.complianceDescription', { owner: fallbackCompliance.owner }),
        tone: 'info',
        toneLabel: t('providerDashboard.spotlight.status.positive')
      });
    }

    return items.slice(0, 3);
  }, [bookings, compliance, deliveryBoard, format, t]);

  const storefrontSummary = useMemo(() => {
    if (!toolSales) {
      return { stats: [], topListing: null };
    }

    const summary = toolSales.summary || {};
    const stats = [
      {
        id: 'storefront-published',
        label: t('providerDashboard.storefront.stats.published'),
        value: format.number(summary.published ?? 0),
        caption: t('providerDashboard.storefront.stats.totalListings', {
          value: format.number(summary.totalListings ?? 0)
        })
      },
      {
        id: 'storefront-draft',
        label: t('providerDashboard.storefront.stats.drafts'),
        value: format.number(summary.draft ?? 0),
        caption: t('providerDashboard.storefront.stats.coupons', {
          value: format.number(summary.activeCoupons ?? 0)
        })
      },
      {
        id: 'storefront-inventory',
        label: t('providerDashboard.storefront.stats.inventory'),
        value: format.number(summary.totalQuantity ?? 0),
        caption: t('providerDashboard.storefront.stats.inventoryCaption')
      },
      {
        id: 'storefront-suspended',
        label: t('providerDashboard.storefront.stats.suspended'),
        value: format.number(summary.suspended ?? 0),
        caption: t('providerDashboard.storefront.stats.suspendedCaption')
      }
    ];

    const listings = Array.isArray(toolSales.listings) ? toolSales.listings : [];
    const topListing = listings
      .slice()
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      .shift();

    return { stats, topListing: topListing || null };
  }, [format, toolSales, t]);

  const snapshotTime = state.meta?.generatedAt ? format.dateTime(state.meta.generatedAt) : null;

  const calendarInitialSnapshot = useMemo(() => {
    if (state.data?.calendar) {
      return state.data.calendar;
    }
    if (state.meta?.companyId) {
      return { meta: { companyId: state.meta.companyId } };
    }
    return null;
  }, [state.data?.calendar, state.meta?.companyId]);

  const renderCalendarSection = hasCalendarAccess && (calendarInitialSnapshot || !state.loading);
  const onboardingKey = provider?.onboardingStatus
    ? `providerDashboard.onboardingStatus.${provider.onboardingStatus}`
    : 'providerDashboard.onboardingStatus.active';
  const onboardingTranslation = t(onboardingKey);
  const onboardingStatus = onboardingTranslation === onboardingKey
    ? provider?.onboardingStatus ?? t('providerDashboard.onboardingStatus.active')
    : onboardingTranslation;

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

  const heroAside = (
    <div className="provider-dashboard__aside provider-dashboard__aside--end">
      <Link
        to="/provider/storefront"
        className="provider-dashboard__button provider-dashboard__button--outline text-sm"
      >
        {t('providerDashboard.storefrontCta')}
      </Link>
      <Link
        to={`/providers/${provider?.slug ?? 'featured'}`}
        className="provider-dashboard__button provider-dashboard__button--primary text-sm"
      >
        {t('providerDashboard.businessFrontCta')}
      </Link>
      <div className="flex flex-col gap-1 text-xs text-[var(--provider-text-secondary)]">
        {provider?.supportEmail ? (
          <span>{t('providerDashboard.supportEmail', { email: provider.supportEmail })}</span>
        ) : null}
        {provider?.supportPhone ? (
          <span>{t('providerDashboard.supportPhone', { phone: provider.supportPhone })}</span>
        ) : null}
        {snapshotTime ? <span>{t('providerDashboard.snapshotGenerated', { time: snapshotTime })}</span> : null}
      </div>
    </div>
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

  const tabGroups = useMemo(() => {
    const groups = [];

    const overviewTabs = createOverviewTabs({
      t,
      format,
      metrics,
      heroStatusTone,
      spotlightItems,
      revenue,
      bookings,
      compliance,
      alerts,
      snapshotTime
    });

    if (overviewTabs.length) {
      groups.push({
        id: 'provider-dashboard-overview',
        heading: t('providerDashboard.groups.overview.title'),
        description: t('providerDashboard.groups.overview.description'),
        tabs: overviewTabs
      });
    }

    const operationsTabs = createOperationsTabs({
      t,
      serviceHealth,
      deliveryBoard,
      servicePackages,
      serviceCategories,
      calendarInitialSnapshot,
      hasCalendarAccess,
      companyId,
      renderToolRental: Boolean(companyId),
      renderCalendarSection
    });

    if (operationsTabs.length) {
      groups.push({
        id: 'provider-dashboard-operations',
        heading: t('providerDashboard.groups.operations.title'),
        description: t('providerDashboard.groups.operations.description'),
        tabs: operationsTabs
      });
    }

    const commerceTabs = createCommerceTabs({
      t,
      format,
      storefrontSummary,
      serviceCatalogue,
      toolSales,
      hasAdsWorkspace,
      adsCompanyId,
      adsWorkspace
    });

    if (commerceTabs.length) {
      groups.push({
        id: 'provider-dashboard-commerce',
        heading: t('providerDashboard.groups.commerce.title'),
        description: t('providerDashboard.groups.commerce.description'),
        tabs: commerceTabs
      });
    }

    const servicemenCompanyId = state.meta?.companyId ?? provider?.id ?? null;
    const workspaceTabs = createWorkspaceTabs({
      t,
      servicemanFinance,
      walletSection,
      provider,
      servicemenCompanyId,
      loadDashboard,
      websitePreferences,
      handleWebsitePreferencesUpdated,
      enterpriseUpgrade
    });

    if (workspaceTabs.length) {
      groups.push({
        id: 'provider-dashboard-workspace',
        heading: t('providerDashboard.groups.workspace.title'),
        description: t('providerDashboard.groups.workspace.description'),
        tabs: workspaceTabs
      });
    }

    return groups;
  }, [
    adsCompanyId,
    adsWorkspace,
    alerts,
    bookings,
    calendarInitialSnapshot,
    compliance,
    companyId,
    deliveryBoard,
    enterpriseUpgrade,
    format,
    handleWebsitePreferencesUpdated,
    hasAdsWorkspace,
    hasCalendarAccess,
    heroStatusTone,
    loadDashboard,
    metrics,
    provider,
    revenue,
    serviceCatalogue,
    serviceCategories,
    serviceHealth,
    servicePackages,
    servicemanFinance,
    spotlightItems,
    storefrontSummary,
    t,
    walletSection,
    websitePreferences
  ]);

  const navigation = useMemo(
    () =>
      tabGroups.map((group) => ({
        id: group.id,
        label: group.heading,
        description: group.description
      })),
    [tabGroups]
  );

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
        contentClassName="provider-dashboard-shell"
        fullWidth
      >
        <ProviderDashboardTheme as="div" className="provider-dashboard">
          {state.loading ? (
            <div className="provider-dashboard__grid" aria-label={t('common.loading')}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-40 w-full rounded-[var(--provider-radius-md)] bg-white/10 backdrop-blur"
                />
              ))}
            </div>
          ) : null}

          {!state.loading && state.error ? (
            <div className="provider-dashboard__section provider-dashboard__section--muted" role="alert">
              <div className="provider-dashboard__section-header">
                <div>
                  <p className="provider-dashboard__card-label text-rose-200">
                    {t('providerDashboard.errorSummary')}
                  </p>
                  <p className="provider-dashboard__card-meta text-rose-200/80">
                    {state.error.message}
                    {state.meta?.fallback ? ` — ${t('providerDashboard.errorFallbackHint')}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {tabGroups.map((group) => (
            <section key={group.id} id={group.id} className="provider-dashboard__section">
              <div className="provider-dashboard__section-header">
                <div>
                  <h2 className="provider-dashboard__section-heading">{group.heading}</h2>
                  {group.description ? (
                    <p className="provider-dashboard__section-description">{group.description}</p>
                  ) : null}
                </div>
              </div>
              <TabbedSection heading={group.heading} description={group.description} tabs={group.tabs} />
            </section>
          ))}
        </ProviderDashboardTheme>
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
