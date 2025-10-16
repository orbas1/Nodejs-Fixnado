import slugify from 'slugify';
import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import ToolRentalAsset from '../models/toolRentalAsset.js';
import ToolRentalPricingTier from '../models/toolRentalPricingTier.js';
import ToolRentalCoupon from '../models/toolRentalCoupon.js';
import InventoryItem from '../models/inventoryItem.js';
import RentalAgreement from '../models/rentalAgreement.js';

const SLUG_OPTIONS = { lower: true, strict: true, trim: true };

function ensureAssociations() {
  if (!ToolRentalAsset.associations?.pricingTiers) {
    ToolRentalAsset.hasMany(ToolRentalPricingTier, {
      as: 'pricingTiers',
      foreignKey: 'asset_id',
      sourceKey: 'id'
    });
  }
  if (!ToolRentalPricingTier.associations?.asset) {
    ToolRentalPricingTier.belongsTo(ToolRentalAsset, {
      as: 'asset',
      foreignKey: 'asset_id',
      targetKey: 'id'
    });
  }
  if (!ToolRentalAsset.associations?.inventoryItem) {
    ToolRentalAsset.belongsTo(InventoryItem, {
      as: 'inventoryItem',
      foreignKey: 'inventory_item_id',
      targetKey: 'id'
    });
  }
  if (!ToolRentalAsset.associations?.coupons) {
    ToolRentalAsset.hasMany(ToolRentalCoupon, {
      as: 'coupons',
      foreignKey: 'asset_id',
      sourceKey: 'id'
    });
  }
  if (!ToolRentalCoupon.associations?.asset) {
    ToolRentalCoupon.belongsTo(ToolRentalAsset, {
      as: 'asset',
      foreignKey: 'asset_id',
      targetKey: 'id'
    });
  }
}

function toolRentalError(code, statusCode, message) {
  const error = new Error(message || code);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function ensureCompany(companyId) {
  if (!companyId) {
    throw toolRentalError('company_required', 400, 'Company context is required for tool rental operations');
  }
  return companyId;
}

function normaliseString(value, fallback = null) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return fallback;
}

function toNumber(value, fallback = null) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value, fallback = null) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function sanitiseArray(value, mapper) {
  if (!Array.isArray(value)) {
    return [];
  }
  const result = [];
  value.forEach((entry) => {
    const mapped = mapper(entry);
    if (mapped != null) {
      result.push(mapped);
    }
  });
  return result;
}

function coerceSlug(name, proposedSlug) {
  const base = normaliseString(proposedSlug) || normaliseString(name);
  if (!base) {
    return null;
  }
  const slug = slugify(base, SLUG_OPTIONS).slice(0, 160);
  return slug || null;
}

async function ensureUniqueSlug({ companyId, name, slug, excludeAssetId = null }) {
  let candidate = coerceSlug(name, slug);
  if (!candidate) {
    candidate = `asset-${Date.now().toString(36)}`;
  }

  let index = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const probe = index === 0 ? candidate : `${candidate}-${index}`;
    const where = { companyId, slug: probe };
    if (excludeAssetId) {
      where.id = { [Op.ne]: excludeAssetId };
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await ToolRentalAsset.findOne({ where });
    if (!existing) {
      return probe;
    }
    index += 1;
  }
}

function serialisePricingTier(tier) {
  const json = tier.toJSON();
  return {
    id: json.id,
    assetId: json.assetId,
    name: json.name,
    description: json.description || null,
    durationDays: json.durationDays,
    price: toNumber(json.price, 0),
    currency: json.currency || 'GBP',
    depositAmount: toNumber(json.depositAmount, null),
    depositCurrency: json.depositCurrency || null,
    metadata: json.metadata || {}
  };
}

function serialiseAsset(asset, { couponCounts = new Map() } = {}) {
  const json = asset.toJSON();
  const pricingTiers = Array.isArray(json.pricingTiers)
    ? json.pricingTiers.map((tier) => serialisePricingTier(tier))
    : [];
  const gallery = sanitiseArray(json.gallery, (entry) => {
    if (typeof entry === 'string') {
      return { url: entry, alt: null };
    }
    if (entry && typeof entry === 'object' && entry.url) {
      return {
        url: normaliseString(entry.url),
        alt: normaliseString(entry.alt, null)
      };
    }
    return null;
  });
  const keywords = sanitiseArray(json.keywordTags, (tag) => normaliseString(tag, null)).filter(Boolean);
  const couponSummary = couponCounts.get(json.id) || { total: 0, active: 0 };

  return {
    id: json.id,
    companyId: json.companyId,
    inventoryItemId: json.inventoryItemId || null,
    name: json.name,
    slug: json.slug,
    description: json.description || null,
    rentalRate: toNumber(json.rentalRate, null),
    rentalRateCurrency: json.rentalRateCurrency || 'GBP',
    depositAmount: toNumber(json.depositAmount, null),
    depositCurrency: json.depositCurrency || json.rentalRateCurrency || null,
    minHireDays: json.minHireDays ?? 1,
    maxHireDays: json.maxHireDays ?? null,
    quantityAvailable: json.quantityAvailable ?? 0,
    availabilityStatus: json.availabilityStatus || 'available',
    seoTitle: json.seoTitle || null,
    seoDescription: json.seoDescription || null,
    keywordTags: keywords,
    heroImageUrl: json.heroImageUrl || null,
    gallery,
    showcaseVideoUrl: json.showcaseVideoUrl || null,
    metadata: json.metadata || {},
    pricingTiers,
    couponSummary,
    inventorySnapshot: json.inventoryItem
      ? {
          id: json.inventoryItem.id,
          name: json.inventoryItem.name,
          sku: json.inventoryItem.sku,
          quantityOnHand: json.inventoryItem.quantityOnHand,
          quantityReserved: json.inventoryItem.quantityReserved,
          safetyStock: json.inventoryItem.safetyStock,
          rentalRate: toNumber(json.inventoryItem.rentalRate, null),
          rentalRateCurrency: json.inventoryItem.rentalRateCurrency || json.rentalRateCurrency || 'GBP'
        }
      : null
  };
}

function serialiseCoupon(coupon) {
  const json = coupon.toJSON();
  return {
    id: json.id,
    companyId: json.companyId,
    assetId: json.assetId || null,
    code: json.code,
    description: json.description || null,
    discountType: json.discountType,
    discountValue: toNumber(json.discountValue, 0),
    currency: json.currency || null,
    maxRedemptions: json.maxRedemptions ?? null,
    perCustomerLimit: json.perCustomerLimit ?? null,
    validFrom: json.validFrom ? new Date(json.validFrom).toISOString() : null,
    validUntil: json.validUntil ? new Date(json.validUntil).toISOString() : null,
    status: json.status,
    metadata: json.metadata || {}
  };
}

export async function listToolRentalAssets({ companyId }) {
  ensureAssociations();
  ensureCompany(companyId);

  const [assets, couponRecords] = await Promise.all([
    ToolRentalAsset.findAll({
      where: { companyId },
      include: [
        {
          model: ToolRentalPricingTier,
          as: 'pricingTiers',
          separate: true,
          order: [['durationDays', 'ASC']]
        },
        {
          model: InventoryItem,
          as: 'inventoryItem',
          required: false
        }
      ],
      order: [['name', 'ASC']]
    }),
    ToolRentalCoupon.findAll({
      where: { companyId },
      attributes: ['assetId', 'status']
    })
  ]);

  const couponCounts = couponRecords.reduce((acc, record) => {
    const key = record.assetId;
    if (!acc.has(key)) {
      acc.set(key, { total: 0, active: 0 });
    }
    const summary = acc.get(key);
    summary.total += 1;
    if (record.status === 'active' || record.status === 'scheduled') {
      summary.active += 1;
    }
    return acc;
  }, new Map());

  return assets.map((asset) => serialiseAsset(asset, { couponCounts }));
}

export async function getToolRentalAsset({ companyId, assetId }) {
  ensureAssociations();
  ensureCompany(companyId);

  const asset = await ToolRentalAsset.findOne({
    where: { id: assetId, companyId },
    include: [
      {
        model: ToolRentalPricingTier,
        as: 'pricingTiers',
        separate: true,
        order: [['durationDays', 'ASC']]
      },
      {
        model: InventoryItem,
        as: 'inventoryItem',
        required: false
      }
    ]
  });

  if (!asset) {
    throw toolRentalError('asset_not_found', 404, 'Tool rental asset not found');
  }

  const couponRecords = await ToolRentalCoupon.findAll({
    where: { companyId, assetId },
    attributes: ['assetId', 'status']
  });
  const couponCounts = couponRecords.reduce((acc, record) => {
    acc.set(record.assetId, {
      total: (acc.get(record.assetId)?.total ?? 0) + 1,
      active:
        (acc.get(record.assetId)?.active ?? 0) +
        (record.status === 'active' || record.status === 'scheduled' ? 1 : 0)
    });
    return acc;
  }, new Map());

  return serialiseAsset(asset, { couponCounts });
}

export async function createToolRentalAsset({ companyId, payload }) {
  ensureAssociations();
  ensureCompany(companyId);

  const name = normaliseString(payload?.name);
  if (!name) {
    throw toolRentalError('asset_name_required', 422, 'Asset name is required');
  }

  const slug = await ensureUniqueSlug({
    companyId,
    name,
    slug: payload?.slug
  });

  const record = await ToolRentalAsset.create({
    companyId,
    inventoryItemId: normaliseString(payload?.inventoryItemId, null),
    name,
    slug,
    description: normaliseString(payload?.description, null),
    rentalRate: toNumber(payload?.rentalRate, null),
    rentalRateCurrency: normaliseString(payload?.rentalRateCurrency, 'GBP'),
    depositAmount: toNumber(payload?.depositAmount, null),
    depositCurrency: normaliseString(payload?.depositCurrency, null),
    minHireDays: Math.max(1, toInteger(payload?.minHireDays, 1) ?? 1),
    maxHireDays: toInteger(payload?.maxHireDays, null),
    quantityAvailable: Math.max(0, toInteger(payload?.quantityAvailable, 0) ?? 0),
    availabilityStatus: normaliseString(payload?.availabilityStatus, 'available') || 'available',
    seoTitle: normaliseString(payload?.seoTitle, null),
    seoDescription: normaliseString(payload?.seoDescription, null),
    keywordTags: sanitiseArray(payload?.keywordTags, (tag) => normaliseString(tag, null)).filter(Boolean),
    heroImageUrl: normaliseString(payload?.heroImageUrl, null),
    gallery: sanitiseArray(payload?.gallery, (entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (entry && typeof entry === 'object' && entry.url) {
        return {
          url: normaliseString(entry.url),
          alt: normaliseString(entry.alt, null)
        };
      }
      return null;
    }),
    showcaseVideoUrl: normaliseString(payload?.showcaseVideoUrl, null),
    metadata: payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
  });

  return getToolRentalAsset({ companyId, assetId: record.id });
}

export async function updateToolRentalAsset({ companyId, assetId, payload }) {
  ensureAssociations();
  ensureCompany(companyId);

  const asset = await ToolRentalAsset.findOne({ where: { id: assetId, companyId } });
  if (!asset) {
    throw toolRentalError('asset_not_found', 404, 'Tool rental asset not found');
  }

  if (payload?.name || payload?.slug) {
    const nextSlug = await ensureUniqueSlug({
      companyId,
      name: payload?.name || asset.name,
      slug: payload?.slug || asset.slug,
      excludeAssetId: assetId
    });
    asset.slug = nextSlug;
  }

  if (payload?.name) {
    const name = normaliseString(payload.name);
    if (!name) {
      throw toolRentalError('asset_name_required', 422, 'Asset name cannot be empty');
    }
    asset.name = name;
  }

  const assignable = {
    description: normaliseString(payload?.description, asset.description || null),
    rentalRate: toNumber(payload?.rentalRate, asset.rentalRate),
    rentalRateCurrency: normaliseString(payload?.rentalRateCurrency, asset.rentalRateCurrency || 'GBP'),
    depositAmount: toNumber(payload?.depositAmount, asset.depositAmount),
    depositCurrency: normaliseString(payload?.depositCurrency, asset.depositCurrency || null),
    minHireDays: Math.max(1, toInteger(payload?.minHireDays, asset.minHireDays ?? 1) ?? 1),
    maxHireDays: toInteger(payload?.maxHireDays, asset.maxHireDays ?? null),
    quantityAvailable: Math.max(0, toInteger(payload?.quantityAvailable, asset.quantityAvailable ?? 0) ?? 0),
    availabilityStatus: normaliseString(payload?.availabilityStatus, asset.availabilityStatus || 'available') || 'available',
    seoTitle: normaliseString(payload?.seoTitle, asset.seoTitle || null),
    seoDescription: normaliseString(payload?.seoDescription, asset.seoDescription || null),
    keywordTags: Array.isArray(payload?.keywordTags)
      ? sanitiseArray(payload.keywordTags, (tag) => normaliseString(tag, null)).filter(Boolean)
      : asset.keywordTags,
    heroImageUrl: normaliseString(payload?.heroImageUrl, asset.heroImageUrl || null),
    gallery: Array.isArray(payload?.gallery)
      ? sanitiseArray(payload.gallery, (entry) => {
          if (typeof entry === 'string') {
            return entry;
          }
          if (entry && typeof entry === 'object' && entry.url) {
            return {
              url: normaliseString(entry.url),
              alt: normaliseString(entry.alt, null)
            };
          }
          return null;
        })
      : asset.gallery,
    showcaseVideoUrl: normaliseString(payload?.showcaseVideoUrl, asset.showcaseVideoUrl || null),
    metadata:
      payload?.metadata && typeof payload.metadata === 'object'
        ? { ...asset.metadata, ...payload.metadata }
        : asset.metadata
  };

  asset.set(assignable);
  if (payload?.inventoryItemId !== undefined) {
    asset.inventoryItemId = normaliseString(payload.inventoryItemId, null);
  }

  await asset.save();

  return getToolRentalAsset({ companyId, assetId });
}

export async function createToolRentalPricingTier({ companyId, assetId, payload }) {
  ensureAssociations();
  ensureCompany(companyId);

  const asset = await ToolRentalAsset.findOne({ where: { id: assetId, companyId } });
  if (!asset) {
    throw toolRentalError('asset_not_found', 404, 'Tool rental asset not found');
  }

  const name = normaliseString(payload?.name);
  if (!name) {
    throw toolRentalError('pricing_name_required', 422, 'Pricing tier name is required');
  }

  const tier = await ToolRentalPricingTier.create({
    assetId,
    name,
    description: normaliseString(payload?.description, null),
    durationDays: Math.max(1, toInteger(payload?.durationDays, 1) ?? 1),
    price: toNumber(payload?.price, 0),
    currency: normaliseString(payload?.currency, asset.rentalRateCurrency || 'GBP') || 'GBP',
    depositAmount: toNumber(payload?.depositAmount, null),
    depositCurrency: normaliseString(payload?.depositCurrency, null),
    metadata: payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
  });

  return serialisePricingTier(tier);
}

export async function updateToolRentalPricingTier({ companyId, assetId, pricingId, payload }) {
  ensureAssociations();
  ensureCompany(companyId);

  const tier = await ToolRentalPricingTier.findOne({
    include: [{ model: ToolRentalAsset, as: 'asset', where: { id: assetId, companyId }, required: true }],
    where: { id: pricingId }
  });

  if (!tier) {
    throw toolRentalError('pricing_not_found', 404, 'Pricing tier not found');
  }

  if (payload?.name) {
    const name = normaliseString(payload.name);
    if (!name) {
      throw toolRentalError('pricing_name_required', 422, 'Pricing tier name is required');
    }
    tier.name = name;
  }

  tier.description = normaliseString(payload?.description, tier.description || null);
  tier.durationDays = Math.max(1, toInteger(payload?.durationDays, tier.durationDays ?? 1) ?? 1);
  if (payload?.price != null) {
    tier.price = toNumber(payload.price, tier.price);
  }
  tier.currency = normaliseString(payload?.currency, tier.currency || 'GBP') || 'GBP';
  if (payload?.depositAmount !== undefined) {
    tier.depositAmount = toNumber(payload.depositAmount, tier.depositAmount);
  }
  if (payload?.depositCurrency !== undefined) {
    tier.depositCurrency = normaliseString(payload.depositCurrency, tier.depositCurrency || null);
  }
  if (payload?.metadata && typeof payload.metadata === 'object') {
    tier.metadata = { ...tier.metadata, ...payload.metadata };
  }

  await tier.save();
  return serialisePricingTier(tier);
}

export async function deleteToolRentalPricingTier({ companyId, assetId, pricingId }) {
  ensureAssociations();
  ensureCompany(companyId);

  const tier = await ToolRentalPricingTier.findOne({
    include: [{ model: ToolRentalAsset, as: 'asset', where: { id: assetId, companyId }, required: true }],
    where: { id: pricingId }
  });

  if (!tier) {
    throw toolRentalError('pricing_not_found', 404, 'Pricing tier not found');
  }

  await tier.destroy();
  return { success: true };
}

export async function listToolRentalCoupons({ companyId }) {
  ensureCompany(companyId);
  const coupons = await ToolRentalCoupon.findAll({
    where: { companyId },
    order: [['createdAt', 'DESC']]
  });
  return coupons.map((coupon) => serialiseCoupon(coupon));
}

export async function createToolRentalCoupon({ companyId, payload }) {
  ensureCompany(companyId);

  const code = normaliseString(payload?.code);
  if (!code) {
    throw toolRentalError('coupon_code_required', 422, 'Coupon code is required');
  }

  const existing = await ToolRentalCoupon.findOne({ where: { companyId, code } });
  if (existing) {
    throw toolRentalError('coupon_code_conflict', 409, 'Coupon code already exists for this company');
  }

  const coupon = await ToolRentalCoupon.create({
    companyId,
    assetId: normaliseString(payload?.assetId, null),
    code,
    description: normaliseString(payload?.description, null),
    discountType: payload?.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: toNumber(payload?.discountValue, 0),
    currency: normaliseString(payload?.currency, null),
    maxRedemptions: toInteger(payload?.maxRedemptions, null),
    perCustomerLimit: toInteger(payload?.perCustomerLimit, null),
    validFrom: payload?.validFrom ? new Date(payload.validFrom) : null,
    validUntil: payload?.validUntil ? new Date(payload.validUntil) : null,
    status: normaliseString(payload?.status, 'draft') || 'draft',
    metadata: payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
  });

  return serialiseCoupon(coupon);
}

export async function updateToolRentalCoupon({ companyId, couponId, payload }) {
  ensureCompany(companyId);

  const coupon = await ToolRentalCoupon.findOne({ where: { id: couponId, companyId } });
  if (!coupon) {
    throw toolRentalError('coupon_not_found', 404, 'Coupon not found');
  }

  if (payload?.code && payload.code !== coupon.code) {
    const code = normaliseString(payload.code);
    if (!code) {
      throw toolRentalError('coupon_code_required', 422, 'Coupon code cannot be empty');
    }
    const conflict = await ToolRentalCoupon.findOne({
      where: {
        companyId,
        code,
        id: { [Op.ne]: couponId }
      }
    });
    if (conflict) {
      throw toolRentalError('coupon_code_conflict', 409, 'Coupon code already exists for this company');
    }
    coupon.code = code;
  }

  if (payload?.assetId !== undefined) {
    coupon.assetId = normaliseString(payload.assetId, null);
  }

  coupon.description = normaliseString(payload?.description, coupon.description || null);
  if (payload?.discountType) {
    coupon.discountType = payload.discountType === 'fixed' ? 'fixed' : 'percentage';
  }
  if (payload?.discountValue !== undefined) {
    coupon.discountValue = toNumber(payload.discountValue, coupon.discountValue);
  }
  if (payload?.currency !== undefined) {
    coupon.currency = normaliseString(payload.currency, coupon.currency || null);
  }
  if (payload?.maxRedemptions !== undefined) {
    coupon.maxRedemptions = toInteger(payload.maxRedemptions, coupon.maxRedemptions ?? null);
  }
  if (payload?.perCustomerLimit !== undefined) {
    coupon.perCustomerLimit = toInteger(payload.perCustomerLimit, coupon.perCustomerLimit ?? null);
  }
  if (payload?.validFrom !== undefined) {
    coupon.validFrom = payload.validFrom ? new Date(payload.validFrom) : null;
  }
  if (payload?.validUntil !== undefined) {
    coupon.validUntil = payload.validUntil ? new Date(payload.validUntil) : null;
  }
  if (payload?.status) {
    coupon.status = normaliseString(payload.status, coupon.status || 'draft') || 'draft';
  }
  if (payload?.metadata && typeof payload.metadata === 'object') {
    coupon.metadata = { ...coupon.metadata, ...payload.metadata };
  }

  await coupon.save();
  return serialiseCoupon(coupon);
}

export async function deleteToolRentalCoupon({ companyId, couponId }) {
  ensureCompany(companyId);
  const coupon = await ToolRentalCoupon.findOne({ where: { id: couponId, companyId } });
  if (!coupon) {
    throw toolRentalError('coupon_not_found', 404, 'Coupon not found');
  }
  await coupon.destroy();
  return { success: true };
}

function overlapsDay(rental, dayStart, dayEnd) {
  const start = rental.rentalStartAt ? DateTime.fromJSDate(rental.rentalStartAt) : null;
  const end = rental.returnDueAt
    ? DateTime.fromJSDate(rental.returnDueAt)
    : rental.rentalEndAt
      ? DateTime.fromJSDate(rental.rentalEndAt)
      : null;

  if (!start || !end) {
    return false;
  }

  return end >= dayStart && start <= dayEnd;
}

export async function getToolRentalAvailability({ companyId, assetId, from, to }) {
  ensureCompany(companyId);
  const asset = await ToolRentalAsset.findOne({ where: { id: assetId, companyId } });
  if (!asset) {
    throw toolRentalError('asset_not_found', 404, 'Tool rental asset not found');
  }

  const startDate = from ? DateTime.fromISO(from, { zone: 'utc' }) : DateTime.now().startOf('day');
  const endDate = to
    ? DateTime.fromISO(to, { zone: 'utc' }).endOf('day')
    : startDate.plus({ days: 13 }).endOf('day');

  if (!startDate.isValid || !endDate.isValid) {
    throw toolRentalError('invalid_date_range', 422, 'Unable to parse availability window');
  }

  const rentals = await RentalAgreement.findAll({
    where: {
      companyId,
      status: { [Op.notIn]: ['cancelled'] },
      [Op.or]: [
        {
          rentalStartAt: { [Op.lte]: endDate.toJSDate() },
          rentalEndAt: { [Op.gte]: startDate.toJSDate() }
        },
        {
          rentalStartAt: { [Op.lte]: endDate.toJSDate() },
          returnDueAt: { [Op.gte]: startDate.toJSDate() }
        }
      ],
      ...(asset.inventoryItemId
        ? { itemId: asset.inventoryItemId }
        : { itemId: { [Op.is]: null }, marketplaceItemId: asset.metadata?.marketplaceItemId || null })
    }
  });

  const timeline = [];
  for (let cursor = startDate.startOf('day'); cursor <= endDate; cursor = cursor.plus({ days: 1 })) {
    const dayStart = cursor.startOf('day');
    const dayEnd = cursor.endOf('day');
    const reserved = rentals.reduce((sum, rental) => {
      if (overlapsDay(rental, dayStart, dayEnd)) {
        return sum + (rental.quantity ?? 1);
      }
      return sum;
    }, 0);
    const available = Math.max(0, (asset.quantityAvailable ?? 0) - reserved);

    timeline.push({
      date: cursor.toISODate(),
      reserved,
      available,
      status:
        available === 0
          ? 'sold_out'
          : available <= Math.max(1, Math.floor((asset.quantityAvailable ?? 0) * 0.2))
            ? 'limited'
            : 'available'
    });
  }

  return {
    asset: serialiseAsset(asset),
    totalQuantity: asset.quantityAvailable ?? 0,
    timeline
  };
}

export default {
  listToolRentalAssets,
  getToolRentalAsset,
  createToolRentalAsset,
  updateToolRentalAsset,
  createToolRentalPricingTier,
  updateToolRentalPricingTier,
  deleteToolRentalPricingTier,
  listToolRentalCoupons,
  createToolRentalCoupon,
  updateToolRentalCoupon,
  deleteToolRentalCoupon,
  getToolRentalAvailability
};
