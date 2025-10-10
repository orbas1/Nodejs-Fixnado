const feed = [
  {
    id: 1,
    title: 'Emergency plumbing fix required in downtown loft',
    budget: '$180',
    location: 'San Francisco, CA',
    timeAgo: '5 minutes ago'
  },
  {
    id: 2,
    title: 'Assemble commercial shelving for new pop-up store',
    budget: '$420',
    location: 'New York, NY',
    timeAgo: '12 minutes ago'
  },
  {
    id: 3,
    title: 'Mobile app QA support for fintech launch',
    budget: '$65/hr',
    location: 'Remote',
    timeAgo: '23 minutes ago'
  }
];

export default function LiveFeed({ condensed = false }) {
  return (
    <section className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-glow">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Live Feed</h2>
            <p className="text-sm text-slate-500">Fresh job requests from buyers and businesses.</p>
          </div>
          {!condensed && (
            <a href="/feed" className="text-sm font-semibold text-accent hover:text-primary">
              View all
            </a>
          )}
        </div>
        <div className="mt-6 space-y-4">
          {feed.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">{item.budget}</p>
                  <p className="text-xs text-slate-400">{item.timeAgo}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
