import { DateTime } from 'luxon';
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  createCampaignFlight,
  upsertTargetingRules,
  createCampaignCreative,
  updateCampaignCreative,
  deleteCampaignCreative,
  upsertAudienceSegments,
  upsertPlacements,
  recordCampaignDailyMetrics,
  getCampaignById
} from './campaignService.js';
import { resolveCompanyForActor } from './panelService.js';

async function ensureCompanyContext({ company, companyId, actor }) {
  if (company && company.id) {
    return { company, actor };
  }
  if (!actor) {
    throw new Error('Actor context required');
  }
  return resolveCompanyForActor({ companyId, actor });
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function serialiseFlight(flight) {
  if (!flight) return null;
  return {
    id: flight.id,
    name: flight.name,
    status: flight.status,
    startAt: flight.startAt ? DateTime.fromJSDate(flight.startAt).toISO() : null,
    endAt: flight.endAt ? DateTime.fromJSDate(flight.endAt).toISO() : null,
    budget: flight.budget != null ? Number(flight.budget) : null,
    dailySpendCap: flight.dailySpendCap != null ? Number(flight.dailySpendCap) : null
  };
}

function serialiseCreative(creative) {
  return {
    id: creative.id,
    campaignId: creative.campaignId,
    flightId: creative.flightId,
    flightName: creative.flight?.name || null,
    name: creative.name,
    format: creative.format,
    status: creative.status,
    headline: creative.headline,
    description: creative.description,
    callToAction: creative.callToAction,
    assetUrl: creative.assetUrl,
    thumbnailUrl: creative.thumbnailUrl,
    metadata: creative.metadata || {},
    updatedAt: creative.updatedAt ? DateTime.fromJSDate(creative.updatedAt).toISO() : null
  };
}

function serialiseSegment(segment) {
  return {
    id: segment.id,
    campaignId: segment.campaignId,
    name: segment.name,
    segmentType: segment.segmentType,
    status: segment.status,
    sizeEstimate: segment.sizeEstimate ?? null,
    engagementRate: segment.engagementRate != null ? Number(segment.engagementRate) : null,
    syncedAt: segment.syncedAt ? DateTime.fromJSDate(segment.syncedAt).toISO() : null,
    metadata: segment.metadata || {}
  };
}

function serialisePlacement(placement) {
  return {
    id: placement.id,
    campaignId: placement.campaignId,
    flightId: placement.flightId,
    flightName: placement.flight?.name || null,
    channel: placement.channel,
    format: placement.format,
    status: placement.status,
    bidAmount: placement.bidAmount != null ? Number(placement.bidAmount) : null,
    bidCurrency: placement.bidCurrency,
    cpm: placement.cpm != null ? Number(placement.cpm) : null,
    inventorySource: placement.inventorySource || null,
    metadata: placement.metadata || {},
    updatedAt: placement.updatedAt ? DateTime.fromJSDate(placement.updatedAt).toISO() : null
  };
}

function serialiseInvoice(invoice) {
  return {
    id: invoice.id,
    campaignId: invoice.campaignId,
    campaignName: invoice.AdCampaign?.name || null,
    flightId: invoice.flightId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    amountDue: invoice.amountDue != null ? Number(invoice.amountDue) : null,
    amountPaid: invoice.amountPaid != null ? Number(invoice.amountPaid) : null,
    periodStart: invoice.periodStart ? DateTime.fromJSDate(invoice.periodStart).toISODate() : null,
    periodEnd: invoice.periodEnd ? DateTime.fromJSDate(invoice.periodEnd).toISODate() : null,
    dueDate: invoice.dueDate ? DateTime.fromJSDate(invoice.dueDate).toISODate() : null,
    issuedAt: invoice.issuedAt ? DateTime.fromJSDate(invoice.issuedAt).toISO() : null,
    paidAt: invoice.paidAt ? DateTime.fromJSDate(invoice.paidAt).toISO() : null,
    metadata: invoice.metadata || {}
  };
}

function serialiseFraudSignal(signal) {
  return {
    id: signal.id,
    campaignId: signal.campaignId,
    flightId: signal.flightId,
    title: `${signal.signalType?.replace(/_/g, ' ') ?? 'Alert'} • ${signal.AdCampaign?.name ?? 'Campaign'}`,
    signalType: signal.signalType,
    severity: signal.severity,
    detectedAt: signal.detectedAt ? DateTime.fromJSDate(signal.detectedAt).toISO() : null,
    metadata: signal.metadata || {}
  };
}

export async function buildProviderCampaignWorkspace({ company, companyId, actor } = {}) {
  const context = await ensureCompanyContext({ company, companyId, actor });
  const companyIdentifier = context.company?.id;
  if (!companyIdentifier) {
    throw new Error('Unable to resolve company context for campaigns');
  }

  const campaigns = await listCampaigns({
    companyId: companyIdentifier,
    includeMetrics: true,
    includeFraudSignals: true,
    includeCreativeFlight: true,
    includePlacementFlight: true
  });

  let totalSpend = 0;
  let totalRevenue = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let latestMetricAt = null;

  const campaignPayload = campaigns.map((campaign) => {
    const metrics = campaign.dailyMetrics || [];
    const spend = metrics.reduce((sum, metric) => sum + toNumber(metric.spend), 0);
    const revenue = metrics.reduce((sum, metric) => sum + toNumber(metric.revenue), 0);
    const impressions = metrics.reduce((sum, metric) => sum + toNumber(metric.impressions), 0);
    const clicks = metrics.reduce((sum, metric) => sum + toNumber(metric.clicks), 0);
    const conversions = metrics.reduce((sum, metric) => sum + toNumber(metric.conversions), 0);

    if (metrics.length) {
      const mostRecent = metrics.reduce((latest, metric) => {
        if (!metric.metricDate) return latest;
        const date = DateTime.fromJSDate(metric.metricDate);
        if (!latest || date > latest) {
          return date;
        }
        return latest;
      }, null);
      if (mostRecent) {
        if (!latestMetricAt || mostRecent > latestMetricAt) {
          latestMetricAt = mostRecent;
        }
      }
    }

    totalSpend += spend;
    totalRevenue += revenue;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalConversions += conversions;

    const flights = (campaign.flights || []).map(serialiseFlight).filter(Boolean);
    const creatives = (campaign.creatives || []).map(serialiseCreative);
    const audienceSegments = (campaign.audienceSegments || []).map(serialiseSegment);
    const placements = (campaign.placements || []).map(serialisePlacement);
    const invoices = (campaign.invoices || []).map(serialiseInvoice);
    const fraudSignals = (campaign.fraudSignals || []).map(serialiseFraudSignal);
    const targetingRules = (campaign.targetingRules || []).map((rule) => ({
      id: rule.id,
      ruleType: rule.ruleType,
      operator: rule.operator,
      payload: rule.payload || {}
    }));

    const startAt = campaign.startAt ? DateTime.fromJSDate(campaign.startAt).toISO() : null;
    const endAt = campaign.endAt ? DateTime.fromJSDate(campaign.endAt).toISO() : null;

    const budget = campaign.totalBudget != null ? Number(campaign.totalBudget) : null;
    const dailyCap = campaign.dailySpendCap != null ? Number(campaign.dailySpendCap) : null;
    const pacing = budget && spend ? Math.min(spend / budget, 2) : null;

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      campaignType: campaign.campaignType,
      pacingStrategy: campaign.pacingStrategy,
      bidStrategy: campaign.bidStrategy,
      currency: campaign.currency,
      totalBudget: budget,
      dailySpendCap: dailyCap,
      spend,
      revenue,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0,
      cvr: clicks > 0 ? Number((conversions / clicks).toFixed(4)) : 0,
      roas: spend > 0 ? Number((revenue / spend).toFixed(4)) : 0,
      pacing,
      startAt,
      endAt,
      metadata: campaign.metadata || {},
      flights,
      creatives,
      audienceSegments,
      placements,
      invoices,
      fraudSignals,
      targetingRules
    };
  });

  const overview = {
    spendMonthToDate: totalSpend,
    revenueMonthToDate: totalRevenue,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    ctr: totalImpressions > 0 ? Number((totalClicks / totalImpressions).toFixed(4)) : 0,
    cvr: totalClicks > 0 ? Number((totalConversions / totalClicks).toFixed(4)) : 0,
    roas: totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(4)) : 0,
    lastMetricAt: latestMetricAt ? latestMetricAt.toISO() : null
  };

  const invoices = campaignPayload.flatMap((campaign) => campaign.invoices);
  const fraudSignals = campaignPayload.flatMap((campaign) => campaign.fraudSignals);
  const creatives = campaignPayload.flatMap((campaign) => campaign.creatives.map((creative) => ({
    ...creative,
    campaignId: campaign.id,
    campaignName: campaign.name
  })));
  const audienceSegments = campaignPayload.flatMap((campaign) => campaign.audienceSegments.map((segment) => ({
    ...segment,
    campaignId: campaign.id,
    campaignName: campaign.name
  })));
  const placements = campaignPayload.flatMap((campaign) => campaign.placements.map((placement) => ({
    ...placement,
    campaignId: campaign.id,
    campaignName: campaign.name
  })));

  return {
    company: {
      id: context.company?.id ?? null,
      name: context.company?.contactName || context.company?.legalName || null
    },
    overview,
    campaigns: campaignPayload,
    creatives,
    audienceSegments,
    placements,
    invoices: invoices.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }),
    fraudSignals: fraudSignals.sort((a, b) => {
      if (!a.detectedAt) return 1;
      if (!b.detectedAt) return -1;
      return b.detectedAt.localeCompare(a.detectedAt);
    }),
    generatedAt: DateTime.now().toISO()
  };
}

export async function createProviderCampaign({ actor, companyId, company, payload }) {
  const context = await ensureCompanyContext({ companyId, company, actor });
  return createCampaign({ companyId: context.company.id, ...payload });
}

export async function updateProviderCampaign({ actor, companyId, company, campaignId, payload }) {
  await ensureCompanyContext({ companyId, company, actor });
  return updateCampaign(campaignId, payload);
}

export async function createProviderCampaignFlight({ actor, companyId, company, campaignId, payload }) {
  await ensureCompanyContext({ companyId, company, actor });
  return createCampaignFlight(campaignId, payload);
}

export async function saveProviderTargeting({ actor, companyId, company, campaignId, rules }) {
  await ensureCompanyContext({ companyId, company, actor });
  return upsertTargetingRules(campaignId, rules);
}

export async function createProviderCampaignCreative({ actor, companyId, company, campaignId, payload }) {
  await ensureCompanyContext({ companyId, company, actor });
  return createCampaignCreative(campaignId, payload);
}

export async function updateProviderCampaignCreative({
  actor,
  companyId,
  company,
  campaignId,
  creativeId,
  payload
}) {
  await ensureCompanyContext({ companyId, company, actor });
  return updateCampaignCreative(campaignId, creativeId, payload);
}

export async function deleteProviderCampaignCreative({ actor, companyId, company, campaignId, creativeId }) {
  await ensureCompanyContext({ companyId, company, actor });
  return deleteCampaignCreative(campaignId, creativeId);
}

export async function saveProviderAudienceSegments({ actor, companyId, company, campaignId, segments }) {
  await ensureCompanyContext({ companyId, company, actor });
  return upsertAudienceSegments(campaignId, segments);
}

export async function saveProviderPlacements({ actor, companyId, company, campaignId, placements }) {
  await ensureCompanyContext({ companyId, company, actor });
  return upsertPlacements(campaignId, placements);
}

export async function recordProviderCampaignMetrics({ actor, companyId, company, campaignId, payload }) {
  await ensureCompanyContext({ companyId, company, actor });
  return recordCampaignDailyMetrics(campaignId, payload);
}

export async function getProviderCampaign({ actor, companyId, company, campaignId }) {
  await ensureCompanyContext({ companyId, company, actor });
  const campaign = await getCampaignById(campaignId, {
    includeMetrics: true,
    includeFraudSignals: true,
    includeCreativeFlight: true,
    includePlacementFlight: true
  });
  return campaign;
}
