import {
  getAdminPreferences,
  updateAdminPreferences
} from '../services/adminPreferencesService.js';

export async function fetchAdminPreferences(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const snapshot = await getAdminPreferences({ forceRefresh });
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
}

export async function saveAdminPreferences(req, res, next) {
  try {
    const snapshot = await updateAdminPreferences(req.body ?? {}, req.user?.id ?? 'system');
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
  fetchAdminPreferences,
  saveAdminPreferences
};
