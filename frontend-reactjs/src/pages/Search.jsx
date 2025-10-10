const results = [
  {
    id: 1,
    type: 'Service professional',
    title: 'Emergency HVAC Technician',
    description: '24/7 availability · Escrow trusted · 5 minute response time',
    location: 'Chicago, IL'
  },
  {
    id: 2,
    type: 'Marketplace item',
    title: 'Commercial-grade dehumidifier',
    description: 'Available for weekend rental, includes delivery and pickup',
    location: 'Miami, FL'
  }
];

export default function Search() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-glow">
        <h1 className="text-2xl font-semibold text-primary">Explorer search</h1>
        <p className="mt-2 text-sm text-slate-500">
          Filter the Fixnado network by skills, availability, price, and service zones.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <input type="search" placeholder="Search keywords" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none" />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none">
            <option value="all">All categories</option>
            <option value="services">Services</option>
            <option value="marketplace">Marketplace</option>
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none">
            <option value="all">All service zones</option>
            <option value="nearby">Near me</option>
            <option value="priority">Priority zones</option>
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none">
            <option value="any">Any availability</option>
            <option value="now">Available now</option>
            <option value="weekend">Weekend only</option>
          </select>
        </form>
      </div>
      <div className="space-y-4">
        {results.map((result) => (
          <article key={result.id} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">{result.type}</span>
                <h2 className="mt-1 text-xl font-semibold text-primary">{result.title}</h2>
                <p className="text-sm text-slate-500">{result.description}</p>
              </div>
              <div className="text-right text-sm text-slate-500">{result.location}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
