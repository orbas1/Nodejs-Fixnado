import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  CustomJobBid,
  CustomJobBidMessage,
  CustomJobReport,
  Post,
  ProviderContact,
  ServiceZone,
  User
} from '../models/index.js';
import CustomJobInvitation, {
  INVITATION_STATUSES,
  INVITATION_TARGETS
} from '../models/customJobInvitation.js';
import { resolveCompanyForActor } from './panelService.js';
import { submitCustomJobBid, addCustomJobBidMessage } from './feedService.js';

const PROVIDER_CUSTOM_JOB_INTERNAL_NOTE = 'provider:custom-job-managed';

function coerceNumber(value, fallback = null) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normaliseAttachments(attachments = []) {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }
      const url = typeof attachment.url === 'string' ? attachment.url.trim() : '';
      if (!url) {
        return null;
      }
      const label = typeof attachment.label === 'string' ? attachment.label.trim() : null;
      return { url, label };
    })
    .filter(Boolean)
    .slice(0, 5);
}

function serialiseActor(actor) {
  if (!actor) {
    return null;
  }

  const fullName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();

  return {
    id: actor.id,
    name: fullName || actor.displayName || null,
    role: actor.type || actor.role || null
  };
}

function serialiseInvitation(invitation) {
  if (!invitation) {
    return null;
  }

  const creator = serialiseActor(invitation.creator);
  const target = serialiseActor(invitation.target);

  return {
    id: invitation.id,
    postId: invitation.postId,
    companyId: invitation.companyId,
    targetType: invitation.targetType,
    targetId: invitation.targetId || null,
    targetHandle: invitation.targetHandle || target?.name || null,
    targetEmail: invitation.targetEmail || null,
    status: invitation.status,
    respondedAt: invitation.respondedAt ? DateTime.fromJSDate(invitation.respondedAt).toISO() : null,
    createdAt: invitation.createdAt ? DateTime.fromJSDate(invitation.createdAt).toISO() : null,
    updatedAt: invitation.updatedAt ? DateTime.fromJSDate(invitation.updatedAt).toISO() : null,
    metadata: invitation.metadata || {},
    creator,
    target,
    job: invitation.job
      ? {
          id: invitation.job.id,
          title: invitation.job.title,
          status: invitation.job.status
        }
      : null
  };
}

function sanitiseString(value, maxLength) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    if (typeof value === 'number' || typeof value === 'bigint') {
      return sanitiseString(String(value), maxLength);
    }
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function normaliseInvitationPayload(invitation = {}) {
  const targetType = INVITATION_TARGETS.includes(invitation.type)
    ? invitation.type
    : INVITATION_TARGETS.includes(invitation.targetType)
    ? invitation.targetType
    : 'user';
  const targetHandle =
    sanitiseString(invitation.handle, 160) ||
    sanitiseString(invitation.targetHandle, 160) ||
    sanitiseString(invitation.accountHandle, 160);
  const targetEmail =
    sanitiseString(invitation.email, 255) ||
    sanitiseString(invitation.targetEmail, 255);
  const note = sanitiseString(invitation.note, 500) || sanitiseString(invitation.notes, 500);
  const metadata = {
    ...(invitation.metadata && typeof invitation.metadata === 'object' ? invitation.metadata : {})
  };
  if (invitation.contactId) {
    metadata.contactId = invitation.contactId;
  }
  if (note) {
    metadata.note = note;
  }

  return {
    targetType,
    targetId: invitation.targetId || invitation.userId || null,
    targetHandle: targetHandle || null,
    targetEmail: targetEmail || null,
    metadata
  };
}

async function createInvitationsForJob({ invites = [], job, company, actor }) {
  if (!Array.isArray(invites) || invites.length === 0) {
    return [];
  }

  let payloads = invites.map(normaliseInvitationPayload);

  const contactIdsToResolve = Array.from(
    new Set(
      payloads
        .filter(
          (entry) =>
            entry?.metadata?.contactId && !entry.targetHandle && !entry.targetEmail && !entry.targetId
        )
        .map((entry) => entry.metadata.contactId)
        .filter(Boolean)
    )
  );

  if (contactIdsToResolve.length) {
    const contacts = await ProviderContact.findAll({
      where: { id: contactIdsToResolve, companyId: company.id },
      attributes: ['id', 'name', 'email']
    });
    const contactMap = new Map(
      contacts.map((contact) => {
        const plain = typeof contact.get === 'function' ? contact.get({ plain: true }) : contact;
        return [plain.id, plain];
      })
    );

    payloads = payloads.map((entry) => {
      if (entry?.metadata?.contactId && !entry.targetHandle && !entry.targetEmail && !entry.targetId) {
        const contact = contactMap.get(entry.metadata.contactId);
        if (contact) {
          const inferredHandle = sanitiseString(contact.name, 160) || sanitiseString(contact.email, 255) || contact.id;
          return {
            ...entry,
            targetHandle: inferredHandle || entry.targetHandle,
            targetEmail: entry.targetEmail || sanitiseString(contact.email, 255) || null
          };
        }
      }
      return entry;
    });
  }

  payloads = payloads.filter((entry) => entry.targetHandle || entry.targetEmail || entry.targetId);

  if (payloads.length === 0) {
    return [];
  }

  const createdIds = [];
  for (const entry of payloads) {
    const created = await CustomJobInvitation.create({
      postId: job.id,
      companyId: company.id,
      createdBy: actor.id,
      targetId: entry.targetId,
      targetType: entry.targetType,
      targetHandle: entry.targetHandle,
      targetEmail: entry.targetEmail,
      metadata: entry.metadata
    });
    createdIds.push(created.id);
  }

  if (!createdIds.length) {
    return [];
  }

  const reloaded = await CustomJobInvitation.findAll({
    where: { id: createdIds },
    include: [
      { model: Post, as: 'job', attributes: ['id', 'title', 'status'] },
      { model: User, as: 'target', attributes: ['id', 'firstName', 'lastName', 'type'] },
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'type'] }
    ]
  });

  return reloaded.map((record) => serialiseInvitation(record.get({ plain: true })));
}

function buildJobIncludes() {
  return [
    { model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'companyId'] },
    {
      model: CustomJobInvitation,
      as: 'invitations',
      include: [
        { model: User, as: 'target', attributes: ['id', 'firstName', 'lastName', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'type'] }
      ]
    },
    { model: User, attributes: ['id', 'firstName', 'lastName', 'type'], required: false }
  ];
}

async function ensureZoneBelongsToCompany(zoneId, companyId) {
  if (!zoneId) {
    return null;
  }
  const zone = await ServiceZone.findOne({ where: { id: zoneId, companyId } });
  if (!zone) {
    const error = new Error('Selected service zone is not available for this provider');
    error.statusCode = 404;
    throw error;
  }
  return zone;
}

function parseIsoDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = DateTime.fromISO(String(value));
  return parsed.isValid ? parsed.toJSDate() : null;
}

function serialiseMessage(message) {
  if (!message) return null;
  const author = message.author
    ? {
        id: message.author.id,
        name: [message.author.firstName, message.author.lastName].filter(Boolean).join(' ') || null,
        role: message.author.type || message.authorRole || null
      }
    : null;
  return {
    id: message.id,
    bidId: message.bidId,
    body: message.body,
    attachments: Array.isArray(message.attachments) ? message.attachments : [],
    author,
    authorRole: message.authorRole || author?.role || null,
    createdAt: message.createdAt ? DateTime.fromJSDate(message.createdAt).toISO() : null
  };
}

function serialiseBid(bid) {
  if (!bid) return null;
  const messages = Array.isArray(bid.messages) ? bid.messages.map(serialiseMessage).filter(Boolean) : [];
  const sortedMessages = messages.slice().sort((a, b) => {
    const timeA = a?.createdAt ? DateTime.fromISO(a.createdAt).toMillis() : 0;
    const timeB = b?.createdAt ? DateTime.fromISO(b.createdAt).toMillis() : 0;
    return timeB - timeA;
  });
  const lastMessage = sortedMessages[0] || null;
  return {
    id: bid.id,
    status: bid.status,
    amount: coerceNumber(bid.amount),
    currency: bid.currency,
    message: bid.message || null,
    createdAt: bid.createdAt ? DateTime.fromJSDate(bid.createdAt).toISO() : null,
    updatedAt: bid.updatedAt ? DateTime.fromJSDate(bid.updatedAt).toISO() : null,
    job: bid.job
      ? {
          id: bid.job.id,
          title: bid.job.title,
          category: bid.job.category || bid.job.categoryOther || null,
          budgetLabel: bid.job.budget,
          budgetAmount: coerceNumber(bid.job.budgetAmount),
          budgetCurrency: bid.job.budgetCurrency,
          status: bid.job.status,
          deadline: bid.job.bidDeadline ? DateTime.fromJSDate(bid.job.bidDeadline).toISO() : null,
          zone: bid.job.zone
            ? { id: bid.job.zone.id, name: bid.job.zone.name }
            : null
        }
      : null,
    messageCount: messages.length,
    lastMessage,
    messages,
    canEdit: bid.status === 'pending',
    canWithdraw: ['pending'].includes(bid.status)
  };
}

function serialisePost(post) {
  if (!post) return null;
  const images = Array.isArray(post.images)
    ? post.images
        .filter((value) => typeof value === 'string' && value.trim())
        .slice(0, 6)
        .map((url, index) => ({ id: `${post.id}-media-${index}`, url }))
    : [];
  const invitations = Array.isArray(post.invitations)
    ? post.invitations.map((invitation) => serialiseInvitation(invitation)).filter(Boolean)
    : [];
  return {
    id: post.id,
    title: post.title,
    description: post.description || null,
    budgetLabel: post.budget || null,
    budgetAmount: coerceNumber(post.budgetAmount),
    budgetCurrency: post.budgetCurrency,
    category: post.category || post.categoryOther || null,
    tags: Array.isArray(post.metadata?.tags) ? post.metadata.tags : [],
    location: post.location || null,
    zone: post.zone ? { id: post.zone.id, name: post.zone.name } : null,
    allowOutOfZone: Boolean(post.allowOutOfZone),
    bidDeadline: post.bidDeadline ? DateTime.fromJSDate(post.bidDeadline).toISO() : null,
    createdAt: post.createdAt ? DateTime.fromJSDate(post.createdAt).toISO() : null,
    status: post.status,
    metadata: post.metadata || {},
    media: images,
    invitations,
    owner: post.user ? serialiseActor(post.user) : null
  };
}

function serialiseReport(report) {
  if (!report) return null;
  return {
    id: report.id,
    name: report.name,
    filters: report.filters || {},
    metrics: report.metrics || {},
    createdAt: report.createdAt ? DateTime.fromJSDate(report.createdAt).toISO() : null,
    updatedAt: report.updatedAt ? DateTime.fromJSDate(report.updatedAt).toISO() : null
  };
}

function buildSearchWhere({
  zoneIds,
  actorId,
  filters
}) {
  const where = {
    status: 'open',
    [Op.not]: { userId: actorId }
  };

  const orConditions = [{ zoneId: { [Op.in]: zoneIds } }, { zoneId: { [Op.is]: null } }];
  if (!filters || filters.includeOutOfZone !== false) {
    orConditions.push({ allowOutOfZone: true });
  }
  where[Op.and] = [{ [Op.or]: orConditions }];

  if (filters?.zoneId) {
    where.zoneId = filters.zoneId;
  }

  if (filters?.category) {
    where[Op.and].push({
      [Op.or]: [
        { category: filters.category },
        { categoryOther: filters.category }
      ]
    });
  }

  const search = typeof filters?.search === 'string' ? filters.search.trim() : '';
  if (search) {
    const likeOperator = Op.iLike || Op.like;
    where[Op.and].push({
      [Op.or]: [
        { title: { [likeOperator]: `%${search}%` } },
        { description: { [likeOperator]: `%${search}%` } }
      ]
    });
  }

  return where;
}

function calculateSummary({ jobs = [], bids = [], managedJobs = [], invitations = [] }) {
  const totalOpenJobs = jobs.length;
  const totalBids = bids.length;
  const activeBids = bids.filter((bid) => bid.status === 'pending').length;
  const awardedBids = bids.filter((bid) => bid.status === 'accepted').length;
  const pendingValue = bids
    .filter((bid) => bid.status === 'pending')
    .reduce((sum, bid) => sum + (coerceNumber(bid.amount, 0) || 0), 0);
  const awardedValue = bids
    .filter((bid) => bid.status === 'accepted')
    .reduce((sum, bid) => sum + (coerceNumber(bid.amount, 0) || 0), 0);
  const respondedThreads = bids.filter((bid) => (bid.messages || []).length > 0).length;
  const responseRate = totalBids ? respondedThreads / totalBids : 0;
  const winRate = totalBids ? awardedBids / totalBids : 0;
  const managedJobCount = managedJobs.length;
  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending').length;
  const acceptedInvitations = invitations.filter((invitation) => invitation.status === 'accepted').length;

  return {
    totalOpenJobs,
    totalBids,
    activeBids,
    awardedBids,
    pendingValue,
    awardedValue,
    responseRate,
    winRate,
    managedJobs: managedJobCount,
    pendingInvitations,
    acceptedInvitations
  };
}

function deriveFilters({ jobs = [], managedJobs = [], zones = [] }) {
  const combinedJobs = [...jobs, ...managedJobs];
  const categories = Array.from(
    new Set(
      combinedJobs
        .map((job) => job.category)
        .filter((value) => typeof value === 'string' && value.trim())
    )
  ).map((value) => ({ value, label: value }));

  const zoneOptions = zones.map((zone) => ({ value: zone.id, label: zone.name }));

  return { categories, zones: zoneOptions };
}

function computeReportMetrics({ bids = [], filters = {} }) {
  const filtered = bids.filter((bid) => {
    if (filters.status && bid.status !== filters.status) {
      return false;
    }
    if (filters.zoneId && bid.job?.zone?.id !== filters.zoneId) {
      return false;
    }
    if (filters.category && bid.job?.category !== filters.category) {
      return false;
    }
    return true;
  });

  return calculateSummary({ bids: filtered });
}

export async function getProviderCustomJobWorkspace({ companyId, actor, filters = {} } = {}) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  const zoneRecords = await ServiceZone.findAll({
    where: { companyId: company.id },
    attributes: ['id', 'name'],
    order: [['name', 'ASC']]
  });
  const zoneIds = zoneRecords.map((zone) => zone.id);

  const where = buildSearchWhere({ zoneIds, actorId: actorRecord.id, filters });

  const [jobs, bids, reports, managedJobRecords, invitationRecords, rosterRecords] = await Promise.all([
    Post.findAll({
      where,
      include: buildJobIncludes(),
      order: [['createdAt', 'DESC']],
      limit: 20
    }),
    CustomJobBid.findAll({
      where: { companyId: company.id },
      include: [
        {
          model: Post,
          as: 'job',
          include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name'] }]
        },
        {
          model: CustomJobBidMessage,
          as: 'messages',
          separate: true,
          order: [['createdAt', 'ASC']],
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }]
        }
      ],
      order: [['updatedAt', 'DESC']]
    }),
    CustomJobReport.findAll({
      where: { companyId: company.id },
      order: [['updatedAt', 'DESC']]
    }),
    Post.findAll({
      where: {
        userId: actorRecord.id,
        internalNotes: PROVIDER_CUSTOM_JOB_INTERNAL_NOTE
      },
      include: buildJobIncludes(),
      order: [['createdAt', 'DESC']],
      limit: 25
    }),
    CustomJobInvitation.findAll({
      where: { companyId: company.id },
      include: [
        { model: Post, as: 'job', attributes: ['id', 'title', 'status'] },
        { model: User, as: 'target', attributes: ['id', 'firstName', 'lastName', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'type'] }
      ],
      order: [['createdAt', 'DESC']]
    }),
    ProviderContact.findAll({
      where: { companyId: company.id },
      attributes: ['id', 'name', 'role', 'email', 'phone', 'type', 'avatarUrl'],
      order: [['name', 'ASC']]
    })
  ]);

  const jobPayload = jobs.map((job) => serialisePost(job.get({ plain: true })));
  const bidPayload = bids.map((bid) => serialiseBid(bid.get({ plain: true })));
  const managedJobPayload = managedJobRecords.map((job) => serialisePost(job.get({ plain: true })));
  const invitationPayload = invitationRecords.map((invitation) => serialiseInvitation(invitation.get({ plain: true })));
  const rosterPayload = rosterRecords.map((contact) => ({
    id: contact.id,
    name: contact.name,
    role: contact.role,
    email: contact.email,
    phone: contact.phone,
    type: contact.type,
    avatarUrl: contact.avatarUrl
  }));

  const summary = calculateSummary({
    jobs: jobPayload,
    bids: bidPayload,
    managedJobs: managedJobPayload,
    invitations: invitationPayload
  });
  const derivedFilters = deriveFilters({
    jobs: jobPayload,
    managedJobs: managedJobPayload,
    zones: zoneRecords.map((zone) => zone.get({ plain: true }))
  });

  const reportPayload = reports.map((report) => {
    const plain = report.get({ plain: true });
    const metrics = computeReportMetrics({ bids: bidPayload, filters: plain.filters || {} });
    return serialiseReport({ ...plain, metrics });
  });

  const communications = bidPayload.map((bid) => ({
    bidId: bid.id,
    jobId: bid.job?.id ?? null,
    jobTitle: bid.job?.title ?? null,
    status: bid.status,
    lastMessage: bid.lastMessage,
    messages: bid.messages,
    participants: bid.messages
      .map((message) => message.author)
      .filter((author) => author && author.id)
      .reduce((acc, author) => {
        if (acc.find((entry) => entry.id === author.id)) {
          return acc;
        }
        acc.push(author);
        return acc;
      }, [])
  }));

  return {
    data: {
      company: {
        id: company.id,
        tradingName: company.contactName || company.User?.firstName || 'Provider',
        region: company.serviceRegions || null
      },
      summary,
      jobs: jobPayload,
      managedJobs: managedJobPayload,
      bids: bidPayload,
      invitations: invitationPayload,
      reports: reportPayload,
      communications: { threads: communications },
      filters: derivedFilters,
      resources: {
        roster: rosterPayload
      },
      permissions: {
        canSubmitBids: true,
        canMessage: true,
        canManageReports: true,
        canManageCustomJobs: true
      }
    },
    meta: {
      generatedAt: DateTime.now().toISO()
    }
  };
}

export async function searchProviderCustomJobOpportunities({ companyId, actor, filters = {}, pagination = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  const zoneRecords = await ServiceZone.findAll({ where: { companyId: company.id }, attributes: ['id'] });
  const zoneIds = zoneRecords.map((zone) => zone.id);
  const where = buildSearchWhere({ zoneIds, actorId: actorRecord.id, filters });

  const limit = Math.min(Math.max(Number.parseInt(pagination.limit, 10) || 20, 1), 100);
  const offset = Math.max(Number.parseInt(pagination.offset, 10) || 0, 0);

  const { rows, count } = await Post.findAndCountAll({
    where,
    include: buildJobIncludes(),
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    jobs: rows.map((row) => serialisePost(row.get({ plain: true }))),
    pagination: {
      total: count,
      limit,
      offset
    }
  };
}

export async function createProviderCustomJob({ companyId, actor, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });

  const title = sanitiseString(payload.title, 160);
  if (!title) {
    const error = new Error('A job title is required');
    error.statusCode = 422;
    throw error;
  }

  const zoneId = sanitiseString(payload.zoneId, 64) || null;
  await ensureZoneBelongsToCompany(zoneId, company.id);

  const attachments = normaliseAttachments(payload.attachments);
  const metadata = {
    ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
    customJobType: 'provider-managed',
    attachments,
    targeting: {
      allowOpenBidding: payload.allowOpenBidding !== false,
      inviteOnly: Array.isArray(payload.invites) && payload.invites.length > 0,
      inviteMessage: sanitiseString(payload.inviteMessage || payload.message, 500) || null
    }
  };

  const job = await Post.create({
    userId: company.userId || actorRecord.id,
    title,
    description: sanitiseString(payload.description, 5000),
    budget: sanitiseString(payload.budgetLabel, 160),
    budgetAmount:
      payload.budgetAmount !== undefined && payload.budgetAmount !== null
        ? coerceNumber(payload.budgetAmount, null)
        : null,
    budgetCurrency: sanitiseString(payload.currency || payload.budgetCurrency, 3) || 'GBP',
    category: sanitiseString(payload.category, 120) || 'provider_custom_job',
    categoryOther: sanitiseString(payload.categoryOther, 120),
    metadata,
    location: sanitiseString(payload.location, 200),
    zoneId,
    allowOutOfZone: Boolean(payload.allowOutOfZone),
    bidDeadline: parseIsoDate(payload.bidDeadline),
    status: sanitiseString(payload.status, 20) || 'open',
    images: attachments.map((attachment) => attachment.url),
    internalNotes: PROVIDER_CUSTOM_JOB_INTERNAL_NOTE
  });

  await createInvitationsForJob({ invites: payload.invites || [], job, company, actor: actorRecord });

  const reloaded = await Post.findByPk(job.id, { include: buildJobIncludes() });
  if (!reloaded) {
    return serialisePost(job.get({ plain: true }));
  }

  return serialisePost(reloaded.get({ plain: true }));
}

export async function inviteProviderCustomJobParticipant({ companyId, actor, postId, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  if (!postId) {
    const error = new Error('A job id is required to send an invitation');
    error.statusCode = 422;
    throw error;
  }

  const job = await Post.findOne({ where: { id: postId }, include: buildJobIncludes() });
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  if (job.userId !== actorRecord.id && job.internalNotes !== PROVIDER_CUSTOM_JOB_INTERNAL_NOTE) {
    const error = new Error('You are not allowed to manage invitations for this job');
    error.statusCode = 403;
    throw error;
  }

  const invitations = await createInvitationsForJob({ invites: [payload], job, company, actor: actorRecord });
  if (!invitations.length) {
    const error = new Error('Invitation details are required');
    error.statusCode = 422;
    throw error;
  }

  return invitations[0];
}

export async function updateProviderCustomJobInvitation({ companyId, actor, invitationId, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  if (!invitationId) {
    const error = new Error('An invitation id is required');
    error.statusCode = 422;
    throw error;
  }

  const invitation = await CustomJobInvitation.findOne({
    where: { id: invitationId, companyId: company.id },
    include: [
      { model: Post, as: 'job', attributes: ['id', 'title', 'status', 'userId', 'internalNotes'] },
      { model: User, as: 'target', attributes: ['id', 'firstName', 'lastName', 'type'] },
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'type'] }
    ]
  });

  if (!invitation) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    invitation.job &&
    invitation.job.userId &&
    invitation.job.userId !== actorRecord.id &&
    invitation.job.internalNotes !== PROVIDER_CUSTOM_JOB_INTERNAL_NOTE
  ) {
    const error = new Error('You are not allowed to update this invitation');
    error.statusCode = 403;
    throw error;
  }

  const updates = {};
  if (payload.status) {
    const nextStatus = sanitiseString(payload.status, 20);
    if (!INVITATION_STATUSES.includes(nextStatus)) {
      const error = new Error('Invalid invitation status');
      error.statusCode = 422;
      throw error;
    }
    if (nextStatus !== invitation.status) {
      updates.status = nextStatus;
      if (['accepted', 'declined', 'cancelled'].includes(nextStatus)) {
        updates.respondedAt = new Date();
      } else if (nextStatus === 'pending') {
        updates.respondedAt = null;
      }
    }
  }

  if (Object.hasOwn(payload, 'targetId')) {
    updates.targetId = payload.targetId || null;
  }

  const handle = sanitiseString(payload.targetHandle || payload.handle, 160);
  if (payload.targetHandle !== undefined || payload.handle !== undefined) {
    updates.targetHandle = handle;
  }

  const email = sanitiseString(payload.targetEmail || payload.email, 255);
  if (payload.targetEmail !== undefined || payload.email !== undefined) {
    updates.targetEmail = email;
  }

  const note = sanitiseString(payload.note || payload.notes, 500);
  const metadata = { ...(invitation.metadata || {}) };
  let metadataChanged = false;
  if (payload.contactId !== undefined) {
    if (payload.contactId) {
      metadata.contactId = payload.contactId;
    } else {
      delete metadata.contactId;
    }
    metadataChanged = true;
  }
  if (payload.note !== undefined || payload.notes !== undefined) {
    if (note) {
      metadata.note = note;
    } else {
      delete metadata.note;
    }
    metadataChanged = true;
  }
  if (metadataChanged) {
    updates.metadata = metadata;
  }

  if (Object.keys(updates).length === 0) {
    return serialiseInvitation(invitation.get({ plain: true }));
  }

  await invitation.update(updates, { userId: actorRecord.id });
  await invitation.reload({
    include: [
      { model: Post, as: 'job', attributes: ['id', 'title', 'status', 'userId', 'internalNotes'] },
      { model: User, as: 'target', attributes: ['id', 'firstName', 'lastName', 'type'] },
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'type'] }
    ]
  });

  return serialiseInvitation(invitation.get({ plain: true }));
}

export async function submitProviderCustomJobBid({ companyId, actor, postId, payload = {} }) {
  const { actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  if (!postId) {
    throw new Error('A postId is required to submit a bid');
  }

  const providerRole = actorRecord.type || 'company';
  const attachments = normaliseAttachments(payload.attachments);

  const result = await submitCustomJobBid({
    postId,
    providerId: actorRecord.id,
    providerRole,
    actorContext: { actorId: actorRecord.id, role: providerRole, persona: 'provider' },
    amount: payload.amount,
    currency: payload.currency,
    message: payload.message,
    attachments
  });

  return result;
}

export async function updateProviderCustomJobBid({ companyId, actor, bidId, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  if (!bidId) {
    throw new Error('A bidId is required to update a bid');
  }

  const bidInstance = await CustomJobBid.findOne({
    where: { id: bidId, companyId: company.id },
    include: [
      {
        model: Post,
        as: 'job',
        include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name'] }]
      },
      {
        model: CustomJobBidMessage,
        as: 'messages',
        separate: true,
        order: [['createdAt', 'ASC']],
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }]
      }
    ]
  });

  if (!bidInstance) {
    const error = new Error('Bid not found');
    error.statusCode = 404;
    throw error;
  }

  if (bidInstance.status !== 'pending') {
    const error = new Error('Only pending bids can be updated');
    error.statusCode = 409;
    throw error;
  }

  const updates = {};
  if (payload.amount !== undefined) {
    updates.amount = payload.amount === null || payload.amount === '' ? null : coerceNumber(payload.amount, null);
  }
  if (payload.currency) {
    updates.currency = payload.currency;
  }
  if (payload.message !== undefined) {
    updates.message = payload.message ? payload.message.trim() : null;
  }

  await bidInstance.update(updates, { userId: actorRecord.id });

  return serialiseBid(bidInstance.get({ plain: true }));
}

export async function withdrawProviderCustomJobBid({ companyId, actor, bidId }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  if (!bidId) {
    throw new Error('A bidId is required to withdraw a bid');
  }

  const bidInstance = await CustomJobBid.findOne({ where: { id: bidId, companyId: company.id } });
  if (!bidInstance) {
    const error = new Error('Bid not found');
    error.statusCode = 404;
    throw error;
  }

  if (bidInstance.status === 'withdrawn') {
    return serialiseBid(bidInstance.get({ plain: true }));
  }

  await bidInstance.update({ status: 'withdrawn' }, { userId: actorRecord.id });
  const reloaded = await CustomJobBid.findByPk(bidId, {
    include: [
      { model: Post, as: 'job', include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name'] }] },
      {
        model: CustomJobBidMessage,
        as: 'messages',
        separate: true,
        order: [['createdAt', 'ASC']],
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'type'] }]
      }
    ]
  });

  return serialiseBid(reloaded.get({ plain: true }));
}

export async function addProviderCustomJobBidMessage({ companyId, actor, bidId, postId, body, attachments }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  if (!bidId) {
    throw new Error('A bidId is required to send a message');
  }

  let resolvedPostId = postId;
  if (!resolvedPostId) {
    const bid = await CustomJobBid.findOne({ where: { id: bidId, companyId: company.id } });
    if (!bid) {
      const error = new Error('Bid not found');
      error.statusCode = 404;
      throw error;
    }
    resolvedPostId = bid.postId;
  }

  const result = await addCustomJobBidMessage({
    postId: resolvedPostId,
    bidId,
    authorId: actorRecord.id,
    authorRole: actorRecord.type || 'company',
    actorContext: { actorId: actorRecord.id, role: actorRecord.type || 'company', persona: 'provider' },
    body,
    attachments: normaliseAttachments(attachments)
  });

  return result;
}

export async function createProviderCustomJobReport({ companyId, actor, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    const error = new Error('Report name is required');
    error.statusCode = 422;
    throw error;
  }
  const filters = payload.filters && typeof payload.filters === 'object' ? payload.filters : {};

  const bids = await CustomJobBid.findAll({
    where: { companyId: company.id },
    include: [{ model: Post, as: 'job', include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name'] }] }]
  });
  const metrics = computeReportMetrics({ bids: bids.map((bid) => serialiseBid(bid.get({ plain: true }))), filters });

  const created = await CustomJobReport.create({
    companyId: company.id,
    name,
    filters,
    metrics,
    createdBy: actorRecord.id,
    updatedBy: actorRecord.id
  });

  return serialiseReport(created.get({ plain: true }));
}

export async function updateProviderCustomJobReport({ companyId, actor, reportId, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  if (!reportId) {
    throw new Error('A reportId is required to update a report');
  }

  const report = await CustomJobReport.findOne({ where: { id: reportId, companyId: company.id } });
  if (!report) {
    const error = new Error('Report not found');
    error.statusCode = 404;
    throw error;
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : null;
  const filters = payload.filters && typeof payload.filters === 'object' ? payload.filters : report.filters;
  const bids = await CustomJobBid.findAll({
    where: { companyId: company.id },
    include: [{ model: Post, as: 'job', include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name'] }] }]
  });
  const metrics = computeReportMetrics({ bids: bids.map((bid) => serialiseBid(bid.get({ plain: true }))), filters });

  await report.update(
    {
      name: name || report.name,
      filters,
      metrics,
      updatedBy: actorRecord.id
    },
    { userId: actorRecord.id }
  );

  return serialiseReport(report.get({ plain: true }));
}

export async function deleteProviderCustomJobReport({ companyId, actor, reportId }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  if (!reportId) {
    throw new Error('A reportId is required to delete a report');
  }
  const report = await CustomJobReport.findOne({ where: { id: reportId, companyId: company.id } });
  if (!report) {
    const error = new Error('Report not found');
    error.statusCode = 404;
    throw error;
  }
  await report.destroy();
  return { id: reportId, deleted: true };
}

export default {
  getProviderCustomJobWorkspace,
  searchProviderCustomJobOpportunities,
  createProviderCustomJob,
  submitProviderCustomJobBid,
  updateProviderCustomJobBid,
  withdrawProviderCustomJobBid,
  addProviderCustomJobBidMessage,
  inviteProviderCustomJobParticipant,
  updateProviderCustomJobInvitation,
  createProviderCustomJobReport,
  updateProviderCustomJobReport,
  deleteProviderCustomJobReport
};
