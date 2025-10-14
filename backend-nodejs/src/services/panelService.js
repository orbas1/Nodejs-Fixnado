import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  Booking,
  Company,
  InventoryAlert,
  InventoryItem,
  MarketplaceItem,
  MarketplaceModerationAction,
  RentalAgreement,
  Service,
  ServiceZone,
  User
} from '../models/index.js';
import { getCachedPlatformSettings } from './platformSettingsService.js';

function resolvePlatformCommissionRate() {
  const settings = getCachedPlatformSettings();
  const candidate = Number.parseFloat(settings?.commissions?.baseRate);
  if (Number.isFinite(candidate) && candidate >= 0 && candidate <= 1) {
    return Number.parseFloat(candidate.toFixed(4));
  }
  return 0.025;
}

function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function resolveCompany(companyId) {
  if (!companyId) {
    throw buildHttpError(400, 'company_id_required');
  }

  const company = await Company.findByPk(companyId, {
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'type'] }]
  });

  if (!company) {
    throw buildHttpError(404, 'company_not_found');
  }

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
      if (review.submittedAt) {
        const submitted = DateTime.fromISO(review.submittedAt);
        if (!acc.lastReviewAt || submitted > acc.lastReviewAt) {
          acc.lastReviewAt = submitted;
        }
      }
      if (Number.isFinite(review.responseTimeMinutes)) {
        acc.responded += 1;
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

export async function resolveCompanyId(companyId) {
  if (companyId) {
    return companyId;
  }

  const fallback = await Company.findOne({ attributes: ['id'], order: [['createdAt', 'ASC']] });
  if (!fallback) {
    throw buildHttpError(404, 'company_not_found');
  }

  return fallback.id;
}

async function resolveActor(actor) {
  if (!actor?.id) {
    throw buildHttpError(401, 'unauthorised');
  }

  const record = await User.findByPk(actor.id, { attributes: ['id', 'type'] });
  if (!record) {
    throw buildHttpError(401, 'unauthorised');
  }

  return record;
}

function ensureActorCanManageCompany(company, actor) {
  if (actor.type === 'admin') {
    return;
  }
  return 'attention';
}

function inventoryAvailability(item) {
  const onHand = Number.parseInt(item.quantityOnHand ?? 0, 10);
  const reserved = Number.parseInt(item.quantityReserved ?? 0, 10);
  if (!Number.isFinite(onHand) || !Number.isFinite(reserved)) {
    return 0;
  }

  throw buildHttpError(403, 'forbidden');
}

function formatBookingForPipeline(booking, timezone) {
  const when = booking.scheduledStart ? DateTime.fromJSDate(booking.scheduledStart).setZone(timezone) : null;
  return {
    id: booking.id,
    status: booking.status,
    service: booking.meta?.title ?? 'Scheduled job',
    scheduledStart: when?.toISO?.({ suppressMilliseconds: true }) ?? null,
    zoneId: booking.zoneId
  };
}

function formatInventorySummary(items = []) {
  const summary = items.reduce(
    (acc, item) => {
      const onHand = Number.parseInt(item.quantityOnHand ?? 0, 10);
      const reserved = Number.parseInt(item.quantityReserved ?? 0, 10);
      const safety = Number.parseInt(item.safetyStock ?? 0, 10);

      return {
        skuCount: acc.skuCount + 1,
        onHand: acc.onHand + (Number.isFinite(onHand) ? onHand : 0),
        reserved: acc.reserved + (Number.isFinite(reserved) ? reserved : 0),
        safety: acc.safety + (Number.isFinite(safety) ? safety : 0)
      };
    },
    { skuCount: 0, onHand: 0, reserved: 0, safety: 0 }
  );

  return {
    ...summary,
    available: Math.max(summary.onHand - summary.reserved, 0)
  };
}

export async function buildProviderDashboard({ companyId, actor } = {}) {
  const company = await resolveCompany(companyId);
  const actorRecord = await resolveActor(actor);
  ensureActorCanManageCompany(company, actorRecord);

  const now = DateTime.now().setZone('UTC');
  const windowStart = now.minus({ days: 30 });

  if (companyId) {
    const exists = await Company.findByPk(companyId, { attributes: ['id'], raw: true });
    if (exists) {
      const error = new Error('forbidden');
      error.statusCode = 403;
      throw error;
    }
  }

  const error = new Error('company_not_found');
  error.statusCode = 404;
  throw error;
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
    const error = new Error('company_not_found');
    error.statusCode = 404;
    throw error;
  }
  return firstCompany.id;
}

export async function buildProviderDashboard({ companyId: inputCompanyId, actor } = {}) {
  const company = await resolveCompanyForActor({ companyId: inputCompanyId, actor });
  const companyId = company.id;
  const now = DateTime.now();
  const startOfMonth = now.startOf('month');

  const bookings = await Booking.findAll({
    where: { companyId },
    order: [['scheduledStart', 'ASC']]
  });
  const bookingIds = bookings.map((booking) => booking.id);

  const [assignments, complianceDocs, inventoryAlerts, zones] = await Promise.all([
    BookingAssignment.findAll({ where: { bookingId: { [Op.in]: bookingIds } } }),
    ComplianceDocument.findAll({ where: { companyId } }),
    InventoryAlert.findAll({
      where: {
        status: { [Op.not]: 'resolved' }
      },
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'companyId'],
          where: { companyId: company.id },
          required: true
        }
      ]
    }),
    InventoryItem.findAll({ where: { companyId: company.id } }),
    ServiceZone.findAll({ where: { companyId: company.id }, limit: 5 }),
    MarketplaceItem.findAll({ where: { companyId: company.id }, limit: 5 })
  ]);

  const activeBookings = bookings.filter((booking) =>
    ['pending', 'awaiting_assignment', 'scheduled', 'in_progress'].includes(booking.status)
  );
  const completedBookings = bookings.filter((booking) => booking.status === 'completed');

  const upcomingBookings = bookings
    .filter((booking) => booking.scheduledStart && new Date(booking.scheduledStart) > new Date())
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    .slice(0, 5)
    .map((booking) => formatBookingForPipeline(booking, 'Europe/London'));

  const alertsOpen = alerts.filter((alert) => alert.status === 'active').length;
  const inventorySummary = formatInventorySummary(inventory);

  const data = {
    provider: {
      tradingName: company.contactName || company.User?.firstName || 'Fixnado Provider',
      serviceRegions: company.serviceRegions ?? '',
      verified: Boolean(company.verified),
      complianceScore: company.complianceScore ?? null
    },
    metrics: {
      activeBookings: activeBookings.length,
      completedBookings: completedBookings.length,
      openAlerts: alertsOpen,
      managedListings: listings.length,
      inventorySkus: inventorySummary.skuCount
    },
    pipeline: {
      upcomingBookings,
      activeZones: zones.map((zone) => ({ id: zone.id, name: zone.name, demand: zone.demandLevel ?? null }))
    },
    inventory: {
      summary: inventorySummary,
      alerts: alerts.slice(0, 5).map((alert) => ({
        id: alert.id,
        itemId: alert.itemId,
        type: alert.type,
        status: alert.status,
        severity: alert.severity,
        triggeredAt: alert.triggeredAt?.toISOString?.() ?? null
      }))
    },
    marketplace: {
      listings: listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        status: listing.status,
        availability: listing.availability,
        pricePerDay: listing.pricePerDay
      }))
    }
  };

  const [bookings, serviceZones, services, campaignMetrics, campaignInvoices, fraudSignals, participants, rentals] =
    await Promise.all([
      Booking.findAll({ where: { companyId } }),
      ServiceZone.findAll({ where: { companyId }, attributes: ['name'], raw: true }),
      Service.findAll({ where: { companyId } }),
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
      }),
      ConversationParticipant.findAll({
        where: { participantType: 'enterprise', participantReferenceId: companyId }
      }),
      RentalAgreement.findAll({ where: { companyId } })
    ]);

  const completedBookings = bookings.filter((booking) => SLA_EVALUATION_STATUSES.includes(booking.status));
  const slaHits = completedBookings.filter((booking) => {
    if (!booking.lastStatusTransitionAt || !booking.slaExpiresAt) {
      return false;
    }
  };

  return { data, meta };
}

function buildHero(company) {
  return {
    name: company.contactName || company.User?.firstName || 'Featured Provider',
    tagline: company.marketplaceIntent || 'Trusted resilience partner',
    regions: company.serviceRegions?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
    verified: Boolean(company.verified)
  };
}

function buildPackages(services = []) {
  if (!services.length) {
    return [
      {
        title: 'Rapid response package',
        description: 'Emergency response crews with telemetry-backed tooling.',
        startingFrom: 0,
        category: 'General'
      }
    ];
  }

  return services.slice(0, 4).map((service) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    category: service.category,
    startingFrom: Number.parseFloat(service.price ?? service.pricePerDay ?? 0)
  }));
}

function buildStats(bookings, rentals, company) {
  const totalBookings = bookings.length;
  const activeRentals = rentals.filter((rental) => ['in_use', 'pickup_scheduled'].includes(rental.status)).length;
  const compliance = Math.round(company.complianceScore ?? 0);

  return [
    { label: 'Jobs completed last 30 days', value: totalBookings, helper: 'Completed work orders' },
    { label: 'Assets currently deployed', value: activeRentals, helper: 'Rental agreements in progress' },
    { label: 'Compliance score', value: compliance, helper: 'Verified evidence across programmes' }
  ];
}

function buildTimeline(actions = []) {
  return actions.slice(0, 6).map((action) => ({
    id: action.id,
    listingId: action.entityId,
    listingTitle: action.metadata?.title ?? action.action,
    status: action.metadata?.status ?? action.action,
    occurredAt: action.createdAt?.toISOString?.() ?? null
  }));
}

export async function buildBusinessFront({ slug = 'featured', viewerType } = {}) {
  let company;

  if (slug === 'featured') {
    company = await Company.findOne({
      order: [
        ['verified', 'DESC'],
        ['complianceScore', 'DESC'],
        ['createdAt', 'ASC']
      ],
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });
  } else if (/^[0-9a-fA-F-]{36}$/.test(slug)) {
    company = await Company.findByPk(slug, {
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });
  } else {
    const candidate = slug.replace(/-/g, ' ').trim();
    company = await Company.findOne({
      where: { contactName: { [Op.like]: `%${candidate}%` } },
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });
  }

  const orderedReviews = publishableReviews.sort((a, b) => {
    if (a.submittedAt && b.submittedAt) {
      return DateTime.fromISO(b.submittedAt).toMillis() - DateTime.fromISO(a.submittedAt).toMillis();
    }
    if (a.submittedAt) return -1;
    if (b.submittedAt) return 1;
    return b.rating - a.rating;
  });

  const reviewSummary = {
    ...summariseReviews(orderedReviews),
    highlightedReviewId: orderedReviews[0]?.id ?? null,
    latestReviewId: orderedReviews.find((review) => review.submittedAt)?.id ?? null,
    excerpt: orderedReviews[0]?.comment ? `${orderedReviews[0].comment.slice(0, 200)}${orderedReviews[0].comment.length > 200 ? '…' : ''}` : null
  };

  const allowedReviewRoles = ['enterprise', 'customer'];
  const reviewAccessGranted = viewerType ? allowedReviewRoles.includes(viewerType) : false;
  const responseReviews = reviewAccessGranted ? orderedReviews : [];
  const responseSummary = reviewAccessGranted
    ? reviewSummary
    : {
        ...reviewSummary,
        highlightedReviewId: null,
        latestReviewId: null,
        excerpt: null
      };

  const bookingCount = bookings.length;
  const completedBookingsCount = bookings.filter((booking) => booking.status === 'completed').length;
  const reliabilityRatio = bookingCount === 0 ? 0.92 : clamp(completedBookingsCount / bookingCount, 0, 1);

  const slaEligible = bookings.filter((booking) => booking.slaExpiresAt && booking.lastStatusTransitionAt);
  const slaOnTime = slaEligible.filter((booking) => {
    const completedAt = DateTime.fromJSDate(booking.lastStatusTransitionAt);
    const sla = DateTime.fromJSDate(booking.slaExpiresAt);
    return completedAt <= sla;
  }).length;
  const punctualityRatio = slaEligible.length === 0 ? 0.9 : clamp(slaOnTime / Math.max(slaEligible.length, 1), 0, 1);

  const cancellationCount = bookings.filter((booking) => ['cancelled', 'disputed', 'failed'].includes(booking.status)).length;
  const cancellationScore = clamp(1 - (bookingCount === 0 ? 0 : cancellationCount / bookingCount), 0, 1);

  const complianceCoverage = complianceDocs.length > 0 ? clamp(complianceDocs.length / 8, 0, 1) : 0;
  const complianceScore = complianceDocs.length > 0 ? 0.6 + 0.4 * complianceCoverage : 0.45;

  const coverageScore = serviceZones.length > 0 ? clamp(serviceZones.length / 12, 0, 1) : 0.5;

  const reviewRatings = orderedReviews
    .map((review) => (Number.isFinite(review.rating) ? Number(review.rating) : null))
    .filter((value) => value != null);
  const sentimentScore = reviewRatings.length > 0 ? clamp(average(reviewRatings) / 5, 0, 1) : 0.86;

  const trustConfidence = resolveConfidenceLabel(bookingCount);
  const confidenceMultiplier =
    trustConfidence === 'high' ? 1 : trustConfidence === 'medium' ? 0.97 : trustConfidence === 'low' ? 0.92 : 0.88;

  const trustComposite =
    (0.3 * reliabilityRatio +
      0.22 * punctualityRatio +
      0.18 * complianceScore +
      0.15 * sentimentScore +
      0.1 * cancellationScore +
      0.05 * coverageScore) *
    100 *
    confidenceMultiplier;

  const trustValue = Math.round(clamp(trustComposite, 0, 100));
  const trustBand = resolveTrustBand(trustValue);

  const trustScore = {
    value: trustValue,
    band: trustBand,
    confidence: trustConfidence,
    sampleSize: bookingCount,
    caption: `${completedBookingsCount} of ${Math.max(bookingCount, 1)} jobs completed with ${Math.round(
      punctualityRatio * 100
    )}% on-time sign-off`,
    breakdown: {
      reliability: Number((reliabilityRatio * 100).toFixed(1)),
      punctuality: Number((punctualityRatio * 100).toFixed(1)),
      compliance: Number((complianceScore * 100).toFixed(1)),
      sentiment: Number((sentimentScore * 100).toFixed(1)),
      cancellations: Number((cancellationScore * 100).toFixed(1)),
      coverage: Number((coverageScore * 100).toFixed(1))
    }
  };

  const reviewAverage = reviewRatings.length > 0 ? average(reviewRatings) : 4.6;
  const reviewValue = Number(reviewAverage.toFixed(2));
  const reviewBand = resolveReviewBand(reviewValue);
  const reviewConfidence = resolveConfidenceLabel(reviewRatings.length);
  const reviewDistribution = {
    promoters: reviewRatings.filter((rating) => rating >= 4.5).length,
    positive: reviewRatings.filter((rating) => rating >= 4 && rating < 4.5).length,
    neutral: reviewRatings.filter((rating) => rating >= 3 && rating < 4).length,
    detractors: reviewRatings.filter((rating) => rating < 3).length
  };

  const reviewScore = {
    value: reviewValue,
    band: reviewBand,
    confidence: reviewConfidence,
    sampleSize: reviewRatings.length,
    caption: `${reviewRatings.length} verified review${reviewRatings.length === 1 ? '' : 's'}`,
    distribution: reviewDistribution
  };

  stats.unshift({
    id: 'trust-score',
    label: 'Trust score',
    value: trustScore.value,
    format: 'number',
    caption: trustScore.caption
  });
  stats.splice(1, 0, {
    id: 'review-score',
    label: 'Review score',
    value: reviewScore.value,
    format: 'number',
    caption: reviewScore.caption
  });

  const platformCommissionRate = resolvePlatformCommissionRate();

  const deals = serviceCatalogue
    .filter((service) => Number.isFinite(service.price))
    .slice(0, 3)
    .map((service, index) => ({
      id: `deal-${service.id || index}`,
      title: `${service.name} bundle`,
      description: `Escrow-backed ${service.type.toLowerCase()} package covering ${
        service.coverage.slice(0, 2).join(', ') || 'priority zones'
      }.`,
      savings: Number((service.price * platformCommissionRate).toFixed(2)),
      currency: service.currency,
      validUntil: now.plus({ days: (index + 1) * 7 }).toISODate(),
      tags: service.tags.slice(0, 2)
    }));

  const inventorySummary = buildInventorySummary(inventoryItems);

  const windowEnd = DateTime.now().setZone('UTC');
  const windowStart = windowEnd.minus({ days: 90 });

  const [services, bookings, rentals, listings] = await Promise.all([
    Service.findAll({ where: { companyId: company.id }, limit: 6 }),
    Booking.findAll({
      where: {
        companyId: company.id,
        status: 'completed',
        lastStatusTransitionAt: { [Op.gte]: windowStart.toJSDate() }
      }
    }),
    RentalAgreement.findAll({ where: { companyId: company.id } }),
    MarketplaceItem.findAll({ where: { companyId: company.id }, limit: 6 })
  ]);

  const listingIds = listings.map((listing) => listing.id);
  const actions = listingIds.length
    ? await MarketplaceModerationAction.findAll({
        where: { entity_id: { [Op.in]: listingIds } },
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    : [];

  const data = {
    hero: buildHero(company),
    stats: buildStats(bookings, rentals, company),
    packages: buildPackages(services),
    listings: listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      status: listing.status,
      availability: listing.availability,
      pricePerDay: listing.pricePerDay,
      insuredOnly: listing.insuredOnly
    })),
    timeline: buildTimeline(actions),
    viewer: viewerType ?? null
  };

  const meta = {
    slug,
    companyId: company.id,
    generatedAt: windowEnd.toISO({ suppressMilliseconds: true })
  };

  return { data, meta };
}
