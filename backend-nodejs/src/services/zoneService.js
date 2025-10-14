import { Op } from 'sequelize';
import {
  area as turfArea,
  bbox as turfBbox,
  centroid as turfCentroid,
  booleanValid,
  intersect
} from '@turf/turf';
import {
  ServiceZone,
  ZoneAnalyticsSnapshot,
  Booking,
  ServiceZoneCoverage,
  Service,
  sequelize
} from '../models/index.js';
import { recordAnalyticsEvent, recordAnalyticsEvents } from './analyticsEventService.js';
import {
  attachOpenStreetMapMetadata,
  enforceOpenStreetMapCompliance
} from './openStreetMapService.js';

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function conflictError(message) {
  const error = new Error(message);
  error.statusCode = 409;
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

function getFeatureFromGeometry(geometry) {
  if (!geometry) {
    return null;
  }

  const source = geometry.type ? geometry : geometry.geometry || geometry.boundary || geometry;
  if (!source || (source.type !== 'Polygon' && source.type !== 'MultiPolygon')) {
    return null;
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: source.type === 'Polygon'
      ? {
          type: 'MultiPolygon',
          coordinates: [source.coordinates]
        }
      : source
  };
}

async function ensureNoZoneOverlap(companyId, multiPoly, { ignoreZoneId = null } = {}) {
  const candidate = {
    type: 'Feature',
    properties: {},
    geometry: multiPoly
  };

  const zones = await ServiceZone.findAll({
    where: {
      companyId,
      ...(ignoreZoneId ? { id: { [Op.ne]: ignoreZoneId } } : {})
    },
    attributes: ['id', 'name', 'boundary']
  });

  for (const zone of zones) {
    const feature = getFeatureFromGeometry(zone.boundary);
    if (!feature) {
      continue;
    }

    try {
      const overlapping = intersect(candidate, feature);
      if (!overlapping) {
        continue;
      }

      const overlapArea = turfArea(overlapping);
      if (Number.isFinite(overlapArea) && overlapArea > 1) {
        throw conflictError(
          `Zone geometry overlaps existing zone “${zone.name}” (${zone.id}). Adjust the polygon before saving.`
        );
      }
    } catch (error) {
      if (error?.statusCode === 409) {
        throw error;
      }

      // Turf throws when polygons share borders; treat as overlap if intersection exists
      throw conflictError(
        `Zone geometry conflicts with existing zone “${zone.name}” (${zone.id}). Adjust the polygon before saving.`
      );
    }
  }
}

export async function createZone({ companyId, name, geometry, demandLevel = 'medium', metadata = {}, actor = null }) {
  const multiPoly = normalisePolygon(geometry);
  validateGeometry(multiPoly);
  await ensureNoZoneOverlap(companyId, multiPoly);
  const openStreetMap = await enforceOpenStreetMapCompliance(multiPoly);
  const attributes = computeAttributes(multiPoly);
  const areaSqMeters = calculateAreaSqMeters(multiPoly);
  const metadataWithCompliance = attachOpenStreetMapMetadata(metadata, openStreetMap);

  const zone = await ServiceZone.create({
    companyId,
    name,
    demandLevel,
    metadata: metadataWithCompliance,
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
      metadataKeys: Object.keys(metadataWithCompliance || {}),
      openStreetMap
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
  let openStreetMap = null;

  if (updates?.geometry) {
    const multiPoly = normalisePolygon(updates.geometry);
    validateGeometry(multiPoly);
    await ensureNoZoneOverlap(zone.companyId, multiPoly, { ignoreZoneId: zone.id });
    Object.assign(payload, computeAttributes(multiPoly));
    areaSqMeters = calculateAreaSqMeters(payload.boundary);
    openStreetMap = await enforceOpenStreetMapCompliance(payload.boundary);
  }

  if (payload.metadata) {
    payload.metadata = attachOpenStreetMapMetadata(payload.metadata, openStreetMap || previous.metadata?.compliance?.openStreetMap);
  }

  if (!payload.metadata && openStreetMap) {
    payload.metadata = attachOpenStreetMapMetadata(previous.metadata, openStreetMap);
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
        demandLevel: reloaded.demandLevel,
        openStreetMap: openStreetMap || previous.metadata?.compliance?.openStreetMap || null
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
    } catch {
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

function parseDate(value, field) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw validationError(`Invalid date provided for ${field}`);
  }

  return parsed;
}

export async function listZoneServices(zoneId) {
  const zone = await ServiceZone.findByPk(zoneId);
  if (!zone) {
    const error = new Error('Zone not found');
    error.statusCode = 404;
    throw error;
  }

  const coverages = await ServiceZoneCoverage.findAll({
    where: { zoneId },
    include: [{ model: Service, as: 'service' }],
    order: [
      ['priority', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });

  return coverages;
}

export async function syncZoneServices({
  zoneId,
  coverages,
  actor = null,
  replace = false
}) {
  if (!Array.isArray(coverages) || coverages.length === 0) {
    throw validationError('At least one coverage entry is required');
  }

  const zone = await ServiceZone.findByPk(zoneId);
  if (!zone) {
    const error = new Error('Zone not found');
    error.statusCode = 404;
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const now = new Date();
    const retainedIds = [];
    const analyticsEvents = [];

    for (const entry of coverages) {
      const { serviceId, coverageType = 'primary', priority = 1, effectiveFrom, effectiveTo, metadata = {} } = entry || {};

      if (!serviceId) {
        throw validationError('Each coverage requires a serviceId');
      }

      const service = await Service.findByPk(serviceId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!service) {
        throw validationError(`Service ${serviceId} was not found`);
      }

      if (service.companyId && service.companyId !== zone.companyId) {
        throw validationError('Service does not belong to the same company as the zone');
      }

      const startAt = parseDate(effectiveFrom, 'effectiveFrom');
      const endAt = parseDate(effectiveTo, 'effectiveTo');

      if (startAt && endAt && endAt.getTime() <= startAt.getTime()) {
        throw validationError('effectiveTo must be later than effectiveFrom');
      }

      const existing = await ServiceZoneCoverage.findOne({
        where: { zoneId, serviceId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existing) {
        await existing.update(
          {
            coverageType,
            priority: Number.isInteger(priority) ? priority : 1,
            effectiveFrom: startAt,
            effectiveTo: endAt,
            metadata: metadata || {}
          },
          { transaction }
        );
        retainedIds.push(existing.id);

        analyticsEvents.push({
          name: 'zone.service.updated',
          entityId: existing.id,
          actor,
          tenantId: zone.companyId,
          occurredAt: now,
          metadata: {
            coverageId: existing.id,
            zoneId,
            serviceId,
            coverageType,
            priority,
            companyId: zone.companyId,
            effectiveFrom: startAt ? startAt.toISOString() : null,
            effectiveTo: endAt ? endAt.toISOString() : null
          }
        });
      } else {
        const created = await ServiceZoneCoverage.create(
          {
            zoneId,
            serviceId,
            coverageType,
            priority: Number.isInteger(priority) ? priority : 1,
            effectiveFrom: startAt,
            effectiveTo: endAt,
            metadata: metadata || {}
          },
          { transaction }
        );

        retainedIds.push(created.id);

        analyticsEvents.push({
          name: 'zone.service.attached',
          entityId: created.id,
          actor,
          tenantId: zone.companyId,
          occurredAt: now,
          metadata: {
            coverageId: created.id,
            zoneId,
            serviceId,
            coverageType,
            priority,
            companyId: zone.companyId,
            effectiveFrom: startAt ? startAt.toISOString() : null,
            effectiveTo: endAt ? endAt.toISOString() : null
          }
        });
      }
    }

    if (replace) {
      const removals = await ServiceZoneCoverage.findAll({
        where: {
          zoneId,
          id: {
            [Op.notIn]: retainedIds
          }
        },
        include: [{ model: Service, as: 'service', attributes: ['id', 'companyId'] }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (removals.length > 0) {
        for (const removal of removals) {
          analyticsEvents.push({
            name: 'zone.service.detached',
            entityId: removal.id,
            actor,
            tenantId: zone.companyId,
            occurredAt: now,
            metadata: {
              coverageId: removal.id,
              zoneId,
              serviceId: removal.serviceId,
              companyId: zone.companyId
            }
          });
        }

        await ServiceZoneCoverage.destroy({
          where: {
            id: {
              [Op.in]: removals.map((removal) => removal.id)
            }
          },
          transaction
        });
      }
    }

    if (analyticsEvents.length > 0) {
      await recordAnalyticsEvents(analyticsEvents, { transaction });
    }

    return ServiceZoneCoverage.findAll({
      where: { zoneId },
      include: [{ model: Service, as: 'service' }],
      order: [
        ['priority', 'ASC'],
        ['createdAt', 'ASC']
      ],
      transaction
    });
  });
}

export async function removeZoneService({ zoneId, coverageId, actor = null }) {
  const coverage = await ServiceZoneCoverage.findOne({
    where: { id: coverageId, zoneId },
    include: [
      { model: Service, as: 'service', attributes: ['id', 'companyId'] },
      { model: ServiceZone, as: 'zone', attributes: ['companyId'] }
    ]
  });

  if (!coverage) {
    const error = new Error('Coverage not found');
    error.statusCode = 404;
    throw error;
  }

  await coverage.destroy();

  await recordAnalyticsEvent({
    name: 'zone.service.detached',
    entityId: coverageId,
    actor,
    tenantId: coverage.zone?.companyId || coverage.service?.companyId || null,
    metadata: {
      zoneId,
      serviceId: coverage.serviceId,
      coverageId,
      companyId: coverage.zone?.companyId || coverage.service?.companyId || null
    }
  });

  return true;
}
