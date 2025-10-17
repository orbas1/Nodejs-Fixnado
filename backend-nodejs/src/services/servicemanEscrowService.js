import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Escrow,
  EscrowMilestone,
  EscrowNote,
  EscrowWorkLog,
  Order,
  Service,
  User,
  Region,
  Booking,
  BookingAssignment
} from '../models/index.js';

function validationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalised)) {
      return false;
    }
  }
  return null;
}

function parseInteger(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
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

function serialiseWorkLog(instance) {
  if (!instance) {
    return null;
  }
  const plain = typeof instance.get === 'function' ? instance.get({ plain: true }) : { ...instance };
  return {
    id: plain.id,
    escrowId: plain.escrowId,
    milestoneId: plain.milestoneId,
    authorId: plain.authorId,
    logType: plain.logType,
    note: plain.note || null,
    durationMinutes: plain.durationMinutes ?? null,
    evidenceUrl: plain.evidenceUrl || null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    milestone: plain.milestone
      ? {
          id: plain.milestone.id,
          label: plain.milestone.label,
          status: plain.milestone.status
        }
      : null,
    author: plain.author
      ? {
          id: plain.author.id,
          firstName: plain.author.firstName,
          lastName: plain.author.lastName,
          email: plain.author.email
        }
      : null
  };
}

function serialiseEscrow(instance, { assignmentMap }) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  const assignment = assignmentMap.get(plain.orderId) ?? { assignments: [], booking: null };
  const amount = Number.parseFloat(plain.amount ?? 0);
  const booking = assignment.booking ? assignment.booking.get({ plain: true }) : null;
  const primaryAssignment = assignment.assignments?.[0]?.get
    ? assignment.assignments[0].get({ plain: true })
    : assignment.assignments?.[0] ?? null;

  return {
    id: plain.id,
    status: plain.status,
    onHold: Boolean(plain.onHold),
    amount: Number.isFinite(amount) ? amount : 0,
    amountFormatted: formatCurrency(amount, plain.currency),
    currency: plain.currency,
    policyId: plain.policyId || null,
    requiresDualApproval: Boolean(plain.requiresDualApproval),
    autoReleaseAt: plain.autoReleaseAt,
    fundedAt: plain.fundedAt,
    releasedAt: plain.releasedAt,
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
    order: plain.Order
      ? {
          id: plain.Order.id,
          status: plain.Order.status,
          title: plain.Order.title || plain.Order.metadata?.title || null,
          totalAmount: Number.parseFloat(plain.Order.totalAmount ?? 0) || 0,
          totalAmountFormatted: formatCurrency(plain.Order.totalAmount, plain.Order.currency),
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
        }
      : null,
    booking: booking
      ? {
          id: booking.id,
          status: booking.status,
          scheduledStart: booking.scheduledStart,
          meta: booking.meta || {}
        }
      : null,
    assignment: primaryAssignment
      ? {
          id: primaryAssignment.id,
          role: primaryAssignment.role,
          status: primaryAssignment.status,
          assignedAt: primaryAssignment.assignedAt,
          bookingId: primaryAssignment.bookingId
        }
      : null,
    milestones: Array.isArray(plain.milestones)
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
      : [],
    notes: Array.isArray(plain.notes)
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
      : [],
    workLogs: Array.isArray(plain.workLogs)
      ? plain.workLogs
          .map((log) => serialiseWorkLog(log))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : []
  };
}

async function buildAssignmentMap(servicemanId, { transaction } = {}) {
  if (!servicemanId) {
    throw validationError('Serviceman id is required.');
  }

  const assignments = await BookingAssignment.findAll({
    where: { providerId: servicemanId },
    include: [
      {
        model: Booking,
        attributes: ['id', 'status', 'totalAmount', 'currency', 'scheduledStart', 'meta'],
        required: true
      }
    ],
    transaction
  });

  const map = new Map();
  assignments.forEach((assignment) => {
    const booking = assignment.Booking;
    const orderId = booking?.meta?.orderId;
    if (!orderId) {
      return;
    }
    const entry = map.get(orderId) ?? { assignments: [], booking: booking };
    entry.assignments.push(assignment);
    entry.booking = booking;
    map.set(orderId, entry);
  });
  return map;
}

async function ensureServicemanAccess(servicemanId, orderId, { transaction } = {}) {
  const map = await buildAssignmentMap(servicemanId, { transaction });
  if (!map.has(orderId)) {
    throw validationError('You do not have access to this escrow record.');
  }
  return map;
}

export async function listServicemanEscrows({
  servicemanId,
  status = 'all',
  onHold = 'all',
  policyId = 'all',
  search = '',
  page = 1,
  pageSize = 20
} = {}) {
  if (!servicemanId) {
    throw validationError('Serviceman id is required.');
  }

  const assignmentMap = await buildAssignmentMap(servicemanId);
  const orderIds = Array.from(assignmentMap.keys());

  if (orderIds.length === 0) {
    return {
      items: [],
      pagination: { page: 1, pageSize, totalItems: 0, totalPages: 1 },
      summary: {
        totalAmount: 0,
        totalAmountFormatted: formatCurrency(0),
        onHold: 0,
        disputed: 0,
        readyForRelease: 0,
        active: 0
      },
      policies: [],
      filters: {
        statuses: ['pending', 'funded', 'released', 'disputed'],
        holdStates: ['all', 'true', 'false']
      }
    };
  }

  const parsedPage = Number.isFinite(Number(page)) ? Math.max(Number.parseInt(page, 10), 1) : 1;
  const parsedPageSize = Number.isFinite(Number(pageSize))
    ? Math.min(Math.max(Number.parseInt(pageSize, 10), 1), 100)
    : 20;

  const where = { orderId: { [Op.in]: orderIds } };
  if (status && status !== 'all') {
    where.status = status;
  }
  if (onHold && onHold !== 'all') {
    const holdValue = parseBoolean(onHold);
    if (holdValue !== null) {
      where.onHold = holdValue;
    }
  }
  if (policyId && policyId !== 'all') {
    where.policyId = policyId;
  }

  const likeClauses = [];
  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    likeClauses.push(
      sequelize.where(sequelize.fn('lower', sequelize.col('Escrow.id')), { [Op.like]: term }),
      sequelize.where(sequelize.fn('lower', sequelize.col('Escrow.external_reference')), { [Op.like]: term }),
      sequelize.where(sequelize.fn('lower', sequelize.col('Order.id')), { [Op.like]: term }),
      sequelize.where(sequelize.fn('lower', sequelize.col('Order.title')), { [Op.like]: term }),
      sequelize.where(sequelize.fn('lower', sequelize.col('Order->Service.title')), { [Op.like]: term })
    );
  }

  if (likeClauses.length) {
    where[Op.and] = where[Op.and] ? [...where[Op.and], { [Op.or]: likeClauses }] : [{ [Op.or]: likeClauses }];
  }

  const { rows, count } = await Escrow.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        include: [
          { model: Service, attributes: ['id', 'title'] },
          { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      },
      { model: Region, as: 'region', attributes: ['id', 'code', 'name'], required: false },
      { model: EscrowMilestone, as: 'milestones', required: false }
    ],
    order: [
      ['updatedAt', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit: parsedPageSize,
    offset: (parsedPage - 1) * parsedPageSize,
    distinct: true
  });

  const serialised = rows.map((row) => serialiseEscrow(row, { assignmentMap }));
  const policyOptions = [];
  const policyLookup = new Map();

  serialised.forEach((escrow) => {
    if (!escrow.policyId || policyLookup.has(escrow.policyId)) {
      return;
    }
    const label = escrow.metadata?.policyName || escrow.policyId;
    const option = { id: escrow.policyId, name: label };
    policyLookup.set(escrow.policyId, option);
    policyOptions.push(option);
  });

  const totals = serialised.reduce(
    (acc, escrow) => {
      acc.totalAmount += escrow.amount;
      if (escrow.onHold) {
        acc.onHold += 1;
      }
      if (escrow.status === 'disputed') {
        acc.disputed += 1;
      }
      if (escrow.status === 'funded' && !escrow.onHold) {
        acc.readyForRelease += 1;
      }
      const openMilestones = escrow.milestones.filter((milestone) => milestone.status !== 'approved');
      if (openMilestones.length > 0) {
        acc.active += 1;
      }
      return acc;
    },
    { totalAmount: 0, onHold: 0, disputed: 0, readyForRelease: 0, active: 0 }
  );

  const totalItems = Array.isArray(count) ? count.length : Number(count ?? 0);
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / parsedPageSize) : 1;

  return {
    items: serialised,
    pagination: {
      page: parsedPage,
      pageSize: parsedPageSize,
      totalItems,
      totalPages
    },
    summary: {
      totalAmount: totals.totalAmount,
      totalAmountFormatted: formatCurrency(totals.totalAmount),
      onHold: totals.onHold,
      disputed: totals.disputed,
      readyForRelease: totals.readyForRelease,
      active: totals.active
    },
    policies: policyOptions,
    filters: {
      statuses: ['pending', 'funded', 'released', 'disputed'],
      holdStates: ['all', 'true', 'false']
    }
  };
}

async function fetchServicemanEscrow(servicemanId, escrowId, { transaction } = {}) {
  if (!escrowId) {
    throw validationError('Escrow id is required.');
  }
  if (!servicemanId) {
    throw validationError('Serviceman id is required.');
  }

  const escrow = await Escrow.findByPk(escrowId, {
    include: [
      {
        model: Order,
        include: [
          { model: Service, attributes: ['id', 'title'] },
          { model: User, as: 'buyer', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      },
      { model: Region, as: 'region', attributes: ['id', 'code', 'name'], required: false },
      { model: EscrowMilestone, as: 'milestones', required: false },
      { model: EscrowNote, as: 'notes', required: false },
      {
        model: EscrowWorkLog,
        as: 'workLogs',
        required: false,
        include: [
          { model: EscrowMilestone, as: 'milestone', attributes: ['id', 'label', 'status'] },
          { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      }
    ],
    transaction
  });

  if (!escrow) {
    throw validationError('Escrow not found.');
  }

  const map = await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });
  return serialiseEscrow(escrow, { assignmentMap: map });
}

export async function getServicemanEscrow({ servicemanId, escrowId }) {
  return fetchServicemanEscrow(servicemanId, escrowId);
}

export async function updateServicemanEscrow({ servicemanId, escrowId, payload = {} }) {
  if (!servicemanId) {
    throw validationError('Serviceman id is required.');
  }
  if (!escrowId) {
    throw validationError('Escrow id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }

    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    const allowedStatuses = ['pending', 'funded', 'released', 'disputed'];
    if (Object.hasOwn(payload, 'status')) {
      if (!allowedStatuses.includes(payload.status)) {
        throw validationError('Invalid escrow status provided.');
      }
      escrow.status = payload.status;
      if (payload.status === 'funded' && !escrow.fundedAt) {
        escrow.fundedAt = new Date();
      }
      if (payload.status === 'released' && !escrow.releasedAt) {
        escrow.releasedAt = new Date();
      }
    }

    if (Object.hasOwn(payload, 'requiresDualApproval')) {
      escrow.requiresDualApproval = Boolean(payload.requiresDualApproval);
    }

    if (Object.hasOwn(payload, 'amount')) {
      const amountValue = Number.parseFloat(payload.amount);
      if (!Number.isFinite(amountValue) || amountValue < 0) {
        throw validationError('Invalid escrow amount provided.');
      }
      escrow.amount = amountValue;
    }

    if (Object.hasOwn(payload, 'currency')) {
      escrow.currency = payload.currency || null;
    }

    if (Object.hasOwn(payload, 'policyId')) {
      escrow.policyId = payload.policyId || null;
    }

    if (Object.hasOwn(payload, 'autoReleaseAt')) {
      escrow.autoReleaseAt = parseDate(payload.autoReleaseAt);
    }

    if (Object.hasOwn(payload, 'fundedAt')) {
      escrow.fundedAt = parseDate(payload.fundedAt);
    }

    if (Object.hasOwn(payload, 'releasedAt')) {
      escrow.releasedAt = parseDate(payload.releasedAt);
    }

    if (Object.hasOwn(payload, 'onHold')) {
      const hold = Boolean(payload.onHold);
      escrow.onHold = hold;
      if (!hold) {
        escrow.holdReason = null;
      }
    }

    if (Object.hasOwn(payload, 'holdReason')) {
      escrow.holdReason = payload.holdReason || null;
    }

    if (Object.hasOwn(payload, 'externalReference')) {
      escrow.externalReference = payload.externalReference || null;
    }

    if (Array.isArray(payload.notes)) {
      for (const note of payload.notes) {
        if (!note || typeof note !== 'object' || !note.id) {
          continue;
        }
        const existingNote = await EscrowNote.findOne({ where: { id: note.id, escrowId }, transaction });
        if (!existingNote) {
          continue;
        }
        if (Object.hasOwn(note, 'pinned')) {
          existingNote.pinned = Boolean(note.pinned);
        }
        if (Object.hasOwn(note, 'body') && typeof note.body === 'string' && note.body.trim()) {
          existingNote.body = note.body.trim();
        }
        await existingNote.save({ transaction });
      }
    }

    const metadata = { ...(escrow.metadata || {}) };
    metadata.serviceman = {
      ...(metadata.serviceman || {}),
      lastActor: servicemanId,
      lastUpdatedAt: new Date().toISOString()
    };
    escrow.metadata = metadata;

    await escrow.save({ transaction });

    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function addServicemanEscrowNote({ servicemanId, escrowId, body, pinned = false }) {
  if (!body || typeof body !== 'string' || !body.trim()) {
    throw validationError('Note body is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }
    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    await EscrowNote.create(
      {
        escrowId,
        authorId: servicemanId,
        body: body.trim(),
        pinned: Boolean(pinned)
      },
      { transaction }
    );

    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function deleteServicemanEscrowNote({ servicemanId, escrowId, noteId }) {
  if (!noteId) {
    throw validationError('Note id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }
    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    const note = await EscrowNote.findOne({ where: { id: noteId, escrowId }, transaction });
    if (!note) {
      throw validationError('Note not found.');
    }
    if (note.authorId && note.authorId !== servicemanId) {
      throw validationError('You can only delete notes that you created.');
    }

    await note.destroy({ transaction });
    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function upsertServicemanEscrowMilestone({ servicemanId, escrowId, milestoneId = null, payload = {} }) {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Milestone payload is required.');
  }

  const label = typeof payload.label === 'string' && payload.label.trim() ? payload.label.trim() : null;
  if (!label) {
    throw validationError('Milestone label is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }

    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    let record;
    if (milestoneId) {
      record = await EscrowMilestone.findOne({ where: { id: milestoneId, escrowId }, transaction });
      if (!record) {
        throw validationError('Milestone not found.');
      }
    }

    if (record) {
      record.label = label;
      if (Object.hasOwn(payload, 'status') && ['pending', 'submitted', 'approved', 'rejected'].includes(payload.status)) {
        record.status = payload.status;
      }
      if (Object.hasOwn(payload, 'sequence')) {
        const parsedSequence = parseInteger(payload.sequence);
        if (parsedSequence !== null) {
          record.sequence = parsedSequence;
        }
      }
      if (Object.hasOwn(payload, 'amount')) {
        record.amount = payload.amount === '' || payload.amount == null ? null : Number.parseFloat(payload.amount);
      }
      if (Object.hasOwn(payload, 'dueAt')) {
        record.dueAt = parseDate(payload.dueAt);
      }
      if (Object.hasOwn(payload, 'completedAt')) {
        record.completedAt = parseDate(payload.completedAt);
      }
      if (Object.hasOwn(payload, 'evidenceUrl')) {
        record.evidenceUrl = payload.evidenceUrl || null;
      }
      await record.save({ transaction });
    } else {
      const sequence = parseInteger(payload.sequence);
      await EscrowMilestone.create(
        {
          escrowId,
          label,
          status: ['pending', 'submitted', 'approved', 'rejected'].includes(payload.status) ? payload.status : 'pending',
          sequence: sequence ?? (await EscrowMilestone.count({ where: { escrowId }, transaction })) + 1,
          amount: payload.amount === '' || payload.amount == null ? null : Number.parseFloat(payload.amount),
          dueAt: parseDate(payload.dueAt),
          completedAt: parseDate(payload.completedAt),
          evidenceUrl: payload.evidenceUrl || null
        },
        { transaction }
      );
    }

    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function deleteServicemanEscrowMilestone({ servicemanId, escrowId, milestoneId }) {
  if (!milestoneId) {
    throw validationError('Milestone id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }
    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    await EscrowMilestone.destroy({ where: { id: milestoneId, escrowId }, transaction });
    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function createServicemanWorkLog({ servicemanId, escrowId, payload = {} }) {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Work log payload is required.');
  }

  const logType = typeof payload.logType === 'string' && payload.logType.trim() ? payload.logType.trim().toLowerCase() : 'update';
  const duration = parseInteger(payload.durationMinutes);
  const note = typeof payload.note === 'string' ? payload.note.trim() : '';

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }
    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    if (payload.milestoneId) {
      const milestone = await EscrowMilestone.findOne({ where: { id: payload.milestoneId, escrowId }, transaction });
      if (!milestone) {
        throw validationError('Linked milestone not found.');
      }
    }

    await EscrowWorkLog.create(
      {
        escrowId,
        milestoneId: payload.milestoneId || null,
        authorId: servicemanId,
        logType,
        note: note || null,
        durationMinutes: duration,
        evidenceUrl: payload.evidenceUrl || null
      },
      { transaction }
    );

    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function updateServicemanWorkLog({ servicemanId, escrowId, workLogId, payload = {} }) {
  if (!workLogId) {
    throw validationError('Work log id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }
    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    const workLog = await EscrowWorkLog.findOne({ where: { id: workLogId, escrowId }, transaction });
    if (!workLog) {
      throw validationError('Work log not found.');
    }
    if (workLog.authorId && workLog.authorId !== servicemanId) {
      throw validationError('You can only update work logs that you created.');
    }

    if (payload.logType) {
      workLog.logType = payload.logType.trim().toLowerCase();
    }
    if (Object.hasOwn(payload, 'note')) {
      workLog.note = payload.note ? payload.note.trim() : null;
    }
    if (Object.hasOwn(payload, 'durationMinutes')) {
      workLog.durationMinutes = parseInteger(payload.durationMinutes);
    }
    if (Object.hasOwn(payload, 'evidenceUrl')) {
      workLog.evidenceUrl = payload.evidenceUrl || null;
    }
    if (Object.hasOwn(payload, 'milestoneId')) {
      if (payload.milestoneId) {
        const milestone = await EscrowMilestone.findOne({ where: { id: payload.milestoneId, escrowId }, transaction });
        if (!milestone) {
          throw validationError('Linked milestone not found.');
        }
        workLog.milestoneId = payload.milestoneId;
      } else {
        workLog.milestoneId = null;
      }
    }

    await workLog.save({ transaction });
    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function deleteServicemanWorkLog({ servicemanId, escrowId, workLogId }) {
  if (!workLogId) {
    throw validationError('Work log id is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const escrow = await Escrow.findByPk(escrowId, { transaction });
    if (!escrow) {
      throw validationError('Escrow not found.');
    }
    await ensureServicemanAccess(servicemanId, escrow.orderId, { transaction });

    const workLog = await EscrowWorkLog.findOne({ where: { id: workLogId, escrowId }, transaction });
    if (!workLog) {
      throw validationError('Work log not found.');
    }
    if (workLog.authorId && workLog.authorId !== servicemanId) {
      throw validationError('You can only delete work logs that you created.');
    }

    await workLog.destroy({ transaction });
    return fetchServicemanEscrow(servicemanId, escrowId, { transaction });
  });
}

export async function getServicemanEscrowSnapshot({ servicemanId, limit = 5 } = {}) {
  const list = await listServicemanEscrows({ servicemanId, page: 1, pageSize: limit });
  const upcoming = list.items
    .filter((item) => item.autoReleaseAt)
    .sort((a, b) => new Date(a.autoReleaseAt) - new Date(b.autoReleaseAt))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.order?.title || item.order?.service?.title || 'Escrow',
      autoReleaseAt: item.autoReleaseAt,
      amountFormatted: item.amountFormatted,
      status: item.status
    }));

  return {
    summary: list.summary,
    upcoming,
    items: list.items
  };
}
