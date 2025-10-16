import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Company, CustomJobBid, CustomJobBidMessage, Post, ServiceZone, User } from '../models/index.js';
import { listApprovedMarketplaceItems } from './marketplaceService.js';
import { broadcastLiveFeedEvent } from './liveFeedStreamService.js';

const DEFAULT_FEED_LIMIT = 25;

const POST_INCLUDE_GRAPH = [
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
];

function sanitizeLimit(limit) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_FEED_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

function serialiseBid(bid) {
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

function serialisePost(post) {
  const json = typeof post?.toJSON === 'function' ? post.toJSON() : post;
  if (!json) return json;

  const bids = Array.isArray(json.bids)
    ? json.bids
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((entry) => serialiseBid(entry))
    : [];

  return {
    ...json,
    images: Array.isArray(json.images) ? json.images : [],
    metadata: json.metadata ?? {},
    bids
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

  return job;
}

export async function submitCustomJobBid({
  postId,
  providerId,
  providerRole,
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
      zoneId: post.zoneId,
      allowOutOfZone: Boolean(post.allowOutOfZone)
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

  return bidResult;
}

export async function addCustomJobBidMessage({
  postId,
  bidId,
  authorId,
  authorRole,
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
      zoneId: post.zoneId,
      allowOutOfZone: Boolean(post.allowOutOfZone)
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

  return messageResult;
}
