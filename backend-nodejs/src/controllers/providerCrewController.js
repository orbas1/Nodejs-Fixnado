import {
  listCrewManagement,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
  upsertAvailability,
  deleteAvailability,
  upsertDeployment,
  deleteDeployment,
  upsertDelegation,
  deleteDelegation
} from '../services/providerCrewService.js';

function resolveCompanyId(req) {
  return req.query?.companyId || req.body?.companyId || null;
}

export async function getProviderCrewManagementHandler(req, res, next) {
  try {
    const payload = await listCrewManagement({ companyId: resolveCompanyId(req), actor: req.user });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export async function createProviderCrewMemberHandler(req, res, next) {
  try {
    const crewMember = await createCrewMember({
      companyId: resolveCompanyId(req),
      actor: req.user,
      payload: req.body || {}
    });
    res.status(201).json({ data: crewMember });
  } catch (error) {
    next(error);
  }
}

export async function updateProviderCrewMemberHandler(req, res, next) {
  try {
    const crewMember = await updateCrewMember({
      companyId: resolveCompanyId(req),
      actor: req.user,
      crewMemberId: req.params.crewMemberId,
      payload: req.body || {}
    });
    res.json({ data: crewMember });
  } catch (error) {
    next(error);
  }
}

export async function deleteProviderCrewMemberHandler(req, res, next) {
  try {
    await deleteCrewMember({
      companyId: resolveCompanyId(req),
      actor: req.user,
      crewMemberId: req.params.crewMemberId
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function upsertProviderCrewAvailabilityHandler(req, res, next) {
  try {
    const availability = await upsertAvailability({
      companyId: resolveCompanyId(req),
      actor: req.user,
      crewMemberId: req.params.crewMemberId,
      availabilityId: req.params.availabilityId,
      payload: req.body || {}
    });
    res.status(req.params.availabilityId ? 200 : 201).json({ data: availability });
  } catch (error) {
    next(error);
  }
}

export async function deleteProviderCrewAvailabilityHandler(req, res, next) {
  try {
    await deleteAvailability({
      companyId: resolveCompanyId(req),
      actor: req.user,
      crewMemberId: req.params.crewMemberId,
      availabilityId: req.params.availabilityId
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function upsertProviderCrewDeploymentHandler(req, res, next) {
  try {
    const deployment = await upsertDeployment({
      companyId: resolveCompanyId(req),
      actor: req.user,
      deploymentId: req.params.deploymentId,
      payload: req.body || {}
    });
    res.status(req.params.deploymentId ? 200 : 201).json({ data: deployment });
  } catch (error) {
    next(error);
  }
}

export async function deleteProviderCrewDeploymentHandler(req, res, next) {
  try {
    await deleteDeployment({
      companyId: resolveCompanyId(req),
      actor: req.user,
      deploymentId: req.params.deploymentId
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function upsertProviderCrewDelegationHandler(req, res, next) {
  try {
    const delegation = await upsertDelegation({
      companyId: resolveCompanyId(req),
      actor: req.user,
      delegationId: req.params.delegationId,
      payload: req.body || {}
    });
    res.status(req.params.delegationId ? 200 : 201).json({ data: delegation });
  } catch (error) {
    next(error);
  }
}

export async function deleteProviderCrewDelegationHandler(req, res, next) {
  try {
    await deleteDelegation({
      companyId: resolveCompanyId(req),
      actor: req.user,
      delegationId: req.params.delegationId
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export default {
  getProviderCrewManagementHandler,
  createProviderCrewMemberHandler,
  updateProviderCrewMemberHandler,
  deleteProviderCrewMemberHandler,
  upsertProviderCrewAvailabilityHandler,
  deleteProviderCrewAvailabilityHandler,
  upsertProviderCrewDeploymentHandler,
  deleteProviderCrewDeploymentHandler,
  upsertProviderCrewDelegationHandler,
  deleteProviderCrewDelegationHandler
};
