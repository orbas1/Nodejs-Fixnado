import { validationResult } from 'express-validator';
import {
  getMarketplaceManagementOverview,
  createMarketplaceTool,
  updateMarketplaceTool,
  deleteMarketplaceTool,
  createMarketplaceMaterial,
  updateMarketplaceMaterial,
  deleteMarketplaceMaterial
} from '../services/adminMarketplaceService.js';

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return false;
  }
  return true;
}

export async function getMarketplaceOverview(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }
    const overview = await getMarketplaceManagementOverview({
      companyId: req.query.companyId ?? null,
      limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined
    });
    res.json(overview);
  } catch (error) {
    next(error);
  }
}

export async function createTool(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }
    const record = await createMarketplaceTool(req.body ?? {});
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function updateTool(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }
    const record = await updateMarketplaceTool(req.params.itemId, req.body ?? {});
    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function removeTool(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }
    await deleteMarketplaceTool(req.params.itemId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function createMaterial(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }
    const record = await createMarketplaceMaterial(req.body ?? {});
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function updateMaterial(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }
    const record = await updateMarketplaceMaterial(req.params.itemId, req.body ?? {});
    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function removeMaterial(req, res, next) {
  try {
    if (!handleValidation(req, res)) {
      return;
    }
    await deleteMarketplaceMaterial(req.params.itemId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
