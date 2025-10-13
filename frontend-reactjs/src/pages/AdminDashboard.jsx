import { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, AdjustmentsHorizontalIcon, SwatchIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';
import { Button, Card, SegmentedControl, Skeleton, Spinner, StatusPill } from '../components/ui/index.js';
import { AnalyticsWidget, ComparisonBarChart, GaugeWidget, MetricTile, TrendChart } from '../components/widgets/index.js';
import { getAdminDashboard, PanelApiError } from '../api/panelClient.js';

const DEFAULT_TIMEFRAME = '7d';
const SLA_TARGET = 97;

function formatDelta(tile) {
  if (!tile?.delta) return undefined;
  return `${tile.delta} vs previous period`;
}

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState(DEFAULT_TIMEFRAME);
  const [state, setState] = useState({ loading: true, data: null, error: null, meta: null });

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      setState((current) => ({ ...current, loading: true }));
      try {
        const response = await getAdminDashboard({ timeframe, signal: controller.signal });
        if (!mounted) return;
        setState({ loading: false, data: response.data, meta: response.meta, error: response.meta?.error || null });
      } catch (error) {
        if (!mounted) return;
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load admin dashboard', error?.status ?? 500, { cause: error });
        setState((current) => ({ ...current, loading: false, error: panelError }));
      }
    }

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [timeframe]);

  const dashboard = state.data;
  const summary = dashboard?.metrics?.command?.summary;
  const tiles = dashboard?.metrics?.command?.tiles ?? [];
  const escrowTrend = dashboard?.charts?.escrowTrend?.buckets ?? [];
  const disputeBreakdown = dashboard?.charts?.disputeBreakdown?.buckets ?? [];
  const securitySignals = dashboard?.security?.signals ?? [];
  const automationBacklog = dashboard?.security?.automationBacklog ?? [];
  const queueBoards = dashboard?.queues?.boards ?? [];
  const complianceControls = dashboard?.queues?.complianceControls ?? [];
  const auditTimeline = dashboard?.audit?.timeline ?? [];
  const timeframeOptions = dashboard?.timeframeOptions ?? [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' }
  ];

  const metrics = useMemo(
    () =>
      tiles.map((tile) => ({
        ...tile,
        deltaLabel: formatDelta(tile)
      })),
    [tiles]
  );

  const slaTile = useMemo(() => metrics.find((tile) => tile.id === 'sla'), [metrics]);
  const isFallback = Boolean(state.meta?.fallback);

  const headerMeta = useMemo(
    () => [
      {
        label: 'Escrow managed',
        value: summary?.escrowTotalLabel ?? '—',
        caption: dashboard?.timeframeLabel ? `Window: ${dashboard.timeframeLabel}` : 'Window pending',
        emphasis: true
      },
      {
        label: 'SLA compliance',
        value: summary?.slaComplianceLabel ?? '—',
        caption: `Goal ≥ ${SLA_TARGET}%`
      },
      {
        label: 'Open disputes',
        value: summary?.openDisputesLabel ?? '—',
        caption: 'Requires intervention routing'
      }
    ],
    [summary, dashboard?.timeframeLabel]
  );

  const statusPill = state.loading
    ? { tone: 'info', label: 'Refreshing metrics…' }
    : isFallback
      ? { tone: 'warning', label: 'Showing cached insights' }
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-slate-100 pb-24">
      <PageHeader
        eyebrow="Admin console"
        title="Operations governance dashboard"
        description="Real-time oversight of escrow performance, compliance queues, and dispute health for Fixnado administrators."
        breadcrumbs={[
          { label: 'Operations', to: '/' },
          { label: 'Admin dashboard' }
        ]}
        actions={[
          {
            label: 'Download audit pack',
            to: '/admin/reports',
            variant: 'primary',
            analyticsId: 'download_audit_pack',
            icon: ArrowDownTrayIcon
          },
          {
            label: 'Open theme studio',
            to: '/admin/theme-studio',
            variant: 'secondary',
            analyticsId: 'open_theme_studio',
            icon: SwatchIcon
          },
          {
            label: 'Telemetry dashboard',
            to: '/admin/telemetry',
            variant: 'secondary',
            analyticsId: 'open_telemetry_dashboard',
            icon: AdjustmentsHorizontalIcon
          }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-14">
        {state.error ? (
          <Card padding="lg" className="border border-rose-200 bg-rose-50/80 text-sm text-rose-700">
            <p className="font-semibold">We couldn&apos;t refresh the admin dataset.</p>
            <p className="mt-1">
              {state.error.message} — showing the most recent cached insights until the service becomes available again.
            </p>
          </Card>
        ) : null}

        <BlueprintSection
          eyebrow="Command metrics"
          title="Track the heartbeat of marketplace operations"
          description="Metric tiles combine financial oversight, dispute momentum, and SLA adherence. Data is sourced from the event warehouse and refreshed every five minutes via Kafka consumers."
          aside={
            <div className="space-y-5">
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-primary">Security signals</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {securitySignals.map((signal) => (
                    <li key={signal.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{signal.label}</p>
                        <p className="mt-2 text-xl font-semibold text-primary">{signal.valueLabel}</p>
                        <p className="text-xs text-slate-500">{signal.caption}</p>
                      </div>
                      <StatusPill tone={signal.tone}>{signal.tone === 'success' ? 'Healthy' : signal.tone === 'danger' ? 'Action' : 'Monitor'}</StatusPill>
                    </li>
                  ))}
                  {securitySignals.length === 0 && (
                    <li className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm text-slate-500">
                      Awaiting telemetry to display security posture.
                    </li>
                  )}
                </ul>
              </Card>
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-primary">Automation backlog</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">Orchestrated workflows awaiting review</p>
                <ul className="mt-4 space-y-4 text-sm text-slate-600">
                  {automationBacklog.map((item) => (
                    <li key={item.name} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-primary">{item.name}</p>
                        <StatusPill tone={item.tone}>{item.status}</StatusPill>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{item.notes}</p>
                    </li>
                  ))}
                  {automationBacklog.length === 0 && (
                    <li className="rounded-2xl border border-slate-100 bg-white/70 p-4 text-sm text-slate-500">
                      No automation backlog detected.
                    </li>
                  )}
                </ul>
              </Card>
            </div>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SegmentedControl name="Command metrics timeframe" value={timeframe} options={timeframeOptions} onChange={setTimeframe} />
            <div className="flex flex-wrap items-center gap-3">
              {statusPill ? <StatusPill tone={statusPill.tone}>{statusPill.label}</StatusPill> : null}
              <Button variant="ghost" size="sm" icon={AdjustmentsHorizontalIcon} analyticsId="configure_alerts">
                Configure alerts
              </Button>
              <Button variant="secondary" size="sm" icon={ArrowDownTrayIcon} analyticsId="export_metrics">
                Export CSV
              </Button>
            </div>
          </div>

          {metrics.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricTile
                  key={metric.id}
                  label={metric.label}
                  value={metric.valueLabel}
                  delta={metric.deltaLabel}
                  deltaTone={metric.deltaTone}
                  caption={metric.caption}
                  status={metric.status}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} padding="lg" className="border border-slate-100 bg-white/70">
                  <div className="space-y-4">
                    <Skeleton className="h-3 w-24 rounded-full bg-slate-200" />
                    <Skeleton className="h-8 w-28 rounded-full bg-slate-200" />
                    <Skeleton className="h-3 w-32 rounded-full bg-slate-100" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </BlueprintSection>

        <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
          <AnalyticsWidget
            title="Escrow performance"
            subtitle="Trendline compares managed escrow balance against target envelope derived from revenue planning models."
            badge="Financial governance"
            actions={[
              {
                label: 'View ledger',
                to: '/admin/ledger',
                variant: 'tertiary',
                analyticsId: 'view_ledger'
              }
            ]}
            footer={state.loading ? 'Refreshing data…' : 'Data refreshed from ledger stream'}
            size="lg"
          >
            {state.loading && escrowTrend.length === 0 ? (
              <div className="flex h-80 items-center justify-center">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <TrendChart
                data={escrowTrend}
                valueKey="value"
                targetKey="target"
                color="var(--fx-color-brand-primary)"
                targetColor="var(--fx-color-success)"
                yAxisFormatter={(val) => `£${val.toFixed(1)}m`}
                tooltipFormatter={(val) => `£${val.toFixed(2)}m`}
                height={320}
              />
            )}
          </AnalyticsWidget>

          <AnalyticsWidget
            title="SLA health"
            subtitle="Aggregated SLA derived from bookings, rentals, and dispute queues with red-line target at 97%."
            badge="Reliability"
            footer="Feeds from observability pipeline; alerts trigger at <96%."
          >
            <GaugeWidget
              value={slaTile?.value?.amount ?? 0}
              target={SLA_TARGET}
              max={100}
              caption="SLA is calculated across enterprise, provider, and consumer workflows."
              tone={(slaTile?.value?.amount ?? 0) >= SLA_TARGET ? 'success' : 'warning'}
            />
          </AnalyticsWidget>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <AnalyticsWidget
            title="Dispute outcomes"
            subtitle="Resolved vs escalated disputes segmented by reporting period with automation-assisted summaries."
            badge="Support"
            footer="Automation coverage: transcripts summarised for escalated cases."
          >
            {state.loading && disputeBreakdown.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <ComparisonBarChart data={disputeBreakdown} primaryKey="resolved" secondaryKey="escalated" />
            )}
          </AnalyticsWidget>

          <Card padding="lg" className="shadow-lg shadow-primary/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Audit timeline</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {auditTimeline.map((item) => (
                <li key={`${item.time}-${item.event}`} className="rounded-2xl border border-slate-100 bg-white/75 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.time}</p>
                    <StatusPill tone={item.status === 'Completed' ? 'success' : item.status === 'Attention' ? 'danger' : 'info'}>
                      {item.status}
                    </StatusPill>
                  </div>
                  <p className="mt-2 font-semibold text-primary">{item.event}</p>
                  <p className="text-xs text-slate-500">Owner: {item.owner}</p>
                </li>
              ))}
              {auditTimeline.length === 0 && (
                <li className="rounded-2xl border border-slate-100 bg-white/75 p-4 text-sm text-slate-500">
                  No audit activity recorded in this window.
                </li>
              )}
            </ul>
            <Button variant="ghost" size="sm" className="mt-6" to="/admin/audit-log" analyticsId="view_full_audit_timeline">
              View full audit log
            </Button>
          </Card>
        </div>

        <BlueprintSection
          eyebrow="Command queues"
          title="Escalation boards and compliance queues"
          description="Queues combine automation with manual checkpoints. Owners review flagged items daily with SLA enforcement and analytics instrumentation."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {queueBoards.map((queue) => (
              <Card key={queue.id} padding="lg" interactive>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-primary">{queue.title}</h3>
                  <StatusPill tone="info">{queue.owner}</StatusPill>
                </div>
                <p className="mt-3 text-sm text-slate-600">{queue.summary}</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {queue.updates.map((update) => (
                    <li key={update} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{update}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="tertiary" size="sm" className="mt-5" to="/admin/queues" analyticsId={`view_queue_${queue.id}`}>
                  View queue insights
                </Button>
              </Card>
            ))}

            <Card padding="lg" className="lg:col-span-1" interactive>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-primary">Compliance controls</h3>
                <StatusPill tone="warning">Action</StatusPill>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Compliance monitors expiry windows, DSARs, and insurance renewals with SLA-driven reminders and reviewer queues.
              </p>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {complianceControls.map((control) => (
                  <li key={control.id} className="rounded-2xl border border-slate-100 bg-white/75 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-primary">{control.name}</p>
                      <StatusPill tone={control.tone}>{control.due}</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Owner: {control.owner}</p>
                    <p className="mt-2 text-sm text-slate-600">{control.detail}</p>
                  </li>
                ))}
                {complianceControls.length === 0 && (
                  <li className="rounded-2xl border border-slate-100 bg-white/75 p-4 text-sm text-slate-500">
                    No compliance actions required in this window.
                  </li>
                )}
              </ul>
              <Button variant="ghost" size="sm" className="mt-5" to="/admin/compliance" analyticsId="view_compliance_controls">
                View compliance workflows
              </Button>
            </Card>
          </div>
        </BlueprintSection>
      </div>
    </div>
  );
}
