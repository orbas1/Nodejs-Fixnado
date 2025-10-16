import {
  listAutomationInitiatives,
  createAutomationInitiative,
  updateAutomationInitiative,
  archiveAutomationInitiative
} from '../services/automationBacklogService.js';

export async function listAutomationBacklogHandler(req, res, next) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const initiatives = await listAutomationInitiatives({ includeArchived });
    res.json({ data: initiatives });
  } catch (error) {
    next(error);
  }
}

export async function createAutomationBacklogHandler(req, res, next) {
  try {
    const initiative = await createAutomationInitiative({ actorId: req.user?.id ?? null, payload: req.body });
    res.status(201).json({ data: initiative });
  } catch (error) {
    if (error.statusCode === 422) {
      return res.status(422).json({ message: error.message, details: error.details });
    }
    next(error);
  }
}

export async function updateAutomationBacklogHandler(req, res, next) {
  try {
    const initiative = await updateAutomationInitiative({ id: req.params.id, actorId: req.user?.id ?? null, payload: req.body });
    res.json({ data: initiative });
  } catch (error) {
    if (error.statusCode === 422) {
      return res.status(422).json({ message: error.message, details: error.details });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}

export async function archiveAutomationBacklogHandler(req, res, next) {
  try {
    const initiative = await archiveAutomationInitiative({ id: req.params.id, actorId: req.user?.id ?? null });
    res.json({ data: initiative });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
}
