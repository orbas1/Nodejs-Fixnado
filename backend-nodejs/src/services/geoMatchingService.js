import { Op } from 'sequelize';
import {
  point as turfPoint,
  distance as turfDistance,
  booleanPointInPolygon,
  bboxPolygon as turfBboxPolygon
} from '@turf/turf';
import { ServiceZone, Service, Company } from '../models/index.js';

const DEMAND_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1
};

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 422;
  return error;
}

function coerceNumber(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function normaliseLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 15;
  }
  return Math.min(parsed, 100);
}

function normaliseRadius(radiusKm) {
  const parsed = Number.parseFloat(radiusKm);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25;
  }
  return Math.min(parsed, 200);
}

function demandWeight(level) {
  return DEMAND_WEIGHTS[level] ?? 1;
}

function pointWithinBoundingBox(point, boundingBox, bufferKm = 0) {
  if (!boundingBox) {
    return false;
  }
  const { longitude, latitude } = point;
  const { west, east, north, south } = boundingBox;
  if ([west, east, north, south].some((value) => typeof value !== 'number')) {
    return false;
  }

  const bufferDegrees = bufferKm / 111;
  return (
    longitude >= west - bufferDegrees &&
    longitude <= east + bufferDegrees &&
    latitude >= south - bufferDegrees &&
    latitude <= north + bufferDegrees
  );
}

function resolveGeometry(zone) {
  if (!zone?.boundary) {
    return null;
  }
  const geometry = zone.boundary.geometry ?? zone.boundary;
  if (!geometry?.type) {
    return null;
  }

  if (geometry.type === 'Polygon') {
    return { type: 'Feature', geometry };
  }

  if (geometry.type === 'MultiPolygon') {
    return { type: 'Feature', geometry };
  }

  return null;
}

function scoreMatch({
  demandLevel,
  serviceCount,
  distanceKm,
  insidePolygon
}) {
  const demand = demandWeight(demandLevel) * 12;
  const serviceScore = Math.min(serviceCount, 8) * 3;
  const distancePenalty = Number.isFinite(distanceKm) ? Math.min(distanceKm, 40) * 0.75 : 0;
  const inclusionBonus = insidePolygon ? 10 : 0;
  return Number((demand + serviceScore + inclusionBonus - distancePenalty).toFixed(2));
}

function decorateService(serviceInstance) {
  const service = serviceInstance.get({ plain: true });
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price,
    currency: service.currency,
    companyId: service.companyId,
    provider: service.provider
      ? {
          id: service.provider.id,
          name: `${service.provider.firstName} ${service.provider.lastName}`.trim()
        }
      : null,
    company: service.Company
      ? {
          id: service.Company.id,
          contactName: service.Company.contactName
        }
      : null,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  };
}

export async function matchServicesToCoordinate(payload) {
  const latitude = coerceNumber(payload?.latitude ?? payload?.lat);
  const longitude = coerceNumber(payload?.longitude ?? payload?.lng ?? payload?.lon);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw validationError('A valid latitude is required');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw validationError('A valid longitude is required');
  }

  const radiusKm = normaliseRadius(payload?.radiusKm ?? payload?.radius);
  const limit = normaliseLimit(payload?.limit);
  const demandFilters = Array.isArray(payload?.demandLevels)
    ? payload.demandLevels.filter((entry) => ['high', 'medium', 'low'].includes(entry))
    : [];
  const categoryFilters = Array.isArray(payload?.categories)
    ? payload.categories.filter((entry) => typeof entry === 'string' && entry.trim() !== '')
    : [];

  const requestPoint = turfPoint([longitude, latitude]);

  const zones = await ServiceZone.findAll({
    include: [{ model: Company, attributes: ['id', 'contactName'] }]
  });

  const candidateZones = [];
  for (const zone of zones) {
    if (!pointWithinBoundingBox({ latitude, longitude }, zone.boundingBox, radiusKm)) {
      continue;
    }

    const feature = resolveGeometry(zone);
    if (!feature) {
      continue;
    }

    const insidePolygon = booleanPointInPolygon(requestPoint, feature);
    const centroidPoint = zone.centroid?.coordinates
      ? turfPoint(zone.centroid.coordinates)
      : turfPoint([
          (zone.boundingBox.west + zone.boundingBox.east) / 2,
          (zone.boundingBox.north + zone.boundingBox.south) / 2
        ]);
    const distanceKm = Number(
      turfDistance(requestPoint, centroidPoint, { units: 'kilometers' }).toFixed(2)
    );

    const demandMatch =
      demandFilters.length === 0 || demandFilters.includes(zone.demandLevel ?? 'medium');
    if (!demandMatch) {
      continue;
    }

    candidateZones.push({ zone, insidePolygon, distanceKm });
  }

  if (candidateZones.length === 0) {
    let closest = null;
    for (const zone of zones) {
      const centroidPoint = zone.centroid?.coordinates
        ? turfPoint(zone.centroid.coordinates)
        : turfPoint([
            (zone.boundingBox.west + zone.boundingBox.east) / 2,
            (zone.boundingBox.north + zone.boundingBox.south) / 2
          ]);
      const distanceKm = Number(
        turfDistance(requestPoint, centroidPoint, { units: 'kilometers' }).toFixed(2)
      );
      if (!closest || distanceKm < closest.distanceKm) {
        closest = { zone, insidePolygon: false, distanceKm };
      }
    }

    if (!closest) {
      return {
        request: { latitude, longitude, radiusKm, limit, demandLevels: demandFilters, categories: categoryFilters },
        matches: [],
        fallback: {
          reason: 'no-zones-configured'
        },
        auditedAt: new Date().toISOString()
      };
    }

    candidateZones.push(closest);
  }

  const companyIds = [...new Set(candidateZones.map((entry) => entry.zone.companyId))];

  const services = await Service.findAll({
    where: {
      companyId: { [Op.in]: companyIds },
      ...(categoryFilters.length > 0 ? { category: { [Op.in]: categoryFilters } } : {})
    },
    include: [
      { association: Service.associations.provider, attributes: ['id', 'firstName', 'lastName'] },
      { model: Company, attributes: ['id', 'contactName'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  const servicesByCompany = new Map();
  services.forEach((service) => {
    const list = servicesByCompany.get(service.companyId) ?? [];
    list.push(service);
    servicesByCompany.set(service.companyId, list);
  });

  const perZoneLimit = Math.max(3, Math.ceil(limit / candidateZones.length));

  const matches = candidateZones
    .map(({ zone, insidePolygon, distanceKm }) => {
      const zoneServices = (servicesByCompany.get(zone.companyId) ?? []).slice(0, perZoneLimit);
      const decorated = zoneServices.map((service) => decorateService(service));
      const score = scoreMatch({
        demandLevel: zone.demandLevel,
        serviceCount: decorated.length,
        distanceKm,
        insidePolygon
      });

      const reason = insidePolygon
        ? 'Coordinate falls within zone boundary'
        : `Closest zone within ${distanceKm.toFixed(2)}km`;

      return {
        zone: {
          id: zone.id,
          name: zone.name,
          companyId: zone.companyId,
          demandLevel: zone.demandLevel,
          metadata: zone.metadata,
          centroid: zone.centroid,
          boundingBox: zone.boundingBox,
          company: zone.Company
            ? {
                id: zone.Company.id,
                contactName: zone.Company.contactName
              }
            : null
        },
        insidePolygon,
        distanceKm,
        score,
        services: decorated,
        reason
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(candidateZones.length, 6));

  const totalServices = matches.reduce((sum, entry) => sum + entry.services.length, 0);
  const fallback = matches.some((entry) => entry.insidePolygon)
    ? null
    : {
        reason: 'closest-zone-projected',
        distanceKm: matches[0]?.distanceKm ?? null,
        zoneId: matches[0]?.zone.id ?? null
      };

  return {
    request: {
      latitude,
      longitude,
      radiusKm,
      limit,
      demandLevels: demandFilters,
      categories: categoryFilters
    },
    matches,
    fallback,
    auditedAt: new Date().toISOString(),
    totalServices
  };
}

export async function previewCoverageWindow({ latitude, longitude, radiusKm }) {
  const lat = coerceNumber(latitude);
  const lon = coerceNumber(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw validationError('Latitude and longitude are required');
  }
  const radius = normaliseRadius(radiusKm);

  const bbox = turfBboxPolygon([
    lon - radius / 111,
    lat - radius / 111,
    lon + radius / 111,
    lat + radius / 111
  ]);

  return bbox.geometry;
}
