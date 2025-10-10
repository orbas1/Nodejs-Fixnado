const caseStudies = [
  {
    company: 'Northwind Energy',
    headline: 'Stabilised 120 remote assets in 36 hours.',
    narrative:
      'Unified their internal engineers with Fixnado-certified riggers to recover storm-damaged wind sites. Live telemetry synced tooling deliveries with helicopter dispatch windows.',
    metrics: [
      { label: 'Response time', value: '↓ 58%' },
      { label: 'Compliance variance', value: '↓ 0.3%' },
      { label: 'Uptime restored', value: '99.1%' }
    ]
  },
  {
    company: 'Globex Industries',
    headline: 'Built a nationwide install programme in 9 weeks.',
    narrative:
      'Launched a pop-up network of 420 technicians with escrow-backed procurement for materials and rentals. Escalations handled via dispute desk with automated settlements.',
    metrics: [
      { label: 'Technician pool', value: '420+' },
      { label: 'Deployment accuracy', value: '98.7%' },
      { label: 'Escrow releases', value: '100% on schedule' }
    ]
  }
];

export default function ClientSpotlight() {
  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-semibold text-primary">Outcome-driven partnerships that scale with your mandate.</h2>
          <p className="mt-4 text-base text-slate-600">
            From utilities to technology and retail, Fixnado embeds with operational leaders to drive measurable outcomes. Every engagement is supported by dedicated strategists, dispute analysts, and compliance partners.
          </p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {caseStudies.map((study) => (
            <article
              key={study.company}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_45px_70px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" aria-hidden="true" />
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span>{study.company}</span>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[0.6rem] text-accent">Enterprise</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-primary">{study.headline}</h3>
              <p className="mt-4 text-sm text-slate-600">{study.narrative}</p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                {study.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-center text-sm text-primary/80"
                  >
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</dt>
                    <dd className="mt-2 text-lg font-semibold text-primary">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
