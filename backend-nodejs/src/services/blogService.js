import { Op } from 'sequelize';
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPostCategory,
  BlogPostTag,
  sequelize,
  User
} from '../models/index.js';
import { getCachedPlatformSettings } from './platformSettingsService.js';

const PUBLIC_INCLUDE = [
  { model: BlogCategory, as: 'categories', through: { attributes: [] } },
  { model: BlogTag, as: 'tags', through: { attributes: [] } },
  { model: BlogMedia, as: 'media' },
  { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }
];

function toSlug(value) {
  if (!value) {
    return '';
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

const ALLOWED_TAG_ROLES = new Set(['admin', 'provider', 'finance', 'serviceman', 'user', 'enterprise']);
const TAG_SORT_FIELDS = new Set(['name', 'updatedAt', 'createdAt']);
const TAG_SORT_DIRECTIONS = new Set(['asc', 'desc']);

function normaliseStringList(value, { limit = 24 } = {}) {
  const result = [];
  const seen = new Set();
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  for (const entry of source) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= limit) break;
  }

  return result;
}

function normaliseRoleAccess(value) {
  const entries = normaliseStringList(value, { limit: 12 });
  const allowed = entries.filter((entry) => ALLOWED_TAG_ROLES.has(entry.toLowerCase()));
  if (!allowed.includes('admin')) {
    allowed.push('admin');
  }
  return allowed.length > 0 ? allowed.map((entry) => entry.toLowerCase()) : ['admin'];
}

function normaliseOwnerRole(value) {
  if (typeof value !== 'string') {
    return 'admin';
  }
  const trimmed = value.trim().toLowerCase();
  if (ALLOWED_TAG_ROLES.has(trimmed)) {
    return trimmed;
  }
  return 'admin';
}

function parseStructuredData(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      throw Object.assign(new Error('Structured data must be valid JSON'), { statusCode: 422 });
    }
  }
  throw Object.assign(new Error('Structured data must be an object or JSON string'), { statusCode: 422 });
}

function normaliseOgImageUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      return url.toString();
    } catch (error) {
      throw Object.assign(new Error('Open Graph image URL must be a valid absolute URL'), { statusCode: 422 });
    }
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  throw Object.assign(new Error('Open Graph image URL must be absolute or a root-relative path'), { statusCode: 422 });
}

function ensureCanonicalUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch (error) {
    throw Object.assign(new Error('Canonical URL must be a valid absolute URL'), { statusCode: 422 });
  }
}

function tokenReplace(template, replacements) {
  if (typeof template !== 'string') {
    return null;
  }
  let result = template;
  for (const [token, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`%${token}%`, 'gi');
    result = result.replace(pattern, value);
  }
  return result;
}

function buildTagDefaults(name, slug, settings = getCachedPlatformSettings()) {
  const seo = settings.seo ?? {};
  const tagDefaults = seo.tagDefaults ?? {};
  const displayName = name || (slug ? slug.replace(/-/g, ' ') : 'Tag');
  const canonicalHost = typeof seo.canonicalHost === 'string' ? seo.canonicalHost.trim() : '';
  const siteName = typeof seo.siteName === 'string' && seo.siteName.trim() ? seo.siteName.trim() : 'Fixnado';

  const defaults = {
    metaKeywords: Array.isArray(seo.defaultKeywords) ? seo.defaultKeywords.slice(0, 20) : [],
    structuredData: {},
    synonyms: [],
    roleAccess:
      Array.isArray(tagDefaults.defaultRoleAccess) && tagDefaults.defaultRoleAccess.length
        ? normaliseRoleAccess(tagDefaults.defaultRoleAccess)
        : ['admin'],
    ownerRole: normaliseOwnerRole(tagDefaults.ownerRole)
  };

  if (!defaults.roleAccess.includes(defaults.ownerRole)) {
    defaults.roleAccess.push(defaults.ownerRole);
  }

  if (tagDefaults.metaTitleTemplate) {
    defaults.metaTitle = tokenReplace(tagDefaults.metaTitleTemplate, {
      tag: displayName,
      site: siteName
    });
  } else if (seo.defaultTitle) {
    defaults.metaTitle = `${displayName} • ${siteName}`;
  }

  if (tagDefaults.metaDescriptionTemplate) {
    defaults.metaDescription = tokenReplace(tagDefaults.metaDescriptionTemplate, {
      tag: displayName,
      site: siteName
    });
  } else if (seo.defaultDescription) {
    defaults.metaDescription = seo.defaultDescription;
  }

  if (canonicalHost) {
    const trimmedHost = canonicalHost.replace(/\/$/, '');
    defaults.canonicalUrl = `${trimmedHost}/blog/tags/${slug}`;
  }

  if (seo.social?.defaultImageUrl) {
    defaults.ogImageUrl = seo.social.defaultImageUrl;
  }

  if (seo.social?.defaultImageAlt) {
    defaults.ogImageAlt = seo.social.defaultImageAlt;
  } else if (tagDefaults.defaultOgImageAlt) {
    defaults.ogImageAlt = tokenReplace(tagDefaults.defaultOgImageAlt, {
      tag: displayName,
      site: siteName
    });
  }

  return defaults;
}

export async function listPublishedPosts({ limit = 12, offset = 0, category, tag, search } = {}) {
  const where = { status: 'published' };
  if (category) {
    where['$categories.slug$'] = category;
  }
  if (tag) {
    where['$tags.slug$'] = tag;
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { excerpt: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    limit,
    offset,
    order: [['publishedAt', 'DESC']],
    include: PUBLIC_INCLUDE
  });

  return { posts: rows, total: count };
}

export async function getPostBySlug(slug) {
  return BlogPost.findOne({
    where: { slug, status: 'published' },
    include: PUBLIC_INCLUDE
  });
}

export async function getDashboardPosts({ persona, limit = 5 } = {}) {
  const where = { status: 'published' };
  if (persona) {
    where[Op.or] = [{ '$categories.slug$': persona }, { '$tags.slug$': persona }];
  }
  const posts = await BlogPost.findAll({
    where,
    order: [['publishedAt', 'DESC']],
    limit,
    include: PUBLIC_INCLUDE
  });
  return posts;
}

export async function getAdminPosts({ limit = 20, offset = 0, status, search } = {}) {
  const where = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { excerpt: { [Op.iLike]: `%${search}%` } }
    ];
  }
  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ['status', 'ASC'],
      ['createdAt', 'DESC']
    ],
    include: PUBLIC_INCLUDE
  });
  return { posts: rows, total: count };
}

async function syncCategories(post, categories = [], transaction) {
  if (!Array.isArray(categories)) return;
  const resolved = await Promise.all(
    categories.map(async (input) => {
      if (input.id) {
        const existing = await BlogCategory.findByPk(input.id, { transaction });
        if (existing) return existing;
      }
      const slug = toSlug(input.slug ?? input.name);
      const [record] = await BlogCategory.findOrCreate({
        where: { slug },
        defaults: { name: input.name, description: input.description ?? null },
        transaction
      });
      if (input.description && record.description !== input.description) {
        record.description = input.description;
        await record.save({ transaction });
      }
      return record;
    })
  );
  await post.setCategories(resolved, { transaction });
}

async function syncTags(post, tags = [], transaction) {
  if (!Array.isArray(tags)) return;
  const settings = getCachedPlatformSettings();
  const resolved = await Promise.all(
    tags.map(async (input) => {
      if (input?.id) {
        const existing = await BlogTag.findByPk(input.id, { transaction });
        if (existing) {
          if (input.name && existing.name !== input.name) {
            existing.name = input.name;
            await existing.save({ transaction });
          }
          return existing;
        }
      }

      const label =
        typeof input?.name === 'string' && input.name.trim()
          ? input.name.trim()
          : typeof input === 'string' && input.trim()
            ? input.trim()
            : null;
      const slug = toSlug(input?.slug ?? label);
      if (!slug) {
        throw Object.assign(new Error('Tag name or slug is required'), { statusCode: 400 });
      }
      const friendlyName = label ?? slug.replace(/-/g, ' ');
      const defaults = buildTagDefaults(friendlyName, slug, settings);
      const synonyms = normaliseStringList(input?.synonyms);
      const metaKeywords = normaliseStringList(input?.metaKeywords);
      const roleAccess = Array.isArray(defaults.roleAccess)
        ? Array.from(new Set([...defaults.roleAccess, defaults.ownerRole ?? 'admin']))
        : ['admin'];

      const [record] = await BlogTag.findOrCreate({
        where: { slug },
        defaults: {
          name: friendlyName,
          description: input?.description ?? null,
          metaTitle: defaults.metaTitle ?? null,
          metaDescription: defaults.metaDescription ?? null,
          metaKeywords: metaKeywords.length ? metaKeywords : defaults.metaKeywords ?? [],
          canonicalUrl: defaults.canonicalUrl ?? null,
          ogImageUrl: defaults.ogImageUrl ?? null,
          ogImageAlt: defaults.ogImageAlt ?? null,
          structuredData: defaults.structuredData ?? {},
          synonyms: synonyms.length ? synonyms : defaults.synonyms ?? [],
          roleAccess,
          ownerRole: defaults.ownerRole ?? 'admin'
        },
        transaction
      });
      return record;
    })
  );
  await post.setTags(resolved, { transaction });
}

async function syncMedia(post, media = [], transaction) {
  if (!Array.isArray(media)) return;
  await BlogMedia.destroy({ where: { postId: post.id }, transaction });
  if (media.length === 0) return;
  await BlogMedia.bulkCreate(
    media.map((item) => ({
      postId: post.id,
      url: item.url,
      type: item.type ?? 'image',
      altText: item.altText ?? null,
      metadata: item.metadata ?? {}
    })),
    { transaction }
  );
}

export async function createPost(payload, authorId) {
  const transaction = await sequelize.transaction();
  try {
    const slug = toSlug(payload.slug ?? payload.title);
    const post = await BlogPost.create(
      {
        authorId,
        title: payload.title,
        slug,
        excerpt: payload.excerpt,
        content: payload.content,
        status: payload.status ?? 'draft',
        heroImageUrl: payload.heroImageUrl,
        heroImageAlt: payload.heroImageAlt,
        readingTimeMinutes: payload.readingTimeMinutes,
        publishedAt: payload.status === 'published' ? payload.publishedAt ?? new Date() : null,
        scheduledAt: payload.status === 'scheduled' ? payload.scheduledAt ?? null : null,
        metadata: payload.metadata ?? {}
      },
      { transaction }
    );

    await Promise.all([
      syncCategories(post, payload.categories, transaction),
      syncTags(post, payload.tags, transaction),
      syncMedia(post, payload.media, transaction)
    ]);

    await transaction.commit();
    return BlogPost.findByPk(post.id, { include: PUBLIC_INCLUDE });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updatePost(postId, payload) {
  const transaction = await sequelize.transaction();
  try {
    const post = await BlogPost.findByPk(postId, { transaction });
    if (!post) {
      throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
    }
    if (payload.title) {
      post.title = payload.title;
    }
    if (payload.slug) {
      post.slug = toSlug(payload.slug);
    }
    if (payload.excerpt) {
      post.excerpt = payload.excerpt;
    }
    if (payload.content) {
      post.content = payload.content;
    }
    if (payload.heroImageUrl !== undefined) {
      post.heroImageUrl = payload.heroImageUrl;
    }
    if (payload.heroImageAlt !== undefined) {
      post.heroImageAlt = payload.heroImageAlt;
    }
    if (payload.readingTimeMinutes !== undefined) {
      post.readingTimeMinutes = payload.readingTimeMinutes;
    }
    if (payload.metadata) {
      post.metadata = payload.metadata;
    }
    if (payload.status) {
      post.status = payload.status;
      if (payload.status === 'published') {
        post.publishedAt = payload.publishedAt ?? post.publishedAt ?? new Date();
      }
      if (payload.status === 'scheduled') {
        post.scheduledAt = payload.scheduledAt ?? post.scheduledAt ?? new Date();
      }
      if (payload.status !== 'scheduled') {
        post.scheduledAt = null;
      }
      if (payload.status !== 'published') {
        post.publishedAt = null;
      }
    }

    await post.save({ transaction });

    await Promise.all([
      payload.categories ? syncCategories(post, payload.categories, transaction) : null,
      payload.tags ? syncTags(post, payload.tags, transaction) : null,
      payload.media ? syncMedia(post, payload.media, transaction) : null
    ]);

    await transaction.commit();
    return BlogPost.findByPk(post.id, { include: PUBLIC_INCLUDE });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function publishPost(postId, options = {}) {
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
  }
  post.status = 'published';
  post.publishedAt = options.publishedAt ?? new Date();
  post.scheduledAt = null;
  await post.save();
  return BlogPost.findByPk(post.id, { include: PUBLIC_INCLUDE });
}

export async function archivePost(postId) {
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
  }
  post.status = 'archived';
  await post.save();
  return BlogPost.findByPk(post.id, { include: PUBLIC_INCLUDE });
}

export async function deletePost(postId) {
  const transaction = await sequelize.transaction();
  try {
    await BlogPostCategory.destroy({ where: { postId }, transaction });
    await BlogPostTag.destroy({ where: { postId }, transaction });
    await BlogMedia.destroy({ where: { postId }, transaction });
    const deleted = await BlogPost.destroy({ where: { id: postId }, transaction });
    await transaction.commit();
    return deleted;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listCategories() {
  return BlogCategory.findAll({ order: [['displayOrder', 'ASC'], ['name', 'ASC']] });
}

export async function upsertCategory(payload) {
  const slug = toSlug(payload.slug ?? payload.name);
  const [category] = await BlogCategory.upsert({
    id: payload.id,
    name: payload.name,
    slug,
    description: payload.description ?? null,
    displayOrder: payload.displayOrder ?? 0
  });
  return category;
}

export async function deleteCategory(categoryId) {
  const hasAssignments = await BlogPostCategory.count({ where: { categoryId } });
  if (hasAssignments) {
    throw Object.assign(new Error('Category is in use'), { statusCode: 409 });
  }
  return BlogCategory.destroy({ where: { id: categoryId } });
}

function getLikeOperator() {
  const dialect = BlogTag.sequelize?.getDialect?.();
  return dialect === 'postgres' ? Op.iLike : Op.like;
}

function toPlainTagRecord(row) {
  if (!row) {
    return {};
  }

  if (typeof row.get === 'function') {
    return row.get({ plain: true });
  }

  const plain = { ...row };
  if (plain.roleAccess === undefined && plain.role_access !== undefined) {
    plain.roleAccess = plain.role_access;
  }
  if (plain.metaKeywords === undefined && plain.meta_keywords !== undefined) {
    plain.metaKeywords = plain.meta_keywords;
  }
  if (plain.metaDescription === undefined && plain.meta_description !== undefined) {
    plain.metaDescription = plain.meta_description;
  }
  if (plain.metaTitle === undefined && plain.meta_title !== undefined) {
    plain.metaTitle = plain.meta_title;
  }
  if (plain.canonicalUrl === undefined && plain.canonical_url !== undefined) {
    plain.canonicalUrl = plain.canonical_url;
  }
  if (plain.ogImageUrl === undefined && plain.og_image_url !== undefined) {
    plain.ogImageUrl = plain.og_image_url;
  }
  if (plain.ogImageAlt === undefined && plain.og_image_alt !== undefined) {
    plain.ogImageAlt = plain.og_image_alt;
  }
  if (plain.structuredData === undefined && plain.structured_data !== undefined) {
    plain.structuredData = plain.structured_data;
  }

  return plain;
}

function normaliseTagRecord(record) {
  const metaKeywords = Array.isArray(record.metaKeywords) ? record.metaKeywords : [];
  const synonyms = Array.isArray(record.synonyms) ? record.synonyms : [];
  const roleAccess = Array.isArray(record.roleAccess)
    ? record.roleAccess.map((role) => role.toLowerCase())
    : ['admin'];

  let structuredData = {};
  if (record.structuredData && typeof record.structuredData === 'object' && !Array.isArray(record.structuredData)) {
    structuredData = record.structuredData;
  }

  return {
    ...record,
    metaKeywords,
    synonyms,
    roleAccess,
    structuredData,
    updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null,
    createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null
  };
}

function computeTagStats(records) {
  const stats = {
    total: records.length,
    indexable: 0,
    noindex: 0,
    restricted: 0,
    roleDistribution: {}
  };

  for (const record of records) {
    if (record.noindex) {
      stats.noindex += 1;
    } else {
      stats.indexable += 1;
    }

    const roles = Array.isArray(record.roleAccess) ? record.roleAccess : [];
    const nonAdminRoles = roles.filter((role) => role !== 'admin');
    if (nonAdminRoles.length > 0) {
      stats.restricted += 1;
    }

    for (const role of roles) {
      const key = role.toLowerCase();
      stats.roleDistribution[key] = (stats.roleDistribution[key] ?? 0) + 1;
    }
  }

  return stats;
}

export async function listTags(options = {}) {
  const likeOperator = getLikeOperator();
  const pageSize = Math.min(Math.max(Number.parseInt(options.pageSize ?? 20, 10) || 20, 1), 100);
  const page = Math.max(Number.parseInt(options.page ?? 1, 10) || 1, 1);
  const offset = (page - 1) * pageSize;

  const where = {};
  const andConditions = [];
  const search = typeof options.search === 'string' ? options.search.trim() : '';
  if (search) {
    const query = `%${search}%`;
    where[Op.or] = [
      { name: { [likeOperator]: query } },
      { slug: { [likeOperator]: query } },
      { description: { [likeOperator]: query } }
    ];
  }

  if (options.indexing === 'indexable') {
    where.noindex = false;
  } else if (options.indexing === 'noindex') {
    where.noindex = true;
  }

  const sortFieldCandidate = typeof options.sort === 'string' ? options.sort : 'updatedAt';
  const sortField = TAG_SORT_FIELDS.has(sortFieldCandidate) ? sortFieldCandidate : 'updatedAt';
  const sortDirectionCandidate = typeof options.direction === 'string' ? options.direction.toLowerCase() : 'desc';
  const sortDirection = TAG_SORT_DIRECTIONS.has(sortDirectionCandidate) ? sortDirectionCandidate : 'desc';

  const order =
    sortField === 'name'
      ? [[sortField, sortDirection.toUpperCase()]]
      : [[sortField, sortDirection.toUpperCase()], ['name', 'ASC']];

  const roleFilter =
    typeof options.role === 'string' && options.role.trim().toLowerCase() !== 'all'
      ? options.role.trim().toLowerCase()
      : null;

  let manualRoleFilter = null;
  if (roleFilter) {
    const dialect = BlogTag.sequelize?.getDialect?.();
    if (dialect === 'postgres') {
      where.roleAccess = { [Op.contains]: [roleFilter] };
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      const jsonContains = sequelize.where(
        sequelize.fn('JSON_CONTAINS', sequelize.col('role_access'), JSON.stringify([roleFilter])),
        1
      );
      andConditions.push(jsonContains);
    } else {
      manualRoleFilter = roleFilter;
    }
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  if (manualRoleFilter) {
    const allRows = await BlogTag.findAll({ where, order });
    const normalised = allRows.map((row) => normaliseTagRecord(toPlainTagRecord(row)));
    const filtered = normalised.filter((row) => row.roleAccess.includes(manualRoleFilter));

    const paginated = filtered.slice(offset, offset + pageSize);
    const total = filtered.length;

    return {
      tags: paginated,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize) || 1, 1),
        hasMore: offset + paginated.length < total
      },
      stats: computeTagStats(filtered)
    };
  }

  const { rows, count } = await BlogTag.findAndCountAll({
    where,
    order,
    limit: pageSize,
    offset,
    distinct: true
  });
  const plainRows = rows.map((row) => toPlainTagRecord(row));

  const normalisedRows = plainRows.map(normaliseTagRecord);

  const statsRows = await BlogTag.findAll({
    where,
    attributes: ['id', 'noindex', [sequelize.col('role_access'), 'roleAccess']],
    raw: true
  });
  const normalisedStats = statsRows.map((row) => normaliseTagRecord(toPlainTagRecord(row)));

  const total = typeof count === 'number' ? count : Array.isArray(count) ? count.length : 0;

  return {
    tags: normalisedRows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize) || 1, 1),
      hasMore: page * pageSize < total
    },
    stats: computeTagStats(normalisedStats)
  };
}

export async function upsertTag(payload) {
  if (!payload || typeof payload !== 'object') {
    throw Object.assign(new Error('Payload is required'), { statusCode: 400 });
  }

  const settings = getCachedPlatformSettings();
  const governance = settings.seo?.governance ?? {};
  let existing = null;
  if (payload.id) {
    existing = await BlogTag.findByPk(payload.id);
    if (!existing) {
      throw Object.assign(new Error('Tag not found'), { statusCode: 404 });
    }
  }

  const slugSource = Object.hasOwn(payload, 'slug') ? payload.slug : payload.name ?? existing?.slug ?? '';
  const slugCandidate = toSlug(slugSource);
  const slug = slugCandidate || existing?.slug;
  if (!slug) {
    throw Object.assign(new Error('Tag slug could not be derived'), { statusCode: 422 });
  }

  if (existing && governance.lockSlugEdits && existing.slug !== slug) {
    throw Object.assign(new Error('Slug edits are locked for this tag'), {
      statusCode: 409,
      details: [{ field: 'slug', message: 'locked by governance policy' }]
    });
  }

  const name =
    typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim()
      : existing?.name ?? slug.replace(/-/g, ' ');
  if (!name) {
    throw Object.assign(new Error('Tag name is required'), { statusCode: 422 });
  }

  const defaults = buildTagDefaults(name, slug, settings);
  const description = typeof payload.description === 'string' ? payload.description.trim() || null : null;
  const metaTitle = typeof payload.metaTitle === 'string' ? payload.metaTitle.trim() || null : null;
  const metaDescription =
    typeof payload.metaDescription === 'string' ? payload.metaDescription.trim() || null : null;
  const metaKeywords = normaliseStringList(payload.metaKeywords);
  const synonyms = normaliseStringList(payload.synonyms);
  const requestedRoles = normaliseRoleAccess(payload.roleAccess);
  const ownerRole = normaliseOwnerRole(payload.ownerRole);
  const noindex = Boolean(payload.noindex);

  let canonicalUrl = defaults.canonicalUrl ?? null;
  if (Object.hasOwn(payload, 'canonicalUrl')) {
    canonicalUrl = payload.canonicalUrl ? ensureCanonicalUrl(payload.canonicalUrl) : null;
  }

  let ogImageUrl = defaults.ogImageUrl ?? null;
  if (Object.hasOwn(payload, 'ogImageUrl')) {
    ogImageUrl = payload.ogImageUrl ? normaliseOgImageUrl(payload.ogImageUrl) : null;
  }

  let ogImageAlt = defaults.ogImageAlt ?? null;
  if (Object.hasOwn(payload, 'ogImageAlt')) {
    ogImageAlt = typeof payload.ogImageAlt === 'string' ? payload.ogImageAlt.trim() || null : null;
  }

  const structuredData = Object.hasOwn(payload, 'structuredData')
    ? parseStructuredData(payload.structuredData)
    : defaults.structuredData ?? {};

  const baseRoles = requestedRoles.length ? requestedRoles : defaults.roleAccess ?? ['admin'];
  const roleAccess = Array.from(new Set([...baseRoles, ownerRole]));

  const body = {
    id: payload.id,
    name,
    slug,
    description,
    metaTitle: metaTitle ?? defaults.metaTitle ?? null,
    metaDescription: metaDescription ?? defaults.metaDescription ?? null,
    metaKeywords: Object.hasOwn(payload, 'metaKeywords')
      ? metaKeywords
      : defaults.metaKeywords ?? [],
    canonicalUrl,
    ogImageUrl,
    ogImageAlt,
    noindex,
    structuredData,
    synonyms: Object.hasOwn(payload, 'synonyms') ? synonyms : defaults.synonyms ?? [],
    roleAccess,
    ownerRole
  };

  const [tag] = await BlogTag.upsert(body, { returning: true });
  return tag;
}

export async function deleteTag(tagId) {
  const hasAssignments = await BlogPostTag.count({ where: { tagId } });
  if (hasAssignments) {
    throw Object.assign(new Error('Tag is in use'), { statusCode: 409 });
  }
  return BlogTag.destroy({ where: { id: tagId } });
}
