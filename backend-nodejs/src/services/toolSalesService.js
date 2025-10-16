import { sequelize, ToolSaleProfile, ToolSaleCoupon, InventoryItem, MarketplaceItem } from '../models/index.js';
import { createInventoryItem, updateInventoryItem } from './inventoryService.js';
import { resolveCompanyForActor } from './panelService.js';

function toolSaleError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
}

function toStringArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' || typeof entry === 'number' ? `${entry}`.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function toImageArray(value) {
  return toStringArray(value).map((entry) => entry.replace(/\s+/g, ''));
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normaliseSettings(settings) {
  return settings && typeof settings === 'object' ? settings : {};
}

function normaliseCouponPayload(coupon = {}) {
  const payload = {
    name: coupon.name ?? 'New coupon',
    code: coupon.code ?? null,
    description: coupon.description ?? null,
    discountType: coupon.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: toNumber(coupon.discountValue, 0),
    currency: coupon.currency ?? null,
    minOrderTotal: toNumber(coupon.minOrderTotal, null),
    startsAt: coupon.startsAt ? new Date(coupon.startsAt) : null,
    expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
    maxRedemptions: toInteger(coupon.maxRedemptions, null),
    maxRedemptionsPerCustomer: toInteger(coupon.maxRedemptionsPerCustomer, null),
    autoApply: Boolean(coupon.autoApply),
    status: coupon.status ?? 'draft',
    imageUrl: coupon.imageUrl ?? null,
    termsUrl: coupon.termsUrl ?? null
  };

  const allowedStatus = ['draft', 'scheduled', 'active', 'expired', 'archived'];
  if (!allowedStatus.includes(payload.status)) {
    payload.status = 'draft';
  }

  return payload;
}

function formatCoupon(instance) {
  if (!instance) {
    return null;
  }
  const coupon = typeof instance.toJSON === 'function' ? instance.toJSON() : instance;
  return {
    id: coupon.id,
    name: coupon.name,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue != null ? Number(coupon.discountValue) : null,
    currency: coupon.currency,
    minOrderTotal: coupon.minOrderTotal != null ? Number(coupon.minOrderTotal) : null,
    startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString() : null,
    expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
    maxRedemptions: coupon.maxRedemptions,
    maxRedemptionsPerCustomer: coupon.maxRedemptionsPerCustomer,
    autoApply: Boolean(coupon.autoApply),
    status: coupon.status,
    imageUrl: coupon.imageUrl,
    termsUrl: coupon.termsUrl,
    createdAt: coupon.createdAt ? coupon.createdAt.toISOString() : null,
    updatedAt: coupon.updatedAt ? coupon.updatedAt.toISOString() : null
  };
}

function formatInventory(inventory) {
  if (!inventory) {
    return null;
  }
  const item = typeof inventory.toJSON === 'function' ? inventory.toJSON() : inventory;
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    unitType: item.unitType,
    quantityOnHand: item.quantityOnHand,
    quantityReserved: item.quantityReserved,
    safetyStock: item.safetyStock,
    rentalRate: item.rentalRate != null ? Number(item.rentalRate) : null,
    rentalRateCurrency: item.rentalRateCurrency,
    depositAmount: item.depositAmount != null ? Number(item.depositAmount) : null,
    depositCurrency: item.depositCurrency,
    replacementCost: item.replacementCost != null ? Number(item.replacementCost) : null,
    insuranceRequired: Boolean(item.insuranceRequired),
    conditionRating: item.conditionRating,
    metadata: item.metadata ?? {},
    marketplaceItemId: item.marketplaceItemId,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null
  };
}

function formatMarketplace(listing) {
  if (!listing) {
    return null;
  }
  const record = typeof listing.toJSON === 'function' ? listing.toJSON() : listing;
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    availability: record.availability,
    status: record.status,
    pricePerDay: record.pricePerDay != null ? Number(record.pricePerDay) : null,
    purchasePrice: record.purchasePrice != null ? Number(record.purchasePrice) : null,
    location: record.location,
    insuredOnly: Boolean(record.insuredOnly),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null
  };
}

function formatToolSaleProfile(profile) {
  const json = typeof profile.toJSON === 'function' ? profile.toJSON() : profile;
  const inventory = formatInventory(json.inventoryItem);
  const listing = formatMarketplace(json.marketplaceItem);
  const coupons = Array.isArray(json.coupons) ? json.coupons.map(formatCoupon).filter(Boolean) : [];

  return {
    id: json.id,
    companyId: json.companyId,
    inventoryItemId: json.inventoryItemId,
    marketplaceItemId: json.marketplaceItemId,
    name: listing?.title || inventory?.name || 'Tool listing',
    sku: inventory?.sku ?? null,
    tagline: json.tagline ?? '',
    shortDescription: json.shortDescription ?? '',
    longDescription: json.longDescription ?? '',
    heroImageUrl: json.heroImageUrl ?? null,
    showcaseVideoUrl: json.showcaseVideoUrl ?? null,
    galleryImages: Array.isArray(json.galleryImages) ? json.galleryImages : [],
    tags: Array.isArray(json.tags) ? json.tags : [],
    keywordTags: Array.isArray(json.keywordTags) ? json.keywordTags : [],
    settings: normaliseSettings(json.settings),
    inventory,
    listing,
    coupons,
    metrics: {
      quantityAvailable:
        (inventory?.quantityOnHand ?? 0) - (inventory?.quantityReserved ?? 0) > 0
          ? (inventory?.quantityOnHand ?? 0) - (inventory?.quantityReserved ?? 0)
          : 0,
      activeCoupons: coupons.filter((coupon) => coupon.status === 'active').length
    },
    createdAt: json.createdAt ? json.createdAt.toISOString() : null,
    updatedAt: json.updatedAt ? json.updatedAt.toISOString() : null
  };
}

function summariseToolSales(listings) {
  const totalListings = listings.length;
  const draft = listings.filter((item) => item.listing?.status === 'draft').length;
  const published = listings.filter((item) => item.listing?.status === 'approved').length;
  const suspended = listings.filter((item) => item.listing?.status === 'suspended').length;
  const totalQuantity = listings.reduce((sum, item) => sum + (item.inventory?.quantityOnHand ?? 0), 0);
  const activeCoupons = listings.reduce((sum, item) => sum + item.coupons.filter((coupon) => coupon.status === 'active').length, 0);

  return {
    totalListings,
    draft,
    published,
    suspended,
    totalQuantity,
    activeCoupons
  };
}

async function fetchProfile(profileId, companyId, { transaction, lock = false } = {}) {
  const profile = await ToolSaleProfile.findOne({
    where: { id: profileId, companyId },
    include: [
      { model: InventoryItem, as: 'inventoryItem' },
      { model: MarketplaceItem, as: 'marketplaceItem' },
      { model: ToolSaleCoupon, as: 'coupons' }
    ],
    transaction,
    lock: lock && transaction?.LOCK?.UPDATE ? transaction.LOCK.UPDATE : undefined
  });

  if (!profile) {
    throw toolSaleError('tool_sale_profile_not_found', 404);
  }

  return profile;
}

function buildInventoryPatch(payload = {}) {
  const patch = {};
  const stringFields = ['name', 'sku', 'category', 'unitType', 'rentalRateCurrency', 'depositCurrency'];
  stringFields.forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      patch[field] = payload[field];
    }
  });

  const integerFields = ['quantityOnHand', 'quantityReserved', 'safetyStock'];
  integerFields.forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      patch[field] = payload[field];
    }
  });

  const decimalFields = ['rentalRate', 'depositAmount', 'replacementCost'];
  decimalFields.forEach((field) => {
    if (Object.hasOwn(payload, field)) {
      patch[field] = payload[field];
    }
  });

  if (Object.hasOwn(payload, 'insuranceRequired')) {
    patch.insuranceRequired = payload.insuranceRequired;
  }
  if (Object.hasOwn(payload, 'conditionRating')) {
    patch.conditionRating = payload.conditionRating;
  }

  if (Object.hasOwn(payload, 'inventoryMetadata')) {
    patch.metadata = payload.inventoryMetadata;
  } else if (Object.hasOwn(payload, 'inventoryMetadataPatch')) {
    patch.metadataPatch = payload.inventoryMetadataPatch;
  }

  return patch;
}

function buildListingPatch(payload = {}) {
  const patch = {};
  if (Object.hasOwn(payload, 'name')) {
    patch.title = payload.name;
  }
  if (Object.hasOwn(payload, 'longDescription') || Object.hasOwn(payload, 'shortDescription')) {
    patch.description = payload.longDescription ?? payload.shortDescription ?? patch.description;
  }
  if (Object.hasOwn(payload, 'description')) {
    patch.description = payload.description;
  }
  if (Object.hasOwn(payload, 'availability')) {
    patch.availability = payload.availability;
  }
  if (Object.hasOwn(payload, 'status')) {
    patch.status = payload.status;
  }
  if (Object.hasOwn(payload, 'pricePerDay')) {
    patch.pricePerDay = toNumber(payload.pricePerDay, null);
  }
  if (Object.hasOwn(payload, 'purchasePrice')) {
    patch.purchasePrice = toNumber(payload.purchasePrice, null);
  }
  if (Object.hasOwn(payload, 'location')) {
    patch.location = payload.location;
  }
  if (Object.hasOwn(payload, 'insuredOnly')) {
    patch.insuredOnly = Boolean(payload.insuredOnly);
  }
  return patch;
}

function resolveProfilePatch(payload = {}, existingProfile) {
  const patch = {};
  if (Object.hasOwn(payload, 'tagline')) {
    patch.tagline = payload.tagline ?? '';
  }
  if (Object.hasOwn(payload, 'shortDescription')) {
    patch.shortDescription = payload.shortDescription ?? '';
  }
  if (Object.hasOwn(payload, 'longDescription') || Object.hasOwn(payload, 'description')) {
    patch.longDescription = payload.longDescription ?? payload.description ?? existingProfile.longDescription;
  }
  if (Object.hasOwn(payload, 'heroImageUrl')) {
    patch.heroImageUrl = payload.heroImageUrl ?? null;
  }
  if (Object.hasOwn(payload, 'showcaseVideoUrl')) {
    patch.showcaseVideoUrl = payload.showcaseVideoUrl ?? null;
  }
  if (Object.hasOwn(payload, 'galleryImages')) {
    patch.galleryImages = toImageArray(payload.galleryImages);
  }
  if (Object.hasOwn(payload, 'tags')) {
    patch.tags = toStringArray(payload.tags);
  }
  if (Object.hasOwn(payload, 'keywordTags')) {
    patch.keywordTags = toStringArray(payload.keywordTags);
  }
  if (Object.hasOwn(payload, 'settings')) {
    patch.settings = normaliseSettings(payload.settings);
  }
  return patch;
}

export async function listToolSales({ companyId, actor } = {}) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const profiles = await ToolSaleProfile.findAll({
    where: { companyId: company.id },
    include: [
      { model: InventoryItem, as: 'inventoryItem' },
      { model: MarketplaceItem, as: 'marketplaceItem' },
      { model: ToolSaleCoupon, as: 'coupons' }
    ],
    order: [['updatedAt', 'DESC']]
  });

  const listings = profiles.map(formatToolSaleProfile);
  return {
    companyId: company.id,
    summary: summariseToolSales(listings),
    listings
  };
}

export async function createToolSale(payload = {}, { companyId, actor } = {}) {
  const { company } = await resolveCompanyForActor({ companyId, actor });

  return sequelize.transaction(async (transaction) => {
    const tags = toStringArray(payload.tags);
    const keywordTags = toStringArray(payload.keywordTags);
    const galleryImages = toImageArray(payload.galleryImages);

    const inventory = await createInventoryItem(
      {
        companyId: company.id,
        name: payload.name,
        sku: payload.sku,
        category: payload.category ?? 'Tools',
        unitType: payload.unitType ?? 'unit',
        quantityOnHand: payload.quantityOnHand ?? 0,
        quantityReserved: payload.quantityReserved ?? 0,
        safetyStock: payload.safetyStock ?? 0,
        rentalRate: payload.rentalRate ?? null,
        rentalRateCurrency: payload.rentalRateCurrency ?? payload.currency ?? null,
        depositAmount: payload.depositAmount ?? null,
        depositCurrency: payload.depositCurrency ?? payload.currency ?? null,
        replacementCost: payload.replacementCost ?? null,
        insuranceRequired: Boolean(payload.insuranceRequired),
        conditionRating: payload.conditionRating ?? 'good',
        metadata: {
          ...(payload.inventoryMetadata ?? {}),
          tags,
          heroImageUrl: payload.heroImageUrl ?? null
        }
      },
      { transaction }
    );

    const listing = await MarketplaceItem.create(
      {
        companyId: company.id,
        title: payload.name ?? 'Tool listing',
        description: payload.longDescription ?? payload.shortDescription ?? payload.description ?? payload.tagline ?? '',
        availability: payload.availability ?? 'buy',
        status: payload.status ?? 'draft',
        pricePerDay: payload.pricePerDay ?? null,
        purchasePrice: payload.purchasePrice ?? null,
        location: payload.location ?? 'UK-wide',
        insuredOnly: Boolean(payload.insuredOnly)
      },
      { transaction }
    );

    await inventory.update({ marketplaceItemId: listing.id }, { transaction });

    const profile = await ToolSaleProfile.create(
      {
        companyId: company.id,
        inventoryItemId: inventory.id,
        marketplaceItemId: listing.id,
        tagline: payload.tagline ?? '',
        shortDescription: payload.shortDescription ?? '',
        longDescription: payload.longDescription ?? payload.description ?? '',
        heroImageUrl: payload.heroImageUrl ?? null,
        showcaseVideoUrl: payload.showcaseVideoUrl ?? null,
        galleryImages,
        tags,
        keywordTags,
        settings: normaliseSettings(payload.settings)
      },
      { transaction }
    );

    if (Array.isArray(payload.coupons)) {
      for (const coupon of payload.coupons) {
        const normalised = normaliseCouponPayload(coupon);
        await ToolSaleCoupon.create(
          {
            ...normalised,
            toolSaleProfileId: profile.id,
            companyId: company.id
          },
          { transaction }
        );
      }
    }

    const freshProfile = await fetchProfile(profile.id, company.id, { transaction });
    return formatToolSaleProfile(freshProfile);
  });
}

export async function updateToolSale(profileId, payload = {}, { companyId, actor } = {}) {
  if (!profileId) {
    throw toolSaleError('tool_sale_profile_id_required');
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  return sequelize.transaction(async (transaction) => {
    const profile = await fetchProfile(profileId, company.id, { transaction, lock: true });

    const profilePatch = resolveProfilePatch(payload, profile);
    if (Object.keys(profilePatch).length > 0) {
      await profile.update(profilePatch, { transaction });
    }

    if (profile.inventoryItemId) {
      const inventoryPatch = buildInventoryPatch(payload);
      if (Object.keys(inventoryPatch).length > 0) {
        await updateInventoryItem(profile.inventoryItemId, inventoryPatch, { transaction });
      }
    }

    if (profile.marketplaceItemId) {
      const listingPatch = buildListingPatch(payload);
      if (Object.keys(listingPatch).length > 0) {
        await MarketplaceItem.update(listingPatch, { where: { id: profile.marketplaceItemId }, transaction });
      }
    }

    const freshProfile = await fetchProfile(profileId, company.id, { transaction });
    return formatToolSaleProfile(freshProfile);
  });
}

export async function deleteToolSale(profileId, { companyId, actor } = {}) {
  if (!profileId) {
    throw toolSaleError('tool_sale_profile_id_required');
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  await sequelize.transaction(async (transaction) => {
    const profile = await fetchProfile(profileId, company.id, { transaction, lock: true });

    await ToolSaleCoupon.destroy({ where: { toolSaleProfileId: profile.id }, transaction });

    if (profile.marketplaceItemId) {
      await MarketplaceItem.update(
        { status: 'archived' },
        { where: { id: profile.marketplaceItemId }, transaction }
      );
    }

    if (profile.inventoryItemId) {
      await InventoryItem.update(
        { marketplaceItemId: null },
        { where: { id: profile.inventoryItemId }, transaction }
      );
    }

    await ToolSaleProfile.destroy({ where: { id: profile.id }, transaction });
  });
}

export async function createToolSaleCoupon(profileId, payload = {}, { companyId, actor } = {}) {
  if (!profileId) {
    throw toolSaleError('tool_sale_profile_id_required');
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  return sequelize.transaction(async (transaction) => {
    const profile = await fetchProfile(profileId, company.id, { transaction, lock: true });
    const normalised = normaliseCouponPayload(payload);
    await ToolSaleCoupon.create(
      {
        ...normalised,
        toolSaleProfileId: profile.id,
        companyId: company.id
      },
      { transaction }
    );

    const freshProfile = await fetchProfile(profileId, company.id, { transaction });
    return formatToolSaleProfile(freshProfile);
  });
}

export async function updateToolSaleCoupon(profileId, couponId, payload = {}, { companyId, actor } = {}) {
  if (!profileId || !couponId) {
    throw toolSaleError('coupon_identifier_required');
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  return sequelize.transaction(async (transaction) => {
    await fetchProfile(profileId, company.id, { transaction });

    const coupon = await ToolSaleCoupon.findOne({
      where: { id: couponId, toolSaleProfileId: profileId, companyId: company.id },
      transaction,
      lock: transaction?.LOCK?.UPDATE ?? undefined
    });

    if (!coupon) {
      throw toolSaleError('tool_sale_coupon_not_found', 404);
    }

    const normalised = normaliseCouponPayload(payload);
    await coupon.update(normalised, { transaction });

    const freshProfile = await fetchProfile(profileId, company.id, { transaction });
    return formatToolSaleProfile(freshProfile);
  });
}

export async function deleteToolSaleCoupon(profileId, couponId, { companyId, actor } = {}) {
  if (!profileId || !couponId) {
    throw toolSaleError('coupon_identifier_required');
  }

  const { company } = await resolveCompanyForActor({ companyId, actor });

  return sequelize.transaction(async (transaction) => {
    await fetchProfile(profileId, company.id, { transaction });

    const coupon = await ToolSaleCoupon.findOne({
      where: { id: couponId, toolSaleProfileId: profileId, companyId: company.id },
      transaction,
      lock: transaction?.LOCK?.UPDATE ?? undefined
    });

    if (!coupon) {
      throw toolSaleError('tool_sale_coupon_not_found', 404);
    }

    await coupon.destroy({ transaction });

    const freshProfile = await fetchProfile(profileId, company.id, { transaction });
    return formatToolSaleProfile(freshProfile);
  });
}
