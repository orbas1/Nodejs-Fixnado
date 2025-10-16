import {
  getServicemanWebsitePreferences,
  updateServicemanWebsitePreferences
} from '../services/servicemanWebsitePreferencesService.js';

export async function fetchServicemanWebsitePreferences(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const snapshot = await getServicemanWebsitePreferences({ forceRefresh });
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
}

export async function saveServicemanWebsitePreferences(req, res, next) {
  try {
    const snapshot = await updateServicemanWebsitePreferences(req.body ?? {}, req.user?.id ?? 'system');
    res.json(snapshot);
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

export default {
  fetchServicemanWebsitePreferences,
  saveServicemanWebsitePreferences
};
