import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bars3BottomLeftIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardSection from './DashboardSection.jsx';

const stateBadgeMap = {
  enabled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pilot: 'bg-amber-100 text-amber-700 border-amber-200',
  staging: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  disabled: 'bg-slate-100 text-slate-600 border-slate-200',
  sunset: 'bg-rose-100 text-rose-700 border-rose-200'
};

const formatToggleDate = (iso) => {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ToggleSummary = ({ toggle, reason }) => {
  if (!toggle) {
    return null;
  }
  const badgeClass = stateBadgeMap[toggle.state] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const parsedRollout = Number.parseFloat(toggle.rollout ?? 0);
  const rolloutValue = Number.isFinite(parsedRollout) ? parsedRollout : 0;
  return (
    <div className="mt-4 max-w-md rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm" data-qa="dashboard-toggle-summary">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Feature toggle</p>
          <p className="text-sm font-semibold text-slate-900">analytics-dashboards</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`} data-qa="dashboard-toggle-chip">
          {toggle.state ?? 'unknown'}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <dt className="font-medium text-slate-600">Owner</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-owner">{toggle.owner || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Ticket</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-ticket">{toggle.ticket || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Last modified</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-modified">{formatToggleDate(toggle.lastModifiedAt)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Rollout</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-rollout">{Math.round(rolloutValue * 100)}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-slate-600">Reason</dt>
          <dd className="mt-1 capitalize" data-qa="dashboard-toggle-reason">{reason?.replace('-', ' ') || 'enabled'}</dd>
        </div>
      </dl>
    </div>
  );
};

ToggleSummary.propTypes = {
  toggle: PropTypes.shape({
    state: PropTypes.string,
    rollout: PropTypes.number,
    owner: PropTypes.string,
    ticket: PropTypes.string,
    lastModifiedAt: PropTypes.string
  }),
  reason: PropTypes.string
};

ToggleSummary.defaultProps = {
  toggle: null,
  reason: null
};

const resultBadge = {
  section: 'Section',
  card: 'Summary',
  column: 'Stage',
  item: 'Work Item',
  record: 'Record',
  configuration: 'Setting',
  panel: 'Setting'
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return null;
  const last = new Date(timestamp);
  if (Number.isNaN(last.getTime())) return null;
  const diffMs = Date.now() - last.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'moments ago';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const buildSearchIndex = (navigation) =>
  navigation.flatMap((section) => {
    const entries = [
      {
        id: section.id,
        type: 'section',
        label: section.label,
        description: section.description ?? '',
        targetSection: section.id
      }
    ];

    if (section.type === 'grid' && Array.isArray(section.data?.cards)) {
      entries.push(
        ...section.data.cards.map((card) => ({
          id: `${section.id}-${card.title}`,
          type: 'card',
          label: card.title,
          description: Array.isArray(card.details) ? card.details.join(' • ') : '',
          targetSection: section.id
        }))
      );
    }

    if (section.type === 'board' && Array.isArray(section.data?.columns)) {
      section.data.columns.forEach((column) => {
        entries.push({
          id: `${section.id}-${column.title}`,
          type: 'column',
          label: `${column.title} • ${section.label}`,
          description: `${column.items?.length ?? 0} work items`,
          targetSection: section.id
        });
        column.items?.forEach((item) => {
          entries.push({
            id: `${section.id}-${item.title}`,
            type: 'item',
            label: item.title,
            description: [item.owner, item.value, item.eta].filter(Boolean).join(' • '),
            targetSection: section.id
          });
        });
      });
    }

    if (section.type === 'table' && Array.isArray(section.data?.rows)) {
      entries.push(
        ...section.data.rows.map((row, index) => ({
          id: `${section.id}-row-${index}`,
          type: 'record',
          label: row[1] ?? row[0],
          description: Array.isArray(row) ? row.join(' • ') : '',
          targetSection: section.id
        }))
      );
    }

    if (section.type === 'list' && Array.isArray(section.data?.items)) {
      entries.push(
        ...section.data.items.map((item) => ({
          id: `${section.id}-${item.title}`,
          type: 'configuration',
          label: item.title,
          description: item.description ?? '',
          targetSection: section.id
        }))
      );
    }

    if (section.type === 'settings' && Array.isArray(section.data?.panels)) {
      section.data.panels.forEach((panel) => {
        const panelId = panel.id ?? panel.title ?? 'panel';
        entries.push({
          id: `${section.id}-${panelId}`,
          type: 'panel',
          label: panel.title ?? 'Settings panel',
          description: panel.description ?? '',
          targetSection: section.id
        });
        panel.items?.forEach((item) => {
          entries.push({
            id: `${section.id}-${panelId}-${item.label}`,
            type: item.type === 'toggle' ? 'configuration' : 'record',
            label: item.label,
            description: item.helper ?? '',
            targetSection: section.id
          });
        });
      });
    }

    return entries;
  });

const statusToneClasses = (tone, isActive) => {
  if (isActive) {
    return 'border border-white/30 bg-white/15 text-white';
  }

  switch (tone) {
    case 'success':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-600';
    case 'warning':
      return 'border border-amber-200 bg-amber-50 text-amber-700';
    case 'danger':
      return 'border border-rose-200 bg-rose-50 text-rose-700';
    case 'info':
      return 'border border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border border-accent/10 bg-white text-primary/80';
  }
};

const statusDotClasses = (tone, isActive) => {
  if (isActive) {
    return 'bg-white';
  }

  switch (tone) {
    case 'success':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'danger':
      return 'bg-rose-500';
    case 'info':
      return 'bg-sky-500';
    default:
      return 'bg-accent';
  }
};

const badgeClasses = (isActive) => (isActive ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent');

const highlightClasses = (isActive) =>
  isActive ? 'border border-white/25 bg-white/10 text-white/90' : 'border border-accent/10 bg-white text-primary/80';

const Skeleton = () => (
  <div className="px-6 py-10">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-52 rounded bg-primary/10" />
        <div className="h-4 w-full rounded bg-primary/10" />
        <div className="h-4 w-3/4 rounded bg-primary/10" />
      </div>
      <div className="animate-pulse grid gap-6 md:grid-cols-2">
        <div className="h-40 rounded-2xl bg-primary/10" />
        <div className="h-40 rounded-2xl bg-primary/10" />
      </div>
    </div>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="px-6 py-10">
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">We couldn’t load this dashboard</h2>
            <p className="text-sm">{message}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
            >
              <ArrowPathIcon className="h-4 w-4" /> Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

ErrorState.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired
};

const DashboardLayout = ({
  roleMeta,
  registeredRoles,
  dashboard,
  loading,
  error,
  onRefresh,
  lastRefreshed,
  exportHref,
  filters
}) => {
  const navigation = dashboard?.navigation ?? [];
  const [selectedSection, setSelectedSection] = useState(navigation[0]?.id ?? 'overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedSection(navigation[0]?.id ?? 'overview');
    setSearchQuery('');
    setSearchResults([]);
  }, [navigation]);

  const searchIndex = useMemo(() => buildSearchIndex(navigation), [navigation]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const lowered = searchQuery.toLowerCase();
    setSearchResults(
      searchIndex.filter((entry) => entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered)).slice(0, 8)
    );
  }, [searchQuery, searchIndex]);

  const activeSection = navigation.find((item) => item.id === selectedSection) ?? navigation[0];

  const renderSection = () => {
    if (!activeSection) return null;
    if (activeSection.type === 'overview') {
      return <DashboardOverview analytics={activeSection.analytics} />;
    }
    return <DashboardSection section={activeSection} />;
  };

  const registeredOptions = registeredRoles.filter((role) => role.registered);

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/60 to-white text-primary flex">
      <aside className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r border-accent/10 bg-gradient-to-b from-white via-secondary/40 to-white">
        <div className="p-8 border-b border-accent/10">
          <div className="flex items-center gap-3">
            <Bars3BottomLeftIcon className="h-8 w-8 text-accent" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fixnado</p>
              <p className="text-lg font-semibold text-primary">{roleMeta.name}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{roleMeta.headline}</p>
          <div className="mt-6 space-y-2">
            <label className="text-xs uppercase tracking-wide text-primary/70" htmlFor="roleSwitcher">
              Switch dashboard
            </label>
            <select
              id="roleSwitcher"
              value={roleMeta.id}
              onChange={(event) => navigate(`/dashboards/${event.target.value}`)}
              className="w-full rounded-xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {registeredOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = item.id === activeSection?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSection(item.id)}
                className={`w-full text-left rounded-xl border px-4 py-4 transition-colors flex flex-col gap-3 ${
                  isActive
                    ? 'bg-accent text-white border-accent shadow-glow'
                    : 'bg-white/80 border-accent/10 text-primary/80 hover:border-accent/40 hover:text-primary'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                  </div>
                  {item.sidebar?.badge && (
                    <span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses(isActive)}`}>
                      {item.sidebar.badge}
                    </span>
                  )}
                </div>
                {item.sidebar?.status?.label && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${statusToneClasses(item.sidebar.status.tone, isActive)}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${statusDotClasses(item.sidebar.status.tone, isActive)}`} />
                    {item.sidebar.status.label}
                  </span>
                )}
                {Array.isArray(item.sidebar?.highlights) && item.sidebar.highlights.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {item.sidebar.highlights.map((highlight) => (
                      <div
                        key={`${item.id}-${highlight.label}`}
                        className={`rounded-lg px-3 py-2 ${highlightClasses(isActive)}`}
                      >
                        <p className="text-sm font-semibold">{String(highlight.value ?? '—')}</p>
                        <p className="mt-1 text-[0.6rem] uppercase tracking-wide">{highlight.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-accent/10">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-glow hover:bg-accent/90"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Return to Fixnado.com
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <div className="sticky top-0 z-10 border-b border-accent/10 bg-white/90 backdrop-blur px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-primary">{activeSection?.label ?? roleMeta.name}</h1>
              <p className="text-sm text-slate-600 max-w-2xl">{roleMeta.persona}</p>
              {lastRefreshed && (
                <p className="text-xs text-primary/60 mt-1">Refreshed {formatRelativeTime(lastRefreshed)}</p>
              )}
              <ToggleSummary toggle={toggleMeta} reason={toggleReason} />
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-80">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search jobs, orders, analytics, automations..."
                  className="w-full rounded-full bg-white border border-accent/20 py-3 pl-12 pr-4 text-sm text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {searchResults.length > 0 && (
                  <div className="absolute inset-x-0 top-14 z-20 rounded-2xl border border-accent/10 bg-white shadow-glow">
                    <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map((result) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSection(result.targetSection);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary"
                          >
                            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-primary/80">
                              {resultBadge[result.type] ?? 'Result'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-primary">{result.label}</p>
                              <p className="text-xs text-slate-500">{result.description}</p>
                            </div>
                            <ArrowTopRightOnSquareIcon className="mt-1 h-4 w-4 text-slate-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2 sm:self-end">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 hover:border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                {exportHref && (
                  <a
                    href={exportHref}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Download CSV
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading && !dashboard ? (
          <Skeleton />
        ) : (
          <div className="px-6 py-10">
            <div className="mx-auto max-w-6xl space-y-8">{renderSection()}</div>
          </div>
        )}
      </main>
    </div>
  );
};

DashboardLayout.propTypes = {
  roleMeta: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    persona: PropTypes.string,
    headline: PropTypes.string
  }).isRequired,
  registeredRoles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      registered: PropTypes.bool
    })
  ).isRequired,
  dashboard: PropTypes.shape({
    navigation: PropTypes.array,
    window: PropTypes.object
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  lastRefreshed: PropTypes.string,
  exportHref: PropTypes.string,
  filters: PropTypes.node
};

DashboardLayout.defaultProps = {
  dashboard: null,
  loading: false,
  error: null,
  lastRefreshed: null,
  exportHref: null,
  filters: null
};

export default DashboardLayout;
