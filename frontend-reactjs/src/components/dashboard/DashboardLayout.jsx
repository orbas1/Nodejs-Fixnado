import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bars3BottomLeftIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
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
  CubeIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardSection from './DashboardSection.jsx';
import ServicemanSummary from './ServicemanSummary.jsx';
import DashboardPersonaSummary from './DashboardPersonaSummary.jsx';
import DashboardBlogRail from './DashboardBlogRail.jsx';

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

const resultBadge = {
  section: 'Section',
  card: 'Summary',
  column: 'Stage',
  item: 'Work Item',
  record: 'Record',
  configuration: 'Setting',
  panel: 'Setting',
  route: 'Workspace'
};

const navIconMap = {
  profile: UserCircleIcon,
  calendar: CalendarDaysIcon,
  pipeline: ClipboardDocumentListIcon,
  availability: UsersIcon,
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
  documents: ClipboardDocumentCheckIcon
};

const getNavIcon = (item) => {
  if (!item?.icon) {
    return Squares2X2Icon;
  }

  return navIconMap[item.icon] ?? Squares2X2Icon;
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
    if (section.type === 'route') {
      return [
        {
          id: section.id,
          type: 'route',
          label: section.label,
          description: section.description ?? '',
          href: section.href
        }
      ];
    }

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

    if (section.type === 'ads') {
      entries.push(
        ...(section.data?.summaryCards ?? []).map((card) => ({
          id: `${section.id}-${card.title}`,
          type: 'card',
          label: `${card.title} • ${card.value}`,
          description: card.helper ?? card.change ?? '',
          targetSection: section.id
        })),
        ...(section.data?.campaigns ?? []).map((campaign) => ({
          id: `${section.id}-${campaign.id ?? campaign.name}`,
          type: 'record',
          label: `${campaign.name} • ${campaign.status ?? ''}`.trim(),
          description: [`ROAS ${campaign.roas ?? '—'}`, campaign.pacing].filter(Boolean).join(' · '),
          targetSection: section.id
        })),
        ...(section.data?.alerts ?? []).map((alert) => ({
          id: `${section.id}-alert-${alert.title ?? alert.detectedAt}`,
          type: 'record',
          label: alert.title ?? 'Alert',
          description: [`${alert.severity ?? ''}`.trim(), alert.description ?? ''].filter(Boolean).join(' • '),
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
  blogPosts = []
}) => {
  const navigation = useMemo(() => dashboard?.navigation ?? [], [dashboard]);
  const firstSectionId = useMemo(() => {
    const first = navigation.find((item) => item.type !== 'route');
    return first?.id ?? navigation[0]?.id ?? 'overview';
  }, [navigation]);
  const [selectedSection, setSelectedSection] = useState(firstSectionId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedSection((current) => {
      const stillValid = navigation.some((item) => item.id === current && item.type !== 'route');
      if (stillValid) {
        return current;
      }
      return firstSectionId;
    });
    setSearchQuery('');
    setSearchResults([]);
  }, [navigation, firstSectionId]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    setMobileNavOpen(false);
  }, [selectedSection, mobileNavOpen]);

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

  const activeSection =
    navigation.find((item) => item.id === selectedSection && item.type !== 'route') ??
    navigation.find((item) => item.type !== 'route') ??
    navigation[0];
  const persona = dashboard?.persona ?? roleMeta.id;
  const shouldShowPersonaSummary = dashboard?.persona === 'user' && activeSection?.id === 'overview';
  const shouldShowServicemanSummary = persona === 'serviceman' && activeSection?.id === 'overview';

  const renderSection = () => {
    if (!activeSection) return null;
    if (activeSection.type === 'overview') {
      return <DashboardOverview analytics={activeSection.analytics} />;
    }
    return (
      <DashboardSection
        section={activeSection}
        persona={persona}
        features={dashboard?.metadata?.features ?? {}}
      />
    );
  };

  const registeredOptions = registeredRoles.filter((role) => role.registered);

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/60 to-white text-primary flex">
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
                <Dialog.Title className="sr-only">Admin navigation</Dialog.Title>
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
                <nav className="mt-8 flex-1 space-y-2 overflow-y-auto">
                  {navigation.map((item) => {
                    const isRoute = item.type === 'route' && item.href;
                    const isActive = !isRoute && item.id === activeSection?.id;
                    const Icon = getNavIcon(item);
                    const content = (
                      <>
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-secondary text-primary group-hover:bg-accent/10 group-hover:text-accent'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{item.label}</p>
                          {item.description ? (
                            <p className="text-xs text-slate-500">{item.description}</p>
                          ) : null}
                        </div>
                      </>
                    );

                    if (isRoute) {
                      return (
                        <Link
                          key={item.id}
                          to={item.href}
                          className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/90 px-4 py-3 text-left text-primary/80 transition hover:border-accent/40 hover:text-primary"
                          onClick={() => setMobileNavOpen(false)}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedSection(item.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-accent bg-accent text-white shadow-glow'
                            : 'border-transparent bg-white/90 text-primary/80 hover:border-accent/40 hover:text-primary'
                        }`}
                        aria-pressed={isActive}
                      >
                        {content}
                      </button>
                    );
                  })}
                </nav>
                <div className="mt-6 space-y-3">
                  <Link
                    to="/"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 hover:border-accent hover:text-primary"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Public site
                  </Link>
                  {onLogout ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileNavOpen(false);
                        onLogout();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:text-rose-800"
                    >
                      <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Sign out
                    </button>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      <aside
        className={`hidden lg:flex ${navCollapsed ? 'w-24' : 'w-80 xl:w-96'} flex-col border-r border-accent/10 bg-gradient-to-b from-white via-secondary/40 to-white transition-[width] duration-300`}
      >
        <div className="flex items-center justify-between border-b border-accent/10 px-6 py-5">
          <Link to="/dashboards" className="flex items-center gap-2 text-primary" title="Dashboard hub">
            <Bars3BottomLeftIcon className="h-6 w-6 text-accent" />
            {!navCollapsed && (
              <div className="leading-tight">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Fixnado</p>
                <p className="text-lg font-semibold">{roleMeta.name}</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setNavCollapsed((value) => !value)}
            className="rounded-full border border-accent/20 bg-white p-2 text-slate-500 transition hover:border-accent hover:text-accent"
            aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Squares2X2Icon className={`h-5 w-5 transition-transform ${navCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const isRoute = item.type === 'route' && item.href;
            const isActive = !isRoute && item.id === activeSection?.id;
            const Icon = getNavIcon(item);
            const content = (
              <>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-secondary text-primary group-hover:bg-accent/10 group-hover:text-accent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {!navCollapsed && (
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
                  </div>
                )}
              </>
            );

            if (isRoute) {
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/80 px-3 py-3 text-left text-primary/80 transition hover:border-accent/40 hover:text-primary ${navCollapsed ? 'justify-center px-2' : ''}`}
                  title={navCollapsed ? item.label : undefined}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSection(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  isActive
                    ? 'border-accent bg-accent text-white shadow-glow'
                    : 'border-transparent bg-white/80 text-primary/80 hover:border-accent/40 hover:text-primary'
                } ${navCollapsed ? 'justify-center px-2' : ''}`}
                title={navCollapsed ? item.label : undefined}
                aria-pressed={isActive}
              >
                {content}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-h-screen">
        <div className="sticky top-0 z-10 border-b border-accent/10 bg-white/90 backdrop-blur px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 shadow-sm transition hover:border-accent hover:text-primary"
              >
                <Bars3BottomLeftIcon className="h-5 w-5 text-accent" /> Menu
              </button>
              {lastRefreshed && (
                <p className="text-xs text-primary/60">Refreshed {formatRelativeTime(lastRefreshed)}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-primary">{activeSection?.label ?? roleMeta.name}</h1>
                <span className="rounded-full border border-slate-200 bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
                  {roleMeta.persona}
                </span>
              </div>
              {lastRefreshed && (
                <p className="hidden text-xs text-primary/60 lg:block">Refreshed {formatRelativeTime(lastRefreshed)}</p>
              )}
              <ToggleSummary toggle={toggleMeta} reason={toggleReason} />
            </div>
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex w-full flex-col gap-2 sm:w-64">
                <label className="text-xs uppercase tracking-wide text-primary/60" htmlFor="roleSwitcher">
                  Switch workspace
                </label>
                <select
                  id="roleSwitcher"
                  value={roleMeta.id}
                  onChange={(event) => navigate(`/dashboards/${event.target.value}`)}
                  className="rounded-xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {registeredOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
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
                              if (result.type === 'route' && result.href) {
                                navigate(result.href);
                              } else if (result.targetSection) {
                                setSelectedSection(result.targetSection);
                              }
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
              <div className="flex flex-wrap gap-2 sm:self-end">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 hover:border-accent hover:text-primary"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Public site
                </Link>
                {onLogout ? (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:text-rose-800"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Sign out
                  </button>
                ) : null}
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
          <div className="space-y-8 px-6 py-10">
            {shouldShowServicemanSummary ? (
              <ServicemanSummary metadata={dashboard?.metadata} windowLabel={dashboard?.window?.label ?? null} />
            ) : null}
            {renderSection()}
            {shouldShowPersonaSummary ? <DashboardPersonaSummary dashboard={dashboard} /> : null}
            {blogPosts.length > 0 ? <DashboardBlogRail posts={blogPosts} /> : null}
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
  )
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
  blogPosts: []
};

export default DashboardLayout;
