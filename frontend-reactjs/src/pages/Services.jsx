const categories = [
  {
    id: 1,
    name: 'Residential services',
    description: 'Emergency repairs, installations, and maintenance.',
    services: ['Plumbing rescue', 'Smart home install', 'Disaster cleanup']
  },
  {
    id: 2,
    name: 'Corporate deployments',
    description: 'Field teams, facility management, and office logistics.',
    services: ['IT dispatch', 'Office relocation', 'Concierge staffing']
  },
  {
    id: 3,
    name: 'Marketplace purchases',
    description: 'Shop for tools, equipment, and materials from verified vendors.',
    services: ['Tool rentals', 'Material supply', 'Shopfront bundles']
  }
];

export default function Services() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-glow">
        <h1 className="text-2xl font-semibold text-primary">Services & marketplace</h1>
        <p className="mt-2 text-sm text-slate-500">
          Purchase services with escrow protection or browse marketplace inventory to rent and buy equipment.
        </p>
      </section>
      {categories.map((category) => (
        <section key={category.id} className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-primary">{category.name}</h2>
              <p className="text-sm text-slate-500">{category.description}</p>
            </div>
            <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90">
              Browse
            </button>
          </div>
          <ul className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
            {category.services.map((service) => (
              <li key={service} className="rounded-full bg-primary/5 px-3 py-1">
                {service}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-primary">Service purchase flow</h2>
        <ol className="mt-4 space-y-3 text-sm text-slate-600">
          <li>1. Select a service or post a custom job to the live feed.</li>
          <li>2. Fund the escrow and agree on milestones.</li>
          <li>3. Track progress via service zones and real-time updates.</li>
          <li>4. Approve completion, release funds, or trigger dispute resolution.</li>
        </ol>
      </section>
    </div>
  );
}
