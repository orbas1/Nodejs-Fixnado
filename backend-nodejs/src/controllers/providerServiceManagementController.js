import { validationResult } from 'express-validator';
import {
  listProviderServicesWorkspace,
  getProviderService,
  createProviderService,
  updateProviderService,
  deleteProviderService
} from '../services/providerServiceManagementService.js';

export async function listProviderServicesHandler(req, res, next) {
  try {
    const workspace = await listProviderServicesWorkspace({
      companyId: req.query?.companyId,
      actor: req.user,
      search: req.query?.search,
      status: req.query?.status,
      visibility: req.query?.visibility
    });
    res.json({ data: workspace });
  } catch (error) {
    next(error);
  }
}

export async function getProviderServiceHandler(req, res, next) {
  try {
    const service = await getProviderService(req.params.serviceId, {
      companyId: req.query?.companyId,
      actor: req.user
    });
    res.json({ data: service });
  } catch (error) {
    next(error);
  }
}

export async function createProviderServiceHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const service = await createProviderService(req.body ?? {}, {
      companyId: req.body?.companyId ?? req.query?.companyId,
      actor: req.user
    });
    res.status(201).json({ data: service });
  } catch (error) {
    next(error);
  }
}

export async function updateProviderServiceHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const service = await updateProviderService(req.params.serviceId, req.body ?? {}, {
      companyId: req.body?.companyId ?? req.query?.companyId,
      actor: req.user
    });
    res.json({ data: service });
  } catch (error) {
    next(error);
  }
}

export async function deleteProviderServiceHandler(req, res, next) {
  try {
    await deleteProviderService(req.params.serviceId, {
      companyId: req.body?.companyId ?? req.query?.companyId,
      actor: req.user
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
