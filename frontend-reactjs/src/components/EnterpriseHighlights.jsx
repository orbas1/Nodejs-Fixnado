const highlights = [
  {
    title: 'Governance-ready architecture',
    description:
      'Single sign-on, granular roles, and audit trails across service requests, disputes, and payouts keep compliance teams happy.'
  },
  {
    title: 'Global workforce intelligence',
    description:
      'Blend internal crews with Fixnado pros. Eligibility, certifications, and capacity data sync live from our talent graph.'
  },
  {
    title: 'Integrated asset logistics',
    description:
      'Reserve tools, vehicles, and materials inside the same workflow. Real-time telemetry keeps dispatchers ahead of demand.'
  }
];

export default function EnterpriseHighlights() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 max-w-3xl">
          <h2 className="text-3xl font-semibold text-primary">Enterprise control without the friction.</h2>
          <p className="mt-4 text-base text-slate-600">
            Fixnado aligns cross-functional teams with a unified control center. From procurement to compliance, every workflow
            is traceable, automated, and measurable.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="h-full rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-xl font-semibold">
                •
              </div>
              <h3 className="mt-6 text-lg font-semibold text-primary">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
