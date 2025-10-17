import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import { buildExportUrl, fetchDashboard } from '../api/analyticsDashboardClient.js';
import { fetchDashboardBlogPosts } from '../api/blogClient.js';
import DashboardAccessGate from '../components/dashboard/DashboardAccessGate.jsx';
import { useFeatureToggle } from '../providers/FeatureToggleProvider.jsx';
import DashboardUnauthorized from '../components/dashboard/DashboardUnauthorized.jsx';
import { usePersonaAccess } from '../hooks/usePersonaAccess.js';
import ServicemanCustomJobsWorkspace from '../features/servicemanCustomJobs/ServicemanCustomJobsWorkspace.jsx';

const RoleDashboard = () => {
  const { roleId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleMeta = DASHBOARD_ROLES.find((role) => role.id === roleId) || null;
  const registeredRoles = useMemo(() => DASHBOARD_ROLES.filter((role) => role.registered), []);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [unauthorised, setUnauthorised] = useState(false);

  const { hasAccess, refresh: refreshPersonaAccess } = usePersonaAccess();
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const toggleOptions = useMemo(
    () => ({
      scope: roleMeta?.id ?? 'global',
      fallback: true,
      allowStaging: import.meta.env.MODE !== 'production'
    }),
    [roleMeta?.id]
  );

  const {
    enabled: toggleEnabled,
    loading: toggleLoading,
    reason: toggleReason,
    toggle,
    cohort,
    refresh: refreshToggles
  } = useFeatureToggle('analytics-dashboards', toggleOptions);

  const query = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    if (!params.timezone) {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          params.timezone = tz;
        }
      } catch (caught) {
        console.warn('Failed to determine timezone', caught);
        params.timezone = 'Europe/London';
      }
    }
    return params;
  }, [searchParams]);

  const initialSectionId = useMemo(() => {
    const sectionParam = searchParams.get('section');
    return sectionParam && sectionParam.trim().length > 0 ? sectionParam : null;
  }, [searchParams]);

  const hydrateBlogRail = useCallback(async () => {
    try {
      const posts = await fetchDashboardBlogPosts({ limit: 6 });
      setBlogPosts(Array.isArray(posts) ? posts : []);
    } catch (caught) {
      console.warn('Failed to load dashboard blog posts', caught);
      setBlogPosts([]);
    }
  }, []);

  const abortActiveRequest = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const runDashboardFetch = useCallback(
    async ({ silent = false } = {}) => {
      const persona = roleMeta?.id ?? null;

      if (!roleMeta?.registered || !persona) {
        setDashboard(null);
        setLastRefreshed(null);
        setError(null);
        setBlogPosts([]);
        setUnauthorised(false);
        setLoading(false);
        return { status: 'unavailable' };
      }

      if (toggleEnabled === false) {
        setDashboard(null);
        setLastRefreshed(null);
        setError(null);
        setUnauthorised(false);
        setLoading(false);
        setBlogPosts([]);
        return { status: 'feature-disabled' };
      }

      if (!hasAccess(persona)) {
        setDashboard(null);
        setLastRefreshed(null);
        setError(null);
        setUnauthorised(true);
        setLoading(false);
        setBlogPosts([]);
        try {
          refreshPersonaAccess();
        } catch (caught) {
          console.warn('Failed to refresh persona access state', caught);
        }
        return { status: 'unauthorised' };
      }

      if (!silent) {
        setLoading(true);
      }

      abortActiveRequest();
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      try {
        const data = await fetchDashboard(persona, query, { signal: controller.signal });
        if (requestIdRef.current !== requestId) {
          return { status: 'stale' };
        }

        setDashboard(data);
        setError(null);
        setUnauthorised(false);
        setLastRefreshed(new Date().toISOString());
        hydrateBlogRail();
        return { status: 'resolved' };
      } catch (caught) {
        if (controller.signal.aborted || caught?.name === 'AbortError') {
          return { status: 'aborted' };
        }

        if (requestIdRef.current !== requestId) {
          return { status: 'stale' };
        }

        if (caught?.status === 401 || caught?.status === 403) {
          setDashboard(null);
          setLastRefreshed(null);
          setError(null);
          setUnauthorised(true);
          try {
            refreshPersonaAccess();
          } catch (refreshError) {
            console.warn('Failed to refresh persona access after unauthorised response', refreshError);
          }
          return { status: 'unauthorised' };
        }

        setDashboard(null);
        setBlogPosts([]);
        setLastRefreshed(null);
        setUnauthorised(false);
        setError(caught instanceof Error ? caught.message : 'Failed to load dashboard');
        return { status: 'error', error: caught };
      } finally {
        if (requestIdRef.current === requestId) {
          controllerRef.current = null;
          setLoading(false);
        }
      }
    },
    [
      abortActiveRequest,
      hasAccess,
      hydrateBlogRail,
      query,
      refreshPersonaAccess,
      roleMeta,
      toggleEnabled
    ]
  );

  useEffect(() => {
    runDashboardFetch({ silent: false });
    return () => {
      abortActiveRequest();
    };
  }, [runDashboardFetch, abortActiveRequest]);

  useEffect(() => {
    if (toggleEnabled === false && !toggleLoading) {
      setDashboard(null);
      setLastRefreshed(null);
      setError(null);
      setBlogPosts([]);
      setUnauthorised(false);
      setLoading(false);
    }
  }, [toggleEnabled, toggleLoading]);

  const handleRefresh = useCallback(async () => {
    if (toggleEnabled === false) {
      try {
        await refreshToggles({ force: true });
      } catch (caught) {
        console.error('Failed to refresh feature toggles', caught);
      }
      return;
    }

    const result = await runDashboardFetch({ silent: false });
    if (result.status === 'unauthorised') {
      refreshPersonaAccess();
    }
  }, [refreshPersonaAccess, refreshToggles, runDashboardFetch, toggleEnabled]);

  const enhancedDashboard = useMemo(() => {
    if (!dashboard || !Array.isArray(dashboard.navigation)) {
      return dashboard;
    }

    const navigation = dashboard.navigation.map((item) => {
      if (item?.type === 'component' && item.componentKey === 'serviceman-custom-jobs') {
        const snapshot = item.data ?? {};
        return {
          ...item,
          component: ServicemanCustomJobsWorkspace,
          componentProps: {
            summary: snapshot.summary ?? null,
            board: snapshot.board ?? null
          }
        };
      }

      return item;
    });

    return { ...dashboard, navigation };
  }, [dashboard]);

  if (!roleMeta) {
    return <Navigate to="/dashboards" replace />;
  }

  if (!roleMeta.registered) {
    return <Navigate to="/dashboards" replace />;
  }

  if (!toggleLoading && toggleEnabled === false) {
    return (
      <DashboardAccessGate
        roleMeta={roleMeta}
        toggle={toggle}
        reason={toggleReason}
        cohort={cohort}
        onRetry={() => {
          refreshToggles({ force: true }).catch((caught) => {
            console.error('Failed to refresh feature toggles', caught);
          });
        }}
      />
    );
  }

  if (unauthorised && roleMeta) {
    return (
      <DashboardUnauthorized
        roleMeta={roleMeta}
        onNavigateHome={() => navigate('/dashboards')}
        onRetry={() => {
          refreshPersonaAccess();
          runDashboardFetch({ silent: false });
        }}
      />
    );
  }

  return (
    <DashboardLayout
      roleMeta={roleMeta}
      registeredRoles={registeredRoles}
      dashboard={enhancedDashboard}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      lastRefreshed={lastRefreshed}
      exportHref={buildExportUrl(roleMeta.id, query)}
      toggleMeta={toggle}
      toggleReason={toggleReason}
      blogPosts={blogPosts}
      initialSectionId={initialSectionId ?? undefined}
      onSectionChange={(nextSection) => {
        if (!nextSection) return;
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          if (next.get('section') === nextSection) {
            return next;
          }
          next.set('section', nextSection);
          return next;
        });
      }}
    />
  );
};

export default RoleDashboard;
