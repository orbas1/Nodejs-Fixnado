import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { getEnterprisePanel, PanelApiError } from '../api/panelClient.js';
import StatusPill from '../components/ui/StatusPill.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import DashboardUnauthorized from '../components/dashboard/DashboardUnauthorized.jsx';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import { useSession } from '../hooks/useSession.js';
import { usePersonaAccess } from '../hooks/usePersonaAccess.js';
import {
  ArrowPathIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useLocale } from '../hooks/useLocale.js';

function ProgressBar({ value = 0, tone = 'primary' }) {
  const percentage = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const toneClass = {
    primary: 'bg-primary',
    info: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-400',
    danger: 'bg-rose-500'
  }[tone] || 'bg-primary';

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="presentation">
      <div
        className={clsx('h-2 rounded-full transition-all duration-500 ease-out', toneClass)}
        style={{ width: `${Math.round(percentage * 100)}%` }}
      />
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  tone: PropTypes.oneOf(['primary', 'info', 'success', 'warning', 'danger'])
};

const resolveSeverityKey = (value) => {
  if (!value || typeof value !== 'string') {
    return 'medium';
  }
  const key = value.toLowerCase();
  if (key.includes('critical') || key.includes('high')) {
    return 'high';
  }
  if (key.includes('low')) {
    return 'low';
  }
  return 'medium';
};

const resolveSeverityTone = (value) => {
  const key = resolveSeverityKey(value);
  if (key === 'high') return 'danger';
  if (key === 'low') return 'info';
  return 'warning';
};

const resolvePostureTone = (value) => {
  if (!value || typeof value !== 'string') {
    return 'info';
  }
  const lower = value.toLowerCase();
  if (lower.includes('proactive') || lower.includes('strong')) {
    return 'success';
  }
  if (lower.includes('watch') || lower.includes('attention')) {
    return 'warning';
  }
  if (lower.includes('critical') || lower.includes('elevated')) {
    return 'danger';
  }
  return 'info';
};

const resolveTrendKey = (value) => {
  if (!value || typeof value !== 'string') {
    return 'steady';
  }
  const lower = value.toLowerCase();
  if (lower.includes('up') || lower.includes('rise')) {
    return 'up';
  }
  if (lower.includes('down') || lower.includes('fall')) {
    return 'down';
  }
  return 'steady';
};

function MetricTile({ icon: Icon, label, value, caption, tone, toneLabel, 'data-qa': dataQa }) {
  return (
    <article
      className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
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
      {caption ? <p className="mt-4 text-xs text-slate-500">{caption}</p> : null}
      {tone ? (
        <div className="mt-4">
          <StatusPill tone={tone}>{toneLabel}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

MetricTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.string,
  tone: PropTypes.oneOf(['primary', 'info', 'success', 'warning', 'danger']),
  toneLabel: PropTypes.string,
  'data-qa': PropTypes.string
};

function InvoiceRow({ invoice }) {
  const { t, format } = useLocale();
  const dueLabel = invoice.dueDate
    ? t('enterprisePanel.invoiceDue', { date: format.date(invoice.dueDate) })
    : t('enterprisePanel.invoiceDueFallback');

  return (
    <li
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4"
      data-qa={`enterprise-panel-invoice-${invoice.id}`}
    >
      <div>
        <p className="text-sm font-semibold text-primary">{invoice.vendor}</p>
        <p className="text-xs text-slate-500">{dueLabel}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-primary">{format.currency(invoice.amount ?? 0)}</p>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {t('enterprisePanel.invoiceStatus', { status: invoice.status })}
        </p>
      </div>
    </li>
  );
}

InvoiceRow.propTypes = {
  invoice: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    vendor: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    status: PropTypes.string.isRequired
  }).isRequired
};

function ProgrammeRow({ programme }) {
  const { t, format } = useLocale();
  const statusTone =
    programme.status === 'at-risk' || programme.health === 'at-risk'
      ? 'danger'
      : programme.status === 'delayed'
        ? 'warning'
        : 'success';
  const statusLabel = t('enterprisePanel.statusBadge', { status: programme.health || programme.status });

  return (
    <li
      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4"
      data-qa={`enterprise-panel-programme-${programme.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{programme.name}</p>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{programme.phase}</p>
        </div>
        <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
      </div>
      {programme.lastUpdated ? (
        <p className="text-xs text-slate-500">
          {t('enterprisePanel.programmeUpdated', { date: format.date(programme.lastUpdated) })}
        </p>
      ) : null}
    </li>
  );
}

ProgrammeRow.propTypes = {
  programme: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    phase: PropTypes.string,
    status: PropTypes.string,
    health: PropTypes.string,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }).isRequired
};

export default function EnterprisePanel() {
  const { t, format } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAccess, refresh: refreshPersonaAccess } = usePersonaAccess();
  const { isAuthenticated, hasRole, dashboards = [] } = useSession();
  const enterpriseRoleMeta = useMemo(
    () => DASHBOARD_ROLES.find((role) => role.id === 'enterprise'),
    []
  );
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });
  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
    } catch (error) {
      console.warn('[EnterprisePanel] unable to resolve timezone', error);
      return 'Europe/London';
    }
  }, []);

  const loadPanel = useCallback(
    async ({ forceRefresh = false, signal } = {}) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const result = await getEnterprisePanel({ forceRefresh, signal, timezone });
        setState({ loading: false, data: result.data, meta: result.meta, error: result.meta?.error || null });
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof PanelApiError ? error : new PanelApiError('Unable to load enterprise panel', 500, { cause: error })
        }));
      }
    },
    [timezone]
  );

  const rolePermitted = hasRole(['enterprise']);
  const personaAllowed = hasAccess('enterprise');
  const dashboardProvisioned = dashboards.includes('enterprise');
  const isProvisioned = rolePermitted && personaAllowed && dashboardProvisioned;

  const handleRetryAccess = useCallback(() => {
    refreshPersonaAccess();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('fixnado:session:update'));
    }
  }, [refreshPersonaAccess]);

  useEffect(() => {
    if (!isProvisioned) {
      return undefined;
    }
    const controller = new AbortController();
    loadPanel({ signal: controller.signal });
    return () => controller.abort();
  }, [loadPanel, isProvisioned]);

  useEffect(() => {
    if (!isProvisioned) {
      setState((current) => ({ ...current, loading: false }));
    }
  }, [isProvisioned]);

  const delivery = state.data?.delivery;
  const spend = state.data?.spend;
  const enterprise = state.data?.enterprise;
  const operations = state.data?.operations ?? {};
  const governance = state.data?.governance ?? {};
  const roadmap = state.data?.roadmap ?? [];
  const programmes = state.data?.programmes ?? [];
  const escalations = state.data?.escalations ?? [];
  const invoices = spend?.invoicesAwaitingApproval ?? [];
  const coverage = Array.isArray(operations.coverage) ? operations.coverage : [];
  const automation = operations.automation ?? {};
  const sustainability = operations.sustainability ?? {};
  const actionCentre = Array.isArray(operations.actionCentre) ? operations.actionCentre : [];
  const audits = Array.isArray(governance.audits) ? governance.audits : [];
  const riskRegister = Array.isArray(governance.riskRegister) ? governance.riskRegister : [];
  const fallbackMeta = state.meta?.payload ?? {};
  const fallbackSections = useMemo(
    () => (Array.isArray(fallbackMeta.sections) ? fallbackMeta.sections : []),
    [fallbackMeta.sections]
  );
  const fallbackSectionLabels = useMemo(
    () => ({
      delivery: t('enterprisePanel.metricsHeadline'),
      spend: t('enterprisePanel.spendHeadline'),
      programmes: t('enterprisePanel.programmeSection'),
      escalations: t('enterprisePanel.escalationsHeadline'),
      invoices: t('enterprisePanel.invoicesHeadline'),
      serviceMix: t('enterprisePanel.serviceMixLabel')
    }),
    [t]
  );
  const fallbackDescription = useMemo(() => {
    if (!state.meta?.fallback || state.error || state.loading) {
      return null;
    }

    if (fallbackSections.length > 0) {
      const sectionList = fallbackSections
        .map((section) => fallbackSectionLabels[section] || section)
        .filter(Boolean)
        .join(', ');
      return t('enterprisePanel.fallbackNoticePartial', { sections: sectionList });
    }

    if (fallbackMeta.reason === 'enterprise_company_not_found') {
      return t('enterprisePanel.fallbackNoticeNoCompany');
    }

    return t('enterprisePanel.fallbackNoticeFull');
  }, [fallbackMeta.reason, fallbackSectionLabels, fallbackSections, state.error, state.loading, state.meta?.fallback, t]);

  const deliveryTone = useMemo(() => {
    if (!delivery) return 'neutral';
    if (delivery.slaCompliance < 0.9) return 'danger';
    if (delivery.avgResolutionHours > 8 || delivery.incidents > 4) return 'warning';
    return 'success';
  }, [delivery]);

  const hasOperationsContent =
    coverage.length > 0 ||
    actionCentre.length > 0 ||
    Number.isFinite(Number(automation.orchestrationRate)) ||
    Number.isFinite(Number(automation.runbookCoverage)) ||
    Number.isFinite(Number(sustainability.carbonYtd)) ||
    Number.isFinite(Number(sustainability.renewableCoverage));
  const hasGovernanceContent =
    riskRegister.length > 0 ||
    audits.length > 0 ||
    Number.isFinite(Number(governance.complianceScore)) ||
    (typeof governance.dataResidency === 'string' && governance.dataResidency.trim().length > 0);
  const hasRoadmapContent = roadmap.length > 0;

  const navigation = useMemo(() => {
    const items = [
      {
        id: 'enterprise-panel-metrics',
        label: t('enterprisePanel.metricsHeadline'),
        description: t('enterprisePanel.nav.delivery')
      },
      {
        id: 'enterprise-panel-spend',
        label: t('enterprisePanel.spendHeadline'),
        description: t('enterprisePanel.nav.spend')
      },
      hasOperationsContent
        ? {
            id: 'enterprise-panel-operations',
            label: t('enterprisePanel.operationsHeadline'),
            description: t('enterprisePanel.nav.operations')
          }
        : null,
      {
        id: 'enterprise-panel-programmes',
        label: t('enterprisePanel.programmeHeadline'),
        description: t('enterprisePanel.nav.programmes')
      },
      escalations.length > 0
        ? {
            id: 'enterprise-panel-escalations',
            label: t('enterprisePanel.escalationsHeadline'),
            description: t('enterprisePanel.nav.escalations')
          }
        : null,
      hasGovernanceContent
        ? {
            id: 'enterprise-panel-governance',
            label: t('enterprisePanel.governanceHeadline'),
            description: t('enterprisePanel.nav.governance')
          }
        : null,
      hasRoadmapContent
        ? {
            id: 'enterprise-panel-roadmap',
            label: t('enterprisePanel.roadmapHeadline'),
            description: t('enterprisePanel.nav.roadmap')
          }
        : null
    ];

    return items.filter(Boolean);
  }, [
    escalations.length,
    hasGovernanceContent,
    hasOperationsContent,
    hasRoadmapContent,
    t
  ]);

  const heroBadges = useMemo(() => {
    const items = [
      {
        tone: deliveryTone,
        label: t('common.slaStatus', { value: format.percentage(delivery?.slaCompliance ?? 0) })
      },
      {
        tone: 'info',
        label: t('common.activeSites', { count: format.number(enterprise?.activeSites ?? 0) })
      }
    ];

    if (Number.isFinite(Number(automation.orchestrationRate))) {
      items.push({
        tone: 'success',
        label: t('enterprisePanel.heroBadgeAutomation', {
          value: format.percentage(automation.orchestrationRate ?? 0)
        })
      });
    }

    if (Number.isFinite(Number(governance.complianceScore))) {
      items.push({
        tone: 'info',
        label: t('enterprisePanel.heroBadgeCompliance', {
          value: format.percentage(governance.complianceScore ?? 0)
        })
      });
    }

    return items;
  }, [automation.orchestrationRate, delivery?.slaCompliance, deliveryTone, enterprise?.activeSites, format, governance.complianceScore, t]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const snapshotTime = state.meta?.generatedAt ? format.dateTime(state.meta.generatedAt) : null;

  const heroAside = (
    <div className="flex flex-col items-start gap-3 text-sm text-slate-500 lg:items-end lg:text-right">
      {enterprise?.accountManager ? (
        <span>{t('common.accountManager', { name: enterprise.accountManager })}</span>
      ) : null}
      {enterprise?.serviceMix?.length ? (
        <div
          className="flex flex-wrap gap-2"
          data-qa="enterprise-panel-service-mix"
          aria-label={t('enterprisePanel.serviceMixLabel')}
        >
          {enterprise.serviceMix.map((service) => (
            <span
              key={service}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {service}
            </span>
          ))}
        </div>
      ) : null}
      <Link
        to="/communications"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
      >
        {t('enterprisePanel.openWorkspace')}
      </Link>
      {snapshotTime ? <span className="text-xs text-slate-400">{t('enterprisePanel.snapshotGenerated', { time: snapshotTime })}</span> : null}
    </div>
  );

  const sidebarMeta = [
    {
      label: t('enterprisePanel.sidebarAccountManager'),
      value: enterprise?.accountManager ?? t('common.notAvailable')
    },
    {
      label: t('enterprisePanel.sidebarSites'),
      value: format.number(enterprise?.activeSites ?? 0)
    },
    {
      label: t('enterprisePanel.sidebarSpend'),
      value: format.currency(spend?.monthToDate ?? 0)
    }
  ];

  if (snapshotTime) {
    sidebarMeta.push({ label: t('enterprisePanel.sidebarSnapshotLabel'), value: snapshotTime });
  }

  if (!isProvisioned) {
    return (
      <DashboardUnauthorized
        roleMeta={enterpriseRoleMeta}
        onNavigateHome={() => navigate('/dashboards')}
        onRetry={handleRetryAccess}
      />
    );
  }

  return (
    <div data-qa="enterprise-panel">
      <DashboardShell
        eyebrow={t('enterprisePanel.title')}
        title={enterprise?.name || t('enterprisePanel.defaultName')}
        subtitle={t('enterprisePanel.sectorLabel', { sector: enterprise?.sector ?? t('common.notAvailable') })}
        heroBadges={heroBadges}
        heroAside={heroAside}
        navigation={navigation}
        sidebar={{ meta: sidebarMeta }}
      >
        {state.loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" aria-label={t('common.loading')}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-3xl" />
            ))}
          </div>
        ) : null}

        {!state.loading && state.meta?.fallback && !state.error && fallbackDescription ? (
          <div
            className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5 text-sky-700"
            role="status"
            data-qa="enterprise-panel-fallback"
          >
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{t('enterprisePanel.fallbackNoticeTitle')}</p>
                <p className="mt-1 text-xs">{fallbackDescription}</p>
              </div>
            </div>
          </div>
        ) : null}

        {!state.loading && state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5" role="alert">
            <p className="text-sm font-semibold text-rose-600">{t('enterprisePanel.errorSummary')}</p>
            <p className="mt-1 text-xs text-rose-500">
              {state.error.message}
              {state.meta?.fallback ? ` — ${t('enterprisePanel.errorFallbackHint')}` : ''}
            </p>
          </div>
        ) : null}

        <section id="enterprise-panel-metrics" aria-labelledby="enterprise-panel-metrics" className="space-y-6">
          <header className="flex items-center justify-between">
            <h2 id="enterprise-panel-metrics" className="text-lg font-semibold text-primary">
              {t('enterprisePanel.metricsHeadline')}
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
              onClick={() => loadPanel({ forceRefresh: true })}
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> {t('enterprisePanel.refresh')}
            </button>
          </header>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" data-qa="enterprise-panel-metric-grid">
            <MetricTile
              icon={ChartBarIcon}
              label={t('enterprisePanel.metricCompliance')}
              value={format.percentage(delivery?.slaCompliance ?? 0)}
              caption={t('enterprisePanel.metricCaptionCompliance')}
              tone={deliveryTone === 'danger' ? 'danger' : undefined}
              toneLabel={deliveryTone === 'danger' ? t('common.atRisk') : t('common.withinTarget')}
              data-qa="enterprise-panel-metric-sla"
            />
            <MetricTile
              icon={ExclamationTriangleIcon}
              label={t('enterprisePanel.metricIncidentsOpen')}
              value={format.number(delivery?.incidents ?? 0)}
              caption={t('enterprisePanel.metricCaptionIncidents')}
              tone={delivery?.incidents > 4 ? 'danger' : delivery?.incidents > 2 ? 'warning' : undefined}
              toneLabel={
                delivery?.incidents > 2 ? t('common.actionRequired') : t('common.withinTarget')
              }
              data-qa="enterprise-panel-metric-incidents"
            />
            <MetricTile
              icon={ArrowPathIcon}
              label={t('enterprisePanel.metricResolutionTime')}
              value={t('enterprisePanel.metricResolutionValue', {
                value: format.number(delivery?.avgResolutionHours ?? 0, { maximumFractionDigits: 1 })
              })}
              caption={t('enterprisePanel.metricCaptionResolution')}
              tone={delivery?.avgResolutionHours > 8 ? 'warning' : undefined}
              toneLabel={
                delivery?.avgResolutionHours > 8 ? t('common.actionRequired') : t('common.withinTarget')
              }
              data-qa="enterprise-panel-metric-resolution"
            />
            <MetricTile
              icon={ClipboardDocumentCheckIcon}
              label={t('enterprisePanel.metricNps')}
              value={format.number(delivery?.nps ?? 0)}
              caption={t('enterprisePanel.metricCaptionNps')}
              data-qa="enterprise-panel-metric-nps"
            />
          </div>
        </section>

        <section id="enterprise-panel-spend" aria-labelledby="enterprise-panel-spend" className="space-y-4">
          <header className="flex items-center gap-3">
            <BanknotesIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="enterprise-panel-spend" className="text-lg font-semibold text-primary">
              {t('enterprisePanel.spendHeadline')}
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="enterprise-panel-spend-mtd">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('enterprisePanel.spendMonthToDate')}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{format.currency(spend?.monthToDate ?? 0)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="enterprise-panel-spend-budget">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('enterprisePanel.spendBudget')}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{format.percentage(spend?.budgetPacing ?? 0)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa="enterprise-panel-spend-savings">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('enterprisePanel.spendSavings')}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{format.currency(spend?.savingsIdentified ?? 0)}</p>
            </article>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">{t('enterprisePanel.invoicesHeadline')}</h3>
            <ul className="space-y-3">
              {invoices.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  {t('enterprisePanel.invoicesEmpty')}
                </li>
              ) : (
                invoices.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)
              )}
            </ul>
          </div>
        </section>

        {hasOperationsContent ? (
          <section id="enterprise-panel-operations" aria-labelledby="enterprise-panel-operations" className="space-y-6">
            <header className="flex items-center gap-3">
              <GlobeAltIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="enterprise-panel-operations" className="text-lg font-semibold text-primary">
                {t('enterprisePanel.operationsHeadline')}
              </h2>
            </header>

            {coverage.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-qa="enterprise-panel-coverage">
                {coverage.map((region) => (
                  <article
                    key={region.id}
                    className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 p-6 text-white shadow-lg"
                    data-qa={`enterprise-panel-coverage-${region.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{region.region}</p>
                        {region.primaryService ? (
                          <p className="mt-1 text-xs text-slate-200">
                            {t('enterprisePanel.coverageService')}: {region.primaryService}
                          </p>
                        ) : null}
                      </div>
                      <StatusPill tone={region.incidents > 1 ? 'warning' : 'success'}>
                        {t('enterprisePanel.coverageUptime')}: {format.percentage(region.uptime ?? 0)}
                      </StatusPill>
                    </div>
                    <dl className="mt-5 grid gap-4 text-xs uppercase tracking-[0.25em] text-slate-200">
                      <div>
                        <dt>{t('enterprisePanel.coverageSites')}</dt>
                        <dd className="mt-1 text-lg font-semibold tracking-normal text-white">
                          {format.number(region.activeSites ?? 0)}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('enterprisePanel.coverageAutomation')}</dt>
                        <dd className="mt-1 text-lg font-semibold tracking-normal text-white">
                          {format.percentage(region.automationScore ?? 0)}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('enterprisePanel.coverageIncidents')}</dt>
                        <dd className="mt-1 text-lg font-semibold tracking-normal text-white">
                          {format.number(region.incidents ?? 0)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm" data-qa="enterprise-panel-automation">
                <header className="flex items-center gap-3">
                  <BoltIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-primary">{t('enterprisePanel.automationOrchestration')}</p>
                    {automation.nextReview ? (
                      <p className="text-xs text-slate-500">
                        {t('enterprisePanel.automationNextReview')}: {format.date(automation.nextReview)}
                      </p>
                    ) : null}
                  </div>
                </header>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{t('enterprisePanel.automationOrchestration')}</span>
                      <span className="text-primary">{format.percentage(automation.orchestrationRate ?? 0)}</span>
                    </div>
                    <ProgressBar value={automation.orchestrationRate ?? 0} tone="primary" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{t('enterprisePanel.automationRunbookCoverage')}</span>
                      <span className="text-primary">{format.percentage(automation.runbookCoverage ?? 0)}</span>
                    </div>
                    <ProgressBar value={automation.runbookCoverage ?? 0} tone="info" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {t('enterprisePanel.automationRunbooks')}
                  </p>
                  {Array.isArray(automation.runbooks) && automation.runbooks.length > 0 ? (
                    <ul className="space-y-2">
                      {automation.runbooks.map((runbook) => {
                        const adoptionPercent = Math.round((runbook.adoption ?? 0) * 100);
                        return (
                          <li key={runbook.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-sm font-semibold text-primary">{runbook.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span>{t('enterprisePanel.automationRunbookAdoption', { value: adoptionPercent })}</span>
                              {runbook.owner ? <span>{t('enterprisePanel.automationRunbookOwner', { name: runbook.owner })}</span> : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">{t('enterprisePanel.automationRunbooksEmpty')}</p>
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-sky-50 to-emerald-50 p-6 shadow-inner" data-qa="enterprise-panel-sustainability">
                <header className="flex items-center gap-3">
                  <SparklesIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-primary">{t('enterprisePanel.sustainabilityHeadline')}</h3>
                </header>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('enterprisePanel.sustainabilityCarbonYtd')}</p>
                    <p className="mt-2 text-xl font-semibold text-primary">
                      {format.number(sustainability.carbonYtd ?? 0)} tCO₂e
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('enterprisePanel.sustainabilityTarget')}</p>
                    <p className="mt-2 text-xl font-semibold text-primary">
                      {format.number(sustainability.carbonTarget ?? 0)} tCO₂e
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{t('enterprisePanel.sustainabilityRenewable')}</span>
                      <span className="text-primary">{format.percentage(sustainability.renewableCoverage ?? 0)}</span>
                    </div>
                    <ProgressBar value={sustainability.renewableCoverage ?? 0} tone="success" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                      <span>{t('enterprisePanel.sustainabilityTrend')}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {t(`enterprisePanel.sustainabilityTrend.${resolveTrendKey(sustainability.emissionTrend)}`)}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">{t('enterprisePanel.actionCentreHeadline')}</h3>
              <ul className="space-y-3">
                {actionCentre.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                    {t('enterprisePanel.actionEmpty')}
                  </li>
                ) : (
                  actionCentre.map((action) => {
                    const severityKey = resolveSeverityKey(action.severity);
                    return (
                      <li
                        key={action.id}
                        className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                        data-qa={`enterprise-panel-action-${action.id}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-primary">{action.title}</p>
                            {action.detail ? <p className="mt-1 text-xs text-slate-500">{action.detail}</p> : null}
                          </div>
                          <StatusPill tone={resolveSeverityTone(action.severity)}>
                            {t(`enterprisePanel.actionSeverity.${severityKey}`)}
                          </StatusPill>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          {action.due ? <span>{t('enterprisePanel.actionDue')}: {format.date(action.due)}</span> : null}
                          {action.owner ? <span>{t('enterprisePanel.actionOwner')}: {action.owner}</span> : null}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </section>
        ) : null}

        <section id="enterprise-panel-programmes" aria-labelledby="enterprise-panel-programmes" className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <header className="flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="enterprise-panel-programmes" className="text-lg font-semibold text-primary">
                {t('enterprisePanel.programmeSection')}
              </h2>
            </header>
            <ul className="space-y-3">
              {programmes.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  {t('enterprisePanel.programmeEmpty')}
                </li>
              ) : (
                programmes.map((programme) => <ProgrammeRow key={programme.id} programme={programme} />)
              )}
            </ul>
          </div>
          <div id="enterprise-panel-escalations" className="space-y-4">
            <header className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-primary">{t('enterprisePanel.escalationsHeadline')}</h2>
            </header>
            <ul className="space-y-3">
              {escalations.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  {t('enterprisePanel.escalationsEmpty')}
                </li>
              ) : (
                escalations.map((escalation) => (
                  <li
                    key={escalation.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4"
                    data-qa={`enterprise-panel-escalation-${escalation.id}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-primary">{escalation.title}</p>
                      <p className="text-xs text-slate-500">
                        {t('enterprisePanel.escalationOwner', { name: escalation.owner })}
                      </p>
                    </div>
                    <StatusPill tone={escalation.severity === 'high' ? 'danger' : 'warning'}>
                      {escalation.openedAt
                        ? t('enterprisePanel.escalationOpened', { date: format.date(escalation.openedAt) })
                        : t('enterprisePanel.escalationOpenedRecent')}
                    </StatusPill>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {hasGovernanceContent ? (
          <section id="enterprise-panel-governance" aria-labelledby="enterprise-panel-governance" className="space-y-6">
            <header className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="enterprise-panel-governance" className="text-lg font-semibold text-primary">
                {t('enterprisePanel.governanceHeadline')}
              </h2>
            </header>
            <div className="grid gap-6 lg:grid-cols-3">
              <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm" data-qa="enterprise-panel-compliance">
                <header className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-primary">{t('enterprisePanel.governanceCompliance')}</h3>
                </header>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('enterprisePanel.governanceCompliance')}</p>
                    <p className="mt-2 text-2xl font-semibold text-primary">
                      {format.percentage(governance.complianceScore ?? 0)}
                    </p>
                  </div>
                  <StatusPill tone={resolvePostureTone(governance.posture)}>
                    {governance.posture || t('common.onTrack')}
                  </StatusPill>
                  <p className="text-sm text-slate-500">
                    {t('enterprisePanel.governanceDataResidency')}: {governance.dataResidency || t('common.notAvailable')}
                  </p>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm" data-qa="enterprise-panel-risk">
                <header className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-primary">{t('enterprisePanel.governanceRiskRegister')}</h3>
                </header>
                <ul className="mt-4 space-y-3">
                  {riskRegister.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                      {t('enterprisePanel.riskEmpty')}
                    </li>
                  ) : (
                    riskRegister.map((risk) => {
                      const severityKey = resolveSeverityKey(risk.severity);
                      return (
                        <li
                          key={risk.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                          data-qa={`enterprise-panel-risk-${risk.id}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-primary">{risk.label}</p>
                              {risk.mitigation ? <p className="mt-1 text-xs text-slate-500">{risk.mitigation}</p> : null}
                            </div>
                            <StatusPill tone={resolveSeverityTone(risk.severity)}>
                              {t(`enterprisePanel.riskSeverity.${severityKey}`)}
                            </StatusPill>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                            {risk.owner ? <span>{t('enterprisePanel.riskOwner', { name: risk.owner })}</span> : null}
                            {risk.due ? <span>{t('enterprisePanel.riskDue', { date: format.date(risk.due) })}</span> : null}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm" data-qa="enterprise-panel-audits">
                <header className="flex items-center gap-3">
                  <FlagIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-primary">{t('enterprisePanel.governanceAudits')}</h3>
                </header>
                <ul className="mt-4 space-y-3">
                  {audits.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                      {t('enterprisePanel.auditsEmpty')}
                    </li>
                  ) : (
                    audits.map((audit) => (
                      <li
                        key={audit.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                        data-qa={`enterprise-panel-audit-${audit.id}`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-primary">{audit.name}</p>
                          {audit.owner ? <p className="text-xs text-slate-500">{audit.owner}</p> : null}
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p className="font-semibold text-primary">{t('enterprisePanel.auditStatus', { status: audit.status })}</p>
                          {audit.due ? <p>{t('enterprisePanel.auditDue', { date: format.date(audit.due) })}</p> : null}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </article>
            </div>
          </section>
        ) : null}

        {hasRoadmapContent ? (
          <section id="enterprise-panel-roadmap" aria-labelledby="enterprise-panel-roadmap" className="space-y-4">
            <header className="flex items-center gap-3">
              <FlagIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="enterprise-panel-roadmap" className="text-lg font-semibold text-primary">
                {t('enterprisePanel.roadmapHeadline')}
              </h2>
            </header>
            <ul className="space-y-3">
              {roadmap.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  {t('enterprisePanel.roadmapEmpty')}
                </li>
              ) : (
                roadmap.map((milestone) => {
                  const statusLabel =
                    typeof milestone.status === 'string'
                      ? milestone.status.replace(/[-_]/g, ' ')
                      : t('common.onTrack');
                  const tone = (() => {
                    const status = (milestone.status || '').toLowerCase();
                    if (status.includes('risk') || status.includes('blocked')) return 'danger';
                    if (status.includes('delay') || status.includes('hold')) return 'warning';
                    return 'success';
                  })();
                  return (
                    <li
                      key={milestone.id}
                      className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
                      data-qa={`enterprise-panel-roadmap-${milestone.id}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{milestone.milestone}</p>
                          {milestone.detail ? <p className="mt-1 text-xs text-slate-500">{milestone.detail}</p> : null}
                        </div>
                        <StatusPill tone={tone}>{statusLabel}</StatusPill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        {milestone.quarter ? <span>{milestone.quarter}</span> : null}
                        {milestone.owner ? <span>{t('enterprisePanel.actionOwner')}: {milestone.owner}</span> : null}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        ) : null}
      </DashboardShell>

      {state.loading && !state.data ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/30" role="status" aria-live="polite">
          <Spinner />
          <span className="sr-only">{t('enterprisePanel.loadingOverlay')}</span>
        </div>
      ) : null}
    </div>
  );
}

