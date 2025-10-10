const phases = [
  {
    title: '01. Strategic intake',
    description:
      'Scope requirements, compliance mandates, and service zones through guided workflows. Auto-generated runbooks align every stakeholder before launch.'
  },
  {
    title: '02. Intelligent orchestration',
    description:
      'Dispatch blended teams, allocate rentals, and synchronize suppliers through automation. Telemetry and SLAs surface in a unified command dashboard.'
  },
  {
    title: '03. Assurance & insights',
    description:
      'Escrow, disputes, and acceptance milestones feed into executive reporting. Export evidence packages or push directly into your finance and ERP stack.'
  }
];

const accelerators = [
  {
    title: 'Ops automation library',
    detail: 'Templates for facilities, technology rollouts, events, and emergency response reduce activation time across verticals.'
  },
  {
    title: 'Data & analytics',
    detail: 'Live KPI walls, predictive demand modeling, and zone health scores keep leadership ahead of risk.'
  },
  {
    title: 'Dedicated success pods',
    detail: 'Industry specialists co-create governance frameworks, integration plans, and change management playbooks.'
  }
];

export default function OperationalBlueprint() {
  return (
    <section className="px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.75rem] border border-slate-200 bg-white shadow-glow">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent/80 to-blue-700 opacity-90" aria-hidden="true" />
            <div className="relative flex h-full flex-col justify-between gap-10 p-10">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Delivery blueprint</p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight">
                  Operate at enterprise scale with a proven orchestration lifecycle.
                </h2>
                <p className="mt-4 text-sm text-white/80">
                  Align leadership, operations, finance, and compliance teams with a structured journey. Each phase includes ready-to-deploy automation, reporting, and guardrails.
                </p>
              </div>
              <div className="grid gap-4">
                {accelerators.map((accelerator) => (
                  <div key={accelerator.title} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/60">{accelerator.title}</p>
                    <p className="mt-2 text-sm text-white/90">{accelerator.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative p-10">
            <div className="absolute left-10 top-16 bottom-16 w-px bg-gradient-to-b from-primary/20 via-slate-200 to-transparent" aria-hidden="true" />
            <div className="space-y-10">
              {phases.map((phase, index) => (
                <div key={phase.title} className="relative pl-14">
                  <span className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/40">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold text-primary">{phase.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{phase.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
              <p className="font-semibold text-primary">Enterprise delivery playbook</p>
              <p className="mt-2">
                Schedule a white-glove blueprint session to align Fixnado with your existing tech stack, field operations, and vendor ecosystem. Custom integrations and SLAs are scoped with our solution architects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
