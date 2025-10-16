import { body, param, validationResult } from 'express-validator';
import {
  listQueueBoards,
  getQueueBoard,
  createQueueBoard,
  updateQueueBoard,
  archiveQueueBoard,
  createQueueUpdate,
  updateQueueUpdate,
  deleteQueueUpdate
} from '../services/operationsQueueService.js';

function extractActor(req) {
  return req.auth?.actor ?? { actorId: req.user?.id ?? null };
}

function handleValidation(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = new Error('Validation failed');
    error.status = 422;
    error.details = { errors: result.array() };
    throw error;
  }
}

export const createQueueValidators = [
  body('title').isString().trim().isLength({ min: 3, max: 140 }),
  body('summary').isString().trim().isLength({ min: 10 }),
  body('owner').isString().trim().isLength({ min: 3, max: 140 }),
  body('status').optional().isIn(['operational', 'attention', 'delayed', 'blocked']),
  body('priority').optional().isInt({ min: 1, max: 5 }),
  body('metadata').optional().isObject(),
  body('metadata.tags').optional().isArray({ max: 12 }),
  body('metadata.tags.*').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('metadata.watchers').optional().isArray({ max: 10 }),
  body('metadata.watchers.*').optional().isString().trim().isLength({ min: 1, max: 140 }),
  body('metadata.intakeChannels').optional().isArray({ max: 10 }),
  body('metadata.intakeChannels.*').optional().isString().trim().isLength({ min: 1, max: 60 }),
  body('metadata.slaMinutes').optional().isInt({ min: 0, max: 2880 }),
  body('metadata.escalationContact').optional().isString().trim().isLength({ min: 0, max: 160 }),
  body('metadata.playbookUrl').optional().isString().trim().isLength({ min: 0, max: 512 }),
  body('metadata.autoAlerts').optional().isBoolean(),
  body('metadata.notes').optional().isString().trim().isLength({ min: 0, max: 1200 }),
  body('slug').optional().isString().trim().isLength({ min: 2, max: 80 })
];

export const updateQueueValidators = [
  param('id').isUUID(),
  body('title').optional().isString().trim().isLength({ min: 3, max: 140 }),
  body('summary').optional().isString().trim().isLength({ min: 10 }),
  body('owner').optional().isString().trim().isLength({ min: 3, max: 140 }),
  body('status').optional().isIn(['operational', 'attention', 'delayed', 'blocked']),
  body('priority').optional().isInt({ min: 1, max: 5 }),
  body('metadata').optional().isObject(),
  body('metadata.tags').optional().isArray({ max: 12 }),
  body('metadata.tags.*').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('metadata.watchers').optional().isArray({ max: 10 }),
  body('metadata.watchers.*').optional().isString().trim().isLength({ min: 1, max: 140 }),
  body('metadata.intakeChannels').optional().isArray({ max: 10 }),
  body('metadata.intakeChannels.*').optional().isString().trim().isLength({ min: 1, max: 60 }),
  body('metadata.slaMinutes').optional().isInt({ min: 0, max: 2880 }),
  body('metadata.escalationContact').optional().isString().trim().isLength({ min: 0, max: 160 }),
  body('metadata.playbookUrl').optional().isString().trim().isLength({ min: 0, max: 512 }),
  body('metadata.autoAlerts').optional().isBoolean(),
  body('metadata.notes').optional().isString().trim().isLength({ min: 0, max: 1200 }),
  body('slug').optional().isString().trim().isLength({ min: 2, max: 80 })
];

export const queueIdValidator = [param('id').isUUID()];

export const updateIdValidator = [
  param('id').isUUID(),
  param('updateId').isUUID()
];

const updatePayloadValidators = [
  body('headline').isString().trim().isLength({ min: 3, max: 160 }),
  body('body').optional().isString().trim(),
  body('tone').optional().isIn(['info', 'success', 'warning', 'danger']),
  body('recordedAt').optional().isISO8601(),
  body('attachments').optional().isArray({ max: 5 }),
  body('attachments.*.label').optional().isString().trim().isLength({ max: 160 }),
  body('attachments.*.url').optional().isString().trim().isLength({ max: 512 }),
  body('attachments.*.type').optional().isString().trim().isLength({ max: 40 }),
  body('position').optional().isInt({ min: 0, max: 1000 })
];

export const createUpdateValidators = [...queueIdValidator, ...updatePayloadValidators];
export const patchUpdateValidators = [...updateIdValidator, ...updatePayloadValidators];

export async function listQueuesHandler(req, res, next) {
  try {
    const includeUpdates = req.query.includeUpdates !== 'false';
    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined;
    const boards = await listQueueBoards({ includeUpdates, limit });
    const permissions = new Set(req.auth?.grantedPermissions ?? []);
    const canWrite = permissions.has('admin:operations-queue:write');
    res.json({
      boards,
      total: boards.length,
      capabilities: {
        canCreate: canWrite,
        canEdit: canWrite,
        canArchive: canWrite,
        canManageUpdates: canWrite
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getQueueHandler(req, res, next) {
  try {
    handleValidation(req);
    const board = await getQueueBoard(req.params.id, { includeUpdates: true });
    if (!board) {
      return res.status(404).json({ message: 'Queue board not found' });
    }
    return res.json({ board });
  } catch (error) {
    return next(error);
  }
}

export async function createQueueHandler(req, res, next) {
  try {
    handleValidation(req);
    const board = await createQueueBoard(req.body, { actor: extractActor(req) });
    res.status(201).json({ board });
  } catch (error) {
    next(error);
  }
}

export async function updateQueueHandler(req, res, next) {
  try {
    handleValidation(req);
    const board = await updateQueueBoard(req.params.id, req.body, { actor: extractActor(req) });
    res.json({ board });
  } catch (error) {
    next(error);
  }
}

export async function archiveQueueHandler(req, res, next) {
  try {
    handleValidation(req);
    const board = await archiveQueueBoard(req.params.id, { actor: extractActor(req) });
    res.status(200).json({ board, archived: true });
  } catch (error) {
    next(error);
  }
}

export async function createQueueUpdateHandler(req, res, next) {
  try {
    handleValidation(req);
    const update = await createQueueUpdate(req.params.id, req.body, { actor: extractActor(req) });
    res.status(201).json({ update });
  } catch (error) {
    next(error);
  }
}

export async function updateQueueUpdateHandler(req, res, next) {
  try {
    handleValidation(req);
    const update = await updateQueueUpdate(req.params.id, req.params.updateId, req.body, {
      actor: extractActor(req)
    });
    res.json({ update });
  } catch (error) {
    next(error);
  }
}

export async function deleteQueueUpdateHandler(req, res, next) {
  try {
    handleValidation(req);
    await deleteQueueUpdate(req.params.id, req.params.updateId, { actor: extractActor(req) });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
