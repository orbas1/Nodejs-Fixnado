import {
  addEscrowNote,
  createManualEscrow,
  deleteEscrowMilestone,
  deleteEscrowNote,
  getEscrowById,
  listEscrows,
  listReleasePolicies,
  updateEscrow,
  upsertEscrowMilestone,
  upsertReleasePolicy,
  deleteReleasePolicy
} from '../services/escrowManagementService.js';

function handleValidationError(error, res) {
  if (error.name === 'ValidationError') {
    return res.status(error.statusCode ?? 422).json({
      message: error.message,
      details: error.details ?? []
    });
  }
  return null;
}

export async function listEscrowsHandler(req, res, next) {
  try {
    const { status, policyId, onHold, search, page, pageSize } = req.query ?? {};
    const payload = await listEscrows({ status, policyId, onHold, search, page, pageSize });
    res.json(payload);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function getEscrowHandler(req, res, next) {
  try {
    const escrow = await getEscrowById(req.params.id);
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function createEscrowHandler(req, res, next) {
  try {
    const escrow = await createManualEscrow(req.body ?? {}, req.user?.id ?? 'system');
    res.status(201).json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function updateEscrowHandler(req, res, next) {
  try {
    const escrow = await updateEscrow(req.params.id, req.body ?? {}, req.user?.id ?? 'system');
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function addEscrowNoteHandler(req, res, next) {
  try {
    const escrow = await addEscrowNote(req.params.id, req.body?.body, {
      authorId: req.user?.id ?? 'system',
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

export async function deleteEscrowNoteHandler(req, res, next) {
  try {
    const escrow = await deleteEscrowNote(req.params.id, req.params.noteId);
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function upsertEscrowMilestoneHandler(req, res, next) {
  try {
    const escrow = await upsertEscrowMilestone(req.params.id, req.body ?? {});
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function deleteEscrowMilestoneHandler(req, res, next) {
  try {
    const escrow = await deleteEscrowMilestone(req.params.id, req.params.milestoneId);
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function listReleasePoliciesHandler(req, res, next) {
  try {
    const policies = await listReleasePolicies();
    res.json({ policies });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function createReleasePolicyHandler(req, res, next) {
  try {
    const result = await upsertReleasePolicy(req.body ?? {}, req.user?.id ?? 'system');
    res.status(201).json(result);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function updateReleasePolicyHandler(req, res, next) {
  try {
    const result = await upsertReleasePolicy(
      { ...(req.body ?? {}), id: req.params.policyId ?? req.params.id },
      req.user?.id ?? 'system'
    );
    res.json(result);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function deleteReleasePolicyHandler(req, res, next) {
  try {
    const result = await deleteReleasePolicy(req.params.policyId ?? req.params.id, req.user?.id ?? 'system');
    res.json(result);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}
