import { Op } from 'sequelize';
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPostCategory,
  BlogPostTag,
  BlogPostRevision,
  sequelize,
  User
} from '../models/index.js';

const PUBLIC_INCLUDE = [
  { model: BlogCategory, as: 'categories', through: { attributes: [] } },
  { model: BlogTag, as: 'tags', through: { attributes: [] } },
  { model: BlogMedia, as: 'media' },
  { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }
];

const METADATA_KEYS = [
  'metaTitle',
  'metaDescription',
  'canonicalUrl',
  'ogImageUrl',
  'heroCaption',
  'previewSubtitle',
  'newsletterHeadline',
  'callToActionLabel',
  'callToActionUrl',
  'featured',
  'allowComments',
  'sendToSubscribers',
  'pinned'
];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const VALID_STATUSES = new Set(['draft', 'scheduled', 'published', 'archived']);

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

function sanitiseMetadata(existing = {}, incoming = {}) {
  const next = { ...existing };
  METADATA_KEYS.forEach((key) => {
    if (!hasOwn(incoming, key)) {
      return;
    }
    const value = incoming[key];
    if (typeof value === 'boolean') {
      next[key] = value;
      return;
    }
    if (value === undefined || value === null || value === '') {
      delete next[key];
      return;
    }
    next[key] = value;
  });
  return next;
}

function buildMediaMetadata(item = {}) {
  const payload = { ...(item.metadata ?? {}) };
  const assignable = {
    title: item.title,
    caption: item.caption,
    credit: item.credit,
    focalPoint: item.focalPoint
  };
  Object.entries(assignable).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      delete payload[key];
    } else {
      payload[key] = value;
    }
  });
  return payload;
}

function ensureValidStatus(status) {
  if (!VALID_STATUSES.has(status)) {
    const error = new Error('Invalid blog status supplied');
    error.statusCode = 400;
    throw error;
  }
}

async function recordRevision(post, { transaction, actorId, action } = {}) {
  if (!post) return;
  await BlogPostRevision.create(
    {
      postId: post.id,
      recordedById: actorId ?? null,
      action: action ?? 'updated',
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      status: post.status,
      metadata: post.metadata ?? {},
      publishedAt: post.publishedAt ?? null,
      scheduledAt: post.scheduledAt ?? null
    },
    { transaction }
  );
}

async function ensureUniqueSlug(baseSlug, transaction, excludePostId = null) {
  const sanitizedBase = baseSlug && baseSlug.length > 0 ? baseSlug : toSlug(`post-${Date.now()}`);
  let candidate = sanitizedBase || `post-${Date.now()}`;
  let attempt = 1;
  while (
    await BlogPost.count({
      where: {
        slug: candidate,
        ...(excludePostId ? { id: { [Op.ne]: excludePostId } } : {})
      },
      transaction
    })
  ) {
    attempt += 1;
    candidate = `${sanitizedBase}-${attempt}`;
  }
  return candidate;
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

export async function getAdminPosts({ limit = 20, offset = 0, status, search, category, tag } = {}) {
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

  const include = PUBLIC_INCLUDE.map((entry) => ({ ...entry }));

  if (category) {
    const categoryInclude = include.find((item) => item.as === 'categories');
    if (categoryInclude) {
      categoryInclude.where = { ...(categoryInclude.where ?? {}), id: category };
      categoryInclude.required = true;
    } else {
      include.push({
        model: BlogCategory,
        as: 'categories',
        where: { id: category },
        through: { attributes: [] },
        required: true
      });
    }
  }

  if (tag) {
    const tagInclude = include.find((item) => item.as === 'tags');
    if (tagInclude) {
      tagInclude.where = { ...(tagInclude.where ?? {}), id: tag };
      tagInclude.required = true;
    } else {
      include.push({
        model: BlogTag,
        as: 'tags',
        where: { id: tag },
        through: { attributes: [] },
        required: true
      });
    }
  }

  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ['status', 'ASC'],
      ['createdAt', 'DESC']
    ],
    include,
    distinct: true
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
      if (hasOwn(input, 'description') && record.description !== input.description) {
        record.description = input.description;
        await record.save({ transaction });
      }
      if (hasOwn(input, 'displayOrder') && record.displayOrder !== input.displayOrder) {
        record.displayOrder = input.displayOrder;
        await record.save({ transaction });
      }
      return record;
    })
  );
  await post.setCategories(resolved, { transaction });
}

async function syncTags(post, tags = [], transaction) {
  if (!Array.isArray(tags)) return;
  const resolved = await Promise.all(
    tags.map(async (input) => {
      if (input.id) {
        const existing = await BlogTag.findByPk(input.id, { transaction });
        if (existing) return existing;
      }
      const slug = toSlug(input.slug ?? input.name);
      const [record] = await BlogTag.findOrCreate({
        where: { slug },
        defaults: { name: input.name },
        transaction
      });
      if (hasOwn(input, 'name') && record.name !== input.name) {
        record.name = input.name;
        await record.save({ transaction });
      }
      return record;
    })
  );
  await post.setTags(resolved, { transaction });
}

async function syncMedia(post, media = [], transaction) {
  if (!Array.isArray(media)) return;
  await BlogMedia.destroy({ where: { postId: post.id }, transaction });
  if (media.length === 0) return;
  const rows = media
    .filter((item) => item?.url)
    .map((item) => ({
      postId: post.id,
      url: item.url,
      type: item.type ?? 'image',
      altText: item.altText ?? null,
      metadata: buildMediaMetadata(item)
    }));
  if (rows.length === 0) return;
  await BlogMedia.bulkCreate(rows, { transaction });
}

export async function createPost(payload, authorId) {
  const transaction = await sequelize.transaction();
  try {
    const status = payload.status ?? 'draft';
    ensureValidStatus(status);
    const slug = await ensureUniqueSlug(toSlug(payload.slug ?? payload.title), transaction);
    const post = await BlogPost.create(
      {
        authorId,
        title: payload.title,
        slug,
        excerpt: payload.excerpt,
        content: payload.content,
        status,
        heroImageUrl: payload.heroImageUrl,
        heroImageAlt: payload.heroImageAlt,
        readingTimeMinutes: payload.readingTimeMinutes,
        publishedAt: status === 'published' ? payload.publishedAt ?? new Date() : null,
        scheduledAt: status === 'scheduled' ? payload.scheduledAt ?? null : null,
        metadata: sanitiseMetadata({}, payload.metadata ?? {})
      },
      { transaction }
    );

    await Promise.all([
      syncCategories(post, payload.categories, transaction),
      syncTags(post, payload.tags, transaction),
      syncMedia(post, payload.media, transaction)
    ]);

    await recordRevision(post, { transaction, actorId: authorId, action: 'created' });

    await transaction.commit();
    return BlogPost.findByPk(post.id, { include: PUBLIC_INCLUDE });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updatePost(postId, payload, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const post = await BlogPost.findByPk(postId, { transaction });
    if (!post) {
      throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
    }
    if (hasOwn(payload, 'title')) {
      post.title = payload.title;
    }
    if (hasOwn(payload, 'slug') && payload.slug) {
      post.slug = await ensureUniqueSlug(toSlug(payload.slug), transaction, post.id);
    }
    if (hasOwn(payload, 'excerpt')) {
      post.excerpt = payload.excerpt;
    }
    if (hasOwn(payload, 'content')) {
      post.content = payload.content;
    }
    if (hasOwn(payload, 'heroImageUrl')) {
      post.heroImageUrl = payload.heroImageUrl;
    }
    if (hasOwn(payload, 'heroImageAlt')) {
      post.heroImageAlt = payload.heroImageAlt;
    }
    if (hasOwn(payload, 'readingTimeMinutes')) {
      post.readingTimeMinutes = payload.readingTimeMinutes;
    }
    if (hasOwn(payload, 'metadata')) {
      post.metadata = sanitiseMetadata(post.metadata ?? {}, payload.metadata ?? {});
    }
    if (hasOwn(payload, 'status')) {
      ensureValidStatus(payload.status);
      post.status = payload.status;
      if (payload.status === 'published') {
        post.publishedAt = payload.publishedAt ?? post.publishedAt ?? new Date();
        post.scheduledAt = null;
      }
      if (payload.status === 'scheduled') {
        post.scheduledAt = payload.scheduledAt ?? post.scheduledAt ?? new Date();
        post.publishedAt = null;
      }
      if (payload.status !== 'scheduled') {
        post.scheduledAt = null;
      }
      if (payload.status !== 'published') {
        post.publishedAt = null;
      }
    } else {
      if (hasOwn(payload, 'publishedAt')) {
        post.publishedAt = payload.publishedAt;
      }
      if (hasOwn(payload, 'scheduledAt')) {
        post.scheduledAt = payload.scheduledAt;
      }
    }

    await post.save({ transaction });

    await Promise.all([
      hasOwn(payload, 'categories') ? syncCategories(post, payload.categories, transaction) : null,
      hasOwn(payload, 'tags') ? syncTags(post, payload.tags, transaction) : null,
      hasOwn(payload, 'media') ? syncMedia(post, payload.media, transaction) : null
    ]);

    await recordRevision(post, { transaction, actorId, action: 'updated' });

    await transaction.commit();
    return BlogPost.findByPk(post.id, { include: PUBLIC_INCLUDE });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function publishPost(postId, options = {}, actorId) {
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
  }
  post.status = 'published';
  post.publishedAt = options.publishedAt ?? new Date();
  post.scheduledAt = null;
  await post.save();
  await recordRevision(post, { actorId, action: 'published' });
  return BlogPost.findByPk(post.id, { include: PUBLIC_INCLUDE });
}

export async function archivePost(postId, actorId) {
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
  }
  post.status = 'archived';
  await post.save();
  await recordRevision(post, { actorId, action: 'archived' });
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

export async function duplicatePost(postId, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const source = await BlogPost.findByPk(postId, { include: PUBLIC_INCLUDE, transaction });
    if (!source) {
      throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
    }
    const duplicateTitle = `${source.title} (Copy)`;
    const slug = await ensureUniqueSlug(toSlug(`${source.slug || source.title}-copy`), transaction);
    const clone = await BlogPost.create(
      {
        authorId: actorId ?? source.authorId,
        title: duplicateTitle,
        slug,
        excerpt: source.excerpt,
        content: source.content,
        status: 'draft',
        heroImageUrl: source.heroImageUrl,
        heroImageAlt: source.heroImageAlt,
        readingTimeMinutes: source.readingTimeMinutes,
        metadata: sanitiseMetadata({}, source.metadata ?? {})
      },
      { transaction }
    );

    await Promise.all([
      syncCategories(
        clone,
        source.categories?.map((category) => ({ id: category.id })) ?? [],
        transaction
      ),
      syncTags(
        clone,
        source.tags?.map((tag) => ({ id: tag.id })) ?? [],
        transaction
      ),
      syncMedia(
        clone,
        source.media?.map((asset) => ({
          url: asset.url,
          type: asset.type,
          altText: asset.altText,
          title: asset.metadata?.title,
          caption: asset.metadata?.caption,
          credit: asset.metadata?.credit,
          focalPoint: asset.metadata?.focalPoint
        })) ?? [],
        transaction
      )
    ]);

    await recordRevision(clone, {
      transaction,
      actorId: actorId ?? source.authorId,
      action: 'duplicated'
    });

    await transaction.commit();
    return BlogPost.findByPk(clone.id, { include: PUBLIC_INCLUDE });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listPostRevisions(postId, { limit = 25 } = {}) {
  return BlogPostRevision.findAll({
    where: { postId },
    order: [['createdAt', 'DESC']],
    limit,
    include: [{ model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });
}

export async function restorePostRevision(postId, revisionId, actorId) {
  const revision = await BlogPostRevision.findOne({
    where: { id: revisionId, postId }
  });

  if (!revision) {
    const error = new Error('Revision not found');
    error.statusCode = 404;
    throw error;
  }

  const transaction = await sequelize.transaction();

  try {
    const post = await BlogPost.findByPk(postId, { transaction });
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    const nextSlug = await ensureUniqueSlug(revision.slug, transaction, post.id);

    post.title = revision.title;
    post.slug = nextSlug;
    post.excerpt = revision.excerpt ?? '';
    post.content = revision.content ?? '';
    post.status = revision.status;
    post.metadata = revision.metadata ?? {};
    post.publishedAt = revision.publishedAt ?? null;
    post.scheduledAt = revision.scheduledAt ?? null;

    await post.save({ transaction });

    await recordRevision(post, {
      transaction,
      actorId: actorId ?? revision.recordedById ?? null,
      action: 'restored'
    });

    await transaction.commit();

    return BlogPost.findByPk(postId, { include: PUBLIC_INCLUDE });
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

export async function listTags() {
  return BlogTag.findAll({ order: [['name', 'ASC']] });
}

export async function upsertTag(payload) {
  const slug = toSlug(payload.slug ?? payload.name);
  const [tag] = await BlogTag.upsert({
    id: payload.id,
    name: payload.name,
    slug
  });
  return tag;
}

export async function deleteTag(tagId) {
  const hasAssignments = await BlogPostTag.count({ where: { tagId } });
  if (hasAssignments) {
    throw Object.assign(new Error('Tag is in use'), { statusCode: 409 });
  }
  return BlogTag.destroy({ where: { id: tagId } });
}
