import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import { buildExportUrl, fetchDashboard } from '../api/analyticsDashboardClient.js';

const RoleDashboard = () => {
  const { roleId } = useParams();
  const [searchParams] = useSearchParams();
  const roleMeta = DASHBOARD_ROLES.find((role) => role.id === roleId);
  const registeredRoles = DASHBOARD_ROLES.filter((role) => role.registered);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

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
    if (!roleMeta?.registered) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchDashboard(roleMeta.id, query);
      setDashboard(data);
      setError(null);
      setLastRefreshed(new Date().toISOString());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load dashboard');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [roleMeta, query]);

  useEffect(() => {
    let active = true;
    if (!roleMeta?.registered) {
      return;
    }

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
  }, [roleMeta, query]);

  if (!roleMeta) {
    return <Navigate to="/dashboards" replace />;
  }

  if (!roleMeta.registered) {
    return <Navigate to="/dashboards" replace />;
  }

  return (
    <DashboardLayout
      roleMeta={roleMeta}
      registeredRoles={registeredRoles}
      dashboard={dashboard}
      loading={loading}
      error={error}
      onRefresh={loadDashboard}
      lastRefreshed={lastRefreshed}
      exportHref={buildExportUrl(roleMeta.id, query)}
    />
  );
};

export default RoleDashboard;
