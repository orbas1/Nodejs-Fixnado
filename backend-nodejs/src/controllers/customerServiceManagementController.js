import { validationResult } from 'express-validator';
import {
  listCustomerServiceManagement,
  createCustomerServiceOrder,
  updateCustomerOrderSchedule,
  requestEscrowRelease,
  startCustomerDispute,
  getCustomerOrderDetail
} from '../services/customerServiceManagementService.js';

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return false;
  }
  return true;
}

export async function getCustomerServices(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const data = await listCustomerServiceManagement({ customerId: req.user.id });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function createCustomerService(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const order = await createCustomerServiceOrder({
      customerId: req.user.id,
      serviceId: req.body.serviceId,
      zoneId: req.body.zoneId,
      bookingType: req.body.bookingType,
      scheduledStart: req.body.scheduledStart,
      scheduledEnd: req.body.scheduledEnd,
      baseAmount: req.body.baseAmount,
      currency: req.body.currency,
      demandLevel: req.body.demandLevel,
      notes: req.body.notes
    });
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function updateCustomerServiceSchedule(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const order = await updateCustomerOrderSchedule({
      customerId: req.user.id,
      orderId: req.params.orderId,
      scheduledStart: req.body.scheduledStart,
      scheduledEnd: req.body.scheduledEnd
    });
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function releaseCustomerEscrow(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const order = await requestEscrowRelease({
      customerId: req.user.id,
      orderId: req.params.orderId
    });
    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function startCustomerServiceDispute(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const order = await startCustomerDispute({
      customerId: req.user.id,
      orderId: req.params.orderId,
      reason: req.body.reason,
      regionId: req.body.regionId
    });
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function getCustomerOrderDetails(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const detail = await getCustomerOrderDetail({
      customerId: req.user.id,
      orderId: req.params.orderId
    });
    res.json(detail);
  } catch (error) {
    next(error);
  }
}

export default {
  getCustomerServices,
  createCustomerService,
  updateCustomerServiceSchedule,
  releaseCustomerEscrow,
  startCustomerServiceDispute,
  getCustomerOrderDetails
};
