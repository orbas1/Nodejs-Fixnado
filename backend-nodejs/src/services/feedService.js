import { Op } from 'sequelize';
import { Company, CustomJobBid, CustomJobBidMessage, Post, ServiceZone, User } from '../models/index.js';
import { listApprovedMarketplaceItems } from './marketplaceService.js';

const DEFAULT_FEED_LIMIT = 25;

function sanitizeLimit(limit) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_FEED_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
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
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'type'] },
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
      }
    ]
  });

  return posts.map((post) => {
    const json = post.toJSON();
    json.images = Array.isArray(json.images) ? json.images : [];
    json.metadata = json.metadata ?? {};

    json.bids = Array.isArray(json.bids)
      ? json.bids
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((bid) => ({
            ...bid,
            messages: Array.isArray(bid.messages)
              ? bid.messages
                  .slice()
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              : []
          }))
      : [];

    return json;
  });
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
