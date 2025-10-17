import { validationResult } from 'express-validator';
import {
  getServicemanOverview,
  updateServicemanProfile,
  createShiftRule,
  updateShiftRule,
  deleteShiftRule,
  createCertification,
  updateCertification,
  deleteCertification,
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem
} from '../services/servicemanControlCentreService.js';

function ensureUser(req) {
  if (!req.user || !req.user.id) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  return req.user.id;
}

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('validation_failed');
    error.statusCode = 422;
    error.details = errors.array();
    throw error;
  }
}

export async function getServicemanOverviewHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const overview = await getServicemanOverview({ userId });
    res.json(overview);
  } catch (error) {
    next(error);
  }
}

export async function updateServicemanProfileHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const profile = await updateServicemanProfile({ userId, payload: req.body.profile });
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function createShiftRuleHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const rule = await createShiftRule({ userId, payload: req.body });
    res.status(201).json({ availability: rule });
  } catch (error) {
    next(error);
  }
}

export async function updateShiftRuleHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const rule = await updateShiftRule({ userId, id: req.params.ruleId, payload: req.body });
    res.json({ availability: rule });
  } catch (error) {
    next(error);
  }
}

export async function deleteShiftRuleHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    await deleteShiftRule({ userId, id: req.params.ruleId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createCertificationHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const certification = await createCertification({ userId, payload: req.body });
    res.status(201).json({ certification });
  } catch (error) {
    next(error);
  }
}

export async function updateCertificationHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const certification = await updateCertification({ userId, id: req.params.certificationId, payload: req.body });
    res.json({ certification });
  } catch (error) {
    next(error);
  }
}

export async function deleteCertificationHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    await deleteCertification({ userId, id: req.params.certificationId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createEquipmentItemHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const item = await createEquipmentItem({ userId, payload: req.body });
    res.status(201).json({ equipment: item });
  } catch (error) {
    next(error);
  }
}

export async function updateEquipmentItemHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    const item = await updateEquipmentItem({ userId, id: req.params.itemId, payload: req.body });
    res.json({ equipment: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteEquipmentItemHandler(req, res, next) {
  try {
    handleValidation(req);
    const userId = ensureUser(req);
    await deleteEquipmentItem({ userId, id: req.params.itemId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
