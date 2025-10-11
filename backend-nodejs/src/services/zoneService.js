import { Op } from 'sequelize';
import { area as turfArea, bbox as turfBbox, centroid as turfCentroid, booleanValid } from '@turf/turf';
import { ServiceZone, ZoneAnalyticsSnapshot, Booking } from '../models/index.js';

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

export async function createZone({ companyId, name, geometry, demandLevel = 'medium', metadata = {} }) {
  const multiPoly = normalisePolygon(geometry);
  validateGeometry(multiPoly);
  const attributes = computeAttributes(multiPoly);

  return ServiceZone.create({
    companyId,
    name,
    demandLevel,
    metadata,
    ...attributes
  });
}

export async function updateZone(id, updates) {
  const zone = await ServiceZone.findByPk(id);
  if (!zone) {
    const error = new Error('Zone not found');
    error.statusCode = 404;
    throw error;
  }

  const payload = { ...updates };
  if (updates.geometry) {
    const multiPoly = normalisePolygon(updates.geometry);
    validateGeometry(multiPoly);
    Object.assign(payload, computeAttributes(multiPoly));
  }

  await zone.update(payload);
  return zone.reload();
}

export async function deleteZone(id) {
  const zone = await ServiceZone.findByPk(id);
  if (!zone) {
    return false;
  }

  await zone.destroy();
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
