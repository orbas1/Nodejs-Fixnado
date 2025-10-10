import LiveFeed from '../components/LiveFeed.jsx';

const marketplacePosts = [
  {
    id: 1,
    title: 'Industrial floor polisher - weekend rental',
    price: '$180/day',
    location: 'Austin, TX'
  },
  {
    id: 2,
    title: 'Scaffolding tower set',
    price: '$75/day',
    location: 'Los Angeles, CA'
  }
];

export default function Feed() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
      <LiveFeed />
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Marketplace live feed</h2>
            <p className="text-sm text-slate-500">Tools and materials recently added.</p>
          </div>
          <a href="/services#marketplace" className="text-sm font-semibold text-accent hover:text-primary">
            Go to marketplace
          </a>
        </div>
        <div className="mt-6 space-y-4">
          {marketplacePosts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{post.title}</h3>
                  <p className="text-sm text-slate-500">{post.location}</p>
                </div>
                <span className="text-sm font-semibold text-accent">{post.price}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
