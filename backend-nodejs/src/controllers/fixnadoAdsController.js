import {
  listFixnadoCampaigns,
  createFixnadoCampaign,
  getFixnadoCampaign,
  updateFixnadoCampaign,
  createFixnadoFlight,
  saveFixnadoTargetingRules,
  recordFixnadoMetric,
  listFixnadoFraudSignals,
  resolveFixnadoFraudSignal,
  getFixnadoCampaignSummary,
  listFixnadoCreatives,
  createFixnadoCreative,
  updateFixnadoCreative,
  deleteFixnadoCreative
} from '../services/fixnadoAdsService.js';

function toPayload(record) {
  if (!record) {
    return record;
  }
  if (Array.isArray(record)) {
    return record.map((item) => toPayload(item));
  }
  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }
  return record;
}

function respondWithError(res, next, error) {
  if (error && (error.statusCode || error.status)) {
    const status = error.statusCode || error.status;
    return res.status(status).json({ message: error.message });
  }
  return next(error);
}

export async function index(req, res, next) {
  try {
    const { status, search, limit, offset } = req.query;
    const payload = await listFixnadoCampaigns({ status, search, limit, offset });
    res.json({ data: payload.data.map(toPayload), meta: payload.meta });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function create(req, res, next) {
  try {
    const campaign = await createFixnadoCampaign(req.body);
    res.status(201).json({ data: toPayload(campaign) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function show(req, res, next) {
  try {
    const campaign = await getFixnadoCampaign(req.params.campaignId, {
      includeMetrics: req.query.includeMetrics === 'true',
      includeFraudSignals: req.query.includeFraudSignals === 'true',
      includeCreatives: req.query.includeCreatives === 'true'
    });
    res.json({ data: toPayload(campaign) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function update(req, res, next) {
  try {
    const campaign = await updateFixnadoCampaign(req.params.campaignId, req.body);
    res.json({ data: toPayload(campaign) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function createFlight(req, res, next) {
  try {
    const flight = await createFixnadoFlight(req.params.campaignId, req.body);
    res.status(201).json({ data: toPayload(flight) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function saveTargeting(req, res, next) {
  try {
    const rules = await saveFixnadoTargetingRules(req.params.campaignId, req.body?.rules || []);
    res.json({ data: toPayload(rules) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function recordMetric(req, res, next) {
  try {
    const metric = await recordFixnadoMetric(req.params.campaignId, req.body);
    res.status(201).json({ data: toPayload(metric) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function fraudSignals(req, res, next) {
  try {
    const signals = await listFixnadoFraudSignals(req.params.campaignId, {
      includeResolved: req.query.includeResolved === 'true'
    });
    res.json({ data: toPayload(signals) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function resolveFraudSignalController(req, res, next) {
  try {
    const signal = await resolveFixnadoFraudSignal(req.params.signalId, req.body || {});
    res.json({ data: toPayload(signal) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function summary(req, res, next) {
  try {
    const snapshot = await getFixnadoCampaignSummary(req.params.campaignId);
    res.json({ data: snapshot });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function creativesIndex(req, res, next) {
  try {
    const creatives = await listFixnadoCreatives(req.params.campaignId);
    res.json({ data: toPayload(creatives) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function creativesCreate(req, res, next) {
  try {
    const creative = await createFixnadoCreative(req.params.campaignId, req.body);
    res.status(201).json({ data: toPayload(creative) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function creativesUpdate(req, res, next) {
  try {
    const creative = await updateFixnadoCreative(req.params.creativeId, req.body);
    res.json({ data: toPayload(creative) });
  } catch (error) {
    respondWithError(res, next, error);
  }
}

export async function creativesDestroy(req, res, next) {
  try {
    await deleteFixnadoCreative(req.params.creativeId);
    res.status(204).send();
  } catch (error) {
    respondWithError(res, next, error);
  }
}
