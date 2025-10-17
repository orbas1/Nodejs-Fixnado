import {
  getProviderCustomJobWorkspace,
  searchProviderCustomJobOpportunities,
  createProviderCustomJob,
  submitProviderCustomJobBid,
  updateProviderCustomJobBid,
  withdrawProviderCustomJobBid,
  addProviderCustomJobBidMessage,
  inviteProviderCustomJobParticipant,
  updateProviderCustomJobInvitation,
  createProviderCustomJobReport,
  updateProviderCustomJobReport,
  deleteProviderCustomJobReport
} from '../services/providerCustomJobService.js';
import { validationResult } from 'express-validator';

function handleServiceError(error, res, next) {
  if (error?.statusCode || error?.status) {
    const status = error.statusCode || error.status;
    return res.status(status).json({ message: error.message || 'request_failed' });
  }
  return next(error);
}

function validateRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return false;
  }
  return true;
}

export async function getProviderCustomJobWorkspaceHandler(req, res, next) {
  try {
    const result = await getProviderCustomJobWorkspace({
      companyId: req.query.companyId,
      actor: req.user,
      filters: req.query || {}
    });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function searchProviderCustomJobOpportunitiesHandler(req, res, next) {
  try {
    const result = await searchProviderCustomJobOpportunities({
      companyId: req.query.companyId,
      actor: req.user,
      filters: req.query || {},
      pagination: { limit: req.query.limit, offset: req.query.offset }
    });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function createProviderCustomJobHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await createProviderCustomJob({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      payload: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function submitProviderCustomJobBidHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await submitProviderCustomJobBid({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      postId: req.params.postId,
      payload: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function updateProviderCustomJobBidHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await updateProviderCustomJobBid({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      bidId: req.params.bidId,
      payload: req.body
    });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function withdrawProviderCustomJobBidHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await withdrawProviderCustomJobBid({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      bidId: req.params.bidId
    });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function addProviderCustomJobBidMessageHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await addProviderCustomJobBidMessage({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      bidId: req.params.bidId,
      postId: req.body.postId,
      body: req.body.body,
      attachments: req.body.attachments
    });
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function inviteProviderCustomJobParticipantHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await inviteProviderCustomJobParticipant({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      postId: req.params.postId,
      payload: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function updateProviderCustomJobInvitationHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await updateProviderCustomJobInvitation({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      invitationId: req.params.invitationId,
      payload: req.body
    });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function createProviderCustomJobReportHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await createProviderCustomJobReport({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      payload: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function updateProviderCustomJobReportHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await updateProviderCustomJobReport({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      reportId: req.params.reportId,
      payload: req.body
    });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export async function deleteProviderCustomJobReportHandler(req, res, next) {
  try {
    if (!validateRequest(req, res)) {
      return;
    }
    const result = await deleteProviderCustomJobReport({
      companyId: req.body.companyId || req.query.companyId,
      actor: req.user,
      reportId: req.params.reportId
    });
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, next);
  }
}

export default {
  getProviderCustomJobWorkspaceHandler,
  searchProviderCustomJobOpportunitiesHandler,
  submitProviderCustomJobBidHandler,
  updateProviderCustomJobBidHandler,
  withdrawProviderCustomJobBidHandler,
  addProviderCustomJobBidMessageHandler,
  createProviderCustomJobHandler,
  inviteProviderCustomJobParticipantHandler,
  updateProviderCustomJobInvitationHandler,
  createProviderCustomJobReportHandler,
  updateProviderCustomJobReportHandler,
  deleteProviderCustomJobReportHandler
};
