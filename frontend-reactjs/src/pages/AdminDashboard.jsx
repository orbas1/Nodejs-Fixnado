import PageHeader from '../components/blueprints/PageHeader.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';

const commandMetrics = [
  {
    id: 1,
    label: 'Escrow under management',
    value: '$18.2m',
    delta: '+6.2% WoW',
    caption: 'Across 1,284 active bookings',
    status: 'Stabilised'
  },
  {
    id: 2,
    label: 'Disputes requiring action',
    value: '12',
    delta: '-2.1% WoW',
    caption: 'Median response 38 minutes',
    status: 'Managed'
  },
  {
    id: 3,
    label: 'Live jobs',
    value: '1,204',
    delta: '+3.7% WoW',
    caption: 'Coverage across 92 zones',
    status: 'Peak period'
  },
  {
    id: 4,
    label: 'SLA compliance',
    value: '98.2%',
    delta: '+1.2% WoW',
    caption: 'Goal ≥ 97%',
    status: 'On target'
  }
];

const complianceControls = [
  {
    id: 1,
    name: 'Provider KYC refresh',
    detail: '8 providers triggered by expiring IDs; auto reminders sent with secure upload links.',
    due: 'Due today',
    owner: 'Compliance Ops'
  },
  {
    id: 2,
    name: 'Insurance certificate review',
    detail: 'Three enterprise clients require renewed liability certificates before next milestone.',
    due: 'Due in 2 days',
    owner: 'Risk & Legal'
  },
  {
    id: 3,
    name: 'GDPR DSAR queue',
    detail: 'Two data export requests awaiting legal approval; SLA 72 hours.',
    due: 'Due in 18 hours',
    owner: 'Privacy Office'
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
    caption: 'Enterprise + provider portals'
  },
  {
    label: 'Critical alerts',
    value: '0',
    caption: 'Security Operations Center overnight review'
  },
  {
    label: 'Audit log ingestion',
    value: '100%',
    caption: '24h ingestion completeness from Splunk'
  }
];

const automationBacklog = [
  {
    name: 'Escrow ledger reconciliation automation',
    status: 'Ready for QA',
    notes: 'Extends double-entry validation to rental deposits; requires finance sign-off.'
  },
  {
    name: 'Compliance webhook retries',
    status: 'In build',
    notes: 'Retries failed submissions to insurance partners with exponential backoff.'
  },
  {
    name: 'Dispute document summarisation',
    status: 'Discovery',
    notes: 'Pilot with AI summarisation flagged for accuracy review before production rollout.'
  }
];

export default function AdminDashboard() {
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
          { label: 'Download audit pack', to: '/admin/reports', variant: 'primary' }
        ]}
        meta={[
          { label: 'Escrow managed', value: '$18.2m', caption: 'Across 1,284 bookings', emphasis: true },
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
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Security signals</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {securitySignals.map((signal) => (
                    <li key={signal.label} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4">
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{signal.label}</span>
                      <span className="mt-2 text-xl font-semibold text-primary">{signal.value}</span>
                      <span className="text-xs text-slate-500">{signal.caption}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Automation backlog</h3>
                <ul className="mt-4 space-y-3 text-xs text-slate-600">
                  {automationBacklog.map((item) => (
                    <li key={item.name}>
                      <p className="font-semibold text-primary">{item.name}</p>
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">{item.status}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {commandMetrics.map((metric) => (
              <article key={metric.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{metric.label}</p>
                <p className="mt-4 text-3xl font-semibold text-primary">{metric.value}</p>
                <p className="mt-2 text-xs font-semibold text-success">{metric.delta}</p>
                <p className="mt-3 text-sm text-slate-600">{metric.caption}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.35em] text-primary/60">{metric.status}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection
          eyebrow="Compliance & security"
          title="See critical controls and checkpoints at a glance"
          description="Compliance teams can prioritise expiring documents, privacy requests, and insurance renewals without leaving the dashboard. Each item links to dedicated workflows in the admin console."
          aside={
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Control queue</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {complianceControls.map((control) => (
                    <li key={control.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <p className="text-sm font-semibold text-primary">{control.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{control.detail}</p>
                      <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                        <span>{control.due}</span>
                        <span>{control.owner}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Audit timeline</h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {auditTimeline.map((item) => (
                  <li key={item.time} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.time}</p>
                      <p className="mt-1 font-semibold text-primary">{item.event}</p>
                      <p className="text-xs text-slate-500">{item.owner}</p>
                    </div>
                    <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Escalation playbook</h3>
              <p className="mt-2 text-sm text-slate-600">
                Critical incidents follow predefined response plans. Runbooks cover dispute escalation, compliance breaches, and infrastructure alerts with named on-call owners.
              </p>
              <ol className="mt-4 space-y-3 text-xs uppercase tracking-[0.3em] text-primary/70">
                <li>PB-ESC-01 • Dispute escalation</li>
                <li>PB-COMP-04 • KYC breach response</li>
                <li>PB-SEC-02 • SOC anomaly triage</li>
              </ol>
            </div>
          </div>
        </BlueprintSection>

        <BlueprintSection
          eyebrow="Operational queues"
          title="Prioritise the work that keeps Fixnado reliable"
          description="Queue summaries show workload, automation coverage, and risk level. Each card links to filtered admin views for rapid triage."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {queueInsights.map((queue) => (
              <article key={queue.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <header className="space-y-2">
                  <h3 className="text-lg font-semibold text-primary">{queue.title}</h3>
                  <p className="text-sm text-slate-600">{queue.summary}</p>
                </header>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {queue.updates.map((update) => (
                    <li key={update} className="flex gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {update}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-400">Owner: {queue.owner}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>
      </div>
    </div>
  );
}
