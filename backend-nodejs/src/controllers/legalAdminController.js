import {
  listLegalDocumentsSummary,
  getLegalDocumentDetail,
  createLegalDocument,
  createDraftVersion,
  updateDraftVersion,
  updateLegalDocumentMetadata,
  publishLegalDocumentVersion,
  archiveDraftVersion,
  deleteLegalDocument
} from '../services/legalDocumentService.js';

const DEFAULT_TIMEZONE = 'Europe/London';

function resolveTimezone(app) {
  return app?.get?.('dashboards:defaultTimezone') ?? DEFAULT_TIMEZONE;
}

export async function listLegalDocuments(req, res, next) {
  try {
    const summary = await listLegalDocumentsSummary({ timezone: resolveTimezone(req.app) });
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function getLegalDocument(req, res, next) {
  try {
    const { slug } = req.params;
    const document = await getLegalDocumentDetail(slug);
    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }
    res.json({ document });
  } catch (error) {
    next(error);
  }
}

function mapErrorToStatus(error) {
  if (!error) {
    return 500;
  }
  if (error.message === 'Document not found' || error.message === 'Draft not found' || error.message === 'Version not found') {
    return 404;
  }
  if (error.message === 'Draft already exists') {
    return 409;
  }
  if (error.message === 'Only draft versions can be updated' || error.message === 'Only drafts can be archived') {
    return 400;
  }
  if (error.message === 'Cannot delete published document') {
    return 409;
  }
  if (error.message === 'Invalid effective date') {
    return 422;
  }
  if (error.message === 'Slug is required') {
    return 422;
  }
  return 500;
}

async function respondWithDocument(slug, res, status = 200) {
  const document = await getLegalDocumentDetail(slug);
  res.status(status).json({ document });
}

export async function createLegalDocumentHandler(req, res, next) {
  try {
    const document = await createLegalDocument({ payload: req.body, actor: req.user?.email || 'admin' });
    res.status(201).json({ document });
  } catch (error) {
    const status = mapErrorToStatus(error);
    if (status === 500) {
      next(error);
      return;
    }
    res.status(status).json({ message: error.message });
  }
}

export async function createDraft(req, res, next) {
  try {
    const { slug } = req.params;
    await createDraftVersion({ slug, payload: req.body, actor: req.user?.email || 'admin' });
    await respondWithDocument(slug, res, 201);
  } catch (error) {
    const status = mapErrorToStatus(error);
    if (status === 500) {
      next(error);
      return;
    }
    res.status(status).json({ message: error.message });
  }
}

export async function updateDraft(req, res, next) {
  try {
    const { slug, versionId } = req.params;
    await updateDraftVersion({ slug, versionId, payload: req.body, actor: req.user?.email || 'admin' });
    await respondWithDocument(slug, res, 200);
  } catch (error) {
    const status = mapErrorToStatus(error);
    if (status === 500) {
      next(error);
      return;
    }
    res.status(status).json({ message: error.message });
  }
}

export async function updateLegalDocumentHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const document = await updateLegalDocumentMetadata({ slug, payload: req.body, actor: req.user?.email || 'admin' });
    res.json({ document });
  } catch (error) {
    const status = mapErrorToStatus(error);
    if (status === 500) {
      next(error);
      return;
    }
    res.status(status).json({ message: error.message });
  }
}

export async function publishVersion(req, res, next) {
  try {
    const { slug, versionId } = req.params;
    await publishLegalDocumentVersion({
      slug,
      versionId,
      effectiveAt: req.body?.effectiveAt,
      actor: req.user?.email || 'admin'
    });
    await respondWithDocument(slug, res, 200);
  } catch (error) {
    const status = mapErrorToStatus(error);
    if (status === 500) {
      next(error);
      return;
    }
    res.status(status).json({ message: error.message });
  }
}

export async function archiveDraft(req, res, next) {
  try {
    const { slug, versionId } = req.params;
    await archiveDraftVersion({ slug, versionId });
    await respondWithDocument(slug, res, 200);
  } catch (error) {
    const status = mapErrorToStatus(error);
    if (status === 500) {
      next(error);
      return;
    }
    res.status(status).json({ message: error.message });
  }
}

export async function deleteLegalDocumentHandler(req, res, next) {
  try {
    const { slug } = req.params;
    await deleteLegalDocument({ slug });
    res.status(204).send();
  } catch (error) {
    const status = mapErrorToStatus(error);
    if (status === 500) {
      next(error);
      return;
    }
    res.status(status).json({ message: error.message });
  }
}
