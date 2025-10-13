import { Op } from 'sequelize';
import { area as turfArea, bbox as turfBbox, centroid as turfCentroid, booleanValid } from '@turf/turf';
import { ServiceZone, ZoneAnalyticsSnapshot, Booking } from '../models/index.js';
import { recordAnalyticsEvent } from './analyticsEventService.js';

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalisePolygon(geometry) {
  if (!geometry) {
    throw validationError('Zone geometry is required');
  }

  const source = geometry.type ? geometry : geometry.geometry;

  if (!source || (source.type !== 'Polygon' && source.type !== 'MultiPolygon')) {
    throw validationError('Zone geometry must be a Polygon or MultiPolygon');
  }

  if (source.type === 'Polygon') {
    return {
      type: 'MultiPolygon',
      coordinates: [source.coordinates]
    };
  }

  return {
    type: 'MultiPolygon',
    coordinates: source.coordinates
  };
}

function validateGeometry(multiPoly) {
  const feature = {
    type: 'Feature',
    properties: {},
    geometry: multiPoly
  };

  if (!booleanValid(feature)) {
    throw validationError('Zone polygon is invalid or self-intersects');
  }

  const zoneArea = turfArea(feature);
  if (!Number.isFinite(zoneArea) || zoneArea < 10) {
    throw validationError('Zone polygon area is too small to be actionable');
  }
}

function computeAttributes(multiPoly) {
  const feature = {
    type: 'Feature',
    properties: {},
    geometry: multiPoly
  };
  const centroid = turfCentroid(feature);
  const bbox = turfBbox(feature);

  return {
    boundary: multiPoly,
    centroid: centroid.geometry,
    boundingBox: {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3]
    }
  };
}

function calculateAreaSqMeters(multiPoly) {
  const feature = {
    type: 'Feature',
    properties: {},
    geometry: multiPoly
  };

  const area = turfArea(feature);
  if (!Number.isFinite(area)) {
    return null;
  }

  return Number(area.toFixed(2));
}

function diffMetadata(previous = {}, next = {}) {
  const changes = {};
  const keys = new Set([...Object.keys(previous || {}), ...Object.keys(next || {})]);

  for (const key of keys) {
    const before = previous?.[key];
    const after = next?.[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes[key] = { previous: before ?? null, current: after ?? null };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

export async function createZone({ companyId, name, geometry, demandLevel = 'medium', metadata = {}, actor = null }) {
  const multiPoly = normalisePolygon(geometry);
  validateGeometry(multiPoly);
  const attributes = computeAttributes(multiPoly);
  const areaSqMeters = calculateAreaSqMeters(multiPoly);

  const zone = await ServiceZone.create({
    companyId,
    name,
    demandLevel,
    metadata,
    ...attributes
  });

  await recordAnalyticsEvent({
    name: 'zone.created',
    entityId: zone.id,
    actor,
    tenantId: companyId,
    occurredAt: zone.createdAt,
    metadata: {
      zoneId: zone.id,
      companyId,
      demandLevel,
      areaSqMeters,
      centroid: attributes.centroid,
      boundingBox: attributes.boundingBox,
      metadataKeys: Object.keys(metadata || {})
    }
  });

  return zone;
}

export async function updateZone(id, updates) {
  const zone = await ServiceZone.findByPk(id);
  if (!zone) {
    const error = new Error('Zone not found');
    error.statusCode = 404;
    throw error;
  }

  const { actor = null, ...payload } = updates || {};
  const previous = zone.get({ plain: true });
  let areaSqMeters = previous.boundary ? calculateAreaSqMeters(previous.boundary) : null;

  if (updates?.geometry) {
    const multiPoly = normalisePolygon(updates.geometry);
    validateGeometry(multiPoly);
    Object.assign(payload, computeAttributes(multiPoly));
    areaSqMeters = calculateAreaSqMeters(payload.boundary);
  }

  await zone.update(payload);
  const reloaded = await zone.reload();

  const changes = {};
  if (payload.name && previous.name !== reloaded.name) {
    changes.name = { previous: previous.name, current: reloaded.name };
  }
  if (payload.demandLevel && previous.demandLevel !== reloaded.demandLevel) {
    changes.demandLevel = { previous: previous.demandLevel, current: reloaded.demandLevel };
  }
  if (payload.metadata) {
    const metadataChanges = diffMetadata(previous.metadata, reloaded.metadata);
    if (metadataChanges) {
      changes.metadata = metadataChanges;
    }
  }
  if (payload.boundary) {
    changes.geometry = {
      previousCentroid: previous.centroid,
      currentCentroid: reloaded.centroid,
      previousBoundingBox: previous.boundingBox,
      currentBoundingBox: reloaded.boundingBox
    };
  }

  if (Object.keys(changes).length > 0) {
    await recordAnalyticsEvent({
      name: 'zone.updated',
      entityId: reloaded.id,
      actor,
      tenantId: reloaded.companyId,
      occurredAt: reloaded.updatedAt,
      metadata: {
        zoneId: reloaded.id,
        companyId: reloaded.companyId,
        changes,
        areaSqMeters,
        demandLevel: reloaded.demandLevel
      }
    });
  }

  return reloaded;
}

export async function deleteZone(id, { actor = null } = {}) {
  const zone = await ServiceZone.findByPk(id);
  if (!zone) {
    return false;
  }

  const snapshot = zone.get({ plain: true });
  await zone.destroy();

  await recordAnalyticsEvent({
    name: 'zone.deleted',
    entityId: snapshot.id,
    actor,
    tenantId: snapshot.companyId,
    metadata: {
      zoneId: snapshot.id,
      companyId: snapshot.companyId,
      demandLevel: snapshot.demandLevel,
      areaSqMeters: snapshot.boundary ? calculateAreaSqMeters(snapshot.boundary) : null
    }
  });

  return true;
}

export async function listZones({ companyId, includeAnalytics = false }) {
  const zones = await ServiceZone.findAll({
    where: companyId ? { companyId } : undefined,
    order: [['createdAt', 'DESC']]
  });

  if (!includeAnalytics) {
    return zones;
  }

  const zoneIds = zones.map((zone) => zone.id);
  const snapshots = await ZoneAnalyticsSnapshot.findAll({
    where: {
      zoneId: {
        [Op.in]: zoneIds
      }
    },
    order: [['capturedAt', 'DESC']]
  });

  const latestByZone = new Map();
  for (const snapshot of snapshots) {
    if (!latestByZone.has(snapshot.zoneId)) {
      latestByZone.set(snapshot.zoneId, snapshot);
    }
  }

  return zones.map((zone) => ({
    zone,
    analytics: latestByZone.get(zone.id) || null
  }));
}

function calculateAcceptanceMinutes(booking) {
  const acceptedAt = booking.meta?.assignmentAcceptedAt;
  if (!acceptedAt) {
    return null;
  }

  const submitted = booking.createdAt;
  const acceptedDate = new Date(acceptedAt);
  const diff = (acceptedDate.getTime() - submitted.getTime()) / 60000;
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

export async function importZonesFromGeoJson({ companyId, geojson, demandLevel = 'medium', metadata = {}, actor = null }) {
  if (!companyId) {
    throw validationError('A companyId is required to import service zones');
  }

  if (!geojson) {
    throw validationError('GeoJSON payload is required');
  }

  let payload = geojson;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      throw validationError('Unable to parse GeoJSON payload');
    }
  }

  let features = [];
  if (payload.type === 'FeatureCollection') {
    features = payload.features || [];
  } else if (payload.type === 'Feature') {
    features = [payload];
  } else if (payload.type === 'Polygon' || payload.type === 'MultiPolygon') {
    features = [
      {
        type: 'Feature',
        properties: {},
        geometry: payload
      }
    ];
  }

  if (!Array.isArray(features) || features.length === 0) {
    throw validationError('GeoJSON payload does not contain any polygon features');
  }

  const createdZones = [];

  for (const [index, feature] of features.entries()) {
    const geometry = feature.geometry || feature;
    if (!geometry) {
      throw validationError(`Feature at index ${index} does not include geometry data`);
    }

    const zoneMetadata = { ...metadata, ...(feature.properties || {}) };
    const zoneName = zoneMetadata.name || `Imported zone ${index + 1}`;
    const zoneDemand = zoneMetadata.demandLevel || demandLevel;

    delete zoneMetadata.name;
    delete zoneMetadata.demandLevel;

    try {
      const zone = await createZone({
        companyId,
        name: zoneName,
        geometry,
        demandLevel: zoneDemand,
        metadata: zoneMetadata,
        actor
      });
      createdZones.push(zone);
    } catch (error) {
      if (error?.statusCode === 400) {
        throw validationError(`Unable to import feature ${index + 1}: ${error.message}`);
      }
      throw error;
    }
  }

  return createdZones;
}

export async function generateAnalyticsSnapshot(zoneId, now = new Date()) {
  const bookings = await Booking.findAll({ where: { zoneId } });
  const totals = {};
  const acceptanceSamples = [];
  let slaBreaches = 0;

  for (const booking of bookings) {
    totals[booking.status] = (totals[booking.status] || 0) + 1;

    const acceptanceMinutes = calculateAcceptanceMinutes(booking);
    if (acceptanceMinutes !== null) {
      acceptanceSamples.push(acceptanceMinutes);
    }

    const isPending = !['completed', 'cancelled', 'disputed'].includes(booking.status);
    if (isPending && booking.slaExpiresAt && booking.slaExpiresAt.getTime() < now.getTime()) {
      slaBreaches += 1;
    }
  }

  const averageAcceptanceMinutes =
    acceptanceSamples.length > 0
      ? acceptanceSamples.reduce((sum, value) => sum + value, 0) / acceptanceSamples.length
      : null;

  const snapshot = await ZoneAnalyticsSnapshot.create({
    zoneId,
    capturedAt: now,
    bookingTotals: totals,
    slaBreaches,
    averageAcceptanceMinutes,
    metadata: {
      sampleSize: bookings.length
    }
  });

  return snapshot;
}

export async function getZoneWithAnalytics(zoneId) {
  const zone = await ServiceZone.findByPk(zoneId);
  if (!zone) {
    return null;
  }

  const analytics = await ZoneAnalyticsSnapshot.findOne({
    where: { zoneId },
    order: [['capturedAt', 'DESC']]
  });

  return {
    zone,
    analytics
  };
}
