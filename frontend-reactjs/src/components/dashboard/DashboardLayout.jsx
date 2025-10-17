import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardSection from './DashboardSection.jsx';
import ServicemanSummary from './ServicemanSummary.jsx';
import DashboardPersonaSummary from './DashboardPersonaSummary.jsx';
import DashboardBlogRail from './DashboardBlogRail.jsx';
import DashboardDetailDrawer from './DashboardDetailDrawer.jsx';
import DashboardWorkspaceModal from './DashboardWorkspaceModal.jsx';
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

const deriveSectionMeta = (section) => {
  if (!section) return [];
  const data = section.data ?? {};
  const meta = [];

  switch (section.type) {
    case 'grid':
      if (Array.isArray(data.cards)) {
        meta.push({ label: 'Cards', value: data.cards.length });
      }
      break;
    case 'board':
      if (Array.isArray(data.columns)) {
        meta.push({ label: 'Columns', value: data.columns.length });
        const totalItems = data.columns.reduce((total, column) => total + (column.items?.length ?? 0), 0);
        meta.push({ label: 'Items', value: totalItems });
      }
      break;
    case 'table':
      if (Array.isArray(data.rows)) {
        meta.push({ label: 'Rows', value: data.rows.length });
      }
      if (Array.isArray(data.headers)) {
        meta.push({ label: 'Columns', value: data.headers.length });
      }
      break;
    case 'list':
      if (Array.isArray(data.items)) {
        meta.push({ label: 'Items', value: data.items.length });
      }
      break;
    case 'availability':
      if (Array.isArray(data.resources)) {
        meta.push({ label: 'Resources', value: data.resources.length });
      }
      break;
    case 'calendar':
      if (Array.isArray(data.events)) {
        meta.push({ label: 'Events', value: data.events.length });
      }
      break;
    case 'inventory':
      if (Array.isArray(data.summary)) {
        meta.push({ label: 'Highlights', value: data.summary.length });
      }
      if (Array.isArray(data.groups)) {
        meta.push({ label: 'Groups', value: data.groups.length });
      }
      break;
    case 'ads':
      if (Array.isArray(data.summaryCards)) {
        meta.push({ label: 'Highlights', value: data.summaryCards.length });
      }
      if (Array.isArray(data.campaigns)) {
        meta.push({ label: 'Campaigns', value: data.campaigns.length });
      }
      break;
    case 'settings':
      if (Array.isArray(data.panels)) {
        meta.push({ label: 'Panels', value: data.panels.length });
      }
      break;
    default:
      break;
  }

  if (section.updatedAt) {
    meta.push({ label: 'Updated', value: section.updatedAt });
  }
  if (section.windowLabel) {
    meta.push({ label: 'Window', value: section.windowLabel });
  }

  return meta;
};

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
  blogPosts = [],
  initialSectionId = null,
  onSectionChange = null
}) => {
  const { panel, closePanel, openPanel } = useDashboardOverlay();
  const drawerPanel = panel?.variant === 'drawer' ? panel : null;
  const workspacePanel = panel?.variant === 'workspace' ? panel : null;
  const persona = dashboard?.persona ?? roleMeta.id;
  const fallbackNavigation = useMemo(() => roleMeta?.navigation ?? [], [roleMeta]);
  const rawNavigation = useMemo(() => dashboard?.navigation ?? [], [dashboard]);
  const navigationWithMenu = useMemo(
    () => combineNavigation(persona, rawNavigation, fallbackNavigation),
    [persona, rawNavigation, fallbackNavigation]
  );
  const [selectedSection, setSelectedSection] = useState(() => {
    if (initialSectionId && navigationWithMenu.some((item) => item.id === initialSectionId)) {
      return initialSectionId;
    }

    return navigationWithMenu[0]?.id ?? 'overview';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectSection = useCallback(
    (sectionId, { silent = false } = {}) => {
      if (!sectionId) {
        return;
      }

      setSelectedSection((current) => {
        if (current === sectionId) {
          return current;
        }

        if (!silent && onSectionChange) {
          onSectionChange(sectionId);
        }

        return sectionId;
      });
    },
    [onSectionChange]
  );

  useEffect(() => {
    const fallbackId = navigationWithMenu[0]?.id ?? 'overview';
    if (!fallbackId && !initialSectionId) {
      return;
    }

    const hasInitial = initialSectionId
      ? navigationWithMenu.some((item) => item.id === initialSectionId)
      : false;
    const nextId = hasInitial ? initialSectionId : fallbackId;

    handleSelectSection(nextId, { silent: hasInitial });
    setSearchQuery('');
    setSearchResults([]);
  }, [navigationWithMenu, initialSectionId, handleSelectSection]);

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

  const renderSection = useCallback(() => {
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
  }, [activeSection, dashboard?.metadata?.features, persona]);

  const sectionMeta = useMemo(() => deriveSectionMeta(activeSection), [activeSection]);

  const handleOpenWorkspace = useCallback(() => {
    if (!activeSection) {
      return;
    }

    openPanel({
      variant: 'workspace',
      size: 'full',
      title: activeSection.label ?? roleMeta.name,
      subtitle: roleMeta.name,
      meta: sectionMeta,
      body: <div className="space-y-6">{renderSection()}</div>
    });
  }, [activeSection, openPanel, renderSection, roleMeta.name, sectionMeta]);

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
        onSelectSection={handleSelectSection}
        onLogout={onLogout}
      />
      <DashboardNavigationSidebar
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed((value) => !value)}
        roleMeta={roleMeta}
        navigation={navigationWithMenu}
        activeSectionId={activeSection?.id}
        onSelectSection={handleSelectSection}
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
            handleSelectSection(result.targetSection);
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
          onOpenWorkspace={activeSection ? handleOpenWorkspace : null}
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
      <DashboardDetailDrawer panel={drawerPanel} onClose={closePanel} />
      <DashboardWorkspaceModal panel={workspacePanel} onClose={closePanel} />
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
  ),
  initialSectionId: PropTypes.string,
  onSectionChange: PropTypes.func
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
  blogPosts: [],
  initialSectionId: null,
  onSectionChange: null
};

DashboardLayout.propTypes = DashboardLayoutInner.propTypes;
DashboardLayout.defaultProps = DashboardLayoutInner.defaultProps;

export default DashboardLayout;
