import {
  getServicemanByokState,
  upsertServicemanByokProfile,
  createServicemanByokConnector,
  updateServicemanByokConnector,
  deleteServicemanByokConnector,
  rotateServicemanByokConnector,
  runServicemanByokDiagnostic,
  searchServicemanByokProfiles
} from '../services/servicemanByokService.js';

export async function getServicemanByokStateHandler(req, res, next) {
  try {
    const data = await getServicemanByokState({ servicemanId: req.params.servicemanId });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanByokProfileHandler(req, res, next) {
  try {
    const profile = await upsertServicemanByokProfile({
      servicemanId: req.params.servicemanId,
      payload: req.body,
      actorId: req.user?.id ?? null
    });
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function createServicemanByokConnectorHandler(req, res, next) {
  try {
    const connector = await createServicemanByokConnector({
      servicemanId: req.params.servicemanId,
      payload: req.body,
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: connector });
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanByokConnectorHandler(req, res, next) {
  try {
    const connector = await updateServicemanByokConnector({
      servicemanId: req.params.servicemanId,
      connectorId: req.params.connectorId,
      payload: req.body,
      actorId: req.user?.id ?? null
    });
    res.json({ data: connector });
  } catch (error) {
    next(error);
  }
}

export async function deleteServicemanByokConnectorHandler(req, res, next) {
  try {
    const connector = await deleteServicemanByokConnector({
      servicemanId: req.params.servicemanId,
      connectorId: req.params.connectorId,
      actorId: req.user?.id ?? null
    });
    res.json({ data: connector });
  } catch (error) {
    next(error);
  }
}

export async function rotateServicemanByokConnectorHandler(req, res, next) {
  try {
    const connector = await rotateServicemanByokConnector({
      servicemanId: req.params.servicemanId,
      connectorId: req.params.connectorId,
      secret: req.body?.secret,
      actorId: req.user?.id ?? null,
      metadata: req.body?.metadata ?? {}
    });
    res.json({ data: connector });
  } catch (error) {
    next(error);
  }
}

export async function runServicemanByokDiagnosticHandler(req, res, next) {
  try {
    const result = await runServicemanByokDiagnostic({
      servicemanId: req.params.servicemanId,
      connectorId: req.params.connectorId,
      actorId: req.user?.id ?? null
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function searchServicemanByokProfilesHandler(req, res, next) {
  try {
    const profiles = await searchServicemanByokProfiles({
      search: req.query?.search ?? '',
      limit: req.query?.limit ?? 20
    });
    res.json({ data: profiles });
  } catch (error) {
    next(error);
  }
}

export default {
  getServicemanByokStateHandler,
  updateServicemanByokProfileHandler,
  createServicemanByokConnectorHandler,
  updateServicemanByokConnectorHandler,
  deleteServicemanByokConnectorHandler,
  rotateServicemanByokConnectorHandler,
  runServicemanByokDiagnosticHandler,
  searchServicemanByokProfilesHandler
};
