import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEnterprisePanel, PanelApiError } from '../api/panelClient.js';
import StatusPill from '../components/ui/StatusPill.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import {
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useLocale } from '../hooks/useLocale.js';

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

export default function EnterprisePanel() {
  const { t, format } = useLocale();
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

  useEffect(() => {
    const controller = new AbortController();
    loadPanel({ signal: controller.signal });
    return () => controller.abort();
  }, [loadPanel]);

  const delivery = state.data?.delivery;
  const spend = state.data?.spend;
  const enterprise = state.data?.enterprise;
  const programmes = state.data?.programmes ?? [];
  const escalations = state.data?.escalations ?? [];
  const invoices = spend?.invoicesAwaitingApproval ?? [];
  const fallbackMeta = state.meta?.payload ?? {};
  const fallbackSections = Array.isArray(fallbackMeta.sections) ? fallbackMeta.sections : [];
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
        : null
    ];

    return items.filter(Boolean);
  }, [escalations.length, t]);

  const heroBadges = useMemo(
    () => [
      {
        tone: deliveryTone,
        label: t('common.slaStatus', { value: format.percentage(delivery?.slaCompliance ?? 0) })
      },
      {
        tone: 'info',
        label: t('common.activeSites', { count: format.number(enterprise?.activeSites ?? 0) })
      }
    ],
    [delivery?.slaCompliance, deliveryTone, enterprise?.activeSites, format, t]
  );

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

