import {
  createCampaign as createCampaignRecord,
  listCampaigns as listCampaignRecords,
  getCampaignById,
  updateCampaign as updateCampaignRecord,
  createCampaignFlight as createCampaignFlightRecord,
  upsertTargetingRules,
  recordCampaignDailyMetrics,
  listFraudSignals as listFraudSignalRecords,
  resolveFraudSignal as resolveFraudSignalRecord,
  getCampaignSummary
} from '../services/campaignService.js';

function respondWithError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

export async function createCampaign(req, res, next) {
  try {
    const campaign = await createCampaignRecord(req.body);
    res.status(201).json(campaign.toJSON());
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function listCampaigns(req, res, next) {
  try {
    const { companyId, status, limit, offset } = req.query;
    const campaigns = await listCampaignRecords({
      companyId,
      status,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined
    });
    res.json(campaigns.map((campaign) => campaign.toJSON()));
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function getCampaign(req, res, next) {
  try {
    const campaign = await getCampaignById(req.params.campaignId, {
      includeMetrics: req.query.includeMetrics === 'true',
      includeFraudSignals: req.query.includeFraudSignals === 'true'
    });
    res.json(campaign.toJSON());
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function updateCampaign(req, res, next) {
  try {
    const campaign = await updateCampaignRecord(req.params.campaignId, req.body);
    res.json(campaign.toJSON());
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function createCampaignFlight(req, res, next) {
  try {
    const flight = await createCampaignFlightRecord(req.params.campaignId, req.body);
    res.status(201).json(flight.toJSON());
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function saveTargetingRules(req, res, next) {
  try {
    const rules = await upsertTargetingRules(req.params.campaignId, req.body?.rules || []);
    res.status(200).json(rules.map((rule) => rule.toJSON()));
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function ingestDailyMetrics(req, res, next) {
  try {
    const metric = await recordCampaignDailyMetrics(req.params.campaignId, req.body);
    res.status(201).json(metric.toJSON());
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function listFraudSignals(req, res, next) {
  try {
    const signals = await listFraudSignalRecords(req.params.campaignId, {
      includeResolved: req.query.includeResolved === 'true'
    });
    res.json(signals.map((signal) => signal.toJSON()));
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function resolveFraudSignal(req, res, next) {
  try {
    const signal = await resolveFraudSignalRecord(req.params.signalId, req.body || {});
    res.json(signal.toJSON());
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function campaignSummary(req, res, next) {
  try {
    const summary = await getCampaignSummary(req.params.campaignId);
    res.json(summary);
  } catch (error) {
    respondWithError(res, next, error);
  }
}
