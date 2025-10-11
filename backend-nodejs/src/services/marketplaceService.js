import { Op } from 'sequelize';
import {
  Company,
  InsuredSellerApplication,
  MarketplaceItem,
  MarketplaceModerationAction,
  sequelize
} from '../models/index.js';
import { evaluateInsuredSellerStatus } from './complianceService.js';

const ALLOWED_AVAILABILITY = ['rent', 'buy', 'both'];

function marketplaceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
}

function parseMoney(value, fieldName, { required = false } = {}) {
  if (value === null || value === undefined) {
    if (required) {
      throw marketplaceError(`${fieldName} is required`);
    }
    return null;
  }

  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw marketplaceError(`${fieldName} must be a positive number`);
  }
  return numeric;
}

async function fetchCompanyWithCompliance(companyId, transaction) {
  const company = await Company.findByPk(companyId, {
    include: [{ model: InsuredSellerApplication }],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  if (!company) {
    throw marketplaceError('Company not found', 404);
  }

  return company;
}

function ensureCompanyEligible(company, { requireBadge = false } = {}) {
  const now = new Date();
  if (company.insuredSellerStatus !== 'approved') {
    throw marketplaceError('Company is not approved as an insured seller', 409);
  }

  if (company.insuredSellerExpiresAt && new Date(company.insuredSellerExpiresAt) <= now) {
    throw marketplaceError('Insured seller approval expired — renew compliance documents before listing', 409);
  }

  if (requireBadge && !company.insuredSellerBadgeVisible) {
    throw marketplaceError('Insured seller badge must be visible before creating insured-only listings', 409);
  }
}

export async function createMarketplaceItem({
  companyId,
  title,
  description = null,
  pricePerDay = null,
  purchasePrice = null,
  location = null,
  availability = 'rent',
  insuredOnly = false,
  actorId = null
}) {
  if (!companyId) {
    throw marketplaceError('companyId is required');
  }
  if (!title) {
    throw marketplaceError('title is required');
  }
  if (!ALLOWED_AVAILABILITY.includes(availability)) {
    throw marketplaceError(`availability must be one of ${ALLOWED_AVAILABILITY.join(', ')}`);
  }

  const rentalRate = parseMoney(pricePerDay, 'pricePerDay', { required: availability !== 'buy' });
  const salePrice = parseMoney(purchasePrice, 'purchasePrice', { required: availability !== 'rent' });

  return sequelize.transaction(async (transaction) => {
    const company = await fetchCompanyWithCompliance(companyId, transaction);
    await evaluateInsuredSellerStatus(companyId, { transaction });
    await company.reload({ include: [{ model: InsuredSellerApplication }], transaction });
    ensureCompanyEligible(company, { requireBadge: insuredOnly });

    const application = company.InsuredSellerApplication;
    const complianceSnapshot = {
      applicationId: application?.id || null,
      status: company.insuredSellerStatus,
      expiresAt: company.insuredSellerExpiresAt || null,
      complianceScore: Number(company.complianceScore || 0)
    };

    const item = await MarketplaceItem.create(
      {
        companyId,
        title,
        description,
        pricePerDay: rentalRate,
        purchasePrice: salePrice,
        location,
        availability,
        insuredOnly,
        status: 'pending_review',
        complianceHoldUntil: company.insuredSellerExpiresAt || null,
        complianceSnapshot
      },
      { transaction }
    );

    await MarketplaceModerationAction.create(
      {
        entityType: 'marketplace_item',
        entityId: item.id,
        action: 'created',
        actorId,
        metadata: {
          companyId,
          availability,
          insuredOnly
        }
      },
      { transaction }
    );

    return item;
  });
}

export async function submitMarketplaceItemForReview(itemId, { actorId = null }) {
  return sequelize.transaction(async (transaction) => {
    const item = await MarketplaceItem.findByPk(itemId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!item) {
      throw marketplaceError('Marketplace item not found', 404);
    }

    if (!['draft', 'rejected'].includes(item.status)) {
      return item;
    }

    await item.update(
      {
        status: 'pending_review',
        moderationNotes: null
      },
      { transaction }
    );

    await MarketplaceModerationAction.create(
      {
        entityType: 'marketplace_item',
        entityId: item.id,
        action: 'submitted_for_review',
        actorId,
        metadata: {
          companyId: item.companyId
        }
      },
      { transaction }
    );

    return item;
  });
}

export async function moderateMarketplaceItem(itemId, { reviewerId = null, decision, reason = null, holdUntil = null, metadata = {} }) {
  if (!['approve', 'reject', 'suspend'].includes(decision)) {
    throw marketplaceError('decision must be approve, reject, or suspend');
  }

  return sequelize.transaction(async (transaction) => {
    const item = await MarketplaceItem.findByPk(itemId, {
      include: [
        {
          model: Company,
          include: [{ model: InsuredSellerApplication }]
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!item) {
      throw marketplaceError('Marketplace item not found', 404);
    }

    const now = new Date();
    let status = item.status;
    let complianceHoldUntil = item.complianceHoldUntil;

    if (decision === 'approve') {
      ensureCompanyEligible(item.Company);
      let holdDate = holdUntil ? new Date(holdUntil) : item.Company.insuredSellerExpiresAt;
      if (holdDate && holdDate <= now) {
        throw marketplaceError('Compliance hold date must be in the future');
      }
      status = 'approved';
      complianceHoldUntil = holdDate || null;
      await item.update(
        {
          status,
          lastReviewedAt: now,
          complianceHoldUntil,
          moderationNotes: reason || null,
          complianceSnapshot: {
            applicationId: item.Company.InsuredSellerApplication?.id || null,
            status: item.Company.insuredSellerStatus,
            expiresAt: complianceHoldUntil,
            complianceScore: Number(item.Company.complianceScore || 0)
          }
        },
        { transaction }
      );
    } else if (decision === 'reject') {
      status = 'rejected';
      complianceHoldUntil = null;
      await item.update(
        {
          status,
          lastReviewedAt: now,
          complianceHoldUntil,
          moderationNotes: reason,
          complianceSnapshot: {
            applicationId: item.Company.InsuredSellerApplication?.id || null,
            status: item.Company.insuredSellerStatus,
            expiresAt: item.Company.insuredSellerExpiresAt,
            complianceScore: Number(item.Company.complianceScore || 0)
          }
        },
        { transaction }
      );
    } else {
      status = 'suspended';
      complianceHoldUntil = null;
      await item.update(
        {
          status,
          lastReviewedAt: now,
          complianceHoldUntil,
          moderationNotes: reason,
          complianceSnapshot: {
            applicationId: item.Company.InsuredSellerApplication?.id || null,
            status: 'suspended',
            expiresAt: item.Company.insuredSellerExpiresAt,
            complianceScore: Number(item.Company.complianceScore || 0)
          }
        },
        { transaction }
      );
    }

    await MarketplaceModerationAction.create(
      {
        entityType: 'marketplace_item',
        entityId: item.id,
        action: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'suspended',
        actorId: reviewerId,
        reason,
        metadata: {
          ...metadata,
          companyId: item.companyId,
          complianceHoldUntil
        }
      },
      { transaction }
    );

    return item;
  });
}

export async function listModerationQueue({ limit = 50, offset = 0 } = {}) {
  const items = await MarketplaceItem.findAll({
    where: {
      status: {
        [Op.in]: ['pending_review', 'rejected', 'suspended']
      }
    },
    include: [
      {
        model: Company,
        attributes: ['id', 'legalStructure', 'insuredSellerStatus', 'insuredSellerExpiresAt', 'complianceScore', 'insuredSellerBadgeVisible'],
        include: [
          {
            model: InsuredSellerApplication
          }
        ]
      },
      {
        association: 'moderationActions',
        limit: 5,
        separate: true,
        order: [['createdAt', 'DESC']]
      }
    ],
    order: [['updatedAt', 'DESC']],
    limit,
    offset
  });

  return items;
}

export async function listApprovedMarketplaceItems({ limit = 25 } = {}) {
  const now = new Date();
  return MarketplaceItem.findAll({
    where: {
      status: 'approved',
      [Op.or]: [
        { complianceHoldUntil: null },
        { complianceHoldUntil: { [Op.gt]: now } }
      ]
    },
    include: [
      {
        model: Company,
        attributes: ['id', 'legalStructure', 'insuredSellerBadgeVisible', 'insuredSellerStatus', 'complianceScore'],
        where: { insuredSellerStatus: 'approved' }
      }
    ],
    order: [['lastReviewedAt', 'DESC']],
    limit
  });
}
