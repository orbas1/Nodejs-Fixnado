import { Op, fn, col, literal } from 'sequelize';
import { DateTime } from 'luxon';
import sequelize from '../config/database.js';
import {
  CustomJobBid,
  CustomJobBidMessage,
  Post,
  ServiceZone,
  User,
  Company
} from '../models/index.js';
import {
  POST_INCLUDE_GRAPH,
  serialiseBid,
  serialisePost,
  submitCustomJobBid,
  addCustomJobBidMessage
} from './feedService.js';

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseDecimal(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normaliseString(value, { maxLength = 4000, fallback = null } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
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

function parseAmount(value) {
  if (value == null || value === '') {
    return null;
  }

  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw createServiceError('Amount must be a positive number', 422);
  }

  return numeric;
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
      const url = normaliseString(attachment.url, { fallback: null });
      if (!url) {
        return null;
      }
      const label = normaliseString(attachment.label, { fallback: null, maxLength: 120 });
      return label ? { url, label } : { url };
    })
    .filter(Boolean)
    .slice(0, 5);
}

function computeAverage(values) {
  if (!values.length) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function buildTimeline(job, providerBid) {
  const timeline = [];
  if (job.createdAt) {
    timeline.push({ label: 'Job posted', at: job.createdAt });
  }
  if (providerBid?.createdAt) {
    timeline.push({ label: 'Bid submitted', at: providerBid.createdAt });
  }
  if (providerBid?.updatedAt && providerBid.updatedAt !== providerBid.createdAt) {
    timeline.push({ label: 'Bid last updated', at: providerBid.updatedAt });
  }
  if (job.bidDeadline) {
    timeline.push({ label: 'Bid deadline', at: job.bidDeadline });
  }
  if (job.awardedAt) {
    timeline.push({ label: 'Job awarded', at: job.awardedAt });
  }
  if (job.closedAt) {
    timeline.push({ label: 'Job closed', at: job.closedAt });
  }
  return timeline;
}

function buildStatusFilter(status) {
  if (!status || status === 'all') {
    return {};
  }

  switch (status) {
    case 'open':
    case 'assigned':
    case 'completed':
    case 'cancelled':
      return { status };
    case 'awarded':
      return { status: { [Op.in]: ['assigned', 'completed'] } };
    case 'pending':
      return { status: 'open' };
    default:
      throw createServiceError('Unsupported status filter', 422);
  }
}

function buildSearchFilter(search) {
  if (!search) {
    return {};
  }

  const term = `%${search.trim().replace(/[%_]/g, '')}%`;
  if (!term.trim()) {
    return {};
  }

  return {
    [Op.or]: [
      { title: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
      { budget: { [Op.iLike]: term } }
    ]
  };
}

async function loadBidAggregates(postIds) {
  if (!postIds.length) {
    return new Map();
  }

  const aggregates = await CustomJobBid.findAll({
    attributes: [
      'postId',
      [fn('COUNT', col('id')), 'totalBids'],
      [fn('SUM', literal("CASE WHEN status = 'accepted' THEN 1 ELSE 0 END")), 'awardedBids'],
      [fn('SUM', literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pendingBids'],
      [fn('SUM', literal("CASE WHEN status = 'rejected' THEN 1 ELSE 0 END")), 'rejectedBids'],
      [fn('SUM', literal("CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END")), 'withdrawnBids'],
      [fn('AVG', col('amount')), 'averageBid'],
      [fn('MAX', col('amount')), 'maxBid'],
      [fn('MIN', col('amount')), 'minBid'],
      [fn('SUM', col('amount')), 'totalBidAmount'],
      [fn('MAX', col('updatedAt')), 'lastActivityAt']
    ],
    where: { postId: { [Op.in]: postIds } },
    group: ['postId']
  });

  return new Map(
    aggregates.map((entry) => {
      const plain = entry.get({ plain: true });
      return [plain.postId, {
        totalBids: Number(plain.totalBids || 0),
        awardedBids: Number(plain.awardedBids || 0),
        pendingBids: Number(plain.pendingBids || 0),
        rejectedBids: Number(plain.rejectedBids || 0),
        withdrawnBids: Number(plain.withdrawnBids || 0),
        averageBid: plain.averageBid != null ? parseDecimal(plain.averageBid, null) : null,
        maxBid: plain.maxBid != null ? parseDecimal(plain.maxBid, null) : null,
        minBid: plain.minBid != null ? parseDecimal(plain.minBid, null) : null,
        totalBidAmount: plain.totalBidAmount != null ? parseDecimal(plain.totalBidAmount, null) : null,
        lastActivityAt: plain.lastActivityAt || null
      }];
    })
  );
}

export async function listServicemanCustomJobs({
  providerId,
  status = 'open',
  zoneId = null,
  search = '',
  limit = 25,
  offset = 0
} = {}) {
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  const where = {
    ...buildStatusFilter(status),
    ...(zoneId ? { zoneId } : {}),
    ...buildSearchFilter(search)
  };

  const { rows, count } = await Post.findAndCountAll({
    where,
    include: [
      { model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'companyId', 'region'] },
      {
        model: CustomJobBid,
        as: 'bids',
        required: false,
        where: { providerId },
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
    ],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 25, 1), 100),
    offset: Math.max(Number(offset) || 0, 0)
  });

  const serialisedPosts = rows.map((row) => serialisePost(row));
  const aggregates = await loadBidAggregates(serialisedPosts.map((post) => post.id));

  const jobs = serialisedPosts.map((post) => {
    const stats = aggregates.get(post.id) ?? {};
    const providerBid = post.bids?.find((bid) => bid.providerId === providerId) ?? null;
    const lastMessageAt = providerBid?.messages?.length
      ? providerBid.messages[providerBid.messages.length - 1].createdAt
      : null;

    return {
      id: post.id,
      title: post.title,
      description: post.description,
      status: post.status,
      budgetLabel: post.budget,
      budgetAmount: post.budgetAmount != null ? parseDecimal(post.budgetAmount, null) : null,
      budgetCurrency: post.budgetCurrency,
      zone: post.zone ? { id: post.zone.id, name: post.zone.name, region: post.zone.region ?? null } : null,
      allowOutOfZone: Boolean(post.allowOutOfZone),
      location: post.location ?? null,
      bidDeadline: post.bidDeadline ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      totalBids: stats.totalBids ?? 0,
      pendingBids: stats.pendingBids ?? 0,
      awardedBids: stats.awardedBids ?? 0,
      rejectedBids: stats.rejectedBids ?? 0,
      withdrawnBids: stats.withdrawnBids ?? 0,
      averageBidAmount: stats.averageBid,
      highestBidAmount: stats.maxBid,
      lowestBidAmount: stats.minBid,
      totalBidAmount: stats.totalBidAmount,
      lastActivityAt: stats.lastActivityAt || lastMessageAt || providerBid?.updatedAt || post.updatedAt,
      providerBid: providerBid
        ? {
            id: providerBid.id,
            status: providerBid.status,
            amount: providerBid.amount != null ? parseDecimal(providerBid.amount, null) : null,
            currency: providerBid.currency,
            submittedAt: providerBid.createdAt,
            updatedAt: providerBid.updatedAt,
            message: providerBid.message ?? null,
            messageCount: providerBid.messages?.length ?? 0,
            lastMessageAt,
            attachments: providerBid.messages?.flatMap((message) => message.attachments || []) ?? []
          }
        : null
    };
  });

  const providerBidCount = jobs.filter((job) => job.providerBid).length;
  const awardedCount = jobs.filter((job) => job.providerBid?.status === 'accepted').length;
  const pendingCount = jobs.filter((job) => job.providerBid?.status === 'pending').length;
  const withdrawnCount = jobs.filter((job) => job.providerBid?.status === 'withdrawn').length;

  const pipelineValue = jobs.reduce(
    (acc, job) => acc + (job.providerBid?.status === 'pending' ? job.providerBid?.amount ?? 0 : 0),
    0
  );
  const awardedValue = jobs.reduce(
    (acc, job) => acc + (job.providerBid?.status === 'accepted' ? job.providerBid?.amount ?? 0 : 0),
    0
  );

  const responseMinutes = jobs
    .filter((job) => job.providerBid?.submittedAt && job.createdAt)
    .map((job) => {
      const submitted = DateTime.fromISO(job.providerBid.submittedAt);
      const created = DateTime.fromISO(job.createdAt);
      return Math.max(submitted.diff(created, 'minutes').minutes ?? 0, 0);
    });

  const summary = {
    activeOpportunities: jobs.filter((job) => job.status === 'open').length,
    providerBidCount,
    awardedCount,
    pendingCount,
    withdrawnCount,
    winRate: providerBidCount ? Math.round((awardedCount / providerBidCount) * 100) : 0,
    pipelineValue,
    awardedValue,
    averageResponseMinutes: responseMinutes.length ? Math.round(computeAverage(responseMinutes)) : null
  };

  const zones = Array.from(
    jobs.reduce((acc, job) => {
      if (job.zone) {
        acc.set(job.zone.id, job.zone);
      }
      return acc;
    }, new Map())
  ).map(([, zone]) => zone);

  return {
    jobs,
    summary,
    zones,
    pagination: { total: count, limit, offset }
  };
}

export async function getServicemanCustomJob(postId, providerId) {
  if (!postId) {
    throw createServiceError('jobId is required', 400);
  }
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  const post = await Post.findByPk(postId, {
    include: POST_INCLUDE_GRAPH
  });

  if (!post) {
    throw createServiceError('Custom job not found', 404);
  }

  const serialised = serialisePost(post);
  const providerBid = serialised.bids.find((bid) => bid.providerId === providerId) ?? null;

  const aggregates = await loadBidAggregates([serialised.id]);
  const stats = aggregates.get(serialised.id) ?? {};

  const timeline = buildTimeline(serialised, providerBid);

  const valueBreakdown = {
    averageBidAmount: stats.averageBid,
    highestBidAmount: stats.maxBid,
    lowestBidAmount: stats.minBid,
    totalBidAmount: stats.totalBidAmount
  };

  const totals = {
    totalBids: stats.totalBids ?? 0,
    pendingBids: stats.pendingBids ?? 0,
    awardedBids: stats.awardedBids ?? 0,
    rejectedBids: stats.rejectedBids ?? 0,
    withdrawnBids: stats.withdrawnBids ?? 0
  };

  return {
    job: {
      id: serialised.id,
      title: serialised.title,
      description: serialised.description,
      budgetLabel: serialised.budget,
      budgetAmount: serialised.budgetAmount != null ? parseDecimal(serialised.budgetAmount, null) : null,
      budgetCurrency: serialised.budgetCurrency,
      status: serialised.status,
      allowOutOfZone: Boolean(serialised.allowOutOfZone),
      location: serialised.location ?? null,
      zone: serialised.zone
        ? {
            id: serialised.zone.id,
            name: serialised.zone.name,
            region: serialised.zone.region ?? null,
            companyId: serialised.zone.companyId ?? null
          }
        : null,
      images: Array.isArray(serialised.images) ? serialised.images : [],
      metadata: serialised.metadata ?? {},
      bidDeadline: serialised.bidDeadline ?? null,
      createdAt: serialised.createdAt,
      updatedAt: serialised.updatedAt,
      awardedAt: serialised.awardedAt ?? null,
      closedAt: serialised.closedAt ?? null,
      customer: serialised.customer ?? null
    },
    providerBid: providerBid ? serialiseBid(providerBid) : null,
    analytics: {
      totals,
      value: valueBreakdown,
      timeline
    }
  };
}

export async function createServicemanCustomJobBid(postId, providerId, providerRole, payload = {}, actorContext = null) {
  if (!postId) {
    throw createServiceError('jobId is required', 400);
  }
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  const amount = payload.amount != null ? parseAmount(payload.amount) : undefined;
  const currency = payload.currency ? parseCurrency(payload.currency) : undefined;
  const message = normaliseString(payload.message, { fallback: null, maxLength: 2000 });
  const attachments = sanitiseAttachments(payload.attachments ?? []);

  const bid = await submitCustomJobBid({
    postId,
    providerId,
    providerRole,
    actorContext,
    amount,
    currency,
    message,
    attachments
  });

  return serialiseBid(bid);
}

export async function updateServicemanCustomJobBid(postId, bidId, providerId, payload = {}) {
  if (!postId || !bidId) {
    throw createServiceError('jobId and bidId are required', 400);
  }
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  return sequelize.transaction(async (transaction) => {
    const bid = await CustomJobBid.findOne({
      where: { id: bidId, postId, providerId },
      include: [
        { model: CustomJobBidMessage, as: 'messages', include: [{ model: User, as: 'author' }] }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!bid) {
      throw createServiceError('Bid not found for this job', 404);
    }

    const updates = {};
    if (payload.amount !== undefined) {
      updates.amount = parseAmount(payload.amount);
    }
    if (payload.currency !== undefined) {
      updates.currency = parseCurrency(payload.currency, bid.currency);
    }
    if (payload.message !== undefined) {
      updates.message = normaliseString(payload.message, { fallback: null, maxLength: 2000 });
    }
    if (payload.metadata !== undefined && payload.metadata !== null) {
      if (typeof payload.metadata !== 'object' || Array.isArray(payload.metadata)) {
        throw createServiceError('Metadata must be an object', 422);
      }
      updates.metadata = { ...bid.metadata, ...payload.metadata };
    }

    if (Object.keys(updates).length === 0) {
      return serialiseBid(bid);
    }

    await bid.update(updates, { transaction });

    const refreshed = await CustomJobBid.findByPk(bid.id, {
      include: [
        { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'type'] },
        { model: Company, as: 'providerCompany', attributes: ['id', 'legalStructure', 'contactName'] },
        {
          model: CustomJobBidMessage,
          as: 'messages',
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }]
        }
      ],
      transaction
    });

    return serialiseBid(refreshed);
  });
}

export async function withdrawServicemanCustomJobBid(postId, bidId, providerId, reason = null) {
  if (!postId || !bidId) {
    throw createServiceError('jobId and bidId are required', 400);
  }
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  return sequelize.transaction(async (transaction) => {
    const bid = await CustomJobBid.findOne({
      where: { id: bidId, postId, providerId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!bid) {
      throw createServiceError('Bid not found for this job', 404);
    }

    if (bid.status === 'accepted') {
      throw createServiceError('Awarded bids cannot be withdrawn', 409);
    }

    const metadata = { ...bid.metadata };
    if (reason) {
      metadata.withdrawReason = normaliseString(reason, { fallback: null, maxLength: 500 });
    }

    await bid.update({ status: 'withdrawn', metadata }, { transaction });

    const refreshed = await CustomJobBid.findByPk(bid.id, {
      include: [
        { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'type'] },
        {
          model: CustomJobBidMessage,
          as: 'messages',
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }]
        }
      ],
      transaction
    });

    return serialiseBid(refreshed);
  });
}

export async function addServicemanCustomJobBidMessage(postId, bidId, providerId, body, attachments = [], actorContext = null) {
  if (!postId || !bidId) {
    throw createServiceError('jobId and bidId are required', 400);
  }
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  const messageBody = normaliseString(body, { fallback: null, maxLength: 2000 });
  if (!messageBody) {
    throw createServiceError('Message body is required', 422);
  }

  return addCustomJobBidMessage({
    postId,
    bidId,
    authorId: providerId,
    authorRole: 'provider',
    actorContext,
    body: messageBody,
    attachments: sanitiseAttachments(attachments)
  });
}

export async function getServicemanCustomJobReports({ providerId, rangeStart = null, rangeEnd = null } = {}) {
  if (!providerId) {
    throw createServiceError('Authenticated provider required', 401);
  }

  const where = { providerId };
  if (rangeStart || rangeEnd) {
    where.createdAt = {};
    if (rangeStart) {
      where.createdAt[Op.gte] = new Date(rangeStart);
    }
    if (rangeEnd) {
      where.createdAt[Op.lte] = new Date(rangeEnd);
    }
  }

  const bids = await CustomJobBid.findAll({
    where,
    include: [
      {
        model: Post,
        as: 'job',
        attributes: ['id', 'title', 'status', 'budgetAmount', 'budgetCurrency', 'zoneId', 'createdAt', 'bidDeadline'],
        include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'region'] }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const totals = {
    bids: bids.length,
    wins: 0,
    losses: 0,
    withdrawn: 0,
    pending: 0
  };

  let awardedValue = 0;
  let pendingValue = 0;
  let currency = 'GBP';

  const responseDurations = [];
  const velocityBuckets = new Map();
  const zoneStats = new Map();

  for (const bid of bids) {
    const amount = parseDecimal(bid.amount, 0);
    currency = bid.currency || bid.job?.budgetCurrency || currency;

    switch (bid.status) {
      case 'accepted':
        totals.wins += 1;
        awardedValue += amount;
        break;
      case 'rejected':
        totals.losses += 1;
        break;
      case 'withdrawn':
        totals.withdrawn += 1;
        break;
      default:
        totals.pending += 1;
        pendingValue += amount;
    }

    if (bid.job?.createdAt) {
      const created = DateTime.fromJSDate(bid.job.createdAt);
      const submitted = DateTime.fromJSDate(bid.createdAt);
      if (created.isValid && submitted.isValid) {
        const minutes = submitted.diff(created, 'minutes').minutes;
        if (Number.isFinite(minutes) && minutes >= 0) {
          responseDurations.push(minutes);
        }
      }
    }

    const weekKey = DateTime.fromJSDate(bid.createdAt).startOf('week').toISODate();
    if (weekKey) {
      const bucket = velocityBuckets.get(weekKey) ?? { label: weekKey, bids: 0, wins: 0 };
      bucket.bids += 1;
      if (bid.status === 'accepted') {
        bucket.wins += 1;
      }
      velocityBuckets.set(weekKey, bucket);
    }

    const zoneId = bid.job?.zone?.id ?? 'unassigned';
    const zoneEntry = zoneStats.get(zoneId) ?? {
      id: zoneId,
      name: bid.job?.zone?.name || 'Unassigned zone',
      region: bid.job?.zone?.region ?? null,
      bids: 0,
      wins: 0,
      pending: 0
    };
    zoneEntry.bids += 1;
    if (bid.status === 'accepted') {
      zoneEntry.wins += 1;
    }
    if (bid.status === 'pending') {
      zoneEntry.pending += 1;
    }
    zoneStats.set(zoneId, zoneEntry);
  }

  const averageResponseMinutes = responseDurations.length
    ? Math.round(computeAverage(responseDurations))
    : null;
  const p90ResponseMinutes = responseDurations.length
    ? Math.round(responseDurations.sort((a, b) => a - b)[Math.floor(responseDurations.length * 0.9)])
    : null;

  const velocity = Array.from(velocityBuckets.values())
    .sort((a, b) => (a.label < b.label ? -1 : 1))
    .slice(-8);

  const zones = Array.from(zoneStats.values())
    .map((zone) => ({
      ...zone,
      winRate: zone.bids ? Math.round((zone.wins / zone.bids) * 100) : 0
    }))
    .sort((a, b) => b.bids - a.bids || a.name.localeCompare(b.name))
    .slice(0, 10);

  return {
    totals,
    value: {
      awarded: awardedValue,
      pending: pendingValue,
      currency
    },
    responseTimes: {
      averageMinutes: averageResponseMinutes,
      p90Minutes: p90ResponseMinutes
    },
    velocity,
    zones,
    generatedAt: new Date().toISOString()
  };
}

export default {
  listServicemanCustomJobs,
  getServicemanCustomJob,
  createServicemanCustomJobBid,
  updateServicemanCustomJobBid,
  withdrawServicemanCustomJobBid,
  addServicemanCustomJobBidMessage,
  getServicemanCustomJobReports
};
