import { Op } from 'sequelize';
import {
  AdCampaign,
  CampaignCreative,
  CampaignDailyMetric,
  CampaignFraudSignal
} from '../models/index.js';
import {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaign,
  createCampaignFlight,
  upsertTargetingRules,
  recordCampaignDailyMetrics,
  listFraudSignals,
  resolveFraudSignal,
  getCampaignSummary,
  listCampaignCreatives,
  createCampaignCreative,
  updateCampaignCreative,
  deleteCampaignCreative
} from './campaignService.js';

const NETWORK = 'fixnado';
const MAX_LIST_LIMIT = 100;

function fixnadoError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isFixnadoCampaign(campaign) {
  if (!campaign) {
    return false;
  }
  if (campaign.network && campaign.network.toLowerCase() === NETWORK) {
    return true;
  }
  const metaNetwork = campaign.metadata?.network;
  return typeof metaNetwork === 'string' && metaNetwork.toLowerCase() === NETWORK;
}

async function ensureFixnadoCampaign(campaignId, options = {}) {
  const campaign = await getCampaignById(campaignId, options);
  if (!isFixnadoCampaign(campaign)) {
    throw fixnadoError('Campaign does not belong to the Fixnado network', 403);
  }
  return campaign;
}

async function ensureFixnadoSignal(signalId) {
  const signal = await CampaignFraudSignal.findByPk(signalId, {
    include: [{ model: AdCampaign }]
  });
  if (!signal) {
    throw fixnadoError('Fraud signal not found', 404);
  }
  if (!isFixnadoCampaign(signal.AdCampaign)) {
    throw fixnadoError('Fraud signal does not belong to the Fixnado network', 403);
  }
  return signal;
}

async function ensureFixnadoCreative(creativeId) {
  const creative = await CampaignCreative.findByPk(creativeId, {
    include: [{ model: AdCampaign, as: 'campaign' }]
  });
  if (!creative) {
    throw fixnadoError('Creative not found', 404);
  }
  if (!isFixnadoCampaign(creative.campaign)) {
    throw fixnadoError('Creative does not belong to the Fixnado network', 403);
  }
  return creative;
}

export async function listFixnadoCampaigns({ status, search, limit = 25, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 25, 1), MAX_LIST_LIMIT);
  const safeOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

  const where = { network: NETWORK };
  if (status && status !== 'all') {
    where.status = status;
  }
  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { objective: { [Op.iLike]: term } }
    ];
  }

  const { rows, count } = await AdCampaign.findAndCountAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: safeLimit,
    offset: safeOffset
  });

  return {
    data: rows.map((row) => row.toJSON()),
    meta: {
      count: Array.isArray(count) ? count.length : Number(count) || rows.length,
      limit: safeLimit,
      offset: safeOffset
    }
  };
}

export async function createFixnadoCampaign(payload) {
  const metadata = { ...(payload?.metadata || {}), network: NETWORK };
  const created = await createCampaign({ ...payload, metadata, network: NETWORK });
  return created;
}

export async function getFixnadoCampaign(campaignId, options = {}) {
  return ensureFixnadoCampaign(campaignId, {
    ...options,
    includeCreatives: options.includeCreatives ?? true
  });
}

export async function updateFixnadoCampaign(campaignId, updates) {
  await ensureFixnadoCampaign(campaignId);
  const metadata = { ...(updates?.metadata || {}), network: NETWORK };
  const updated = await updateCampaign(campaignId, { ...updates, metadata });
  return updated;
}

export async function createFixnadoFlight(campaignId, payload) {
  await ensureFixnadoCampaign(campaignId);
  return createCampaignFlight(campaignId, payload);
}

export async function saveFixnadoTargetingRules(campaignId, rules = []) {
  await ensureFixnadoCampaign(campaignId);
  return upsertTargetingRules(campaignId, rules);
}

export async function recordFixnadoMetric(campaignId, payload) {
  await ensureFixnadoCampaign(campaignId);
  return recordCampaignDailyMetrics(campaignId, payload);
}

export async function listFixnadoFraudSignals(campaignId, options = {}) {
  await ensureFixnadoCampaign(campaignId);
  return listFraudSignals(campaignId, options);
}

export async function resolveFixnadoFraudSignal(signalId, payload = {}) {
  const signal = await ensureFixnadoSignal(signalId);
  const resolved = await resolveFraudSignal(signal.id, payload);
  return resolved;
}

export async function getFixnadoCampaignSummary(campaignId) {
  await ensureFixnadoCampaign(campaignId);
  return getCampaignSummary(campaignId);
}

export async function listFixnadoCreatives(campaignId) {
  await ensureFixnadoCampaign(campaignId);
  return listCampaignCreatives(campaignId);
}

export async function createFixnadoCreative(campaignId, payload) {
  await ensureFixnadoCampaign(campaignId);
  return createCampaignCreative(campaignId, payload);
}

export async function updateFixnadoCreative(creativeId, updates) {
  await ensureFixnadoCreative(creativeId);
  return updateCampaignCreative(creativeId, updates);
}

export async function deleteFixnadoCreative(creativeId) {
  const creative = await ensureFixnadoCreative(creativeId);
  await deleteCampaignCreative(creative.id);
}

export async function getFixnadoWorkspaceSnapshot({ windowDays = 30 } = {}) {
  const campaigns = await AdCampaign.findAll({
    where: { network: NETWORK },
    order: [['updatedAt', 'DESC']],
    limit: 25
  });

  const campaignIds = campaigns.map((campaign) => campaign.id);
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  let revenue = 0;
  let conversions = 0;
  let creativeCount = 0;

  if (campaignIds.length > 0) {
    const [revenueSum, conversionsSum, creatives] = await Promise.all([
      CampaignDailyMetric.sum('revenue', {
        where: {
          campaignId: { [Op.in]: campaignIds },
          metricDate: { [Op.gte]: windowStart }
        }
      }),
      CampaignDailyMetric.sum('conversions', {
        where: {
          campaignId: { [Op.in]: campaignIds },
          metricDate: { [Op.gte]: windowStart }
        }
      }),
      CampaignCreative.count({ where: { campaignId: { [Op.in]: campaignIds } } })
    ]);

    revenue = Number(revenueSum || 0);
    conversions = Number(conversionsSum || 0);
    creativeCount = creatives;
  }

  const summary = {
    window: `Last ${windowDays} days`,
    revenue,
    adsJobs: conversions,
    currency: campaigns[0]?.currency || 'GBP',
    creatives: creativeCount
  };

  return {
    network: NETWORK,
    summary,
    campaigns: campaigns.map((campaign) => campaign.toJSON()),
    creatives: [],
    targetingRules: [],
    metrics: []
  };
}

export async function listFixnadoCampaignsForCompany({ companyId, status, search }) {
  return listCampaigns({ companyId, status, search, network: NETWORK });
}
