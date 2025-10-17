import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import sequelize from '../config/database.js';
import {
  Company,
  ProviderStorefront,
  ProviderStorefrontInventory,
  ProviderStorefrontCoupon,
  User
} from '../models/index.js';
import { resolveCompanyId } from './panelService.js';

function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitiseString(value, fallback = null) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function sanitiseSlug(value, fallback) {
  const base = sanitiseString(value, fallback);
  if (!base) {
    return fallback;
  }
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function clampNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (parsed < min) {
    return min;
  }
  if (parsed > max) {
    return max;
  }
  return parsed;
}

function parseInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sanitiseStringList(input, { limit = 20, maxLength = 80 } = {}) {
  if (input == null) {
    return [];
  }

  const source = Array.isArray(input) ? input : String(input).split(',');
  const seen = new Set();
  const result = [];

  for (const raw of source) {
    if (typeof raw !== 'string') {
      continue;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const shortened = trimmed.slice(0, maxLength);
    const fingerprint = shortened.toLowerCase();
    if (seen.has(fingerprint)) {
      continue;
    }
    seen.add(fingerprint);
    result.push(shortened);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function sanitiseKeywords(input) {
  return sanitiseStringList(input, { limit: 48, maxLength: 60 });
}

function sanitiseGalleryEntries(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const url = sanitiseString(entry.url, null);
      if (!url) {
        return null;
      }
      const idCandidate = sanitiseString(entry.id, null);
      const label = sanitiseString(entry.label, null);
      const altText = sanitiseString(entry.altText, null);
      const description = sanitiseString(entry.description, null);
      return {
        id: idCandidate || randomUUID(),
        position: Number.isFinite(entry.position) ? entry.position : index,
        url,
        label,
        altText,
        description
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aPos = Number.isFinite(a.position) ? a.position : 0;
      const bPos = Number.isFinite(b.position) ? b.position : 0;
      return aPos - bPos;
    })
    .slice(0, 12);
}

function sanitiseExperienceEntries(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const title = sanitiseString(entry.title, null);
      const organisation = sanitiseString(entry.organisation, null);
      const summary = sanitiseString(entry.summary, null);
      const proofUrl = sanitiseString(entry.proofUrl, null);
      const years = sanitiseString(entry.years, null);
      const location = sanitiseString(entry.location, null);
      const startYear = sanitiseString(entry.startYear, null);
      const endYear = sanitiseString(entry.endYear, null);
      const idCandidate = sanitiseString(entry.id, null);

      if (!title && !organisation && !summary && !proofUrl && !years && !location && !startYear && !endYear) {
        return null;
      }

      return {
        id: idCandidate || randomUUID(),
        position: Number.isFinite(entry.position) ? entry.position : index,
        title,
        organisation,
        location,
        years,
        startYear,
        endYear,
        summary,
        proofUrl
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aPos = Number.isFinite(a.position) ? a.position : 0;
      const bPos = Number.isFinite(b.position) ? b.position : 0;
      return aPos - bPos;
    })
    .slice(0, 12);
}

function sanitiseShowcaseVideo(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const url = sanitiseString(entry.url, null);
  const caption = sanitiseString(entry.caption, null);
  const thumbnailUrl = sanitiseString(entry.thumbnailUrl, null);

  if (!url) {
    return null;
  }

  return {
    url,
    caption,
    thumbnailUrl
  };
}

function sanitiseSeoMetadata(entry) {
  if (!entry || typeof entry !== 'object') {
    return {
      pageTitle: null,
      metaDescription: null,
      canonicalUrl: null,
      socialImageUrl: null,
      keywords: []
    };
  }

  const pageTitle = sanitiseString(entry.pageTitle, null);
  const metaDescription = sanitiseString(entry.metaDescription, null);
  const canonicalUrl = sanitiseString(entry.canonicalUrl, null);
  const socialImageUrl = sanitiseString(entry.socialImageUrl, null);

  return {
    pageTitle: pageTitle ? pageTitle.slice(0, 160) : null,
    metaDescription: metaDescription ? metaDescription.slice(0, 320) : null,
    canonicalUrl,
    socialImageUrl,
    keywords: sanitiseKeywords(entry.keywords)
  };
}

function sanitiseBusinessMetadata(input, existing = {}) {
  const current = existing && typeof existing === 'object' ? { ...existing } : {};
  const payload = input && typeof input === 'object' ? input : {};

  if ('showcaseVideo' in payload) {
    const video = sanitiseShowcaseVideo(payload.showcaseVideo);
    if (video) {
      current.showcaseVideo = video;
    } else {
      delete current.showcaseVideo;
    }
  }

  if ('gallery' in payload) {
    current.gallery = sanitiseGalleryEntries(payload.gallery);
  } else if (!Array.isArray(current.gallery)) {
    current.gallery = [];
  }

  if ('experiences' in payload) {
    current.experiences = sanitiseExperienceEntries(payload.experiences);
  } else if (!Array.isArray(current.experiences)) {
    current.experiences = [];
  }

  if ('skills' in payload) {
    current.skills = sanitiseStringList(payload.skills, { limit: 40, maxLength: 80 });
  } else if (!Array.isArray(current.skills)) {
    current.skills = [];
  }

  if ('categories' in payload) {
    current.categories = sanitiseStringList(payload.categories, { limit: 20, maxLength: 80 });
  } else if (!Array.isArray(current.categories)) {
    current.categories = [];
  }

  if ('wordTags' in payload) {
    current.wordTags = sanitiseStringList(payload.wordTags, { limit: 60, maxLength: 60 });
  } else if (!Array.isArray(current.wordTags)) {
    current.wordTags = [];
  }

  if ('seo' in payload) {
    current.seo = sanitiseSeoMetadata(payload.seo);
  } else if (!current.seo || typeof current.seo !== 'object') {
    current.seo = sanitiseSeoMetadata();
  }

  return current;
}

function normaliseStringArray(value, options) {
  return sanitiseStringList(value, options);
}

function normaliseGalleryEntries(entries) {
  const sanitised = sanitiseGalleryEntries(entries);
  return sanitised.map((entry, index) => ({
    id: entry.id || `gallery-${index}`,
    position: Number.isFinite(entry.position) ? entry.position : index,
    url: entry.url,
    label: entry.label || null,
    altText: entry.altText || null,
    description: entry.description || null
  }));
}

function normaliseExperienceEntries(entries) {
  const sanitised = sanitiseExperienceEntries(entries);
  return sanitised.map((entry, index) => ({
    id: entry.id || `experience-${index}`,
    position: Number.isFinite(entry.position) ? entry.position : index,
    title: entry.title || null,
    organisation: entry.organisation || null,
    location: entry.location || null,
    years: entry.years || null,
    startYear: entry.startYear || null,
    endYear: entry.endYear || null,
    summary: entry.summary || null,
    proofUrl: entry.proofUrl || null
  }));
}

function normaliseShowcaseVideo(entry) {
  const video = sanitiseShowcaseVideo(entry);
  if (!video) {
    return { url: '', caption: '', thumbnailUrl: '' };
  }
  return {
    url: video.url,
    caption: video.caption || '',
    thumbnailUrl: video.thumbnailUrl || ''
  };
}

function normaliseSeo(entry) {
  const seo = sanitiseSeoMetadata(entry);
  return {
    pageTitle: seo.pageTitle || '',
    metaDescription: seo.metaDescription || '',
    canonicalUrl: seo.canonicalUrl || '',
    socialImageUrl: seo.socialImageUrl || '',
    keywords: Array.isArray(seo.keywords) ? seo.keywords : []
  };
}

async function resolveCompanyContext({ companyId, actor }) {
  if (!actor?.id) {
    throw buildHttpError(403, 'forbidden');
  }

  const actorRecord = await User.findByPk(actor.id, { attributes: ['id', 'type'] });
  if (!actorRecord) {
    throw buildHttpError(403, 'forbidden');
  }

  const resolvedCompanyId = await resolveCompanyId(companyId);
  if (actorRecord.type === 'admin') {
    const company = await Company.findByPk(resolvedCompanyId, { attributes: ['id', 'contactName', 'legalStructure'] });
    if (!company) {
      throw buildHttpError(404, 'company_not_found');
    }
    return { companyId: company.id, company: company.get({ plain: true }), actor: actorRecord };
  }

  if (actorRecord.type !== 'company') {
    throw buildHttpError(403, 'forbidden');
  }

  const company = await Company.findOne({
    where: { id: resolvedCompanyId, userId: actorRecord.id },
    attributes: ['id', 'contactName', 'legalStructure']
  });

  if (!company) {
    throw buildHttpError(403, 'forbidden');
  }

  return { companyId: company.id, company: company.get({ plain: true }), actor: actorRecord };
}

async function ensureStorefront({ companyId, company, transaction }) {
  let storefront = await ProviderStorefront.findOne({ where: { companyId }, transaction });
  if (storefront) {
    return storefront;
  }

  const fallbackName = company?.contactName ? `${company.contactName} Storefront` : 'Provider storefront';
  const name = sanitiseString(company?.preferredStorefrontName, fallbackName) ?? fallbackName;
  const slugSeed = sanitiseSlug(company?.contactName, 'storefront');
  const slug = `${slugSeed || 'storefront'}-${companyId.slice(0, 8)}`;

  storefront = await ProviderStorefront.create(
    {
      companyId,
      name,
      slug,
      status: 'draft',
      isPublished: false,
      reviewRequired: false,
      metadata: {}
    },
    { transaction }
  );

  return storefront;
}

function formatStorefront(storefront) {
  const rawMetadata = storefront.metadata && typeof storefront.metadata === 'object' ? storefront.metadata : {};
  const metadata = {
    ...rawMetadata,
    showcaseVideo: normaliseShowcaseVideo(rawMetadata.showcaseVideo),
    gallery: normaliseGalleryEntries(rawMetadata.gallery),
    experiences: normaliseExperienceEntries(rawMetadata.experiences),
    skills: normaliseStringArray(rawMetadata.skills, { limit: 40, maxLength: 80 }),
    categories: normaliseStringArray(rawMetadata.categories, { limit: 20, maxLength: 80 }),
    wordTags: normaliseStringArray(rawMetadata.wordTags, { limit: 60, maxLength: 60 }),
    seo: normaliseSeo(rawMetadata.seo)
  };

  return {
    id: storefront.id,
    companyId: storefront.companyId,
    name: storefront.name,
    slug: storefront.slug,
    tagline: storefront.tagline || '',
    description: storefront.description || '',
    heroImageUrl: storefront.heroImageUrl || '',
    contactEmail: storefront.contactEmail || '',
    contactPhone: storefront.contactPhone || '',
    primaryColor: storefront.primaryColor || '#0f172a',
    accentColor: storefront.accentColor || '#38bdf8',
    status: storefront.status,
    isPublished: Boolean(storefront.isPublished),
    publishedAt: storefront.publishedAt ? new Date(storefront.publishedAt).toISOString() : null,
    reviewRequired: Boolean(storefront.reviewRequired),
    metadata,
    updatedAt: storefront.updatedAt ? new Date(storefront.updatedAt).toISOString() : null
  };
}

function formatInventoryItem(item) {
  return {
    id: item.id,
    storefrontId: item.storefrontId,
    sku: item.sku,
    name: item.name,
    summary: item.summary || '',
    description: item.description || '',
    priceAmount: Number(item.priceAmount ?? 0),
    priceCurrency: item.priceCurrency || 'GBP',
    stockOnHand: Number(item.stockOnHand ?? 0),
    reorderPoint: Number(item.reorderPoint ?? 0),
    restockAt: item.restockAt ? new Date(item.restockAt).toISOString() : null,
    visibility: item.visibility,
    featured: Boolean(item.featured),
    imageUrl: item.imageUrl || '',
    metadata: item.metadata || {},
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null
  };
}

function formatCoupon(coupon) {
  return {
    id: coupon.id,
    storefrontId: coupon.storefrontId,
    code: coupon.code,
    name: coupon.name,
    description: coupon.description || '',
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue ?? 0),
    minOrderTotal: coupon.minOrderTotal != null ? Number(coupon.minOrderTotal) : null,
    maxDiscountValue: coupon.maxDiscountValue != null ? Number(coupon.maxDiscountValue) : null,
    startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString() : null,
    endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString() : null,
    usageLimit: coupon.usageLimit != null ? Number(coupon.usageLimit) : null,
    usageCount: Number(coupon.usageCount ?? 0),
    status: coupon.status,
    appliesTo: coupon.appliesTo || '',
    metadata: coupon.metadata || {},
    updatedAt: coupon.updatedAt ? new Date(coupon.updatedAt).toISOString() : null
  };
}

function buildInventoryMeta(inventory) {
  const total = inventory.length;
  const published = inventory.filter((item) => item.visibility === 'public').length;
  const archived = inventory.filter((item) => item.visibility === 'archived').length;
  const lowStock = inventory.filter((item) => item.stockOnHand <= item.reorderPoint).length;

  return { total, published, archived, lowStock };
}

function buildCouponMeta(coupons) {
  const now = DateTime.now();
  const active = coupons.filter((coupon) => coupon.status === 'active').length;
  const expiringSoon = coupons.filter((coupon) => {
    if (!coupon.endsAt) {
      return false;
    }
    const end = DateTime.fromJSDate(new Date(coupon.endsAt));
    return end.diff(now, 'days').days <= 7 && coupon.status !== 'expired';
  }).length;

  return { total: coupons.length, active, expiringSoon };
}

export async function getProviderStorefrontWorkspace({ companyId, actor }) {
  const context = await resolveCompanyContext({ companyId, actor });

  const result = await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({
      companyId: context.companyId,
      company: context.company,
      transaction
    });

    const [inventoryRecords, couponRecords] = await Promise.all([
      ProviderStorefrontInventory.findAll({
        where: { storefrontId: storefront.id },
        order: [['updatedAt', 'DESC']],
        transaction
      }),
      ProviderStorefrontCoupon.findAll({
        where: { storefrontId: storefront.id },
        order: [['updatedAt', 'DESC']],
        transaction
      })
    ]);

    const inventory = inventoryRecords.map((record) => formatInventoryItem(record.get({ plain: true })));
    const coupons = couponRecords.map((record) => formatCoupon(record.get({ plain: true })));

    return {
      storefront: formatStorefront(storefront.get({ plain: true })),
      inventory,
      coupons,
      inventoryMeta: buildInventoryMeta(inventory),
      couponMeta: buildCouponMeta(coupons)
    };
  });

  return {
    data: result,
    meta: {
      companyId: context.companyId,
      generatedAt: new Date().toISOString()
    }
  };
}

export async function upsertProviderStorefrontSettings({ companyId, actor, payload }) {
  const context = await resolveCompanyContext({ companyId, actor });

  const result = await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({
      companyId: context.companyId,
      company: context.company,
      transaction
    });

    const nextName = sanitiseString(payload.name, storefront.name) || storefront.name;
    const requestedSlug = sanitiseSlug(payload.slug, sanitiseSlug(nextName, storefront.slug));
    const nextSlug = requestedSlug || storefront.slug;

    if (nextSlug !== storefront.slug) {
      const slugExists = await ProviderStorefront.count({
        where: {
          slug: nextSlug,
          id: { [Op.ne]: storefront.id }
        },
        transaction
      });
      if (slugExists > 0) {
        throw buildHttpError(409, 'slug_in_use');
      }
    }

    const updates = {
      name: nextName,
      slug: nextSlug,
      tagline: sanitiseString(payload.tagline, storefront.tagline) ?? null,
      description: sanitiseString(payload.description, storefront.description) ?? null,
      heroImageUrl: sanitiseString(payload.heroImageUrl, storefront.heroImageUrl) ?? null,
      contactEmail: sanitiseString(payload.contactEmail, storefront.contactEmail) ?? null,
      contactPhone: sanitiseString(payload.contactPhone, storefront.contactPhone) ?? null,
      primaryColor: sanitiseString(payload.primaryColor, storefront.primaryColor) ?? '#0f172a',
      accentColor: sanitiseString(payload.accentColor, storefront.accentColor) ?? '#38bdf8',
      status: payload.status && ['draft', 'live', 'archived'].includes(payload.status) ? payload.status : storefront.status,
      isPublished: Boolean(payload.isPublished ?? storefront.isPublished),
      reviewRequired: Boolean(payload.reviewRequired ?? storefront.reviewRequired),
      metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : storefront.metadata
    };

    if (updates.isPublished && !storefront.isPublished) {
      updates.publishedAt = new Date();
    } else if (!updates.isPublished) {
      updates.publishedAt = null;
    }

    const metadata = sanitiseBusinessMetadata(payload.metadata, storefront.metadata);
    updates.metadata = metadata;

    await storefront.update(updates, { transaction });

    return formatStorefront(storefront.get({ plain: true }));
  });

  return {
    data: result,
    meta: {
      companyId: context.companyId,
      updatedAt: new Date().toISOString()
    }
  };
}

export async function createStorefrontInventoryItem({ companyId, actor, payload }) {
  const context = await resolveCompanyContext({ companyId, actor });

  const record = await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({
      companyId: context.companyId,
      company: context.company,
      transaction
    });

    const sku = sanitiseString(payload.sku, null);
    if (!sku) {
      throw buildHttpError(400, 'sku_required');
    }

    const existingSku = await ProviderStorefrontInventory.count({
      where: { storefrontId: storefront.id, sku },
      transaction
    });
    if (existingSku > 0) {
      throw buildHttpError(409, 'sku_in_use');
    }

    const created = await ProviderStorefrontInventory.create(
      {
        storefrontId: storefront.id,
        sku,
        name: sanitiseString(payload.name, 'Inventory item'),
        summary: sanitiseString(payload.summary, null),
        description: sanitiseString(payload.description, null),
        priceAmount: clampNumber(payload.priceAmount, { min: 0, max: 999999, fallback: 0 }),
        priceCurrency: sanitiseString(payload.priceCurrency, 'GBP')?.toUpperCase() || 'GBP',
        stockOnHand: parseInteger(payload.stockOnHand, 0),
        reorderPoint: parseInteger(payload.reorderPoint, 0),
        restockAt: parseDate(payload.restockAt),
        visibility: ['public', 'private', 'archived'].includes(payload.visibility) ? payload.visibility : 'public',
        featured: Boolean(payload.featured),
        imageUrl: sanitiseString(payload.imageUrl, null),
        metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
      },
      { transaction }
    );

    return created.get({ plain: true });
  });

  return { data: formatInventoryItem(record) };
}

export async function updateStorefrontInventoryItem({ companyId, actor, inventoryId, payload }) {
  if (!inventoryId) {
    throw buildHttpError(400, 'inventory_id_required');
  }

  const context = await resolveCompanyContext({ companyId, actor });

  const record = await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({
      companyId: context.companyId,
      company: context.company,
      transaction
    });

    const item = await ProviderStorefrontInventory.findOne({
      where: { id: inventoryId, storefrontId: storefront.id },
      transaction
    });

    if (!item) {
      throw buildHttpError(404, 'inventory_not_found');
    }

    const updates = {};
    if (payload.sku && payload.sku !== item.sku) {
      const newSku = sanitiseString(payload.sku, item.sku);
      if (!newSku) {
        throw buildHttpError(400, 'sku_required');
      }
      const exists = await ProviderStorefrontInventory.count({
        where: { storefrontId: storefront.id, sku: newSku, id: { [Op.ne]: item.id } },
        transaction
      });
      if (exists > 0) {
        throw buildHttpError(409, 'sku_in_use');
      }
      updates.sku = newSku;
    }

    if (payload.name != null) updates.name = sanitiseString(payload.name, item.name);
    if (payload.summary !== undefined) updates.summary = sanitiseString(payload.summary, null);
    if (payload.description !== undefined) updates.description = sanitiseString(payload.description, null);
    if (payload.priceAmount !== undefined)
      updates.priceAmount = clampNumber(payload.priceAmount, { min: 0, max: 999999, fallback: Number(item.priceAmount || 0) });
    if (payload.priceCurrency !== undefined)
      updates.priceCurrency = sanitiseString(payload.priceCurrency, item.priceCurrency)?.toUpperCase() || item.priceCurrency;
    if (payload.stockOnHand !== undefined) updates.stockOnHand = parseInteger(payload.stockOnHand, item.stockOnHand);
    if (payload.reorderPoint !== undefined) updates.reorderPoint = parseInteger(payload.reorderPoint, item.reorderPoint);
    if (payload.restockAt !== undefined) updates.restockAt = parseDate(payload.restockAt);
    if (payload.visibility && ['public', 'private', 'archived'].includes(payload.visibility)) {
      updates.visibility = payload.visibility;
    }
    if (payload.featured !== undefined) updates.featured = Boolean(payload.featured);
    if (payload.imageUrl !== undefined) updates.imageUrl = sanitiseString(payload.imageUrl, null);
    if (payload.metadata && typeof payload.metadata === 'object') updates.metadata = payload.metadata;

    await item.update(updates, { transaction });

    return item.get({ plain: true });
  });

  return { data: formatInventoryItem(record) };
}

export async function archiveStorefrontInventoryItem({ companyId, actor, inventoryId }) {
  if (!inventoryId) {
    throw buildHttpError(400, 'inventory_id_required');
  }

  const context = await resolveCompanyContext({ companyId, actor });

  await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({ companyId: context.companyId, company: context.company, transaction });
    const item = await ProviderStorefrontInventory.findOne({
      where: { id: inventoryId, storefrontId: storefront.id },
      transaction
    });

    if (!item) {
      throw buildHttpError(404, 'inventory_not_found');
    }

    await item.update({ visibility: 'archived' }, { transaction });
  });

  return { status: 'archived' };
}

export async function createStorefrontCoupon({ companyId, actor, payload }) {
  const context = await resolveCompanyContext({ companyId, actor });

  const record = await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({ companyId: context.companyId, company: context.company, transaction });

    const code = sanitiseString(payload.code, null);
    if (!code) {
      throw buildHttpError(400, 'code_required');
    }

    const exists = await ProviderStorefrontCoupon.count({
      where: { storefrontId: storefront.id, code },
      transaction
    });
    if (exists > 0) {
      throw buildHttpError(409, 'code_in_use');
    }

    const created = await ProviderStorefrontCoupon.create(
      {
        storefrontId: storefront.id,
        code,
        name: sanitiseString(payload.name, 'Promotion') || 'Promotion',
        description: sanitiseString(payload.description, null),
        discountType: ['percentage', 'fixed'].includes(payload.discountType) ? payload.discountType : 'percentage',
        discountValue: clampNumber(payload.discountValue, { min: 0, max: 100, fallback: 0 }),
        minOrderTotal: payload.minOrderTotal != null ? clampNumber(payload.minOrderTotal, { min: 0, max: 999999, fallback: 0 }) : null,
        maxDiscountValue:
          payload.maxDiscountValue != null
            ? clampNumber(payload.maxDiscountValue, { min: 0, max: 999999, fallback: null })
            : null,
        startsAt: parseDate(payload.startsAt),
        endsAt: parseDate(payload.endsAt),
        usageLimit: payload.usageLimit != null ? parseInteger(payload.usageLimit, null) : null,
        status: payload.status && ['draft', 'scheduled', 'active', 'expired', 'disabled'].includes(payload.status)
          ? payload.status
          : 'draft',
        appliesTo: sanitiseString(payload.appliesTo, null),
        metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
      },
      { transaction }
    );

    return created.get({ plain: true });
  });

  return { data: formatCoupon(record) };
}

export async function updateStorefrontCoupon({ companyId, actor, couponId, payload }) {
  if (!couponId) {
    throw buildHttpError(400, 'coupon_id_required');
  }

  const context = await resolveCompanyContext({ companyId, actor });

  const record = await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({ companyId: context.companyId, company: context.company, transaction });

    const coupon = await ProviderStorefrontCoupon.findOne({
      where: { id: couponId, storefrontId: storefront.id },
      transaction
    });

    if (!coupon) {
      throw buildHttpError(404, 'coupon_not_found');
    }

    const updates = {};
    if (payload.code && payload.code !== coupon.code) {
      const newCode = sanitiseString(payload.code, coupon.code);
      if (!newCode) {
        throw buildHttpError(400, 'code_required');
      }
      const exists = await ProviderStorefrontCoupon.count({
        where: { storefrontId: storefront.id, code: newCode, id: { [Op.ne]: coupon.id } },
        transaction
      });
      if (exists > 0) {
        throw buildHttpError(409, 'code_in_use');
      }
      updates.code = newCode;
    }

    if (payload.name !== undefined) updates.name = sanitiseString(payload.name, coupon.name) || coupon.name;
    if (payload.description !== undefined) updates.description = sanitiseString(payload.description, null);
    if (payload.discountType && ['percentage', 'fixed'].includes(payload.discountType)) {
      updates.discountType = payload.discountType;
    }
    if (payload.discountValue !== undefined)
      updates.discountValue = clampNumber(payload.discountValue, { min: 0, max: 100, fallback: Number(coupon.discountValue) });
    if (payload.minOrderTotal !== undefined)
      updates.minOrderTotal =
        payload.minOrderTotal != null
          ? clampNumber(payload.minOrderTotal, { min: 0, max: 999999, fallback: coupon.minOrderTotal ?? 0 })
          : null;
    if (payload.maxDiscountValue !== undefined)
      updates.maxDiscountValue =
        payload.maxDiscountValue != null
          ? clampNumber(payload.maxDiscountValue, { min: 0, max: 999999, fallback: coupon.maxDiscountValue ?? 0 })
          : null;
    if (payload.startsAt !== undefined) updates.startsAt = parseDate(payload.startsAt);
    if (payload.endsAt !== undefined) updates.endsAt = parseDate(payload.endsAt);
    if (payload.usageLimit !== undefined)
      updates.usageLimit = payload.usageLimit != null ? parseInteger(payload.usageLimit, coupon.usageLimit) : null;
    if (payload.status && ['draft', 'scheduled', 'active', 'expired', 'disabled'].includes(payload.status)) {
      updates.status = payload.status;
    }
    if (payload.appliesTo !== undefined) updates.appliesTo = sanitiseString(payload.appliesTo, null);
    if (payload.metadata && typeof payload.metadata === 'object') updates.metadata = payload.metadata;

    await coupon.update(updates, { transaction });

    return coupon.get({ plain: true });
  });

  return { data: formatCoupon(record) };
}

export async function updateStorefrontCouponStatus({ companyId, actor, couponId, status }) {
  if (!couponId) {
    throw buildHttpError(400, 'coupon_id_required');
  }
  if (!status || !['draft', 'scheduled', 'active', 'expired', 'disabled'].includes(status)) {
    throw buildHttpError(400, 'invalid_status');
  }

  const context = await resolveCompanyContext({ companyId, actor });

  await sequelize.transaction(async (transaction) => {
    const storefront = await ensureStorefront({ companyId: context.companyId, company: context.company, transaction });
    const coupon = await ProviderStorefrontCoupon.findOne({
      where: { id: couponId, storefrontId: storefront.id },
      transaction
    });
    if (!coupon) {
      throw buildHttpError(404, 'coupon_not_found');
    }

    await coupon.update({ status }, { transaction });
  });

  return { status };
}
