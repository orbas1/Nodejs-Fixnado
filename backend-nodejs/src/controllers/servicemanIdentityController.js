import {
  getServicemanIdentitySnapshot,
  updateServicemanIdentityProfile,
  createIdentityDocument,
  updateIdentityDocument,
  deleteIdentityDocument,
  createIdentityCheck,
  updateIdentityCheck,
  deleteIdentityCheck,
  addIdentityWatcher,
  updateIdentityWatcher,
  removeIdentityWatcher,
  createIdentityEvent
} from '../services/servicemanIdentityService.js';

function handleError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

export async function getServicemanIdentity(req, res, next) {
  try {
    const snapshot = await getServicemanIdentitySnapshot(req.params.servicemanId);
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function updateServicemanIdentity(req, res, next) {
  try {
    const snapshot = await updateServicemanIdentityProfile(req.params.servicemanId, req.body ?? {});
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function createServicemanIdentityDocument(req, res, next) {
  try {
    const snapshot = await createIdentityDocument(req.params.servicemanId, req.body ?? {});
    res.status(201).json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function updateServicemanIdentityDocument(req, res, next) {
  try {
    const snapshot = await updateIdentityDocument(req.params.servicemanId, req.params.documentId, req.body ?? {});
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function deleteServicemanIdentityDocument(req, res, next) {
  try {
    const snapshot = await deleteIdentityDocument(req.params.servicemanId, req.params.documentId);
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function createServicemanIdentityCheck(req, res, next) {
  try {
    const snapshot = await createIdentityCheck(req.params.servicemanId, req.body ?? {});
    res.status(201).json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function updateServicemanIdentityCheck(req, res, next) {
  try {
    const snapshot = await updateIdentityCheck(req.params.servicemanId, req.params.checkId, req.body ?? {});
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function deleteServicemanIdentityCheck(req, res, next) {
  try {
    const snapshot = await deleteIdentityCheck(req.params.servicemanId, req.params.checkId);
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function addServicemanIdentityWatcher(req, res, next) {
  try {
    const snapshot = await addIdentityWatcher(req.params.servicemanId, req.body ?? {});
    res.status(201).json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function updateServicemanIdentityWatcher(req, res, next) {
  try {
    const snapshot = await updateIdentityWatcher(req.params.servicemanId, req.params.watcherId, req.body ?? {});
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function removeServicemanIdentityWatcher(req, res, next) {
  try {
    const snapshot = await removeIdentityWatcher(req.params.servicemanId, req.params.watcherId);
    res.json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function createServicemanIdentityEvent(req, res, next) {
  try {
    const snapshot = await createIdentityEvent(req.params.servicemanId, req.body ?? {});
    res.status(201).json(snapshot);
  } catch (error) {
    handleError(res, next, error);
  }
}

export default {
  getServicemanIdentity,
  updateServicemanIdentity,
  createServicemanIdentityDocument,
  updateServicemanIdentityDocument,
  deleteServicemanIdentityDocument,
  createServicemanIdentityCheck,
  updateServicemanIdentityCheck,
  deleteServicemanIdentityCheck,
  addServicemanIdentityWatcher,
  updateServicemanIdentityWatcher,
  removeServicemanIdentityWatcher,
  createServicemanIdentityEvent
};
