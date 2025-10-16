import {
  listServicemanEscrows,
  getServicemanEscrow,
  updateServicemanEscrow,
  addServicemanEscrowNote,
  deleteServicemanEscrowNote,
  upsertServicemanEscrowMilestone,
  deleteServicemanEscrowMilestone,
  createServicemanWorkLog,
  updateServicemanWorkLog,
  deleteServicemanWorkLog
} from '../services/servicemanEscrowService.js';

function resolveServicemanId(req) {
  const id = req.user?.id;
  if (!id) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  return id;
}

function handleValidationError(error, res) {
  if (error.name === 'ValidationError') {
    return res.status(error.statusCode ?? 422).json({
      message: error.message,
      details: error.details ?? []
    });
  }
  return null;
}

export async function listServicemanEscrowsHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const { status, onHold, policyId, search, page, pageSize } = req.query ?? {};
    const payload = await listServicemanEscrows({
      servicemanId,
      status,
      onHold,
      policyId,
      search,
      page,
      pageSize
    });
    res.json(payload);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function getServicemanEscrowHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await getServicemanEscrow({ servicemanId, escrowId: req.params.id });
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function updateServicemanEscrowHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await updateServicemanEscrow({
      servicemanId,
      escrowId: req.params.id,
      payload: req.body ?? {}
    });
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function addServicemanEscrowNoteHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await addServicemanEscrowNote({
      servicemanId,
      escrowId: req.params.id,
      body: req.body?.body,
      pinned: Boolean(req.body?.pinned)
    });
    res.status(201).json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function deleteServicemanEscrowNoteHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await deleteServicemanEscrowNote({
      servicemanId,
      escrowId: req.params.id,
      noteId: req.params.noteId
    });
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function upsertServicemanEscrowMilestoneHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await upsertServicemanEscrowMilestone({
      servicemanId,
      escrowId: req.params.id,
      milestoneId: req.params.milestoneId,
      payload: req.body ?? {}
    });
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function deleteServicemanEscrowMilestoneHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await deleteServicemanEscrowMilestone({
      servicemanId,
      escrowId: req.params.id,
      milestoneId: req.params.milestoneId
    });
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function createServicemanWorkLogHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await createServicemanWorkLog({
      servicemanId,
      escrowId: req.params.id,
      payload: req.body ?? {}
    });
    res.status(201).json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function updateServicemanWorkLogHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await updateServicemanWorkLog({
      servicemanId,
      escrowId: req.params.id,
      workLogId: req.params.workLogId,
      payload: req.body ?? {}
    });
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function deleteServicemanWorkLogHandler(req, res, next) {
  try {
    const servicemanId = resolveServicemanId(req);
    const escrow = await deleteServicemanWorkLog({
      servicemanId,
      escrowId: req.params.id,
      workLogId: req.params.workLogId
    });
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}
