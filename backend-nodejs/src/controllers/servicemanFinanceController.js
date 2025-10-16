import {
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
} from '../services/servicemanFinanceService.js';

function resolveServicemanId(req) {
  return req.query?.servicemanId ?? req.params?.servicemanId ?? req.user?.id ?? req.auth?.actor?.actorId ?? null;
}

export async function getFinanceWorkspaceHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const workspace = await getServicemanFinanceWorkspace({
      servicemanId,
      limit: req.query?.limit ? Number.parseInt(req.query.limit, 10) : 10
    });
    res.json({ data: workspace });
  } catch (error) {
    next(error);
  }
}

export async function updateFinancialProfileHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const profile = await updateServicemanFinancialProfile({
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
}

export async function listEarningsHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const response = await listServicemanEarnings({
      servicemanId,
      status: req.query?.status,
      search: req.query?.search,
      limit: req.query?.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query?.offset ? Number.parseInt(req.query.offset, 10) : undefined
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createEarningHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const earning = await createServicemanEarning({
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: earning });
  } catch (error) {
    next(error);
  }
}

export async function updateEarningHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const earning = await updateServicemanEarning({
      earningId: req.params?.earningId,
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.json({ data: earning });
  } catch (error) {
    next(error);
  }
}

export async function updateEarningStatusHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const earning = await updateServicemanEarningStatus({
      earningId: req.params?.earningId,
      servicemanId,
      status: req.body?.status,
      actorId: req.user?.id ?? null
    });
    res.json({ data: earning });
  } catch (error) {
    next(error);
  }
}

export async function listExpensesHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const response = await listServicemanExpenses({
      servicemanId,
      status: req.query?.status,
      limit: req.query?.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query?.offset ? Number.parseInt(req.query.offset, 10) : undefined
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createExpenseHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const expense = await createServicemanExpense({
      servicemanId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null
    });
    res.status(201).json({ data: expense });
  } catch (error) {
    next(error);
  }
}

export async function updateExpenseHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const expense = await updateServicemanExpense({
      expenseId: req.params?.expenseId,
      servicemanId,
      payload: req.body ?? {}
    });
    res.json({ data: expense });
  } catch (error) {
    next(error);
  }
}

export async function updateExpenseStatusHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const expense = await updateServicemanExpenseStatus({
      expenseId: req.params?.expenseId,
      servicemanId,
      status: req.body?.status,
      actorId: req.user?.id ?? null
    });
    res.json({ data: expense });
  } catch (error) {
    next(error);
  }
}

export async function listAllowancesHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const allowances = await listServicemanAllowances({
      servicemanId,
      includeInactive: req.query?.includeInactive !== 'false'
    });
    res.json({ data: allowances });
  } catch (error) {
    next(error);
  }
}

export async function upsertAllowanceHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const allowance = await upsertServicemanAllowance({
      servicemanId,
      payload: { ...req.body, id: req.params?.allowanceId },
      actorId: req.user?.id ?? null
    });
    const status = req.method === 'POST' && !req.params?.allowanceId ? 201 : 200;
    res.status(status).json({ data: allowance });
  } catch (error) {
    next(error);
  }
}

export async function deleteAllowanceHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const result = await deleteServicemanAllowance({
      allowanceId: req.params?.allowanceId,
      servicemanId
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export default {
  getFinanceWorkspaceHandler,
  updateFinancialProfileHandler,
  listEarningsHandler,
  createEarningHandler,
  updateEarningHandler,
  updateEarningStatusHandler,
  listExpensesHandler,
  createExpenseHandler,
  updateExpenseHandler,
  updateExpenseStatusHandler,
  listAllowancesHandler,
  upsertAllowanceHandler,
  deleteAllowanceHandler
};
