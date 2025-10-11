import { useMemo, useState } from 'react';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import { TelemetryBreakdownList, TelemetrySummaryCard } from '../components/telemetry/index.js';
import { AnalyticsWidget, TrendChart } from '../components/widgets/index.js';
import { Button, Card, SegmentedControl, Spinner, StatusPill } from '../components/ui/index.js';
import useTelemetrySummary from '../hooks/useTelemetrySummary.js';

const RANGE_OPTIONS = [
  { label: '24 hours', value: '1d' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' }
];

const STALE_THRESHOLD_MINUTES = 120;

const SAMPLE_SUMMARY = {
  range: {
    start: new Date('2025-02-01T00:00:00Z'),
    end: new Date('2025-02-07T23:59:00Z'),
    tenantId: 'fixnado-demo'
  },
  totals: {
    events: 1284
  },
  breakdown: {
    theme: [
      { key: 'standard', count: 684 },
      { key: 'dark', count: 402 },
      { key: 'emo', count: 198 }
    ],
    density: [
      { key: 'comfortable', count: 854 },
      { key: 'compact', count: 430 }
    ],
    contrast: [
      { key: 'standard', count: 1012 },
      { key: 'high', count: 272 }
    ],
    marketingVariant: [
      { key: 'default', count: 732 },
      { key: 'seasonal', count: 328 },
      { key: 'campaign-finova', count: 224 }
    ]
  },
  timeseries: [
    { date: '2025-02-01', total: 160, byTheme: { standard: 90, dark: 50, emo: 20 } },
    { date: '2025-02-02', total: 172, byTheme: { standard: 96, dark: 52, emo: 24 } },
    { date: '2025-02-03', total: 184, byTheme: { standard: 104, dark: 56, emo: 24 } },
    { date: '2025-02-04', total: 196, byTheme: { standard: 112, dark: 60, emo: 24 } },
    { date: '2025-02-05', total: 215, byTheme: { standard: 116, dark: 74, emo: 25 } },
    { date: '2025-02-06', total: 184, byTheme: { standard: 96, dark: 64, emo: 24 } },
    { date: '2025-02-07', total: 173, byTheme: { standard: 90, dark: 46, emo: 37 } }
  ],
  latestEventAt: new Date('2025-02-07T20:45:00Z'),
  fetchedAt: new Date('2025-02-07T20:50:00Z')
};

function formatDateRange(range) {
  if (!range?.start || !range?.end) {
    return 'Telemetry window pending';
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return `${formatter.format(range.start)} – ${formatter.format(range.end)}`;
}

function formatRelativeTime(date) {
  if (!date) {
    return 'No events recorded';
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function computeBreakdown(entries = [], total = 0, labels = {}) {
  if (!entries.length || !total) {
    return entries.map((entry) => ({
      key: entry.key || 'unspecified',
      label: labels[entry.key] ?? entry.key ?? 'Unspecified',
      count: entry.count ?? 0,
      percent: 0
    }));
  }

  return entries
    .map((entry) => ({
      key: entry.key || 'unspecified',
      label: labels[entry.key] ?? (entry.key ? entry.key.replace(/[-_]/g, ' ') : 'Unspecified'),
      count: entry.count ?? 0,
      percent: ((entry.count ?? 0) / total) * 100
    }))
    .sort((a, b) => b.count - a.count);
}

function formatTimeseries(data = []) {
  const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  return data.map((point) => {
    const date = point.date ? new Date(`${point.date}T00:00:00Z`) : null;
    return {
      label: date ? formatter.format(date) : point.date,
      value: point.total ?? 0
    };
  });
}

function resolveStaleness(latestEventAt, totalEvents) {
  if (!latestEventAt) {
    return {
      stale: true,
      minutes: Infinity
    };
  }

  const diffMs = Date.now() - latestEventAt.getTime();
  const diffMinutes = diffMs / 60000;
  const stale = diffMinutes > STALE_THRESHOLD_MINUTES || totalEvents === 0;
  return {
    stale,
    minutes: diffMinutes
  };
}

function deriveDelta(current, baseline) {
  if (!baseline) {
    return null;
  }

  const diff = current - baseline;
  const percent = (diff / baseline) * 100;
  const formatted = `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}% vs prev`;

  return {
    label: formatted,
    tone: percent >= 0 ? 'positive' : 'negative'
  };
}

function buildOperationsSummary(summary, refreshInterval) {
  if (!summary) {
    return null;
  }

  const { range, latestEventAt, fetchedAt, totals } = summary;
  const nextRefresh = fetchedAt && refreshInterval ? new Date(fetchedAt.getTime() + refreshInterval) : null;

  const fmtDate = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  });

  return [
    {
      label: 'Telemetry window',
      value: range ? formatDateRange(range) : 'Pending aggregation'
    },
    {
      label: 'Latest event received',
      value: latestEventAt ? `${fmtDate.format(latestEventAt)} (${formatRelativeTime(latestEventAt)})` : 'No events'
    },
    {
      label: 'Next scheduled refresh',
      value: nextRefresh ? `${fmtDate.format(nextRefresh)} (auto)` : 'Auto refresh disabled'
    },
    {
      label: 'Events captured',
      value: `${totals?.events?.toLocaleString?.() ?? 0}`
    }
  ];
}

export default function TelemetryDashboard() {
  const [range, setRange] = useState('7d');
  const [overrideSummary, setOverrideSummary] = useState(null);
  const { data, loading, error, refresh, isRefreshing } = useTelemetrySummary({ range, refreshInterval: 5 * 60 * 1000 });

  const summary = overrideSummary ?? data;

  const totalEvents = summary?.totals?.events ?? 0;
  const themeBreakdown = useMemo(
    () =>
      computeBreakdown(summary?.breakdown?.theme, totalEvents, {
        standard: 'Standard theme',
        dark: 'Dark mode',
        emo: 'Emo spotlight',
        unspecified: 'Unspecified'
      }),
    [summary, totalEvents]
  );

  const densityBreakdown = useMemo(
    () =>
      computeBreakdown(summary?.breakdown?.density, totalEvents, {
        comfortable: 'Comfortable',
        compact: 'Compact'
      }),
    [summary, totalEvents]
  );

  const marketingBreakdown = useMemo(
    () =>
      computeBreakdown(summary?.breakdown?.marketingVariant, totalEvents, {
        default: 'Default',
        seasonal: 'Seasonal overlay',
        'campaign-finova': 'Finova campaign'
      }),
    [summary, totalEvents]
  );

  const themeShare = themeBreakdown[0];
  const previousThemeShare = themeBreakdown[1];
  const delta = themeShare && previousThemeShare ? deriveDelta(themeShare.count, previousThemeShare.count) : null;

  const timeseries = useMemo(() => formatTimeseries(summary?.timeseries), [summary]);
  const staleness = useMemo(() => resolveStaleness(summary?.latestEventAt, totalEvents), [summary, totalEvents]);
  const operationsSummary = useMemo(() => buildOperationsSummary(summary, 5 * 60 * 1000), [summary]);

  const handleLoadSample = () => {
    setOverrideSummary({
      ...SAMPLE_SUMMARY,
      range: { ...SAMPLE_SUMMARY.range },
      breakdown: {
        ...SAMPLE_SUMMARY.breakdown,
        theme: SAMPLE_SUMMARY.breakdown.theme.map((entry) => ({ ...entry })),
        density: SAMPLE_SUMMARY.breakdown.density.map((entry) => ({ ...entry })),
        contrast: SAMPLE_SUMMARY.breakdown.contrast.map((entry) => ({ ...entry })),
        marketingVariant: SAMPLE_SUMMARY.breakdown.marketingVariant.map((entry) => ({ ...entry }))
      },
      timeseries: SAMPLE_SUMMARY.timeseries.map((point) => ({ ...point })),
      resolvedRange: range
    });
  };

  const handleRefresh = () => {
    setOverrideSummary(null);
    refresh();
  };

  const isDev = typeof import.meta !== 'undefined' && !import.meta.env.PROD;

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="telemetry-dashboard">
      <PageHeader
        eyebrow="Operations intelligence"
        title="UI preference telemetry"
        description="Monitor theme adoption, density and contrast preferences, and marketing variant usage streamed from Theme Studio."
        breadcrumbs={[
          { label: 'Operations', to: '/' },
          { label: 'Admin dashboard', to: '/admin/dashboard' },
          { label: 'Telemetry' }
        ]}
        actions={[
          {
            label: 'Runbook',
            to: '/docs/telemetry/ui-preference-dashboard.pdf',
            variant: 'secondary',
            icon: ArrowTopRightOnSquareIcon,
            analyticsId: 'open_telemetry_runbook'
          }
        ]}
        meta={[
          {
            label: 'Current window',
            value: summary ? formatDateRange(summary.range) : 'Loading',
            caption: 'Range updates sync with analytics ingestion schedule.'
          },
          {
            label: 'Last event',
            value: summary?.latestEventAt ? formatRelativeTime(summary.latestEventAt) : 'Pending',
            caption: summary?.latestEventAt ? 'Derived from telemetry aggregation' : 'Awaiting instrumentation'
          }
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-12">
        <section className="flex flex-wrap items-center justify-between gap-4" data-qa="telemetry-range-controls">
          <SegmentedControl
            name="Telemetry range"
            value={range}
            options={RANGE_OPTIONS}
            onChange={(value) => {
              setOverrideSummary(null);
              setRange(value);
            }}
            qa={{ group: 'telemetry-range', option: 'telemetry-range-option' }}
          />
          <div className="flex items-center gap-3">
            {isRefreshing ? <Spinner aria-label="Refreshing telemetry" /> : null}
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowPathIcon}
              onClick={handleRefresh}
              analyticsId="telemetry_refresh"
            >
              Refresh now
            </Button>
          </div>
        </section>

        {error && !overrideSummary ? (
          <Card
            padding="lg"
            className="border border-rose-100 bg-rose-50/80 text-rose-800"
            data-qa="telemetry-error"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.25em]">Telemetry offline</p>
                <p className="text-sm">
                  {error.message || 'Telemetry summary is temporarily unavailable. Investigate the ingestion service health and try again.'}
                </p>
              </div>
              {isDev ? (
                <Button variant="secondary" onClick={handleLoadSample} analyticsId="telemetry_load_sample">
                  Load sample dataset
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3" data-qa="telemetry-summary-cards">
          <TelemetrySummaryCard
            label="Events ingested"
            value={totalEvents.toLocaleString()}
            caption="Theme Studio preference changes captured within the selected window."
            status={{ label: staleness.stale ? 'Attention required' : 'Healthy', tone: staleness.stale ? 'warning' : 'success' }}
            qa="telemetry-summary.events"
          />
          <TelemetrySummaryCard
            label="Leading theme"
            value={themeShare ? `${themeShare.label}` : 'No data'}
            caption={
              themeShare
                ? `${Math.round(themeShare.percent)}% of events`
                : 'Waiting for instrumentation to emit events.'
            }
            delta={delta?.label ?? undefined}
            deltaTone={delta?.tone ?? 'positive'}
            qa="telemetry-summary.theme"
          />
          <TelemetrySummaryCard
            label="Data freshness"
            value={summary?.latestEventAt ? formatRelativeTime(summary.latestEventAt) : 'Unavailable'}
            caption="UI announces telemetry staleness once no events land for 2 hours."
            status={{
              label: staleness.stale ? 'Investigate pipeline' : 'Within SLA',
              tone: staleness.stale ? 'warning' : 'success'
            }}
            qa="telemetry-summary.freshness"
          />
        </section>

        <AnalyticsWidget
          title="Theme preference trend"
          subtitle="Smoothed daily totals based on telemetry ingestion"
          badge="Analytics"
          actions={[
            {
              label: 'Export CSV',
              variant: 'secondary',
              onClick: () => {
                if (!summary) {
                  return;
                }
                const rows = [
                  ['range_start', summary.range?.start?.toISOString?.() ?? ''],
                  ['range_end', summary.range?.end?.toISOString?.() ?? ''],
                  ['tenant', summary.range?.tenantId ?? 'all'],
                  ['total_events', summary.totals?.events ?? 0],
                  ['latest_event_at', summary.latestEventAt?.toISOString?.() ?? ''],
                  ['fetched_at', summary.fetchedAt?.toISOString?.() ?? ''],
                  [],
                  ['theme', 'count']
                ];
                themeBreakdown.forEach((entry) => {
                  rows.push([entry.label, entry.count]);
                });

                const csv = rows
                  .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
                  .join('\n');

                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `telemetry-summary-${summary.resolvedRange ?? range}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              },
              icon: ChartBarIcon
            }
          ]}
          size="lg"
          data-qa="telemetry-chart"
        >
          {loading && !summary ? (
            <div className="flex h-52 items-center justify-center">
              <Spinner aria-label="Loading telemetry chart" size="2rem" />
            </div>
          ) : (
            <TrendChart
              data={timeseries}
              valueKey="value"
              color="var(--fx-color-brand-primary, #1F4ED8)"
              tooltipFormatter={(value) => `${value.toLocaleString()} events`}
              yAxisFormatter={(value) => `${value}`}
              height={320}
            />
          )}
        </AnalyticsWidget>

        <section className="grid gap-6 lg:grid-cols-3" data-qa="telemetry-breakdowns">
          <TelemetryBreakdownList
            title="Theme adoption"
            description="Share of preference updates per theme across the selected range."
            items={themeBreakdown}
            qa="telemetry-breakdown.theme"
          />
          <TelemetryBreakdownList
            title="Density preferences"
            description="Monitor how operators toggle compact vs comfortable layouts."
            items={densityBreakdown}
            qa="telemetry-breakdown.density"
          />
          <TelemetryBreakdownList
            title="Marketing variants"
            description="Track marketing module usage to coordinate Contentful releases."
            items={marketingBreakdown}
            qa="telemetry-breakdown.marketing"
          />
        </section>

        <Card padding="lg" className="border border-slate-100 bg-white/90 shadow-sm" data-qa="telemetry-operations">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Operations</p>
              <h3 className="mt-2 text-xl font-semibold text-primary md:text-2xl">
                Refresh cadence & alerting
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Telemetry data refreshes automatically every five minutes. Configure alerts in Looker if no events arrive within the
                SLA or if emo adoption drops below 10% for enterprise tenants.
              </p>
            </div>
            <StatusPill tone={staleness.stale ? 'warning' : 'success'}>
              {staleness.stale ? 'Investigate ingestion' : 'Ingestion healthy'}
            </StatusPill>
          </header>
          <dl className="grid gap-4 md:grid-cols-2">
            {operationsSummary?.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-secondary/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{item.label}</dt>
                <dd className="mt-2 text-sm text-primary">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
