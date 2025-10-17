import { userDashboard } from './mockDashboards/userDashboard.js';
import { servicemanDashboard } from './mockDashboards/servicemanDashboard.js';
import { providerDashboard } from './mockDashboards/providerDashboard.js';
import { adminDashboard } from './mockDashboards/adminDashboard.js';
import { enterpriseDashboard } from './mockDashboards/enterpriseDashboard.js';
import { financeDashboard } from './mockDashboards/financeDashboard.js';

const mockDashboards = {
  user: userDashboard,
  serviceman: servicemanDashboard,
  provider: providerDashboard,
  admin: adminDashboard,
  enterprise: enterpriseDashboard,
  finance: financeDashboard
};

export default mockDashboards;
