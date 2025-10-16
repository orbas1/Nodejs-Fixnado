import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  bucket: 'Bucket',
  route: 'Workspace',
  board: 'Board',
  listing: 'Listing',
  category: 'Category',
  package: 'Package'
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
  builder: PaintBrushIcon,
  seo: TagIcon
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

const buildSearchIndex = (navigation = []) =>
  navigation.flatMap((section) => {
    if (!section) {
      return [];
    }

    if (section.type === 'route' && (section.href || section.route)) {
      return [
        {
          id: section.id,
          type: 'route',
          label: section.label,
          description: section.description ?? '',
          href: section.route || section.href
        }
      ];
    }

    if (section.type === 'link' && section.href) {
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

    if (section.href) {
      return [];
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

    if (Array.isArray(section.searchable)) {
      entries.push(
        ...section.searchable.map((item) => ({
          id: `${section.id}-${item.id ?? item.label}`,
          type: item.type ?? 'configuration',
          label: item.label,
          description: item.description ?? '',
          targetSection: item.targetSection ?? section.id
        }))
      );
    }

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

    if (section.type === 'dispute-workspace' && Array.isArray(section.data?.snapshot)) {
      section.data.snapshot.forEach((bucket) => {
        entries.push({
          id: `${section.id}-${bucket.id ?? bucket.label}`,
          type: 'bucket',
          label: `${bucket.label} • Disputes`,
          description: bucket.commentary ?? '',
          targetSection: section.id
        });
      });
    }

    if (section.type === 'compliance-controls' && Array.isArray(section.data?.controls)) {
      entries.push(
        ...section.data.controls.map((control) => ({
          id: `${section.id}-${control.id ?? control.title}`,
          type: 'record',
          label: control.title,
          description: [control.ownerTeam || control.owner?.name || '', control.reviewFrequency || '']
            .filter(Boolean)
            .join(' • '),
          targetSection: section.id
        }))
      );
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

    if (section.type === 'operations-queues' && Array.isArray(section.data?.boards)) {
      section.data.boards.forEach((board) => {
        entries.push({
          id: `${section.id}-${board.id}`,
          type: 'board',
          label: `${board.title} • ${section.label}`,
          description: [board.summary, board.owner].filter(Boolean).join(' • '),
          targetSection: section.id
        });
        (board.updates ?? []).forEach((update) => {
          entries.push({
            id: `${section.id}-${board.id}-${update.id}`,
            type: 'item',
            label: update.headline,
            description: [update.body, formatRelativeTime(update.recordedAt)].filter(Boolean).join(' • '),
            targetSection: section.id
          });
        });
      });
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

    if (section.type === 'services-management' && Array.isArray(section.data?.orders)) {
      entries.push(
        ...section.data.orders.map((order) => ({
          id: `${section.id}-${order.id}`,
          type: 'record',
          label: order.service?.title ?? `Order ${order.id?.slice?.(0, 6) ?? ''}`,
          description: [order.status, order.escrow?.status, order.booking?.zoneId]
            .filter(Boolean)
            .join(' • '),
          targetSection: section.id
        }))
      );
    }

    if (section.type === 'service-management') {
      const categories = Array.isArray(section.data?.categories) ? section.data.categories : [];
      const listings = Array.isArray(section.data?.catalogue) ? section.data.catalogue : [];
      const packages = Array.isArray(section.data?.packages) ? section.data.packages : [];

      categories.forEach((category) => {
        entries.push({
          id: `${section.id}-category-${category.id}`,
          type: 'category',
          label: `${category.name} • Category`,
          description: category.description ?? '',
          targetSection: section.id
        });
      });

      listings.forEach((listing) => {
        entries.push({
          id: `${section.id}-listing-${listing.id}`,
          type: 'listing',
          label: listing.title,
          description: [listing.category ?? 'Uncategorised', listing.status ?? 'draft']
            .filter(Boolean)
            .join(' • '),
          targetSection: section.id
        });
      });

      packages.forEach((pkg) => {
        entries.push({
          id: `${section.id}-package-${pkg.id}`,
          type: 'package',
          label: `${pkg.name ?? pkg.title} • Package`,
          description: pkg.description ?? '',
          targetSection: section.id
        });
      });
    }

    if (section.type === 'marketplace-workspace' && section.data?.summary) {
      const { tools = {}, materials = {}, moderationQueue = 0 } = section.data.summary;
      entries.push(
        {
          id: `${section.id}-tools-summary`,
          type: 'record',
          label: `${tools.count ?? 0} tools catalogued`,
          description: `${tools.available ?? 0} available • ${tools.alerts ?? 0} alerts`,
          targetSection: section.id
        },
        {
          id: `${section.id}-materials-summary`,
          type: 'record',
          label: `${materials.count ?? 0} materials tracked`,
          description: `${materials.available ?? 0} ready • ${materials.alerts ?? 0} alerts`,
          targetSection: section.id
        },
        {
          id: `${section.id}-moderation-summary`,
          type: 'record',
          label: `${moderationQueue} listings pending review`,
          description: moderationQueue > 0 ? 'Moderation queue active' : 'Queue clear',
          targetSection: section.id
        }
      );
    }

    if (section.type === 'wallet') {
      entries.push(
        {
          id: `${section.id}-summary`,
          type: 'panel',
          label: 'Wallet summary',
          description: 'Balance, holds, and autopayout status',
          targetSection: section.id
        },
        {
          id: `${section.id}-transactions`,
          type: 'record',
          label: 'Wallet transactions',
          description: 'Recent manual adjustments and automation events',
          targetSection: section.id
        },
        {
          id: `${section.id}-methods`,
          type: 'record',
          label: 'Wallet payment methods',
          description: 'Configured payout destinations',
          targetSection: section.id
        }
      );
    }

    if (section.type === 'provider-inbox') {
      entries.push(
        {
          id: `${section.id}-routing`,
          type: 'configuration',
          label: 'Routing controls',
          description: 'Live routing, quiet hours, and timezone',
          targetSection: section.id
        },
        {
          id: `${section.id}-entry-points`,
          type: 'record',
          label: 'Entry points',
          description: 'Channels and widgets connected to the inbox',
          targetSection: section.id
        },
        {
          id: `${section.id}-escalations`,
          type: 'record',
          label: 'Escalation guardrails',
          description: 'Automation rules that notify specialists',
          targetSection: section.id
        }
      );
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
  const sidebarLinks = useMemo(() => dashboard?.sidebarLinks ?? [], [dashboard]);
  const contentSections = useMemo(
    () => navigation.filter((item) => !item?.href && item?.type !== 'route'),
    [navigation]
  );
  const resolvedInitialSection = useMemo(() => {
    if (initialSectionId && contentSections.some((item) => item.id === initialSectionId)) {
      return initialSectionId;
    }
    return contentSections[0]?.id ?? navigation.find((item) => !item?.href)?.id ?? navigation[0]?.id ?? 'overview';
  }, [initialSectionId, contentSections, navigation]);

  const [selectedSection, setSelectedSection] = useState(resolvedInitialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSelectedSection(resolvedInitialSection);
    setSearchQuery('');
    setSearchResults([]);
  }, [resolvedInitialSection]);

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
      searchIndex
        .filter(
          (entry) =>
            entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered)
        )
        .slice(0, 8)
    );
  }, [searchQuery, searchIndex]);

  const activeSection = contentSections.find((item) => item.id === selectedSection) ?? contentSections[0] ?? null;
  const persona = dashboard?.persona ?? roleMeta.id;
  const shouldShowPersonaSummary = dashboard?.persona === 'user' && activeSection?.id === 'overview';
  const shouldShowServicemanSummary = persona === 'serviceman' && activeSection?.id === 'overview';

  const handleSectionSelect = useCallback(
    (sectionId) => {
      setSelectedSection(sectionId);
      setMobileNavOpen(false);
      if (onSectionChange) {
        onSectionChange(sectionId);
      }
    },
    [onSectionChange]
  );

  const handleNavActivate = useCallback(
    (item) => {
      if (!item) return;
      const destination = item.route || item.href;
      if ((item.type === 'route' || item.type === 'link' || destination) && destination) {
        navigate(destination);
        setMobileNavOpen(false);
        return;
      }
      handleSectionSelect(item.id);
    },
    [handleSectionSelect, navigate]
  );

  const handleSearchActivate = useCallback(
    (result) => {
      if (!result) return;
      if (result.href) {
        navigate(result.href);
        setSearchQuery('');
        setSearchResults([]);
        return;
      }
      if (result.targetSection) {
        handleSectionSelect(result.targetSection);
        setSearchQuery('');
        setSearchResults([]);
      }
    },
    [handleSectionSelect, navigate]
  );

  const renderSection = () => {
    if (!activeSection) return null;
    if (activeSection.type === 'overview') {
      return (
        <div className="space-y-10">
          <DashboardOverview analytics={activeSection.analytics} />
          {persona === 'user' ? <CustomerOverviewControl /> : null}
        </div>
      );
    }
    return (
      <DashboardSection
        section={activeSection}
        persona={persona}
        features={dashboard?.metadata?.features ?? {}}
        context={dashboard?.metadata ?? {}}
      />
    );
  };

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
                    const Icon = getNavIcon(item);
                    const destination = item.route || item.href;
                    const isLink = Boolean(destination);
                    const isLinkActive = isLink && location.pathname === destination;
                    const isSectionActive = !isLink && item.id === activeSection?.id;
                    const active = isLink ? isLinkActive : isSectionActive;
                    const baseClasses = `group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-accent bg-accent text-white shadow-glow'
                        : 'border-transparent bg-white/90 text-primary/80 hover:border-accent/40 hover:text-primary'
                    }`;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavActivate(item)}
                        className={baseClasses}
                        aria-pressed={active || undefined}
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-secondary text-primary group-hover:bg-accent/10 group-hover:text-accent'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                          <p className="flex items-center gap-2 text-sm font-semibold">
                            {item.label}
                            {isLink ? (
                              <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            ) : null}
                          </p>
                          {item.description ? (
                            <p className="text-xs text-slate-500">{item.description}</p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                  {sidebarLinks.length ? (
                    <div className="mt-6 space-y-2">
                      <p className="px-1 text-xs uppercase tracking-[0.2em] text-slate-400">Workspace shortcuts</p>
                      {sidebarLinks.map((link) => (
                        <Link
                          key={link.id}
                          to={link.href}
                          onClick={() => setMobileNavOpen(false)}
                          className="flex w-full items-center justify-between rounded-xl border border-accent/20 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:border-accent hover:text-accent"
                        >
                          <span>{link.label}</span>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  ) : null}
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
            const Icon = getNavIcon(item);
            const destination = item.route || item.href;
            const isLink = Boolean(destination);
            const isLinkActive = isLink && location.pathname === destination;
            const isSectionActive = !isLink && item.id === activeSection?.id;
            const active = isLink ? isLinkActive : isSectionActive;
            const baseClass = `group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
              active
                ? 'border-accent bg-accent text-white shadow-glow'
                : 'border-transparent bg-white/80 text-primary/80 hover:border-accent/40 hover:text-primary'
            } ${navCollapsed ? 'justify-center px-2' : ''}`;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavActivate(item)}
                className={baseClass}
                title={navCollapsed ? item.label : undefined}
                aria-pressed={active || undefined}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-secondary text-primary group-hover:bg-accent/10 group-hover:text-accent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {!navCollapsed && (
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {item.label}
                      {isLink ? (
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      ) : null}
                    </p>
                    {item.description ? (
                      <p className="text-xs text-slate-500">{item.description}</p>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
        {!navCollapsed && sidebarLinks.length ? (
          <div className="border-t border-accent/10 px-6 py-5 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace shortcuts</p>
            {sidebarLinks.map((link) => (
              <Link
                key={link.id}
                to={link.href}
                className="flex w-full items-center justify-between rounded-xl border border-accent/20 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:border-accent hover:text-accent"
              >
                <span>{link.label}</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        ) : null}
        <div className="border-t border-accent/10 px-6 py-5 space-y-3">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-2 text-sm font-semibold text-primary/80 hover:border-accent hover:text-primary"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Public site
          </Link>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:text-rose-800"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" /> Sign out
            </button>
          ) : null}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-accent/10 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{roleMeta.headline ?? 'Control centre'}</p>
                <h1 className="text-3xl font-semibold text-primary">{dashboard?.title ?? `${roleMeta.name} dashboard`}</h1>
                {dashboard?.description ? (
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">{dashboard.description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {dashboard?.window?.label ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 font-semibold text-primary/70">
                    <CalendarDaysIcon className="h-4 w-4 text-accent" /> {dashboard.window.label}
                  </span>
                ) : null}
                {lastRefreshed ? <span>Updated {formatRelativeTime(lastRefreshed)}</span> : null}
                {toggleMeta ? <ToggleSummary toggle={toggleMeta} reason={toggleReason} /> : null}
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-end sm:gap-6">
              <div className="relative max-w-md flex-1">
                <label htmlFor="dashboard-search" className="sr-only">
                  Search dashboard
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="dashboard-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search sections, cards, and records"
                    className="w-full rounded-full border border-accent/20 bg-white py-2 pl-10 pr-4 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-accent/10 bg-white/95 p-2 shadow-xl">
                    <ul className="max-h-72 space-y-1 overflow-y-auto">
                      {searchResults.map((result) => (
                        <li key={result.id}>
                          <button
                            type="button"
                            onClick={() => handleSearchActivate(result)}
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
  dashboard: PropTypes.shape({
    navigation: PropTypes.array,
    sidebarLinks: PropTypes.array,
    window: PropTypes.object,
    metadata: PropTypes.object,
    persona: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string
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
