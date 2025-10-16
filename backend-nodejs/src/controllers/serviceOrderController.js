import { validationResult } from 'express-validator';
import {
  listServiceOrders,
  getServiceOrder,
  createServiceOrder,
  updateServiceOrder,
  updateServiceOrderStatus,
  addServiceOrderNote,
  deleteServiceOrderNote
} from '../services/serviceOrderService.js';

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

export async function listOrders(req, res, next) {
  try {
    const result = await listServiceOrders({ userId: req.user?.id, query: req.query });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    const result = await getServiceOrder(req.params.orderId, { userId: req.user?.id });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  if (handleValidation(req, res)) {
    return;
  }
  try {
    const result = await createServiceOrder({ userId: req.user?.id, payload: req.body });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateOrder(req, res, next) {
  if (handleValidation(req, res)) {
    return;
  }
  try {
    const result = await updateServiceOrder(req.params.orderId, { userId: req.user?.id, payload: req.body });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  if (handleValidation(req, res)) {
    return;
  }
  try {
    const result = await updateServiceOrderStatus(req.params.orderId, { userId: req.user?.id, status: req.body.status });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createOrderNote(req, res, next) {
  if (handleValidation(req, res)) {
    return;
  }
  try {
    const note = await addServiceOrderNote(req.params.orderId, { userId: req.user?.id, payload: req.body });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
}

export async function removeOrderNote(req, res, next) {
  if (handleValidation(req, res)) {
    return;
  }
  try {
    const result = await deleteServiceOrderNote(req.params.orderId, req.params.noteId, { userId: req.user?.id });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
