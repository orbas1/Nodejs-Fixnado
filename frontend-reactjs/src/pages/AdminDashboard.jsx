import { useMemo, useState } from 'react';
import { ArrowDownTrayIcon, AdjustmentsHorizontalIcon, SwatchIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';
import { Button, Card, SegmentedControl, StatusPill } from '../components/ui/index.js';
import {
  AnalyticsWidget,
  ComparisonBarChart,
  GaugeWidget,
  MetricTile,
  TrendChart
} from '../components/widgets/index.js';

const commandMetrics = {
  '7d': [
    {
      id: 'escrow',
      label: 'Escrow under management',
      value: '£18.2m',
      delta: '+6.2% vs 7d',
      deltaTone: 'positive',
      caption: 'Across 1,284 active bookings',
      status: { label: 'Stabilised', tone: 'info' }
    },
    {
      id: 'disputes',
      label: 'Disputes requiring action',
      value: '12',
      delta: '-2.1% vs 7d',
      deltaTone: 'positive',
      caption: 'Median response 38 minutes',
      status: { label: 'Managed', tone: 'success' }
    },
    {
      id: 'jobs',
      label: 'Live jobs',
      value: '1,204',
      delta: '+3.7% vs 7d',
      deltaTone: 'positive',
      caption: 'Coverage across 92 zones',
      status: { label: 'Peak period', tone: 'warning' }
    },
    {
      id: 'sla',
      label: 'SLA compliance',
      value: '98.2%',
      delta: '+1.2% vs 7d',
      deltaTone: 'positive',
      caption: 'Goal ≥ 97%',
      status: { label: 'On target', tone: 'success' }
    }
  ],
  '30d': [
    {
      id: 'escrow',
      label: 'Escrow under management',
      value: '£70.4m',
      delta: '+12.4% vs 30d',
      deltaTone: 'positive',
      caption: '4,932 bookings monitored',
      status: { label: 'Growth trend', tone: 'info' }
    },
    {
      id: 'disputes',
      label: 'Disputes requiring action',
      value: '54',
      delta: '-4.8% vs 30d',
      deltaTone: 'positive',
      caption: 'Median response 41 minutes',
      status: { label: 'Contained', tone: 'success' }
    },
    {
      id: 'jobs',
      label: 'Live jobs',
      value: '4,812',
      delta: '+8.4% vs 30d',
      deltaTone: 'positive',
      caption: '99 active territories',
      status: { label: 'Seasonal spike', tone: 'warning' }
    },
    {
      id: 'sla',
      label: 'SLA compliance',
      value: '97.6%',
      delta: '+0.8% vs 30d',
      deltaTone: 'positive',
      caption: 'Goal ≥ 97%',
      status: { label: 'Guarded', tone: 'info' }
    }
  ],
  '90d': [
    {
      id: 'escrow',
      label: 'Escrow under management',
      value: '£192.8m',
      delta: '+18.9% vs 90d',
      deltaTone: 'positive',
      caption: '12,834 bookings monitored',
      status: { label: 'Momentum', tone: 'success' }
    },
    {
      id: 'disputes',
      label: 'Disputes requiring action',
      value: '178',
      delta: '-8.5% vs 90d',
      deltaTone: 'positive',
      caption: 'Median response 47 minutes',
      status: { label: 'Improving', tone: 'success' }
    },
    {
      id: 'jobs',
      label: 'Live jobs',
      value: '12,402',
      delta: '+11.6% vs 90d',
      deltaTone: 'positive',
      caption: 'Coverage across 108 zones',
      status: { label: 'Growth', tone: 'info' }
    },
    {
      id: 'sla',
      label: 'SLA compliance',
      value: '97.1%',
      delta: '+0.5% vs 90d',
      deltaTone: 'positive',
      caption: 'Goal ≥ 97%',
      status: { label: 'Watchlist', tone: 'warning' }
    }
  ]
};

const escrowTrend = {
  '7d': [
    { label: 'Mon', value: 17.6, target: 16.5 },
    { label: 'Tue', value: 17.9, target: 16.7 },
    { label: 'Wed', value: 18.1, target: 16.9 },
    { label: 'Thu', value: 18.4, target: 17.1 },
    { label: 'Fri', value: 18.7, target: 17.2 },
    { label: 'Sat', value: 18.5, target: 17.1 },
    { label: 'Sun', value: 18.2, target: 17.0 }
  ],
  '30d': [
    { label: 'Week 1', value: 16.2, target: 15.8 },
    { label: 'Week 2', value: 16.9, target: 16.0 },
    { label: 'Week 3', value: 17.4, target: 16.2 },
    { label: 'Week 4', value: 18.2, target: 16.5 }
  ],
  '90d': [
    { label: 'Jan', value: 14.6, target: 14.0 },
    { label: 'Feb', value: 15.8, target: 14.6 },
    { label: 'Mar', value: 16.9, target: 15.2 },
    { label: 'Apr', value: 18.2, target: 15.9 }
  ]
};

const disputeBreakdown = {
  '7d': [
    { label: 'Mon', resolved: 52, escalated: 6 },
    { label: 'Tue', resolved: 48, escalated: 7 },
    { label: 'Wed', resolved: 50, escalated: 5 },
    { label: 'Thu', resolved: 46, escalated: 5 },
    { label: 'Fri', resolved: 58, escalated: 4 },
    { label: 'Sat', resolved: 49, escalated: 6 },
    { label: 'Sun', resolved: 43, escalated: 3 }
  ],
  '30d': [
    { label: 'Week 1', resolved: 184, escalated: 28 },
    { label: 'Week 2', resolved: 176, escalated: 24 },
    { label: 'Week 3', resolved: 188, escalated: 26 },
    { label: 'Week 4', resolved: 194, escalated: 22 }
  ],
  '90d': [
    { label: 'Jan', resolved: 612, escalated: 98 },
    { label: 'Feb', resolved: 648, escalated: 104 },
    { label: 'Mar', resolved: 702, escalated: 96 }
  ]
};

const complianceControls = [
  {
    id: 1,
    name: 'Provider KYC refresh',
    detail: '8 providers triggered by expiring IDs; automated reminders dispatched with secure upload links.',
    due: 'Due today',
    owner: 'Compliance Ops',
    tone: 'warning'
  },
  {
    id: 2,
    name: 'Insurance certificate review',
    detail: 'Three enterprise clients require renewed liability certificates before next milestone.',
    due: 'Due in 2 days',
    owner: 'Risk & Legal',
    tone: 'info'
  },
  {
    id: 3,
    name: 'GDPR DSAR queue',
    detail: 'Two data export requests awaiting legal approval; SLA 72 hours.',
    due: 'Due in 18 hours',
    owner: 'Privacy Office',
    tone: 'danger'
  }
];

const auditTimeline = [
  { time: '08:30', event: 'GDPR DSAR pack exported', owner: 'Legal', status: 'Completed' },
  { time: '09:45', event: 'Escrow reconciliation (daily)', owner: 'Finance Ops', status: 'In progress' },
  { time: '11:00', event: 'Provider onboarding review', owner: 'Compliance Ops', status: 'Scheduled' },
  { time: '14:30', event: 'Pen-test retest results review', owner: 'Security', status: 'Scheduled' }
];

const queueInsights = [
  {
    id: 1,
    title: 'Provider verification queue',
    summary:
      'Identity verifications, insurance checks, and DBS renewals are grouped into a single command queue with automation fallbacks.',
    updates: [
      '4 documents awaiting manual agent review after OCR warnings.',
      'Average handling time 1.2h (target ≤ 1.5h).',
      'Auto-reminders triggered for 12 providers via email + SMS.'
    ],
    owner: 'Compliance Ops'
  },
  {
    id: 2,
    title: 'Dispute resolution board',
    summary:
      'High-risk disputes flagged for legal oversight with evidence packs collated via secure storage.',
    updates: [
      '3 disputes escalated to Stage 2 review.',
      'AI summarisation enabled for transcripts; manual review still required for regulated industries.',
      'Median time-to-resolution: 19 hours (goal 24 hours).'
    ],
    owner: 'Support & Legal'
  }
];

const securitySignals = [
  {
    label: 'MFA adoption',
    value: '96.4%',
    caption: 'Enterprise + provider portals',
    tone: 'success'
  },
  {
    label: 'Critical alerts',
    value: '0',
    caption: 'Security Operations Center overnight review',
    tone: 'success'
  },
  {
    label: 'Audit log ingestion',
    value: '100%',
    caption: '24h ingestion completeness from Splunk',
    tone: 'info'
  }
];

const automationBacklog = [
  {
    name: 'Escrow ledger reconciliation automation',
    status: 'Ready for QA',
    notes: 'Extends double-entry validation to rental deposits; requires finance sign-off.',
    tone: 'success'
  },
  {
    name: 'Compliance webhook retries',
    status: 'In build',
    notes: 'Retries failed submissions to insurance partners with exponential backoff.',
    tone: 'info'
  },
  {
    name: 'Dispute document summarisation',
    status: 'Discovery',
    notes: 'Pilot with AI summarisation flagged for accuracy review before production rollout.',
    tone: 'warning'
  }
];

const timeframeOptions = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' }
];

const slaScore = { value: 98.2, target: 97, caption: 'SLA is calculated across enterprise, provider, and consumer workflows.' };

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState('7d');
  const metrics = commandMetrics[timeframe];
  const trendSeries = escrowTrend[timeframe];
  const disputeSeries = disputeBreakdown[timeframe];

  const automationSummary = useMemo(() => {
    const counts = automationBacklog.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return `Automation backlog: ${counts['Ready for QA'] ?? 0} ready, ${counts['In build'] ?? 0} in build, ${
      counts.Discovery ?? 0
    } discovery.`;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
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
          }
        ]}
        meta={[
          { label: 'Escrow managed', value: '£18.2m', caption: 'Across 1,284 bookings', emphasis: true },
          { label: 'SLA compliance', value: '98.2%', caption: 'Goal ≥ 97%' },
          { label: 'Open disputes', value: '12', caption: 'Median response 38m' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-14">
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
                        <p className="mt-2 text-xl font-semibold text-primary">{signal.value}</p>
                        <p className="text-xs text-slate-500">{signal.caption}</p>
                      </div>
                      <StatusPill tone={signal.tone}>{signal.tone === 'success' ? 'Healthy' : 'Monitor'}</StatusPill>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-primary">Automation backlog</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">{automationSummary}</p>
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
                </ul>
              </Card>
            </div>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SegmentedControl
              name="Command metrics timeframe"
              value={timeframe}
              options={timeframeOptions}
              onChange={setTimeframe}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" icon={AdjustmentsHorizontalIcon} analyticsId="configure_alerts">
                Configure alerts
              </Button>
              <Button variant="secondary" size="sm" icon={ArrowDownTrayIcon} analyticsId="export_metrics">
                Export CSV
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricTile key={metric.id} {...metric} />
            ))}
          </div>
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
            footer="Data refreshed 3 minutes ago via Kafka ledger stream."
            size="lg"
          >
            <TrendChart
              data={trendSeries}
              valueKey="value"
              targetKey="target"
              color="var(--fx-color-brand-primary)"
              targetColor="var(--fx-color-success)"
              yAxisFormatter={(val) => `£${val.toFixed(1)}m`}
              tooltipFormatter={(val) => `£${val.toFixed(2)}m`}
              referenceTarget={17}
              height={320}
            />
          </AnalyticsWidget>

          <AnalyticsWidget
            title="SLA health"
            subtitle="Aggregated SLA derived from bookings, rentals, and dispute queues with red-line target at 97%."
            badge="Reliability"
            footer="Feeds from observability pipeline; alerts trigger at <96%."
          >
            <GaugeWidget
              value={slaScore.value}
              target={slaScore.target}
              max={100}
              caption={slaScore.caption}
              tone={slaScore.value >= slaScore.target ? 'success' : 'warning'}
            />
          </AnalyticsWidget>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <AnalyticsWidget
            title="Dispute outcomes"
            subtitle="Resolved vs escalated disputes segmented by reporting period with automation-assisted summaries."
            badge="Support"
            footer="Automation coverage: transcripts summarised for 62% of cases this period."
          >
            <ComparisonBarChart data={disputeSeries} primaryKey="resolved" secondaryKey="escalated" />
          </AnalyticsWidget>

          <Card padding="lg" className="shadow-lg shadow-primary/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Audit timeline</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {auditTimeline.map((item) => (
                <li key={item.time} className="rounded-2xl border border-slate-100 bg-white/75 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.time}</p>
                    <StatusPill tone={item.status === 'Completed' ? 'success' : 'info'}>{item.status}</StatusPill>
                  </div>
                  <p className="mt-2 font-semibold text-primary">{item.event}</p>
                  <p className="text-xs text-slate-500">Owner: {item.owner}</p>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="mt-6"
              to="/admin/audit-log"
              analyticsId="view_full_audit_timeline"
            >
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
            {queueInsights.map((queue) => (
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
                <Button
                  variant="tertiary"
                  size="sm"
                  className="mt-5"
                  to="/admin/queues"
                  analyticsId={`view_queue_${queue.id}`}
                >
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
