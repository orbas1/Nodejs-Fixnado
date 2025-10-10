const stackLayers = [
  {
    title: 'Command & compliance layer',
    summary: 'Executive observability with SOC 2 aligned controls and automated policy enforcement.',
    capabilities: [
      'Role-based workstreams with approval ladders',
      'Immutable activity trails across jobs, disputes, and payouts',
      'Real-time compliance scorecards for every service zone'
    ]
  },
  {
    title: 'Service intelligence layer',
    summary: 'Predictive routing and workforce matching tuned for enterprise demand models.',
    capabilities: [
      'AI-ranked talent pools and certification tracking',
      'Capacity forecasting per region, skill, and shift window',
      'Incident response playbooks with escalation automation'
    ]
  },
  {
    title: 'Asset & procurement layer',
    summary: 'Connected logistics for rentals, materials, and financial assurance in a single ledger.',
    capabilities: [
      'Digitized vendor catalogs and negotiated rate governance',
      'Telemetry-backed asset tracking with live ETA feeds',
      'Dynamic escrow orchestration with dispute resolution tooling'
    ]
  }
];

const assurances = [
  'GDPR and SOC 2 aligned data residency controls',
  'Dedicated success pods for enterprise onboarding',
  '99.98% uptime backed by multi-region infrastructure'
];

export default function EnterpriseStack() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-[-8rem] h-[16rem] bg-gradient-to-b from-accent/15 via-accent/5 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-primary/90 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-100 shadow-glow">
              Enterprise stack
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-primary">
              A layered operating system for orchestrating custom workforces at scale.
            </h2>
            <p className="text-base text-slate-600">
              Fixnado unifies dispatch, procurement, compliance, and financial controls so chief operations officers have a single command surface. Each layer is modular and API accessible to integrate with your existing systems of record.
            </p>
            <ul className="space-y-3 text-sm text-primary/80">
              {assurances.map((assurance) => (
                <li key={assurance} className="flex items-start gap-3">
                  <span className="mt-[0.35rem] h-2.5 w-2.5 rounded-full bg-accent" />
                  <span>{assurance}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative isolate mt-6 w-full max-w-xl overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary via-primary/90 to-[#020817] p-1 shadow-[0_25px_60px_-25px_rgba(11,29,58,0.55)]">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(31,78,216,0.35),transparent_55%)]" aria-hidden="true" />
            <div className="rounded-[1.4rem] bg-slate-950/80 p-6 text-slate-100 backdrop-blur">
              <div className="grid gap-6">
                {stackLayers.map((layer) => (
                  <div key={layer.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.8)]">
                    <h3 className="text-lg font-semibold text-white">{layer.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{layer.summary}</p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-200/90">
                      {layer.capabilities.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
