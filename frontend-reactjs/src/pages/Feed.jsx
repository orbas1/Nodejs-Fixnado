import { useEffect, useState } from 'react';
import LiveFeed from '../components/LiveFeed.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { fetchMarketplaceFeed } from '../api/feedClient.js';
import { ROLE_OPTIONS, setCurrentRole, useCurrentRole } from '../hooks/useCurrentRole.js';

function RoleSelector() {
  const role = useCurrentRole();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-glow">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Persona access control</h2>
          <p className="text-sm text-slate-500">
            Switch between personas to verify live feed entitlements and feature visibility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="feed-role-selector"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
          >
            Viewing as
          </label>
          <select
            id="feed-role-selector"
            value={role}
            onChange={(event) => setCurrentRole(event.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-accent focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export default function Feed() {
  const [marketplaceState, setMarketplaceState] = useState({ loading: true, items: [], error: null });

  useEffect(() => {
    let cancelled = false;
    setMarketplaceState((current) => ({ ...current, loading: true, error: null }));

    fetchMarketplaceFeed({ limit: 8 })
      .then((items) => {
        if (!cancelled) {
          setMarketplaceState({ loading: false, items: Array.isArray(items) ? items : [], error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMarketplaceState({
            loading: false,
            items: [],
            error: error.message || 'Unable to load marketplace activity'
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
      <RoleSelector />
      <LiveFeed />
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-glow">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">Marketplace live feed</h2>
            <p className="text-sm text-slate-500">
              Newly listed rentals and capital equipment from insured partners.
            </p>
          </div>
          <a
            href="/services#marketplace"
            className="text-sm font-semibold text-accent hover:text-primary"
          >
            Go to marketplace
          </a>
        </div>
        <div className="mt-6 space-y-4">
          {marketplaceState.loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : marketplaceState.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600">
              {marketplaceState.error}
            </div>
          ) : marketplaceState.items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
              No marketplace listings found. Check back shortly as verified sellers publish new inventory.
            </div>
          ) : (
            marketplaceState.items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.location ?? 'Location on request'}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.availability ?? 'Availability confirmed'} ·
                      {item.insuredOnly ? ' Insured partners only' : ' Open to all providers'}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.pricePerDay ? (
                      <p className="text-sm font-semibold text-accent">{item.pricePerDay} / day</p>
                    ) : null}
                    {item.purchasePrice ? (
                      <p className="text-xs text-slate-500">Buy outright {item.purchasePrice}</p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
