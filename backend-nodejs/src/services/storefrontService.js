import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  Company,
  InsuredSellerApplication,
  MarketplaceItem,
  MarketplaceModerationAction,
  RentalAgreement,
  User
} from '../models/index.js';
import { resolveCompanyId } from './companyAccessService.js';

const ACTIVE_RENTAL_STATUSES = new Set([
  'approved',
  'pickup_scheduled',
  'in_use',
  'inspection_pending'
]);

const SUCCESS_RENTAL_STATUSES = new Set(['settled', 'in_use', 'inspection_pending']);

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function average(values, fallback = 0) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) {
    return fallback;
  }
  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

function calculateAgreementValue(agreement, fallbackRate = 0) {
  const rate = toNumber(agreement.dailyRate, fallbackRate);
  if (rate <= 0) {
    return 0;
  }

  const quantity = agreement.quantity ?? 1;
  const start = toDate(agreement.rentalStartAt) || toDate(agreement.pickupAt);
  const end = toDate(agreement.returnDueAt) || toDate(agreement.rentalEndAt) || toDate(agreement.lastStatusTransitionAt);

  if (!start || !end) {
    return rate * quantity;
  }

  const duration = Math.max(Math.ceil(DateTime.fromJSDate(end).diff(DateTime.fromJSDate(start), 'days').days), 1);
  return rate * quantity * duration;
}

function resolveSeverityFromStatus(status) {
  if (!status) return 'info';
  if (status === 'rejected' || status === 'suspended') return 'danger';
  if (status === 'pending_review') return 'warning';
  return 'success';
}

function buildListingRecommendations({ item, agreements, now }) {
  const recommendations = [];
  const holdUntil = item.complianceHoldUntil ? DateTime.fromJSDate(item.complianceHoldUntil) : null;
  const latestAgreement = agreements
    .map((agreement) => DateTime.fromJSDate(agreement.lastStatusTransitionAt))
    .sort((a, b) => b.toMillis() - a.toMillis())[0];

  if (item.status === 'pending_review') {
    recommendations.push({
      id: `${item.id}-submit-docs`,
      label: 'Provide additional compliance evidence to accelerate moderation.',
      tone: 'warning'
    });
  }

  if (item.status === 'rejected' && item.moderationNotes) {
    recommendations.push({
      id: `${item.id}-address-feedback`,
      label: `Address moderation feedback: ${item.moderationNotes}`,
      tone: 'danger'
    });
  }

  if (holdUntil && holdUntil.diff(now, 'days').days <= 14) {
    recommendations.push({
      id: `${item.id}-renew-badge`,
      label: 'Renew insured seller compliance before the badge expires.',
      tone: 'warning'
    });
  }

  if (!latestAgreement || now.diff(latestAgreement, 'days').days >= 45) {
    recommendations.push({
      id: `${item.id}-refresh-story`,
      label: 'No recent conversions — refresh imagery and republish to marketplace campaigns.',
      tone: 'info'
    });
  }

  if (item.insuredOnly) {
    recommendations.push({
      id: `${item.id}-promote-insured`,
      label: 'Highlight insured-only coverage inside outreach templates to justify premium pricing.',
      tone: 'info'
    });
  }

  return recommendations;
}

function buildStorefrontPlaybooks({
  pendingReviewCount,
  flaggedCount,
  holdExpiringCount,
  dormantListings,
  badgeVisible,
  complianceScore
}) {
  const playbooks = [];

  if (pendingReviewCount > 0) {
    playbooks.push({
      id: 'playbook-review-acceleration',
      title: 'Accelerate moderation turnaround',
      detail: 'Upload insurance certificates and completion photography so trust & safety can approve listings faster.',
      tone: 'warning'
    });
  }

  if (flaggedCount > 0) {
    playbooks.push({
      id: 'playbook-quality-audit',
      title: 'Run a quality and documentation audit',
      detail: 'Resolve compliance notes and reissue pricing benchmarks to remove suspension risks.',
      tone: 'danger'
    });
  }

  if (holdExpiringCount > 0) {
    playbooks.push({
      id: 'playbook-renewals',
      title: 'Renew insured seller artefacts',
      detail: 'Schedule renewals with the compliance office before badge expiry to keep marketplace placement.',
      tone: 'warning'
    });
  }

  if (!badgeVisible) {
    playbooks.push({
      id: 'playbook-badge-activation',
      title: 'Activate insured seller badge',
      detail: 'Enable badge visibility so concierge teams can prioritise your storefront in enterprise searches.',
      tone: 'info'
    });
  }

  if (complianceScore < 85) {
    playbooks.push({
      id: 'playbook-compliance-improvement',
      title: 'Improve compliance posture',
      detail: 'Address low-scoring artefacts and configure automated reminders for renewals and inspections.',
      tone: 'warning'
    });
  }

  for (const listing of dormantListings) {
    playbooks.push({
      id: `playbook-refresh-${listing.id}`,
      title: `Refresh ${listing.title}`,
      detail: 'Launch a targeted campaign with refreshed photography to drive new enquiries.',
      tone: 'info'
    });
  }

  if (playbooks.length === 0) {
    playbooks.push({
      id: 'playbook-growth',
      title: 'Maintain growth momentum',
      detail: 'Promote premium bundles and bundle concierge-backed fulfilment for enterprise buyers.',
      tone: 'success'
    });
  }

  return playbooks;
}

export async function buildProviderStorefront({ companyId: inputCompanyId } = {}) {
  const companyId = await resolveCompanyId(inputCompanyId);
  const [companyRecord, items] = await Promise.all([
    Company.findByPk(companyId, {
      include: [{ model: InsuredSellerApplication }]
    }),
    MarketplaceItem.findAll({
      where: { companyId },
      include: [
        {
          model: RentalAgreement,
          include: [{ model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName'] }],
          required: false,
          separate: true,
          order: [['lastStatusTransitionAt', 'DESC']]
        },
        {
          model: MarketplaceModerationAction,
          as: 'moderationActions',
          separate: true,
          order: [['createdAt', 'DESC']],
          limit: 10,
          include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName'] }]
        }
      ]
    })
  ]);

  if (!companyRecord) {
    const error = new Error('company_not_found');
    error.statusCode = 404;
    throw error;
  }

  const company = companyRecord.toJSON();
  const now = DateTime.now();

  const listingSummaries = [];
  const timeline = [];

  let activeListings = 0;
  let pendingReviewCount = 0;
  let flaggedCount = 0;
  let insuredOnlyCount = 0;
  let holdExpiringCount = 0;
  let totalRequests = 0;
  let totalSuccessful = 0;
  let totalRevenue = 0;
  const dormantListings = [];

  for (const itemRecord of items) {
    const item = itemRecord.toJSON();
    const agreements = item.RentalAgreements ?? [];
    const moderationActions = item.moderationActions ?? [];

    if (item.status === 'approved') {
      const holdUntil = item.complianceHoldUntil ? DateTime.fromJSDate(new Date(item.complianceHoldUntil)) : null;
      const holdValid = !holdUntil || holdUntil > now;
      if (holdValid) {
        activeListings += 1;
      } else {
        holdExpiringCount += 1;
      }
    }

    if (item.status === 'pending_review') pendingReviewCount += 1;
    if (item.status === 'rejected' || item.status === 'suspended') flaggedCount += 1;
    if (item.insuredOnly) insuredOnlyCount += 1;

    const requestCount = agreements.length;
    totalRequests += requestCount;

    const successful = agreements.filter((agreement) => SUCCESS_RENTAL_STATUSES.has(agreement.status));
    totalSuccessful += successful.length;

    const revenue = agreements.reduce((sum, agreement) => sum + calculateAgreementValue(agreement, toNumber(item.pricePerDay)), 0);
    totalRevenue += revenue;

    const mostRecentAgreement = agreements[0];
    const latestInteraction = mostRecentAgreement ? DateTime.fromJSDate(new Date(mostRecentAgreement.lastStatusTransitionAt)) : null;
    if (!latestInteraction || now.diff(latestInteraction, 'days').days >= 45) {
      dormantListings.push({ id: item.id, title: item.title });
    }

    for (const action of moderationActions) {
      timeline.push({
        id: action.id,
        timestamp: action.createdAt,
        type: action.action,
        listingId: item.id,
        listingTitle: item.title,
        actor:
          action.actor?.firstName && action.actor?.lastName
            ? `${action.actor.firstName} ${action.actor.lastName}`
            : null,
        detail: action.reason || null,
        metadata: action.metadata || {},
        tone: resolveSeverityFromStatus(action.metadata?.status || item.status)
      });
    }

    const activeAgreements = agreements.filter((agreement) => ACTIVE_RENTAL_STATUSES.has(agreement.status));
    const avgDuration = average(
      agreements.map((agreement) => {
        const start = toDate(agreement.rentalStartAt) || toDate(agreement.pickupAt);
        const end = toDate(agreement.returnDueAt) || toDate(agreement.rentalEndAt) || toDate(agreement.lastStatusTransitionAt);
        if (!start || !end) return null;
        return Math.max(DateTime.fromJSDate(end).diff(DateTime.fromJSDate(start), 'days').days, 0);
      }),
      0
    );

    listingSummaries.push({
      id: item.id,
      title: item.title,
      status: item.status,
      availability: item.availability,
      pricePerDay: item.pricePerDay ? Number(item.pricePerDay) : null,
      purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
      location: item.location,
      insuredOnly: Boolean(item.insuredOnly),
      complianceHoldUntil: item.complianceHoldUntil,
      lastReviewedAt: item.lastReviewedAt,
      moderationNotes: item.moderationNotes,
      requestVolume: requestCount,
      activeAgreements: activeAgreements.length,
      successfulAgreements: successful.length,
      projectedRevenue: Number(revenue.toFixed(2)),
      averageDurationDays: avgDuration,
      recommendedActions: buildListingRecommendations({ item, agreements, now }),
      agreements: agreements.slice(0, 5).map((agreement) => ({
        id: agreement.id,
        status: agreement.status,
        renter: agreement.renter ? `${agreement.renter.firstName} ${agreement.renter.lastName}` : null,
        pickupAt: agreement.pickupAt,
        returnDueAt: agreement.returnDueAt,
        lastStatusTransitionAt: agreement.lastStatusTransitionAt,
        depositStatus: agreement.depositStatus,
        dailyRate: agreement.dailyRate,
        meta: agreement.meta || {}
      }))
    });
  }

  const conversionRate = totalRequests === 0 ? 0 : totalSuccessful / totalRequests;

  timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const data = {
    storefront: {
      company: {
        id: company.id,
        name: company.contactName || company.legalStructure,
        complianceScore: Number(company.complianceScore || 0),
        insuredSellerStatus: company.insuredSellerStatus,
        insuredSellerExpiresAt: company.insuredSellerExpiresAt,
        badgeVisible: Boolean(company.insuredSellerBadgeVisible),
        applicationId: company.InsuredSellerApplication?.id || null
      },
      metrics: {
        activeListings,
        pendingReview: pendingReviewCount,
        flagged: flaggedCount,
        insuredOnly: insuredOnlyCount,
        holdExpiring: holdExpiringCount,
        avgDailyRate: average(
          items.map((item) => toNumber(item.pricePerDay)).filter((value) => value > 0),
          0
        ),
        conversionRate,
        totalRequests,
        totalRevenue: Number(totalRevenue.toFixed(2))
      },
      health: {
        badgeVisible: Boolean(company.insuredSellerBadgeVisible),
        complianceScore: Number(company.complianceScore || 0),
        expiresAt: company.insuredSellerExpiresAt,
        pendingReviewCount,
        flaggedCount,
        holdExpiringCount
      }
    },
    listings: listingSummaries,
    playbooks: buildStorefrontPlaybooks({
      pendingReviewCount,
      flaggedCount,
      holdExpiringCount,
      dormantListings,
      badgeVisible: Boolean(company.insuredSellerBadgeVisible),
      complianceScore: Number(company.complianceScore || 0)
    }),
    timeline: timeline.slice(0, 25)
  };

  return {
    data,
    meta: {
      companyId,
      generatedAt: new Date().toISOString(),
      listingCount: items.length
    }
  };
}

export async function getStorefrontListingById(companyId, listingId) {
  const resolvedCompanyId = await resolveCompanyId(companyId);
  const item = await MarketplaceItem.findOne({
    where: { id: listingId, companyId: resolvedCompanyId },
    include: [
      {
        model: RentalAgreement,
        include: [{ model: User, as: 'renter', attributes: ['id', 'firstName', 'lastName'] }],
        required: false,
        order: [['lastStatusTransitionAt', 'DESC']]
      },
      {
        model: MarketplaceModerationAction,
        as: 'moderationActions',
        separate: true,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName'] }]
      }
    ]
  });

  if (!item) {
    const error = new Error('listing_not_found');
    error.statusCode = 404;
    throw error;
  }

  return item.toJSON();
}

export async function searchStorefrontListings(companyId, { status, availability, insuredOnly } = {}) {
  const resolvedCompanyId = await resolveCompanyId(companyId);
  const where = { companyId: resolvedCompanyId };
  if (status) {
    where.status = Array.isArray(status) ? { [Op.in]: status } : status;
  }
  if (availability) {
    where.availability = Array.isArray(availability) ? { [Op.in]: availability } : availability;
  }
  if (insuredOnly != null) {
    where.insuredOnly = Boolean(insuredOnly);
  }

  const listings = await MarketplaceItem.findAll({ where, order: [['updatedAt', 'DESC']], limit: 100 });
  return listings.map((listing) => listing.toJSON());
}

