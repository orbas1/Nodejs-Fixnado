import slugify from 'slugify';
import { Op } from 'sequelize';
import {
  HomePage,
  HomePageSection,
  HomePageComponent,
  sequelize
} from '../models/index.js';

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseSlug(value) {
  if (!value) {
    return '';
  }

  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'en'
  })
    .replace(/-{2,}/g, '-')
    .slice(0, 120);
}

function sanitiseObject(value, fallback = {}) {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }
  if (Array.isArray(value)) {
    return { ...fallback };
  }
  return { ...fallback, ...value };
}

function sanitiseMedia(media) {
  if (!media || typeof media !== 'object') {
    return {};
  }
  const result = {};
  if (typeof media.primaryUrl === 'string' && media.primaryUrl.trim()) {
    result.primaryUrl = media.primaryUrl.trim();
  }
  if (typeof media.altText === 'string' && media.altText.trim()) {
    result.altText = media.altText.trim();
  }
  if (typeof media.videoUrl === 'string' && media.videoUrl.trim()) {
    result.videoUrl = media.videoUrl.trim();
  }
  if (Array.isArray(media.gallery)) {
    result.gallery = media.gallery
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof media.focalPointX === 'number') {
    result.focalPointX = media.focalPointX;
  }
  if (typeof media.focalPointY === 'number') {
    result.focalPointY = media.focalPointY;
  }
  return result;
}

function sanitiseConfig(config) {
  if (!config || typeof config !== 'object') {
    return {};
  }
  const next = { ...config };
  if (Array.isArray(config.tags)) {
    next.tags = config.tags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter((tag) => tag.length > 0);
  }
  if (Array.isArray(config.metrics)) {
    next.metrics = config.metrics
      .map((metric) => {
        if (!metric || typeof metric !== 'object') {
          return null;
        }
        const label = typeof metric.label === 'string' ? metric.label.trim() : '';
        if (!label) {
          return null;
        }
        const value = typeof metric.value === 'string' ? metric.value.trim() : metric.value ?? null;
        const caption = typeof metric.caption === 'string' ? metric.caption.trim() : metric.caption ?? null;
        return { label, value, caption };
      })
      .filter(Boolean);
  }
  if (config.columns != null) {
    const numeric = Number.parseInt(config.columns, 10);
    next.columns = Number.isNaN(numeric) ? 1 : Math.max(1, numeric);
  }
  if (typeof config.showInNavigation !== 'boolean') {
    next.showInNavigation = Boolean(config.showInNavigation);
  }
  return next;
}

function buildCopyLabel(value, suffix = 'Copy') {
  const base = typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Untitled';
  return `${base} ${suffix}`.trim();
}

function serialiseComponent(input) {
  if (!input) {
    return null;
  }
  const component = input.toJSON ? input.toJSON() : input;
  return {
    id: component.id,
    homePageId: component.homePageId,
    sectionId: component.sectionId,
    type: component.type,
    title: component.title,
    subheading: component.subheading,
    body: component.body,
    badge: component.badge,
    layout: component.layout,
    variant: component.variant,
    backgroundColor: component.backgroundColor,
    textColor: component.textColor,
    media: component.media ?? {},
    config: component.config ?? {},
    callToActionLabel: component.callToActionLabel,
    callToActionHref: component.callToActionHref,
    secondaryActionLabel: component.secondaryActionLabel,
    secondaryActionHref: component.secondaryActionHref,
    position: component.position,
    createdAt: component.createdAt,
    updatedAt: component.updatedAt
  };
}

function serialiseSection(input) {
  if (!input) {
    return null;
  }
  const section = input.toJSON ? input.toJSON() : input;
  const components = Array.isArray(section.components) ? section.components : [];
  components.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return {
    id: section.id,
    homePageId: section.homePageId,
    title: section.title,
    handle: section.handle,
    description: section.description,
    layout: section.layout,
    backgroundColor: section.backgroundColor,
    textColor: section.textColor,
    accentColor: section.accentColor,
    position: section.position,
    settings: section.settings ?? {},
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
    components: components.map((component) => serialiseComponent(component))
  };
}

function serialisePage(input) {
  const page = input.toJSON ? input.toJSON() : input;
  const sections = Array.isArray(page.sections) ? page.sections : [];
  sections.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return {
    id: page.id,
    name: page.name,
    slug: page.slug,
    description: page.description,
    status: page.status,
    theme: page.theme,
    layout: page.layout,
    accentColor: page.accentColor,
    backgroundColor: page.backgroundColor,
    heroLayout: page.heroLayout,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    settings: page.settings ?? {},
    publishedAt: page.publishedAt,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    sections: sections.map((section) => serialiseSection(section))
  };
}

async function ensureUniqueSlug(baseSlug, excludeId, transaction) {
  const base = normaliseSlug(baseSlug) || 'page';
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = excludeId
      ? { slug: candidate, id: { [Op.ne]: excludeId } }
      : { slug: candidate };
    const existing = await HomePage.findOne({ where, transaction, lock: transaction ? transaction.LOCK.UPDATE : undefined });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function listHomePages() {
  const pages = await HomePage.findAll({
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: HomePageSection,
        as: 'sections',
        attributes: ['id'],
        include: [{ model: HomePageComponent, as: 'components', attributes: ['id'] }]
      }
    ]
  });

  return pages.map((page) => {
    const plain = page.toJSON();
    const sections = plain.sections ?? [];
    const componentsCount = sections.reduce(
      (acc, section) => acc + ((section.components ?? []).length),
      0
    );
    return {
      id: plain.id,
      name: plain.name,
      slug: plain.slug,
      status: plain.status,
      theme: plain.theme,
      layout: plain.layout,
      accentColor: plain.accentColor,
      backgroundColor: plain.backgroundColor,
      sectionsCount: sections.length,
      componentsCount,
      updatedAt: plain.updatedAt,
      publishedAt: plain.publishedAt
    };
  });
}

export async function getHomePageById(pageId) {
  const page = await HomePage.findByPk(pageId, {
    include: [
      {
        model: HomePageSection,
        as: 'sections',
        include: [{ model: HomePageComponent, as: 'components' }]
      }
    ],
    order: [
      [{ model: HomePageSection, as: 'sections' }, 'position', 'ASC'],
      [
        { model: HomePageSection, as: 'sections' },
        { model: HomePageComponent, as: 'components' },
        'position',
        'ASC'
      ]
    ]
  });

  if (!page) {
    throw createHttpError(404, 'Home page not found');
  }

  return serialisePage(page);
}

export async function createHomePage(payload, actorId) {
  if (!payload || !payload.name) {
    throw createHttpError(400, 'A page name is required');
  }

  const transaction = await sequelize.transaction();
  try {
    const requestedSlug = payload.slug ? normaliseSlug(payload.slug) : normaliseSlug(payload.name);
    const slug = await ensureUniqueSlug(requestedSlug, null, transaction);

    const page = await HomePage.create(
      {
        name: payload.name,
        slug,
        description: payload.description ?? null,
        theme: payload.theme ?? 'standard',
        layout: payload.layout ?? 'modular',
        accentColor: payload.accentColor ?? null,
        backgroundColor: payload.backgroundColor ?? null,
        heroLayout: payload.heroLayout ?? null,
        seoTitle: payload.seoTitle ?? null,
        seoDescription: payload.seoDescription ?? null,
        settings: sanitiseObject(payload.settings),
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null
      },
      { transaction }
    );

    await transaction.commit();
    return getHomePageById(page.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function duplicateHomePage(pageId, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const page = await HomePage.findByPk(pageId, {
      include: [
        {
          model: HomePageSection,
          as: 'sections',
          include: [{ model: HomePageComponent, as: 'components' }]
        }
      ],
      order: [
        [{ model: HomePageSection, as: 'sections' }, 'position', 'ASC'],
        [
          { model: HomePageSection, as: 'sections' },
          { model: HomePageComponent, as: 'components' },
          'position',
          'ASC'
        ]
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!page) {
      throw createHttpError(404, 'Home page not found');
    }

    if (page.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be duplicated');
    }

    const baseSlug = page.slug ? `${page.slug}-copy` : `${normaliseSlug(page.name)}-copy`;
    const slug = await ensureUniqueSlug(baseSlug, null, transaction);

    const existingNames = await HomePage.findAll({
      attributes: ['name'],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const existingNameSet = new Set(existingNames.map((record) => record.name));

    let nameCandidate = buildCopyLabel(page.name);
    let iteration = 2;
    while (existingNameSet.has(nameCandidate)) {
      nameCandidate = `${buildCopyLabel(page.name)} ${iteration}`;
      iteration += 1;
    }

    const duplicatedPage = await HomePage.create(
      {
        name: nameCandidate,
        slug,
        description: page.description,
        theme: page.theme,
        layout: page.layout,
        accentColor: page.accentColor,
        backgroundColor: page.backgroundColor,
        heroLayout: page.heroLayout,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        settings: sanitiseObject(page.settings),
        status: 'draft',
        publishedAt: null,
        createdBy: actorId ?? page.createdBy ?? null,
        updatedBy: actorId ?? page.updatedBy ?? null
      },
      { transaction }
    );

    const sections = page.sections ?? [];

    for (const section of sections) {
      const newSection = await HomePageSection.create(
        {
          homePageId: duplicatedPage.id,
          title: buildCopyLabel(section.title),
          handle: section.handle ? `${section.handle}-copy` : null,
          description: section.description,
          layout: section.layout,
          backgroundColor: section.backgroundColor,
          textColor: section.textColor,
          accentColor: section.accentColor,
          position: section.position,
          settings: sanitiseObject(section.settings),
          createdBy: actorId ?? section.createdBy ?? page.createdBy ?? null,
          updatedBy: actorId ?? section.updatedBy ?? page.updatedBy ?? null
        },
        { transaction }
      );

      const components = section.components ?? [];
      for (const component of components) {
        await HomePageComponent.create(
          {
            homePageId: duplicatedPage.id,
            sectionId: newSection.id,
            type: component.type,
            title: buildCopyLabel(component.title),
            subheading: component.subheading,
            body: component.body,
            badge: component.badge,
            layout: component.layout,
            variant: component.variant,
            backgroundColor: component.backgroundColor,
            textColor: component.textColor,
            media: sanitiseObject(component.media),
            config: sanitiseConfig(component.config),
            callToActionLabel: component.callToActionLabel,
            callToActionHref: component.callToActionHref,
            secondaryActionLabel: component.secondaryActionLabel,
            secondaryActionHref: component.secondaryActionHref,
            position: component.position,
            createdBy: actorId ?? component.createdBy ?? section.createdBy ?? page.createdBy ?? null,
            updatedBy: actorId ?? component.updatedBy ?? section.updatedBy ?? page.updatedBy ?? null
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    return getHomePageById(duplicatedPage.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateHomePage(pageId, payload, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const page = await HomePage.findByPk(pageId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!page) {
      throw createHttpError(404, 'Home page not found');
    }

    if (payload.name) {
      page.name = payload.name;
    }

    if (payload.slug || payload.name) {
      const requestedSlug = normaliseSlug(payload.slug ?? payload.name ?? page.slug);
      if (requestedSlug && requestedSlug !== page.slug) {
        page.slug = await ensureUniqueSlug(requestedSlug, page.id, transaction);
      }
    }

    if (payload.description !== undefined) {
      page.description = payload.description ?? null;
    }
    if (payload.theme) {
      page.theme = payload.theme;
    }
    if (payload.layout) {
      page.layout = payload.layout;
    }
    if (payload.accentColor !== undefined) {
      page.accentColor = payload.accentColor ?? null;
    }
    if (payload.backgroundColor !== undefined) {
      page.backgroundColor = payload.backgroundColor ?? null;
    }
    if (payload.heroLayout !== undefined) {
      page.heroLayout = payload.heroLayout ?? null;
    }
    if (payload.seoTitle !== undefined) {
      page.seoTitle = payload.seoTitle ?? null;
    }
    if (payload.seoDescription !== undefined) {
      page.seoDescription = payload.seoDescription ?? null;
    }
    if (payload.settings !== undefined) {
      page.settings = sanitiseObject(payload.settings, page.settings ?? {});
    }

    page.updatedBy = actorId ?? page.updatedBy;

    await page.save({ transaction });
    await transaction.commit();
    return getHomePageById(page.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function publishHomePage(pageId, payload = {}, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const page = await HomePage.findByPk(pageId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!page) {
      throw createHttpError(404, 'Home page not found');
    }

    if (page.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be published');
    }

    page.status = 'published';
    page.publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : new Date();
    page.updatedBy = actorId ?? page.updatedBy;

    await page.save({ transaction });
    await transaction.commit();
    return getHomePageById(page.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function archiveHomePage(pageId, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const page = await HomePage.findByPk(pageId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!page) {
      throw createHttpError(404, 'Home page not found');
    }

    page.status = 'archived';
    page.updatedBy = actorId ?? page.updatedBy;

    await page.save({ transaction });
    await transaction.commit();
    return getHomePageById(page.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteHomePage(pageId) {
  const page = await HomePage.findByPk(pageId);
  if (!page) {
    return;
  }
  await page.destroy();
}

export async function createSection(pageId, payload, actorId) {
  if (!payload || !payload.title) {
    throw createHttpError(400, 'A section title is required');
  }

  const transaction = await sequelize.transaction();
  try {
    const page = await HomePage.findByPk(pageId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!page) {
      throw createHttpError(404, 'Home page not found');
    }
    if (page.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    const existingSections = await HomePageSection.findAll({
      where: { homePageId: pageId },
      order: [['position', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const desiredPosition = Number.isInteger(payload.position) && payload.position > 0 ? payload.position : existingSections.length + 1;

    const section = await HomePageSection.create(
      {
        homePageId: pageId,
        title: payload.title,
        handle: payload.handle ?? null,
        description: payload.description ?? null,
        layout: payload.layout ?? 'full-width',
        backgroundColor: payload.backgroundColor ?? null,
        textColor: payload.textColor ?? null,
        accentColor: payload.accentColor ?? null,
        position: desiredPosition,
        settings: sanitiseObject(payload.settings),
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null
      },
      { transaction }
    );

    const sections = [...existingSections, section];
    sections.sort((a, b) => (a.id === section.id ? desiredPosition : a.position) - (b.id === section.id ? desiredPosition : b.position));
    sections.forEach((item, index) => {
      item.position = index + 1;
    });
    await Promise.all(sections.map((item) => item.save({ transaction })));

    await transaction.commit();

    const reloaded = await HomePageSection.findByPk(section.id, {
      include: [{ model: HomePageComponent, as: 'components' }]
    });
    return serialiseSection(reloaded);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateSection(sectionId, payload, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const section = await HomePageSection.findByPk(sectionId, {
      include: [{ model: HomePage, as: 'page' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!section) {
      throw createHttpError(404, 'Section not found');
    }
    if (section.page?.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    if (payload.title) {
      section.title = payload.title;
    }
    if (payload.handle !== undefined) {
      section.handle = payload.handle ? normaliseSlug(payload.handle) : null;
    }
    if (payload.description !== undefined) {
      section.description = payload.description ?? null;
    }
    if (payload.layout) {
      section.layout = payload.layout;
    }
    if (payload.backgroundColor !== undefined) {
      section.backgroundColor = payload.backgroundColor ?? null;
    }
    if (payload.textColor !== undefined) {
      section.textColor = payload.textColor ?? null;
    }
    if (payload.accentColor !== undefined) {
      section.accentColor = payload.accentColor ?? null;
    }
    if (payload.settings !== undefined) {
      section.settings = sanitiseObject(payload.settings, section.settings ?? {});
    }

    section.updatedBy = actorId ?? section.updatedBy;

    await section.save({ transaction });
    await transaction.commit();

    const reloaded = await HomePageSection.findByPk(section.id, {
      include: [{ model: HomePageComponent, as: 'components' }]
    });
    return serialiseSection(reloaded);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function reorderSection(sectionId, payload, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const section = await HomePageSection.findByPk(sectionId, {
      include: [{ model: HomePage, as: 'page' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!section) {
      throw createHttpError(404, 'Section not found');
    }

    if (section.page?.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    const newPosition = Number.isInteger(payload?.position) ? Math.max(1, payload.position) : section.position;

    const siblings = await HomePageSection.findAll({
      where: { homePageId: section.homePageId },
      order: [['position', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const ordered = siblings.filter((item) => item.id !== section.id);
    ordered.splice(Math.min(newPosition - 1, ordered.length), 0, section);
    await Promise.all(
      ordered.map((item, index) => {
        item.position = index + 1;
        item.updatedBy = actorId ?? item.updatedBy;
        return item.save({ transaction });
      })
    );

    await transaction.commit();

    const reloaded = await HomePage.findByPk(section.homePageId, {
      include: [
        {
          model: HomePageSection,
          as: 'sections',
          include: [{ model: HomePageComponent, as: 'components' }]
        }
      ],
      order: [
        [{ model: HomePageSection, as: 'sections' }, 'position', 'ASC'],
        [
          { model: HomePageSection, as: 'sections' },
          { model: HomePageComponent, as: 'components' },
          'position',
          'ASC'
        ]
      ]
    });

    return serialisePage(reloaded).sections;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteSection(sectionId) {
  const section = await HomePageSection.findByPk(sectionId);
  if (!section) {
    return;
  }
  await section.destroy();
}

export async function duplicateSection(sectionId, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const section = await HomePageSection.findByPk(sectionId, {
      include: [
        { model: HomePage, as: 'page' },
        { model: HomePageComponent, as: 'components' }
      ],
      order: [[{ model: HomePageComponent, as: 'components' }, 'position', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!section) {
      throw createHttpError(404, 'Section not found');
    }

    if (section.page?.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    const newSection = await HomePageSection.create(
      {
        homePageId: section.homePageId,
        title: buildCopyLabel(section.title),
        handle: section.handle ? `${section.handle}-copy` : null,
        description: section.description,
        layout: section.layout,
        backgroundColor: section.backgroundColor,
        textColor: section.textColor,
        accentColor: section.accentColor,
        position: section.position + 1,
        settings: sanitiseObject(section.settings),
        createdBy: actorId ?? section.createdBy ?? null,
        updatedBy: actorId ?? section.updatedBy ?? null
      },
      { transaction }
    );

    const siblings = await HomePageSection.findAll({
      where: { homePageId: section.homePageId },
      order: [['position', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const ordered = siblings.filter((item) => item.id !== newSection.id);
    const originalIndex = ordered.findIndex((item) => item.id === section.id);
    ordered.splice(originalIndex + 1, 0, newSection);

    await Promise.all(
      ordered.map((item, index) => {
        item.position = index + 1;
        item.updatedBy = actorId ?? item.updatedBy;
        return item.save({ transaction });
      })
    );

    const components = section.components ?? [];
    for (const [index, component] of components.entries()) {
      await HomePageComponent.create(
        {
          homePageId: section.homePageId,
          sectionId: newSection.id,
          type: component.type,
          title: buildCopyLabel(component.title),
          subheading: component.subheading,
          body: component.body,
          badge: component.badge,
          layout: component.layout,
          variant: component.variant,
          backgroundColor: component.backgroundColor,
          textColor: component.textColor,
          media: sanitiseObject(component.media),
          config: sanitiseConfig(component.config),
          callToActionLabel: component.callToActionLabel,
          callToActionHref: component.callToActionHref,
          secondaryActionLabel: component.secondaryActionLabel,
          secondaryActionHref: component.secondaryActionHref,
          position: index + 1,
          createdBy: actorId ?? component.createdBy ?? section.createdBy ?? null,
          updatedBy: actorId ?? component.updatedBy ?? section.updatedBy ?? null
        },
        { transaction }
      );
    }

    await transaction.commit();

    const reloaded = await HomePage.findByPk(section.homePageId, {
      include: [
        {
          model: HomePageSection,
          as: 'sections',
          include: [{ model: HomePageComponent, as: 'components' }]
        }
      ],
      order: [
        [{ model: HomePageSection, as: 'sections' }, 'position', 'ASC'],
        [
          { model: HomePageSection, as: 'sections' },
          { model: HomePageComponent, as: 'components' },
          'position',
          'ASC'
        ]
      ]
    });

    return serialisePage(reloaded).sections;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function createComponent(sectionId, payload, actorId) {
  if (!payload || !payload.type) {
    throw createHttpError(400, 'A component type is required');
  }

  const transaction = await sequelize.transaction();
  try {
    const section = await HomePageSection.findByPk(sectionId, {
      include: [{ model: HomePage, as: 'page' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!section) {
      throw createHttpError(404, 'Section not found');
    }
    if (section.page?.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    const existingComponents = await HomePageComponent.findAll({
      where: { sectionId },
      order: [['position', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const desiredPosition = Number.isInteger(payload.position) && payload.position > 0 ? payload.position : existingComponents.length + 1;

    const component = await HomePageComponent.create(
      {
        homePageId: section.homePageId,
        sectionId,
        type: payload.type,
        title: payload.title ?? null,
        subheading: payload.subheading ?? null,
        body: payload.body ?? null,
        badge: payload.badge ?? null,
        layout: payload.layout ?? 'full',
        variant: payload.variant ?? null,
        backgroundColor: payload.backgroundColor ?? null,
        textColor: payload.textColor ?? null,
        media: sanitiseMedia(payload.media),
        config: sanitiseConfig(payload.config),
        callToActionLabel: payload.callToActionLabel ?? null,
        callToActionHref: payload.callToActionHref ?? null,
        secondaryActionLabel: payload.secondaryActionLabel ?? null,
        secondaryActionHref: payload.secondaryActionHref ?? null,
        position: desiredPosition,
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null
      },
      { transaction }
    );

    const components = [...existingComponents, component];
    components.sort((a, b) => (a.id === component.id ? desiredPosition : a.position) - (b.id === component.id ? desiredPosition : b.position));
    components.forEach((item, index) => {
      item.position = index + 1;
    });
    await Promise.all(components.map((item) => item.save({ transaction })));

    await transaction.commit();

    const reloaded = await HomePageComponent.findByPk(component.id);
    return serialiseComponent(reloaded);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateComponent(componentId, payload, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const component = await HomePageComponent.findByPk(componentId, {
      include: [
        {
          model: HomePageSection,
          as: 'section',
          include: [{ model: HomePage, as: 'page' }]
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!component) {
      throw createHttpError(404, 'Component not found');
    }
    if (component.section?.page?.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    if (payload.type) {
      component.type = payload.type;
    }
    if (payload.title !== undefined) {
      component.title = payload.title ?? null;
    }
    if (payload.subheading !== undefined) {
      component.subheading = payload.subheading ?? null;
    }
    if (payload.body !== undefined) {
      component.body = payload.body ?? null;
    }
    if (payload.badge !== undefined) {
      component.badge = payload.badge ?? null;
    }
    if (payload.layout) {
      component.layout = payload.layout;
    }
    if (payload.variant !== undefined) {
      component.variant = payload.variant ?? null;
    }
    if (payload.backgroundColor !== undefined) {
      component.backgroundColor = payload.backgroundColor ?? null;
    }
    if (payload.textColor !== undefined) {
      component.textColor = payload.textColor ?? null;
    }
    if (payload.callToActionLabel !== undefined) {
      component.callToActionLabel = payload.callToActionLabel ?? null;
    }
    if (payload.callToActionHref !== undefined) {
      component.callToActionHref = payload.callToActionHref ?? null;
    }
    if (payload.secondaryActionLabel !== undefined) {
      component.secondaryActionLabel = payload.secondaryActionLabel ?? null;
    }
    if (payload.secondaryActionHref !== undefined) {
      component.secondaryActionHref = payload.secondaryActionHref ?? null;
    }
    if (payload.media !== undefined) {
      component.media = sanitiseMedia(payload.media);
    }
    if (payload.config !== undefined) {
      component.config = sanitiseConfig({ ...component.config, ...payload.config });
    }

    component.updatedBy = actorId ?? component.updatedBy;

    await component.save({ transaction });
    await transaction.commit();

    const reloaded = await HomePageComponent.findByPk(component.id);
    return serialiseComponent(reloaded);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function reorderComponent(componentId, payload, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const component = await HomePageComponent.findByPk(componentId, {
      include: [
        {
          model: HomePageSection,
          as: 'section',
          include: [{ model: HomePage, as: 'page' }]
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!component) {
      throw createHttpError(404, 'Component not found');
    }
    if (component.section?.page?.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    const newPosition = Number.isInteger(payload?.position) ? Math.max(1, payload.position) : component.position;

    const siblings = await HomePageComponent.findAll({
      where: { sectionId: component.sectionId },
      order: [['position', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const ordered = siblings.filter((item) => item.id !== component.id);
    ordered.splice(Math.min(newPosition - 1, ordered.length), 0, component);
    await Promise.all(
      ordered.map((item, index) => {
        item.position = index + 1;
        item.updatedBy = actorId ?? item.updatedBy;
        return item.save({ transaction });
      })
    );

    await transaction.commit();

    const reloaded = await HomePageSection.findByPk(component.sectionId, {
      include: [{ model: HomePageComponent, as: 'components' }]
    });
    return serialiseSection(reloaded)?.components ?? [];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteComponent(componentId) {
  const component = await HomePageComponent.findByPk(componentId);
  if (!component) {
    return;
  }
  await component.destroy();
}

export async function duplicateComponent(componentId, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const component = await HomePageComponent.findByPk(componentId, {
      include: [
        {
          model: HomePageSection,
          as: 'section',
          include: [{ model: HomePage, as: 'page' }]
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!component) {
      throw createHttpError(404, 'Component not found');
    }

    if (component.section?.page?.status === 'archived') {
      throw createHttpError(409, 'Archived pages cannot be modified');
    }

    const newComponent = await HomePageComponent.create(
      {
        homePageId: component.homePageId,
        sectionId: component.sectionId,
        type: component.type,
        title: buildCopyLabel(component.title),
        subheading: component.subheading,
        body: component.body,
        badge: component.badge,
        layout: component.layout,
        variant: component.variant,
        backgroundColor: component.backgroundColor,
        textColor: component.textColor,
        media: sanitiseObject(component.media),
        config: sanitiseConfig(component.config),
        callToActionLabel: component.callToActionLabel,
        callToActionHref: component.callToActionHref,
        secondaryActionLabel: component.secondaryActionLabel,
        secondaryActionHref: component.secondaryActionHref,
        position: component.position + 1,
        createdBy: actorId ?? component.createdBy ?? null,
        updatedBy: actorId ?? component.updatedBy ?? null
      },
      { transaction }
    );

    const siblings = await HomePageComponent.findAll({
      where: { sectionId: component.sectionId },
      order: [['position', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const ordered = siblings.filter((item) => item.id !== newComponent.id);
    const originalIndex = ordered.findIndex((item) => item.id === component.id);
    ordered.splice(originalIndex + 1, 0, newComponent);

    await Promise.all(
      ordered.map((item, index) => {
        item.position = index + 1;
        item.updatedBy = actorId ?? item.updatedBy;
        return item.save({ transaction });
      })
    );

    await transaction.commit();

    const reloaded = await HomePageSection.findByPk(component.sectionId, {
      include: [{ model: HomePageComponent, as: 'components' }]
    });

    return {
      sectionId: component.sectionId,
      components: serialiseSection(reloaded)?.components ?? []
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
