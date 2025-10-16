import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Escrow,
  EscrowMilestone,
  EscrowNote,
  Order,
  Service,
  User,
  Dispute,
  Region
} from '../models/index.js';
import { getPlatformSettings, updatePlatformSettings } from './platformSettingsService.js';

function validationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function parseAmount(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normaliseCurrency(value, fallback = 'GBP') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.toUpperCase();
}

function slugify(value, fallback = null) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const trimmed = `${value ?? ''}`.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function toStringList(value) {
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }
  if (typeof value === 'string') {
    return uniqueStrings(value.split(/\r?\n|;/));
  }
  return [];
}

function formatCurrency(amount, currency = 'GBP') {
  const numeric = Number.parseFloat(amount ?? 0);
  const safeAmount = Number.isFinite(numeric) ? numeric : 0;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 2
    }).format(safeAmount);
  } catch {
    return `${currency || 'GBP'} ${safeAmount.toFixed(2)}`;
  }
}

function serialiseEscrow(instance, { includeRelated = false } = {}) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  const amount = Number.parseFloat(plain.amount ?? 0);
  const base = {
    id: plain.id,
    status: plain.status,
    amount: Number.isFinite(amount) ? amount : 0,
    amountFormatted: formatCurrency(amount, plain.currency),
    currency: plain.currency,
    policyId: plain.policyId,
    requiresDualApproval: Boolean(plain.requiresDualApproval),
    autoReleaseAt: plain.autoReleaseAt,
    fundedAt: plain.fundedAt,
    releasedAt: plain.releasedAt,
    onHold: Boolean(plain.onHold),
    holdReason: plain.holdReason || null,
    externalReference: plain.externalReference || null,
    metadata: plain.metadata || {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    region: plain.region
      ? {
          id: plain.region.id,
          code: plain.region.code,
          name: plain.region.name
        }
      : null,
    disputes: Array.isArray(plain.Disputes)
      ? plain.Disputes.map((dispute) => ({
          id: dispute.id,
          status: dispute.status,
          reason: dispute.reason,
          createdAt: dispute.createdAt,
          updatedAt: dispute.updatedAt
        }))
      : []
  };

  if (plain.Order) {
    base.order = {
      id: plain.Order.id,
      status: plain.Order.status,
      totalAmount: Number.parseFloat(plain.Order.totalAmount ?? 0),
      currency: plain.Order.currency,
      scheduledFor: plain.Order.scheduledFor,
      service: plain.Order.Service
        ? {
            id: plain.Order.Service.id,
            title: plain.Order.Service.title
          }
        : null,
      buyer: plain.Order.buyer
        ? {
            id: plain.Order.buyer.id,
            firstName: plain.Order.buyer.firstName,
            lastName: plain.Order.buyer.lastName,
            email: plain.Order.buyer.email
          }
        : null
    };
  } else {
    base.order = null;
  }

  if (includeRelated) {
    base.milestones = Array.isArray(plain.milestones)
      ? plain.milestones
          .map((milestone) => ({
            id: milestone.id,
            label: milestone.label,
            status: milestone.status,
            sequence: milestone.sequence,
            amount: milestone.amount != null ? Number.parseFloat(milestone.amount) : null,
            dueAt: milestone.dueAt,
            completedAt: milestone.completedAt,
            evidenceUrl: milestone.evidenceUrl,
            createdAt: milestone.createdAt,
            updatedAt: milestone.updatedAt
          }))
          .sort((a, b) => a.sequence - b.sequence)
      : [];

    base.notes = Array.isArray(plain.notes)
      ? plain.notes
          .map((note) => ({
            id: note.id,
            authorId: note.authorId,
            body: note.body,
            pinned: Boolean(note.pinned),
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
  }

  return base;
}

function buildOrderInclude(searchTerm) {
  const include = {
    model: Order,
    attributes: ['id', 'status', 'serviceId', 'buyerId', 'totalAmount', 'currency', 'scheduledFor'],
    include: [
      {
        model: Service,
        attributes: ['id', 'title']
      },
      {
        model: User,
        as: 'buyer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ],
    required: Boolean(searchTerm)
  };

  if (searchTerm) {
    const likeValue = `%${searchTerm.toLowerCase()}%`;
    include.where = {
      [Op.or]: [
        sequelize.where(sequelize.fn('lower', sequelize.col('Order.id')), { [Op.like]: likeValue }),
        sequelize.where(sequelize.fn('lower', sequelize.col('Order->buyer.email')), { [Op.like]: likeValue }),
        sequelize.where(sequelize.fn('lower', sequelize.col('Order->buyer.first_name')), { [Op.like]: likeValue }),
        sequelize.where(sequelize.fn('lower', sequelize.col('Order->buyer.last_name')), { [Op.like]: likeValue }),
        sequelize.where(sequelize.fn('lower', sequelize.col('Order->Service.title')), { [Op.like]: likeValue })
      ]
    };
  }

  return include;
}

export async function listEscrows({
  status,
  policyId,
  onHold,
  search,
  page = 1,
  pageSize = 20
} = {}) {
  const trimmedSearch = typeof search === 'string' && search.trim() ? search.trim() : null;
  const parsedPage = Number.isFinite(Number(page)) ? Math.max(Number.parseInt(page, 10), 1) : 1;
  const parsedPageSize = Number.isFinite(Number(pageSize))
    ? Math.min(Math.max(Number.parseInt(pageSize, 10), 1), 100)
    : 20;

  const baseFilters = [];
  if (policyId) {
    baseFilters.push({ policyId });
  }
  if (typeof onHold === 'boolean') {
    baseFilters.push({ onHold });
  } else if (typeof onHold === 'string' && ['true', 'false'].includes(onHold.toLowerCase())) {
    baseFilters.push({ onHold: onHold.toLowerCase() === 'true' });
  }

  const searchFilters = [];
  if (trimmedSearch) {
    const likeValue = `%${trimmedSearch.toLowerCase()}%`;
    searchFilters.push(
      sequelize.where(sequelize.fn('lower', sequelize.col('Escrow.id')), { [Op.like]: likeValue }),
      sequelize.where(sequelize.fn('lower', sequelize.col('Escrow.external_reference')), { [Op.like]: likeValue }),
      sequelize.where(sequelize.fn('lower', sequelize.col('Escrow.policy_id')), { [Op.like]: likeValue })
    );
  }

  const queryFilters = [...baseFilters];
  if (status && status !== 'all') {
    queryFilters.push({ status });
  }
  if (searchFilters.length > 0) {
    queryFilters.push({ [Op.or]: searchFilters });
  }

  const where = queryFilters.length > 0 ? { [Op.and]: queryFilters } : {};
  const include = [
    buildOrderInclude(trimmedSearch),
    {
      model: Dispute,
      attributes: ['id', 'status', 'reason', 'createdAt', 'updatedAt'],
      required: false
    },
    {
      model: Region,
      as: 'region',
      attributes: ['id', 'code', 'name'],
      required: false
    }
  ];

  const { rows, count } = await Escrow.findAndCountAll({
    where,
    include,
    limit: parsedPageSize,
    offset: (parsedPage - 1) * parsedPageSize,
    order: [
      ['updatedAt', 'DESC'],
      ['createdAt', 'DESC']
    ],
    distinct: true
  });

  const settings = await getPlatformSettings();
  const escrowSettings = settings.escrow ?? {};

  const [totalAmount, holdCount, disputeCount, readyCount] = await Promise.all([
    Escrow.sum('amount', {
      where: baseFilters.length || searchFilters.length ? { [Op.and]: [...baseFilters, ...(searchFilters.length ? [{ [Op.or]: searchFilters }] : [])] } : {},
      include: [buildOrderInclude(trimmedSearch)]
    }).then((value) => Number.parseFloat(value ?? 0) || 0),
    Escrow.count({
      where: {
        [Op.and]: [
          ...baseFilters,
          ...(searchFilters.length ? [{ [Op.or]: searchFilters }] : []),
          { onHold: true }
        ]
      },
      include: [buildOrderInclude(trimmedSearch)],
      distinct: true
    }),
    Escrow.count({
      where: {
        [Op.and]: [
          ...baseFilters,
          ...(searchFilters.length ? [{ [Op.or]: searchFilters }] : []),
          { status: 'disputed' }
        ]
      },
      include: [buildOrderInclude(trimmedSearch)],
      distinct: true
    }),
    Escrow.count({
      where: {
        [Op.and]: [
          ...baseFilters,
          ...(searchFilters.length ? [{ [Op.or]: searchFilters }] : []),
          { status: 'funded' },
          { onHold: false }
        ]
      },
      include: [buildOrderInclude(trimmedSearch)],
      distinct: true
    })
  ]);

  const totalItems = Array.isArray(count) ? count.length : Number(count ?? 0);
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / parsedPageSize) : 1;

  return {
    items: rows.map((row) => serialiseEscrow(row)),
    pagination: {
      page: parsedPage,
      pageSize: parsedPageSize,
      totalItems,
      totalPages
    },
    summary: {
      totalAmount,
      totalAmountFormatted: formatCurrency(totalAmount, escrowSettings.allowedCurrencies?.[0] ?? 'GBP'),
      onHold: holdCount,
      disputed: disputeCount,
      readyForRelease: readyCount
    },
    filters: {
      statuses: ['pending', 'funded', 'released', 'disputed'],
      policies: Array.isArray(escrowSettings.releasePolicies) ? escrowSettings.releasePolicies : []
    },
    settings: escrowSettings
  };
}

export async function getEscrowById(id, { transaction } = {}) {
  if (!id) {
    throw validationError('Escrow id is required.');
  }

  const escrow = await Escrow.findByPk(id, {
    include: [
      buildOrderInclude(null),
      {
        model: Dispute,
        attributes: ['id', 'status', 'reason', 'createdAt', 'updatedAt'],
        required: false
      },
      {
        model: Region,
        as: 'region',
        attributes: ['id', 'code', 'name'],
        required: false
      },
      {
        model: EscrowMilestone,
        as: 'milestones',
        required: false
      },
      {
        model: EscrowNote,
        as: 'notes',
        required: false
      }
    ],
    transaction
  });

  if (!escrow) {
    throw validationError('Escrow not found.');
  }

  return serialiseEscrow(escrow, { includeRelated: true });
}

export async function createManualEscrow(payload = {}, actorId = 'system') {
  const amount = parseAmount(payload.amount, null);
  if (amount === null) {
    throw validationError('A numeric amount is required for manual escrows.');
  }
  if (!payload.orderId) {
    throw validationError('An existing orderId is required to seed an escrow.');
  }

  return sequelize.transaction(async (transaction) => {
    const existing = await Escrow.findOne({ where: { orderId: payload.orderId }, transaction });
    if (existing) {
      throw validationError('An escrow already exists for this order.');
    }

    const order = await Order.findByPk(payload.orderId, {
      include: [
        { model: Service, attributes: ['id', 'title'] },
        { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      transaction
    });

    if (!order) {
      throw validationError('Order not found.');
    }

    const escrow = await Escrow.create(
      {
        orderId: payload.orderId,
        amount,
        currency: normaliseCurrency(payload.currency || order.currency || 'GBP'),
        status: payload.status && ['pending', 'funded', 'released', 'disputed'].includes(payload.status)
          ? payload.status
          : 'pending',
        policyId: payload.policyId || null,
        requiresDualApproval: Boolean(payload.requiresDualApproval),
        autoReleaseAt: parseDate(payload.autoReleaseAt),
        onHold: Boolean(payload.onHold),
        holdReason: payload.onHold ? payload.holdReason || null : null,
        fundedAt: parseDate(payload.fundedAt),
        releasedAt: parseDate(payload.releasedAt),
        metadata: {
          createdBy: actorId,
          createdAt: new Date().toISOString(),
          source: 'manual'
        }
      },
      { transaction }
    );

    if (Array.isArray(payload.milestones)) {
      let sequence = 0;
      for (const milestone of payload.milestones) {
        if (!milestone || typeof milestone !== 'object') continue;
        const label = typeof milestone.label === 'string' && milestone.label.trim() ? milestone.label.trim() : null;
        if (!label) continue;
        sequence += 1;
        await EscrowMilestone.create(
          {
            escrowId: escrow.id,
            label,
            status: ['pending', 'submitted', 'approved', 'rejected'].includes(milestone.status)
              ? milestone.status
              : 'pending',
            sequence,
            amount: milestone.amount != null ? parseAmount(milestone.amount, null) : null,
            dueAt: parseDate(milestone.dueAt),
            completedAt: parseDate(milestone.completedAt),
            evidenceUrl: milestone.evidenceUrl || null
          },
          { transaction }
        );
      }
    }

    if (payload.note && typeof payload.note === 'string' && payload.note.trim()) {
      await EscrowNote.create(
        {
          escrowId: escrow.id,
          authorId: actorId,
          body: payload.note.trim(),
          pinned: Boolean(payload.pinNote)
        },
        { transaction }
      );
    }

    return getEscrowById(escrow.id, { transaction });
  });
}

export async function updateEscrow(id, updates = {}, actorId = 'system') {
  if (!id) {
    throw validationError('Escrow id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }

    const allowedStatuses = ['pending', 'funded', 'released', 'disputed'];
    if (Object.hasOwn(updates, 'status')) {
      if (!allowedStatuses.includes(updates.status)) {
        throw validationError('Invalid escrow status provided.');
      }
      escrow.status = updates.status;
      if (updates.status === 'funded' && !escrow.fundedAt) {
        escrow.fundedAt = new Date();
      }
      if (updates.status === 'released' && !escrow.releasedAt) {
        escrow.releasedAt = new Date();
      }
    }

    if (Object.hasOwn(updates, 'amount')) {
      const parsedAmount = parseAmount(updates.amount, Number.parseFloat(escrow.amount));
      if (parsedAmount === null) {
        throw validationError('Escrow amount must be numeric.');
      }
      escrow.amount = parsedAmount;
    }

    if (Object.hasOwn(updates, 'currency')) {
      escrow.currency = normaliseCurrency(updates.currency, escrow.currency);
    }

    if (Object.hasOwn(updates, 'policyId')) {
      escrow.policyId = updates.policyId || null;
    }

    if (Object.hasOwn(updates, 'requiresDualApproval')) {
      escrow.requiresDualApproval = Boolean(updates.requiresDualApproval);
    }

    if (Object.hasOwn(updates, 'autoReleaseAt')) {
      escrow.autoReleaseAt = parseDate(updates.autoReleaseAt);
    }

    if (Object.hasOwn(updates, 'fundedAt')) {
      escrow.fundedAt = parseDate(updates.fundedAt);
    }

    if (Object.hasOwn(updates, 'releasedAt')) {
      escrow.releasedAt = parseDate(updates.releasedAt);
    }

    if (Object.hasOwn(updates, 'onHold')) {
      escrow.onHold = Boolean(updates.onHold);
      if (!escrow.onHold) {
        escrow.holdReason = null;
      }
    }

    if (Object.hasOwn(updates, 'holdReason')) {
      escrow.holdReason = updates.holdReason || null;
    }

    if (Object.hasOwn(updates, 'externalReference')) {
      escrow.externalReference = updates.externalReference || null;
    }

    const metadata = { ...(escrow.metadata || {}) };
    metadata.updatedBy = actorId;
    metadata.updatedAt = new Date().toISOString();
    escrow.metadata = metadata;

    await escrow.save({ transaction });

    if (Array.isArray(updates.milestones)) {
      let sequence = 0;
      for (const milestone of updates.milestones) {
        if (!milestone || typeof milestone !== 'object') continue;
        if (milestone.id) {
          const existing = await EscrowMilestone.findOne({ where: { id: milestone.id, escrowId: escrow.id }, transaction });
          if (!existing) continue;
          if (Object.hasOwn(milestone, 'label') && milestone.label) {
            existing.label = milestone.label.trim();
          }
          if (Object.hasOwn(milestone, 'status') && ['pending', 'submitted', 'approved', 'rejected'].includes(milestone.status)) {
            existing.status = milestone.status;
          }
          if (Object.hasOwn(milestone, 'amount')) {
            existing.amount = milestone.amount != null ? parseAmount(milestone.amount, null) : null;
          }
          if (Object.hasOwn(milestone, 'dueAt')) {
            existing.dueAt = parseDate(milestone.dueAt);
          }
          if (Object.hasOwn(milestone, 'completedAt')) {
            existing.completedAt = parseDate(milestone.completedAt);
          }
          if (Object.hasOwn(milestone, 'evidenceUrl')) {
            existing.evidenceUrl = milestone.evidenceUrl || null;
          }
          if (Object.hasOwn(milestone, 'sequence')) {
            existing.sequence = Number.isFinite(Number(milestone.sequence))
              ? Number.parseInt(milestone.sequence, 10)
              : existing.sequence;
          }
          await existing.save({ transaction });
        } else {
          const label = typeof milestone.label === 'string' && milestone.label.trim() ? milestone.label.trim() : null;
          if (!label) continue;
          sequence += 1;
          await EscrowMilestone.create(
            {
              escrowId: escrow.id,
              label,
              status: ['pending', 'submitted', 'approved', 'rejected'].includes(milestone.status)
                ? milestone.status
                : 'pending',
              sequence: Number.isFinite(Number(milestone.sequence))
                ? Number.parseInt(milestone.sequence, 10)
                : sequence,
              amount: milestone.amount != null ? parseAmount(milestone.amount, null) : null,
              dueAt: parseDate(milestone.dueAt),
              completedAt: parseDate(milestone.completedAt),
              evidenceUrl: milestone.evidenceUrl || null
            },
            { transaction }
          );
        }
      }
    }

    if (Array.isArray(updates.notes)) {
      for (const note of updates.notes) {
        if (!note || typeof note !== 'object') continue;
        if (note.id && note._delete) {
          await EscrowNote.destroy({ where: { id: note.id, escrowId: escrow.id }, transaction });
          continue;
        }
        if (note.id) {
          const existing = await EscrowNote.findOne({ where: { id: note.id, escrowId: escrow.id }, transaction });
          if (!existing) continue;
          if (Object.hasOwn(note, 'body') && note.body) {
            existing.body = note.body.trim();
          }
          if (Object.hasOwn(note, 'pinned')) {
            existing.pinned = Boolean(note.pinned);
          }
          await existing.save({ transaction });
        } else if (note.body && typeof note.body === 'string') {
          await EscrowNote.create(
            {
              escrowId: escrow.id,
              authorId: note.authorId || actorId,
              body: note.body.trim(),
              pinned: Boolean(note.pinned)
            },
            { transaction }
          );
        }
      }
    }

    return getEscrowById(id, { transaction });
  });
}

export async function listReleasePolicies() {
  const settings = await getPlatformSettings();
  const policies = Array.isArray(settings?.escrow?.releasePolicies) ? settings.escrow.releasePolicies : [];
  return policies.map((policy) => ({
    id: policy.id,
    name: policy.name,
    description: policy.description ?? '',
    autoReleaseDays: Number.isFinite(Number.parseInt(policy.autoReleaseDays, 10))
      ? Number.parseInt(policy.autoReleaseDays, 10)
      : 0,
    requiresDualApproval: Boolean(policy.requiresDualApproval),
    maxAmount:
      policy.maxAmount != null && Number.isFinite(Number.parseFloat(policy.maxAmount))
        ? Number.parseFloat(policy.maxAmount)
        : null,
    notifyRoles: Array.isArray(policy.notifyRoles) ? [...policy.notifyRoles] : [],
    documentChecklist: Array.isArray(policy.documentChecklist) ? [...policy.documentChecklist] : [],
    releaseConditions: Array.isArray(policy.releaseConditions) ? [...policy.releaseConditions] : []
  }));
}

export async function upsertReleasePolicy(payload = {}, actorId = 'system') {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Policy payload is required.');
  }

  const settings = await getPlatformSettings();
  const existing = Array.isArray(settings?.escrow?.releasePolicies) ? settings.escrow.releasePolicies : [];
  const trimmedName = typeof payload.name === 'string' ? payload.name.trim() : '';

  if (!payload.id && !trimmedName) {
    throw validationError('Policy name is required.');
  }

  const index = payload.id ? existing.findIndex((policy) => policy.id === payload.id) : -1;
  if (payload.id && index === -1) {
    throw validationError('Policy not found.');
  }

  const base = index >= 0 ? existing[index] : null;
  const currentIds = new Set(existing.map((policy) => policy.id));
  const baseId = payload.id ? `${payload.id}`.trim() : slugify(trimmedName, null);
  let id = baseId || (payload.id ? `${payload.id}` : null);

  if (!id) {
    id = `policy-${existing.length + 1}`;
  }

  if (!payload.id) {
    let suffix = 2;
    const seed = id;
    while (currentIds.has(id)) {
      id = `${seed}-${suffix}`;
      suffix += 1;
    }
  }

  const nextPolicy = {
    ...(base || {}),
    ...payload,
    id,
    name: trimmedName || base?.name || `Policy ${index >= 0 ? index + 1 : existing.length + 1}`,
    description: typeof payload.description === 'string' ? payload.description.trim() : base?.description ?? '',
    autoReleaseDays:
      payload.autoReleaseDays !== undefined && payload.autoReleaseDays !== null && `${payload.autoReleaseDays}`.trim() !== ''
        ? Number.parseInt(payload.autoReleaseDays, 10)
        : base?.autoReleaseDays,
    requiresDualApproval: Boolean(payload.requiresDualApproval ?? base?.requiresDualApproval),
    maxAmount:
      payload.maxAmount === '' || payload.maxAmount === null || payload.maxAmount === undefined
        ? null
        : parseAmount(payload.maxAmount, base?.maxAmount ?? null),
    notifyRoles: toStringList(payload.notifyRoles ?? base?.notifyRoles ?? []),
    documentChecklist: toStringList(payload.documentChecklist ?? base?.documentChecklist ?? []),
    releaseConditions: toStringList(payload.releaseConditions ?? base?.releaseConditions ?? [])
  };

  const next = index >= 0 ? existing.map((policy, idx) => (idx === index ? nextPolicy : policy)) : [...existing, nextPolicy];

  const updated = await updatePlatformSettings({ escrow: { releasePolicies: next } }, actorId);
  const policies = Array.isArray(updated.escrow?.releasePolicies) ? updated.escrow.releasePolicies : [];
  const policy = policies.find((item) => item.id === nextPolicy.id);

  return { policy: policy ?? null, policies };
}

export async function deleteReleasePolicy(policyId, actorId = 'system') {
  if (!policyId) {
    throw validationError('Policy id is required.');
  }

  const settings = await getPlatformSettings();
  const existing = Array.isArray(settings?.escrow?.releasePolicies) ? settings.escrow.releasePolicies : [];
  if (!existing.some((policy) => policy.id === policyId)) {
    throw validationError('Policy not found.');
  }

  const next = existing.filter((policy) => policy.id !== policyId);
  const updated = await updatePlatformSettings({ escrow: { releasePolicies: next } }, actorId);
  const policies = Array.isArray(updated.escrow?.releasePolicies) ? updated.escrow.releasePolicies : [];

  return { policies };
}

export async function addEscrowNote(id, body, { authorId = 'system', pinned = false } = {}) {
  if (!id) {
    throw validationError('Escrow id is required.');
  }
  if (typeof body !== 'string' || !body.trim()) {
    throw validationError('Note body is required.');
  }

  await EscrowNote.create({
    escrowId: id,
    authorId,
    body: body.trim(),
    pinned: Boolean(pinned)
  });

  return getEscrowById(id);
}

export async function deleteEscrowNote(id, noteId) {
  if (!id || !noteId) {
    throw validationError('Escrow id and note id are required.');
  }

  await EscrowNote.destroy({ where: { id: noteId, escrowId: id } });
  return getEscrowById(id);
}

export async function upsertEscrowMilestone(id, milestone = {}) {
  if (!id) {
    throw validationError('Escrow id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(id, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }

    const label = typeof milestone.label === 'string' && milestone.label.trim() ? milestone.label.trim() : null;
    if (!label) {
      throw validationError('Milestone label is required.');
    }

    let record;
    if (milestone.id) {
      record = await EscrowMilestone.findOne({ where: { id: milestone.id, escrowId: id }, transaction });
      if (!record) {
        throw validationError('Milestone not found.');
      }
      record.label = label;
      if (Object.hasOwn(milestone, 'status') && ['pending', 'submitted', 'approved', 'rejected'].includes(milestone.status)) {
        record.status = milestone.status;
      }
      if (Object.hasOwn(milestone, 'sequence')) {
        record.sequence = Number.isFinite(Number(milestone.sequence))
          ? Number.parseInt(milestone.sequence, 10)
          : record.sequence;
      }
      record.amount = milestone.amount != null ? parseAmount(milestone.amount, null) : record.amount;
      record.dueAt = Object.hasOwn(milestone, 'dueAt') ? parseDate(milestone.dueAt) : record.dueAt;
      record.completedAt = Object.hasOwn(milestone, 'completedAt') ? parseDate(milestone.completedAt) : record.completedAt;
      record.evidenceUrl = Object.hasOwn(milestone, 'evidenceUrl') ? milestone.evidenceUrl || null : record.evidenceUrl;
      await record.save({ transaction });
    } else {
      const sequence = Number.isFinite(Number(milestone.sequence))
        ? Number.parseInt(milestone.sequence, 10)
        : (await EscrowMilestone.count({ where: { escrowId: id }, transaction })) + 1;
      record = await EscrowMilestone.create(
        {
          escrowId: id,
          label,
          status: ['pending', 'submitted', 'approved', 'rejected'].includes(milestone.status)
            ? milestone.status
            : 'pending',
          sequence,
          amount: milestone.amount != null ? parseAmount(milestone.amount, null) : null,
          dueAt: parseDate(milestone.dueAt),
          completedAt: parseDate(milestone.completedAt),
          evidenceUrl: milestone.evidenceUrl || null
        },
        { transaction }
      );
    }

    return getEscrowById(id, { transaction });
  });
}

export async function deleteEscrowMilestone(id, milestoneId) {
  if (!id || !milestoneId) {
    throw validationError('Escrow id and milestone id are required.');
  }

  await EscrowMilestone.destroy({ where: { id: milestoneId, escrowId: id } });
  return getEscrowById(id);
}
