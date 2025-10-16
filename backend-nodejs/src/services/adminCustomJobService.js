import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { CustomJobBid, CustomJobBidMessage, Post, ServiceZone, User } from '../models/index.js';
import { POST_INCLUDE_GRAPH, serialiseBid, serialisePost } from './feedService.js';

const DEFAULT_PAGE_SIZE = 20;
const ALLOWED_STATUSES = new Set(['open', 'assigned', 'completed', 'cancelled']);
const SALT_ROUNDS = 10;

function clampLimit(value) {
  const numeric = Number.parseInt(value ?? DEFAULT_PAGE_SIZE, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(numeric, 100);
}

function clampOffset(value) {
  const numeric = Number.parseInt(value ?? 0, 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return numeric;
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
  const numeric = Number.parseFloat(String(value));
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw Object.assign(new Error('Amount must be a positive number'), { statusCode: 422 });
  }
  return numeric;
}

function ensureMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  return metadata;
}

function sanitiseImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .map((entry) => normaliseString(entry, { maxLength: 2048 }))
    .filter((entry) => entry && /^https?:\/\//i.test(entry));
}

function parseDate(value, fieldName) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error(`Invalid date provided for ${fieldName}`), { statusCode: 422 });
  }
  return date;
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

function escapeLike(value) {
  return value.replace(/[%_]/g, '\\$&');
}

async function ensureCustomer(customer = {}) {
  if (customer.id) {
    const existing = await User.findByPk(customer.id);
    if (!existing) {
      throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
    }
    return existing;
  }

  const email = normaliseString(customer.email, { maxLength: 320 });
  if (!email) {
    throw Object.assign(new Error('Customer email is required'), { statusCode: 422 });
  }

  const found = await User.findOne({ where: { email } });
  if (found) {
    return found;
  }

  const firstName = normaliseString(customer.firstName, { maxLength: 120, fallback: 'Fixnado' }) ?? 'Fixnado';
  const lastName = normaliseString(customer.lastName, { maxLength: 120, fallback: 'Customer' }) ?? 'Customer';
  const randomPassword = crypto.randomBytes(24).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

  const user = await User.create(
    {
      firstName,
      lastName,
      email,
      passwordHash,
      type: 'user'
    },
    { validate: false }
  );

  return user;
}

async function verifyZone(zoneId) {
  if (!zoneId) {
    return null;
  }
  const zone = await ServiceZone.findByPk(zoneId);
  if (!zone) {
    throw Object.assign(new Error('Selected service zone does not exist'), { statusCode: 404 });
  }
  return zone.id;
}

async function computeSummary(where = {}) {
  const { status: _status, ...rest } = where;
  const baseWhere = { ...rest, category: 'custom-job' };

  const bidInclude = [
    {
      model: Post,
      as: 'job',
      where: baseWhere,
      attributes: [],
      required: true
    }
  ];

  const [openCount, assignedCount, completedCount, cancelledCount, totalBids, activeBidCount] = await Promise.all([
    Post.count({ where: { ...baseWhere, status: 'open' } }),
    Post.count({ where: { ...baseWhere, status: 'assigned' } }),
    Post.count({ where: { ...baseWhere, status: 'completed' } }),
    Post.count({ where: { ...baseWhere, status: 'cancelled' } }),
    CustomJobBid.count({ include: bidInclude, distinct: true }),
    CustomJobBid.count({ where: { status: 'pending' }, include: bidInclude, distinct: true })
  ]);

  return {
    openCount,
    assignedCount,
    completedCount,
    cancelledCount,
    totalBids,
    activeBidCount,
    refreshedAt: new Date().toISOString()
  };
}

export async function listCustomJobs({ status, zoneId, search, limit, offset } = {}) {
  const where = { category: 'custom-job' };
  if (status && ALLOWED_STATUSES.has(status)) {
    where.status = status;
  }
  if (zoneId) {
    where.zoneId = zoneId;
  }
  const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
  const searchTerm = normaliseString(search, { maxLength: 160 });
  if (searchTerm) {
    const pattern = `%${escapeLike(searchTerm)}%`;
    where[Op.or] = [
      { title: { [likeOperator]: pattern } },
      { description: { [likeOperator]: pattern } },
      { budget: { [likeOperator]: pattern } }
    ];
  }

  const paginationLimit = clampLimit(limit);
  const paginationOffset = clampOffset(offset);

  const { rows, count } = await Post.findAndCountAll({
    where,
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'type'] },
      { model: ServiceZone, as: 'zone', attributes: ['id', 'name'] },
      {
        model: CustomJobBid,
        as: 'bids',
        attributes: ['id', 'amount', 'currency', 'status', 'createdAt'],
        include: [{ model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'type'] }]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: paginationLimit,
    offset: paginationOffset
  });

  const jobs = rows.map((row) => {
    const payload = serialisePost(row);
    return {
      id: payload.id,
      title: payload.title,
      status: payload.status,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      bidCount: payload.bidCount,
      messageCount: payload.messageCount,
      budgetAmount: payload.budgetAmount,
      budgetCurrency: payload.budgetCurrency,
      budgetLabel: payload.budget,
      allowOutOfZone: payload.allowOutOfZone,
      zone: payload.zone,
      awardedBidId: payload.awardedBidId ?? payload.awardedBid?.id ?? null,
      customer: payload.customer,
      awardedAt: payload.awardedAt,
      closedAt: payload.closedAt
    };
  });

  const summary = await computeSummary();

  return {
    jobs,
    pagination: {
      total: count,
      limit: paginationLimit,
      offset: paginationOffset
    },
    summary
  };
}

export async function getCustomJob(postId) {
  const post = await Post.findByPk(postId, { include: POST_INCLUDE_GRAPH });
  if (!post) {
    throw Object.assign(new Error('Custom job not found'), { statusCode: 404 });
  }
  return serialisePost(post);
}

export async function createCustomJob(payload, actorId) {
  const customer = await ensureCustomer(payload.customer ?? {});
  const zoneId = await verifyZone(payload.zoneId);
  const images = sanitiseImages(payload.images);
  const metadata = ensureMetadata(payload.metadata);
  const title = normaliseString(payload.title, { maxLength: 160 });
  if (!title) {
    throw Object.assign(new Error('Title is required'), { statusCode: 422 });
  }
  const category = normaliseString(payload.category, { maxLength: 120 }) ?? 'custom-job';
  const job = await Post.create({
    userId: customer.id,
    title,
    description: normaliseString(payload.description, { maxLength: 4000 }),
    budget: normaliseString(payload.budgetLabel, { maxLength: 160 }),
    budgetAmount: parseAmount(payload.budgetAmount),
    budgetCurrency: parseCurrency(payload.budgetCurrency),
    category,
    categoryOther: normaliseString(payload.categoryOther, { maxLength: 120 }),
    images,
    metadata: { ...metadata, workflow: 'custom-job', source: metadata.source ?? 'admin-console' },
    location: normaliseString(payload.location, { maxLength: 240 }),
    zoneId,
    allowOutOfZone: payload.allowOutOfZone === true,
    bidDeadline: parseDate(payload.bidDeadline, 'bidDeadline'),
    internalNotes: normaliseString(payload.internalNotes, { maxLength: 4000 }),
    awardedBy: null,
    awardedAt: null,
    awardedBidId: null,
    closedAt: null
  });

  const created = await Post.findByPk(job.id, { include: POST_INCLUDE_GRAPH });
  const serialised = serialisePost(created);
  return { ...serialised, createdBy: actorId }; // include actor for auditing context
}

export async function updateCustomJob(postId, payload, actorId) {
  return sequelize.transaction(async (transaction) => {
    const post = await Post.findByPk(postId, { include: [{ model: CustomJobBid, as: 'bids' }], transaction, lock: transaction.LOCK.UPDATE });
    if (!post) {
      throw Object.assign(new Error('Custom job not found'), { statusCode: 404 });
    }

    const updates = {};

    if (payload.title !== undefined) updates.title = normaliseString(payload.title, { maxLength: 160 });
    if (payload.description !== undefined)
      updates.description = normaliseString(payload.description, { maxLength: 4000 });
    if (payload.budgetLabel !== undefined) updates.budget = normaliseString(payload.budgetLabel, { maxLength: 160 });
    if (payload.budgetAmount !== undefined) updates.budgetAmount = parseAmount(payload.budgetAmount);
    if (payload.budgetCurrency !== undefined) updates.budgetCurrency = parseCurrency(payload.budgetCurrency);
    if (payload.category !== undefined)
      updates.category = normaliseString(payload.category, { maxLength: 120 }) ?? 'custom-job';
    if (payload.categoryOther !== undefined)
      updates.categoryOther = normaliseString(payload.categoryOther, { maxLength: 120 });
    if (payload.metadata !== undefined) {
      const nextMetadata = ensureMetadata(payload.metadata);
      updates.metadata = {
        ...post.metadata,
        ...nextMetadata,
        workflow: 'custom-job',
        source: post.metadata?.source ?? nextMetadata.source ?? 'admin-console'
      };
    }
    if (payload.images !== undefined) updates.images = sanitiseImages(payload.images);
    if (payload.location !== undefined) updates.location = normaliseString(payload.location, { maxLength: 240 });
    if (payload.allowOutOfZone !== undefined) updates.allowOutOfZone = Boolean(payload.allowOutOfZone);
    if (payload.bidDeadline !== undefined)
      updates.bidDeadline = parseDate(payload.bidDeadline, 'bidDeadline');
    if (payload.internalNotes !== undefined)
      updates.internalNotes = normaliseString(payload.internalNotes, { maxLength: 4000 });

    if (payload.zoneId !== undefined) {
      updates.zoneId = await verifyZone(payload.zoneId);
    }

    if (payload.status !== undefined) {
      if (!ALLOWED_STATUSES.has(payload.status)) {
        throw Object.assign(new Error('Unsupported status'), { statusCode: 422 });
      }
      updates.status = payload.status;
      if (payload.status === 'open') {
        updates.awardedBidId = null;
        updates.awardedAt = null;
        updates.awardedBy = null;
        updates.closedAt = null;
        await CustomJobBid.update(
          { status: 'pending' },
          { where: { postId, status: { [Op.in]: ['accepted', 'rejected'] } }, transaction }
        );
      }
      if (payload.status === 'completed' || payload.status === 'cancelled') {
        updates.closedAt = payload.closedAt ? parseDate(payload.closedAt, 'closedAt') : new Date();
      }
    }

    if (payload.customer) {
      const customer = await ensureCustomer(payload.customer);
      updates.userId = customer.id;
    }

    await post.update(updates, { transaction });

    const refreshed = await Post.findByPk(postId, { include: POST_INCLUDE_GRAPH, transaction });
    return serialisePost(refreshed);
  });
}

export async function awardCustomJob(postId, bidId, actorId) {
  return sequelize.transaction(async (transaction) => {
    const post = await Post.findByPk(postId, {
      include: [
        {
          model: CustomJobBid,
          as: 'bids',
          include: [{ model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName', 'type'] }]
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!post) {
      throw Object.assign(new Error('Custom job not found'), { statusCode: 404 });
    }

    const winningBid = post.bids?.find((entry) => entry.id === bidId);
    if (!winningBid) {
      throw Object.assign(new Error('Bid not found for this job'), { statusCode: 404 });
    }

    await Promise.all([
      CustomJobBid.update({ status: 'accepted' }, { where: { id: bidId }, transaction }),
      CustomJobBid.update(
        { status: 'rejected' },
        {
          where: {
            postId,
            id: { [Op.ne]: bidId },
            status: { [Op.in]: ['pending', 'accepted'] }
          },
          transaction
        }
      )
    ]);

    await post.update(
      {
        status: 'assigned',
        awardedBidId: bidId,
        awardedBy: actorId ?? post.awardedBy,
        awardedAt: new Date(),
        closedAt: null
      },
      { transaction }
    );

    const refreshed = await Post.findByPk(postId, { include: POST_INCLUDE_GRAPH, transaction });
    return serialisePost(refreshed);
  });
}

export async function addBidMessage(postId, bidId, authorId, body, attachments) {
  if (!authorId) {
    throw Object.assign(new Error('Authenticated author required'), { statusCode: 401 });
  }
  const messageBody = normaliseString(body, { maxLength: 2000 });
  if (!messageBody) {
    throw Object.assign(new Error('Message body is required'), { statusCode: 422 });
  }

  return sequelize.transaction(async (transaction) => {
    const post = await Post.findByPk(postId, {
      include: [{ model: CustomJobBid, as: 'bids', include: [{ model: CustomJobBidMessage, as: 'messages' }] }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!post) {
      throw Object.assign(new Error('Custom job not found'), { statusCode: 404 });
    }

    const bid = post.bids?.find((entry) => entry.id === bidId);
    if (!bid) {
      throw Object.assign(new Error('Bid not found for this job'), { statusCode: 404 });
    }

    const created = await CustomJobBidMessage.create(
      {
        bidId,
        authorId,
        authorRole: 'admin',
        body: messageBody,
        attachments: sanitiseAttachments(attachments)
      },
      { transaction }
    );

    const message = await CustomJobBidMessage.findByPk(created.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }],
      transaction
    });

    return serialiseBid({ ...bid.toJSON(), messages: [...(bid.messages ?? []), message.toJSON()] });
  });
}

export async function getCustomJobOperationalSnapshot({ rangeStart = null, rangeEnd = null } = {}) {
  const [summary, latestJob, createdInWindow] = await Promise.all([
    computeSummary(),
    Post.findOne({
      where: { category: 'custom-job' },
      attributes: ['id', 'title', 'status', 'updatedAt'],
      order: [['updatedAt', 'DESC']]
    }),
    rangeStart && rangeEnd
      ? Post.count({
          where: {
            category: 'custom-job',
            createdAt: { [Op.between]: [rangeStart, rangeEnd] }
          }
        })
      : Promise.resolve(0)
  ]);

  return {
    ...summary,
    createdInWindow,
    latestUpdate: latestJob
      ? {
          id: latestJob.id,
          title: latestJob.title,
          status: latestJob.status,
          updatedAt: latestJob.updatedAt?.toISOString() ?? null
        }
      : null
  };
}

export default {
  listCustomJobs,
  getCustomJob,
  createCustomJob,
  updateCustomJob,
  awardCustomJob,
  addBidMessage,
  getCustomJobOperationalSnapshot
};
