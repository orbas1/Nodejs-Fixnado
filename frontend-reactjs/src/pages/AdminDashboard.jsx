const metrics = [
  { id: 1, label: 'Active escrows', value: '324', trend: '+8.4%' },
  { id: 2, label: 'Open disputes', value: '12', trend: '-2.1%' },
  { id: 3, label: 'Live tasks', value: '1,204', trend: '+3.7%' }
];

const audits = [
  { id: 1, title: 'Provider verification pending', time: '2 minutes ago', status: 'Action required' },
  { id: 2, title: 'Dispute case #5843 resolved', time: '12 minutes ago', status: 'Resolved' },
  { id: 3, title: 'Marketplace listing flagged', time: '1 hour ago', status: 'Investigation' }
];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      <section className="rounded-3xl border border-primary/20 bg-white/90 p-8 shadow-2xl shadow-primary/20">
        <h1 className="text-2xl font-semibold text-primary">Admin control center</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor escrow accounts, disputes, providers, and marketplace health.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-inner">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="text-3xl font-bold text-primary">{metric.value}</p>
              <p className="text-xs text-success font-semibold">{metric.trend} vs last week</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-primary/20 bg-white/90 p-8 shadow-2xl shadow-primary/20">
        <h2 className="text-xl font-semibold text-primary">Recent operations</h2>
        <div className="mt-4 space-y-4">
          {audits.map((audit) => (
            <div key={audit.id} className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{audit.title}</h3>
                  <p className="text-sm text-slate-500">{audit.time}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{audit.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
