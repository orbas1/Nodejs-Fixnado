import { Op } from 'sequelize';
import slugify from 'slugify';
import {
  sequelize,
  ServiceTaxonomyType,
  ServiceTaxonomyCategory
} from '../models/index.js';

const TYPE_STATUSES = new Set(['active', 'inactive']);
const CATEGORY_STATUSES = new Set(['active', 'inactive', 'draft']);
const ARCHIVED_STATUS = 'archived';

function buildValidationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function truncate(value, maxLength) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function normaliseKey(value, fallback) {
  const source = typeof value === 'string' && value.trim() ? value : fallback;
  if (!source) {
    return null;
  }
  const key = slugify(source, { lower: true, strict: true, trim: true });
  return key ? key.slice(0, 160) : null;
}

function normaliseSlug(value, fallback) {
  return normaliseKey(value, fallback);
}

function parseDisplayOrder(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function toUniqueStringArray(input, { lowerCase = false, maxItems = 32, maxLength = 120 } = {}) {
  const values = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [];

  const seen = new Set();
  const result = [];

  for (const entry of values) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const normalised = lowerCase ? trimmed.toLowerCase() : trimmed;
    const key = lowerCase ? normalised : normalised.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(maxLength ? normalised.slice(0, maxLength) : normalised);
    if (result.length >= maxItems) {
      break;
    }
  }

  return result;
}

function sanitiseTypeMetadata(input = {}) {
  const metadata = {};
  const documentationUrl = truncate(input.documentationUrl, 512);
  const playbookUrl = truncate(input.playbookUrl, 512);
  const previewUrl = truncate(input.previewUrl, 512);
  const notes = truncate(input.notes, 2000);
  const roleAccess = toUniqueStringArray(input.roleAccess, { lowerCase: true, maxItems: 16, maxLength: 60 });

  if (documentationUrl) metadata.documentationUrl = documentationUrl;
  if (playbookUrl) metadata.playbookUrl = playbookUrl;
  if (previewUrl) metadata.previewUrl = previewUrl;
  if (notes) metadata.notes = notes;
  if (roleAccess.length) metadata.roleAccess = roleAccess;

  return metadata;
}

function sanitiseCategoryMetadata(input = {}) {
  const metadata = {};
  const assetPackUrl = truncate(input.assetPackUrl, 512);
  const contentGuidelines = truncate(input.contentGuidelines, 2000);
  const heroVideoUrl = truncate(input.heroVideoUrl, 512);
  const notes = truncate(input.notes, 2000);
  const roleAccess = toUniqueStringArray(input.roleAccess, { lowerCase: true, maxItems: 16, maxLength: 60 });

  if (assetPackUrl) metadata.assetPackUrl = assetPackUrl;
  if (contentGuidelines) metadata.contentGuidelines = contentGuidelines;
  if (heroVideoUrl) metadata.heroVideoUrl = heroVideoUrl;
  if (notes) metadata.notes = notes;
  if (roleAccess.length) metadata.roleAccess = roleAccess;

  return metadata;
}

function decorateTypes(types, categories) {
  const categoriesByType = new Map();
  for (const category of categories) {
    if (!categoriesByType.has(category.typeId)) {
      categoriesByType.set(category.typeId, []);
    }
    categoriesByType.get(category.typeId).push(category);
  }

  return types.map((type) => {
    const typeCategories = categoriesByType.get(type.id) ?? [];
    return {
      ...type,
      categoryCount: typeCategories.length,
      activeCategoryCount: typeCategories.filter((category) => category.status === 'active').length
    };
  });
}

function decorateCategories(categories, types) {
  const typeMap = new Map(types.map((type) => [type.id, type]));
  return categories.map((category) => {
    const parent = typeMap.get(category.typeId);
    return {
      ...category,
      typeKey: parent?.key ?? null,
      typeName: parent?.name ?? null
    };
  });
}

function computeMeta(types, categories) {
  const totals = {
    types: types.length,
    activeTypes: types.filter((type) => type.status === 'active').length,
    archivedTypes: types.filter((type) => type.status === ARCHIVED_STATUS).length,
    categories: categories.length,
    activeCategories: categories.filter((category) => category.status === 'active').length,
    archivedCategories: categories.filter((category) => category.status === ARCHIVED_STATUS).length,
    featuredCategories: categories.filter((category) => category.isFeatured).length
  };

  const timestamps = [...types, ...categories]
    .map((entry) => (entry.updatedAt ? new Date(entry.updatedAt).getTime() : null))
    .filter((value) => Number.isFinite(value));

  const lastUpdatedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

  return { totals, lastUpdatedAt };
}

function normaliseTypeStatus(value) {
  const normalised = typeof value === 'string' ? value.trim().toLowerCase() : 'active';
  if (TYPE_STATUSES.has(normalised)) {
    return normalised;
  }
  if (normalised === ARCHIVED_STATUS) {
    return ARCHIVED_STATUS;
  }
  return 'active';
}

function normaliseCategoryStatus(value) {
  const normalised = typeof value === 'string' ? value.trim().toLowerCase() : 'active';
  if (CATEGORY_STATUSES.has(normalised)) {
    return normalised;
  }
  if (normalised === ARCHIVED_STATUS) {
    return ARCHIVED_STATUS;
  }
  return 'active';
}

export async function listServiceTaxonomy({ includeArchived = true } = {}) {
  const typeWhere = includeArchived ? {} : { status: { [Op.ne]: ARCHIVED_STATUS } };
  const categoryWhere = includeArchived ? {} : { status: { [Op.ne]: ARCHIVED_STATUS } };

  const [typeRows, categoryRows] = await Promise.all([
    ServiceTaxonomyType.findAll({
      where: typeWhere,
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    }),
    ServiceTaxonomyCategory.findAll({
      where: categoryWhere,
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    })
  ]);

  const plainTypes = typeRows.map((row) => row.get({ plain: true }));
  const plainCategories = categoryRows.map((row) => row.get({ plain: true }));

  const decoratedTypes = decorateTypes(plainTypes, plainCategories);
  const decoratedCategories = decorateCategories(plainCategories, decoratedTypes);
  const meta = computeMeta(decoratedTypes, decoratedCategories);

  return {
    taxonomy: {
      types: decoratedTypes,
      categories: decoratedCategories
    },
    meta
  };
}

export async function upsertServiceTaxonomyType(input = {}, actorId = null) {
  const name = truncate(input.name, 180);
  if (!name) {
    throw buildValidationError('A service type name is required.', [
      { field: 'name', message: 'Enter a descriptive name for the service type.' }
    ]);
  }

  const key = normaliseKey(input.key, name);
  if (!key) {
    throw buildValidationError('A unique key is required.', [
      { field: 'key', message: 'Provide a short unique identifier or leave blank to auto-generate.' }
    ]);
  }

  const description = truncate(input.description, 2000);
  const accentColor = truncate(input.accentColor, 32);
  const icon = truncate(input.icon, 255);
  const displayOrder = parseDisplayOrder(input.displayOrder);
  const metadata = sanitiseTypeMetadata(input.metadata);
  const status = normaliseTypeStatus(input.status);

  if (status === ARCHIVED_STATUS) {
    throw buildValidationError('Archived status must be applied via the archive endpoint.');
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      let instance;
      if (input.id) {
        instance = await ServiceTaxonomyType.findByPk(input.id, { transaction });
        if (!instance) {
          const error = new Error('Service taxonomy type not found');
          error.statusCode = 404;
          throw error;
        }
        await instance.update(
          {
            key,
            name,
            description,
            status,
            accentColor,
            icon,
            displayOrder,
            metadata,
            updatedBy: actorId
          },
          { transaction }
        );
      } else {
        instance = await ServiceTaxonomyType.create(
          {
            key,
            name,
            description,
            status,
            accentColor,
            icon,
            displayOrder,
            metadata,
            createdBy: actorId,
            updatedBy: actorId
          },
          { transaction }
        );
      }

      const saved = await instance.reload({ transaction });
      return saved.get({ plain: true });
    });

    const categoryCount = await ServiceTaxonomyCategory.count({
      where: { typeId: result.id, status: { [Op.ne]: ARCHIVED_STATUS } }
    });

    return {
      type: {
        ...result,
        categoryCount,
        activeCategoryCount: categoryCount
      },
      created: !input.id
    };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw buildValidationError('A service type with this key already exists.', [
        { field: 'key', message: 'Choose a different key; keys must be unique.' }
      ]);
    }
    throw error;
  }
}

export async function archiveServiceTaxonomyType(typeId, actorId = null) {
  if (!typeId) {
    throw buildValidationError('A type id is required to archive.');
  }

  return sequelize.transaction(async (transaction) => {
    const instance = await ServiceTaxonomyType.findByPk(typeId, { transaction });
    if (!instance) {
      const error = new Error('Service taxonomy type not found');
      error.statusCode = 404;
      throw error;
    }

    await instance.update(
      {
        status: ARCHIVED_STATUS,
        archivedAt: new Date(),
        updatedBy: actorId
      },
      { transaction }
    );

    await ServiceTaxonomyCategory.update(
      {
        status: ARCHIVED_STATUS,
        archivedAt: new Date(),
        updatedBy: actorId
      },
      {
        where: { typeId, status: { [Op.ne]: ARCHIVED_STATUS } },
        transaction
      }
    );

    const saved = await instance.reload({ transaction });
    const plain = saved.get({ plain: true });
    return {
      ...plain,
      categoryCount: 0,
      activeCategoryCount: 0
    };
  });
}

export async function upsertServiceTaxonomyCategory(input = {}, actorId = null) {
  const name = truncate(input.name, 180);
  if (!name) {
    throw buildValidationError('A category name is required.', [
      { field: 'name', message: 'Enter a descriptive name for the category.' }
    ]);
  }

  const typeId = input.typeId || input.type?.id;
  if (!typeId) {
    throw buildValidationError('A parent service type is required.', [
      { field: 'typeId', message: 'Select the service type this category belongs to.' }
    ]);
  }

  const parentType = await ServiceTaxonomyType.findByPk(typeId);
  if (!parentType) {
    const error = new Error('Parent service type not found');
    error.statusCode = 404;
    throw error;
  }

  if (parentType.status === ARCHIVED_STATUS) {
    throw buildValidationError('Cannot attach categories to an archived service type.', [
      { field: 'typeId', message: 'Choose an active service type.' }
    ]);
  }

  const slug = normaliseSlug(input.slug, name);
  if (!slug) {
    throw buildValidationError('A unique slug is required.', [
      { field: 'slug', message: 'Provide a slug or leave blank to auto-generate.' }
    ]);
  }

  const description = truncate(input.description, 4000);
  const status = normaliseCategoryStatus(input.status);

  if (status === ARCHIVED_STATUS) {
    throw buildValidationError('Archived status must be applied via the archive endpoint.');
  }

  const displayOrder = parseDisplayOrder(input.displayOrder);
  const defaultTags = toUniqueStringArray(input.defaultTags, { maxItems: 32, maxLength: 120 });
  const searchKeywords = toUniqueStringArray(input.searchKeywords, { lowerCase: true, maxItems: 48, maxLength: 120 });
  const heroImageUrl = truncate(input.heroImageUrl, 1024);
  const heroImageAlt = truncate(input.heroImageAlt, 255);
  const iconUrl = truncate(input.iconUrl, 512);
  const previewUrl = truncate(input.previewUrl, 512);
  const metadata = sanitiseCategoryMetadata(input.metadata);
  const isFeatured = Boolean(input.isFeatured);

  try {
    const result = await sequelize.transaction(async (transaction) => {
      let instance;
      if (input.id) {
        instance = await ServiceTaxonomyCategory.findByPk(input.id, { transaction });
        if (!instance) {
          const error = new Error('Service taxonomy category not found');
          error.statusCode = 404;
          throw error;
        }
        await instance.update(
          {
            typeId,
            slug,
            name,
            description,
            status,
            displayOrder,
            defaultTags,
            searchKeywords,
            heroImageUrl,
            heroImageAlt,
            iconUrl,
            previewUrl,
            isFeatured,
            metadata,
            updatedBy: actorId
          },
          { transaction }
        );
      } else {
        instance = await ServiceTaxonomyCategory.create(
          {
            typeId,
            slug,
            name,
            description,
            status,
            displayOrder,
            defaultTags,
            searchKeywords,
            heroImageUrl,
            heroImageAlt,
            iconUrl,
            previewUrl,
            isFeatured,
            metadata,
            createdBy: actorId,
            updatedBy: actorId
          },
          { transaction }
        );
      }

      const saved = await instance.reload({ transaction });
      return saved.get({ plain: true });
    });

    const type = await ServiceTaxonomyType.findByPk(typeId, { raw: true });

    return {
      category: {
        ...result,
        typeKey: type?.key ?? null,
        typeName: type?.name ?? null
      },
      created: !input.id
    };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw buildValidationError('A category with this slug already exists.', [
        { field: 'slug', message: 'Choose a unique slug for this category.' }
      ]);
    }
    throw error;
  }
}

export async function archiveServiceTaxonomyCategory(categoryId, actorId = null) {
  if (!categoryId) {
    throw buildValidationError('A category id is required to archive.');
  }

  return sequelize.transaction(async (transaction) => {
    const instance = await ServiceTaxonomyCategory.findByPk(categoryId, { transaction });
    if (!instance) {
      const error = new Error('Service taxonomy category not found');
      error.statusCode = 404;
      throw error;
    }

    await instance.update(
      {
        status: ARCHIVED_STATUS,
        archivedAt: new Date(),
        updatedBy: actorId
      },
      { transaction }
    );

    const saved = await instance.reload({ transaction });
    const plain = saved.get({ plain: true });

    return plain;
  });
}
