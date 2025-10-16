import { Op } from 'sequelize';
import slugify from 'slugify';
import sequelize from '../config/database.js';
import {
  AppearanceProfile,
  AppearanceAsset,
  AppearanceVariant
} from '../models/index.js';
import { CanonicalRoles } from '../constants/permissions.js';

const ROLE_WHITELIST = new Set(Object.values(CanonicalRoles));
const DEFAULT_COLOR_PALETTE = {
  primary: '#1445E0',
  accent: '#1F75FE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  success: '#047857',
  warning: '#B45309',
  danger: '#B91C1C'
};
const DEFAULT_TYPOGRAPHY = {
  heading: 'Manrope',
  body: 'Inter',
  fallbackStack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  scaleRatio: 1.1,
  tracking: '0.01em'
};
const DEFAULT_LAYOUT = {
  density: 'comfortable',
  cornerRadius: 16,
  cardShadow: 'md',
  navigationStyle: 'pill'
};
const DEFAULT_IMAGERY = {
  heroGuidelines: 'Use lifestyle photography showing technicians supporting clients in authentic environments.',
  iconographyGuidelines: 'Prefer rounded two-tone glyphs with 2px stroke weight and balanced negative space.',
  photographyChecklist: 'Shoot at 3200x1800, deliver colour-graded assets with alt text and usage rights confirmed.'
};
const DEFAULT_WIDGETS = {
  heroBanner: { enabled: true, headline: '', subheadline: '', ctaLabel: '' },
  statsRail: { enabled: true, columns: 3, dataSource: 'operations.metrics' },
  announcementBar: { enabled: false, channel: 'operations' }
};
const DEFAULT_GOVERNANCE = {
  lastReviewedBy: null,
  lastReviewedAt: null,
  notes: ''
};

const ALLOWED_ASSET_TYPES = new Set([
  'logo',
  'wordmark',
  'hero_image',
  'illustration',
  'icon',
  'screenshot',
  'background',
  'pattern',
  'other'
]);

const ALLOWED_PUBLISH_STATES = new Set(['draft', 'review', 'live', 'retired']);

const INCLUDE_DEFINITION = [
  {
    model: AppearanceAsset,
    as: 'assets',
    required: false,
    where: { archivedAt: null }
  },
  {
    model: AppearanceVariant,
    as: 'variants',
    required: false,
    where: { archivedAt: null }
  }
];

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function ensureObject(value, fallback = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback };
  }
  return { ...fallback, ...value };
}

function normaliseAllowedRoles(roles) {
  const values = new Set();
  ensureArray(roles)
    .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
    .filter(Boolean)
    .forEach((role) => {
      if (ROLE_WHITELIST.has(role)) {
        values.add(role);
      }
    });
  if (!values.size) {
    values.add(CanonicalRoles.ADMIN);
  }
  return Array.from(values);
}

function sanitiseColorPalette(input) {
  const candidate = ensureObject(input, DEFAULT_COLOR_PALETTE);
  const next = { ...DEFAULT_COLOR_PALETTE };
  Object.entries(candidate).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      next[key] = value.trim();
    }
  });
  return next;
}

function sanitiseTypography(input) {
  const candidate = ensureObject(input, DEFAULT_TYPOGRAPHY);
  return {
    heading: typeof candidate.heading === 'string' ? candidate.heading.trim() || DEFAULT_TYPOGRAPHY.heading : DEFAULT_TYPOGRAPHY.heading,
    body: typeof candidate.body === 'string' ? candidate.body.trim() || DEFAULT_TYPOGRAPHY.body : DEFAULT_TYPOGRAPHY.body,
    fallbackStack:
      typeof candidate.fallbackStack === 'string'
        ? candidate.fallbackStack.trim() || DEFAULT_TYPOGRAPHY.fallbackStack
        : DEFAULT_TYPOGRAPHY.fallbackStack,
    scaleRatio:
      typeof candidate.scaleRatio === 'number'
        ? candidate.scaleRatio
        : Number.parseFloat(candidate.scaleRatio) || DEFAULT_TYPOGRAPHY.scaleRatio,
    tracking: typeof candidate.tracking === 'string' ? candidate.tracking.trim() || DEFAULT_TYPOGRAPHY.tracking : DEFAULT_TYPOGRAPHY.tracking
  };
}

function sanitiseLayout(input) {
  const candidate = ensureObject(input, DEFAULT_LAYOUT);
  return {
    density: ['compact', 'comfortable'].includes(candidate.density) ? candidate.density : DEFAULT_LAYOUT.density,
    cornerRadius: Number.isFinite(candidate.cornerRadius)
      ? candidate.cornerRadius
      : Number.parseInt(candidate.cornerRadius ?? DEFAULT_LAYOUT.cornerRadius, 10) || DEFAULT_LAYOUT.cornerRadius,
    cardShadow: typeof candidate.cardShadow === 'string' ? candidate.cardShadow.trim() || DEFAULT_LAYOUT.cardShadow : DEFAULT_LAYOUT.cardShadow,
    navigationStyle:
      ['pill', 'underline', 'minimal'].includes(candidate.navigationStyle)
        ? candidate.navigationStyle
        : DEFAULT_LAYOUT.navigationStyle
  };
}

function sanitiseImagery(input) {
  const candidate = ensureObject(input, DEFAULT_IMAGERY);
  return {
    heroGuidelines:
      typeof candidate.heroGuidelines === 'string'
        ? candidate.heroGuidelines.trim() || DEFAULT_IMAGERY.heroGuidelines
        : DEFAULT_IMAGERY.heroGuidelines,
    iconographyGuidelines:
      typeof candidate.iconographyGuidelines === 'string'
        ? candidate.iconographyGuidelines.trim() || DEFAULT_IMAGERY.iconographyGuidelines
        : DEFAULT_IMAGERY.iconographyGuidelines,
    photographyChecklist:
      typeof candidate.photographyChecklist === 'string'
        ? candidate.photographyChecklist.trim() || DEFAULT_IMAGERY.photographyChecklist
        : DEFAULT_IMAGERY.photographyChecklist
  };
}

function sanitiseWidgets(input) {
  const candidate = ensureObject(input, DEFAULT_WIDGETS);
  const hero = ensureObject(candidate.heroBanner, DEFAULT_WIDGETS.heroBanner);
  const stats = ensureObject(candidate.statsRail, DEFAULT_WIDGETS.statsRail);
  const announcement = ensureObject(candidate.announcementBar, DEFAULT_WIDGETS.announcementBar);
  return {
    heroBanner: {
      enabled: hero.enabled !== false,
      headline: typeof hero.headline === 'string' ? hero.headline : '',
      subheadline: typeof hero.subheadline === 'string' ? hero.subheadline : '',
      ctaLabel: typeof hero.ctaLabel === 'string' ? hero.ctaLabel : ''
    },
    statsRail: {
      enabled: stats.enabled !== false,
      columns: Number.isFinite(stats.columns)
        ? stats.columns
        : Number.parseInt(stats.columns ?? DEFAULT_WIDGETS.statsRail.columns, 10) || DEFAULT_WIDGETS.statsRail.columns,
      dataSource: typeof stats.dataSource === 'string' ? stats.dataSource : DEFAULT_WIDGETS.statsRail.dataSource
    },
    announcementBar: {
      enabled: announcement.enabled === true,
      channel: typeof announcement.channel === 'string' ? announcement.channel : DEFAULT_WIDGETS.announcementBar.channel
    }
  };
}

function sanitiseGovernance(input) {
  const candidate = ensureObject(input, DEFAULT_GOVERNANCE);
  return {
    lastReviewedBy: typeof candidate.lastReviewedBy === 'string' ? candidate.lastReviewedBy.trim() || null : null,
    lastReviewedAt:
      candidate.lastReviewedAt && !Number.isNaN(Date.parse(candidate.lastReviewedAt))
        ? new Date(candidate.lastReviewedAt).toISOString()
        : null,
    notes: typeof candidate.notes === 'string' ? candidate.notes : ''
  };
}

function sanitiseAssetPayload(asset, index) {
  if (!asset) {
    return null;
  }
  const assetTypeCandidate = typeof asset.assetType === 'string' ? asset.assetType.trim().toLowerCase() : 'other';
  const assetType = ALLOWED_ASSET_TYPES.has(assetTypeCandidate) ? assetTypeCandidate : 'other';
  const url = typeof asset.url === 'string' ? asset.url.trim() : '';
  const label = typeof asset.label === 'string' ? asset.label.trim() : '';
  if (!url || !label) {
    return null;
  }
  const sortOrderRaw = Number.isFinite(asset.sortOrder)
    ? asset.sortOrder
    : Number.parseInt(asset.sortOrder ?? index, 10) || index;
  return {
    id: asset.id || null,
    assetType,
    label,
    description: typeof asset.description === 'string' ? asset.description : null,
    url,
    altText: typeof asset.altText === 'string' ? asset.altText : null,
    metadata: ensureObject(asset.metadata, {}),
    sortOrder: Math.max(0, sortOrderRaw)
  };
}

function sanitiseVariantPayload(variant, index) {
  if (!variant) {
    return null;
  }
  const name = typeof variant.name === 'string' ? variant.name.trim() : '';
  if (!name) {
    return null;
  }
  const keySource = typeof variant.variantKey === 'string' && variant.variantKey.trim() ? variant.variantKey : name;
  const variantKey = slugify(keySource, { lower: true, strict: true }) || `variant-${index + 1}`;
  const publishStateCandidate = typeof variant.publishState === 'string' ? variant.publishState.trim().toLowerCase() : 'draft';
  const publishState = ALLOWED_PUBLISH_STATES.has(publishStateCandidate) ? publishStateCandidate : 'draft';
  const scheduledFor =
    variant.scheduledFor && !Number.isNaN(Date.parse(variant.scheduledFor))
      ? new Date(variant.scheduledFor)
      : null;
  const marketingCopy = ensureObject(variant.marketingCopy, {});
  const keywords = ensureArray(marketingCopy.keywords)
    .flatMap((value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
        : []
    )
    .filter(Boolean);
  const sortOrderRaw = Number.isFinite(variant.sortOrder)
    ? variant.sortOrder
    : Number.parseInt(variant.sortOrder ?? index, 10) || index;
  const sortOrder = Math.max(0, sortOrderRaw);

  return {
    id: variant.id || null,
    variantKey,
    name,
    headline: typeof variant.headline === 'string' ? variant.headline : null,
    subheadline: typeof variant.subheadline === 'string' ? variant.subheadline : null,
    ctaLabel: typeof variant.ctaLabel === 'string' ? variant.ctaLabel : null,
    ctaUrl: typeof variant.ctaUrl === 'string' ? variant.ctaUrl : null,
    heroImageUrl: typeof variant.heroImageUrl === 'string' ? variant.heroImageUrl : null,
    heroVideoUrl: typeof variant.heroVideoUrl === 'string' ? variant.heroVideoUrl : null,
    publishState,
    scheduledFor,
    marketingCopy: {
      audience: typeof marketingCopy.audience === 'string' ? marketingCopy.audience : null,
      keywords
    },
    sortOrder
  };
}

function serialiseAsset(asset) {
  if (!asset) {
    return null;
  }
  return {
    id: asset.id,
    profileId: asset.profileId,
    assetType: asset.assetType,
    label: asset.label,
    description: asset.description,
    url: asset.url,
    altText: asset.altText,
    metadata: asset.metadata || {},
    sortOrder: asset.sortOrder ?? 0,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt
  };
}

function serialiseVariant(variant) {
  if (!variant) {
    return null;
  }
  const marketingCopy = variant.marketingCopy || {};
  return {
    id: variant.id,
    profileId: variant.profileId,
    variantKey: variant.variantKey,
    name: variant.name,
    headline: variant.headline,
    subheadline: variant.subheadline,
    ctaLabel: variant.ctaLabel,
    ctaUrl: variant.ctaUrl,
    heroImageUrl: variant.heroImageUrl,
    heroVideoUrl: variant.heroVideoUrl,
    publishState: variant.publishState,
    scheduledFor: variant.scheduledFor,
    marketingCopy: {
      audience: marketingCopy.audience || null,
      keywords: ensureArray(marketingCopy.keywords).filter(Boolean)
    },
    sortOrder: Number.isFinite(variant.sortOrder)
      ? variant.sortOrder
      : Number.parseInt(variant.sortOrder ?? 0, 10) || 0,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt
  };
}

function serialiseProfile(profile) {
  if (!profile) {
    return null;
  }
  const assets = ensureArray(profile.assets).filter((asset) => !asset.archivedAt).map(serialiseAsset).filter(Boolean);
  const variants = ensureArray(profile.variants)
    .filter((variant) => !variant.archivedAt)
    .map(serialiseVariant)
    .filter(Boolean);
  assets.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.label.localeCompare(b.label);
  });
  variants.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    id: profile.id,
    name: profile.name,
    slug: profile.slug,
    description: profile.description || '',
    isDefault: Boolean(profile.isDefault),
    allowedRoles: Array.isArray(profile.allowedRoles) ? profile.allowedRoles : [],
    colorPalette: ensureObject(profile.colorPalette, DEFAULT_COLOR_PALETTE),
    typography: ensureObject(profile.typography, DEFAULT_TYPOGRAPHY),
    layout: ensureObject(profile.layout, DEFAULT_LAYOUT),
    imagery: ensureObject(profile.imagery, DEFAULT_IMAGERY),
    widgets: ensureObject(profile.widgets, DEFAULT_WIDGETS),
    governance: ensureObject(profile.governance, DEFAULT_GOVERNANCE),
    publishedAt: profile.publishedAt,
    archivedAt: profile.archivedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    assets,
    variants
  };
}

function buildNotFound(message = 'Appearance profile not found') {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

async function ensureUniqueSlug(candidateSlug, { excludeId, transaction } = {}) {
  const base = slugify(candidateSlug || 'appearance-profile', { lower: true, strict: true }) || 'appearance-profile';
  let attempt = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = excludeId
      ? { slug: attempt, id: { [Op.ne]: excludeId } }
      : { slug: attempt };
    const existing = await AppearanceProfile.count({ where, transaction });
    if (existing === 0) {
      return attempt;
    }
    attempt = `${base}-${++suffix}`;
  }
}

export async function listAppearanceProfiles() {
  const profiles = await AppearanceProfile.findAll({
    where: { archivedAt: null },
    include: INCLUDE_DEFINITION,
    order: [
      ['isDefault', 'DESC'],
      ['name', 'ASC']
    ]
  });
  return profiles.map((profile) => serialiseProfile(profile));
}

export async function getAppearanceProfileById(id) {
  if (!id) {
    throw buildNotFound();
  }
  const profile = await AppearanceProfile.findOne({
    where: { id, archivedAt: null },
    include: INCLUDE_DEFINITION
  });
  if (!profile) {
    throw buildNotFound();
  }
  return serialiseProfile(profile);
}

export async function getAppearanceProfileBySlug(slug) {
  if (!slug) {
    throw buildNotFound();
  }
  const profile = await AppearanceProfile.findOne({
    where: { slug, archivedAt: null },
    include: INCLUDE_DEFINITION
  });
  if (!profile) {
    throw buildNotFound();
  }
  return serialiseProfile(profile);
}

export async function saveAppearanceProfile({ id, payload = {}, actorId }) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Appearance payload must be an object');
  }

  return sequelize.transaction(async (transaction) => {
    const allowedRoles = normaliseAllowedRoles(payload.allowedRoles);
    const colorPalette = sanitiseColorPalette(payload.colorPalette);
    const typography = sanitiseTypography(payload.typography);
    const layout = sanitiseLayout(payload.layout);
    const imagery = sanitiseImagery(payload.imagery);
    const widgets = sanitiseWidgets(payload.widgets);
    const governance = sanitiseGovernance(payload.governance);

    const baseName = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : 'Appearance profile';
    const requestedSlug = typeof payload.slug === 'string' && payload.slug.trim() ? payload.slug.trim() : baseName;
    const slug = await ensureUniqueSlug(requestedSlug, { excludeId: id, transaction });

    const profileBody = {
      name: baseName,
      slug,
      description: typeof payload.description === 'string' ? payload.description : null,
      isDefault: payload.isDefault === true,
      allowedRoles,
      colorPalette,
      typography,
      layout,
      imagery,
      widgets,
      governance,
      updatedBy: actorId || null
    };

    if (payload.publishedAt && !Number.isNaN(Date.parse(payload.publishedAt))) {
      profileBody.publishedAt = new Date(payload.publishedAt);
    } else if (payload.publishedAt === null) {
      profileBody.publishedAt = null;
    }

    let profile;

    if (id) {
      profile = await AppearanceProfile.findOne({ where: { id, archivedAt: null }, transaction });
      if (!profile) {
        throw buildNotFound();
      }
      await profile.update(profileBody, { transaction });
    } else {
      profile = await AppearanceProfile.create(
        {
          ...profileBody,
          createdBy: actorId || null
        },
        { transaction }
      );
    }

    if (profileBody.isDefault) {
      await AppearanceProfile.update(
        { isDefault: false },
        {
          where: { id: { [Op.ne]: profile.id } },
          transaction
        }
      );
      await profile.update({ isDefault: true }, { transaction });
    }

    const incomingAssets = ensureArray(payload.assets)
      .map((asset, index) => sanitiseAssetPayload(asset, index))
      .filter(Boolean);

    const existingAssets = await AppearanceAsset.findAll({
      where: { profileId: profile.id, archivedAt: null },
      transaction
    });
    const existingAssetsById = new Map(existingAssets.map((asset) => [asset.id, asset]));

    for (const asset of incomingAssets) {
      const body = {
        profileId: profile.id,
        assetType: asset.assetType,
        label: asset.label,
        description: asset.description,
        url: asset.url,
        altText: asset.altText,
        metadata: asset.metadata,
        sortOrder: asset.sortOrder,
        updatedBy: actorId || null
      };

      if (asset.id && existingAssetsById.has(asset.id)) {
        const record = existingAssetsById.get(asset.id);
        await record.update(body, { transaction });
        existingAssetsById.delete(asset.id);
      } else {
        await AppearanceAsset.create(
          {
            ...body,
            createdBy: actorId || null
          },
          { transaction }
        );
      }
    }

    for (const staleAsset of existingAssetsById.values()) {
      await staleAsset.update({ archivedAt: new Date(), updatedBy: actorId || null }, { transaction });
    }

    const incomingVariants = ensureArray(payload.variants)
      .map((variant, index) => sanitiseVariantPayload(variant, index))
      .filter(Boolean);

    const existingVariants = await AppearanceVariant.findAll({
      where: { profileId: profile.id, archivedAt: null },
      transaction
    });
    const existingVariantsById = new Map(existingVariants.map((variant) => [variant.id, variant]));

    for (const variant of incomingVariants) {
      const body = {
        profileId: profile.id,
        variantKey: variant.variantKey,
        name: variant.name,
        headline: variant.headline,
        subheadline: variant.subheadline,
        ctaLabel: variant.ctaLabel,
        ctaUrl: variant.ctaUrl,
        heroImageUrl: variant.heroImageUrl,
        heroVideoUrl: variant.heroVideoUrl,
        publishState: variant.publishState,
        scheduledFor: variant.scheduledFor,
        marketingCopy: variant.marketingCopy,
        sortOrder: variant.sortOrder,
        updatedBy: actorId || null
      };

      if (variant.id && existingVariantsById.has(variant.id)) {
        const record = existingVariantsById.get(variant.id);
        await record.update(body, { transaction });
        existingVariantsById.delete(variant.id);
      } else {
        await AppearanceVariant.create(
          {
            ...body,
            createdBy: actorId || null
          },
          { transaction }
        );
      }
    }

    for (const staleVariant of existingVariantsById.values()) {
      await staleVariant.update({ archivedAt: new Date(), updatedBy: actorId || null }, { transaction });
    }

    const reloaded = await AppearanceProfile.findOne({
      where: { id: profile.id },
      include: INCLUDE_DEFINITION,
      transaction
    });

    return serialiseProfile(reloaded);
  });
}

export async function archiveAppearanceProfile({ id, actorId }) {
  if (!id) {
    throw buildNotFound();
  }

  return sequelize.transaction(async (transaction) => {
    const profile = await AppearanceProfile.findOne({ where: { id, archivedAt: null }, transaction });
    if (!profile) {
      throw buildNotFound();
    }

    const timestamp = new Date();
    await profile.update({ archivedAt: timestamp, isDefault: false, updatedBy: actorId || null }, { transaction });

    await AppearanceAsset.update(
      { archivedAt: timestamp, updatedBy: actorId || null },
      { where: { profileId: id }, transaction }
    );

    await AppearanceVariant.update(
      { archivedAt: timestamp, updatedBy: actorId || null },
      { where: { profileId: id }, transaction }
    );

    return serialiseProfile(profile);
  });
}
