import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  Service,
  ServiceCategory,
  ServiceZone,
  ServiceZoneCoverage,
  ServiceAvailabilityWindow,
  ServiceMediaAsset
} from '../models/index.js';
import {
  SERVICE_STATUSES,
  SERVICE_VISIBILITIES,
  SERVICE_KINDS,
  serviceError,
  normaliseCurrency,
  normaliseServiceRecord
} from './serviceOrchestrationService.js';
import { resolveCompanyForActor, toSlug } from './companyAccessService.js';

const MEDIA_TYPES = new Set(['image', 'video', 'document', 'showcase']);
const COVERAGE_TYPES = new Set(['primary', 'secondary', 'supplementary']);

function trimToNull(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return value == null ? null : value;
}

function toStringArray(value) {
  if (value == null) {
    return [];
  }

  const source = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const items = [];

  source.forEach((entry) => {
    if (typeof entry === 'string' && entry.trim()) {
      const trimmed = entry.trim();
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        items.push(trimmed);
      }
      return;
    }

    if (entry && typeof entry === 'object') {
      const label =
        typeof entry.label === 'string'
          ? entry.label.trim()
          : typeof entry.name === 'string'
            ? entry.name.trim()
            : null;
      if (label && !seen.has(label)) {
        seen.add(label);
        items.push(label);
      }
    }
  });

  return items;
}

function normaliseGallery(value) {
  if (value == null) {
    return [];
  }

  const entries = Array.isArray(value) ? value : [value];
  return entries
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        const url = entry.trim();
        return url ? { url, altText: '' } : null;
      }
      if (typeof entry === 'object') {
        const url = typeof entry.url === 'string' ? entry.url.trim() : '';
        if (!url) return null;
        const altText =
          typeof entry.altText === 'string'
            ? entry.altText
            : typeof entry.alt === 'string'
              ? entry.alt
              : '';
        return { url, altText };
      }
      return null;
    })
    .filter(Boolean);
}

function ensureObject(value, fallback = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback };
  }
  return { ...fallback, ...value };
}

function normalisePrice(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw serviceError('price must be a valid number');
    }
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      throw serviceError('price must be a valid number');
    }
    return parsed;
  }
  throw serviceError('price must be numeric');
}

function normaliseCrewSize(value) {
  if (value === null || value === undefined || value === '') {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw serviceError('crewSize must be a positive integer');
  }
  return parsed;
}

function normaliseStatus(value, fallback = 'draft') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim().toLowerCase();
  return SERVICE_STATUSES.includes(trimmed) ? trimmed : fallback;
}

function normaliseVisibility(value, fallback = 'restricted') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim().toLowerCase();
  return SERVICE_VISIBILITIES.includes(trimmed) ? trimmed : fallback;
}

function normaliseKind(value, fallback = 'standard') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim().toLowerCase();
  return SERVICE_KINDS.includes(trimmed) ? trimmed : fallback;
}

function normaliseTime(value) {
  if (!value) {
    throw serviceError('Availability windows require a start and end time');
  }
  const trimmed = value.toString().trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) {
    throw serviceError('Time must be formatted as HH:MM');
  }
  return trimmed;
}

async function ensureUniqueSlug(input, currentId, transaction) {
  const candidate = toSlug(trimToNull(input), `service-${crypto.randomUUID()}`);
  let slug = candidate;
  let suffix = 1;

  const whereBase = currentId
    ? { slug, id: { [Op.ne]: currentId } }
    : { slug };

  let exists = await Service.findOne({ where: whereBase, transaction, attributes: ['id'] });
  while (exists) {
    slug = `${candidate}-${suffix++}`;
    const where = currentId
      ? { slug, id: { [Op.ne]: currentId } }
      : { slug };
    exists = await Service.findOne({ where, transaction, attributes: ['id'] });
  }

  return slug;
}

function formatMediaAsset(asset) {
  if (!asset) {
    return null;
  }
  const json = asset.get ? asset.get({ plain: true }) : asset;
  return {
    id: json.id,
    serviceId: json.serviceId,
    mediaType: json.mediaType,
    url: json.url,
    title: json.title || null,
    altText: json.altText || null,
    thumbnailUrl: json.thumbnailUrl || null,
    sortOrder: json.sortOrder ?? 0,
    isPrimary: Boolean(json.isPrimary),
    metadata: ensureObject(json.metadata)
  };
}

function formatAvailabilityWindow(window) {
  if (!window) {
    return null;
  }
  const plain = window.get ? window.get({ plain: true }) : window;
  return {
    id: plain.id,
    serviceId: plain.serviceId,
    dayOfWeek: plain.dayOfWeek,
    startTime: plain.startTime,
    endTime: plain.endTime,
    maxBookings: plain.maxBookings,
    label: plain.label || null,
    isActive: Boolean(plain.isActive),
    metadata: ensureObject(plain.metadata)
  };
}

function formatZoneAssignment(coverage) {
  if (!coverage) {
    return null;
  }
  const plain = coverage.get ? coverage.get({ plain: true }) : coverage;
  return {
    id: plain.id,
    serviceId: plain.serviceId,
    zoneId: plain.zoneId,
    coverageType: plain.coverageType,
    priority: plain.priority,
    effectiveFrom: plain.effectiveFrom ? plain.effectiveFrom.toISOString() : null,
    effectiveTo: plain.effectiveTo ? plain.effectiveTo.toISOString() : null,
    metadata: ensureObject(plain.metadata),
    zone: plain.zone
      ? {
          id: plain.zone.id,
          name: plain.zone.name,
          demandLevel: plain.zone.demandLevel,
          metadata: ensureObject(plain.zone.metadata)
        }
      : null
  };
}

function formatProviderService(service) {
  const base = normaliseServiceRecord(service);
  const mediaAssets = Array.isArray(service.mediaAssets)
    ? service.mediaAssets.map(formatMediaAsset).filter(Boolean)
    : [];
  const availabilityWindows = Array.isArray(service.availabilityWindows)
    ? service.availabilityWindows.map(formatAvailabilityWindow).filter(Boolean)
    : [];
  const zoneAssignments = Array.isArray(service.zoneCoverage)
    ? service.zoneCoverage.map(formatZoneAssignment).filter(Boolean)
    : [];

  return {
    ...base,
    gallery: Array.isArray(base.gallery) ? base.gallery : [],
    keywordTags: Array.isArray(base.keywordTags) ? base.keywordTags : [],
    seo: ensureObject(base.seo, { title: null, description: null, keywords: [] }),
    availabilitySummary: base.availability,
    availabilityWindows,
    zoneAssignments,
    mediaLibrary: mediaAssets
  };
}

function normaliseAvailabilityInput(windows = []) {
  if (!Array.isArray(windows)) {
    return [];
  }

  return windows
    .map((entry) => {
      if (!entry) return null;
      const day = Number.parseInt(entry.dayOfWeek, 10);
      if (!Number.isFinite(day) || day < 0 || day > 6) {
        return null;
      }
      const start = normaliseTime(entry.startTime);
      const end = normaliseTime(entry.endTime);
      const maxBookings =
        entry.maxBookings === null || entry.maxBookings === undefined || entry.maxBookings === ''
          ? null
          : Number.parseInt(entry.maxBookings, 10);
      if (maxBookings !== null && (!Number.isFinite(maxBookings) || maxBookings < 0)) {
        throw serviceError('maxBookings must be a positive integer');
      }
      return {
        id: entry.id || null,
        dayOfWeek: day,
        startTime: start,
        endTime: end,
        maxBookings,
        label: trimToNull(entry.label),
        isActive: entry.isActive === false ? false : true,
        metadata: ensureObject(entry.metadata)
      };
    })
    .filter(Boolean);
}

function normaliseMediaLibrary(assets = []) {
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .map((asset) => {
      if (!asset) return null;
      const type = typeof asset.mediaType === 'string' ? asset.mediaType.trim().toLowerCase() : 'image';
      const url = trimToNull(asset.url);
      if (!url) {
        return null;
      }
      const resolvedType = MEDIA_TYPES.has(type) ? type : 'image';
      const sortOrder = Number.isFinite(Number(asset.sortOrder)) ? Number(asset.sortOrder) : 0;
      return {
        id: asset.id || null,
        mediaType: resolvedType,
        url,
        title: trimToNull(asset.title),
        altText: trimToNull(asset.altText),
        thumbnailUrl: trimToNull(asset.thumbnailUrl),
        sortOrder,
        isPrimary: Boolean(asset.isPrimary),
        metadata: ensureObject(asset.metadata)
      };
    })
    .filter(Boolean);
}

function normaliseZoneAssignments(assignments = [], zoneIndex = new Map()) {
  if (!Array.isArray(assignments)) {
    return [];
  }

  return assignments
    .map((assignment) => {
      if (!assignment) return null;
      const zoneId = assignment.zoneId || assignment.zone?.id;
      if (!zoneId || !zoneIndex.has(zoneId)) {
        return null;
      }
      const coverageType = typeof assignment.coverageType === 'string'
        ? assignment.coverageType.trim().toLowerCase()
        : 'primary';
      const priority = Number.isFinite(Number(assignment.priority))
        ? Number.parseInt(assignment.priority, 10)
        : 1;
      const effectiveFrom = assignment.effectiveFrom ? new Date(assignment.effectiveFrom) : null;
      const effectiveTo = assignment.effectiveTo ? new Date(assignment.effectiveTo) : null;
      if (effectiveFrom && Number.isNaN(effectiveFrom.getTime())) {
        throw serviceError('effectiveFrom must be a valid date');
      }
      if (effectiveTo && Number.isNaN(effectiveTo.getTime())) {
        throw serviceError('effectiveTo must be a valid date');
      }
      return {
        id: assignment.id || null,
        zoneId,
        coverageType: COVERAGE_TYPES.has(coverageType) ? coverageType : 'primary',
        priority: priority > 0 ? priority : 1,
        effectiveFrom,
        effectiveTo,
        metadata: ensureObject(assignment.metadata)
      };
    })
    .filter(Boolean);
}

export async function listProviderServicesWorkspace({ companyId, actor, search, status, visibility } = {}) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const where = { companyId: company.id };

  if (status && SERVICE_STATUSES.includes(status)) {
    where.status = status;
  }

  if (visibility && SERVICE_VISIBILITIES.includes(visibility)) {
    where.visibility = visibility;
  }

  if (search && search.trim()) {
    const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const term = `%${search.trim().replace(/\s+/g, '%')}%`;
    where[Op.or] = [
      { title: { [likeOperator]: term } },
      { description: { [likeOperator]: term } }
    ];
  }

  const include = [
    { model: ServiceCategory, as: 'categoryRef', attributes: ['id', 'name', 'slug'], required: false },
    {
      model: ServiceZoneCoverage,
      as: 'zoneCoverage',
      include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'demandLevel', 'metadata'] }]
    },
    { model: ServiceAvailabilityWindow, as: 'availabilityWindows' },
    { model: ServiceMediaAsset, as: 'mediaAssets' }
  ];

  const services = await Service.findAll({
    where,
    include,
    order: [['updatedAt', 'DESC']]
  });

  const zoneRecords = await ServiceZone.findAll({
    where: { companyId: company.id },
    attributes: ['id', 'name', 'demandLevel', 'metadata']
  });

  const categories = await ServiceCategory.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'slug', 'description'],
    order: [['name', 'ASC']]
  });

  const [total, draft, published, paused, archived] = await Promise.all([
    Service.count({ where: { companyId: company.id } }),
    Service.count({ where: { companyId: company.id, status: 'draft' } }),
    Service.count({ where: { companyId: company.id, status: 'published' } }),
    Service.count({ where: { companyId: company.id, status: 'paused' } }),
    Service.count({ where: { companyId: company.id, status: 'archived' } })
  ]);

  return {
    companyId: company.id,
    summary: {
      total,
      draft,
      published,
      paused,
      archived,
      active: total - archived
    },
    services: services.map((service) => formatProviderService(service)),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || null
    })),
    zones: zoneRecords.map((zone) => ({
      id: zone.id,
      name: zone.name,
      demandLevel: zone.demandLevel,
      metadata: ensureObject(zone.metadata)
    }))
  };
}

export async function getProviderService(serviceId, { companyId, actor } = {}) {
  if (!serviceId) {
    throw serviceError('serviceId is required', 400);
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  const service = await Service.findOne({
    where: { id: serviceId, companyId: company.id },
    include: [
      { model: ServiceCategory, as: 'categoryRef', attributes: ['id', 'name', 'slug'], required: false },
      {
        model: ServiceZoneCoverage,
        as: 'zoneCoverage',
        include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'demandLevel', 'metadata'] }]
      },
      { model: ServiceAvailabilityWindow, as: 'availabilityWindows' },
      { model: ServiceMediaAsset, as: 'mediaAssets' }
    ]
  });

  if (!service) {
    throw serviceError('Service not found', 404);
  }

  return formatProviderService(service);
}

export async function createProviderService(payload = {}, { companyId, actor } = {}) {
  const { company, actor: resolvedActor } = await resolveCompanyForActor({ companyId, actor });
  const zoneRecords = await ServiceZone.findAll({
    where: { companyId: company.id },
    attributes: ['id', 'name', 'demandLevel', 'metadata']
  });
  const zoneIndex = new Map(zoneRecords.map((zone) => [zone.id, zone]));

  return sequelize.transaction(async (transaction) => {
    let categoryInstance = null;
    if (payload.categoryId) {
      categoryInstance = await ServiceCategory.findByPk(payload.categoryId, { transaction });
      if (!categoryInstance) {
        throw serviceError('Referenced service category not found', 404);
      }
    }

    const status = normaliseStatus(payload.status);
    const visibility = normaliseVisibility(payload.visibility);
    const kind = normaliseKind(payload.kind);
    const currency = normaliseCurrency(payload.currency || 'USD');
    const price = normalisePrice(payload.price);
    const crewSize = normaliseCrewSize(payload.crewSize);
    const gallery = normaliseGallery(payload.gallery);
    const tags = toStringArray(payload.tags);
    const keywordTags = toStringArray(payload.keywordTags);
    const seoKeywords = toStringArray(payload.seo?.keywords ?? payload.seoKeywords);
    const slug = await ensureUniqueSlug(payload.slug || payload.title, null, transaction);

    const service = await Service.create(
      {
        companyId: company.id,
        providerId: resolvedActor?.type === 'company' ? resolvedActor.id : null,
        title: trimToNull(payload.title) || 'New service',
        slug,
        description: trimToNull(payload.description),
        shortDescription: trimToNull(payload.shortDescription),
        tagline: trimToNull(payload.tagline),
        displayUrl: trimToNull(payload.displayUrl),
        status,
        visibility,
        kind,
        price,
        currency,
        pricingModel: trimToNull(payload.pricingModel),
        pricingUnit: trimToNull(payload.pricingUnit),
        crewSize,
        heroImageUrl: trimToNull(payload.heroImageUrl),
        showcaseVideoUrl: trimToNull(payload.showcaseVideoUrl),
        gallery,
        tags,
        keywordTags,
        seoTitle: trimToNull(payload.seo?.title ?? payload.seoTitle),
        seoDescription: trimToNull(payload.seo?.description ?? payload.seoDescription),
        seoKeywords,
        metadata: ensureObject(payload.metadata)
      },
      { transaction }
    );

    if (categoryInstance) {
      await service.update(
        {
          categoryId: categoryInstance.id,
          category: categoryInstance.name
        },
        { transaction }
      );
    }

    const zoneAssignments = normaliseZoneAssignments(payload.zoneAssignments, zoneIndex);
    const availabilityWindows = normaliseAvailabilityInput(payload.availability);
    const mediaLibrary = normaliseMediaLibrary(payload.mediaLibrary);

    if (zoneAssignments.length) {
      await ServiceZoneCoverage.bulkCreate(
        zoneAssignments.map((assignment) => ({
          serviceId: service.id,
          zoneId: assignment.zoneId,
          coverageType: assignment.coverageType,
          priority: assignment.priority,
          effectiveFrom: assignment.effectiveFrom,
          effectiveTo: assignment.effectiveTo,
          metadata: assignment.metadata
        })),
        { transaction }
      );

      await service.update(
        {
          coverage: zoneAssignments
            .map((assignment) => zoneIndex.get(assignment.zoneId)?.name)
            .filter(Boolean)
        },
        { transaction }
      );
    }

    if (availabilityWindows.length) {
      await ServiceAvailabilityWindow.bulkCreate(
        availabilityWindows.map((window) => ({
          serviceId: service.id,
          dayOfWeek: window.dayOfWeek,
          startTime: window.startTime,
          endTime: window.endTime,
          maxBookings: window.maxBookings,
          label: window.label,
          isActive: window.isActive,
          metadata: window.metadata
        })),
        { transaction }
      );
    }

    if (mediaLibrary.length) {
      await ServiceMediaAsset.bulkCreate(
        mediaLibrary.map((asset) => ({
          serviceId: service.id,
          mediaType: asset.mediaType,
          url: asset.url,
          title: asset.title,
          altText: asset.altText,
          thumbnailUrl: asset.thumbnailUrl,
          sortOrder: asset.sortOrder,
          isPrimary: asset.isPrimary,
          metadata: asset.metadata
        })),
        { transaction }
      );
    }

    await service.reload({
      transaction,
      include: [
        { model: ServiceCategory, as: 'categoryRef', attributes: ['id', 'name', 'slug'], required: false },
        {
          model: ServiceZoneCoverage,
          as: 'zoneCoverage',
          include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'demandLevel', 'metadata'] }]
        },
        { model: ServiceAvailabilityWindow, as: 'availabilityWindows' },
        { model: ServiceMediaAsset, as: 'mediaAssets' }
      ]
    });

    return formatProviderService(service);
  });
}

export async function updateProviderService(serviceId, payload = {}, { companyId, actor } = {}) {
  if (!serviceId) {
    throw serviceError('serviceId is required', 400);
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });
  const zoneRecords = await ServiceZone.findAll({
    where: { companyId: company.id },
    attributes: ['id', 'name', 'demandLevel', 'metadata']
  });
  const zoneIndex = new Map(zoneRecords.map((zone) => [zone.id, zone]));

  return sequelize.transaction(async (transaction) => {
    const service = await Service.findOne({
      where: { id: serviceId, companyId: company.id },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!service) {
      throw serviceError('Service not found', 404);
    }

    let categoryInstance = null;
    if (payload.categoryId !== undefined) {
      if (payload.categoryId === null) {
        categoryInstance = null;
      } else {
        categoryInstance = await ServiceCategory.findByPk(payload.categoryId, { transaction });
        if (!categoryInstance) {
          throw serviceError('Referenced service category not found', 404);
        }
      }
    }

    const updates = {};

    if (payload.title !== undefined) {
      updates.title = trimToNull(payload.title) || service.title;
    }

    if (payload.slug !== undefined || payload.title !== undefined) {
      const slugSource = payload.slug || payload.title || service.slug;
      updates.slug = await ensureUniqueSlug(slugSource, service.id, transaction);
    }

    if (payload.description !== undefined) {
      updates.description = trimToNull(payload.description);
    }

    if (payload.shortDescription !== undefined) {
      updates.shortDescription = trimToNull(payload.shortDescription);
    }

    if (payload.tagline !== undefined) {
      updates.tagline = trimToNull(payload.tagline);
    }

    if (payload.displayUrl !== undefined) {
      updates.displayUrl = trimToNull(payload.displayUrl);
    }

    if (payload.status !== undefined) {
      updates.status = normaliseStatus(payload.status, service.status);
    }

    if (payload.visibility !== undefined) {
      updates.visibility = normaliseVisibility(payload.visibility, service.visibility);
    }

    if (payload.kind !== undefined) {
      updates.kind = normaliseKind(payload.kind, service.kind);
    }

    if (payload.price !== undefined) {
      updates.price = normalisePrice(payload.price);
    }

    if (payload.currency !== undefined) {
      updates.currency = normaliseCurrency(payload.currency || service.currency || 'USD');
    }

    if (payload.pricingModel !== undefined) {
      updates.pricingModel = trimToNull(payload.pricingModel);
    }

    if (payload.pricingUnit !== undefined) {
      updates.pricingUnit = trimToNull(payload.pricingUnit);
    }

    if (payload.crewSize !== undefined) {
      updates.crewSize = normaliseCrewSize(payload.crewSize);
    }

    if (payload.heroImageUrl !== undefined) {
      updates.heroImageUrl = trimToNull(payload.heroImageUrl);
    }

    if (payload.showcaseVideoUrl !== undefined) {
      updates.showcaseVideoUrl = trimToNull(payload.showcaseVideoUrl);
    }

    if (payload.gallery !== undefined) {
      updates.gallery = normaliseGallery(payload.gallery);
    }

    if (payload.tags !== undefined) {
      updates.tags = toStringArray(payload.tags);
    }

    if (payload.keywordTags !== undefined) {
      updates.keywordTags = toStringArray(payload.keywordTags);
    }

    if (payload.seo !== undefined || payload.seoTitle !== undefined) {
      updates.seoTitle = trimToNull(payload.seo?.title ?? payload.seoTitle);
      updates.seoDescription = trimToNull(payload.seo?.description ?? payload.seoDescription);
      updates.seoKeywords = toStringArray(payload.seo?.keywords ?? payload.seoKeywords);
    }

    if (payload.metadata !== undefined) {
      updates.metadata = ensureObject(payload.metadata, ensureObject(service.metadata));
    }

    if (Object.keys(updates).length > 0) {
      await service.update(updates, { transaction });
    }

    if (categoryInstance !== null) {
      await service.update(
        {
          categoryId: categoryInstance?.id ?? null,
          category: categoryInstance?.name ?? null
        },
        { transaction }
      );
    }

    const zoneAssignments = payload.zoneAssignments !== undefined
      ? normaliseZoneAssignments(payload.zoneAssignments, zoneIndex)
      : null;
    const availabilityWindows = payload.availability !== undefined
      ? normaliseAvailabilityInput(payload.availability)
      : null;
    const mediaLibrary = payload.mediaLibrary !== undefined
      ? normaliseMediaLibrary(payload.mediaLibrary)
      : null;

    if (zoneAssignments !== null) {
      await ServiceZoneCoverage.destroy({ where: { serviceId: service.id }, transaction });
      if (zoneAssignments.length) {
        await ServiceZoneCoverage.bulkCreate(
          zoneAssignments.map((assignment) => ({
            serviceId: service.id,
            zoneId: assignment.zoneId,
            coverageType: assignment.coverageType,
            priority: assignment.priority,
            effectiveFrom: assignment.effectiveFrom,
            effectiveTo: assignment.effectiveTo,
            metadata: assignment.metadata
          })),
          { transaction }
        );
      }
      await service.update(
        {
          coverage: zoneAssignments
            .map((assignment) => zoneIndex.get(assignment.zoneId)?.name)
            .filter(Boolean)
        },
        { transaction }
      );
    }

    if (availabilityWindows !== null) {
      await ServiceAvailabilityWindow.destroy({ where: { serviceId: service.id }, transaction });
      if (availabilityWindows.length) {
        await ServiceAvailabilityWindow.bulkCreate(
          availabilityWindows.map((window) => ({
            serviceId: service.id,
            dayOfWeek: window.dayOfWeek,
            startTime: window.startTime,
            endTime: window.endTime,
            maxBookings: window.maxBookings,
            label: window.label,
            isActive: window.isActive,
            metadata: window.metadata
          })),
          { transaction }
        );
      }
    }

    if (mediaLibrary !== null) {
      await ServiceMediaAsset.destroy({ where: { serviceId: service.id }, transaction });
      if (mediaLibrary.length) {
        await ServiceMediaAsset.bulkCreate(
          mediaLibrary.map((asset) => ({
            serviceId: service.id,
            mediaType: asset.mediaType,
            url: asset.url,
            title: asset.title,
            altText: asset.altText,
            thumbnailUrl: asset.thumbnailUrl,
            sortOrder: asset.sortOrder,
            isPrimary: asset.isPrimary,
            metadata: asset.metadata
          })),
          { transaction }
        );
      }
    }

    await service.reload({
      transaction,
      include: [
        { model: ServiceCategory, as: 'categoryRef', attributes: ['id', 'name', 'slug'], required: false },
        {
          model: ServiceZoneCoverage,
          as: 'zoneCoverage',
          include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'demandLevel', 'metadata'] }]
        },
        { model: ServiceAvailabilityWindow, as: 'availabilityWindows' },
        { model: ServiceMediaAsset, as: 'mediaAssets' }
      ]
    });

    return formatProviderService(service);
  });
}

export async function deleteProviderService(serviceId, { companyId, actor } = {}) {
  if (!serviceId) {
    throw serviceError('serviceId is required', 400);
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  const deleted = await Service.destroy({ where: { id: serviceId, companyId: company.id } });
  if (!deleted) {
    throw serviceError('Service not found', 404);
  }
}
