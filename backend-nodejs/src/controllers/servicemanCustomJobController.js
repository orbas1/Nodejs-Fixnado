import { validationResult } from 'express-validator';
import {
  listServicemanCustomJobs,
  getServicemanCustomJob,
  createServicemanCustomJobBid,
  updateServicemanCustomJobBid,
  withdrawServicemanCustomJobBid,
  addServicemanCustomJobBidMessage,
  getServicemanCustomJobReports
} from '../services/servicemanCustomJobService.js';

function handleServiceError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return next(error);
}

export async function listServicemanCustomJobsHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = await listServicemanCustomJobs({
      providerId: req.user?.id,
      status: req.query.status,
      zoneId: req.query.zoneId || null,
      search: req.query.search || '',
      limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined,
      offset: req.query.offset ? Number.parseInt(req.query.offset, 10) : undefined
    });

    res.json(payload);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getServicemanCustomJobHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const job = await getServicemanCustomJob(req.params.id, req.user?.id);
    res.json(job);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createServicemanCustomJobBidHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const bid = await createServicemanCustomJobBid(
      req.params.id,
      req.user?.id,
      req.user?.type,
      {
        amount: req.body.amount,
        currency: req.body.currency,
        message: req.body.message,
        attachments: req.body.attachments
      },
      req.auth?.actor ?? null
    );

    res.status(201).json(bid);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateServicemanCustomJobBidHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const bid = await updateServicemanCustomJobBid(
      req.params.id,
      req.params.bidId,
      req.user?.id,
      {
        amount: req.body.amount,
        currency: req.body.currency,
        message: req.body.message,
        metadata: req.body.metadata
      }
    );

    res.json(bid);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function withdrawServicemanCustomJobBidHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const bid = await withdrawServicemanCustomJobBid(
      req.params.id,
      req.params.bidId,
      req.user?.id,
      req.body.reason ?? null
    );

    res.json(bid);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function addServicemanCustomJobBidMessageHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const message = await addServicemanCustomJobBidMessage(
      req.params.id,
      req.params.bidId,
      req.user?.id,
      req.body.body,
      req.body.attachments,
      req.auth?.actor ?? null
    );

    res.status(201).json(message);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getServicemanCustomJobReportsHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const report = await getServicemanCustomJobReports({
      providerId: req.user?.id,
      rangeStart: req.query.rangeStart || null,
      rangeEnd: req.query.rangeEnd || null
    });

    res.json(report);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export default {
  listServicemanCustomJobsHandler,
  getServicemanCustomJobHandler,
  createServicemanCustomJobBidHandler,
  updateServicemanCustomJobBidHandler,
  withdrawServicemanCustomJobBidHandler,
  addServicemanCustomJobBidMessageHandler,
  getServicemanCustomJobReportsHandler
};
