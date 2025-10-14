import PageHeader from '../components/blueprints/PageHeader.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';

const solutionStreams = [
  {
    id: 'enterprise',
    name: 'Enterprise programmes',
    description: 'Multi-site rollouts with governance and command support built in.',
    services: ['Critical facility retrofits', 'Corporate IT dispatch pods', 'Campaign logistics'],
    kpi: 'Avg. CSAT 97%'
  },
  {
    id: 'smb',
    name: 'SMB & residential',
    description: 'Fast trades, smart upgrades, and emergency cover backed by escrow.',
    services: ['Rapid electrical response', 'Smart home installs', 'Disaster clean-up squads'],
    kpi: 'Median arrival 42m'
  },
  {
    id: 'marketplace',
    name: 'Marketplace & rentals',
    description: 'Tools and consumables ready to bundle with any booking.',
    services: ['High-demand tool rentals', 'Material replenishment', 'Certified consumable packs'],
    kpi: 'On-time delivery 98%'
  }
];

const complianceBadges = [
  {
    title: 'Escrow-first purchasing',
    detail: 'Milestone releases use dual approval and concierge support.'
  },
  {
    title: 'Industry-specific credentials',
    detail: 'Sector packs surface required certificates and renewal reminders.'
  },
  {
    title: 'GDPR & consent ready',
    detail: 'Locale-aware consent prompts and audit logging are standard.'
  }
];

const marketingMetrics = [
  { label: 'Campaign ROI', value: '3.2x', caption: 'Finova co-marketing, Q4 rolling average' },
  { label: 'Lead-to-booking', value: '38%', caption: 'Enterprise nurture journeys' },
  { label: 'Marketplace attach', value: '24%', caption: 'Services with rentals cross-sell' }
];

const funnelEnhancements = [
  {
    name: 'Industry landing modules',
    detail: 'Swap sector copy, case studies, and compliance callouts per locale.'
  },
  {
    name: 'Service comparison rail',
    detail: 'Compare SLAs, credentials, and add-ons without leaving the page.'
  },
  {
    name: 'Proof & assurance ribbon',
    detail: 'Show ISO, insurance, and SOC badges with live renewal status.'
  }
];

const activationSteps = [
  {
    title: 'Scope & configure',
    detail: 'Pick a package or tailor milestones with pricing controls per zone.'
  },
  {
    title: 'Secure & govern',
    detail: 'Capture escrow, insurance, and role access before dispatch.'
  },
  {
    title: 'Launch & optimise',
    detail: 'Use telemetry and feedback to refine every engagement.'
  }
];

const localisationPlan = [
  { locale: 'English (UK)', status: 'Live', notes: 'Baseline copy and FCA language.' },
  { locale: 'English (US)', status: 'Live', notes: 'IRS and OSHA references aligned.' },
  { locale: 'Español (MX)', status: 'Sprint 4', notes: 'Hero, proof, and checkout copy in progress.' }
];

const escrowMilestones = [
  {
    title: 'Milestone funded',
    caption: 'Escrow locks in before teams roll out.'
  },
  {
    title: 'Field telemetry sync',
    caption: 'Mobile apps stream proof of arrival and completion.'
  },
  {
    title: 'Finance release',
    caption: 'Funds move after sign-off and compliance checks.'
  }
];

const assuranceRails = [
  {
    name: 'Role-based orchestration',
    detail: 'RBAC keeps procurement, site, and finance teams in their lanes.'
  },
  {
    name: 'Escrow dispute concierge',
    detail: 'Specialists mediate escalations while funds stay protected.'
  },
  {
    name: 'Mobile parity',
    detail: 'Web and Flutter deliver the same guarded workflows.'
  }
];

export default function Services() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <PageHeader
        eyebrow="Solutions & marketplace"
        title="Fixnado service programmes and inventory"
        description="Explore Fixnado programmes, rapid response services, and marketplace inventory with escrow protection."
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Services' }
        ]}
        actions={[
          { label: 'Talk to sales', to: '/register', variant: 'primary' },
          { label: 'Download brochure', to: '/docs/services-brochure.pdf' }
        ]}
        meta={[
          { label: 'Programmes live', value: '126', caption: 'Enterprise + SMB', emphasis: true },
          { label: 'Marketplace SKUs', value: '4,382', caption: 'Verified inventory' },
          { label: 'Avg. SLA hit rate', value: '98%', caption: 'Tracked weekly' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-14">
        <BlueprintSection
          id="solution-streams"
          eyebrow="Solution streams"
          title="Packages designed for every operational cadence"
          description="Each stream ships with pricing guardrails, compliance notes, and ready collateral."
          aside={
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Compliance guardrails</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {complianceBadges.map((badge) => (
                    <li key={badge.title} className="flex gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                      <span>
                        <p className="font-semibold text-primary">{badge.title}</p>
                        <p className="text-xs text-slate-500">{badge.detail}</p>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Localisation rollout</h3>
                <ul className="mt-4 space-y-3 text-xs text-slate-600">
                  {localisationPlan.map((locale) => (
                    <li key={locale.locale} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <span className="font-semibold text-primary">{locale.locale}</span>
                      <span className="text-right text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                        {locale.status}
                        <br />
                        {locale.notes}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {solutionStreams.map((stream) => (
              <article key={stream.id} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <header>
                  <h2 className="text-lg font-semibold text-primary">{stream.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{stream.description}</p>
                </header>
                <ul className="mt-4 flex flex-wrap gap-2 text-xs text-primary">
                  {stream.services.map((service) => (
                    <li key={service} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1">{service}</li>
                  ))}
                </ul>
                <p className="mt-6 text-xs uppercase tracking-[0.3em] text-primary/70">{stream.kpi}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection
          id="marketing-modules"
          eyebrow="Marketing & conversion"
          title="Campaign-ready modules to convert every visitor"
          description="Marketing and sales teams can activate sector-specific campaigns without engineering effort, while analytics feeds prove ROI."
          aside={
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Performance snapshots</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {marketingMetrics.map((metric) => (
                    <li key={metric.label} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-primary">{metric.value}</p>
                      <p className="text-xs text-slate-500">{metric.caption}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        >
          <div className="grid gap-6 md:grid-cols-3">
            {funnelEnhancements.map((enhancement) => (
              <article key={enhancement.name} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary">{enhancement.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{enhancement.detail}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection
          id="activation-blueprint"
          eyebrow="Activation blueprint"
          title="From scoping to launch in three governed steps"
          description="Clear handoffs keep procurement, finance, and operations aligned. Escrow milestones, compliance gates, and marketing analytics are wired into every step."
        >
          <ol className="space-y-4 text-sm text-slate-600">
            {activationSteps.map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Step {index + 1}</p>
                    <h3 className="mt-2 text-lg font-semibold text-primary">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
                  </div>
                  <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    Escrow aligned
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </BlueprintSection>

        <BlueprintSection
          id="escrow-governance"
          eyebrow="Escrow & governance"
          title="Enterprise booking control with mirrored mobile parity"
          description="Service bookings automatically lock to the correct zone, enforce escrow milestones, and synchronise with the Fixnado mobile experience for field teams."
          aside={
            <div className="space-y-5">
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Milestone tracker</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {escrowMilestones.map((milestone) => (
                    <li key={milestone.title} className="rounded-2xl border border-primary/20 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{milestone.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{milestone.caption}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Security wrap</h3>
                <p className="mt-2 text-sm text-slate-600">
                  All API calls inherit JWT scopes, hardware-bound device trust, and anomaly detection across purchase, booking, and escrow releases.
                </p>
              </div>
            </div>
          }
        >
          <div className="grid gap-6 md:grid-cols-3">
            {assuranceRails.map((rail) => (
              <article key={rail.name} className="h-full rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary">{rail.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{rail.detail}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>
      </div>
    </div>
  );
}
