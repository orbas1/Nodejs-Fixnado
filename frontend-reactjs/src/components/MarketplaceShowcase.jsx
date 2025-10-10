const shops = [
  {
    id: 1,
    name: 'ProBuild Rentals',
    banner: 'https://images.unsplash.com/photo-1580894906472-6fe9b2212f83?auto=format&fit=crop&w=900&q=60',
    rating: 4.9,
    items: 128
  },
  {
    id: 2,
    name: 'GreenSpark Materials',
    banner: 'https://images.unsplash.com/photo-1523419409543-0c1df022bddb?auto=format&fit=crop&w=900&q=60',
    rating: 4.8,
    items: 96
  },
  {
    id: 3,
    name: 'FixRight Tools',
    banner: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=60',
    rating: 4.7,
    items: 74
  }
];

export default function MarketplaceShowcase() {
  return (
    <section id="marketplace" className="bg-white/70 border border-slate-200 rounded-3xl shadow-glow">
      <div className="px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">Marketplace shops</h2>
            <p className="text-sm text-slate-500">Rent or buy specialist tools and materials from verified vendors.</p>
          </div>
          <a href="/services#marketplace" className="text-sm font-semibold text-accent hover:text-primary">
            Explore marketplace
          </a>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {shops.map((shop) => (
            <article key={shop.id} className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="h-32 w-full bg-slate-200">
                <img src={shop.banner} alt={shop.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-primary">{shop.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Rating {shop.rating} · {shop.items} items</p>
                <button className="mt-4 inline-flex items-center text-sm font-semibold text-accent hover:text-primary">
                  Visit shop →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
