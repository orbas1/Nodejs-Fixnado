import { body, param, query, validationResult } from 'express-validator';
import {
  getOnboardingWorkspace,
  upsertOnboardingTask,
  updateTaskStatus,
  deleteTask,
  upsertRequirement,
  updateRequirementStatus,
  deleteRequirement,
  createNote,
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  STAGE_OPTIONS,
  REQUIREMENT_STATUS_OPTIONS,
  REQUIREMENT_TYPE_OPTIONS,
  NOTE_TYPE_OPTIONS,
  NOTE_VISIBILITY_OPTIONS
} from '../services/providerOnboardingService.js';

const stageValues = STAGE_OPTIONS.map((option) => option.value);
const taskStatusValues = TASK_STATUS_OPTIONS.map((option) => option.value);
const taskPriorityValues = TASK_PRIORITY_OPTIONS.map((option) => option.value);
const requirementStatusValues = REQUIREMENT_STATUS_OPTIONS.map((option) => option.value);
const requirementTypeValues = REQUIREMENT_TYPE_OPTIONS.map((option) => option.value);
const noteTypeValues = NOTE_TYPE_OPTIONS.map((option) => option.value);
const noteVisibilityValues = NOTE_VISIBILITY_OPTIONS.map((option) => option.value);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return false;
  }
  return true;
}

export const getWorkspaceValidators = [query('companyId').optional().isUUID(4)];

export async function getProviderOnboardingWorkspaceHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const payload = await getOnboardingWorkspace({ companyId: req.query.companyId, actor: req.user });
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const createTaskValidators = [
  query('companyId').optional().isUUID(4),
  body('title').isString().trim().isLength({ min: 3, max: 160 }),
  body('description').optional().isString().trim().isLength({ max: 2000 }),
  body('stage').optional().isIn(stageValues),
  body('status').optional().isIn(taskStatusValues),
  body('priority').optional().isIn(taskPriorityValues),
  body('ownerId').optional().isUUID(4),
  body('dueDate').optional().isISO8601()
];

export async function createProviderOnboardingTaskHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const task = await upsertOnboardingTask({
      companyId: req.query.companyId,
      actor: req.user,
      payload: req.body
    });
    res.status(201).json({ data: task });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const updateTaskValidators = [
  query('companyId').optional().isUUID(4),
  param('taskId').isUUID(4),
  body('title').optional().isString().trim().isLength({ min: 3, max: 160 }),
  body('description').optional().isString().trim().isLength({ max: 2000 }),
  body('stage').optional().isIn(stageValues),
  body('status').optional().isIn(taskStatusValues),
  body('priority').optional().isIn(taskPriorityValues),
  body('ownerId').optional().isUUID(4),
  body('dueDate').optional().isISO8601()
];

export async function updateProviderOnboardingTaskHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const task = await upsertOnboardingTask({
      companyId: req.query.companyId,
      actor: req.user,
      taskId: req.params.taskId,
      payload: req.body
    });
    res.json({ data: task });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const updateTaskStatusValidators = [
  query('companyId').optional().isUUID(4),
  param('taskId').isUUID(4),
  body('status').isIn(taskStatusValues)
];

export async function updateProviderOnboardingTaskStatusHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const task = await updateTaskStatus({
      companyId: req.query.companyId,
      actor: req.user,
      taskId: req.params.taskId,
      status: req.body.status
    });
    res.json({ data: task });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const deleteTaskValidators = [query('companyId').optional().isUUID(4), param('taskId').isUUID(4)];

export async function deleteProviderOnboardingTaskHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    await deleteTask({ companyId: req.query.companyId, actor: req.user, taskId: req.params.taskId });
    res.status(204).end();
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const createRequirementValidators = [
  query('companyId').optional().isUUID(4),
  body('name').isString().trim().isLength({ min: 3, max: 180 }),
  body('description').optional().isString().trim().isLength({ max: 4000 }),
  body('type').optional().isIn(requirementTypeValues),
  body('status').optional().isIn(requirementStatusValues),
  body('stage').optional().isIn(stageValues),
  body('reviewerId').optional().isUUID(4),
  body('documentId').optional().isUUID(4),
  body('externalUrl').optional().isURL({ require_protocol: false }),
  body('metadata').optional().isObject(),
  body('dueDate').optional().isISO8601()
];

export async function createProviderOnboardingRequirementHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const requirement = await upsertRequirement({
      companyId: req.query.companyId,
      actor: req.user,
      payload: req.body
    });
    res.status(201).json({ data: requirement });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const updateRequirementValidators = [
  query('companyId').optional().isUUID(4),
  param('requirementId').isUUID(4),
  body('name').optional().isString().trim().isLength({ min: 3, max: 180 }),
  body('description').optional().isString().trim().isLength({ max: 4000 }),
  body('type').optional().isIn(requirementTypeValues),
  body('status').optional().isIn(requirementStatusValues),
  body('stage').optional().isIn(stageValues),
  body('reviewerId').optional().isUUID(4),
  body('documentId').optional().isUUID(4),
  body('externalUrl').optional().isURL({ require_protocol: false }),
  body('metadata').optional().isObject(),
  body('dueDate').optional().isISO8601()
];

export async function updateProviderOnboardingRequirementHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const requirement = await upsertRequirement({
      companyId: req.query.companyId,
      actor: req.user,
      requirementId: req.params.requirementId,
      payload: req.body
    });
    res.json({ data: requirement });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const updateRequirementStatusValidators = [
  query('companyId').optional().isUUID(4),
  param('requirementId').isUUID(4),
  body('status').isIn(requirementStatusValues)
];

export async function updateProviderOnboardingRequirementStatusHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const requirement = await updateRequirementStatus({
      companyId: req.query.companyId,
      actor: req.user,
      requirementId: req.params.requirementId,
      status: req.body.status
    });
    res.json({ data: requirement });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const deleteRequirementValidators = [
  query('companyId').optional().isUUID(4),
  param('requirementId').isUUID(4)
];

export async function deleteProviderOnboardingRequirementHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    await deleteRequirement({
      companyId: req.query.companyId,
      actor: req.user,
      requirementId: req.params.requirementId
    });
    res.status(204).end();
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export const createNoteValidators = [
  query('companyId').optional().isUUID(4),
  body('summary').isString().trim().isLength({ min: 3, max: 180 }),
  body('body').optional().isString().trim().isLength({ max: 6000 }),
  body('type').optional().isIn(noteTypeValues),
  body('visibility').optional().isIn(noteVisibilityValues),
  body('stage').optional().isIn(stageValues),
  body('followUpAt').optional().isISO8601()
];

export async function createProviderOnboardingNoteHandler(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const note = await createNote({
      companyId: req.query.companyId,
      actor: req.user,
      payload: req.body
    });
    res.status(201).json({ data: note });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    next(error);
  }
}
