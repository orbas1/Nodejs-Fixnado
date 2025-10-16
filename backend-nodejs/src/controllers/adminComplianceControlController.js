import {
  listComplianceControls,
  createComplianceControl,
  updateComplianceControl,
  deleteComplianceControl,
  updateComplianceControlAutomationSettings
} from '../services/complianceControlService.js';

export async function listComplianceControlsHandler(req, res, next) {
  try {
    const { status, category, ownerTeam, search, dueBefore, dueAfter } = req.query;
    const timezone = req.query.timezone || req.headers['x-timezone'] || 'UTC';
    const payload = await listComplianceControls({
      status,
      category,
      ownerTeam,
      search,
      dueBefore,
      dueAfter,
      timezone
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createComplianceControlHandler(req, res, next) {
  try {
    const timezone = req.body?.timezone || req.headers['x-timezone'] || 'UTC';
    const control = await createComplianceControl(req.body || {}, { timezone });
    res.status(201).json({ control });
  } catch (error) {
    next(error);
  }
}

export async function updateComplianceControlHandler(req, res, next) {
  try {
    const { controlId } = req.params;
    const timezone = req.body?.timezone || req.headers['x-timezone'] || 'UTC';
    const control = await updateComplianceControl(controlId, req.body || {}, { timezone });
    res.json({ control });
  } catch (error) {
    next(error);
  }
}

export async function deleteComplianceControlHandler(req, res, next) {
  try {
    const { controlId } = req.params;
    await deleteComplianceControl(controlId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function updateComplianceAutomationHandler(req, res, next) {
  try {
    const actorId = req.body?.actorId || req.user?.id || null;
    const settings = await updateComplianceControlAutomationSettings(req.body || {}, actorId);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

