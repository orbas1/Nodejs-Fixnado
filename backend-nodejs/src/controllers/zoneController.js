import {
  createZone,
  updateZone,
  deleteZone,
  listZones,
  getZoneWithAnalytics,
  generateAnalyticsSnapshot,
  importZonesFromGeoJson,
  listZoneServices,
  syncZoneServices,
  removeZoneService
} from '../services/zoneService.js';

function handleServiceError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return next(error);
}

export async function createZoneHandler(req, res, next) {
  try {
    const zone = await createZone(req.body);
    res.status(201).json(zone);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateZoneHandler(req, res, next) {
  try {
    const zone = await updateZone(req.params.zoneId, req.body);
    res.json(zone);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteZoneHandler(req, res, next) {
  try {
    const removed = await deleteZone(req.params.zoneId);
    if (!removed) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return handleServiceError(res, next, error);
  }
}

export async function listZonesHandler(req, res, next) {
  try {
    const includeAnalytics = req.query.includeAnalytics === 'true';
    const companyId = req.query.companyId;
    const zones = await listZones({ companyId, includeAnalytics });
    res.json(zones);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getZoneHandler(req, res, next) {
  try {
    const result = await getZoneWithAnalytics(req.params.zoneId);
    if (!result) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    return res.json(result);
  } catch (error) {
    return handleServiceError(res, next, error);
  }
}

export async function createZoneSnapshotHandler(req, res, next) {
  try {
    const snapshot = await generateAnalyticsSnapshot(req.params.zoneId);
    res.status(201).json(snapshot);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function importZonesHandler(req, res, next) {
  try {
    const zones = await importZonesFromGeoJson({
      companyId: req.body.companyId,
      geojson: req.body.geojson ?? req.body.payload ?? req.body,
      demandLevel: req.body.demandLevel,
      metadata: req.body.metadata,
      actor: req.body.actor
    });
    res.status(201).json(zones);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listZoneServicesHandler(req, res, next) {
  try {
    const coverages = await listZoneServices(req.params.zoneId);
    res.json(coverages);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function syncZoneServicesHandler(req, res, next) {
  try {
    const coverages = await syncZoneServices({
      zoneId: req.params.zoneId,
      coverages: req.body.coverages,
      actor: req.body.actor ?? null,
      replace: Boolean(req.body.replace)
    });
    res.status(200).json(coverages);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function removeZoneServiceHandler(req, res, next) {
  try {
    await removeZoneService({
      zoneId: req.params.zoneId,
      coverageId: req.params.coverageId,
      actor: req.body?.actor ?? null
    });
    res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
