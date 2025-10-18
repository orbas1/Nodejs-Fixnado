import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUturnLeftIcon, ArrowsRightLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import LiveFeed from '../components/LiveFeed.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { fetchMarketplaceFeed } from '../api/feedClient.js';
import { setCurrentRole, useCurrentRole } from '../hooks/useCurrentRole.js';
import { useSession } from '../hooks/useSession.js';
import { useMarketplaceInventory } from '../hooks/useMarketplaceInventory.js';

const FEED_TABS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'custom', label: 'Jobs' },
  { id: 'marketplace', label: 'Market' }
];

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

function MarketplaceItem({ item, saved, onSave, onRemove, onPurchase, onPreview }) {
  const savedItem = saved.find((entry) => entry.id === item.id);

  return (
    <article className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {item.category ?? 'Listing'}
        </span>
      </header>
      <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Location</dt>
          <dd>{item.location ?? 'On request'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Access</dt>
          <dd>{item.insuredOnly ? 'Insured' : 'Open'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rate</dt>
          <dd>{item.pricePerDay || item.purchasePrice || 'Contact'}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => (savedItem ? onRemove(item.id) : onSave(item))}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            savedItem
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'border border-sky-300 bg-white text-sky-700 hover:bg-sky-100'
          }`}
        >
          {savedItem ? 'Remove' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => onPurchase(item)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          Purchase
        </button>
        {typeof onPreview === 'function' ? (
          <button
            type="button"
            onClick={() => onPreview({ type: 'marketplace', item })}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
          >
            Open
          </button>
        ) : null}
      </div>
    </article>
  );
}

MarketplaceItem.propTypes = {
  item: PropTypes.object.isRequired,
  saved: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSave: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onPurchase: PropTypes.func.isRequired,
  onPreview: PropTypes.func
};

MarketplaceItem.defaultProps = {
  onPreview: undefined
};

function MarketplaceSection({ marketplaceState, saved, purchases, onSave, onRemove, onPurchase, onRefresh, onPreview }) {
  const { loading, error, items } = marketplaceState;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Market
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            <ArrowsRightLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>
        <a
          href="/services#marketplace"
          className="rounded-full border border-sky-300 bg-white px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
        >
          Open Market
        </a>
      </header>

      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-semibold text-rose-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-6 text-sm font-semibold text-slate-600">No listings.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <MarketplaceItem
                key={item.id}
                item={item}
                saved={saved}
                onSave={onSave}
                onRemove={onRemove}
                onPurchase={onPurchase}
                onPreview={onPreview}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-primary">Saved</h4>
          {saved.length === 0 ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Empty</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {saved.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-800">{entry.title}</span>
                  <div className="flex items-center gap-2">
                    {typeof onPreview === 'function' ? (
                      <button
                        type="button"
                        onClick={() => onPreview({ type: 'marketplace', item: entry })}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:border-primary hover:text-primary"
                      >
                        Open
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onRemove(entry.id)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:border-rose-200 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-primary">Purchases</h4>
          {purchases.length === 0 ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pending</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {purchases.map((purchase) => (
                  <li key={`${purchase.id}-${purchase.purchasedAt}`} className="rounded-xl border border-slate-200 bg-white/90 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">{purchase.title}</p>
                        <p className="text-xs text-slate-500">
                          {purchase.purchasePrice || purchase.pricePerDay || 'Custom'} · Qty {purchase.quantity ?? 1}
                        </p>
                      </div>
                      {typeof onPreview === 'function' ? (
                        <button
                          type="button"
                          onClick={() => onPreview({ type: 'marketplace', item: purchase })}
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:border-primary hover:text-primary"
                        >
                          Open
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

MarketplaceSection.propTypes = {
  marketplaceState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object)
  }).isRequired,
  saved: PropTypes.arrayOf(PropTypes.object).isRequired,
  purchases: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSave: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onPurchase: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onPreview: PropTypes.func
};

MarketplaceSection.defaultProps = {
  onPreview: undefined
};

function SummaryPanel({ saved, purchases }) {
  const summary = useMemo(
    () => [
      { label: 'Saved', value: saved.length },
      { label: 'Purchased', value: purchases.length },
      { label: 'Latest', value: purchases[0]?.title ?? 'None' }
    ],
    [saved.length, purchases]
  );

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Totals</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/dashboards"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Dashboards
        </Link>
        <Link
          to="/provider/custom-jobs"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Custom Jobs
        </Link>
      </div>
    </section>
  );
}

SummaryPanel.propTypes = {
  saved: PropTypes.arrayOf(PropTypes.object).isRequired,
  purchases: PropTypes.arrayOf(PropTypes.object).isRequired
};

function displayBudget(item) {
  if (typeof item?.budget === 'string' && item.budget.trim()) {
    return item.budget.trim();
  }

  const amount = Number.parseFloat(item?.budgetAmount);
  if (Number.isFinite(amount)) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: typeof item?.budgetCurrency === 'string' ? item.budgetCurrency.toUpperCase() : 'USD',
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  return 'Budget TBD';
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

function FeedDetailDialog({ detail, onClose }) {
  if (!detail) {
    return null;
  }

  const { type, item } = detail;
  const chips = [];

  if (type === 'custom') {
    if (item.zone?.name) chips.push(item.zone.name);
    if (item.category) chips.push(item.category);
    if (item.allowOutOfZone) chips.push('Out-of-zone ok');
  }

  if (type === 'marketplace' && Array.isArray(item.tags)) {
    chips.push(...item.tags);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 py-8" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{type}</p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">
              {type === 'timeline' ? item.headline || item.title || 'Update' : item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 hover:border-primary hover:text-primary"
          >
            Close
          </button>
        </header>
        <div className="mt-6 space-y-5">
          {type === 'timeline' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {item.author?.avatar ? (
                    <img src={item.author.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{item.author?.name ?? 'Fixnado member'}</p>
                  <p className="text-xs text-slate-500">{[item.author?.role, item.author?.company].filter(Boolean).join(' • ')}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
              {item.content ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.content}</p>
              ) : null}
              {Array.isArray(item.media) && item.media.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.media.map((media) => (
                    <a
                      key={media}
                      href={media}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <img src={media} alt="Timeline media" className="h-48 w-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : null}
              {Array.isArray(item.comments) && item.comments.length > 0 ? (
                <div className="space-y-3">
                  {item.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-600">{comment.author?.name ?? 'Team member'}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</p>
                      <p className="mt-2 text-sm text-slate-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {type === 'custom' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{displayBudget(item)}</span>
                {item.location ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.location}</span>
                ) : null}
                {chips.map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500">
                    {chip}
                  </span>
                ))}
              </div>
              {item.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.description}</p>
              ) : null}
              {Array.isArray(item.images) && item.images.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {item.images.map((image) => (
                    <a
                      key={image}
                      href={image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-28 w-28 overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <img src={image} alt="Job reference" className="h-full w-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : null}
              {item.bidDeadline ? (
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Bids close {formatDateTime(item.bidDeadline)}</p>
              ) : null}
            </div>
          ) : null}

          {type === 'marketplace' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">{item.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.price}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{item.rating}★</span>
                {chips.map((chip) => (
                  <span key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500">
                    {chip}
                  </span>
                ))}
              </div>
              {item.image ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <img src={item.image} alt="Marketplace" className="h-64 w-full object-cover" loading="lazy" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

FeedDetailDialog.propTypes = {
  detail: PropTypes.shape({
    type: PropTypes.oneOf(['timeline', 'custom', 'marketplace']).isRequired,
    item: PropTypes.object.isRequired
  }),
  onClose: PropTypes.func.isRequired
};

FeedDetailDialog.defaultProps = {
  detail: null
};

function UserPersonaCard() {
  const { isAuthenticated, role, userId } = useSession();
  const personaRole = useCurrentRole({ fallback: role || 'guest' });

  const personaLabel = useMemo(() => {
    switch (personaRole) {
      case 'company':
        return 'Company';
      case 'provider':
        return 'Provider';
      case 'servicemen':
        return 'Crew';
      case 'admin':
        return 'Admin';
      case 'user':
        return 'Client';
      default:
        return 'Guest';
    }
  }, [personaRole]);

  const displayName = useMemo(() => {
    if (typeof userId === 'string' && userId.trim().length > 0) {
      return userId.replace(/[-_]+/g, ' ');
    }
    return 'Fixnado Member';
  }, [userId]);

  return (
    <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6 shadow-glow">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserCircleIcon className="h-9 w-9" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Profile</p>
          <h1 className="text-xl font-semibold text-primary">{displayName}</h1>
        </div>
      </header>
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-primary/20 bg-white/95 p-4 shadow-inner">
          <dl className="grid gap-2 text-sm text-slate-600">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Role</dt>
              <dd>{role ?? 'Guest'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">View</dt>
              <dd>{personaLabel}</dd>
            </div>
          </dl>
        </div>
        {personaRole !== 'user' ? (
          <button
            type="button"
            onClick={() => setCurrentRole('user')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
            User View
          </button>
        ) : (
          <Link
            to="/provider/custom-jobs"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
          >
            Provider Tools
          </Link>
        )}
        {!isAuthenticated ? (
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Sign In
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchView = searchParams.get('view');
  const tabFromQuery = useMemo(
    () => (FEED_TABS.some((tab) => tab.id === searchView) ? searchView : FEED_TABS[0].id),
    [searchView]
  );
  const [activeTab, setActiveTab] = useState(tabFromQuery);
  const [marketplaceState, setMarketplaceState] = useState({ loading: true, items: [], error: null });
  const { saved, purchases, saveListing, removeSavedListing, recordPurchase } = useMarketplaceInventory();
  const [detail, setDetail] = useState(null);

  const openDetail = useCallback((payload) => {
    if (!payload) return;
    setDetail(payload);
  }, []);

  const closeDetail = useCallback(() => setDetail(null), []);

  const refreshMarketplace = () => {
    setMarketplaceState((current) => ({ ...current, loading: true, error: null }));
    fetchMarketplaceFeed({ limit: 8 })
      .then((items) => {
        setMarketplaceState({ loading: false, items: Array.isArray(items) ? items : [], error: null });
      })
      .catch((error) => {
        setMarketplaceState({
          loading: false,
          items: [],
          error: error.message || 'Unable to load marketplace activity'
        });
      });
  };

  useEffect(() => {
    refreshMarketplace();
  }, []);

  useEffect(() => {
    if (tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery, activeTab]);

  useEffect(() => {
    if (!detail) {
      return undefined;
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        closeDetail();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeDetail, detail]);

  const handleTabChange = useCallback(
    (next) => {
      const safeTab = FEED_TABS.some((tab) => tab.id === next) ? next : FEED_TABS[0].id;
      setActiveTab(safeTab);
      if (safeTab === FEED_TABS[0].id) {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ view: safeTab }, { replace: true });
      }
    },
    [setSearchParams]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-10 sm:px-10">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Home / Feed
            </nav>
            <h1 className="mt-3 text-3xl font-semibold text-primary">Feed</h1>
          </div>
          <div className="flex gap-2">
            {FEED_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <UserPersonaCard />
            <SummaryPanel saved={saved} purchases={purchases} />
          </aside>
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              {activeTab === 'marketplace' ? (
                <MarketplaceSection
                  marketplaceState={marketplaceState}
                  saved={saved}
                  purchases={purchases}
                  onSave={saveListing}
                  onRemove={removeSavedListing}
                  onPurchase={recordPurchase}
                  onRefresh={refreshMarketplace}
                  onPreview={openDetail}
                />
              ) : (
                <LiveFeed
                  activeView={activeTab}
                  onViewChange={handleTabChange}
                  hideNavigation
                  layout="compact"
                  onSelectItem={openDetail}
                />
              )}
            </div>
          </section>
        </div>
      </div>
      <FeedDetailDialog detail={detail} onClose={closeDetail} />
    </div>
  );
}
