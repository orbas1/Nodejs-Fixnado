import slugify from 'slugify';
import { Op } from 'sequelize';
import { z } from 'zod';
import sequelize from '../config/database.js';
import {
  WebsitePage,
  WebsiteContentBlock,
  WebsiteNavigationMenu,
  WebsiteNavigationItem
} from '../models/index.js';

const PREVIEW_ORIGIN = process.env.MARKETING_SITE_ORIGIN || process.env.SITE_ORIGIN || 'https://fixnado.com';

const createPageSchema = z
  .object({
    title: z.string().trim().min(1, 'Page title is required').max(200),
    slug: z.string().trim().max(180).optional(),
    status: z.enum(['draft', 'preview', 'published', 'archived']).optional(),
    layout: z.string().trim().max(64).optional(),
    visibility: z.enum(['public', 'authenticated', 'role_gated']).optional(),
    heroHeadline: z.string().trim().max(200).optional().nullable(),
    heroSubheading: z.string().trim().max(2000).optional().nullable(),
    heroImageUrl: z.string().trim().url().optional(),
    heroCtaLabel: z.string().trim().max(120).optional().nullable(),
    heroCtaUrl: z.string().trim().url().optional(),
    featureImageUrl: z.string().trim().url().optional(),
    seoTitle: z.string().trim().max(200).optional().nullable(),
    seoDescription: z.string().trim().max(4000).optional().nullable(),
    previewPath: z.string().trim().max(255).optional().nullable(),
    allowedRoles: z.union([z.array(z.string()), z.string()]).optional(),
    metadata: z.union([z.record(z.any()), z.string()]).optional()
  })
  .strict();

const updatePageSchema = createPageSchema.partial();

const blockSchema = z
  .object({
    type: z.string().trim().min(1, 'Block type is required').max(64),
    title: z.string().trim().max(200).optional().nullable(),
    subtitle: z.string().trim().max(255).optional().nullable(),
    body: z.string().optional().nullable(),
    layout: z.string().trim().max(60).optional(),
    accentColor: z.string().trim().max(32).optional().nullable(),
    backgroundImageUrl: z.string().trim().url().optional(),
    media: z.union([z.record(z.any()), z.array(z.any()), z.string()]).optional(),
    settings: z.union([z.record(z.any()), z.array(z.any()), z.string()]).optional(),
    allowedRoles: z.union([z.array(z.string()), z.string()]).optional(),
    analyticsTag: z.string().trim().max(120).optional().nullable(),
    embedUrl: z.string().trim().url().optional(),
    ctaLabel: z.string().trim().max(120).optional().nullable(),
    ctaUrl: z.string().trim().url().optional(),
    position: z.number().int().nonnegative().optional(),
    isVisible: z.boolean().optional()
  })
  .strict();

const navigationMenuSchema = z
  .object({
    name: z.string().trim().min(1, 'Menu name is required').max(120),
    location: z.string().trim().min(1, 'Location is required').max(60),
    description: z.string().trim().max(255).optional().nullable(),
    isPrimary: z.boolean().optional(),
    allowedRoles: z.union([z.array(z.string()), z.string()]).optional(),
    metadata: z.union([z.record(z.any()), z.string()]).optional()
  })
  .strict();

const navigationItemSchema = z
  .object({
    label: z.string().trim().min(1, 'Navigation label is required').max(180),
    url: z.string().trim().min(1, 'Navigation URL is required').max(1024),
    icon: z.string().trim().max(120).optional().nullable(),
    openInNewTab: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    visibility: z.string().trim().max(32).optional(),
    parentId: z.string().uuid().optional().nullable(),
    allowedRoles: z.union([z.array(z.string()), z.string()]).optional(),
    settings: z.union([z.record(z.any()), z.array(z.any()), z.string()]).optional(),
    analyticsTag: z.string().trim().max(120).optional().nullable()
  })
  .strict();

function validationError(message, details) {
  const error = new Error(message);
  error.statusCode = 422;
  if (details) {
    error.details = details;
  }
  return error;
}

function parseOrThrow(schema, payload, message) {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw validationError(message ?? 'Validation failed', error.flatten());
    }
    throw error;
  }
}

function normaliseRoles(input) {
  if (Array.isArray(input)) {
    return input
      .map((role) => (typeof role === 'string' ? role.trim() : ''))
      .filter((role) => role.length > 0);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((role) => role.trim())
      .filter((role) => role.length > 0);
  }

  return [];
}

function normaliseJson(input, fallback) {
  if (input == null) {
    return fallback;
  }

  if (typeof input === 'string') {
    if (!input.trim()) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_error) {
      throw validationError('Metadata must be valid JSON');
    }
  }

  if (typeof input === 'object') {
    return input;
  }

  return fallback;
}

function generateSlug(value, fallbackTitle) {
  const base = value && value.trim() ? value : fallbackTitle;
  const slug = slugify(base ?? '', {
    lower: true,
    strict: true,
    trim: true
  }).slice(0, 180);

  if (!slug) {
    return `page-${Date.now()}`;
  }

  return slug;
}

function normalisePreviewPath(value, slug) {
  if (typeof value !== 'string' || !value.trim()) {
    return `/${slug}`;
  }
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function buildPreviewUrl(page) {
  const origin = PREVIEW_ORIGIN.replace(/\/$/, '');
  const path = page.previewPath || `/${page.slug}`;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function toPageDto(pageInstance) {
  const page = pageInstance.toJSON();
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    layout: page.layout,
    visibility: page.visibility,
    heroHeadline: page.heroHeadline ?? null,
    heroSubheading: page.heroSubheading ?? null,
    heroImageUrl: page.heroImageUrl ?? null,
    heroCtaLabel: page.heroCtaLabel ?? null,
    heroCtaUrl: page.heroCtaUrl ?? null,
    featureImageUrl: page.featureImageUrl ?? null,
    seoTitle: page.seoTitle ?? null,
    seoDescription: page.seoDescription ?? null,
    allowedRoles: Array.isArray(page.allowedRoles) ? page.allowedRoles : [],
    metadata: page.metadata ?? {},
    previewPath: page.previewPath ?? `/${page.slug}`,
    previewUrl: buildPreviewUrl(page),
    createdBy: page.createdBy ?? null,
    updatedBy: page.updatedBy ?? null,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt
  };
}

function toBlockDto(blockInstance) {
  const block = blockInstance.toJSON();
  return {
    id: block.id,
    pageId: block.pageId,
    type: block.type,
    title: block.title ?? null,
    subtitle: block.subtitle ?? null,
    body: block.body ?? null,
    layout: block.layout,
    accentColor: block.accentColor ?? null,
    backgroundImageUrl: block.backgroundImageUrl ?? null,
    media: block.media ?? {},
    settings: block.settings ?? {},
    allowedRoles: Array.isArray(block.allowedRoles) ? block.allowedRoles : [],
    analyticsTag: block.analyticsTag ?? null,
    embedUrl: block.embedUrl ?? null,
    ctaLabel: block.ctaLabel ?? null,
    ctaUrl: block.ctaUrl ?? null,
    position: block.position ?? 0,
    isVisible: block.isVisible !== false,
    createdBy: block.createdBy ?? null,
    updatedBy: block.updatedBy ?? null,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt
  };
}

function toNavigationItemDto(itemInstance) {
  const item = itemInstance.toJSON();
  return {
    id: item.id,
    menuId: item.menuId,
    parentId: item.parentId ?? null,
    label: item.label,
    url: item.url,
    icon: item.icon ?? null,
    openInNewTab: item.openInNewTab ?? false,
    sortOrder: item.sortOrder ?? 0,
    visibility: item.visibility ?? 'public',
    allowedRoles: Array.isArray(item.allowedRoles) ? item.allowedRoles : [],
    settings: item.settings ?? {},
    analyticsTag: item.analyticsTag ?? null,
    createdBy: item.createdBy ?? null,
    updatedBy: item.updatedBy ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function toNavigationMenuDto(menuInstance, items = []) {
  const menu = menuInstance.toJSON();
  return {
    id: menu.id,
    name: menu.name,
    location: menu.location,
    description: menu.description ?? null,
    isPrimary: menu.isPrimary ?? false,
    allowedRoles: Array.isArray(menu.allowedRoles) ? menu.allowedRoles : [],
    metadata: menu.metadata ?? {},
    createdBy: menu.createdBy ?? null,
    updatedBy: menu.updatedBy ?? null,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
    items: items.map(toNavigationItemDto)
  };
}

export async function listWebsitePages() {
  const pages = await WebsitePage.findAll({ order: [['updatedAt', 'DESC']] });
  return pages.map(toPageDto);
}

export async function getWebsitePage({ id }) {
  const page = await WebsitePage.findByPk(id);
  if (!page) {
    const error = new Error('Website page not found');
    error.statusCode = 404;
    throw error;
  }

  const blocks = await WebsiteContentBlock.findAll({
    where: { pageId: id },
    order: [
      ['position', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });

  return {
    page: toPageDto(page),
    blocks: blocks.map(toBlockDto)
  };
}

async function ensureUniqueSlug(slug, currentId = null) {
  const existing = await WebsitePage.findOne({ where: { slug } });
  if (!existing) {
    return;
  }
  if (currentId && existing.id === currentId) {
    return;
  }
  const error = new Error('A page with this slug already exists');
  error.statusCode = 409;
  throw error;
}

export async function createWebsitePage({ payload, actorId }) {
  const parsed = parseOrThrow(createPageSchema, payload, 'Invalid page payload');
  const slug = generateSlug(parsed.slug, parsed.title);
  await ensureUniqueSlug(slug);

  const allowedRoles = normaliseRoles(parsed.allowedRoles);
  const metadata = normaliseJson(parsed.metadata, {});
  const status = parsed.status ?? 'draft';
  const layout = parsed.layout ?? 'default';
  const visibility = parsed.visibility ?? 'public';
  const previewPath = normalisePreviewPath(parsed.previewPath, slug);

  const page = await WebsitePage.create({
    title: parsed.title,
    slug,
    status,
    layout,
    visibility,
    heroHeadline: parsed.heroHeadline ?? null,
    heroSubheading: parsed.heroSubheading ?? null,
    heroImageUrl: parsed.heroImageUrl ?? null,
    heroCtaLabel: parsed.heroCtaLabel ?? null,
    heroCtaUrl: parsed.heroCtaUrl ?? null,
    featureImageUrl: parsed.featureImageUrl ?? null,
    seoTitle: parsed.seoTitle ?? null,
    seoDescription: parsed.seoDescription ?? null,
    allowedRoles,
    metadata,
    previewPath,
    createdBy: actorId,
    updatedBy: actorId
  });

  return toPageDto(page);
}

export async function updateWebsitePage({ id, payload, actorId }) {
  const page = await WebsitePage.findByPk(id);
  if (!page) {
    const error = new Error('Website page not found');
    error.statusCode = 404;
    throw error;
  }

  const parsed = parseOrThrow(updatePageSchema, payload, 'Invalid page payload');

  const nextTitle = parsed.title ?? page.title;
  if (!nextTitle || !nextTitle.trim()) {
    throw validationError('Page title is required');
  }

  const nextSlug = parsed.slug ? generateSlug(parsed.slug, nextTitle) : page.slug;
  await ensureUniqueSlug(nextSlug, id);

  const allowedRoles = parsed.allowedRoles
    ? normaliseRoles(parsed.allowedRoles)
    : Array.isArray(page.allowedRoles)
      ? page.allowedRoles
      : [];
  const metadata = parsed.metadata
    ? normaliseJson(parsed.metadata, page.metadata ?? {})
    : page.metadata && typeof page.metadata === 'object'
      ? page.metadata
      : {};
  const previewPath = parsed.previewPath
    ? normalisePreviewPath(parsed.previewPath, nextSlug)
    : page.previewPath ?? `/${nextSlug}`;

  await page.update({
    title: nextTitle,
    slug: nextSlug,
    status: parsed.status ?? page.status,
    layout: parsed.layout ?? page.layout,
    visibility: parsed.visibility ?? page.visibility,
    heroHeadline: parsed.heroHeadline ?? page.heroHeadline,
    heroSubheading: parsed.heroSubheading ?? page.heroSubheading,
    heroImageUrl: parsed.heroImageUrl ?? page.heroImageUrl,
    heroCtaLabel: parsed.heroCtaLabel ?? page.heroCtaLabel,
    heroCtaUrl: parsed.heroCtaUrl ?? page.heroCtaUrl,
    featureImageUrl: parsed.featureImageUrl ?? page.featureImageUrl,
    seoTitle: parsed.seoTitle ?? page.seoTitle,
    seoDescription: parsed.seoDescription ?? page.seoDescription,
    allowedRoles,
    metadata,
    previewPath,
    updatedBy: actorId
  });

  await page.reload();
  return toPageDto(page);
}

export async function deleteWebsitePage({ id }) {
  const deleted = await WebsitePage.destroy({ where: { id } });
  if (!deleted) {
    const error = new Error('Website page not found');
    error.statusCode = 404;
    throw error;
  }
}

export async function createWebsiteContentBlock({ pageId, payload, actorId }) {
  const page = await WebsitePage.findByPk(pageId);
  if (!page) {
    const error = new Error('Website page not found');
    error.statusCode = 404;
    throw error;
  }

  const parsed = parseOrThrow(blockSchema, payload, 'Invalid block payload');

  const allowedRoles = parsed.allowedRoles ? normaliseRoles(parsed.allowedRoles) : [];
  const media = parsed.media ? normaliseJson(parsed.media, {}) : {};
  const settings = parsed.settings ? normaliseJson(parsed.settings, {}) : {};
  const maxPosition = await WebsiteContentBlock.max('position', { where: { pageId } });
  const position = parsed.position ?? (Number.isFinite(maxPosition) ? Number(maxPosition) + 1 : 0);

  const block = await WebsiteContentBlock.create({
    pageId,
    type: parsed.type,
    title: parsed.title ?? null,
    subtitle: parsed.subtitle ?? null,
    body: parsed.body ?? null,
    layout: parsed.layout ?? 'stacked',
    accentColor: parsed.accentColor ?? null,
    backgroundImageUrl: parsed.backgroundImageUrl ?? null,
    media,
    settings,
    allowedRoles,
    analyticsTag: parsed.analyticsTag ?? null,
    embedUrl: parsed.embedUrl ?? null,
    ctaLabel: parsed.ctaLabel ?? null,
    ctaUrl: parsed.ctaUrl ?? null,
    position,
    isVisible: parsed.isVisible ?? true,
    createdBy: actorId,
    updatedBy: actorId
  });

  return toBlockDto(block);
}

export async function updateWebsiteContentBlock({ id, payload, actorId }) {
  const block = await WebsiteContentBlock.findByPk(id);
  if (!block) {
    const error = new Error('Website content block not found');
    error.statusCode = 404;
    throw error;
  }

  const parsed = parseOrThrow(blockSchema.partial(), payload, 'Invalid block payload');

  const allowedRoles = parsed.allowedRoles
    ? normaliseRoles(parsed.allowedRoles)
    : Array.isArray(block.allowedRoles)
      ? block.allowedRoles
      : [];
  const media = parsed.media
    ? normaliseJson(parsed.media, block.media ?? {})
    : block.media && typeof block.media === 'object'
      ? block.media
      : {};
  const settings = parsed.settings
    ? normaliseJson(parsed.settings, block.settings ?? {})
    : block.settings && typeof block.settings === 'object'
      ? block.settings
      : {};

  await block.update({
    type: parsed.type ?? block.type,
    title: parsed.title ?? block.title,
    subtitle: parsed.subtitle ?? block.subtitle,
    body: parsed.body ?? block.body,
    layout: parsed.layout ?? block.layout,
    accentColor: parsed.accentColor ?? block.accentColor,
    backgroundImageUrl: parsed.backgroundImageUrl ?? block.backgroundImageUrl,
    media,
    settings,
    allowedRoles,
    analyticsTag: parsed.analyticsTag ?? block.analyticsTag,
    embedUrl: parsed.embedUrl ?? block.embedUrl,
    ctaLabel: parsed.ctaLabel ?? block.ctaLabel,
    ctaUrl: parsed.ctaUrl ?? block.ctaUrl,
    position: parsed.position ?? block.position,
    isVisible: parsed.isVisible ?? block.isVisible,
    updatedBy: actorId
  });

  await block.reload();
  return toBlockDto(block);
}

export async function deleteWebsiteContentBlock({ id }) {
  const deleted = await WebsiteContentBlock.destroy({ where: { id } });
  if (!deleted) {
    const error = new Error('Website content block not found');
    error.statusCode = 404;
    throw error;
  }
}

export async function listWebsiteNavigation() {
  const menus = await WebsiteNavigationMenu.findAll({
    order: [
      ['isPrimary', 'DESC'],
      ['name', 'ASC']
    ]
  });

  if (menus.length === 0) {
    return [];
  }

  const menuIds = menus.map((menu) => menu.id);
  const items = await WebsiteNavigationItem.findAll({
    where: { menuId: menuIds },
    order: [
      ['menuId', 'ASC'],
      ['sortOrder', 'ASC'],
      ['label', 'ASC']
    ]
  });

  const itemsByMenu = new Map();
  items.forEach((item) => {
    const bucket = itemsByMenu.get(item.menuId) ?? [];
    bucket.push(item);
    itemsByMenu.set(item.menuId, bucket);
  });

  return menus.map((menu) => toNavigationMenuDto(menu, itemsByMenu.get(menu.id) ?? []));
}

export async function createWebsiteNavigationMenu({ payload, actorId }) {
  const parsed = parseOrThrow(navigationMenuSchema, payload, 'Invalid navigation menu payload');
  const allowedRoles = parsed.allowedRoles ? normaliseRoles(parsed.allowedRoles) : [];
  const metadata = parsed.metadata ? normaliseJson(parsed.metadata, {}) : {};

  const menu = await WebsiteNavigationMenu.create({
    name: parsed.name,
    location: parsed.location,
    description: parsed.description ?? null,
    isPrimary: parsed.isPrimary ?? false,
    allowedRoles,
    metadata,
    createdBy: actorId,
    updatedBy: actorId
  });

  return toNavigationMenuDto(menu);
}

export async function updateWebsiteNavigationMenu({ id, payload, actorId }) {
  const menu = await WebsiteNavigationMenu.findByPk(id);
  if (!menu) {
    const error = new Error('Navigation menu not found');
    error.statusCode = 404;
    throw error;
  }

  const parsed = parseOrThrow(navigationMenuSchema.partial(), payload, 'Invalid navigation menu payload');
  const allowedRoles = parsed.allowedRoles
    ? normaliseRoles(parsed.allowedRoles)
    : Array.isArray(menu.allowedRoles)
      ? menu.allowedRoles
      : [];
  const metadata = parsed.metadata
    ? normaliseJson(parsed.metadata, menu.metadata ?? {})
    : menu.metadata && typeof menu.metadata === 'object'
      ? menu.metadata
      : {};

  await menu.update({
    name: parsed.name ?? menu.name,
    location: parsed.location ?? menu.location,
    description: parsed.description ?? menu.description,
    isPrimary: parsed.isPrimary ?? menu.isPrimary,
    allowedRoles,
    metadata,
    updatedBy: actorId
  });

  await menu.reload();
  return toNavigationMenuDto(menu);
}

export async function deleteWebsiteNavigationMenu({ id }) {
  const deleted = await WebsiteNavigationMenu.destroy({ where: { id } });
  if (!deleted) {
    const error = new Error('Navigation menu not found');
    error.statusCode = 404;
    throw error;
  }
}

async function ensureParentWithinMenu({ menuId, parentId }) {
  if (!parentId) {
    return;
  }
  const parent = await WebsiteNavigationItem.findOne({ where: { id: parentId, menuId } });
  if (!parent) {
    throw validationError('Parent navigation item must belong to the same menu');
  }
}

export async function createWebsiteNavigationItem({ menuId, payload, actorId }) {
  const menu = await WebsiteNavigationMenu.findByPk(menuId);
  if (!menu) {
    const error = new Error('Navigation menu not found');
    error.statusCode = 404;
    throw error;
  }

  const parsed = parseOrThrow(navigationItemSchema, payload, 'Invalid navigation item payload');
  await ensureParentWithinMenu({ menuId, parentId: parsed.parentId ?? null });

  const allowedRoles = parsed.allowedRoles ? normaliseRoles(parsed.allowedRoles) : [];
  const settings = parsed.settings ? normaliseJson(parsed.settings, {}) : {};

  let sortOrder = parsed.sortOrder;
  if (sortOrder == null) {
    const maxSort = await WebsiteNavigationItem.max('sortOrder', { where: { menuId } });
    sortOrder = Number.isFinite(maxSort) ? Number(maxSort) + 1 : 0;
  }

  const item = await WebsiteNavigationItem.create({
    menuId,
    parentId: parsed.parentId ?? null,
    label: parsed.label,
    url: parsed.url,
    icon: parsed.icon ?? null,
    openInNewTab: parsed.openInNewTab ?? false,
    sortOrder,
    visibility: parsed.visibility ?? 'public',
    allowedRoles,
    settings,
    analyticsTag: parsed.analyticsTag ?? null,
    createdBy: actorId,
    updatedBy: actorId
  });

  return toNavigationItemDto(item);
}

export async function updateWebsiteNavigationItem({ id, payload, actorId }) {
  const item = await WebsiteNavigationItem.findByPk(id);
  if (!item) {
    const error = new Error('Navigation item not found');
    error.statusCode = 404;
    throw error;
  }

  const parsed = parseOrThrow(navigationItemSchema.partial(), payload, 'Invalid navigation item payload');
  const nextParentId = parsed.parentId === undefined ? item.parentId : parsed.parentId ?? null;
  await ensureParentWithinMenu({ menuId: item.menuId, parentId: nextParentId });

  const allowedRoles = parsed.allowedRoles
    ? normaliseRoles(parsed.allowedRoles)
    : Array.isArray(item.allowedRoles)
      ? item.allowedRoles
      : [];
  const settings = parsed.settings
    ? normaliseJson(parsed.settings, item.settings ?? {})
    : item.settings && typeof item.settings === 'object'
      ? item.settings
      : {};

  await item.update({
    parentId: nextParentId,
    label: parsed.label ?? item.label,
    url: parsed.url ?? item.url,
    icon: parsed.icon ?? item.icon,
    openInNewTab: parsed.openInNewTab ?? item.openInNewTab,
    sortOrder: parsed.sortOrder ?? item.sortOrder,
    visibility: parsed.visibility ?? item.visibility,
    allowedRoles,
    settings,
    analyticsTag: parsed.analyticsTag ?? item.analyticsTag,
    updatedBy: actorId
  });

  await item.reload();
  return toNavigationItemDto(item);
}

export async function deleteWebsiteNavigationItem({ id }) {
  const deleted = await WebsiteNavigationItem.destroy({ where: { id } });
  if (!deleted) {
    const error = new Error('Navigation item not found');
    error.statusCode = 404;
    throw error;
  }
}

export async function getWebsiteManagementSnapshot() {
  const [
    totalPages,
    publishedPages,
    previewPages,
    draftPages,
    archivedPages,
    roleGatedPages,
    lastPublishedAt
  ] = await Promise.all([
    WebsitePage.count(),
    WebsitePage.count({ where: { status: 'published' } }),
    WebsitePage.count({ where: { status: 'preview' } }),
    WebsitePage.count({ where: { status: 'draft' } }),
    WebsitePage.count({ where: { status: 'archived' } }),
    WebsitePage.count({ where: { visibility: 'role_gated' } }),
    WebsitePage.max('updatedAt', { where: { status: 'published' } })
  ]);

  const [totalBlocks, visibleBlocks] = await Promise.all([
    WebsiteContentBlock.count(),
    WebsiteContentBlock.count({ where: { isVisible: true } })
  ]);

  const lowerUrlCondition = sequelize.where(
    sequelize.fn('lower', sequelize.col('url')),
    { [Op.like]: 'http%' }
  );

  const restrictedCondition =
    sequelize.getDialect() === 'postgres'
      ? sequelize.where(
          sequelize.literal("jsonb_array_length(coalesce(allowed_roles, '[]'::jsonb))"),
          { [Op.gt]: 0 }
        )
      : sequelize.where(
          sequelize.literal("json_array_length(coalesce(allowed_roles, '[]'))"),
          { [Op.gt]: 0 }
        );

  const [totalMenus, primaryMenus, totalNavItems, nestedItems, externalLinks, restrictedItems] = await Promise.all([
    WebsiteNavigationMenu.count(),
    WebsiteNavigationMenu.count({ where: { isPrimary: true } }),
    WebsiteNavigationItem.count(),
    WebsiteNavigationItem.count({ where: { parentId: { [Op.ne]: null } } }),
    WebsiteNavigationItem.count({ where: lowerUrlCondition }),
    WebsiteNavigationItem.count({ where: restrictedCondition })
  ]);

  return {
    pages: {
      total: totalPages,
      published: publishedPages,
      preview: previewPages,
      draft: draftPages,
      archived: archivedPages,
      roleGated: roleGatedPages,
      lastPublishedAt: lastPublishedAt ? new Date(lastPublishedAt).toISOString() : null
    },
    blocks: {
      total: totalBlocks,
      visible: visibleBlocks
    },
    navigation: {
      menus: totalMenus,
      primaryMenus,
      items: totalNavItems,
      nestedItems,
      externalLinks,
      restrictedItems
    }
  };
}

export async function reorderNavigationItems({ menuId, items }) {
  if (!Array.isArray(items)) {
    throw validationError('Items payload must be an array');
  }

  return sequelize.transaction(async (transaction) => {
    await Promise.all(
      items.map(({ id, sortOrder }) =>
        WebsiteNavigationItem.update(
          { sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0 },
          { where: { id, menuId }, transaction }
        )
      )
    );
  });
}
