import { getUserProfileSettings, updateUserProfileSettings } from '../services/userProfileService.js';

export async function fetchUserProfileSettings(req, res, next) {
  try {
    const data = await getUserProfileSettings(req.user.id);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function saveUserProfileSettings(req, res, next) {
  try {
    const data = await updateUserProfileSettings(req.user.id, req.body ?? {}, req.user?.id ?? null);
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
