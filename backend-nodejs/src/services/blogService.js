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
      if (input.name && record.name !== input.name) {
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
