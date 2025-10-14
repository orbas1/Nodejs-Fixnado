import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUturnLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import LiveFeed from '../components/LiveFeed.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { fetchMarketplaceFeed } from '../api/feedClient.js';
import { setCurrentRole, useCurrentRole } from '../hooks/useCurrentRole.js';
import { useSession } from '../hooks/useSession.js';

const ROLE_STATUS_LABELS = {
  admin: 'Admin',
  company: 'Enterprise',
  enterprise: 'Enterprise',
  guest: 'Guest',
  provider: 'Provider',
  serviceman: 'Serviceman',
  servicemen: 'Serviceman',
  user: 'User'
};

const ROLE_PREVIEW_DESCRIPTIONS = {
  admin: 'Full command of compliance, analytics, and workforce orchestration.',
  company: 'Coordinate enterprise dispatch, capital assets, and cross-site coverage.',
  enterprise: 'Coordinate enterprise dispatch, capital assets, and cross-site coverage.',
  provider: 'Manage crews, accept assignments, and review billing cadence.',
  serviceman: 'Confirm shifts, log work, and review dispatch readiness.',
  servicemen: 'Confirm shifts, log work, and review dispatch readiness.',
  user: 'Post jobs, review bids, and manage upcoming work orders.',
  guest: 'Browse public listings and explore capabilities before registering.'
};

const formatUserName = (userId, role) => {
  if (typeof userId === 'string' && userId.trim().length > 0) {
    const cleaned = userId.replace(/[-_]+/g, ' ').trim();
    return cleaned.length > 0 ? cleaned.replace(/\b\w/g, (match) => match.toUpperCase()) : 'Fixnado member';
  }
  if (role && role !== 'guest') {
    return `${ROLE_STATUS_LABELS[role] ?? 'Member'} account`;
  }
  return 'Fixnado member';
};

function UserPersonaCard() {
  const { isAuthenticated, role, userId } = useSession();
  const personaRole = useCurrentRole({ fallback: role || 'guest' });

  const statusLabel = ROLE_STATUS_LABELS[role] ?? ROLE_STATUS_LABELS.guest;
  const personaLabel = ROLE_STATUS_LABELS[personaRole] ?? ROLE_STATUS_LABELS.guest;
  const description = ROLE_PREVIEW_DESCRIPTIONS[personaRole] ?? ROLE_PREVIEW_DESCRIPTIONS.guest;

  const onboardingHint = useMemo(() => {
    if (!isAuthenticated) {
      return 'Log in to unlock real-time dispatch, analytics, and crew coordination.';
    }
    if (personaRole === 'user') {
      return 'Need provider or enterprise access? Submit an upgrade request after registering your organisation.';
    }
    return 'Previewing elevated access. Switch back to the customer view at any time.';
  }, [isAuthenticated, personaRole]);

  return (
    <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6 shadow-glow">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserCircleIcon className="h-9 w-9" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Welcome back</p>
          <h1 className="text-xl font-semibold text-primary">{formatUserName(userId, role)}</h1>
        </div>
      </header>
      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-white/95 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Platform status</p>
          <p className="mt-2 text-lg font-semibold text-primary">{statusLabel}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Previewing feed as</p>
          <p className="mt-1 text-sm text-slate-500">{personaLabel}</p>
          <p className="mt-3 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-600">
          {onboardingHint}
        </div>
        {personaRole !== 'user' ? (
          <button
            type="button"
            onClick={() => setCurrentRole('user')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:from-primary/90 hover:to-sky-500/90"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
            Switch back to user view
          </button>
        ) : (
          <Link
            to="/register?upgrade=provider"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100"
          >
            Register to unlock provider tools
          </Link>
        )}
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
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-4">
          <UserPersonaCard />
        </aside>
        <div className="space-y-10 lg:col-span-8">
          <LiveFeed />
          <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-blue-50/90 to-sky-50/90 p-6 shadow-glow">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-primary">Marketplace live feed</h2>
                <p className="text-sm text-slate-500">
                  Newly listed rentals and capital equipment from insured partners.
                </p>
              </div>
              <a
                href="/services#marketplace"
                className="text-sm font-semibold text-sky-700 hover:text-primary"
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
                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-6 text-sm text-slate-600">
                  No marketplace listings found. Check back shortly as verified sellers publish new inventory.
                </div>
              ) : (
                marketplaceState.items.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm">
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
                          <p className="text-sm font-semibold text-primary">{item.pricePerDay} / day</p>
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
      </div>
    </div>
  );
}
