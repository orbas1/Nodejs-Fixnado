const badges = ['Top rated', 'Escrow trusted', 'Rapid responder'];
const services = [
  { id: 1, name: 'Smart home setup', price: '$120/hr', completed: 84 },
  { id: 2, name: 'Electrical diagnostics', price: '$95/hr', completed: 156 }
];

export default function Profile() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-glow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-3xl bg-accent/20 flex items-center justify-center text-3xl">⚡️</div>
            <div>
              <h1 className="text-2xl font-semibold text-primary">Jordan Miles</h1>
              <p className="text-sm text-slate-500">Master electrician · San Diego, CA</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-4 text-center">
            <p className="text-sm text-slate-500">Overall rating</p>
            <p className="text-3xl font-bold text-primary">4.95</p>
            <p className="text-xs text-slate-400">321 reviews</p>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-glow">
        <h2 className="text-xl font-semibold text-primary">Offered services</h2>
        <div className="mt-6 space-y-4">
          {services.map((service) => (
            <div key={service.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">{service.name}</h3>
                <p className="text-sm text-slate-500">Completed {service.completed} jobs</p>
              </div>
              <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90">
                Purchase for {service.price}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-glow">
        <h2 className="text-xl font-semibold text-primary">Portfolio & shop</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <h3 className="text-lg font-semibold text-primary">Service zone coverage</h3>
            <p className="mt-2 text-sm text-slate-600">
              Downtown San Diego, La Jolla, Pacific Beach, Chula Vista. Live tracking enabled for urgent dispatch.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <h3 className="text-lg font-semibold text-primary">Marketplace storefront</h3>
            <p className="mt-2 text-sm text-slate-600">
              Offering specialty breaker kits, IoT sensors, and rental thermal cameras with insured delivery.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
