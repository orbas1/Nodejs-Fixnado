const zones = [
  { id: 1, name: 'Downtown Core', coverage: '5 mile radius', demand: 'High' },
  { id: 2, name: 'Tech Corridor', coverage: '12 mile radius', demand: 'Medium' },
  { id: 3, name: 'Coastal Communities', coverage: '25 mile radius', demand: 'Rising' }
];

export default function ServiceZones() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6 grid gap-8 md:grid-cols-[1.4fr_1fr] items-start">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-glow">
          <h2 className="text-xl font-semibold text-primary">Service zones with live location tracking</h2>
          <p className="mt-2 text-sm text-slate-500">
            Draw custom service regions, pin preferred job areas, and route teams with Google Maps powered dispatch.
          </p>
          <div className="mt-6 h-72 w-full overflow-hidden rounded-2xl border border-slate-100">
            <iframe
              title="Fixnado service map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.95373531590402!3d-37.816279742021144!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d8a30b1a81b4!2sVictoria!5e0!3m2!1sen!2sau!4v1614227681234!5m2!1sen!2sau"
              className="h-full w-full"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>
        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">{zone.name}</h3>
              <p className="text-sm text-slate-500">Coverage: {zone.coverage}</p>
              <p className="text-xs text-success font-semibold uppercase tracking-wide">Demand: {zone.demand}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
