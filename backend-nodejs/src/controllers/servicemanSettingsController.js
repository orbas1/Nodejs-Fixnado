import {
  getServicemanProfileSettings,
  updateServicemanProfileSettings
} from '../services/servicemanProfileSettingsService.js';

export async function getServicemanProfileSettingsHandler(req, res, next) {
  try {
    const data = await getServicemanProfileSettings(req.user?.id ?? null);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanProfileSettingsHandler(req, res, next) {
  try {
    const data = await updateServicemanProfileSettings(req.user?.id ?? null, req.body ?? {}, req.user?.id ?? null);
    res.json({ data });
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
  getServicemanProfileSettingsHandler,
  updateServicemanProfileSettingsHandler
};
