import { validationResult } from 'express-validator';
import {
  listServiceCatalogue,
  createServiceOffering,
  purchaseServiceOffering
} from '../services/serviceOrchestrationService.js';

export async function listServices(req, res, next) {
  try {
    const limit = Number.parseInt(req.query.limit ?? '50', 10);
    const offset = Number.parseInt(req.query.offset ?? '0', 10);
    const services = await listServiceCatalogue({
      limit: Number.isNaN(limit) ? 50 : limit,
      offset: Number.isNaN(offset) ? 0 : offset,
      companyId: req.query.companyId || null,
      providerId: req.query.providerId || null,
      includeCompleted: req.query.includeCompleted === 'true'
    });
    res.json(services);
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const service = await createServiceOffering({
      providerId: req.user.id,
      companyId: req.body.companyId || null,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      currency: req.body.currency
    });

    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
}

export async function purchaseService(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const result = await purchaseServiceOffering({
      serviceId: req.params.serviceId,
      buyerId: req.user.id,
      zoneId: req.body.zoneId,
      bookingType: req.body.bookingType,
      scheduledStart: req.body.scheduledStart,
      scheduledEnd: req.body.scheduledEnd,
      demandLevel: req.body.demandLevel,
      baseAmount: req.body.baseAmount ?? req.body.totalAmount,
      currency: req.body.currency,
      metadata: req.body.metadata
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
