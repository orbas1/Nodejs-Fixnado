import {
  listTasks,
  createTask,
  updateTask,
  appendTaskUpdate
} from '../services/accountSupportService.js';

function handleError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

export async function getTasks(req, res, next) {
  try {
    const includeResolved = String(req.query.includeResolved ?? 'false').toLowerCase() === 'true';
    const payload = {
      companyId: req.query.companyId,
      userId: req.query.userId,
      status: req.query.status,
      includeResolved,
      limit: req.query.limit
    };
    const tasks = await listTasks(payload);
    res.json(tasks);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function postTask(req, res, next) {
  try {
    const created = await createTask(req.body || {});
    res.status(201).json(created);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function patchTask(req, res, next) {
  try {
    const updated = await updateTask(req.params.taskId, req.body || {});
    res.json(updated);
  } catch (error) {
    handleError(res, next, error);
  }
}

export async function postTaskUpdate(req, res, next) {
  try {
    const updated = await appendTaskUpdate(req.params.taskId, req.body || {});
    res.status(201).json(updated);
  } catch (error) {
    handleError(res, next, error);
  }
}

export default {
  getTasks,
  postTask,
  patchTask,
  postTaskUpdate
};
