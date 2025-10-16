import {
  listRoles,
  getRoleDetail,
  createRole,
  updateRole,
  archiveRole,
  assignRole,
  revokeAssignment
} from '../services/rbacService.js';

function extractActorContext(req) {
  return req.auth?.actor ?? {
    actorId: req.user?.id ?? null,
    role: req.user?.role ?? null,
    persona: req.user?.persona ?? null
  };
}

export async function listRbacRoles(req, res, next) {
  try {
    const roles = await listRoles({ search: req.query.search, status: req.query.status });
    res.json({ roles, meta: { total: roles.length } });
  } catch (error) {
    next(error);
  }
}

export async function getRbacRole(req, res, next) {
  try {
    const payload = await getRoleDetail(req.params.key);
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createRbacRole(req, res, next) {
  try {
    const actor = extractActorContext(req);
    const payload = await createRole(req.body ?? {}, actor);
    res.status(201).json(payload);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(422).json({ message: error.message, details: error.details ?? [] });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

export async function updateRbacRole(req, res, next) {
  try {
    const actor = extractActorContext(req);
    const payload = await updateRole(req.params.key, req.body ?? {}, actor);
    res.json(payload);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(422).json({ message: error.message, details: error.details ?? [] });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

export async function archiveRbacRole(req, res, next) {
  try {
    const actor = extractActorContext(req);
    const role = await archiveRole(req.params.key, actor);
    res.json({ role });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

export async function assignRbacRole(req, res, next) {
  try {
    const actor = extractActorContext(req);
    const payload = await assignRole(req.params.key, req.body ?? {}, actor);
    res.status(201).json(payload);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(422).json({ message: error.message, details: error.details ?? [] });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

export async function revokeRbacAssignment(req, res, next) {
  try {
    const actor = extractActorContext(req);
    const payload = await revokeAssignment(req.params.key, req.params.assignmentId, actor);
    res.json(payload);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

export default {
  listRbacRoles,
  getRbacRole,
  createRbacRole,
  updateRbacRole,
  archiveRbacRole,
  assignRbacRole,
  revokeRbacAssignment
};

