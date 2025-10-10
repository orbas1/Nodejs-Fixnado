const categories = [
  'Home maintenance',
  'Events & catering',
  'Technology & IT',
  'Logistics & delivery',
  'Creative & branding',
  'Corporate support'
];

export default function Explorer() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-glow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-primary">Explore opportunities</h2>
              <p className="text-sm text-slate-500">
                Search by skills, availability, and marketplace inventory across the Fixnado network.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="search"
                placeholder="Search for jobs, services, tools..."
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <button className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                Search
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
