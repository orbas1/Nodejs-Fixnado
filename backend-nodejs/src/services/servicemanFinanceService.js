import { Op } from 'sequelize';
import { z } from 'zod';
import {
  ServicemanFinancialProfile,
  ServicemanFinancialEarning,
  ServicemanExpenseClaim,
  ServicemanAllowance,
  Booking,
  User
} from '../models/index.js';

const RECEIPT_SCHEMA = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().trim().min(1).max(120).optional(),
    url: z
      .string()
      .trim()
      .url({ message: 'Receipt URL must be a valid link' }),
    uploadedAt: z.string().datetime().optional()
  })
  .strict();

const PROFILE_SCHEMA = z
  .object({
    currency: z.string().trim().min(3).max(8).default('GBP'),
    baseHourlyRate: z.number().nonnegative().max(999999),
    overtimeRate: z.number().nonnegative().max(999999).nullable().optional(),
    calloutFee: z.number().nonnegative().max(999999).nullable().optional(),
    mileageRate: z.number().nonnegative().max(9999).nullable().optional(),
    payoutMethod: z.enum(['wallet', 'bank_transfer', 'cash']).default('wallet'),
    payoutSchedule: z.enum(['weekly', 'biweekly', 'monthly', 'on_completion']).default('weekly'),
    taxRate: z.number().nonnegative().max(100).nullable().optional(),
    taxIdentifier: z.string().trim().max(64).nullable().optional(),
    payoutInstructions: z.string().trim().max(2000).nullable().optional(),
    bankAccount: z
      .object({
        accountName: z.string().trim().max(120).nullable().optional(),
        accountNumber: z.string().trim().max(34).nullable().optional(),
        sortCode: z.string().trim().max(16).nullable().optional(),
        iban: z.string().trim().max(34).nullable().optional(),
        bic: z.string().trim().max(16).nullable().optional()
      })
      .passthrough()
      .optional()
  })
  .strict();

const EARNING_SCHEMA = z
  .object({
    title: z.string().trim().min(2).max(160),
    reference: z.string().trim().max(64).optional().nullable(),
    bookingId: z.string().uuid().optional().nullable(),
    amount: z.number().positive().max(9999999),
    currency: z.string().trim().min(3).max(8).default('GBP'),
    status: z.enum(['pending', 'approved', 'in_progress', 'payable', 'paid', 'withheld']).default('pending'),
    dueAt: z.string().datetime().optional().nullable(),
    paidAt: z.string().datetime().optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
    metadata: z.record(z.any()).optional()
  })
  .strict();

const EXPENSE_SCHEMA = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(4000).optional().nullable(),
    category: z.enum(['travel', 'equipment', 'meal', 'accommodation', 'training', 'other']).default('other'),
    amount: z.number().positive().max(999999),
    currency: z.string().trim().min(3).max(8).default('GBP'),
    status: z.enum(['draft', 'submitted', 'approved', 'reimbursed', 'rejected']).default('draft'),
    submittedAt: z.string().datetime().optional().nullable(),
    approvedAt: z.string().datetime().optional().nullable(),
    approvedBy: z.string().uuid().optional().nullable(),
    receipts: z.array(RECEIPT_SCHEMA).optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
    metadata: z.record(z.any()).optional()
  })
  .strict();

const ALLOWANCE_SCHEMA = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(160),
    amount: z.number().positive().max(999999),
    currency: z.string().trim().min(3).max(8).default('GBP'),
    cadence: z.enum(['per_job', 'per_day', 'per_week', 'per_month']).default('per_job'),
    effectiveFrom: z.string().datetime().optional().nullable(),
    effectiveTo: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional()
  })
  .strict();

function normaliseCurrency(value) {
  return typeof value === 'string' && value.trim().length ? value.trim().toUpperCase() : 'GBP';
}

function toNumber(value) {
  if (value == null) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serialiseProfile(profile) {
  if (!profile) return null;
  const json = profile.toJSON();
  return {
    id: json.id,
    servicemanId: json.servicemanId,
    currency: normaliseCurrency(json.currency),
    baseHourlyRate: toNumber(json.baseHourlyRate) ?? 0,
    overtimeRate: toNumber(json.overtimeRate),
    calloutFee: toNumber(json.calloutFee),
    mileageRate: toNumber(json.mileageRate),
    payoutMethod: json.payoutMethod,
    payoutSchedule: json.payoutSchedule,
    taxRate: toNumber(json.taxRate),
    taxIdentifier: json.taxIdentifier ?? null,
    payoutInstructions: json.payoutInstructions ?? null,
    bankAccount: json.bankAccount ?? {},
    updatedAt: toIso(json.updatedAt)
  };
}

function serialiseEarning(earning) {
  if (!earning) return null;
  const json = earning.toJSON();
  return {
    id: json.id,
    servicemanId: json.servicemanId,
    bookingId: json.bookingId ?? null,
    reference: json.reference ?? null,
    title: json.title,
    amount: toNumber(json.amount) ?? 0,
    currency: normaliseCurrency(json.currency),
    status: json.status,
    dueAt: toIso(json.dueAt),
    paidAt: toIso(json.paidAt),
    recordedBy: json.recordedBy ?? null,
    notes: json.notes ?? null,
    metadata: json.metadata ?? {},
    createdAt: toIso(json.createdAt),
    updatedAt: toIso(json.updatedAt),
    booking: json.Booking
      ? {
          id: json.Booking.id,
          reference: json.Booking.meta?.reference ?? null,
          title: json.Booking.meta?.title ?? null,
          scheduledStart: toIso(json.Booking.scheduledStart)
        }
      : null
  };
}

function serialiseExpense(expense) {
  if (!expense) return null;
  const json = expense.toJSON();
  return {
    id: json.id,
    servicemanId: json.servicemanId,
    title: json.title,
    description: json.description ?? null,
    category: json.category,
    amount: toNumber(json.amount) ?? 0,
    currency: normaliseCurrency(json.currency),
    status: json.status,
    submittedAt: toIso(json.submittedAt),
    approvedAt: toIso(json.approvedAt),
    approvedBy: json.approvedBy ?? null,
    receipts: Array.isArray(json.receipts) ? json.receipts : [],
    notes: json.notes ?? null,
    metadata: json.metadata ?? {},
    createdAt: toIso(json.createdAt),
    updatedAt: toIso(json.updatedAt)
  };
}

function serialiseAllowance(allowance) {
  if (!allowance) return null;
  const json = allowance.toJSON();
  return {
    id: json.id,
    servicemanId: json.servicemanId,
    name: json.name,
    amount: toNumber(json.amount) ?? 0,
    currency: normaliseCurrency(json.currency),
    cadence: json.cadence,
    effectiveFrom: toIso(json.effectiveFrom),
    effectiveTo: toIso(json.effectiveTo),
    isActive: Boolean(json.isActive),
    createdBy: json.createdBy ?? null,
    updatedBy: json.updatedBy ?? null,
    createdAt: toIso(json.createdAt),
    updatedAt: toIso(json.updatedAt)
  };
}

async function ensureProfile(servicemanId) {
  const [profile] = await ServicemanFinancialProfile.findOrCreate({
    where: { servicemanId },
    defaults: {
      servicemanId,
      currency: 'GBP',
      payoutMethod: 'wallet',
      payoutSchedule: 'weekly',
      baseHourlyRate: 0
    }
  });
  return profile;
}

function computeEarningSummary(earnings = []) {
  return earnings.reduce(
    (acc, earning) => {
      const amount = toNumber(earning.amount) ?? 0;
      acc.total += amount;
      acc.byStatus[earning.status] = (acc.byStatus[earning.status] ?? 0) + amount;
      if (earning.status === 'pending' || earning.status === 'approved' || earning.status === 'in_progress') {
        acc.outstanding += amount;
      }
      if (earning.status === 'payable') {
        acc.payable += amount;
      }
      if (earning.status === 'paid') {
        acc.paid += amount;
      }
      return acc;
    },
    { total: 0, outstanding: 0, payable: 0, paid: 0, byStatus: {} }
  );
}

function computeExpenseSummary(expenses = []) {
  return expenses.reduce(
    (acc, expense) => {
      const amount = toNumber(expense.amount) ?? 0;
      acc.total += amount;
      acc.byStatus[expense.status] = (acc.byStatus[expense.status] ?? 0) + amount;
      if (expense.status === 'submitted' || expense.status === 'approved') {
        acc.awaitingReimbursement += amount;
      }
      if (expense.status === 'reimbursed') {
        acc.reimbursed += amount;
      }
      return acc;
    },
    { total: 0, awaitingReimbursement: 0, reimbursed: 0, byStatus: {} }
  );
}

export async function getServicemanFinanceWorkspace({ servicemanId, limit = 10 } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const profile = await ensureProfile(servicemanId);

  const [earnings, expenses, allowances, serviceman] = await Promise.all([
    ServicemanFinancialEarning.findAll({
      where: { servicemanId },
      include: [{ model: Booking, attributes: ['id', 'meta', 'scheduledStart'] }],
      order: [['dueAt', 'ASC'], ['createdAt', 'DESC']],
      limit
    }),
    ServicemanExpenseClaim.findAll({
      where: { servicemanId },
      order: [['createdAt', 'DESC']],
      limit
    }),
    ServicemanAllowance.findAll({
      where: { servicemanId },
      order: [['isActive', 'DESC'], ['createdAt', 'DESC']]
    }),
    User.findByPk(servicemanId, { attributes: ['id', 'firstName', 'lastName', 'email'] })
  ]);

  const serialisedEarnings = earnings.map(serialiseEarning);
  const serialisedExpenses = expenses.map(serialiseExpense);
  const serialisedAllowances = allowances.map(serialiseAllowance);

  const earningSummary = computeEarningSummary(serialisedEarnings);
  const expenseSummary = computeExpenseSummary(serialisedExpenses);

  return {
    context: {
      servicemanId,
      serviceman: serviceman
        ? {
            id: serviceman.id,
            name: [serviceman.firstName, serviceman.lastName].filter(Boolean).join(' ') || 'Crew member',
            email: serviceman.email ?? null
          }
        : null
    },
    profile: serialiseProfile(profile),
    summary: {
      earnings: earningSummary,
      expenses: expenseSummary,
      allowances: {
        active: serialisedAllowances.filter((allowance) => allowance.isActive).length,
        inactive: serialisedAllowances.filter((allowance) => !allowance.isActive).length
      }
    },
    earnings: {
      items: serialisedEarnings,
      meta: {
        total: serialisedEarnings.length,
        outstanding: earningSummary.outstanding,
        payable: earningSummary.payable,
        paid: earningSummary.paid
      }
    },
    expenses: {
      items: serialisedExpenses,
      meta: {
        total: serialisedExpenses.length,
        awaitingReimbursement: expenseSummary.awaitingReimbursement,
        reimbursed: expenseSummary.reimbursed
      }
    },
    allowances: {
      items: serialisedAllowances
    },
    documents: {
      receipts: serialisedExpenses.flatMap((expense) => expense.receipts ?? []).slice(0, 8)
    },
    permissions: {
      canManagePayments: true,
      canSubmitExpenses: true,
      canManageAllowances: true
    }
  };
}

export async function updateServicemanFinancialProfile({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }
  const parsed = PROFILE_SCHEMA.parse(payload);
  const profile = await ensureProfile(servicemanId);
  profile.currency = normaliseCurrency(parsed.currency);
  profile.baseHourlyRate = parsed.baseHourlyRate;
  profile.overtimeRate = parsed.overtimeRate ?? null;
  profile.calloutFee = parsed.calloutFee ?? null;
  profile.mileageRate = parsed.mileageRate ?? null;
  profile.payoutMethod = parsed.payoutMethod;
  profile.payoutSchedule = parsed.payoutSchedule;
  profile.taxRate = parsed.taxRate ?? null;
  profile.taxIdentifier = parsed.taxIdentifier ?? null;
  profile.payoutInstructions = parsed.payoutInstructions ?? null;
  profile.bankAccount = parsed.bankAccount ?? {};
  profile.metadata = {
    ...(profile.metadata ?? {}),
    lastUpdatedBy: actorId ?? null,
    updatedAt: new Date().toISOString()
  };
  await profile.save();
  return serialiseProfile(profile);
}

export async function listServicemanEarnings({ servicemanId, status, search, limit = 20, offset = 0 } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }

  const where = { servicemanId };
  if (status && status !== 'all') {
    where.status = status;
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { reference: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows, count } = await ServicemanFinancialEarning.findAndCountAll({
    where,
    include: [{ model: Booking, attributes: ['id', 'meta', 'scheduledStart'] }],
    order: [['dueAt', 'ASC'], ['createdAt', 'DESC']],
    limit,
    offset
  });

  const summary = computeEarningSummary(rows.map((row) => row.toJSON()));

  return {
    data: rows.map(serialiseEarning),
    meta: {
      total: count,
      outstanding: summary.outstanding,
      payable: summary.payable,
      paid: summary.paid,
      limit,
      offset
    }
  };
}

export async function createServicemanEarning({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }
  const parsed = EARNING_SCHEMA.parse(payload);
  const earning = await ServicemanFinancialEarning.create({
    servicemanId,
    bookingId: parsed.bookingId ?? null,
    reference: parsed.reference ?? null,
    title: parsed.title,
    amount: parsed.amount,
    currency: normaliseCurrency(parsed.currency),
    status: parsed.status,
    dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
    paidAt: parsed.paidAt ? new Date(parsed.paidAt) : null,
    recordedBy: actorId ?? null,
    notes: parsed.notes ?? null,
    metadata: parsed.metadata ?? {}
  });
  return serialiseEarning(await ServicemanFinancialEarning.findByPk(earning.id, {
    include: [{ model: Booking, attributes: ['id', 'meta', 'scheduledStart'] }]
  }));
}

export async function updateServicemanEarning({ earningId, servicemanId, payload, actorId }) {
  const earning = await ServicemanFinancialEarning.findByPk(earningId);
  if (!earning || earning.servicemanId !== servicemanId) {
    const error = new Error('earning_not_found');
    error.statusCode = 404;
    throw error;
  }
  const parsed = EARNING_SCHEMA.partial().parse(payload);
  if (parsed.title !== undefined) earning.title = parsed.title;
  if (parsed.reference !== undefined) earning.reference = parsed.reference ?? null;
  if (parsed.bookingId !== undefined) earning.bookingId = parsed.bookingId ?? null;
  if (parsed.amount !== undefined) earning.amount = parsed.amount;
  if (parsed.currency !== undefined) earning.currency = normaliseCurrency(parsed.currency);
  if (parsed.status !== undefined) earning.status = parsed.status;
  if (parsed.dueAt !== undefined) earning.dueAt = parsed.dueAt ? new Date(parsed.dueAt) : null;
  if (parsed.paidAt !== undefined) earning.paidAt = parsed.paidAt ? new Date(parsed.paidAt) : null;
  if (parsed.notes !== undefined) earning.notes = parsed.notes ?? null;
  if (parsed.metadata !== undefined) earning.metadata = parsed.metadata ?? {};
  earning.recordedBy = actorId ?? earning.recordedBy;
  await earning.save();
  return serialiseEarning(await ServicemanFinancialEarning.findByPk(earning.id, {
    include: [{ model: Booking, attributes: ['id', 'meta', 'scheduledStart'] }]
  }));
}

export async function updateServicemanEarningStatus({ earningId, servicemanId, status, actorId }) {
  const earning = await ServicemanFinancialEarning.findByPk(earningId);
  if (!earning || earning.servicemanId !== servicemanId) {
    const error = new Error('earning_not_found');
    error.statusCode = 404;
    throw error;
  }
  if (!['pending', 'approved', 'in_progress', 'payable', 'paid', 'withheld'].includes(status)) {
    const error = new Error('invalid_status');
    error.statusCode = 422;
    throw error;
  }
  earning.status = status;
  if (status === 'paid' && !earning.paidAt) {
    earning.paidAt = new Date();
  }
  earning.recordedBy = actorId ?? earning.recordedBy;
  await earning.save();
  return serialiseEarning(earning);
}

export async function listServicemanExpenses({ servicemanId, status, limit = 20, offset = 0 } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }
  const where = { servicemanId };
  if (status && status !== 'all') {
    where.status = status;
  }
  const { rows, count } = await ServicemanExpenseClaim.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
  const summary = computeExpenseSummary(rows.map((row) => row.toJSON()));
  return {
    data: rows.map(serialiseExpense),
    meta: {
      total: count,
      awaitingReimbursement: summary.awaitingReimbursement,
      reimbursed: summary.reimbursed,
      limit,
      offset
    }
  };
}

export async function createServicemanExpense({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }
  const parsed = EXPENSE_SCHEMA.parse(payload);
  const expense = await ServicemanExpenseClaim.create({
    servicemanId,
    title: parsed.title,
    description: parsed.description ?? null,
    category: parsed.category,
    amount: parsed.amount,
    currency: normaliseCurrency(parsed.currency),
    status: parsed.status,
    submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
    approvedAt: parsed.approvedAt ? new Date(parsed.approvedAt) : null,
    approvedBy: parsed.approvedBy ?? null,
    receipts: parsed.receipts ?? [],
    notes: parsed.notes ?? null,
    metadata: { ...(parsed.metadata ?? {}), createdBy: actorId ?? null }
  });
  return serialiseExpense(expense);
}

export async function updateServicemanExpense({ expenseId, servicemanId, payload }) {
  const expense = await ServicemanExpenseClaim.findByPk(expenseId);
  if (!expense || expense.servicemanId !== servicemanId) {
    const error = new Error('expense_not_found');
    error.statusCode = 404;
    throw error;
  }
  const parsed = EXPENSE_SCHEMA.partial().parse(payload);
  if (parsed.title !== undefined) expense.title = parsed.title;
  if (parsed.description !== undefined) expense.description = parsed.description ?? null;
  if (parsed.category !== undefined) expense.category = parsed.category;
  if (parsed.amount !== undefined) expense.amount = parsed.amount;
  if (parsed.currency !== undefined) expense.currency = normaliseCurrency(parsed.currency);
  if (parsed.status !== undefined) expense.status = parsed.status;
  if (parsed.submittedAt !== undefined) expense.submittedAt = parsed.submittedAt ? new Date(parsed.submittedAt) : null;
  if (parsed.approvedAt !== undefined) expense.approvedAt = parsed.approvedAt ? new Date(parsed.approvedAt) : null;
  if (parsed.approvedBy !== undefined) expense.approvedBy = parsed.approvedBy ?? null;
  if (parsed.receipts !== undefined) expense.receipts = parsed.receipts ?? [];
  if (parsed.notes !== undefined) expense.notes = parsed.notes ?? null;
  if (parsed.metadata !== undefined) expense.metadata = parsed.metadata ?? {};
  await expense.save();
  return serialiseExpense(expense);
}

export async function updateServicemanExpenseStatus({ expenseId, servicemanId, status, actorId }) {
  const expense = await ServicemanExpenseClaim.findByPk(expenseId);
  if (!expense || expense.servicemanId !== servicemanId) {
    const error = new Error('expense_not_found');
    error.statusCode = 404;
    throw error;
  }
  if (!['draft', 'submitted', 'approved', 'reimbursed', 'rejected'].includes(status)) {
    const error = new Error('invalid_status');
    error.statusCode = 422;
    throw error;
  }
  expense.status = status;
  if (status === 'submitted' && !expense.submittedAt) {
    expense.submittedAt = new Date();
  }
  if (status === 'approved' && !expense.approvedAt) {
    expense.approvedAt = new Date();
    expense.approvedBy = actorId ?? expense.approvedBy;
  }
  if (status === 'reimbursed' && !expense.metadata?.reimbursedAt) {
    expense.metadata = { ...(expense.metadata ?? {}), reimbursedAt: new Date().toISOString(), reimbursedBy: actorId ?? null };
  }
  await expense.save();
  return serialiseExpense(expense);
}

export async function listServicemanAllowances({ servicemanId, includeInactive = true } = {}) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }
  const where = { servicemanId };
  if (!includeInactive) {
    where.isActive = true;
  }
  const allowances = await ServicemanAllowance.findAll({ where, order: [['createdAt', 'DESC']] });
  return allowances.map(serialiseAllowance);
}

export async function upsertServicemanAllowance({ servicemanId, payload, actorId }) {
  if (!servicemanId) {
    const error = new Error('servicemanId_required');
    error.statusCode = 400;
    throw error;
  }
  const parsed = ALLOWANCE_SCHEMA.parse(payload);

  if (parsed.id) {
    const allowance = await ServicemanAllowance.findByPk(parsed.id);
    if (!allowance || allowance.servicemanId !== servicemanId) {
      const error = new Error('allowance_not_found');
      error.statusCode = 404;
      throw error;
    }
    allowance.name = parsed.name;
    allowance.amount = parsed.amount;
    allowance.currency = normaliseCurrency(parsed.currency);
    allowance.cadence = parsed.cadence;
    allowance.effectiveFrom = parsed.effectiveFrom ? new Date(parsed.effectiveFrom) : null;
    allowance.effectiveTo = parsed.effectiveTo ? new Date(parsed.effectiveTo) : null;
    if (parsed.isActive !== undefined) {
      allowance.isActive = parsed.isActive;
    }
    allowance.updatedBy = actorId ?? allowance.updatedBy;
    await allowance.save();
    return serialiseAllowance(allowance);
  }

  const allowance = await ServicemanAllowance.create({
    servicemanId,
    name: parsed.name,
    amount: parsed.amount,
    currency: normaliseCurrency(parsed.currency),
    cadence: parsed.cadence,
    effectiveFrom: parsed.effectiveFrom ? new Date(parsed.effectiveFrom) : null,
    effectiveTo: parsed.effectiveTo ? new Date(parsed.effectiveTo) : null,
    isActive: parsed.isActive ?? true,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null
  });
  return serialiseAllowance(allowance);
}

export async function deleteServicemanAllowance({ allowanceId, servicemanId }) {
  const allowance = await ServicemanAllowance.findByPk(allowanceId);
  if (!allowance || allowance.servicemanId !== servicemanId) {
    const error = new Error('allowance_not_found');
    error.statusCode = 404;
    throw error;
  }
  await allowance.destroy();
  return { id: allowanceId };
}

export default {
  getServicemanFinanceWorkspace,
  updateServicemanFinancialProfile,
  listServicemanEarnings,
  createServicemanEarning,
  updateServicemanEarning,
  updateServicemanEarningStatus,
  listServicemanExpenses,
  createServicemanExpense,
  updateServicemanExpense,
  updateServicemanExpenseStatus,
  listServicemanAllowances,
  upsertServicemanAllowance,
  deleteServicemanAllowance
};
