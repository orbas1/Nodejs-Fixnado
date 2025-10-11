import { Post, User } from '../models/index.js';
import { listApprovedMarketplaceItems } from './marketplaceService.js';

export async function listLiveFeed() {
  const posts = await Post.findAll({
    order: [['createdAt', 'DESC']],
    limit: 25,
    include: [{ model: User, attributes: ['firstName', 'lastName', 'type'] }]
  });
  return posts;
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
