import { Navigate, useParams } from 'react-router-dom';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';

const RoleDashboard = () => {
  const { roleId } = useParams();
  const roleConfig = DASHBOARD_ROLES.find((role) => role.id === roleId);
  const registeredRoles = DASHBOARD_ROLES.filter((role) => role.registered);

  if (!roleConfig) {
    return <Navigate to="/dashboards" replace />;
  }

  if (!roleConfig.registered) {
    return <Navigate to="/dashboards" replace />;
  }

  return <DashboardLayout roleConfig={roleConfig} registeredRoles={registeredRoles} />;
};

export default RoleDashboard;
