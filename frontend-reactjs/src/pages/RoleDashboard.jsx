import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import { buildExportUrl, fetchDashboard } from '../api/analyticsDashboardClient.js';
import DashboardAccessGate from '../components/dashboard/DashboardAccessGate.jsx';
import { useFeatureToggle } from '../providers/FeatureToggleProvider.jsx';
import DashboardUnauthorized from '../components/dashboard/DashboardUnauthorized.jsx';
import { usePersonaAccess } from '../hooks/usePersonaAccess.js';

const RoleDashboard = () => {
  const { roleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleMeta = DASHBOARD_ROLES.find((role) => role.id === roleId);
  const personaId = roleMeta?.id;
  const registeredRoles = DASHBOARD_ROLES.filter((role) => role.registered);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [unauthorised, setUnauthorised] = useState(false);
  const { hasAccess, refresh: refreshPersonaAccess } = usePersonaAccess();

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
      return;
    }
    setUnauthorised(false);
    setLoading(true);
    try {
      const data = await fetchDashboard(roleMeta.id, query);
      setDashboard(data);
      setError(null);
      setLastRefreshed(new Date().toISOString());
    } catch (caught) {
      if (caught?.status === 403) {
        setUnauthorised(true);
        setDashboard(null);
        setError(null);
      } else {
        setError(caught instanceof Error ? caught.message : 'Failed to load dashboard');
        setDashboard(null);
      }
    } finally {
      setLoading(false);
    }
  }, [roleMeta, query, toggleEnabled, hasAccess]);

  useEffect(() => {
    let active = true;
    if (!roleMeta?.registered || toggleEnabled === false) {
      setLoading(false);
      setDashboard(null);
      return () => {
        active = false;
      };
    }

    if (!hasAccess(roleMeta.id)) {
      setDashboard(null);
      setError(null);
      setLoading(false);
      setUnauthorised(true);
      return () => {
        active = false;
      };
    }

    setUnauthorised(false);
    (async () => {
      setLoading(true);
      try {
        const data = await fetchDashboard(roleMeta.id, query);
        if (!active) return;
        setDashboard(data);
        setError(null);
        setLastRefreshed(new Date().toISOString());
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Failed to load dashboard');
        setDashboard(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [roleMeta, query, toggleEnabled, hasAccess]);

  useEffect(() => {
    if (toggleEnabled === false && !toggleLoading) {
      setDashboard(null);
      setError(null);
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

    if (!personaId) {
      return;
    }

    if (!hasAccess(personaId)) {
      refreshPersonaAccess();
      setDashboard(null);
      setError(null);
      setUnauthorised(true);
      return;
    }

    loadDashboard();
  }, [toggleEnabled, refreshToggles, loadDashboard, personaId, hasAccess, refreshPersonaAccess]);

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
          if (personaId && hasAccess(personaId)) {
            loadDashboard();
          }
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
    />
  );
};

export default RoleDashboard;
