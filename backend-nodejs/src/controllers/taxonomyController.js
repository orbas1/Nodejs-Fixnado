import {
  listServiceTaxonomy,
  upsertServiceTaxonomyType,
  archiveServiceTaxonomyType,
  upsertServiceTaxonomyCategory,
  archiveServiceTaxonomyCategory
} from '../services/taxonomyService.js';

function sendValidationError(res, error) {
  return res.status(error.statusCode ?? 422).json({
    message: error.message,
    details: error.details ?? []
  });
}

export async function getAdminTaxonomy(req, res, next) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const payload = await listServiceTaxonomy({ includeArchived });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function upsertTaxonomyType(req, res, next) {
  try {
    const { id } = req.params;
    const payload = id ? { ...req.body, id } : req.body;
    const result = await upsertServiceTaxonomyType(payload ?? {}, req.user?.id ?? null);
    res.status(result.created ? 201 : 200).json({ type: result.type });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendValidationError(res, error);
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

export async function archiveTaxonomyType(req, res, next) {
  try {
    const type = await archiveServiceTaxonomyType(req.params.id, req.user?.id ?? null);
    res.json({ type });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendValidationError(res, error);
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

export async function upsertTaxonomyCategory(req, res, next) {
  try {
    const { id } = req.params;
    const payload = id ? { ...req.body, id } : req.body;
    const result = await upsertServiceTaxonomyCategory(payload ?? {}, req.user?.id ?? null);
    res.status(result.created ? 201 : 200).json({ category: result.category });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendValidationError(res, error);
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

export async function archiveTaxonomyCategory(req, res, next) {
  try {
    const category = await archiveServiceTaxonomyCategory(req.params.id, req.user?.id ?? null);
    res.json({ category });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendValidationError(res, error);
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}
