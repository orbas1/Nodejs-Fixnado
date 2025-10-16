import {
  listAppearanceProfiles,
  getAppearanceProfileById,
  getAppearanceProfileBySlug,
  saveAppearanceProfile,
  archiveAppearanceProfile
} from '../services/appearanceService.js';

export async function listAppearanceProfilesHandler(req, res, next) {
  try {
    const profiles = await listAppearanceProfiles();
    res.json({ data: { profiles } });
  } catch (error) {
    next(error);
  }
}

export async function getAppearanceProfileHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { slug } = req.query;

    const profile = slug
      ? await getAppearanceProfileBySlug(slug)
      : await getAppearanceProfileById(id);

    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function createAppearanceProfileHandler(req, res, next) {
  try {
    const profile = await saveAppearanceProfile({ payload: req.body, actorId: req.user?.id });
    res.status(201).json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateAppearanceProfileHandler(req, res, next) {
  try {
    const profile = await saveAppearanceProfile({ id: req.params.id, payload: req.body, actorId: req.user?.id });
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function archiveAppearanceProfileHandler(req, res, next) {
  try {
    const archived = await archiveAppearanceProfile({ id: req.params.id, actorId: req.user?.id });
    res.json({ data: archived });
  } catch (error) {
    next(error);
  }
}
