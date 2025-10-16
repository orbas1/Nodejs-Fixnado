import {
  loadInboxAdminSnapshot,
  updateInboxConfiguration,
  upsertInboxQueue,
  deleteInboxQueue,
  upsertInboxTemplate,
  deleteInboxTemplate
} from '../services/adminInboxService.js';

function handleControllerError(error, res, next) {
  if (error.name === 'ValidationError') {
    return res.status(error.status ?? 422).json({ message: error.message, details: error.details ?? [] });
  }
  if (error.name === 'NotFoundError') {
    return res.status(error.status ?? 404).json({ message: error.message });
  }
  return next(error);
}

export async function getInboxSnapshot(req, res, next) {
  try {
    const snapshot = await loadInboxAdminSnapshot();
    res.json(snapshot);
  } catch (error) {
    handleControllerError(error, res, next);
  }
}

export async function saveInboxConfiguration(req, res, next) {
  try {
    const actor = req.user?.id ?? 'system';
    await updateInboxConfiguration(req.body ?? {}, actor);
    const snapshot = await loadInboxAdminSnapshot();
    res.json(snapshot);
  } catch (error) {
    handleControllerError(error, res, next);
  }
}

export async function saveInboxQueue(req, res, next) {
  try {
    const actor = req.user?.id ?? 'system';
    const payload = { ...req.body, id: req.params?.id };
    await upsertInboxQueue(payload, actor);
    const snapshot = await loadInboxAdminSnapshot();
    res.json(snapshot);
  } catch (error) {
    handleControllerError(error, res, next);
  }
}

export async function removeInboxQueue(req, res, next) {
  try {
    await deleteInboxQueue(req.params?.id);
    const snapshot = await loadInboxAdminSnapshot();
    res.json(snapshot);
  } catch (error) {
    handleControllerError(error, res, next);
  }
}

export async function saveInboxTemplate(req, res, next) {
  try {
    const actor = req.user?.id ?? 'system';
    const payload = { ...req.body, id: req.params?.id };
    await upsertInboxTemplate(payload, actor);
    const snapshot = await loadInboxAdminSnapshot();
    res.json(snapshot);
  } catch (error) {
    handleControllerError(error, res, next);
  }
}

export async function removeInboxTemplate(req, res, next) {
  try {
    await deleteInboxTemplate(req.params?.id);
    const snapshot = await loadInboxAdminSnapshot();
    res.json(snapshot);
  } catch (error) {
    handleControllerError(error, res, next);
  }
}
