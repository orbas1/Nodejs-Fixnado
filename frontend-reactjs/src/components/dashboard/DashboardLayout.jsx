import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  Bars3BottomLeftIcon,
  BoltIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  Cog8ToothIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PaintBrushIcon,
  QueueListIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  TagIcon,
  UserCircleIcon,
  UsersIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardSection from './DashboardSection.jsx';
import ServicemanSummary from './ServicemanSummary.jsx';
import DashboardPersonaSummary from './DashboardPersonaSummary.jsx';
import DashboardBlogRail from './DashboardBlogRail.jsx';
import CustomerOverviewControl from './CustomerOverviewControl.jsx';
import ProviderEscrowWorkspace from '../../features/escrowManagement/ProviderEscrowWorkspace.jsx';

const navIconMap = {
  profile: UserCircleIcon,
  calendar: CalendarDaysIcon,
  pipeline: ClipboardDocumentListIcon,
  history: ClipboardDocumentListIcon,
  availability: UsersIcon,
  crew: WrenchScrewdriverIcon,
  provider: UsersIcon,
  users: UsersIcon,
  control: Squares2X2Icon,
  assets: CubeIcon,
  support: InboxStackIcon,
  settings: Cog8ToothIcon,
  analytics: ChartPieIcon,
  finance: BanknotesIcon,
  enterprise: BuildingOfficeIcon,
  compliance: ShieldCheckIcon,
  automation: BoltIcon,
  map: MapIcon,
  documents: ClipboardDocumentCheckIcon,
  operations: QueueListIcon,
  builder: PaintBrushIcon,
  marketplace: WrenchScrewdriverIcon,
  seo: TagIcon
};

const DEFAULT_ICON = Squares2X2Icon;

function getNavIcon(item) {
  if (!item?.icon) {
    return DEFAULT_ICON;
  }
  return navIconMap[item.icon] ?? DEFAULT_ICON;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'moments ago';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function titleCase(value) {
  return value
    .split(/[._-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildSearchIndex(navigation) {
  if (!Array.isArray(navigation)) {
    return [];
  }
  return navigation
    .filter((section) => !section.href)
    .flatMap((section) => {
      const entries = [
        {
          id: section.id,
          label: section.label || titleCase(section.id),
          description: section.description || '',
          sectionId: section.id
        }
      ];

      if (Array.isArray(section.searchable)) {
        section.searchable.forEach((item) => {
          entries.push({
            id: `${section.id}-${item.id || item.label}`,
            label: item.label || titleCase(item.id || 'item'),
            description: item.description || '',
            sectionId: item.targetSection || section.id
          });
        });
      }

      if (section.type === 'board' && Array.isArray(section.data?.columns)) {
        section.data.columns.forEach((column) => {
          entries.push({
            id: `${section.id}-${column.id || column.title}`,
            label: `${column.title || 'Column'} • ${section.label || titleCase(section.id)}`,
            description: `${column.items?.length ?? 0} work items`,
            sectionId: section.id
          });
        });
      }

      return entries;
    });
}

function Skeleton() {
  return (
    <div className="space-y-6 px-6 py-10">
      <div className="h-8 w-2/5 animate-pulse rounded-full bg-white/30" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="h-40 animate-pulse rounded-2xl bg-white/40" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 px-6 text-center">
      <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-primary">We couldn’t load this dashboard.</p>
        <p className="text-sm text-slate-500">{message || 'Try refreshing the view.'}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow"
      >
        <ArrowPathIcon className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

ErrorState.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func
};

ErrorState.defaultProps = {
  message: null,
  onRetry: undefined
};

const stateBadgeMap = {
  enabled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pilot: 'bg-amber-100 text-amber-700 border-amber-200',
  staging: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  disabled: 'bg-slate-100 text-slate-600 border-slate-200',
  sunset: 'bg-rose-100 text-rose-700 border-rose-200'
};

function formatToggleDate(iso) {
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
}

function ToggleSummary({ toggle, reason }) {
  if (!toggle) {
    return null;
  }
  const badgeClass = stateBadgeMap[toggle.state] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const rolloutValue = Number.isFinite(Number(toggle.rollout)) ? Number(toggle.rollout) : 0;
  return (
    <div className="mt-4 max-w-md rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Feature toggle</p>
          <p className="text-sm font-semibold text-slate-900">analytics-dashboards</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
          {toggle.state ?? 'unknown'}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <dt className="font-medium text-slate-600">Owner</dt>
          <dd className="mt-1">{toggle.owner || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Ticket</dt>
          <dd className="mt-1">{toggle.ticket || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Last modified</dt>
          <dd className="mt-1">{formatToggleDate(toggle.lastModifiedAt)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Rollout</dt>
          <dd className="mt-1">{Math.round(rolloutValue * 100)}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-slate-600">Reason</dt>
          <dd className="mt-1 capitalize">{reason?.replace('-', ' ') || 'enabled'}</dd>
        </div>
      </dl>
    </div>
  );
}

ToggleSummary.propTypes = {
  toggle: PropTypes.shape({
    state: PropTypes.string,
    rollout: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
  panel: 'Setting',
  bucket: 'Bucket',
  route: 'Workspace'
};

export default function DashboardLayout({
  roleMeta,
  registeredRoles,
  dashboard,
  loading,
  error,
  onRefresh,
  lastRefreshed,
  exportHref,
  toggleMeta,
  toggleReason,
  onLogout,
  blogPosts,
  initialSectionId,
  onSectionChange
}) {
  const persona = roleMeta?.persona || roleMeta?.id || 'dashboard';
  const navigation = dashboard?.navigation ?? [];

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSection, setSelectedSection] = useState(initialSectionId || navigation[0]?.id || null);

  useEffect(() => {
    if (initialSectionId) {
      setSelectedSection(initialSectionId);
      return;
    }
    if (navigation.length && !navigation.some((item) => item.id === selectedSection)) {
      setSelectedSection(navigation[0].id);
    }
  }, [initialSectionId, navigation, selectedSection]);

  const activeSection = useMemo(
    () => navigation.find((item) => item.id === selectedSection) ?? navigation[0] ?? null,
    [navigation, selectedSection]
  );

  const searchIndex = useMemo(() => buildSearchIndex(navigation), [navigation]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const lowered = searchQuery.toLowerCase();
    const matches = searchIndex.filter(
      (entry) => entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered)
    );
    setSearchResults(matches.slice(0, 12));
  }, [searchQuery, searchIndex]);

  const handleSectionSelect = useCallback(
    (sectionId) => {
      setSelectedSection(sectionId);
      setSearchQuery('');
      setSearchResults([]);
      setMobileNavOpen(false);
      if (onSectionChange) {
        onSectionChange(sectionId);
      }
    },
    [onSectionChange]
  );

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (searchResults.length > 0) {
        handleSectionSelect(searchResults[0].sectionId);
      }
    },
    [handleSectionSelect, searchResults]
  );

  const shouldShowPersonaSummary = persona === 'user' && activeSection?.id === 'overview';
  const shouldShowServicemanSummary = persona === 'serviceman' && activeSection?.id === 'overview';

  const renderSection = useCallback(() => {
    if (!activeSection) {
      return null;
    }

    if (activeSection.type === 'overview') {
      if (persona === 'user') {
        return (
          <div className="space-y-10">
            <DashboardOverview analytics={activeSection.analytics} />
            <CustomerOverviewControl />
          </div>
        );
      }
      return <DashboardOverview analytics={activeSection.analytics} />;
    }

    if (typeof activeSection.render === 'function') {
      return activeSection.render();
    }

    if (persona === 'provider' && activeSection.id === 'escrow-management') {
      return <ProviderEscrowWorkspace section={activeSection} />;
    }

    if (activeSection.component) {
      const Component = activeSection.component;
      return <Component {...(activeSection.componentProps ?? {})} />;
    }

    if (activeSection.id === 'customer-control') {
      return <CustomerOverviewControl />;
    }

    return (
      <DashboardSection
        section={activeSection}
        persona={persona}
        features={dashboard?.metadata?.features ?? {}}
        context={dashboard?.metadata ?? {}}
      />
    );
  }, [activeSection, persona, dashboard]);

  const registeredOptions = useMemo(
    () => registeredRoles.filter((role) => role.registered),
    [registeredRoles]
  );

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-secondary/60 to-white text-primary">
      <Transition.Root show={mobileNavOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setMobileNavOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-200 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-200 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col overflow-y-auto bg-white/90 px-4 pb-6 pt-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Persona</p>
                    <p className="text-lg font-semibold text-primary">{roleMeta?.name ?? 'Dashboard'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-primary"
                    aria-label="Close navigation"
                  >
                    ✕
                  </button>
                </div>

                <nav className="mt-6 space-y-1">
                  {navigation.map((item) => {
                    const Icon = getNavIcon(item);
                    const isActive = item.id === activeSection?.id;
                    if (item.href) {
                      return (
                        <Link
                          key={item.id}
                          to={item.href}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-primary/80 hover:bg-white"
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                          <span>{item.label}</span>
                          <ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSectionSelect(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                          isActive ? 'bg-primary text-white shadow-glow' : 'text-primary/80 hover:bg-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {registeredOptions.length > 1 ? (
                  <div className="mt-10 space-y-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Switch persona</p>
                    <div className="flex flex-wrap gap-2">
                      {registeredOptions.map((option) => (
                        <span
                          key={option.id}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            option.id === roleMeta.id
                              ? 'bg-primary text-white'
                              : 'bg-white/80 text-primary/70 border border-slate-200'
                          }`}
                        >
                          {option.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <aside className="hidden w-72 flex-col border-r border-white/50 bg-white/70 px-6 py-8 lg:flex">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Persona</p>
          <p className="text-lg font-semibold text-primary">{roleMeta?.name ?? 'Dashboard'}</p>
          <p className="text-sm text-slate-500">{roleMeta?.headline}</p>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = getNavIcon(item);
            const isActive = item.id === activeSection?.id;
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-primary/80 transition hover:bg-white"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                  <ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSectionSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  isActive ? 'bg-primary text-white shadow-glow' : 'text-primary/80 hover:bg-white'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {registeredOptions.length > 1 ? (
          <div className="mt-8 space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Registered workspaces</p>
            <div className="flex flex-wrap gap-2">
              {registeredOptions.map((option) => (
                <span
                  key={option.id}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    option.id === roleMeta.id ? 'bg-primary text-white' : 'bg-white/80 text-primary/70 border border-slate-200'
                  }`}
                >
                  {option.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </aside>

      <main className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-white/50 bg-white/80">
          <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-primary lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation"
                >
                  <Bars3BottomLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{roleMeta?.persona || 'Persona'}</p>
                  <h1 className="text-2xl font-semibold text-primary">{activeSection?.label ?? 'Dashboard'}</h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm text-slate-600">{activeSection?.description || roleMeta?.headline}</p>
              <form className="relative max-w-lg" onSubmit={handleSearchSubmit}>
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search dashboard sections"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white/90 py-2 pl-10 pr-4 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && searchResults.length > 0 ? (
                  <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                    <ul className="divide-y divide-slate-100">
                      {searchResults.map((result) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            onClick={() => handleSectionSelect(result.sectionId)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary"
                          >
                            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-primary/80">
                              {resultBadge[result.type] ?? 'Result'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-primary">{result.label}</p>
                              <p className="text-xs text-slate-500">{result.description}</p>
                            </div>
                            <ArrowTopRightOnSquareIcon className="mt-1 h-4 w-4 text-slate-400" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </form>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-2 text-sm font-semibold text-primary/80 shadow-sm hover:border-accent hover:text-primary"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Public site
              </Link>
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm hover:border-rose-300 hover:text-rose-800"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Sign out
                </button>
              ) : null}
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-2 text-sm font-semibold text-primary/80 shadow-sm hover:border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              {exportHref ? (
                <a
                  href={exportHref}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" /> Download CSV
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-white/60 px-6 py-3 text-xs text-slate-500">
            {lastRefreshed ? <span>Last refreshed {formatRelativeTime(lastRefreshed)}</span> : null}
            <span className="hidden md:inline">•</span>
            <span>Persona: {persona}</span>
          </div>
        </div>

        <div className="flex-1">
          {loading && !dashboard ? (
            <Skeleton />
          ) : (
            <div className="space-y-8 px-6 py-10">
              {shouldShowServicemanSummary ? (
                <ServicemanSummary metadata={dashboard?.metadata} windowLabel={dashboard?.window?.label ?? null} />
              ) : null}
              {renderSection()}
              {shouldShowPersonaSummary ? <DashboardPersonaSummary dashboard={dashboard} /> : null}
              {toggleMeta ? <ToggleSummary toggle={toggleMeta} reason={toggleReason} /> : null}
              {Array.isArray(blogPosts) && blogPosts.length > 0 ? <DashboardBlogRail posts={blogPosts} /> : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

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
    metadata: PropTypes.object,
    window: PropTypes.object
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  lastRefreshed: PropTypes.string,
  exportHref: PropTypes.string,
  toggleMeta: PropTypes.shape({
    state: PropTypes.string,
    rollout: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    owner: PropTypes.string,
    ticket: PropTypes.string,
    lastModifiedAt: PropTypes.string
  }),
  toggleReason: PropTypes.string,
  onLogout: PropTypes.func,
  blogPosts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired
    })
  ),
  initialSectionId: PropTypes.string,
  onSectionChange: PropTypes.func
};

DashboardLayout.defaultProps = {
  dashboard: null,
  loading: false,
  error: null,
  lastRefreshed: null,
  exportHref: null,
  toggleMeta: null,
  toggleReason: null,
  onLogout: null,
  blogPosts: [],
  initialSectionId: null,
  onSectionChange: null
};
