import {
  getOverviewSettings,
  updateOverviewSettings
} from '../services/adminDashboardSettingsService.js';

export async function getAdminDashboardOverviewSettings(req, res, next) {
  try {
    const settings = await getOverviewSettings({ forceRefresh: req.query.refresh === 'true' });
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminDashboardOverviewSettings(req, res, next) {
  try {
    const settings = await updateOverviewSettings(req.body ?? {}, req.user?.id ?? 'system');
    res.json({ settings });
  } catch (error) {
    if (error.statusCode === 422) {
      return res.status(422).json({ message: error.message ?? 'Invalid overview settings payload' });
    }
    next(error);
  }
}
