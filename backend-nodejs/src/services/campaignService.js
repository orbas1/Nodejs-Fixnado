import { Op } from 'sequelize';
import config from '../config/index.js';
import {
  sequelize,
  AdCampaign,
  CampaignFlight,
  CampaignTargetingRule,
  CampaignInvoice,
  CampaignDailyMetric,
  CampaignFraudSignal,
  CampaignAnalyticsExport,
  CampaignCreative,
  CampaignAudienceSegment,
  CampaignPlacement,
  Company
  Company,
  CampaignCreative
} from '../models/index.js';
import { recordAnalyticsEvent } from './analyticsEventService.js';

const campaignConfig = {
  overspendTolerance: config.campaigns?.overspendTolerance ?? 0.15,
  underspendTolerance: config.campaigns?.underspendTolerance ?? 0.25,
  suspiciousCtrThreshold: config.campaigns?.suspiciousCtrThreshold ?? 0.18,
  suspiciousCvrThreshold: config.campaigns?.suspiciousCvrThreshold ?? 0.45,
  deliveryGapImpressionFloor: config.campaigns?.deliveryGapImpressionFloor ?? 100,
  noSpendGraceDays: config.campaigns?.noSpendGraceDays ?? 2,
  exportBatchSize: config.campaigns?.exportBatchSize ?? 200
};

function campaignError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureDate(value, fieldName) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw campaignError(`${fieldName} must be a valid date`);
  }
  return date;
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

function normaliseInteger(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function normaliseAmount(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function normaliseDecimal(value, precision = 6) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Number(parsed.toFixed(precision));
}

function calculateSpendTarget({ campaign, flight, metricDate: _metricDate }) {
  if (flight && flight.dailySpendCap) {
    return Number(flight.dailySpendCap);
  }
  if (campaign.dailySpendCap) {
    return Number(campaign.dailySpendCap);
  }

  const start = flight ? new Date(flight.startAt) : new Date(campaign.startAt);
  const end = flight ? new Date(flight.endAt) : new Date(campaign.endAt);
  const totalBudget = flight ? Number(flight.budget) : Number(campaign.totalBudget);

  const durationMs = Math.max(end.getTime() - start.getTime(), 0);
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(Math.ceil(durationMs / dayMs), 1);

  return Number(totalBudget / totalDays);
}

function buildAnalyticsPayload({ metric, campaign, flight }) {
  return {
    campaignId: campaign.id,
    flightId: flight ? flight.id : null,
    companyId: campaign.companyId,
    metricDate: new Date(metric.metricDate).toISOString(),
    impressions: metric.impressions,
    clicks: metric.clicks,
    conversions: metric.conversions,
    spend: Number(metric.spend),
    revenue: Number(metric.revenue),
    spendTarget: metric.spendTarget ? Number(metric.spendTarget) : null,
    ctr: metric.ctr !== null ? Number(metric.ctr) : null,
    cvr: metric.cvr !== null ? Number(metric.cvr) : null,
    anomalyScore: metric.anomalyScore !== null ? Number(metric.anomalyScore) : null,
    currency: campaign.currency,
    campaignStatus: campaign.status,
    pacingStrategy: campaign.pacingStrategy,
    objective: campaign.objective
  };
}

function resolveExistingSignals(signals, typesToResolve, transaction) {
  return Promise.all(
    signals
      .filter((signal) => typesToResolve.includes(signal.signalType) && !signal.resolvedAt)
      .map((signal) =>
        signal.update(
          {
            resolvedAt: new Date(),
            resolutionNote: 'Condition returned within configured thresholds.'
          },
          { transaction }
        )
      )
  );
}

function evaluateAnomalies({ metric, spendTarget, campaign, flight }) {
  const signals = [];
  const resolvedTypes = [];
  const spend = Number(metric.spend);
  const impressions = Number(metric.impressions);
  const clicks = Number(metric.clicks);
  const conversions = Number(metric.conversions);

  if (spendTarget) {
    const overspendThreshold = spendTarget * (1 + campaignConfig.overspendTolerance);
    if (spend > overspendThreshold) {
      signals.push({
        signalType: 'overspend',
        severity: spend > overspendThreshold * 1.15 ? 'critical' : 'warning',
        metadata: {
          spend,
          spendTarget,
          tolerance: campaignConfig.overspendTolerance
        }
      });
    } else {
      resolvedTypes.push('overspend');
    }

    const underspendThreshold = spendTarget * (1 - campaignConfig.underspendTolerance);
    if (spendTarget > 0 && spend < underspendThreshold) {
      signals.push({
        signalType: 'underspend',
        severity: 'warning',
        metadata: {
          spend,
          spendTarget,
          tolerance: campaignConfig.underspendTolerance
        }
      });
    } else {
      resolvedTypes.push('underspend');
    }
  }

  const ctr = impressions > 0 ? clicks / impressions : 0;
  const cvr = clicks > 0 ? conversions / clicks : 0;

  if (ctr > campaignConfig.suspiciousCtrThreshold) {
    signals.push({
      signalType: 'suspicious_ctr',
      severity: ctr > campaignConfig.suspiciousCtrThreshold * 1.5 ? 'critical' : 'warning',
      metadata: {
        ctr,
        impressions,
        clicks,
        threshold: campaignConfig.suspiciousCtrThreshold
      }
    });
  } else {
    resolvedTypes.push('suspicious_ctr');
  }

  if (cvr > campaignConfig.suspiciousCvrThreshold) {
    signals.push({
      signalType: 'suspicious_cvr',
      severity: cvr > campaignConfig.suspiciousCvrThreshold * 1.5 ? 'critical' : 'warning',
      metadata: {
        cvr,
        conversions,
        clicks,
        threshold: campaignConfig.suspiciousCvrThreshold
      }
    });
  } else {
    resolvedTypes.push('suspicious_cvr');
  }

  if (spend > 0 && impressions < campaignConfig.deliveryGapImpressionFloor) {
    signals.push({
      signalType: 'delivery_gap',
      severity: 'warning',
      metadata: {
        spend,
        impressions,
        impressionFloor: campaignConfig.deliveryGapImpressionFloor
      }
    });
  } else {
    resolvedTypes.push('delivery_gap');
  }

  const flightStart = flight ? new Date(flight.startAt) : new Date(campaign.startAt);
  const metricDate = new Date(metric.metricDate);
  const daysActive = Math.max(
    Math.floor((metricDate.getTime() - flightStart.getTime()) / (24 * 60 * 60 * 1000)),
    0
  );
  if (daysActive > campaignConfig.noSpendGraceDays && spend === 0) {
    signals.push({
      signalType: 'no_spend',
      severity: 'warning',
      metadata: {
        daysActive,
        graceDays: campaignConfig.noSpendGraceDays
      }
    });
  } else {
    resolvedTypes.push('no_spend');
  }

  const anomalyScore = signals.length > 0 ? Math.min(signals.length / 5, 1) : 0;

  return { signals, resolvedTypes, ctr, cvr, anomalyScore };
}

function includeRelationsForCampaign(options = {}) {
  const include = [
    { model: CampaignFlight, as: 'flights' },
    { model: CampaignTargetingRule, as: 'targetingRules' },
    { model: CampaignInvoice, as: 'invoices' },
    { model: CampaignCreative, as: 'creatives', include: options.includeCreativeFlight ? [{ model: CampaignFlight, as: 'flight' }] : [] },
    { model: CampaignAudienceSegment, as: 'audienceSegments' },
    { model: CampaignPlacement, as: 'placements', include: options.includePlacementFlight ? [{ model: CampaignFlight, as: 'flight' }] : [] }
  ];

  if (options.includeCreatives) {
    include.push({
      model: CampaignCreative,
      as: 'creatives',
      separate: true,
      order: [['createdAt', 'DESC']]
    });
  }

  if (options.includeMetrics) {
    include.push({
      model: CampaignDailyMetric,
      as: 'dailyMetrics',
      include: [{ model: CampaignAnalyticsExport, as: 'analyticsExport' }],
      order: [['metricDate', 'DESC']]
    });
  }

  if (options.includeFraudSignals) {
    include.push({ model: CampaignFraudSignal, as: 'fraudSignals' });
  }

  include.push({ model: Company, attributes: ['id', 'legalStructure', 'verified'] });

  return include;
}

export async function createCampaign({
  companyId,
  name,
  objective,
  campaignType,
  status = 'draft',
  pacingStrategy = 'even',
  bidStrategy = 'cpc',
  currency,
  totalBudget,
  dailySpendCap = null,
  startAt,
  endAt,
  metadata = {},
  network = 'fixnado'
}) {
  if (!companyId || !name || !objective || !totalBudget || !startAt || !endAt) {
    throw campaignError('companyId, name, objective, budget, startAt, and endAt are required fields');
  }

  const resolvedNetwork = typeof network === 'string' && network.trim().length > 0 ? network.trim() : 'fixnado';
  const resolvedMetadata = { ...(metadata || {}) };
  if (!resolvedMetadata.network) {
    resolvedMetadata.network = resolvedNetwork;
  }

  return sequelize.transaction(async (transaction) => {
    const company = await Company.findByPk(companyId, { transaction });
    if (!company) {
      throw campaignError('Company not found', 404);
    }

    const campaign = await AdCampaign.create(
      {
        companyId,
        name,
        objective,
        campaignType,
        status,
        pacingStrategy,
        bidStrategy,
        currency: currency ? currency.toUpperCase() : config.finance.defaultCurrency,
        totalBudget,
        dailySpendCap,
        startAt: ensureDate(startAt, 'startAt'),
        endAt: ensureDate(endAt, 'endAt'),
        metadata: resolvedMetadata,
        network: resolvedNetwork
      },
      { transaction }
    );

    return campaign;
  });
}

export async function listCampaigns({
  companyId,
  status,
  limit = 50,
  offset = 0,
  includeMetrics = false,
  includeFraudSignals = false,
  includeCreativeFlight = false,
  includePlacementFlight = false
} = {}) {
export async function listCampaigns({ companyId, status, search, network, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }
  if (status) {
    where.status = status;
  }
  if (network) {
    where.network = network;
  }
  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { objective: { [Op.iLike]: term } }
    ];
  }

  return AdCampaign.findAll({
    where,
    include: includeRelationsForCampaign({
      includeMetrics,
      includeFraudSignals,
      includeCreativeFlight,
      includePlacementFlight
    }),
    order: [['updatedAt', 'DESC']],
    limit,
    offset
  });
}

export async function getCampaignById(id, options = {}) {
  const campaign = await AdCampaign.findByPk(id, {
    include: includeRelationsForCampaign(options)
  });

  if (!campaign) {
    throw campaignError('Campaign not found', 404);
  }

  return campaign;
}

export async function updateCampaign(id, updates) {
  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(id, { transaction });
    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    const updatableFields = [
      'name',
      'objective',
      'campaignType',
      'status',
      'pacingStrategy',
      'bidStrategy',
      'currency',
      'totalBudget',
      'dailySpendCap',
      'startAt',
      'endAt',
      'metadata'
    ];

    for (const field of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        const value = updates[field];
        if (['startAt', 'endAt'].includes(field) && value) {
          campaign[field] = ensureDate(value, field);
        } else if (field === 'currency' && value) {
          campaign[field] = value.toUpperCase();
        } else {
          campaign[field] = value;
        }
      }
    }

    await campaign.save({ transaction });
    return campaign;
  });
}

export async function createCampaignFlight(campaignId, {
  name,
  startAt,
  endAt,
  budget,
  dailySpendCap = null,
  status = 'scheduled'
}) {
  if (!name || !startAt || !endAt || !budget) {
    throw campaignError('name, startAt, endAt, and budget are required to create a flight');
  }

  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(campaignId, { transaction });
    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    const flight = await CampaignFlight.create(
      {
        campaignId,
        name,
        status,
        startAt: ensureDate(startAt, 'startAt'),
        endAt: ensureDate(endAt, 'endAt'),
        budget,
        dailySpendCap
      },
      { transaction }
    );

    return flight;
  });
}

export async function upsertTargetingRules(campaignId, rules = []) {
  if (!Array.isArray(rules)) {
    throw campaignError('rules must be an array');
  }

  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(campaignId, { transaction });
    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    await CampaignTargetingRule.destroy({ where: { campaignId }, transaction });

    if (rules.length === 0) {
      return [];
    }

    const records = rules.map((rule) => ({
      campaignId,
      ruleType: rule.ruleType,
      operator: rule.operator || 'include',
      payload: rule.payload || {}
    }));

    return CampaignTargetingRule.bulkCreate(records, { transaction, returning: true });
  });
}

export async function createCampaignCreative(campaignId, payload) {
  const required = ['name', 'format', 'status', 'assetUrl'];
  required.forEach((field) => {
    if (!payload?.[field]) {
      throw campaignError(`${field} is required to create a creative`);
    }
  });

  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(campaignId, { transaction });
    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    const creative = await CampaignCreative.create(
      {
        campaignId,
        flightId: payload.flightId || null,
        name: payload.name,
        format: payload.format,
        status: payload.status,
        headline: payload.headline || null,
        description: payload.description || null,
        callToAction: payload.callToAction || null,
        assetUrl: payload.assetUrl,
        thumbnailUrl: payload.thumbnailUrl || null,
        metadata: payload.metadata || {}
      },
      { transaction }
    );

    return creative;
  });
}

export async function updateCampaignCreative(campaignId, creativeId, updates = {}) {
  return sequelize.transaction(async (transaction) => {
    const creative = await CampaignCreative.findOne({
      where: { id: creativeId, campaignId },
      transaction
    });

    if (!creative) {
      throw campaignError('Creative not found', 404);
    }

    const allowed = [
      'name',
      'format',
      'status',
      'headline',
      'description',
      'callToAction',
      'assetUrl',
      'thumbnailUrl',
      'metadata',
      'flightId'
    ];

    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        creative[field] = updates[field];
      }
    });

    await creative.save({ transaction });
    return creative;
  });
}

export async function deleteCampaignCreative(campaignId, creativeId) {
  return sequelize.transaction(async (transaction) => {
    const deleted = await CampaignCreative.destroy({
      where: { id: creativeId, campaignId },
      transaction
    });

    if (!deleted) {
      throw campaignError('Creative not found', 404);
    }

    return true;
  });
}

export async function upsertAudienceSegments(campaignId, segments = []) {
  if (!Array.isArray(segments)) {
    throw campaignError('segments must be an array');
  }

  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(campaignId, { transaction });
    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    await CampaignAudienceSegment.destroy({ where: { campaignId }, transaction });

    if (segments.length === 0) {
      return [];
    }

    const records = segments.map((segment) => ({
      campaignId,
      name: segment.name,
      segmentType: segment.segmentType || 'custom',
      status: segment.status || 'draft',
      sizeEstimate: segment.sizeEstimate ?? null,
      engagementRate: segment.engagementRate ?? null,
      syncedAt: segment.syncedAt ? ensureDate(segment.syncedAt, 'syncedAt') : null,
      metadata: segment.metadata || {}
    }));

    return CampaignAudienceSegment.bulkCreate(records, { transaction, returning: true });
  });
}

export async function upsertPlacements(campaignId, placements = []) {
  if (!Array.isArray(placements)) {
    throw campaignError('placements must be an array');
  }

  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(campaignId, { transaction });
    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    await CampaignPlacement.destroy({ where: { campaignId }, transaction });

    if (placements.length === 0) {
      return [];
    }

    const records = placements.map((placement) => ({
      campaignId,
      flightId: placement.flightId || null,
      channel: placement.channel || 'marketplace',
      format: placement.format || 'native',
      status: placement.status || 'planned',
      bidAmount: placement.bidAmount ?? null,
      bidCurrency: placement.bidCurrency || campaign.currency || 'GBP',
      cpm: placement.cpm ?? null,
      inventorySource: placement.inventorySource || null,
      metadata: placement.metadata || {}
    }));

    return CampaignPlacement.bulkCreate(records, { transaction, returning: true });
  });
}

async function upsertAnalyticsExport(metric, campaign, flight, transaction) {
  const payload = buildAnalyticsPayload({ metric, campaign, flight });
  const [exportRecord] = await CampaignAnalyticsExport.upsert(
    {
      campaignDailyMetricId: metric.id,
      payload,
      status: 'pending',
      lastError: null,
      lastAttemptAt: null
    },
    { transaction, returning: true }
  );

  return exportRecord;
}

async function openFraudSignals({
  campaign,
  flight,
  metric,
  signals,
  transaction
}) {
  if (signals.length === 0) {
    return [];
  }

  const records = [];
  for (const signal of signals) {
    const [record, created] = await CampaignFraudSignal.findOrCreate({
      where: {
        campaignId: campaign.id,
        flightId: flight ? flight.id : null,
        metricDate: metric.metricDate,
        signalType: signal.signalType
      },
      defaults: {
        campaignId: campaign.id,
        flightId: flight ? flight.id : null,
        metricDate: metric.metricDate,
        signalType: signal.signalType,
        severity: signal.severity,
        metadata: signal.metadata
      },
      transaction
    });

    const updatedRecord = created
      ? record
      : await record.update(
          {
            severity: signal.severity,
            metadata: signal.metadata,
            detectedAt: new Date(),
            resolvedAt: null,
            resolutionNote: null
          },
          { transaction }
        );

    const metricDateIso = metric.metricDate instanceof Date
      ? metric.metricDate.toISOString()
      : new Date(metric.metricDate).toISOString();

    await recordAnalyticsEvent(
      {
        name: 'ads.campaign.fraud_signal',
        entityId: updatedRecord.id,
        tenantId: campaign.companyId,
        occurredAt: new Date(),
        metadata: {
          campaignId: campaign.id,
          companyId: campaign.companyId,
          flightId: flight ? flight.id : null,
          signalType: signal.signalType,
          severity: signal.severity,
          metricDate: metricDateIso,
          detection: signal.metadata
        }
      },
      { transaction }
    );

    records.push(updatedRecord);
  }

  return records;
}

export async function recordCampaignDailyMetrics(campaignId, {
  flightId = null,
  metricDate,
  impressions = 0,
  clicks = 0,
  conversions = 0,
  spend = 0,
  revenue = 0,
  metadata = {}
}) {
  if (!metricDate) {
    throw campaignError('metricDate is required');
  }

  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(campaignId, {
      include: [{ model: CampaignFlight, as: 'flights' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    let flight = null;
    if (flightId) {
      flight = campaign.flights?.find((candidate) => candidate.id === flightId) || null;
      if (!flight) {
        throw campaignError('Flight does not belong to campaign', 400);
      }
    }

    const date = ensureDate(metricDate, 'metricDate');
    const normalisedImpressions = normaliseInteger(impressions);
    const normalisedClicks = normaliseInteger(clicks);
    const normalisedConversions = normaliseInteger(conversions);
    const normalisedSpend = normaliseAmount(spend);
    const normalisedRevenue = normaliseAmount(revenue);

    const defaults = {
      campaignId,
      flightId,
      metricDate: date,
      impressions: normalisedImpressions,
      clicks: normalisedClicks,
      conversions: normalisedConversions,
      spend: normalisedSpend,
      revenue: normalisedRevenue,
      metadata
    };

    const [metric, created] = await CampaignDailyMetric.findOrCreate({
      where: {
        campaignId,
        flightId,
        metricDate: date
      },
      defaults,
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!created) {
      Object.assign(metric, {
        impressions: normalisedImpressions,
        clicks: normalisedClicks,
        conversions: normalisedConversions,
        spend: normalisedSpend,
        revenue: normalisedRevenue,
        metadata: { ...metric.metadata, ...metadata }
      });
    }

    const spendTarget = calculateSpendTarget({ campaign, flight, metricDate: date });
    const evaluation = evaluateAnomalies({
      metric: {
        metricDate: date,
        spend: normalisedSpend,
        impressions: normalisedImpressions,
        clicks: normalisedClicks,
        conversions: normalisedConversions
      },
      spendTarget,
      campaign,
      flight
    });

    metric.spendTarget = spendTarget;
    metric.ctr = normaliseDecimal(evaluation.ctr);
    metric.cvr = normaliseDecimal(evaluation.cvr);
    metric.anomalyScore = normaliseDecimal(evaluation.anomalyScore, 4);

    await metric.save({ transaction });

    await recordAnalyticsEvent(
      {
        name: 'ads.campaign.metrics_recorded',
        entityId: metric.id,
        tenantId: campaign.companyId,
        occurredAt: date,
        metadata: {
          campaignId: campaign.id,
          companyId: campaign.companyId,
          flightId: flight ? flight.id : null,
          metricDate: date.toISOString(),
          impressions: normalisedImpressions,
          clicks: normalisedClicks,
          conversions: normalisedConversions,
          spend: normalisedSpend,
          revenue: normalisedRevenue,
          currency: campaign.currency,
          ctr: metric.ctr,
          cvr: metric.cvr
        }
      },
      { transaction }
    );

    await upsertAnalyticsExport(metric, campaign, flight, transaction);

    const existingSignals = await CampaignFraudSignal.findAll({
      where: {
        campaignId,
        flightId,
        metricDate: date
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    await resolveExistingSignals(existingSignals, evaluation.resolvedTypes, transaction);
    await openFraudSignals({ campaign, flight, metric, signals: evaluation.signals, transaction });

    return metric;
  });
}

export async function listFraudSignals(campaignId, { includeResolved = false } = {}) {
  const where = { campaignId };
  if (!includeResolved) {
    where.resolvedAt = { [Op.is]: null };
  }

  return CampaignFraudSignal.findAll({
    where,
    order: [['detectedAt', 'DESC']]
  });
}

export async function resolveFraudSignal(signalId, { note } = {}) {
  const signal = await CampaignFraudSignal.findByPk(signalId);
  if (!signal) {
    throw campaignError('Fraud signal not found', 404);
  }

  if (signal.resolvedAt) {
    return signal;
  }

  signal.resolvedAt = new Date();
  signal.resolutionNote = note || 'Manually resolved via API.';
  await signal.save();
  return signal;
}

export async function listCampaignCreatives(campaignId) {
  const campaign = await AdCampaign.findByPk(campaignId);
  if (!campaign) {
    throw campaignError('Campaign not found', 404);
  }

  return CampaignCreative.findAll({
    where: { campaignId },
    order: [['createdAt', 'DESC']]
  });
}

export async function createCampaignCreative(campaignId, payload) {
  const { name, headline, assetUrl } = payload || {};
  if (!name || !headline || !assetUrl) {
    throw campaignError('name, headline, and assetUrl are required to create a creative');
  }

  return sequelize.transaction(async (transaction) => {
    const campaign = await AdCampaign.findByPk(campaignId, { transaction });
    if (!campaign) {
      throw campaignError('Campaign not found', 404);
    }

    const creative = await CampaignCreative.create(
      {
        campaignId,
        name,
        headline,
        assetUrl,
        status: payload.status || 'draft',
        format: payload.format || 'image',
        description: payload.description || null,
        callToAction: payload.callToAction || null,
        thumbnailUrl: payload.thumbnailUrl || null,
        reviewStatus: payload.reviewStatus || 'pending',
        metadata: { ...(payload.metadata || {}), network: campaign.network }
      },
      { transaction }
    );

    return creative;
  });
}

export async function updateCampaignCreative(creativeId, updates = {}) {
  return sequelize.transaction(async (transaction) => {
    const creative = await CampaignCreative.findByPk(creativeId, { transaction });
    if (!creative) {
      throw campaignError('Creative not found', 404);
    }

    const fields = [
      'name',
      'headline',
      'description',
      'callToAction',
      'assetUrl',
      'thumbnailUrl',
      'status',
      'format',
      'reviewStatus'
    ];

    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        creative[field] = updates[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
      creative.metadata = { ...creative.metadata, ...(updates.metadata || {}) };
    }

    await creative.save({ transaction });

    return creative;
  });
}

export async function deleteCampaignCreative(creativeId) {
  return sequelize.transaction(async (transaction) => {
    const creative = await CampaignCreative.findByPk(creativeId, { transaction });
    if (!creative) {
      throw campaignError('Creative not found', 404);
    }

    await creative.destroy({ transaction });
  });
}

export async function fetchPendingAnalyticsExports(limit = campaignConfig.exportBatchSize) {
  return CampaignAnalyticsExport.findAll({
    where: { status: 'pending' },
    include: [
      {
        model: CampaignDailyMetric,
        as: 'dailyMetric',
        include: [
          {
            model: AdCampaign,
            attributes: ['id', 'companyId', 'currency', 'status', 'objective', 'pacingStrategy']
          },
          {
            model: CampaignFlight,
            attributes: ['id', 'name', 'status', 'startAt', 'endAt']
          }
        ]
      }
    ],
    order: [['createdAt', 'ASC']],
    limit
  });
}

export async function markAnalyticsExportAttempt(exportRecord, { status, error } = {}) {
  const updates = {
    status,
    lastAttemptAt: new Date(),
    lastError: error ? error.message || String(error) : null
  };

  if (status === 'sent') {
    updates.lastError = null;
    await CampaignDailyMetric.update(
      { exportedAt: new Date() },
      { where: { id: exportRecord.campaignDailyMetricId } }
    );
  }

  await exportRecord.update(updates);
  return exportRecord;
}

export async function getCampaignSummary(id) {
  const campaign = await getCampaignById(id, { includeMetrics: true, includeFraudSignals: true });

  const totals = campaign.dailyMetrics.reduce(
    (acc, metric) => {
      acc.impressions += metric.impressions;
      acc.clicks += metric.clicks;
      acc.conversions += metric.conversions;
      acc.spend += toNumber(metric.spend);
      acc.revenue += toNumber(metric.revenue);
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
  );

  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const cvr = totals.clicks > 0 ? totals.conversions / totals.clicks : 0;
  const roi = totals.spend > 0 ? (totals.revenue - totals.spend) / totals.spend : 0;

  return {
    campaign: campaign.toJSON(),
    totals: {
      ...totals,
      ctr: Number(ctr.toFixed(4)),
      cvr: Number(cvr.toFixed(4)),
      roi: Number(roi.toFixed(4))
    },
    openFraudSignals: campaign.fraudSignals.filter((signal) => !signal.resolvedAt).length
  };
}

export async function requeueFailedAnalyticsExports(olderThanMinutes = 10) {
  const threshold = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  await CampaignAnalyticsExport.update(
    { status: 'pending' },
    {
      where: {
        status: 'failed',
        updatedAt: { [Op.lt]: threshold }
      }
    }
  );
}
