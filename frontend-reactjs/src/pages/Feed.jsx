import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  ArrowUturnLeftIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import LiveFeed from '../components/LiveFeed.jsx';
import { setCurrentRole, useCurrentRole } from '../hooks/useCurrentRole.js';
import { useSession } from '../hooks/useSession.js';
import { fetchFeedSuggestions } from '../api/feedClient.js';
import Spinner from '../components/ui/Spinner.jsx';

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

const SUGGESTION_LIMIT = 3;

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

function SuggestionSection({ title, actionHref, actionLabel, loading, error, emptyLabel, items, renderItem }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-glow">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <a
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary transition hover:border-primary hover:bg-primary hover:text-white"
        >
          {actionLabel}
          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
        </a>
      </header>
      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-semibold text-rose-600">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            {emptyLabel}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 shadow-sm transition hover:border-primary hover:bg-primary/5"
              >
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

SuggestionSection.propTypes = {
  title: PropTypes.string.isRequired,
  actionHref: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyLabel: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  renderItem: PropTypes.func.isRequired
};

SuggestionSection.defaultProps = {
  loading: false,
  error: null
};

function UserPersonaCard() {
  const { isAuthenticated, role, userId } = useSession();
  const personaRole = useCurrentRole({ fallback: role || 'guest' });

  const statusLabel = ROLE_STATUS_LABELS[role] ?? ROLE_STATUS_LABELS.guest;
  const personaLabel = ROLE_STATUS_LABELS[personaRole] ?? ROLE_STATUS_LABELS.guest;
  const accessLabel = useMemo(() => {
    if (!isAuthenticated) {
      return 'Sign in';
    }
    if (personaRole === 'user') {
      return 'Client';
    }
    return 'Preview';
  }, [isAuthenticated, personaRole]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-glow">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserCircleIcon className="h-9 w-9" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">You</p>
          <h1 className="text-xl font-semibold text-primary">{formatUserName(userId, role)}</h1>
        </div>
      </header>
      <div className="mt-5 space-y-4 text-sm text-slate-600">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
            <p className="mt-1 font-semibold text-primary">{statusLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">View</p>
            <p className="mt-1 font-semibold text-primary">{personaLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Access</p>
            <p className="mt-1 font-semibold text-primary">{accessLabel}</p>
          </div>
        </div>
        {personaRole !== 'user' ? (
          <button
            type="button"
            onClick={() => setCurrentRole('user')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
            Client view
          </button>
        ) : (
          <a
            href="/register?upgrade=provider"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-100"
          >
            Provider access
          </a>
        )}
      </div>
    </section>
  );
}

export default function Feed() {
  const { isAuthenticated } = useSession();
  const [suggestions, setSuggestions] = useState({
    loading: true,
    error: null,
    services: [],
    providers: [],
    stores: []
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setSuggestions({ loading: false, error: null, services: [], providers: [], stores: [] });
      return () => {};
    }

    const controller = new AbortController();
    setSuggestions((current) => ({ ...current, loading: true, error: null }));

    fetchFeedSuggestions({ limit: SUGGESTION_LIMIT }, { signal: controller.signal })
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }

        setSuggestions({
          loading: false,
          error: null,
          services: payload.services,
          providers: payload.providers,
          stores: payload.stores
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Unable to load suggestions';
        setSuggestions({ loading: false, error: message, services: [], providers: [], stores: [] });
      });

    return () => controller.abort();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row">
        <section className="flex-1 space-y-6">
          <LiveFeed />
        </section>
        <aside className="w-full max-w-xs space-y-6 lg:sticky lg:top-10 lg:self-start">
          <UserPersonaCard />
          <SuggestionSection
            title="Services"
            actionHref="/services"
            actionLabel="Browse"
            loading={suggestions.loading}
            error={suggestions.error}
            emptyLabel="No entries"
            items={suggestions.services}
            renderItem={(service) => (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{service.title}</p>
                  <p className="truncate text-xs text-slate-500">{service.company}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {service.priceLabel ? (
                    <p className="text-xs font-semibold text-slate-600">{service.priceLabel}</p>
                  ) : null}
                  <a
                    href={service.href}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary transition group-hover:border-primary group-hover:bg-primary group-hover:text-white"
                  >
                    View
                  </a>
                </div>
              </>
            )}
          />
          <SuggestionSection
            title="Providers"
            actionHref="/providers"
            actionLabel="Network"
            loading={suggestions.loading}
            error={suggestions.error}
            emptyLabel="No entries"
            items={suggestions.providers}
            renderItem={(provider) => (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{provider.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {provider.zones.length > 0 ? provider.zones[0] : 'Zones pending'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <p className="text-xs font-semibold text-slate-600">{provider.programmes} programmes</p>
                  <a
                    href={provider.href}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary transition group-hover:border-primary group-hover:bg-primary group-hover:text-white"
                  >
                    Open
                  </a>
                </div>
              </>
            )}
          />
          <SuggestionSection
            title="Stores"
            actionHref="/marketplace"
            actionLabel="Shop"
            loading={suggestions.loading}
            error={suggestions.error}
            emptyLabel="No entries"
            items={suggestions.stores}
            renderItem={(item) => (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{item.title}</p>
                  <p className="truncate text-xs text-slate-500">{item.partner}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {item.priceLabel ? (
                    <p className="text-xs font-semibold text-slate-600">{item.priceLabel}</p>
                  ) : null}
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary transition group-hover:border-primary group-hover:bg-primary group-hover:text-white"
                  >
                    Go
                  </a>
                </div>
              </>
            )}
          />
        </aside>
      </div>
    </div>
  );
}
