import {
  listProviderEscrows,
  getProviderEscrow,
  updateProviderEscrow,
  addProviderEscrowNote,
  deleteProviderEscrowNote,
  upsertProviderEscrowMilestone,
  deleteProviderEscrowMilestone,
  createProviderManualEscrow,
  listProviderReleasePolicies,
  createProviderReleasePolicy,
  updateProviderReleasePolicy,
  deleteProviderReleasePolicy
} from '../services/providerEscrowService.js';

function handleValidationError(error, res) {
  if (error?.name === 'ValidationError') {
    res.status(error.statusCode ?? 422).json({
      message: error.message,
      details: error.details ?? []
    });
    return true;
  }
  return false;
}

export async function listProviderEscrowsHandler(req, res, next) {
  try {
    const payload = await listProviderEscrows(req.user, req.query ?? {});
    res.json(payload);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function getProviderEscrowHandler(req, res, next) {
  try {
    const escrow = await getProviderEscrow(req.user, req.params.id);
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function createProviderEscrowHandler(req, res, next) {
  try {
    const escrow = await createProviderManualEscrow(req.user, req.body ?? {}, req.user?.id ?? 'system');
    res.status(201).json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function updateProviderEscrowHandler(req, res, next) {
  try {
    const escrow = await updateProviderEscrow(req.user, req.params.id, req.body ?? {}, req.user?.id ?? 'system');
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function addProviderEscrowNoteHandler(req, res, next) {
  try {
    const escrow = await addProviderEscrowNote(req.user, req.params.id, req.body ?? {}, req.user?.id ?? 'system');
    res.status(201).json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function deleteProviderEscrowNoteHandler(req, res, next) {
  try {
    const escrow = await deleteProviderEscrowNote(req.user, req.params.id, req.params.noteId);
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function upsertProviderEscrowMilestoneHandler(req, res, next) {
  try {
    const escrow = await upsertProviderEscrowMilestone(req.user, req.params.id, req.body ?? {});
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function deleteProviderEscrowMilestoneHandler(req, res, next) {
  try {
    const escrow = await deleteProviderEscrowMilestone(req.user, req.params.id, req.params.milestoneId);
    res.json({ escrow });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function listProviderReleasePoliciesHandler(req, res, next) {
  try {
    const policies = await listProviderReleasePolicies(req.user);
    res.json({ policies });
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function createProviderReleasePolicyHandler(req, res, next) {
  try {
    const result = await createProviderReleasePolicy(req.user, req.body ?? {}, req.user?.id ?? 'system');
    res.status(201).json(result);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}

export async function updateProviderReleasePolicyHandler(req, res, next) {
  try {
    const result = await updateProviderReleasePolicy(
      req.user,
      req.params.policyId ?? req.params.id,
      req.body ?? {},
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

export async function deleteProviderReleasePolicyHandler(req, res, next) {
  try {
    const result = await deleteProviderReleasePolicy(req.user, req.params.policyId ?? req.params.id);
    res.json(result);
  } catch (error) {
    if (handleValidationError(error, res)) {
      return;
    }
    next(error);
  }
}
