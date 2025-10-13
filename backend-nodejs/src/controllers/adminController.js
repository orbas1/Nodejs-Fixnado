import buildAdminDashboard from '../services/adminDashboardService.js';

export async function dashboard(req, res, next) {
  try {
    const timeframe = req.query.timeframe ?? '7d';
    const timezone = req.app?.get?.('dashboards:defaultTimezone') ?? 'Europe/London';
    const payload = await buildAdminDashboard({ timeframe, timezone });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}
