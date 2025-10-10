const stats = [
  { id: 1, label: 'Verified professionals', value: '18k+' },
  { id: 2, label: 'Jobs completed this month', value: '42k' },
  { id: 3, label: 'Average rating', value: '4.9/5' },
  { id: 4, label: 'Escrow protected payments', value: '$12.7m' }
];

export default function Stats() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/70 p-6 md:grid-cols-4 text-center shadow-glow">
          {stats.map((stat) => (
            <div key={stat.id} className="space-y-2">
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
