import buildAdminDashboard from '../services/adminDashboardService.js';
import { Permissions } from '../constants/permissions.js';

export async function dashboard(req, res, next) {
  try {
    const timeframe = req.query.timeframe ?? '7d';
    const timezone = req.app?.get?.('dashboards:defaultTimezone') ?? 'Europe/London';
    const granted = new Set(req.auth?.grantedPermissions ?? []);
    const canManageSecurity = granted.has(Permissions.ADMIN_SECURITY_POSTURE_WRITE);
    const securityCapabilities = {
      canManageSignals: canManageSecurity,
      canManageAutomation: canManageSecurity,
      canManageConnectors: canManageSecurity
    };
    const payload = await buildAdminDashboard({ timeframe, timezone, securityCapabilities });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}
