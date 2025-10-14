import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import { buildExportUrl, fetchDashboard } from '../api/analyticsDashboardClient.js';
import { fetchDashboardBlogPosts } from '../api/blogClient.js';
import DashboardAccessGate from '../components/dashboard/DashboardAccessGate.jsx';
import { useFeatureToggle } from '../providers/FeatureToggleProvider.jsx';
import DashboardUnauthorized from '../components/dashboard/DashboardUnauthorized.jsx';
import { usePersonaAccess } from '../hooks/usePersonaAccess.js';

const RoleDashboard = () => {
  const { roleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleMeta = DASHBOARD_ROLES.find((role) => role.id === roleId);
  const registeredRoles = DASHBOARD_ROLES.filter((role) => role.registered);
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

  const hydrateBlogRail = useCallback(async () => {
    try {
      const posts = await fetchDashboardBlogPosts({ limit: 6 });
      setBlogPosts(Array.isArray(posts) ? posts : []);
    } catch (caught) {
      console.warn('Failed to load dashboard blog posts', caught);
      setBlogPosts([]);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!roleMeta?.registered || toggleEnabled === false) {
      setLoading(false);
      return;
    }
    if (!hasAccess(roleMeta.id)) {
      setDashboard(null);
      setLoading(false);
      setError(null);
      setUnauthorised(true);
      setBlogPosts([]);
      return;
    }
    setUnauthorised(false);
    setLoading(true);
    try {
      const data = await fetchDashboard(roleMeta.id, query);
      setDashboard(data);
      setError(null);
      setLastRefreshed(new Date().toISOString());
      hydrateBlogRail();
    } catch (caught) {
      if (caught?.status === 403) {
        setUnauthorised(true);
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
        abortActiveRequest();
        setDashboard(null);
        setLastRefreshed(null);
        setError(null);
        setBlogPosts([]);
      } else {
        setError(caught instanceof Error ? caught.message : 'Failed to load dashboard');
        setDashboard(null);
        setBlogPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [roleMeta, query, toggleEnabled, hasAccess, hydrateBlogRail]);

  useEffect(() => {
    let active = true;
    if (!roleMeta?.registered || toggleEnabled === false) {
      setLoading(false);
      setDashboard(null);
      setBlogPosts([]);
      return () => {
        active = false;
      };
    }
        setUnauthorised(false);
        setLoading(false);
        return { status: 'unavailable' };
      }

      if (toggleEnabled === false) {
        abortActiveRequest();
        setDashboard(null);
        setLastRefreshed(null);
        setError(null);
        setUnauthorised(false);
        setLoading(false);
        return { status: 'feature-disabled' };
      }

      if (!hasAccess(persona)) {
        abortActiveRequest();
        setDashboard(null);
        setLastRefreshed(null);
        setError(null);
        setUnauthorised(true);
        setLoading(false);
        return { status: 'unauthorised' };
      }

      setUnauthorised(false);
      setError(null);
      setLoading(false);
      setUnauthorised(true);
      setBlogPosts([]);
      return () => {
        active = false;
      };
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
          setLoading(false);
          controllerRef.current = null;
        }
      }
    },
    [abortActiveRequest, hasAccess, query, roleMeta, toggleEnabled]
  );

  useEffect(() => {
    runDashboardFetch({ silent: false });
    return () => {
      abortActiveRequest();
    };
  }, [roleMeta, query, toggleEnabled, hasAccess, hydrateBlogRail]);

  useEffect(() => {
    if (toggleEnabled === false && !toggleLoading) {
      setDashboard(null);
      setError(null);
      setLoading(false);
      setBlogPosts([]);
    }
  }, [toggleEnabled, toggleLoading]);
  }, [runDashboardFetch, abortActiveRequest]);

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
      setDashboard(null);
      setError(null);
      setUnauthorised(true);
      setBlogPosts([]);
      return;
    }
  }, [toggleEnabled, refreshToggles, runDashboardFetch, refreshPersonaAccess]);

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
      dashboard={dashboard}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      lastRefreshed={lastRefreshed}
      exportHref={buildExportUrl(roleMeta.id, query)}
      toggleMeta={toggle}
      toggleReason={toggleReason}
      blogPosts={blogPosts}
    />
  );
};

export default RoleDashboard;
