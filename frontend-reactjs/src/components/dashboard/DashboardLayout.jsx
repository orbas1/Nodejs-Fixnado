import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  Bars3BottomLeftIcon,
  BoltIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
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
    TagIcon,
    KeyIcon
  } from '@heroicons/react/24/outline';
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  Cog8ToothIcon,
  CubeIcon,
  QueueListIcon,
  PaintBrushIcon,
  TagIcon,
  BuildingStorefrontIcon
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
  QueueListIcon,
  PaintBrushIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import DashboardOverview from './DashboardOverview.jsx';
import { ServicemanOverviewModule } from '../../features/servicemanControlCentre/index.js';
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
import ServicemanDisputeWorkspace from '../servicemanControl/ServicemanDisputeWorkspace.jsx';
import ProviderDisputesWorkspace from '../../modules/providerDisputes/ProviderDisputesWorkspace.jsx';

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
  route: 'Workspace',
  board: 'Board',
  listing: 'Listing',
  category: 'Category',
  package: 'Package'
  panel: 'Panel',
  bucket: 'Bucket',
  route: 'Workspace'
};

export default function DashboardLayout({
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
  seo: TagIcon,
  byok: KeyIcon
  builder: PaintBrushIcon,
  seo: TagIcon,
  storefront: BuildingStorefrontIcon
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
  dashboard = null,
  loading = false,
  error = null,
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
  const [selectedSection, setSelectedSection] = useState(() => resolveInitialSection(navigation, initialSectionId));
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
    const matches = searchIndex.filter(
      (entry) => entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered)
    setSearchResults(
      searchIndex
        .filter(
          (entry) =>
            entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered)
        )
        .filter((entry) => entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered))
        .slice(0, 8)
    );
    setSearchResults(matches.slice(0, 12));
  }, [searchQuery, searchIndex]);

  const activeSection = contentSections.find((item) => item.id === selectedSection) ?? contentSections[0] ?? null;
  const persona = dashboard?.persona ?? roleMeta.id;
  const shouldShowPersonaSummary = dashboard?.persona === 'user' && activeSection?.id === 'overview';
  const shouldShowServicemanSummary = persona === 'serviceman' && activeSection?.id === 'overview';

  const handleSectionSelect = useCallback(
    (sectionId) => {
      setSelectedSection(sectionId);
      setMobileNavOpen(false);
  const handleSectionSelect = useCallback(
    (sectionId) => {
      setSelectedSection(sectionId);
      setSearchQuery('');
      setSearchResults([]);
      setMobileNavOpen(false);
      setMobileNavOpen(false);
      setSearchQuery('');
      setSearchResults([]);
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
  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (searchResults.length > 0) {
        handleSectionSelect(searchResults[0].sectionId);
      }
    },
    [handleSectionSelect, searchResults]
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
    if (!activeSection) {
      return null;
    }
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
      if (persona === 'serviceman') {
        return (
          <ServicemanOverviewModule analytics={activeSection.analytics} metadata={dashboard?.metadata} />
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

    if (activeSection.id === 'customer-control') {
      return <CustomerOverviewControl />;
    }

    if (activeSection.id === 'serviceman-disputes') {
      return <ServicemanDisputeWorkspace />;
    }

    if (activeSection.id === 'provider-disputes') {
      return <ProviderDisputesWorkspace />;
    }

    if (activeSection.component) {
      const Component = activeSection.component;
      return <Component {...(activeSection.componentProps ?? {})} />;
    }

    if (activeSection.id === 'customer-control') {
      return <CustomerOverviewControl />;
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

  const registeredOptions = useMemo(
    () => registeredRoles.filter((role) => role.registered),
    [registeredRoles]
  );

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
                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-primary"
                    aria-label="Close navigation"
                  >
                    ✕
                  </button>
                </div>

                <nav className="mt-6 space-y-1">
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

      <aside className="hidden w-72 flex-col border-r border-white/50 bg-white/70 px-6 py-8 lg:flex">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Persona</p>
          <p className="text-lg font-semibold text-primary">{roleMeta?.name ?? 'Dashboard'}</p>
          <p className="text-sm text-slate-500">{roleMeta?.headline}</p>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
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
                            onClick={() => handleSearchActivate(result)}
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
}

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
    metadata: PropTypes.object,
    window: PropTypes.object
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
