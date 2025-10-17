import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardSection from './DashboardSection.jsx';
import ServicemanSummary from './ServicemanSummary.jsx';
import DashboardPersonaSummary from './DashboardPersonaSummary.jsx';
import DashboardBlogRail from './DashboardBlogRail.jsx';
import DashboardDetailDrawer from './DashboardDetailDrawer.jsx';
import { DashboardOverlayProvider, useDashboardOverlay } from './DashboardOverlayContext.jsx';
import DashboardHeaderBar from './DashboardHeaderBar.jsx';
import DashboardNavigationDrawer from './navigation/DashboardNavigationDrawer.jsx';
import DashboardNavigationSidebar from './navigation/DashboardNavigationSidebar.jsx';
import { DASHBOARD_MENU_OVERRIDES } from '../../constants/dashboard/navigation/menuOverrides.js';


const deriveMenuLabel = (item) => {
  if (item?.menuLabel) {
    return item.menuLabel;
  }

  if (item?.id) {
    const idToken = item.id
      .split(/[-_]/)
      .filter(Boolean)
      .find((token) => token.length > 2) ?? item.id;
    if (idToken) {
      const formatted = idToken.charAt(0).toUpperCase() + idToken.slice(1);
      return formatted.length > 12 ? `${formatted.slice(0, 10)}…` : formatted;
    }
  }

  if (!item?.label) {
    return 'Home';
  }

  const labelToken = item.label
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(-1)[0];

  if (!labelToken) {
    return item.label;
  }

  return labelToken.length > 12 ? `${labelToken.slice(0, 10)}…` : labelToken;
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

const combineNavigation = (persona, rawNavigation, fallbackNavigation) => {
  const overrides = DASHBOARD_MENU_OVERRIDES[persona] ?? {};
  const merged = [];
  const seen = new Set();

  const pushItem = (item) => {
    if (!item || !item.id || seen.has(item.id)) {
      return;
    }

    const override = overrides[item.id] ?? {};
    const base = { ...item, ...override };
    merged.push({
      ...base,
      menuLabel: override.menuLabel ?? item.menuLabel ?? deriveMenuLabel(base),
      icon: base.icon,
      href: base.href,
      label: base.label ?? item.label
    });
    seen.add(item.id);
  };

  fallbackNavigation.forEach((item) => {
    if (!item || !item.id) {
      return;
    }

    const apiSection = rawNavigation.find((section) => section.id === item.id);
    pushItem({ ...item, ...(apiSection ?? {}) });
  });

  rawNavigation.forEach((item) => pushItem(item));

  return merged;
};

const Skeleton = () => (
  <div className="px-8 py-12">
    <div className="mx-auto w-full max-w-7xl space-y-6">
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
  <div className="px-8 py-12">
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

const DashboardLayoutInner = ({
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
  const { panel, closePanel } = useDashboardOverlay();
  const persona = dashboard?.persona ?? roleMeta.id;
  const fallbackNavigation = useMemo(() => roleMeta?.navigation ?? [], [roleMeta]);
  const rawNavigation = useMemo(() => dashboard?.navigation ?? [], [dashboard]);
  const navigationWithMenu = useMemo(
    () => combineNavigation(persona, rawNavigation, fallbackNavigation),
    [persona, rawNavigation, fallbackNavigation]
  );
  const [selectedSection, setSelectedSection] = useState(navigationWithMenu[0]?.id ?? 'overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedSection(navigationWithMenu[0]?.id ?? 'overview');
    setSearchQuery('');
    setSearchResults([]);
  }, [navigationWithMenu]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    setMobileNavOpen(false);
  }, [selectedSection, mobileNavOpen]);

  const searchIndex = useMemo(() => buildSearchIndex(navigationWithMenu), [navigationWithMenu]);

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
    navigationWithMenu.find((item) => item.id === selectedSection) ?? navigationWithMenu[0];
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
  const relativeLastRefreshed = formatRelativeTime(lastRefreshed);

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/60 to-white text-primary flex">
      <DashboardNavigationDrawer
        open={mobileNavOpen}
        onClose={setMobileNavOpen}
        roleMeta={roleMeta}
        navigation={navigationWithMenu}
        activeSectionId={activeSection?.id}
        onSelectSection={setSelectedSection}
        onLogout={onLogout}
      />
      <DashboardNavigationSidebar
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed((value) => !value)}
        roleMeta={roleMeta}
        navigation={navigationWithMenu}
        activeSectionId={activeSection?.id}
        onSelectSection={setSelectedSection}
      />

      <main className="flex-1 min-h-screen">
        <DashboardHeaderBar
          activeSection={activeSection}
          persona={roleMeta.persona}
          roleMeta={roleMeta}
          lastRefreshedLabel={relativeLastRefreshed}
          toggleMeta={toggleMeta}
          toggleReason={toggleReason}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          onSelectResult={(result) => {
            setSelectedSection(result.targetSection);
            setSearchQuery('');
            setSearchResults([]);
          }}
          registeredRoles={registeredOptions}
          onSwitchRole={(roleId) => navigate(`/dashboards/${roleId}`)}
          onRefresh={onRefresh}
          loading={loading}
          exportHref={exportHref}
          onLogout={onLogout}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {loading && !dashboard ? (
          <Skeleton />
        ) : (
          <div className="mx-auto w-full max-w-7xl space-y-10 px-8 py-12">
            {shouldShowServicemanSummary ? (
              <ServicemanSummary metadata={dashboard?.metadata} windowLabel={dashboard?.window?.label ?? null} />
            ) : null}
            {renderSection()}
            {shouldShowPersonaSummary ? <DashboardPersonaSummary dashboard={dashboard} /> : null}
            {blogPosts.length > 0 ? <DashboardBlogRail posts={blogPosts} /> : null}
          </div>
        )}
      </main>
      <DashboardDetailDrawer panel={panel} onClose={closePanel} />
    </div>
  );
};

const DashboardLayout = (props) => (
  <DashboardOverlayProvider>
    <DashboardLayoutInner {...props} />
  </DashboardOverlayProvider>
);

DashboardLayoutInner.propTypes = {
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

DashboardLayoutInner.defaultProps = {
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

DashboardLayout.propTypes = DashboardLayoutInner.propTypes;
DashboardLayout.defaultProps = DashboardLayoutInner.defaultProps;

export default DashboardLayout;
