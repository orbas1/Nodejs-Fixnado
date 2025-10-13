import {
  getPlatformSettings,
  updatePlatformSettings
} from '../services/platformSettingsService.js';

export async function fetchPlatformSettings(req, res, next) {
  try {
    const settings = await getPlatformSettings({ forceRefresh: req.query.refresh === 'true' });
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function savePlatformSettings(req, res, next) {
  try {
    const settings = await updatePlatformSettings(req.body ?? {}, req.user?.id ?? 'system');
    res.json({ settings });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(error.statusCode || 422).json({
        message: error.message,
        details: error.details ?? []
      });
    }
    next(error);
  }
}
