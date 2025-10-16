import { getAdminProfile, upsertAdminProfile } from '../services/adminProfileService.js';

export async function fetchAdminProfile(req, res, next) {
  try {
    const profile = await getAdminProfile(req.user?.id);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function saveAdminProfile(req, res, next) {
  try {
    const profile = await upsertAdminProfile(req.user?.id, req.body ?? {}, req.user?.id);
    res.json({ profile });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(error.statusCode ?? 422).json({
        message: error.message,
        details: error.details ?? []
      });
    }
    next(error);
  }
}
