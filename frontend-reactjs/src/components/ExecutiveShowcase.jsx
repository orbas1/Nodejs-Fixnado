const pillars = [
  {
    title: 'Command & clarity',
    description:
      'Deployable playbooks align dispatch, procurement, and compliance around a single view of operations. Create executive dashboards in minutes with auditable data pipelines.',
    metrics: ['Real-time zone telemetry', 'Enterprise SSO & RBAC', 'Automated compliance gates']
  },
  {
    title: 'Engage the right talent',
    description:
      'Blend internal teams with Fixnado-certified specialists. Skills, certifications, and readiness data are continuously verified and surfaced where your managers work.',
    metrics: ['18k+ cleared professionals', 'Global availability graph', 'AI-backed suitability scoring']
  },
  {
    title: 'Assure every outcome',
    description:
      'Escrow, dispute resolution, and milestone tracking are native to every engagement. Finance, legal, and operations teams gain the controls they expect from enterprise platforms.',
    metrics: ['Milestone-based escrow', 'Evidence-rich dispute workflows', 'Finance system integrations']
  }
];

const executiveNotes = [
  { label: 'Time to deploy', value: 'Launch in under 30 days' },
  { label: 'Data residency', value: 'Regional hosting with audit trails' },
  { label: 'Integrations', value: 'Workday, ServiceNow, NetSuite & more' }
];

export default function ExecutiveShowcase() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-accent/10" aria-hidden="true" />
      <div className="absolute top-10 -left-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 space-y-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-accent/20 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Executive control layer
          </span>
          <h2 className="mt-6 text-4xl font-semibold text-primary">
            An orchestration suite engineered for enterprise operations leaders.
          </h2>
          <p className="mt-4 text-base text-slate-600">
            From global dispatch to post-engagement compliance, Fixnado provides a command center that feels built in-house. Governance requirements are mapped to every task, asset, and conversation.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="group relative rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-primary/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-primary/20"
              >
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-primary">{pillar.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{pillar.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-500">
                  {pillar.metrics.map((metric) => (
                    <li key={metric} className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/95 via-primary to-accent/80 p-8 text-white shadow-xl">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Enterprise assurance</p>
              <h3 className="text-3xl font-semibold leading-tight">
                Every workflow is logged, measurable, and compliance-ready by default.
              </h3>
              <p className="text-sm text-white/80">
                Security teams gain visibility with SOC 2-aligned controls, granular data segregation, and automated evidence packages for audits.
              </p>
            </div>
            <div className="mt-10 space-y-4">
              {executiveNotes.map((note) => (
                <div key={note.label} className="flex flex-col rounded-2xl border border-white/20 bg-white/10 p-4">
                  <span className="text-xs uppercase tracking-wide text-white/60">{note.label}</span>
                  <span className="text-base font-semibold">{note.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
