import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  AdCampaign,
  Booking,
  BookingAssignment,
  CampaignDailyMetric,
  CampaignFraudSignal,
  CampaignInvoice,
  Company,
  ComplianceDocument,
  ConversationParticipant,
  InventoryAlert,
  InventoryItem,
  MarketplaceItem,
  MarketplaceModerationAction,
  RentalAgreement,
  Service,
  ServiceZone,
  ToolSaleProfile,
  ToolSaleCoupon,
  User
} from '../models/index.js';
import { getCachedPlatformSettings } from './platformSettingsService.js';

const ACTIVE_BOOKING_STATUSES = ['scheduled', 'in_progress', 'awaiting_assignment'];
const COMPLETED_BOOKING_STATUSES = ['completed'];
const PLATFORM_COMMISSION_FALLBACK = 0.025;

function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function clamp(value, min = 0, max = 1) {
  if (!Number.isFinite(value)) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function coerceNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function average(values = [], fallback = 0) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) {
    return fallback;
  }
  const total = valid.reduce((sum, value) => sum + value, 0);
  return total / valid.length;
}

function toSlug(input, fallback) {
  if (typeof input === 'string' && input.trim()) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
  return fallback;
}

function sanitiseString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function resolvePlatformCommissionRate() {
  const settings = getCachedPlatformSettings();
  const candidate = Number.parseFloat(settings?.commissions?.baseRate);
  if (Number.isFinite(candidate) && candidate >= 0 && candidate <= 1) {
    return Number(candidate.toFixed(4));
  }
  return PLATFORM_COMMISSION_FALLBACK;
}

export async function resolveCompanyForActor({ companyId, actor }) {
  if (!actor?.id) {
    throw buildHttpError(403, 'forbidden');
  }

  const actorRecord = await User.findByPk(actor.id, { attributes: ['id', 'type'] });
  if (!actorRecord) {
    throw buildHttpError(403, 'forbidden');
  }

  const include = [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'type'] }];
  const order = [['createdAt', 'ASC']];

  if (actorRecord.type === 'admin') {
    const companyInstance = companyId
      ? await Company.findByPk(companyId, { include })
      : await Company.findOne({ include, order });

    if (!companyInstance) {
      throw buildHttpError(404, 'company_not_found');
    }

    return { company: companyInstance.get({ plain: true }), actor: actorRecord };
  }

  if (actorRecord.type !== 'company') {
    throw buildHttpError(403, 'forbidden');
  }

  const where = companyId ? { id: companyId, userId: actorRecord.id } : { userId: actorRecord.id };
  const companyInstance = await Company.findOne({ where, include, order });

  if (companyInstance) {
    return { company: companyInstance.get({ plain: true }), actor: actorRecord };
  }

  if (companyId) {
    const exists = await Company.findByPk(companyId, { attributes: ['id'] });
    if (exists) {
      throw buildHttpError(403, 'forbidden');
    }
  }

  throw buildHttpError(404, 'company_not_found');
}

export async function resolveCompanyId(companyId) {
  if (companyId) {
    const exists = await Company.findByPk(companyId, { attributes: ['id'], raw: true });
    if (exists) {
      return exists.id;
    }
  }

  const firstCompany = await Company.findOne({ attributes: ['id'], order: [['createdAt', 'ASC']], raw: true });
  if (!firstCompany) {
    throw buildHttpError(404, 'company_not_found');
  }
  return firstCompany.id;
}

function formatBookingForPipeline(booking, timezone = 'UTC') {
  const scheduledStart = booking.scheduledStart
    ? DateTime.fromJSDate(booking.scheduledStart).setZone(timezone)
    : null;
  return {
    id: booking.id,
    status: booking.status,
    service: booking.meta?.title || booking.meta?.serviceName || 'Scheduled job',
    scheduledStart: scheduledStart ? scheduledStart.toISO() : null,
    zoneId: booking.zoneId,
    client: booking.meta?.requester || booking.meta?.customerName || 'Client partner'
  };
}

function buildInventorySummary(items = []) {
  const base = items.reduce(
    (acc, item) => {
      const onHand = coerceNumber(item.quantityOnHand, 0);
      const reserved = coerceNumber(item.quantityReserved, 0);
      const safety = coerceNumber(item.safetyStock, 0);

      return {
        skuCount: acc.skuCount + 1,
        onHand: acc.onHand + onHand,
        reserved: acc.reserved + reserved,
        safety: acc.safety + safety
      };
    },
    { skuCount: 0, onHand: 0, reserved: 0, safety: 0 }
  );

  const available = Math.max(base.onHand - base.reserved, 0);
  const utilisation = base.onHand > 0 ? clamp((base.reserved + available) / base.onHand, 0, 1) : 0;

  return {
    ...base,
    available,
    utilisation
  };
}

function buildProviderAlerts({ inventoryAlerts = [], complianceDocs = [], bookings = [] }) {
  const alerts = [];

  for (const alert of inventoryAlerts) {
    const itemName = alert.InventoryItem?.name || 'Inventory asset';
    alerts.push({
      id: `inventory-${alert.id}`,
      severity: alert.severity || 'medium',
      message: `${itemName} has a ${alert.type?.replace(/_/g, ' ') || 'pending alert'}.`,
      actionLabel: 'Review inventory',
      actionHref: `/inventory/items/${alert.InventoryItem?.id ?? ''}`
    });
  }

  const expiringDocs = complianceDocs.filter((doc) => {
    if (!doc.expiryAt) {
      return false;
    }
    const expiry = DateTime.fromJSDate(doc.expiryAt);
    const now = DateTime.now();
    return expiry > now && expiry <= now.plus({ days: 30 });
  });

  if (expiringDocs.length > 0) {
    alerts.push({
      id: 'compliance-expiry',
      severity: 'high',
      message: `${expiringDocs.length} compliance artefact${expiringDocs.length === 1 ? '' : 's'} expiring within 30 days.`
    });
  }

  const disputed = bookings.filter((booking) => booking.status === 'disputed');
  if (disputed.length > 0) {
    alerts.push({
      id: 'disputes-open',
      severity: 'medium',
      message: `${disputed.length} booking dispute${disputed.length === 1 ? '' : 's'} require attention.`
    });
  }

  return alerts.slice(0, 6);
}

function buildCrewRoster(bookings = [], assignments = [], now = DateTime.now()) {
  const roster = new Map();

  for (const booking of bookings) {
    const crewName = booking.meta?.primaryCrew || booking.meta?.owner || 'Operations crew';
    const crew = roster.get(crewName) || { name: crewName, bookings: [], csat: [], upcoming: 0 };
    crew.bookings.push(booking);

    if (booking.scheduledStart && DateTime.fromJSDate(booking.scheduledStart) > now) {
      crew.upcoming += 1;
    }

    if (Number.isFinite(booking.meta?.csat)) {
      crew.csat.push(Number(booking.meta.csat));
    }

    roster.set(crewName, crew);
  }

  for (const assignment of assignments) {
    const crewName = assignment.role || 'Operations crew';
    if (!roster.has(crewName)) {
      roster.set(crewName, { name: crewName, bookings: [], csat: [], upcoming: 0 });
    }
  }

  return Array.from(roster.values()).map((crew, index) => ({
    id: toSlug(crew.name, `crew-${index}`),
    name: crew.name,
    role: 'Field operations',
    availability: crew.bookings.length === 0 ? 1 : clamp(1 - crew.upcoming / crew.bookings.length, 0, 1),
    rating: crew.csat.length > 0 ? average(crew.csat, 0.9) : 0.9
  }));
}

function summariseReviews(reviews = []) {
  const totals = reviews.reduce(
    (acc, review) => {
      const bucket = Math.round(review.rating ?? 0);
      if (bucket >= 1 && bucket <= 5) {
        acc.buckets[bucket] = (acc.buckets[bucket] ?? 0) + 1;
      }
      if (Number.isFinite(review.rating)) {
        acc.sum += review.rating;
        acc.count += 1;
      }
      if (review.verified) {
        acc.verified += 1;
      }
      if (Number.isFinite(review.responseTimeMinutes)) {
        acc.responded += 1;
      }
      if (review.submittedAt) {
        const submitted = DateTime.fromISO(review.submittedAt);
        if (!acc.lastReviewAt || submitted > acc.lastReviewAt) {
          acc.lastReviewAt = submitted;
        }
      }
      return acc;
    },
    { sum: 0, count: 0, verified: 0, responded: 0, lastReviewAt: null, buckets: {} }
  );

  return {
    averageRating: totals.count ? Number((totals.sum / totals.count).toFixed(2)) : null,
    totalReviews: reviews.length,
    verifiedShare: reviews.length ? totals.verified / reviews.length : 0,
    ratingBuckets: [1, 2, 3, 4, 5].map((score) => ({ score, count: totals.buckets[score] ?? 0 })),
    lastReviewAt: totals.lastReviewAt ? totals.lastReviewAt.toISO() : null,
    responseRate: reviews.length ? totals.responded / reviews.length : 0
  };
}

function extractReviews(bookings = []) {
  return bookings
    .map((booking) => {
      const csat = Number.isFinite(booking.meta?.csat) ? clamp(Number(booking.meta.csat), 0, 1) : null;
      const reviewScore = Number.isFinite(booking.meta?.reviewScore)
        ? clamp(Number(booking.meta.reviewScore), 1, 5)
        : null;
      const rating = reviewScore ?? (csat != null ? Number((csat * 5).toFixed(2)) : null);
      const comment = sanitiseString(booking.meta?.feedback || booking.meta?.reviewComment);
      if (!rating && !comment) {
        return null;
      }

      const submittedAt = booking.lastStatusTransitionAt
        ? DateTime.fromJSDate(booking.lastStatusTransitionAt).toISO()
        : null;
      const responseTimeMinutes =
        booking.scheduledStart && booking.lastStatusTransitionAt
          ? Math.max(
              DateTime.fromJSDate(booking.lastStatusTransitionAt)
                .diff(DateTime.fromJSDate(booking.scheduledStart), 'minutes')
                .minutes,
              0
            )
          : null;

      return {
        id: booking.id,
        rating,
        comment,
        submittedAt,
        verified: booking.status === 'completed',
        responseTimeMinutes,
        reviewer: booking.meta?.requester || 'Client partner'
      };
    })
    .filter((review) => review !== null);
}

function determineConfidenceLabel(sampleSize) {
  if (sampleSize >= 50) {
    return 'high';
  }
  if (sampleSize >= 10) {
    return 'medium';
  }
  if (sampleSize > 0) {
    return 'low';
  }
  return 'insufficient';
}

function determineTrustBand(value) {
  if (value >= 85) {
    return 'elite';
  }
  if (value >= 70) {
    return 'strong';
  }
  if (value >= 55) {
    return 'emerging';
  }
  return 'attention';
}

function determineReviewBand(value) {
  if (value >= 4.7) {
    return 'excellent';
  }
  if (value >= 4.3) {
    return 'great';
  }
  if (value >= 3.8) {
    return 'fair';
  }
  return 'developing';
}

function calculateTrustScore({ bookings = [], completedBookings = [], complianceDocs = [], serviceZones = [], sentimentScore }) {
  const bookingCount = bookings.length;
  const completedCount = completedBookings.length;
  const reliabilityRatio = bookingCount === 0 ? 0.92 : clamp(completedCount / bookingCount, 0, 1);

  const slaEligible = bookings.filter((booking) => booking.slaExpiresAt && booking.lastStatusTransitionAt);
  const slaOnTime = slaEligible.filter((booking) => {
    const completedAt = DateTime.fromJSDate(booking.lastStatusTransitionAt);
    const sla = DateTime.fromJSDate(booking.slaExpiresAt);
    return completedAt <= sla;
  }).length;
  const punctualityRatio = slaEligible.length === 0 ? 0.9 : clamp(slaOnTime / Math.max(slaEligible.length, 1), 0, 1);

  const cancellationCount = bookings.filter((booking) => ['cancelled', 'disputed', 'failed'].includes(booking.status)).length;
  const cancellationScore = bookingCount === 0 ? 1 : clamp(1 - cancellationCount / bookingCount, 0, 1);

  const complianceCoverage = complianceDocs.length > 0 ? clamp(complianceDocs.length / 8, 0, 1) : 0;
  const complianceScore = complianceDocs.length > 0 ? 0.6 + 0.4 * complianceCoverage : 0.45;
  const coverageScore = serviceZones.length > 0 ? clamp(serviceZones.length / 12, 0, 1) : 0.5;
  const sentiment = Number.isFinite(sentimentScore) ? clamp(sentimentScore, 0, 1) : 0.86;

  const trustConfidence = determineConfidenceLabel(bookingCount);
  const confidenceMultiplier =
    trustConfidence === 'high' ? 1 : trustConfidence === 'medium' ? 0.97 : trustConfidence === 'low' ? 0.92 : 0.88;

  const composite =
    (0.3 * reliabilityRatio +
      0.22 * punctualityRatio +
      0.18 * complianceScore +
      0.15 * sentiment +
      0.1 * cancellationScore +
      0.05 * coverageScore) *
    100 *
    confidenceMultiplier;

  const value = Math.round(clamp(composite, 0, 100));

  return {
    value,
    band: determineTrustBand(value),
    confidence: trustConfidence,
    sampleSize: bookingCount,
    caption: `${completedCount} of ${Math.max(bookingCount, 1)} jobs completed with ${Math.round(punctualityRatio * 100)}% on-time sign-off`,
    breakdown: {
      reliability: Number((reliabilityRatio * 100).toFixed(1)),
      punctuality: Number((punctualityRatio * 100).toFixed(1)),
      compliance: Number((complianceScore * 100).toFixed(1)),
      sentiment: Number((sentiment * 100).toFixed(1)),
      cancellations: Number((cancellationScore * 100).toFixed(1)),
      coverage: Number((coverageScore * 100).toFixed(1))
    }
  };
}

function buildDeals(services = [], now = DateTime.now()) {
  const platformCommissionRate = resolvePlatformCommissionRate();
  return services
    .filter((service) => Number.isFinite(coerceNumber(service.price ?? service.pricePerDay, NaN)))
    .slice(0, 3)
    .map((service, index) => ({
      id: service.id || `deal-${index}`,
      title: service.title || service.name || 'Service bundle',
      description: `Escrow-backed ${
        (service.category || 'service').toLowerCase()
      } programme covering priority zones with concierge logistics.`,
      savings: Number((coerceNumber(service.price ?? service.pricePerDay) * platformCommissionRate).toFixed(2)),
      currency: service.currency || 'GBP',
      validUntil: now.plus({ days: (index + 1) * 7 }).toISODate(),
      tags: Array.from(new Set([service.category, service.type].filter(Boolean))).slice(0, 3)
    }));
}

function identifySupportChannels(company) {
  return {
    email: sanitiseString(company.contactEmail),
    phone: sanitiseString(company.contactPhone),
    concierge: company.contactName
      ? `Account managed by ${company.contactName}`
      : 'Fixnado concierge support'
  };
}

export async function buildProviderDashboard({ companyId: inputCompanyId, actor } = {}) {
  const { company } = await resolveCompanyForActor({ companyId: inputCompanyId, actor });
  const companyId = company.id;
  const now = DateTime.now();

  const [
    bookings,
    inventoryItems,
    inventoryAlerts,
    complianceDocs,
    serviceZones,
    marketplaceItems,
    rentals,
    toolSaleProfiles
  ] =
    await Promise.all([
      Booking.findAll({ where: { companyId }, order: [['scheduledStart', 'ASC']] }),
      InventoryItem.findAll({ where: { companyId }, raw: true }),
      InventoryAlert.findAll({
        include: [
          {
            model: InventoryItem,
            attributes: ['id', 'name', 'companyId'],
            required: true,
            where: { companyId }
          }
        ],
        order: [['triggeredAt', 'DESC']],
        limit: 10
      }),
      ComplianceDocument.findAll({ where: { companyId } }),
      ServiceZone.findAll({ where: { companyId }, attributes: ['id', 'name', 'demandLevel'], raw: true }),
      MarketplaceItem.findAll({ where: { companyId }, limit: 10, order: [['updatedAt', 'DESC']] }),
      RentalAgreement.findAll({ where: { companyId } }),
      ToolSaleProfile.findAll({
        where: { companyId },
        include: [
          { model: ToolSaleCoupon, as: 'coupons' },
          { model: InventoryItem, as: 'inventoryItem' },
          { model: MarketplaceItem, as: 'marketplaceItem' }
        ]
      })
    ]);

  const bookingIds = bookings.map((booking) => booking.id);
  const assignments = bookingIds.length
    ? await BookingAssignment.findAll({ where: { bookingId: { [Op.in]: bookingIds } } })
    : [];

  const activeBookings = bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status));
  const completedBookings = bookings.filter((booking) => COMPLETED_BOOKING_STATUSES.includes(booking.status));
  const upcomingBookings = bookings
    .filter((booking) => booking.scheduledStart && DateTime.fromJSDate(booking.scheduledStart) > now)
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    .slice(0, 8)
    .map((booking) => formatBookingForPipeline(booking, 'Europe/London'));

  const inventorySummary = buildInventorySummary(inventoryItems);
  const alerts = buildProviderAlerts({ inventoryAlerts, complianceDocs, bookings });
  const crews = buildCrewRoster(bookings, assignments, now);

  const monthStart = now.startOf('month');
  const monthBookings = bookings.filter((booking) =>
    booking.scheduledStart ? DateTime.fromJSDate(booking.scheduledStart) >= monthStart : false
  );

  const monthRevenue = monthBookings.reduce((sum, booking) => sum + coerceNumber(booking.totalAmount), 0);
  const outstandingCommission = bookings
    .filter((booking) => booking.status !== 'completed')
    .reduce((sum, booking) => sum + coerceNumber(booking.commissionAmount), 0);

  const reviews = extractReviews(completedBookings);
  const reviewSummary = summariseReviews(reviews);
  const reviewAverage = reviewSummary.averageRating ?? 4.6;
  const reviewValue = Number(reviewAverage.toFixed(2));
  const reviewBand = determineReviewBand(reviewValue);
  const reviewConfidence = determineConfidenceLabel(reviewSummary.totalReviews);

  const trustScore = calculateTrustScore({
    bookings,
    completedBookings,
    complianceDocs,
    serviceZones,
    sentimentScore: reviewAverage / 5
  });

  const data = {
    provider: {
      id: companyId,
      tradingName: company.contactName || company.User?.firstName || 'Fixnado Provider',
      serviceRegions: company.serviceRegions ?? '',
      verified: Boolean(company.verified),
      complianceScore: company.complianceScore ?? null,
      support: identifySupportChannels(company)
    },
    metrics: {
      activeBookings: activeBookings.length,
      completedBookings: completedBookings.length,
      openAlerts: alerts.length,
      managedListings: marketplaceItems.length,
      inventorySkus: inventorySummary.skuCount,
      monthToDateRevenue: monthRevenue,
      outstandingCommission
    },
    pipeline: {
      upcomingBookings,
      activeZones: serviceZones.slice(0, 6).map((zone) => ({
        id: zone.id,
        name: zone.name,
        demand: zone.demandLevel ?? null
      }))
    },
    inventory: {
      summary: inventorySummary,
      alerts: inventoryAlerts.slice(0, 5).map((alert) => ({
        id: alert.id,
        itemId: alert.itemId,
        type: alert.type,
        status: alert.status,
        severity: alert.severity,
        triggeredAt: alert.triggeredAt ? DateTime.fromJSDate(alert.triggeredAt).toISO() : null
      }))
    },
    marketplace: {
      listings: marketplaceItems.map((listing) => ({
        id: listing.id,
        title: listing.title,
        status: listing.status,
        availability: listing.availability,
        pricePerDay: coerceNumber(listing.pricePerDay, null),
        insuredOnly: Boolean(listing.insuredOnly)
      })),
      deals: buildDeals(marketplaceItems, now)
    },
    toolSales: buildToolSalesOverview(toolSaleProfiles),
    crews,
    rentals: {
      active: rentals.filter((rental) => ['in_use', 'pickup_scheduled'].includes(rental.status)).length,
      programmes: rentals.slice(0, 5).map((agreement) => ({
        id: agreement.id,
        rentalNumber: agreement.rentalNumber,
        status: agreement.status,
        depositStatus: agreement.depositStatus,
        returnDueAt: agreement.returnDueAt ? DateTime.fromJSDate(agreement.returnDueAt).toISODate() : null
      }))
    },
    reviews: {
      items: reviews.slice(0, 5),
      summary: {
        ...reviewSummary,
        band: reviewBand,
        confidence: reviewConfidence
      }
    },
    trust: trustScore,
    alerts
  };

  const meta = {
    companyId,
    generatedAt: now.toISO(),
    hasLiveData: bookings.length > 0 || marketplaceItems.length > 0
  };

  return { data, meta };
}

async function resolveCompanyBySlugOrId(slug) {
  const include = [{ model: User, attributes: ['firstName', 'lastName', 'email'] }];

  if (!slug || slug === 'featured') {
    return Company.findOne({
      include,
      order: [
        ['verified', 'DESC'],
        ['complianceScore', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });
  }

  if (/^[0-9a-fA-F-]{36}$/.test(slug)) {
    return Company.findByPk(slug, { include });
  }

  const candidate = slug.replace(/-/g, ' ').trim();
  const byName = await Company.findOne({
    where: { contactName: { [Op.iLike]: `%${candidate}%` } },
    include
  });
  if (byName) {
    return byName;
  }

  return Company.findOne({ include, order: [['createdAt', 'ASC']] });
}

function buildTestimonials(bookings = [], slug) {
  return bookings
    .filter((booking) => sanitiseString(booking.meta?.feedback))
    .slice(0, 3)
    .map((booking, index) => ({
      id: `testimonial-${booking.id}`,
      quote: sanitiseString(booking.meta.feedback),
      author: booking.meta?.requester || 'Enterprise partner',
      rating: Number((clamp(booking.meta?.csat ?? 0.92, 0, 1) * 5).toFixed(1)),
      submittedAt: booking.lastStatusTransitionAt
        ? DateTime.fromJSDate(booking.lastStatusTransitionAt).toISODate()
        : null,
      avatar: `/media/${slug}/testimonial-${index + 1}.jpg`
    }));
}

function buildPreviousJobs(bookings = [], slug) {
  return bookings.slice(0, 6).map((booking, index) => ({
    id: `job-${booking.id}`,
    title: booking.meta?.title || 'Completed programme',
    description: booking.meta?.description || booking.meta?.feedback || 'Escrow-backed delivery milestone.',
    completedAt: booking.lastStatusTransitionAt
      ? DateTime.fromJSDate(booking.lastStatusTransitionAt).toISODate()
      : null,
    image: `/media/${slug}/jobs/${index + 1}.jpg`
  }));
}

function buildCertifications(complianceDocs = []) {
  return complianceDocs
    .filter((doc) => doc.status === 'approved')
    .map((doc) => ({
      id: doc.id,
      name: doc.type,
      issuer: doc.metadata?.issuer || 'Accredited body',
      expiresOn: doc.expiryAt ? DateTime.fromJSDate(doc.expiryAt).toISODate() : null
    }));
}

function buildServiceCatalogue(services = [], serviceZones = []) {
  const zoneNames = serviceZones.reduce((acc, zone) => {
    acc.set(zone.id, zone.name);
    return acc;
  }, new Map());

  return services.slice(0, 12).map((service) => ({
    id: service.id,
    name: service.title || service.name,
    category: service.category || 'General service',
    type: service.type || 'programme',
    price: coerceNumber(service.price ?? service.pricePerDay, null),
    currency: service.currency || 'GBP',
    description: service.description || 'Escrow-backed delivery with telemetry and compliance reporting.',
    coverage: Array.isArray(service.coverage)
      ? service.coverage
      : serviceZones.length
        ? serviceZones.slice(0, 3).map((zone) => zone.name)
        : [],
    primaryZone: zoneNames.get(service.zoneId) || null,
    tags: Array.from(new Set([service.category, service.type].filter(Boolean)))
  }));
}

function buildMaterialsAndTools(inventoryItems = [], slug) {
  const materials = [];
  const tools = [];

  inventoryItems.forEach((item, index) => {
    const base = {
      id: item.id,
      name: item.name,
      category: item.category,
      sku: item.sku,
      quantityOnHand: coerceNumber(item.quantityOnHand, null),
      unitType: item.unitType,
      image: `/media/${slug}/inventory-${index + 1}.jpg`
    };

    if ((item.category || '').toLowerCase().includes('material') || item.metadata?.usage === 'consumable') {
      materials.push(base);
    } else {
      tools.push({
        ...base,
        rentalRate: coerceNumber(item.rentalRate, null),
        rentalRateCurrency: item.rentalRateCurrency || 'GBP',
        condition: item.conditionRating ?? null
      });
    }
  });

  return {
    materials: materials.slice(0, 6),
    tools: tools.slice(0, 6)
  };
}

function formatToolSaleCoupon(coupon) {
  if (!coupon) {
    return null;
  }
  const entry = typeof coupon.toJSON === 'function' ? coupon.toJSON() : coupon;
  return {
    id: entry.id,
    name: entry.name,
    code: entry.code,
    status: entry.status,
    discountType: entry.discountType,
    discountValue: entry.discountValue != null ? Number(entry.discountValue) : null,
    currency: entry.currency,
    autoApply: Boolean(entry.autoApply),
    startsAt: entry.startsAt ? DateTime.fromJSDate(entry.startsAt).toISODate() : null,
    expiresAt: entry.expiresAt ? DateTime.fromJSDate(entry.expiresAt).toISODate() : null
  };
}

function formatToolSaleProfileForDashboard(profile) {
  const json = typeof profile.toJSON === 'function' ? profile.toJSON() : profile;
  const inventory = json.inventoryItem || {};
  const listing = json.marketplaceItem || {};
  const coupons = Array.isArray(json.coupons) ? json.coupons.map(formatToolSaleCoupon).filter(Boolean) : [];
  const quantityOnHand = Number.parseInt(inventory.quantityOnHand ?? 0, 10) || 0;
  const quantityReserved = Number.parseInt(inventory.quantityReserved ?? 0, 10) || 0;
  const quantityAvailable = Math.max(quantityOnHand - quantityReserved, 0);

  return {
    id: json.id,
    name: listing.title || inventory.name || json.tagline || 'Tool listing',
    tagline: json.tagline || '',
    description: json.longDescription || json.shortDescription || listing.description || '',
    heroImageUrl: json.heroImageUrl || null,
    showcaseVideoUrl: json.showcaseVideoUrl || null,
    galleryImages: Array.isArray(json.galleryImages) ? json.galleryImages.slice(0, 6) : [],
    tags: Array.isArray(json.tags) ? json.tags : [],
    keywordTags: Array.isArray(json.keywordTags) ? json.keywordTags : [],
    listing: json.marketplaceItemId
      ? {
          id: json.marketplaceItemId,
          status: listing.status || 'draft',
          availability: listing.availability || 'buy',
          pricePerDay: listing.pricePerDay != null ? Number(listing.pricePerDay) : null,
          purchasePrice: listing.purchasePrice != null ? Number(listing.purchasePrice) : null,
          location: listing.location || 'UK-wide',
          insuredOnly: Boolean(listing.insuredOnly)
        }
      : null,
    inventory: json.inventoryItemId
      ? {
          id: json.inventoryItemId,
          quantityOnHand,
          quantityReserved,
          safetyStock: Number.parseInt(inventory.safetyStock ?? 0, 10) || 0,
          conditionRating: inventory.conditionRating || 'good'
        }
      : null,
    coupons,
    metrics: {
      quantityAvailable,
      activeCoupons: coupons.filter((coupon) => coupon?.status === 'active').length
    }
  };
}

function buildToolSalesOverview(toolSaleProfiles = []) {
  const listings = toolSaleProfiles.map(formatToolSaleProfileForDashboard);
  const summary = {
    totalListings: listings.length,
    draft: listings.filter((item) => item.listing?.status === 'draft').length,
    published: listings.filter((item) => item.listing?.status === 'approved').length,
    suspended: listings.filter((item) => item.listing?.status === 'suspended').length,
    totalQuantity: listings.reduce((sum, item) => sum + (item.inventory?.quantityOnHand ?? 0), 0),
    activeCoupons: listings.reduce(
      (sum, item) => sum + item.coupons.filter((coupon) => coupon?.status === 'active').length,
      0
    )
  };

  return { summary, listings };
}

function buildServiceZonesOverview(serviceZones = []) {
  return serviceZones.slice(0, 6).map((zone, index) => ({
    id: zone.id || `zone-${index}`,
    name: zone.name,
    demandLevel: zone.demandLevel || zone.metadata?.demandLevel || 'balanced',
    spotlight: zone.metadata?.purpose || 'Live telemetry feed from imported polygon zones.'
  }));
}

function buildTimeline(actions = []) {
  return actions.slice(0, 6).map((action) => ({
    id: action.id,
    listingId: action.entityId,
    listingTitle: action.metadata?.title || action.action,
    status: action.metadata?.status || action.action,
    occurredAt: action.createdAt ? DateTime.fromJSDate(action.createdAt).toISO() : null
  }));
}

function buildHero(company, slug) {
  return {
    name: company.contactName || company.User?.firstName || 'Featured provider',
    tagline: company.marketplaceIntent || 'Trusted resilience partner',
    regions: company.serviceRegions?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
    verified: Boolean(company.verified),
    media: {
      heroImage: `/media/${slug}/hero.jpg`,
      bannerImage: `/media/${slug}/banner.jpg`,
      brandImage: `/media/${slug}/brand.png`,
      profileImage: `/media/${slug}/profile.jpg`
    }
  };
}

export async function buildBusinessFront({ slug = 'featured', viewerType } = {}) {
  const companyInstance = await resolveCompanyBySlugOrId(slug);
  if (!companyInstance) {
    throw buildHttpError(404, 'company_not_found');
  }

  const company = companyInstance.get({ plain: true });
  const companyId = company.id;
  const slugified = toSlug(company.contactName, `company-${companyId.slice(0, 8)}`);
  const now = DateTime.now();

  const [
    bookings,
    services,
    complianceDocs,
    serviceZones,
    inventoryItems,
    moderationActions,
    rentals,
    conversationParticipants,
    campaignMetrics,
    campaignInvoices,
    fraudSignals
  ] = await Promise.all([
    Booking.findAll({ where: { companyId }, order: [['lastStatusTransitionAt', 'DESC']] }),
    Service.findAll({ where: { companyId } }),
    ComplianceDocument.findAll({ where: { companyId } }),
    ServiceZone.findAll({ where: { companyId }, attributes: ['id', 'name', 'demandLevel', 'metadata'], raw: true }),
    InventoryItem.findAll({ where: { companyId }, raw: true, order: [['updatedAt', 'DESC']], limit: 24 }),
    MarketplaceModerationAction.findAll({
      where: { entity_type: 'marketplace_item' },
      order: [['createdAt', 'DESC']],
      limit: 10
    }),
    RentalAgreement.findAll({ where: { companyId } }),
    ConversationParticipant.findAll({ where: { participantType: 'enterprise', participantReferenceId: companyId } }),
    CampaignDailyMetric.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['name', 'currency', 'companyId'],
          required: true,
          where: { companyId }
        }
      ],
      order: [['metricDate', 'DESC']],
      limit: 30
    }),
    CampaignInvoice.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['name', 'companyId'],
          required: true,
          where: { companyId }
        }
      ],
      where: { status: { [Op.in]: ['issued', 'overdue'] } },
      order: [['dueDate', 'ASC']]
    }),
    CampaignFraudSignal.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['name', 'companyId'],
          required: true,
          where: { companyId }
        }
      ],
      order: [['detectedAt', 'DESC']],
      limit: 5
    })
  ]);

  const completedBookings = bookings.filter((booking) => COMPLETED_BOOKING_STATUSES.includes(booking.status));
  const reviews = extractReviews(completedBookings);
  const reviewSummary = summariseReviews(reviews);
  const reviewAverage = reviewSummary.averageRating ?? 4.6;
  const reviewBand = determineReviewBand(reviewAverage);
  const reviewConfidence = determineConfidenceLabel(reviewSummary.totalReviews);

  const trustScore = calculateTrustScore({
    bookings,
    completedBookings,
    complianceDocs,
    serviceZones,
    sentimentScore: reviewAverage / 5
  });

  const stats = [
    {
      id: 'completed-bookings',
      label: 'Completed jobs',
      value: completedBookings.length,
      format: 'number',
      caption: 'Delivered with escrow-backed assurance'
    },
    {
      id: 'sla-performance',
      label: 'SLA compliance',
      value: Number((trustScore.breakdown.punctuality / 100).toFixed(2)),
      format: 'ratio',
      caption: 'Measured across live contracts'
    },
    {
      id: 'compliance-score',
      label: 'Compliance score',
      value: Number(coerceNumber(company.complianceScore, 88).toFixed(1)),
      format: 'score',
      caption: 'Third-party verified credentials'
    }
  ];

  const testimonials = buildTestimonials(completedBookings, slugified);
  const previousJobs = buildPreviousJobs(completedBookings, slugified);
  const { materials, tools } = buildMaterialsAndTools(inventoryItems, slugified);
  const hero = buildHero(company, slugified);

  const spend = campaignMetrics.reduce((sum, metric) => sum + coerceNumber(metric.spend), 0);
  const revenue = campaignMetrics.reduce((sum, metric) => sum + coerceNumber(metric.revenue), 0);
  const target = campaignMetrics.reduce((sum, metric) => sum + coerceNumber(metric.spendTarget ?? metric.spend), 0);
  const savingsIdentified = Math.max(target - spend, 0);

  const data = {
    slug: slugified,
    hero,
    stats,
    testimonials,
    packages: buildDeals(services, now),
    certifications: buildCertifications(complianceDocs),
    gallery: previousJobs.map((job) => ({ id: job.id, title: job.title, image: job.image })),
    previousJobs,
    reviews: {
      summary: {
        ...reviewSummary,
        band: reviewBand,
        confidence: reviewConfidence
      },
      items: reviews.slice(0, 6)
    },
    deals: buildDeals(services, now),
    serviceCatalogue: buildServiceCatalogue(services, serviceZones),
    materials,
    tools,
    serviceZones: buildServiceZonesOverview(serviceZones),
    support: identifySupportChannels(company),
    trust: trustScore,
    programmes: rentals.slice(0, 6).map((agreement) => ({
      id: agreement.id,
      name: agreement.rentalNumber || 'Programme',
      status: agreement.status,
      phase: agreement.depositStatus === 'held' ? 'Execution' : 'Planning',
      health: agreement.status === 'inspection_pending' ? 'at-risk' : 'on-track',
      lastUpdated: agreement.updatedAt ? DateTime.fromJSDate(agreement.updatedAt).toISO() : null
    })),
    spend: {
      monthToDate: spend,
      budgetPacing: target > 0 ? spend / target : 0,
      savingsIdentified,
      invoicesAwaitingApproval: campaignInvoices.map((invoice) => ({
        id: invoice.id,
        vendor: invoice.AdCampaign?.name || 'Campaign vendor',
        amount: coerceNumber(invoice.amountDue - invoice.amountPaid, invoice.amountDue),
        dueDate: invoice.dueDate,
        status: invoice.status
      }))
    },
    escalations: fraudSignals.map((signal) => ({
      id: signal.id,
      title: `${signal.signalType?.replace(/_/g, ' ') || 'Campaign alert'} • ${signal.AdCampaign?.name ?? 'Campaign'}`,
      owner: signal.metadata?.owner || 'Marketing operations',
      openedAt: signal.detectedAt,
      severity: signal.severity || 'medium'
    })),
    enterpriseMeta: {
      campaignDays: campaignMetrics.length,
      communicationsParticipants: conversationParticipants.length,
      revenue
    },
    timeline: buildTimeline(moderationActions),
    viewerInsights: { viewerType: viewerType ?? null }
  };

  const meta = {
    companyId,
    generatedAt: now.toISO(),
    slug: slugified,
    viewerType: viewerType ?? null,
    hasLiveData:
      bookings.length > 0 || services.length > 0 || campaignMetrics.length > 0 || rentals.length > 0 || reviews.length > 0
  };

  return { data, meta };
}
