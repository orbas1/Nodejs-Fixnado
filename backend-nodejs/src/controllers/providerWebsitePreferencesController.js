import {
  getProviderWebsitePreferences,
  updateProviderWebsitePreferences
} from '../services/providerWebsitePreferencesService.js';

export async function getProviderWebsitePreferencesHandler(req, res, next) {
  try {
    const data = await getProviderWebsitePreferences({
      companyId: req.query.companyId,
      actor: req.user
    });
    res.json({ data });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message || 'company_not_found' });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message || 'forbidden' });
    }
    next(error);
  }
}

export async function updateProviderWebsitePreferencesHandler(req, res, next) {
  try {
    const data = await updateProviderWebsitePreferences({
      companyId: req.query.companyId,
      actor: req.user,
      payload: req.body ?? {}
    });
    res.json({ data });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message || 'company_not_found' });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message || 'forbidden' });
    }
    if (error.statusCode === 422) {
      return res.status(422).json({ message: error.message || 'validation_failed', details: error.details });
    }
    next(error);
  }
}
