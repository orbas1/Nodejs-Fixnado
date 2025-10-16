import crypto from 'crypto';
import slugify from 'slugify';
import { Op } from 'sequelize';
import {
  Service,
  ServiceCategory,
  Company,
  User,
  sequelize
} from '../models/index.js';
import {
  serviceError,
  normaliseCurrency,
  assertPositive,
  normaliseServiceRecord,
  SERVICE_STATUSES,
  SERVICE_VISIBILITIES,
  SERVICE_KINDS
} from './serviceOrchestrationService.js';

function ensureObject(value, fallback = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback };
  }
  return { ...fallback, ...value };
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

function normaliseGalleryPayload(value) {
  if (value == null) {
    return [];
  }

  const source = Array.isArray(value) ? value : [value];
  return source
    .map((entry) => {
      if (!entry) {
        return null;
      }

      if (typeof entry === 'string') {
        const url = entry.trim();
        return url ? { url, altText: '' } : null;
      }

      if (typeof entry === 'object') {
        const url = typeof entry.url === 'string' ? entry.url.trim() : '';
        if (!url) {
          return null;
        }
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

function generateSlugCandidate(value, fallbackPrefix) {
  if (value && typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      const candidate = slugify(trimmed, { lower: true, strict: true });
      if (candidate) {
        return candidate;
      }
    }
  }

  const prefix = fallbackPrefix ?? 'entry';
  const random = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  return `${prefix}-${random}`;
}

async function ensureUniqueCategorySlug(nameOrSlug, existingId = null, transaction) {
  const base = generateSlugCandidate(nameOrSlug, 'service-category');
  let candidate = base;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conflict = await ServiceCategory.findOne({
      where: existingId
        ? {
            slug: candidate,
            id: { [Op.ne]: existingId }
          }
        : { slug: candidate },
      transaction
    });

    if (!conflict) {
      return candidate;
    }

    candidate = `${base}-${suffix++}`;
  }
}

async function ensureUniqueServiceSlug(titleOrSlug, existingId = null, transaction) {
  const base = generateSlugCandidate(titleOrSlug, 'service');
  let candidate = base;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conflict = await Service.findOne({
      where: existingId
        ? {
            slug: candidate,
            id: { [Op.ne]: existingId }
          }
        : { slug: candidate },
      transaction
    });

    if (!conflict) {
      return candidate;
    }

    candidate = `${base}-${suffix++}`;
  }
}

function mapCategoryResponse(category, counts = {}) {
  const plain = category.get ? category.get({ plain: true }) : category;
  return {
    id: plain.id,
    slug: plain.slug,
    name: plain.name,
    description: plain.description || '',
    icon: plain.icon || null,
    accentColour: plain.accentColour || null,
    parentId: plain.parentId || null,
    ordering: plain.ordering ?? 0,
    isActive: Boolean(plain.isActive),
    metadata: ensureObject(plain.metadata),
    servicesTotal: counts.total ?? 0,
    servicesActive: counts.active ?? 0
  };
}

async function resolveCompanyAndProvider({ providerId, companyId }, transaction) {
  let provider = null;
  let company = null;

  if (providerId) {
    provider = await User.findByPk(providerId, { transaction });
    if (!provider) {
      throw serviceError('Provider account not found', 404);
    }
  }

  if (companyId) {
    company = await Company.findByPk(companyId, { transaction });
    if (!company) {
      throw serviceError('Company not found', 404);
    }
  }

  if (!company && provider) {
    company = await Company.findOne({ where: { userId: provider.id }, transaction });
    if (!company) {
      throw serviceError('Provider must belong to a verified company before creating services', 403);
    }
  }

  if (!company) {
    throw serviceError('A companyId or providerId is required to manage services');
  }

  if (company.verified === false) {
    throw serviceError('Company verification is required before publishing services', 409);
  }

  return { provider, company };
}

function normaliseStatus(status) {
  if (!status) {
    return 'draft';
  }
  const normalised = status.toString().trim().toLowerCase();
  if (!SERVICE_STATUSES.includes(normalised)) {
    throw serviceError(`status must be one of: ${SERVICE_STATUSES.join(', ')}`);
  }
  return normalised;
}

function normaliseVisibility(value) {
  if (!value) {
    return 'restricted';
  }
  const normalised = value.toString().trim().toLowerCase();
  if (!SERVICE_VISIBILITIES.includes(normalised)) {
    throw serviceError(`visibility must be one of: ${SERVICE_VISIBILITIES.join(', ')}`);
  }
  return normalised;
}

function normaliseKind(value) {
  if (!value) {
    return 'standard';
  }
  const normalised = value.toString().trim().toLowerCase();
  if (!SERVICE_KINDS.includes(normalised)) {
    throw serviceError(`kind must be one of: ${SERVICE_KINDS.join(', ')}`);
  }
  return normalised;
}

export async function listServiceCategories({ includeInactive = true } = {}) {
  const where = includeInactive ? {} : { isActive: true };

  const categories = await ServiceCategory.findAll({
    where,
    order: [['ordering', 'ASC'], ['name', 'ASC']]
  });

  if (!categories.length) {
    return [];
  }

  const categoryIds = categories.map((category) => category.id);

  const [totals, activeTotals] = await Promise.all([
    Service.findAll({
      attributes: ['categoryId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      where: { categoryId: { [Op.in]: categoryIds } },
      group: ['categoryId']
    }),
    Service.findAll({
      attributes: ['categoryId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      where: {
        categoryId: { [Op.in]: categoryIds },
        status: { [Op.ne]: 'archived' }
      },
      group: ['categoryId']
    })
  ]);

  const totalMap = totals.reduce((acc, row) => {
    const plain = row.get({ plain: true });
    acc.set(plain.categoryId, Number.parseInt(plain.total, 10) || 0);
    return acc;
  }, new Map());

  const activeMap = activeTotals.reduce((acc, row) => {
    const plain = row.get({ plain: true });
    acc.set(plain.categoryId, Number.parseInt(plain.total, 10) || 0);
    return acc;
  }, new Map());

  return categories.map((category) =>
    mapCategoryResponse(category, {
      total: totalMap.get(category.id) ?? 0,
      active: activeMap.get(category.id) ?? 0
    })
  );
}

export async function createServiceCategory(input) {
  if (!input?.name || typeof input.name !== 'string' || input.name.trim().length < 3) {
    throw serviceError('Category name must be at least 3 characters long');
  }

  return sequelize.transaction(async (transaction) => {
    const slug = await ensureUniqueCategorySlug(input.slug || input.name, null, transaction);

    const created = await ServiceCategory.create(
      {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        icon: input.icon?.trim() || null,
        accentColour: input.accentColour?.trim() || null,
        parentId: input.parentId || null,
        ordering: Number.isFinite(Number(input.ordering)) ? Number(input.ordering) : 0,
        isActive: input.isActive !== false,
        metadata: ensureObject(input.metadata)
      },
      { transaction }
    );

    return mapCategoryResponse(created);
  });
}

export async function updateServiceCategory(categoryId, updates) {
  if (!categoryId) {
    throw serviceError('categoryId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const category = await ServiceCategory.findByPk(categoryId, { transaction });
    if (!category) {
      throw serviceError('Service category not found', 404);
    }

    const patch = {};

    if (typeof updates.name === 'string' && updates.name.trim().length >= 3) {
      patch.name = updates.name.trim();
    }

    if (typeof updates.description === 'string') {
      patch.description = updates.description.trim();
    }

    if (typeof updates.icon === 'string') {
      patch.icon = updates.icon.trim();
    }

    if (typeof updates.accentColour === 'string') {
      patch.accentColour = updates.accentColour.trim();
    }

    if (updates.parentId !== undefined) {
      patch.parentId = updates.parentId || null;
    }

    if (updates.isActive !== undefined) {
      patch.isActive = Boolean(updates.isActive);
    }

    if (updates.metadata !== undefined) {
      patch.metadata = ensureObject(updates.metadata);
    }

    if (updates.ordering !== undefined) {
      patch.ordering = Number.isFinite(Number(updates.ordering)) ? Number(updates.ordering) : category.ordering;
    }

    if (updates.slug) {
      patch.slug = await ensureUniqueCategorySlug(updates.slug, category.id, transaction);
    } else if (updates.name) {
      patch.slug = await ensureUniqueCategorySlug(updates.name, category.id, transaction);
    }

    await category.update(patch, { transaction });
    return mapCategoryResponse(category);
  });
}

export async function archiveServiceCategory(categoryId) {
  if (!categoryId) {
    throw serviceError('categoryId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const category = await ServiceCategory.findByPk(categoryId, { transaction });
    if (!category) {
      throw serviceError('Service category not found', 404);
    }

    await category.update({ isActive: false }, { transaction });
    return mapCategoryResponse(category);
  });
}

function buildServiceWhere({ statuses, visibility, categoryId, providerId, companyId, search }) {
  const where = {};

  if (companyId) {
    where.companyId = companyId;
  }

  if (providerId) {
    where.providerId = providerId;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const allowedStatuses = Array.isArray(statuses)
    ? statuses.filter((status) => SERVICE_STATUSES.includes(status))
    : [];

  if (allowedStatuses.length > 0) {
    where.status = { [Op.in]: allowedStatuses };
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

  return where;
}

export async function listAdminServiceListings({
  limit = 25,
  offset = 0,
  statuses = null,
  visibility = null,
  categoryId = null,
  providerId = null,
  companyId = null,
  search = null
} = {}) {
  const where = buildServiceWhere({ statuses, visibility, categoryId, providerId, companyId, search });

  const query = {
    where,
    include: [
      { model: Company, attributes: ['id', 'verified', 'serviceRegions'] },
      { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName'], required: false },
      {
        model: ServiceCategory,
        as: 'categoryRef',
        attributes: ['id', 'name', 'slug', 'description'],
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Math.min(limit, 100),
    offset,
    distinct: true
  };

  const { rows, count } = await Service.findAndCountAll(query);

  const results = rows.map((service) => normaliseServiceRecord(service));

  const baseWhere = buildServiceWhere({
    statuses: null,
    visibility,
    categoryId,
    providerId,
    companyId,
    search
  });

  const [total, draft, published, paused, archived] = await Promise.all([
    Service.count({ where: baseWhere }),
    Service.count({ where: { ...baseWhere, status: 'draft' } }),
    Service.count({ where: { ...baseWhere, status: 'published' } }),
    Service.count({ where: { ...baseWhere, status: 'paused' } }),
    Service.count({ where: { ...baseWhere, status: 'archived' } })
  ]);

  return {
    results,
    total: typeof count === 'number' ? count : count.length,
    limit: query.limit,
    offset: query.offset,
    summary: {
      total,
      draft,
      published,
      paused,
      archived,
      active: total - archived
    }
  };
}

export async function createAdminServiceListing(input) {
  if (!input?.title || typeof input.title !== 'string' || input.title.trim().length < 3) {
    throw serviceError('A service title of at least 3 characters is required');
  }

  const numericPrice = assertPositive(input.price ?? 0, 'price');
  const currencyCode = normaliseCurrency(input.currency || 'USD');
  const status = normaliseStatus(input.status);
  const visibilityValue = normaliseVisibility(input.visibility);
  const kindValue = normaliseKind(input.kind);

  const gallery = normaliseGalleryPayload(input.gallery);
  const coverage = toStringArray(input.coverage);
  const tags = toStringArray(input.tags);
  const metadata = ensureObject(input.metadata);

  return sequelize.transaction(async (transaction) => {
    const { provider, company } = await resolveCompanyAndProvider(
      { providerId: input.providerId, companyId: input.companyId },
      transaction
    );

    let category = null;
    if (input.categoryId) {
      category = await ServiceCategory.findByPk(input.categoryId, { transaction });
      if (!category) {
        throw serviceError('Referenced service category not found', 404);
      }
    }

    const slug = await ensureUniqueServiceSlug(input.slug || input.title, null, transaction);

    const created = await Service.create(
      {
        providerId: provider ? provider.id : null,
        companyId: company.id,
        category: category?.name || input.category?.trim() || null,
        categoryId: category ? category.id : input.categoryId || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        price: numericPrice,
        currency: currencyCode,
        status,
        visibility: visibilityValue,
        kind: kindValue,
        slug,
        heroImageUrl: input.heroImageUrl?.trim() || null,
        gallery,
        coverage,
        tags,
        metadata
      },
      { transaction }
    );

    await created.reload({
      transaction,
      include: [
        { model: Company, attributes: ['id', 'verified', 'serviceRegions'] },
        { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName'], required: false },
        {
          model: ServiceCategory,
          as: 'categoryRef',
          attributes: ['id', 'name', 'slug', 'description'],
          required: false
        }
      ]
    });

    return normaliseServiceRecord(created);
  });
}

export async function updateAdminServiceListing(serviceId, updates) {
  if (!serviceId) {
    throw serviceError('serviceId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const service = await Service.findByPk(serviceId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
      include: [
        { model: Company, attributes: ['id', 'verified', 'serviceRegions'] },
        { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName'], required: false },
        {
          model: ServiceCategory,
          as: 'categoryRef',
          attributes: ['id', 'name', 'slug', 'description'],
          required: false
        }
      ]
    });

    if (!service) {
      throw serviceError('Service listing not found', 404);
    }

    const patch = {};

    if (updates.title && typeof updates.title === 'string' && updates.title.trim().length >= 3) {
      patch.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      patch.description = updates.description ? updates.description.trim() : null;
    }

    if (updates.price !== undefined) {
      patch.price = assertPositive(updates.price, 'price');
    }

    if (updates.currency) {
      patch.currency = normaliseCurrency(updates.currency);
    }

    if (updates.status) {
      patch.status = normaliseStatus(updates.status);
    }

    if (updates.visibility) {
      patch.visibility = normaliseVisibility(updates.visibility);
    }

    if (updates.kind) {
      patch.kind = normaliseKind(updates.kind);
    }

    if (updates.heroImageUrl !== undefined) {
      patch.heroImageUrl = updates.heroImageUrl ? updates.heroImageUrl.trim() : null;
    }

    if (updates.gallery !== undefined) {
      patch.gallery = normaliseGalleryPayload(updates.gallery);
    }

    if (updates.coverage !== undefined) {
      patch.coverage = toStringArray(updates.coverage);
    }

    if (updates.tags !== undefined) {
      patch.tags = toStringArray(updates.tags);
    }

    if (updates.metadata !== undefined) {
      patch.metadata = ensureObject(updates.metadata, service.metadata);
    }

    if (updates.categoryId !== undefined) {
      if (!updates.categoryId) {
        patch.categoryId = null;
      } else {
        const category = await ServiceCategory.findByPk(updates.categoryId, { transaction });
        if (!category) {
          throw serviceError('Referenced service category not found', 404);
        }
        patch.categoryId = category.id;
        patch.category = category.name;
      }
    }

    if (updates.slug || patch.title) {
      const base = updates.slug || patch.title || service.title;
      patch.slug = await ensureUniqueServiceSlug(base, service.id, transaction);
    }

    await service.update(patch, { transaction });
    await service.reload({ transaction });

    return normaliseServiceRecord(service);
  });
}

export async function updateAdminServiceListingStatus(serviceId, status) {
  if (!serviceId) {
    throw serviceError('serviceId is required');
  }

  const normalisedStatus = normaliseStatus(status);

  return sequelize.transaction(async (transaction) => {
    const service = await Service.findByPk(serviceId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!service) {
      throw serviceError('Service listing not found', 404);
    }

    await service.update({ status: normalisedStatus }, { transaction });
    await service.reload({ transaction });

    return normaliseServiceRecord(service);
  });
}

export async function archiveAdminServiceListing(serviceId) {
  return updateAdminServiceListingStatus(serviceId, 'archived');
}

export async function getServiceManagementSnapshot({
  listingLimit = 12,
  packageLimit = 6
} = {}) {
  const [{ results, summary }, categories, packagesRaw] = await Promise.all([
    listAdminServiceListings({ limit: listingLimit }),
    listServiceCategories({ includeInactive: true }),
    Service.findAll({
      where: { kind: 'package', status: { [Op.ne]: 'archived' } },
      order: [['createdAt', 'DESC']],
      limit: packageLimit,
      include: [
        { model: Company, attributes: ['id', 'verified', 'serviceRegions'] },
        { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName'], required: false },
        {
          model: ServiceCategory,
          as: 'categoryRef',
          attributes: ['id', 'name', 'slug', 'description'],
          required: false
        }
      ]
    })
  ]);

  const packages = packagesRaw.map((service) => normaliseServiceRecord(service));

  const health = [
    {
      id: 'published',
      label: 'Published listings',
      value: summary.published,
      format: 'number',
      caption: 'Visible in marketplace and booking flows'
    },
    {
      id: 'pending',
      label: 'In review',
      value: summary.draft + summary.paused,
      format: 'number',
      caption: 'Require moderation or QA before launch'
    },
    {
      id: 'archived',
      label: 'Archived listings',
      value: summary.archived,
      format: 'number',
      caption: 'Retired from marketplace circulation'
    }
  ];

  const boardColumns = [
    {
      id: 'published',
      title: 'Published',
      description: 'Active listings visible to enterprise buyers.',
      items: results
        .filter((listing) => listing.status === 'published')
        .slice(0, 6)
        .map((listing) => ({
          id: listing.id,
          name: listing.title,
          client: listing.category || 'Marketplace',
          zone: listing.visibility === 'public' ? 'Public' : 'Restricted',
          eta: listing.updatedAt,
          owner: listing.provider ? `${listing.provider.firstName} ${listing.provider.lastName}` : 'Operations',
          risk: listing.status,
          services: listing.tags.length ? listing.tags.slice(0, 3) : listing.coverage.slice(0, 3),
          value: listing.price,
          currency: listing.currency
        }))
    },
    {
      id: 'draft',
      title: 'In review',
      description: 'Draft or pending approval before publication.',
      items: results
        .filter((listing) => listing.status === 'draft')
        .slice(0, 6)
        .map((listing) => ({
          id: listing.id,
          name: listing.title,
          client: listing.category || 'Marketplace',
          zone: 'Review queue',
          eta: listing.updatedAt,
          owner: listing.provider ? `${listing.provider.firstName} ${listing.provider.lastName}` : 'Moderation',
          risk: 'pending',
          services: listing.tags.length ? listing.tags.slice(0, 3) : listing.coverage.slice(0, 3),
          value: listing.price,
          currency: listing.currency
        }))
    },
    {
      id: 'paused',
      title: 'Paused',
      description: 'Temporarily paused listings awaiting remediation.',
      items: results
        .filter((listing) => listing.status === 'paused')
        .slice(0, 6)
        .map((listing) => ({
          id: listing.id,
          name: listing.title,
          client: listing.category || 'Marketplace',
          zone: 'Operational hold',
          eta: listing.updatedAt,
          owner: listing.provider ? `${listing.provider.firstName} ${listing.provider.lastName}` : 'Compliance',
          risk: 'warning',
          services: listing.tags.length ? listing.tags.slice(0, 3) : listing.coverage.slice(0, 3),
          value: listing.price,
          currency: listing.currency
        }))
    },
    {
      id: 'archived',
      title: 'Archived',
      description: 'Retired listings kept for audit and reporting.',
      items: results
        .filter((listing) => listing.status === 'archived')
        .slice(0, 6)
        .map((listing) => ({
          id: listing.id,
          name: listing.title,
          client: listing.category || 'Marketplace',
          zone: 'Records',
          eta: listing.updatedAt,
          owner: 'Records',
          risk: 'archived',
          services: listing.tags.length ? listing.tags.slice(0, 3) : listing.coverage.slice(0, 3),
          value: listing.price,
          currency: listing.currency
        }))
    }
  ].filter((column) => column.items.length > 0);

  const packageSummaries = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.title,
    description: pkg.description || '',
    price: pkg.price,
    currency: pkg.currency,
    highlights: pkg.tags.length ? pkg.tags.slice(0, 4) : pkg.coverage.slice(0, 4),
    serviceId: pkg.id,
    serviceName: pkg.title
  }));

  return {
    health,
    deliveryBoard: boardColumns,
    packages: packageSummaries,
    categories,
    catalogue: results,
    alerts: {
      total: summary.total,
      published: summary.published,
      paused: summary.paused,
      draft: summary.draft,
      archived: summary.archived
    }
  };
}

export default {
  listServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  archiveServiceCategory,
  listAdminServiceListings,
  createAdminServiceListing,
  updateAdminServiceListing,
  updateAdminServiceListingStatus,
  archiveAdminServiceListing,
  getServiceManagementSnapshot
};
