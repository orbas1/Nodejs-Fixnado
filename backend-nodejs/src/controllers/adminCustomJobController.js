import { validationResult } from 'express-validator';
import {
  listCustomJobs,
  getCustomJob,
  createCustomJob,
  updateCustomJob,
  awardCustomJob,
  addBidMessage
} from '../services/adminCustomJobService.js';

function handleServiceError(res, next, error) {
  if (error?.statusCode) {
    const payload = { message: error.message };
    if (error.code) {
      payload.code = error.code;
    }
    return res.status(error.statusCode).json(payload);
  }
  return next(error);
}

export async function listAdminCustomJobsHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const result = await listCustomJobs({
      status: req.query.status,
      zoneId: req.query.zoneId,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getAdminCustomJobHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const job = await getCustomJob(req.params.id);
    return res.json(job);
  } catch (error) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ message: 'custom_job_not_found' });
    }
    return next(error);
  }
}

export async function createAdminCustomJobHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const job = await createCustomJob(req.body, req.user?.id ?? null);
    return res.status(201).json(job);
  } catch (error) {
    return handleServiceError(res, next, error);
  }
}

export async function updateAdminCustomJobHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const job = await updateCustomJob(req.params.id, req.body, req.user?.id ?? null);
    return res.json(job);
  } catch (error) {
    return handleServiceError(res, next, error);
  }
}

export async function awardAdminCustomJobHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const job = await awardCustomJob(req.params.id, req.body.bidId, req.user?.id ?? null);
    return res.json(job);
  } catch (error) {
    return handleServiceError(res, next, error);
  }
}

export async function addAdminCustomJobBidMessageHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const bid = await addBidMessage(
      req.params.id,
      req.params.bidId,
      req.user?.id ?? null,
      req.body.body,
      req.body.attachments
    );
    return res.status(201).json(bid);
  } catch (error) {
    return handleServiceError(res, next, error);
  }
}

export default {
  listAdminCustomJobsHandler,
  getAdminCustomJobHandler,
  createAdminCustomJobHandler,
  updateAdminCustomJobHandler,
  awardAdminCustomJobHandler,
  addAdminCustomJobBidMessageHandler
};
