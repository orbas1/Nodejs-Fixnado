import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Booking,
  BookingAssignment,
  Company,
  CustomJobBid,
  CustomJobBidMessage,
  MarketplaceItem,
  Post,
  RentalAgreement,
  Service,
  ServiceZone,
  User
} from '../models/index.js';
import { listApprovedMarketplaceItems } from './marketplaceService.js';
import { broadcastLiveFeedEvent } from './liveFeedStreamService.js';
import { recordLiveFeedAuditEvent } from './liveFeedAuditService.js';

const DEFAULT_FEED_LIMIT = 25;

const SUGGESTION_LIMIT = 3;

export const POST_INCLUDE_GRAPH = [
  { model: User, attributes: ['id', 'firstName', 'lastName', 'type', 'email'] },
  { model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'companyId'] },
  {
    model: CustomJobBid,
    as: 'bids',
    include: [
      { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'type'] },
      { model: Company, as: 'providerCompany', attributes: ['id', 'legalStructure', 'contactName'] },
      {
        model: CustomJobBidMessage,
        as: 'messages',
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }]
      }
    ]
  },
  {
    model: CustomJobBid,
    as: 'awardedBid',
    include: [
      { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'type'] },
      { model: Company, as: 'providerCompany', attributes: ['id', 'legalStructure', 'contactName'] },
      {
        model: CustomJobBidMessage,
        as: 'messages',
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }]
      }
    ]
  },
  { model: User, as: 'awardedByUser', attributes: ['id', 'firstName', 'lastName', 'type', 'email'] }
];

function sanitizeLimit(limit) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_FEED_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

export function serialiseBid(bid) {
  const json = typeof bid?.toJSON === 'function' ? bid.toJSON() : bid;
  if (!json) return json;

  return {
    ...json,
    messages: Array.isArray(json.messages)
      ? json.messages
          .slice()
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      : []
  };
}

export function serialisePost(post) {
  const json = typeof post?.toJSON === 'function' ? post.toJSON() : post;
  if (!json) return json;

  const bids = Array.isArray(json.bids)
    ? json.bids
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((entry) => serialiseBid(entry))
    : [];

  const customer = json.customer ?? json.User ?? null;
  const awardedByUser = json.awardedByUser ?? null;
  const awardedBid = json.awardedBid ? serialiseBid(json.awardedBid) : null;
  const messageCount = bids.reduce((acc, bidEntry) => acc + (bidEntry.messages?.length ?? 0), 0);

  return {
    ...json,
    images: Array.isArray(json.images) ? json.images : [],
    metadata: json.metadata ?? {},
    bids,
    awardedBid,
    customer: customer
      ? {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          type: customer.type
        }
      : null,
    awardedByUser: awardedByUser
      ? {
          id: awardedByUser.id,
          firstName: awardedByUser.firstName,
          lastName: awardedByUser.lastName,
          email: awardedByUser.email,
          type: awardedByUser.type
        }
      : null,
    bidCount: bids.length,
    messageCount,
    internalNotes: json.internalNotes ?? null
  };
}

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseCurrency(value, fallback = 'GBP') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

function parseBudgetAmount(value) {
  if (value == null || value === '') {
    return null;
  }

  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw createServiceError('Budget amount must be a positive number', 422);
  }

  return numeric;
}

function ensureDate(value, fieldName) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw createServiceError(`Invalid date provided for ${fieldName}`, 422);
  }

  return parsed;
}

function normaliseString(value, { maxLength, fallback = null } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }

  return trimmed;
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return JSON.parse(JSON.stringify(metadata));
}

function sanitiseImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((entry) => normaliseString(entry, { maxLength: 2048 }))
    .filter((entry) => entry && /^https?:\/\//i.test(entry));
}

function sanitiseAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }

      const url = normaliseString(attachment.url, { maxLength: 2048 });
      if (!url || !/^https?:\/\//i.test(url)) {
        return null;
      }

      const label = normaliseString(attachment.label, { maxLength: 120, fallback: null });
      return label ? { url, label } : { url };
    })
    .filter(Boolean);
}

function toTitleCase(value) {
  if (!value) {
    return null;
  }

  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(\w)|\s(\w)/g, (match) => match.toUpperCase());
}

function safeNumber(value) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const currencyFormatterCache = new Map();

function formatCurrencyLabel(value, currency = 'USD') {
  const numeric = safeNumber(value);
  if (numeric == null) {
    return null;
  }

  const code = typeof currency === 'string' && currency.length === 3 ? currency.toUpperCase() : 'USD';
  const cacheKey = `${code}:0`;
  if (!currencyFormatterCache.has(cacheKey)) {
    currencyFormatterCache.set(
      cacheKey,
      new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0
      })
    );
  }

  return currencyFormatterCache.get(cacheKey).format(numeric);
}

function summariseCompany(company) {
  if (!company) {
    return null;
  }

  return company.contactName || company.name || null;
}

function summariseProviderName(provider) {
  if (!provider) {
    return null;
  }

  const parts = [];
  if (provider.firstName) {
    parts.push(provider.firstName);
  }
  if (provider.lastName) {
    parts.push(provider.lastName);
  }

  if (parts.length === 0 && provider.email) {
    return provider.email.split('@')[0];
  }

  return parts.length > 0 ? parts.join(' ') : 'Provider';
}

function buildServiceSuggestions(bookings, serviceLookup, limit) {
  const buckets = new Map();

  bookings.forEach((booking) => {
    const meta = booking.meta ?? {};
    const serviceId = typeof meta.serviceId === 'string' ? meta.serviceId : null;
    const category = typeof meta.serviceCategory === 'string' ? meta.serviceCategory : null;
    const key = serviceId || (category ? `category:${category}` : null);
    if (!key) {
      return;
    }

    const bucket = buckets.get(key) ?? {
      serviceId,
      category,
      occurrences: 0,
      totalValue: 0,
      totalValueSamples: 0,
      companies: new Set(),
      fallbackTitle: typeof meta.title === 'string' && meta.title.trim().length > 0 ? meta.title.trim() : booking.title || null,
      currency: booking.currency || meta.currency || 'USD',
      lastSeen: 0
    };

    bucket.occurrences += 1;
    const totalAmount = safeNumber(booking.totalAmount) ?? safeNumber(booking.baseAmount);
    if (totalAmount != null) {
      bucket.totalValue += totalAmount;
      bucket.totalValueSamples += 1;
    }

    const seenAt = new Date(booking.updatedAt || booking.createdAt || Date.now()).getTime();
    if (Number.isFinite(seenAt) && seenAt > bucket.lastSeen) {
      bucket.lastSeen = seenAt;
    }

    const companyLabel = summariseCompany(booking.Company);
    if (companyLabel) {
      bucket.companies.add(companyLabel);
    }

    buckets.set(key, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => {
      const service = bucket.serviceId ? serviceLookup.get(bucket.serviceId) : null;
      const companyLabel = summariseCompany(service?.Company) || [...bucket.companies][0] || null;
      const priceLabel = bucket.totalValueSamples > 0
        ? formatCurrencyLabel(bucket.totalValue / bucket.totalValueSamples, service?.currency || bucket.currency)
        : formatCurrencyLabel(service?.price, service?.currency || bucket.currency);
      const href = service?.slug
        ? `/services/${service.slug}`
        : service?.id
          ? `/services?highlight=${service.id}`
          : '/services';

      const id = service?.id || bucket.serviceId || (bucket.category ? `category:${bucket.category}` : bucket.fallbackTitle || href);
      const title = service?.title || bucket.fallbackTitle || (bucket.category ? toTitleCase(bucket.category) : 'Service');

      return {
        id,
        title,
        company: companyLabel,
        priceLabel,
        href,
        occurrences: bucket.occurrences,
        lastSeen: bucket.lastSeen
      };
    })
    .sort((a, b) => {
      if (b.occurrences !== a.occurrences) {
        return b.occurrences - a.occurrences;
      }

      return b.lastSeen - a.lastSeen;
    })
    .slice(0, limit)
    .map(({ occurrences, lastSeen, ...rest }) => rest);
}

function buildProviderSuggestions(bookings, limit) {
  const buckets = new Map();

  bookings.forEach((booking) => {
    const assignments = Array.isArray(booking.BookingAssignments) ? booking.BookingAssignments : [];
    assignments.forEach((assignment) => {
      const provider = assignment.provider;
      if (!provider || !provider.id) {
        return;
      }

      if (assignment.status && ['withdrawn', 'declined'].includes(assignment.status)) {
        return;
      }

      const bucket = buckets.get(provider.id) ?? {
        id: provider.id,
        provider,
        programmes: 0,
        zones: new Set(),
        companies: new Set(),
        lastSeen: 0
      };

      bucket.programmes += 1;
      const zoneName = typeof booking.meta?.zoneName === 'string' ? booking.meta.zoneName : null;
      if (zoneName) {
        bucket.zones.add(zoneName);
      }

      const companyLabel = summariseCompany(booking.Company);
      if (companyLabel) {
        bucket.companies.add(companyLabel);
      }

      const seenAt = new Date(assignment.assignedAt || booking.updatedAt || booking.createdAt || Date.now()).getTime();
      if (Number.isFinite(seenAt) && seenAt > bucket.lastSeen) {
        bucket.lastSeen = seenAt;
      }

      buckets.set(provider.id, bucket);
    });
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      id: bucket.id,
      name: summariseProviderName(bucket.provider),
      programmes: bucket.programmes,
      zones: Array.from(bucket.zones),
      company: [...bucket.companies][0] || null,
      href: `/providers?highlight=${bucket.id}`,
      lastSeen: bucket.lastSeen
    }))
    .sort((a, b) => {
      if (b.programmes !== a.programmes) {
        return b.programmes - a.programmes;
      }

      return b.lastSeen - a.lastSeen;
    })
    .slice(0, limit)
    .map(({ lastSeen, ...rest }) => rest);
}

function buildStoreSuggestions(rentals, limit) {
  const buckets = new Map();

  rentals.forEach((rental) => {
    const item = rental.MarketplaceItem;
    if (!item || !item.id) {
      return;
    }

    const bucket = buckets.get(item.id) ?? {
      item,
      rentals: 0,
      totalDailyRate: 0,
      dailyRateSamples: 0,
      purchaseTotals: 0,
      purchaseSamples: 0,
      currency: item.currency || rental.rateCurrency || 'USD',
      lastSeen: 0
    };

    bucket.rentals += 1;

    const dailyRate = safeNumber(rental.dailyRate);
    if (dailyRate != null) {
      bucket.totalDailyRate += dailyRate;
      bucket.dailyRateSamples += 1;
    }

    const purchase = safeNumber(rental.meta?.purchasePrice) ?? safeNumber(item.purchasePrice);
    if (purchase != null) {
      bucket.purchaseTotals += purchase;
      bucket.purchaseSamples += 1;
    }

    const seenAt = new Date(rental.rentalStartAt || rental.createdAt || Date.now()).getTime();
    if (Number.isFinite(seenAt) && seenAt > bucket.lastSeen) {
      bucket.lastSeen = seenAt;
    }

    buckets.set(item.id, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => {
      const item = bucket.item;
      const rentLabel = bucket.dailyRateSamples > 0
        ? `${formatCurrencyLabel(bucket.totalDailyRate / bucket.dailyRateSamples, bucket.currency || item.currency)}/day`
        : item.pricePerDay != null
          ? `${formatCurrencyLabel(item.pricePerDay, item.currency || bucket.currency)}/day`
          : null;
      const buyLabel = bucket.purchaseSamples > 0
        ? formatCurrencyLabel(bucket.purchaseTotals / bucket.purchaseSamples, item.currency || bucket.currency)
        : formatCurrencyLabel(item.purchasePrice, item.currency || bucket.currency);
      const priceLabel = rentLabel && buyLabel ? `${rentLabel} • ${buyLabel}` : rentLabel ?? buyLabel ?? null;

      return {
        id: item.id,
        title: item.title || 'Inventory',
        partner: summariseCompany(item.Company) || 'Partner',
        priceLabel,
        href: item.slug ? `/marketplace/${item.slug}` : `/marketplace?highlight=${item.id}`,
        lastSeen: bucket.lastSeen
      };
    })
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, limit)
    .map(({ lastSeen, ...rest }) => rest);
}

async function fetchTrendingServices(excludeIds, limit) {
  if (limit <= 0) {
    return [];
  }

  const where = { status: 'published' };
  if (Array.isArray(excludeIds) && excludeIds.length > 0) {
    where.id = { [Op.notIn]: excludeIds };
  }

  const services = await Service.findAll({
    where,
    include: [{ model: Company, attributes: ['id', 'contactName', 'name'] }],
    order: [['updatedAt', 'DESC']],
    limit
  });

  return services.map((service) => ({
    id: service.id,
    title: service.title,
    company: summariseCompany(service.Company) || 'Provider',
    priceLabel: formatCurrencyLabel(service.price, service.currency),
    href: service.slug ? `/services/${service.slug}` : `/services?highlight=${service.id}`
  }));
}

async function fetchTrendingProviders(excludeIds, limit) {
  if (limit <= 0) {
    return [];
  }

  const where = { status: 'published', providerId: { [Op.not]: null } };
  const services = await Service.findAll({
    where,
    include: [
      { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Company, attributes: ['id', 'contactName', 'name'] }
    ],
    order: [['updatedAt', 'DESC']],
    limit: limit * 3
  });

  const seen = new Set(excludeIds);
  const suggestions = [];

  services.forEach((service) => {
    const provider = service.provider;
    if (!provider || !provider.id || seen.has(provider.id)) {
      return;
    }

    suggestions.push({
      id: provider.id,
      name: summariseProviderName(provider),
      programmes: 0,
      zones: [],
      company: summariseCompany(service.Company) || null,
      href: `/providers?highlight=${provider.id}`
    });
    seen.add(provider.id);
  });

  return suggestions.slice(0, limit);
}

async function fetchTrendingStores(excludeIds, limit) {
  if (limit <= 0) {
    return [];
  }

  const where = { status: 'approved' };
  if (Array.isArray(excludeIds) && excludeIds.length > 0) {
    where.id = { [Op.notIn]: excludeIds };
  }

  const items = await MarketplaceItem.findAll({
    where,
    include: [{ model: Company, attributes: ['id', 'contactName', 'name'] }],
    order: [['updatedAt', 'DESC']],
    limit
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title || 'Inventory',
    partner: summariseCompany(item.Company) || 'Partner',
    priceLabel: (() => {
      const rent = item.pricePerDay != null ? `${formatCurrencyLabel(item.pricePerDay, item.currency)}/day` : null;
      const buy = formatCurrencyLabel(item.purchasePrice, item.currency);
      return rent && buy ? `${rent} • ${buy}` : rent ?? buy ?? null;
    })(),
    href: item.slug ? `/marketplace/${item.slug}` : `/marketplace?highlight=${item.id}`
  }));
}

export async function buildSidebarSuggestions({ userId, limit = SUGGESTION_LIMIT } = {}) {
  if (!userId) {
    return { services: [], providers: [], stores: [] };
  }

  const resolvedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.trunc(limit), 6) : SUGGESTION_LIMIT;

  const [bookings, rentals] = await Promise.all([
    Booking.findAll({
      where: { customerId: userId },
      include: [
        { model: Company, attributes: ['id', 'contactName', 'name'] },
        {
          model: BookingAssignment,
          include: [{ model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'email'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    }),
    RentalAgreement.findAll({
      where: { renterId: userId },
      include: [
        {
          model: MarketplaceItem,
          include: [{ model: Company, attributes: ['id', 'contactName', 'name'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 60
    })
  ]);

  const serviceIds = bookings
    .map((booking) => (typeof booking.meta?.serviceId === 'string' ? booking.meta.serviceId : null))
    .filter(Boolean);
  const uniqueServiceIds = Array.from(new Set(serviceIds));

  const services = uniqueServiceIds.length
    ? await Service.findAll({
        where: { id: { [Op.in]: uniqueServiceIds } },
        include: [{ model: Company, attributes: ['id', 'contactName', 'name'] }]
      })
    : [];

  const serviceLookup = new Map(services.map((service) => [service.id, service]));

  let serviceSuggestions = buildServiceSuggestions(bookings, serviceLookup, resolvedLimit);
  const serviceExclusions = serviceSuggestions
    .map((suggestion) => suggestion.id)
    .filter((id) => typeof id === 'string' && !id.startsWith('category:'));

  if (serviceSuggestions.length < resolvedLimit) {
    const fallback = await fetchTrendingServices(serviceExclusions, resolvedLimit - serviceSuggestions.length);
    serviceSuggestions = [...serviceSuggestions, ...fallback].slice(0, resolvedLimit);
  }

  let providerSuggestions = buildProviderSuggestions(bookings, resolvedLimit);
  const providerExclusions = providerSuggestions.map((provider) => provider.id);

  if (providerSuggestions.length < resolvedLimit) {
    const fallback = await fetchTrendingProviders(providerExclusions, resolvedLimit - providerSuggestions.length);
    providerSuggestions = [...providerSuggestions, ...fallback].slice(0, resolvedLimit);
  }

  let storeSuggestions = buildStoreSuggestions(rentals, resolvedLimit);
  const storeExclusions = storeSuggestions.map((item) => item.id);

  if (storeSuggestions.length < resolvedLimit) {
    const fallback = await fetchTrendingStores(storeExclusions, resolvedLimit - storeSuggestions.length);
    storeSuggestions = [...storeSuggestions, ...fallback].slice(0, resolvedLimit);
  }

  return {
    services: serviceSuggestions,
    providers: providerSuggestions,
    stores: storeSuggestions
  };
}

function requireCompanyForUser(userId) {
  return Company.findOne({ where: { userId } });
}

async function loadPost(postId, { transaction, lock = false } = {}) {
  return Post.findByPk(postId, {
    include: POST_INCLUDE_GRAPH,
    transaction,
    lock: lock && transaction ? transaction.LOCK.UPDATE : undefined
  });
}

export async function listLiveFeed({
  zoneIds = [],
  includeOutOfZone = false,
  outOfZoneOnly = false,
  limit = DEFAULT_FEED_LIMIT
} = {}) {
  const uniqueZoneIds = Array.from(new Set(zoneIds.filter(Boolean)));
  const resolvedLimit = sanitizeLimit(limit);

  const where = {};

  if (outOfZoneOnly) {
    where.allowOutOfZone = true;
  } else if (uniqueZoneIds.length > 0) {
    if (includeOutOfZone) {
      where[Op.or] = [{ zoneId: { [Op.in]: uniqueZoneIds } }, { allowOutOfZone: true }];
    } else {
      where.zoneId = { [Op.in]: uniqueZoneIds };
    }
  } else if (includeOutOfZone) {
    where.allowOutOfZone = true;
  }

  const posts = await Post.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: resolvedLimit,
    include: POST_INCLUDE_GRAPH
  });

  return posts.map((post) => serialisePost(post));
}

export async function listMarketplaceFeed({ limit = 25 } = {}) {
  const items = await listApprovedMarketplaceItems({ limit });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    pricePerDay: item.pricePerDay,
    purchasePrice: item.purchasePrice,
    availability: item.availability,
    location: item.location,
    insuredOnly: item.insuredOnly,
    compliance: {
      status: item.complianceSnapshot?.status || item.status,
      expiresAt: item.complianceHoldUntil,
      badgeVisible: item.Company?.insuredSellerBadgeVisible ?? false,
      complianceScore: item.Company ? Number(item.Company.complianceScore || 0) : null
    },
    company: item.Company
      ? {
          id: item.Company.id,
          legalStructure: item.Company.legalStructure,
          insuredSellerStatus: item.Company.insuredSellerStatus,
          insuredSellerBadgeVisible: item.Company.insuredSellerBadgeVisible
        }
      : null,
    lastReviewedAt: item.lastReviewedAt,
    createdAt: item.createdAt
  }));
}

export async function createLiveFeedPost({
  userId,
  actorContext = null,
  title,
  description,
  budgetLabel,
  budgetAmount,
  budgetCurrency,
  category,
  categoryOther,
  metadata,
  images,
  location,
  zoneId,
  allowOutOfZone,
  bidDeadline
}) {
  if (!userId) {
    throw createServiceError('Authenticated user required', 401);
  }

  if (!title || title.trim().length < 5) {
    throw createServiceError('Title must be at least 5 characters', 422);
  }

  let resolvedZoneId = null;
  if (zoneId) {
    const zone = await ServiceZone.findByPk(zoneId);
    if (!zone) {
      throw createServiceError('Selected service zone does not exist', 404);
    }
    resolvedZoneId = zone.id;
  }

  const now = new Date();
  const deadline = ensureDate(bidDeadline, 'bidDeadline');
  if (deadline && deadline <= now) {
    throw createServiceError('Bid deadline must be in the future', 422);
  }

  const normalisedMetadata = sanitiseMetadata(metadata);
  const normalisedImages = sanitiseImages(images);

  const job = await sequelize.transaction(async (transaction) => {
    const post = await Post.create(
      {
        userId,
        title: title.trim(),
        description: normaliseString(description, { maxLength: 4000 }),
        budget: normaliseString(budgetLabel, { maxLength: 160 }),
        budgetAmount: parseBudgetAmount(budgetAmount),
        budgetCurrency: parseCurrency(budgetCurrency),
        category: normaliseString(category, { maxLength: 120 }),
        categoryOther: normaliseString(categoryOther, { maxLength: 120 }),
        metadata: normalisedMetadata,
        images: normalisedImages,
        location: normaliseString(location, { maxLength: 240 }),
        zoneId: resolvedZoneId,
        allowOutOfZone: Boolean(allowOutOfZone),
        bidDeadline: deadline
      },
      { transaction }
    );

    const reloaded = await loadPost(post.id, { transaction });
    return serialisePost(reloaded);
  });

  broadcastLiveFeedEvent('post.created', {
    post: job,
    zoneId: job.zoneId ?? job.zone?.id ?? null,
    allowOutOfZone: Boolean(job.allowOutOfZone)
  });

  const owner = job.User ?? job.user ?? null;
  const zoneSnapshot = job.zone
    ? { id: job.zone.id, name: job.zone.name, companyId: job.zone.companyId }
    : null;
  const postSnapshot = {
    id: job.id,
    title: job.title,
    budgetLabel: job.budget ?? null,
    budgetAmount: job.budgetAmount ?? null,
    budgetCurrency: job.budgetCurrency ?? null,
    category: job.category ?? null,
    allowOutOfZone: Boolean(job.allowOutOfZone),
    zoneId: job.zoneId ?? job.zone?.id ?? null,
    imageCount: Array.isArray(job.images) ? job.images.length : 0,
    bidDeadline: job.bidDeadline ?? null
  };
  const actorSnapshot = owner
    ? {
        id: owner.id,
        name: [owner.firstName, owner.lastName].filter(Boolean).join(' ') || null,
        email: owner.email ?? null,
        role: owner.type ?? null
      }
    : null;
  const detailParts = [
    job.category ? `Category: ${job.category}` : null,
    job.location ? `Location: ${job.location}` : null,
    job.budget ? `Budget: ${job.budget}` : null,
    job.budgetAmount != null
      ? `Budget amount: ${job.budgetAmount}${job.budgetCurrency ? ` ${job.budgetCurrency}` : ''}`
      : null
  ].filter(Boolean);

  try {
    await recordLiveFeedAuditEvent({
      eventType: 'live_feed.post.created',
      summary: `Job posted: ${job.title}`,
      details: detailParts.length ? detailParts.join(' • ') : null,
      resourceType: 'post',
      resourceId: job.id,
      postId: job.id,
      postSnapshot,
      zoneId: zoneSnapshot?.id ?? null,
      zoneSnapshot,
      companyId: zoneSnapshot?.companyId ?? null,
      actorId: actorSnapshot?.id ?? userId ?? actorContext?.actorId ?? null,
      actorRole: actorContext?.role ?? actorSnapshot?.role ?? null,
      actorPersona: actorContext?.persona ?? null,
      actorSnapshot,
      metadata: {
        allowOutOfZone: Boolean(job.allowOutOfZone),
        imageCount: Array.isArray(job.images) ? job.images.length : 0,
        metadataKeys: Object.keys(job.metadata ?? {}),
        hasDescription: Boolean(job.description)
      }
    });
  } catch (error) {
    console.error('[liveFeedAudit] Failed to record post.created event', {
      error: error.message,
      postId: job.id
    });
  }

  return job;
}

export async function submitCustomJobBid({
  postId,
  providerId,
  providerRole,
  actorContext = null,
  amount,
  currency,
  message,
  attachments
}) {
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  const bidAmount = amount == null || amount === '' ? null : parseBudgetAmount(amount);
  const bidCurrency = parseCurrency(currency);
  const initialMessage = normaliseString(message, { maxLength: 2000, fallback: null });
  const normalisedAttachments = sanitiseAttachments(attachments);

  let postContext = null;
  const bidResult = await sequelize.transaction(async (transaction) => {
    const post = await loadPost(postId, { transaction, lock: true });
    if (!post) {
      throw createServiceError('Live job post not found', 404);
    }

    postContext = {
      id: post.id,
      title: post.title,
      zoneId: post.zoneId,
      zone: post.zone
        ? { id: post.zone.id, name: post.zone.name, companyId: post.zone.companyId }
        : null,
      allowOutOfZone: Boolean(post.allowOutOfZone),
      ownerId: post.userId,
      category: post.category,
      budgetLabel: post.budget,
      budgetAmount: post.budgetAmount,
      budgetCurrency: post.budgetCurrency
    };

    if (post.status !== 'open') {
      throw createServiceError('Bidding is closed for this job', 409);
    }

    if (post.userId === providerId) {
      throw createServiceError('You cannot bid on your own job', 409);
    }

    const existingBid = await CustomJobBid.findOne({
      where: { postId, providerId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingBid) {
      throw createServiceError('You already have an active bid for this job', 409);
    }

    let companyId = null;
    if (providerRole === 'company') {
      const company = await requireCompanyForUser(providerId);
      companyId = company?.id ?? null;
    }

    const bid = await CustomJobBid.create(
      {
        postId,
        providerId,
        companyId,
        amount: bidAmount,
        currency: bidCurrency,
        status: 'pending',
        message: initialMessage,
        metadata: {}
      },
      { transaction }
    );

    const providerAuthorRole = ['servicemen', 'company'].includes(providerRole) ? 'provider' : 'admin';

    if (initialMessage) {
      await CustomJobBidMessage.create(
        {
          bidId: bid.id,
          authorId: providerId,
          authorRole: providerAuthorRole,
          body: initialMessage,
          attachments: normalisedAttachments
        },
        { transaction }
      );
    }

    const reloadedBid = await CustomJobBid.findByPk(bid.id, {
      include: POST_INCLUDE_GRAPH.find((entry) => entry.as === 'bids')?.include,
      transaction
    });

    return serialiseBid(reloadedBid);
  });

  if (postContext) {
    broadcastLiveFeedEvent('bid.created', {
      postId,
      bid: bidResult,
      zoneId: postContext.zoneId,
      allowOutOfZone: postContext.allowOutOfZone
    });
  }

  if (postContext) {
    const provider = bidResult.provider ?? null;
    const providerSnapshot = provider
      ? {
          id: provider.id,
          name: [provider.firstName, provider.lastName].filter(Boolean).join(' ') || null,
          role: provider.type ?? null
        }
      : null;
    const zoneSnapshot = postContext.zone ?? null;
    const postSnapshot = {
      id: postContext.id,
      title: postContext.title ?? null,
      allowOutOfZone: postContext.allowOutOfZone,
      zoneId: postContext.zoneId ?? null,
      category: postContext.category ?? null,
      budgetLabel: postContext.budgetLabel ?? null,
      budgetAmount: postContext.budgetAmount ?? null,
      budgetCurrency: postContext.budgetCurrency ?? null
    };
    const detailParts = [
      postContext.title ? `Job: ${postContext.title}` : null,
      bidResult.amount != null ? `Amount: ${bidResult.amount}` : null,
      bidResult.currency ? `Currency: ${bidResult.currency}` : null
    ].filter(Boolean);

    try {
      await recordLiveFeedAuditEvent({
        eventType: 'live_feed.bid.created',
        summary: `Bid submitted${postContext.title ? ` for ${postContext.title}` : ''}`.trim(),
        details: detailParts.length ? detailParts.join(' • ') : null,
        resourceType: 'bid',
        resourceId: bidResult.id,
        postId: postContext.id,
        postSnapshot,
        zoneId: zoneSnapshot?.id ?? null,
        zoneSnapshot,
        companyId: bidResult.providerCompany?.id ?? zoneSnapshot?.companyId ?? null,
        actorId: actorContext?.actorId ?? providerSnapshot?.id ?? providerId,
        actorRole: actorContext?.role ?? providerSnapshot?.role ?? providerRole ?? null,
        actorPersona: actorContext?.persona ?? null,
        actorSnapshot: providerSnapshot,
        metadata: {
          amount: bidResult.amount,
          currency: bidResult.currency,
          hasMessage: Boolean(initialMessage),
          attachmentsCount: normalisedAttachments.length,
          allowOutOfZone: postContext.allowOutOfZone,
          providerCompanyId: bidResult.providerCompany?.id ?? null
        }
      });
    } catch (error) {
      console.error('[liveFeedAudit] Failed to record bid.created event', {
        error: error.message,
        bidId: bidResult.id,
        postId
      });
    }
  }

  return bidResult;
}

export async function addCustomJobBidMessage({
  postId,
  bidId,
  authorId,
  authorRole,
  actorContext = null,
  body,
  attachments
}) {
  if (!authorId) {
    throw createServiceError('Authenticated author required', 401);
  }

  const messageBody = normaliseString(body, { maxLength: 2000 });
  if (!messageBody) {
    throw createServiceError('Message body is required', 422);
  }

  const normalisedAttachments = sanitiseAttachments(attachments);

  let postContext = null;
  const messageResult = await sequelize.transaction(async (transaction) => {
    const post = await loadPost(postId, { transaction, lock: true });
    if (!post) {
      throw createServiceError('Live job post not found', 404);
    }

    postContext = {
      id: post.id,
      title: post.title,
      zoneId: post.zoneId,
      zone: post.zone
        ? { id: post.zone.id, name: post.zone.name, companyId: post.zone.companyId }
        : null,
      allowOutOfZone: Boolean(post.allowOutOfZone),
      ownerId: post.userId,
      category: post.category,
      budgetLabel: post.budget,
      budgetAmount: post.budgetAmount,
      budgetCurrency: post.budgetCurrency
    };

    const bid = await CustomJobBid.findOne({
      where: { id: bidId, postId },
      include: [
        { model: User, as: 'provider', attributes: ['id', 'type'] },
        { model: CustomJobBidMessage, as: 'messages' }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!bid) {
      throw createServiceError('Bid not found for this job', 404);
    }

    const isProviderActor = bid.providerId === authorId;
    const isJobOwner = post.userId === authorId;

    if (!isProviderActor && !isJobOwner) {
      throw createServiceError('You are not permitted to respond to this bid', 403);
    }

    const resolvedRole = isJobOwner
      ? 'customer'
      : ['servicemen', 'company'].includes(authorRole)
        ? 'provider'
        : 'admin';

    const created = await CustomJobBidMessage.create(
      {
        bidId,
        authorId,
        authorRole: resolvedRole,
        body: messageBody,
        attachments: normalisedAttachments
      },
      { transaction }
    );

    const message = await CustomJobBidMessage.findByPk(created.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }],
      transaction
    });

    return message?.toJSON() ?? created.toJSON();
  });

  if (postContext) {
    broadcastLiveFeedEvent('bid.message', {
      postId,
      bidId,
      message: messageResult,
      zoneId: postContext.zoneId,
      allowOutOfZone: postContext.allowOutOfZone
    });
  }

  if (postContext) {
    const author = messageResult.author ?? null;
    const actorSnapshot = author
      ? {
          id: author.id,
          name: [author.firstName, author.lastName].filter(Boolean).join(' ') || null,
          role: author.type ?? null
        }
      : null;
    const zoneSnapshot = postContext.zone ?? null;
    const postSnapshot = {
      id: postContext.id,
      title: postContext.title ?? null,
      allowOutOfZone: postContext.allowOutOfZone,
      zoneId: postContext.zoneId ?? null
    };

    try {
      await recordLiveFeedAuditEvent({
        eventType: 'live_feed.bid.message',
        summary: `Bid message on ${postContext.title ?? 'live job'}`,
        details: actorSnapshot?.name ? `Authored by ${actorSnapshot.name}` : null,
        resourceType: 'bid_message',
        resourceId: messageResult.id,
        postId: postContext.id,
        postSnapshot,
        zoneId: zoneSnapshot?.id ?? null,
        zoneSnapshot,
        companyId: zoneSnapshot?.companyId ?? null,
        actorId: actorContext?.actorId ?? actorSnapshot?.id ?? authorId,
        actorRole: actorContext?.role ?? actorSnapshot?.role ?? resolvedRole,
        actorPersona: actorContext?.persona ?? null,
        actorSnapshot,
        metadata: {
          bidId,
          attachmentsCount: normalisedAttachments.length,
          bodyLength: messageBody.length,
          messagePreview: messageBody.slice(0, 140),
          authorRole: resolvedRole,
          allowOutOfZone: postContext.allowOutOfZone
        }
      });
    } catch (error) {
      console.error('[liveFeedAudit] Failed to record bid.message event', {
        error: error.message,
        bidId,
        postId,
        messageId: messageResult.id
      });
    }
  }

  return messageResult;
}
