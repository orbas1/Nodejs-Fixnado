import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3BottomLeftIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  InboxStackIcon,
  Cog8ToothIcon,
  UsersIcon,
  ChartPieIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  MapIcon,
  BoltIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  CubeIcon,
  QueueListIcon,
  PaintBrushIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardSection from './DashboardSection.jsx';
import ServicemanSummary from './ServicemanSummary.jsx';
import DashboardPersonaSummary from './DashboardPersonaSummary.jsx';
import DashboardBlogRail from './DashboardBlogRail.jsx';
import CustomerOverviewControl from './CustomerOverviewControl.jsx';
import ServicemanDisputeWorkspace from '../servicemanControl/ServicemanDisputeWorkspace.jsx';

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

const ToggleSummary = ({ toggle = null, reason = null }) => {
  if (!toggle) {
    return null;
  }
  const badgeClass = stateBadgeMap[toggle.state] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const parsedRollout = Number.parseFloat(toggle.rollout ?? 0);
  const rolloutValue = Number.isFinite(parsedRollout) ? parsedRollout : 0;

  return (
    <div className="mt-6 max-w-lg rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
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
};

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

const resultBadge = {
  section: 'Section',
  card: 'Summary',
  column: 'Stage',
  item: 'Work Item',
  record: 'Record',
  configuration: 'Setting',
  panel: 'Panel',
  bucket: 'Bucket',
  route: 'Workspace'
};

const navIconMap = {
  profile: UserCircleIcon,
  calendar: CalendarDaysIcon,
  pipeline: ClipboardDocumentListIcon,
  history: ClipboardDocumentListIcon,
  availability: UsersIcon,
  provider: UsersIcon,
  users: UsersIcon,
  control: Squares2X2Icon,
  assets: CubeIcon,
  support: InboxStackIcon,
  settings: Cog8ToothIcon,
  crew: WrenchScrewdriverIcon,
  compliance: ShieldCheckIcon,
  enterprise: BuildingOfficeIcon,
  finance: BanknotesIcon,
  analytics: ChartPieIcon,
  automation: BoltIcon,
  map: MapIcon,
  documents: ClipboardDocumentCheckIcon,
  operations: QueueListIcon,
  marketplace: WrenchScrewdriverIcon,
  seo: TagIcon
};

navIconMap.builder = PaintBrushIcon;

const getNavIcon = (item) => {
  if (!item?.icon) {
    return Squares2X2Icon;
  }
  return navIconMap[item.icon] ?? Squares2X2Icon;
};

const buildSearchIndex = (navigation) =>
  navigation
    .filter((section) => !section.href)
    .flatMap((section) => {
      const entries = [
        {
          id: section.id,
          type: section.type ?? 'section',
          label: section.label ?? section.name ?? section.id,
          description: section.description ?? '',
          targetSection: section.id
        }
      ];

      if (Array.isArray(section.items)) {
        section.items.forEach((item) => {
          entries.push({
            id: `${section.id}-${item.id ?? item.label}`,
            type: item.type ?? 'item',
            label: item.label ?? item.name ?? 'Item',
            description: item.description ?? '',
            targetSection: section.id
          });
        });
      }

      if (Array.isArray(section.groups)) {
        section.groups.forEach((group) => {
          entries.push({
            id: `${section.id}-${group.id ?? group.label}`,
            type: group.type ?? 'panel',
            label: group.label ?? group.name ?? 'Group',
            description: group.description ?? '',
            targetSection: section.id
          });
        });
      }

      if (Array.isArray(section.packages)) {
        section.packages.forEach((pkg) => {
          entries.push({
            id: `${section.id}-${pkg.id ?? pkg.name}`,
            type: 'package',
            label: `${pkg.name ?? pkg.title ?? 'Package'} • Package`,
            description: pkg.description ?? '',
            targetSection: section.id
          });
        });
      }

      return entries;
    });

const resolveInitialSection = (navigation, preferred) => {
  if (preferred && navigation.some((item) => !item.href && item.id === preferred)) {
    return preferred;
  }
  const first = navigation.find((item) => !item.href);
  return first?.id ?? navigation[0]?.id ?? 'overview';
};

const Skeleton = () => (
  <div className="px-6 py-10">
    <div className="space-y-6">
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
  dashboard = null,
  loading = false,
  error = null,
  onRefresh,
  lastRefreshed = null,
  exportHref = null,
  toggleMeta = null,
  toggleReason = null,
  onLogout,
  blogPosts = [],
  initialSectionId = null,
  onSectionChange = null
}) => {
  const navigation = useMemo(() => dashboard?.navigation ?? [], [dashboard]);
  const [selectedSection, setSelectedSection] = useState(() => resolveInitialSection(navigation, initialSectionId));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSelectedSection((current) => resolveInitialSection(navigation, current));
  }, [navigation]);

  useEffect(() => {
    if (!initialSectionId) return;
    setSelectedSection(resolveInitialSection(navigation, initialSectionId));
  }, [initialSectionId, navigation]);

  const searchIndex = useMemo(() => buildSearchIndex(navigation), [navigation]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const lowered = searchQuery.toLowerCase();
    setSearchResults(
      searchIndex
        .filter((entry) => entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered))
        .slice(0, 8)
    );
  }, [searchQuery, searchIndex]);

  const handleSectionSelect = useCallback(
    (sectionId) => {
      setSelectedSection(sectionId);
      setMobileNavOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      if (onSectionChange) {
        onSectionChange(sectionId);
      }
    },
    [onSectionChange]
  );

  const activeSection = useMemo(() => {
    if (!navigation.length) {
      return null;
    }
    const match = navigation.find((item) => !item.href && item.id === selectedSection);
    if (match) {
      return match;
    }
    return navigation.find((item) => !item.href) ?? null;
  }, [navigation, selectedSection]);

  const persona = dashboard?.persona ?? roleMeta.id;
  const shouldShowPersonaSummary = persona === 'user' && activeSection?.id === 'overview';
  const shouldShowServicemanSummary = persona === 'serviceman' && activeSection?.id === 'overview';

  const renderSection = useCallback(() => {
    if (!activeSection) return null;

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

    if (activeSection.id === 'customer-control') {
      return <CustomerOverviewControl />;
    }

    if (activeSection.id === 'serviceman-disputes') {
      return <ServicemanDisputeWorkspace />;
    }

    if (activeSection.component) {
      const Component = activeSection.component;
      return <Component {...(activeSection.componentProps ?? {})} />;
    }

    if (typeof activeSection.render === 'function') {
      return activeSection.render();
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

  const handleNavItemClick = useCallback(
    (item) => {
      if (item.type === 'link' && item.href) {
        if (item.target === '_blank') {
          window.open(item.href, '_blank', 'noopener');
        } else {
          navigate(item.href);
        }
        setMobileNavOpen(false);
        return;
      }

      if (item.type === 'route' && item.href) {
        navigate(item.href);
        setMobileNavOpen(false);
        return;
      }

      if (item.href) {
        navigate(item.href);
        setMobileNavOpen(false);
        return;
      }

      handleSectionSelect(item.id);
    },
    [handleSectionSelect, navigate]
  );

  const renderNavItem = (item) => {
    const Icon = getNavIcon(item);
    const isLink = Boolean(item.href);
    const isActive = !isLink && item.id === activeSection?.id;
    const baseClasses = `group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
      isActive
        ? 'border-accent bg-accent text-white shadow-glow'
        : 'border-transparent bg-white/90 text-primary/80 hover:border-accent/40 hover:text-primary'
    }`;
    const iconClasses = `flex h-10 w-10 items-center justify-center rounded-xl ${
      isActive ? 'bg-white/20 text-white' : 'bg-secondary text-primary group-hover:bg-accent/10 group-hover:text-accent'
    }`;

    const content = (
      <>
        <span className={iconClasses}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{item.label}</p>
          {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
        </div>
      </>
    );

    if (isLink) {
      const isActiveLink = location.pathname === item.href;
      return (
        <Link
          key={item.id}
          to={item.href}
          className={baseClasses}
          onClick={() => {
            setMobileNavOpen(false);
            if (!item.href.startsWith('http')) {
              setSelectedSection(item.id);
            }
          }}
          aria-pressed={isActiveLink}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        className={baseClasses}
        aria-pressed={isActive}
        onClick={() => handleNavItemClick(item)}
      >
        {content}
      </button>
    );
  };

  if (loading && !dashboard) {
    return <Skeleton />;
  }

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-secondary/60 to-white text-primary">
      <Transition.Root show={mobileNavOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setMobileNavOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full flex-col border-r border-accent/10 bg-gradient-to-b from-white via-secondary/60 to-white p-6 shadow-2xl">
                <Dialog.Title className="sr-only">Dashboard navigation</Dialog.Title>
                <div className="flex items-center justify-between gap-3">
                  <Link to="/dashboards" className="flex items-center gap-2 text-primary" onClick={() => setMobileNavOpen(false)}>
                    <Bars3BottomLeftIcon className="h-6 w-6 text-accent" />
                    <div className="leading-tight">
                      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Fixnado</p>
                      <p className="text-lg font-semibold">{roleMeta.name}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-full border border-accent/20 bg-white p-2 text-slate-500 transition hover:border-accent hover:text-accent"
                    aria-label="Close navigation"
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                </div>
                <nav className="mt-8 flex-1 space-y-2 overflow-y-auto">{navigation.map((item) => renderNavItem(item))}</nav>
                <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-600">Registered workspaces</p>
                  <ul className="mt-2 space-y-1">
                    {registeredRoles.map((role) => (
                      <li key={role.id} className="flex items-center justify-between gap-2">
                        <span>{role.name}</span>
                        {role.registered ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-500">
                            Pending
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <aside
        className={`hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-accent/10 lg:bg-gradient-to-b lg:from-white lg:via-secondary/40 lg:to-white lg:px-6 lg:py-8 ${
          navCollapsed ? 'lg:w-24' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Bars3BottomLeftIcon className="h-6 w-6 text-accent" />
            <div className="leading-tight">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Fixnado</p>
              <p className="text-lg font-semibold">{roleMeta.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNavCollapsed((value) => !value)}
            className="rounded-full border border-accent/20 bg-white p-2 text-slate-500 transition hover:border-accent hover:text-accent"
            aria-label="Toggle navigation"
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">{roleMeta.persona}</p>
        <nav className="mt-8 flex-1 space-y-2 overflow-y-auto pr-2">{navigation.map((item) => renderNavItem(item))}</nav>
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Log out
          </button>
        ) : null}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm"
            >
              <Bars3BottomLeftIcon className="h-5 w-5 text-accent" /> Menu
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">{roleMeta.name}</p>
              <p className="text-xs text-slate-500">{roleMeta.persona}</p>
            </div>
          </div>
          <div className="hidden items-center justify-between gap-4 px-8 py-5 lg:flex">
            <div>
              <h1 className="text-2xl font-semibold text-primary">{roleMeta.name}</h1>
              <p className="text-sm text-slate-500">{dashboard?.headline ?? roleMeta.headline}</p>
            </div>
            <div className="flex items-center gap-3">
              {exportHref ? (
                <a
                  href={exportHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-accent/50 hover:text-accent"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" /> Export
                </a>
              ) : null}
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-accent/50 hover:text-accent"
              >
                <ArrowPathIcon className="h-4 w-4" /> Refresh
              </button>
              {lastRefreshed ? (
                <p className="text-xs text-slate-500">Last refreshed {formatToggleDate(lastRefreshed)}</p>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col gap-6 px-4 pb-12 pt-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search workspace tools and records"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  {searchResults.length ? (
                    <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <ul className="divide-y divide-slate-100">
                        {searchResults.map((result) => (
                          <li key={result.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-primary hover:bg-secondary"
                              onClick={() => {
                                handleSectionSelect(result.targetSection ?? result.id);
                              }}
                            >
                              <div>
                                <p className="font-semibold">{result.label}</p>
                                {result.description ? (
                                  <p className="text-xs text-slate-500">{result.description}</p>
                                ) : null}
                              </div>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-500">
                                {resultBadge[result.type] ?? 'Result'}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {toggleMeta ? <ToggleSummary toggle={toggleMeta} reason={toggleReason} /> : null}

                {shouldShowPersonaSummary ? <DashboardPersonaSummary /> : null}
                {shouldShowServicemanSummary ? <ServicemanSummary /> : null}

                <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                  {loading ? <Skeleton /> : renderSection()}
                </div>
              </div>

              <aside className="w-full space-y-6 lg:w-80">
                {lastRefreshed ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500 shadow-sm">
                    <p className="font-semibold text-primary">Sync status</p>
                    <p className="mt-1">Last refreshed {formatToggleDate(lastRefreshed)}</p>
                  </div>
                ) : null}
                {blogPosts?.length ? <DashboardBlogRail posts={blogPosts} /> : null}
              </aside>
            </div>
          </div>
        </main>
      </div>
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
    persona: PropTypes.string,
    headline: PropTypes.string,
    metadata: PropTypes.object
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

export default DashboardLayout;
