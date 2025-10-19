import { Op } from 'sequelize';
import {
  CampaignPlacement,
  CampaignFlight,
  AdCampaign,
  Company
} from '../models/index.js';
import { listLiveFeed, listMarketplaceFeed, buildSidebarSuggestions } from './feedService.js';
import { listLiveFeedAudits } from './liveFeedAuditService.js';
import { getChatwootWidgetConfiguration } from './chatwootService.js';

const TIMELINE_PLACEMENT_KEYS = new Set([
  'timeline-hub',
  'timeline_sidebar',
  'timeline_main',
  'timeline'
]);

const DEFAULT_AUDIT_SUMMARY = {
  data: [],
  summary: {
    total: 0,
    byStatus: {},
    bySeverity: {},
    byEventType: {},
    topZones: [],
    topActors: []
  },
  meta: {
    page: 1,
    pageSize: 0,
    total: 0,
    totalPages: 1
  }
};

function toArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((entry) => String(entry));
  }
  return [String(value)];
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function isSameDay(dateInput, reference = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return (
    date.getUTCFullYear() === reference.getUTCFullYear() &&
    date.getUTCMonth() === reference.getUTCMonth() &&
    date.getUTCDate() === reference.getUTCDate()
  );
}

export function isPostUrgent(post) {
  if (!post) {
    return false;
  }
  const now = Date.now();
  const deadline = post.bidDeadline ? new Date(post.bidDeadline) : null;
  if (deadline && !Number.isNaN(deadline.getTime())) {
    const diffHours = (deadline.getTime() - now) / (60 * 60 * 1000);
    if (diffHours >= 0 && diffHours <= 24) {
      return true;
    }
  }

  const metadata = post.metadata && typeof post.metadata === 'object' ? post.metadata : {};
  const urgencyScore = toNumber(metadata.urgencyScore, 0);
  if (urgencyScore >= 80) {
    return true;
  }

  if (typeof metadata.inventoryRisk === 'string' && metadata.inventoryRisk.toLowerCase() === 'high') {
    return true;
  }

  return false;
}

function calculateAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return null;
  }
  const total = numbers.reduce((acc, value) => acc + value, 0);
  return Number((total / numbers.length).toFixed(2));
}

export function computeJobAnalytics(posts = []) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return {
      total: 0,
      open: 0,
      urgent: 0,
      respondedPercent: 0,
      averageBidCount: 0,
      averageResponseMinutes: null,
      expiringSoon: []
    };
  }

  const now = Date.now();
  let open = 0;
  let urgent = 0;
  let responded = 0;
  let totalBidCount = 0;
  const responseSamples = [];
  const expiringSoon = [];

  posts.forEach((post) => {
    if (post.status === 'open' || !post.status) {
      open += 1;
    }
    if (isPostUrgent(post)) {
      urgent += 1;
    }

    const bidCount = Array.isArray(post.bids) ? post.bids.length : Number(post.bidCount) || 0;
    totalBidCount += bidCount;
    if (bidCount > 0) {
      responded += 1;
      const earliestBid = post.bids?.reduce((earliest, bid) => {
        const createdAt = bid?.createdAt ? new Date(bid.createdAt) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
          return earliest;
        }
        if (!earliest) {
          return createdAt;
        }
        return createdAt.getTime() < earliest.getTime() ? createdAt : earliest;
      }, null);
      const postedAt = post.createdAt ? new Date(post.createdAt) : null;
      if (earliestBid && postedAt && !Number.isNaN(postedAt.getTime())) {
        const diffMinutes = Math.max((earliestBid.getTime() - postedAt.getTime()) / 60000, 0);
        responseSamples.push(diffMinutes);
      }
    }

    if (post.bidDeadline) {
      const deadline = new Date(post.bidDeadline);
      if (!Number.isNaN(deadline.getTime())) {
        const diffHours = (deadline.getTime() - now) / (60 * 60 * 1000);
        if (diffHours >= 0 && diffHours <= 48) {
          expiringSoon.push({
            id: post.id,
            title: post.title,
            deadline: deadline.toISOString(),
            zone: post.zone?.name || null,
            allowOutOfZone: Boolean(post.allowOutOfZone)
          });
        }
      }
    }
  });

  expiringSoon.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const respondedPercent = posts.length ? Math.round((responded / posts.length) * 100) : 0;
  const averageBidCount = posts.length ? Number((totalBidCount / posts.length).toFixed(2)) : 0;

  return {
    total: posts.length,
    open,
    urgent,
    respondedPercent,
    averageBidCount,
    averageResponseMinutes: calculateAverage(responseSamples),
    expiringSoon: expiringSoon.slice(0, 5)
  };
}

export function buildMarketplaceAnalytics(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      total: 0,
      rentables: 0,
      purchasables: 0,
      insuredOnly: 0,
      complianceWarnings: 0
    };
  }

  let rentables = 0;
  let purchasables = 0;
  let insuredOnly = 0;
  let complianceWarnings = 0;

  items.forEach((item) => {
    const availability = typeof item.availability === 'string' ? item.availability.toLowerCase() : '';
    if (availability === 'rent' || availability === 'both') {
      rentables += 1;
    }
    if (availability === 'buy' || availability === 'both') {
      purchasables += 1;
    }
    if (item.insuredOnly) {
      insuredOnly += 1;
    }
    if (item.compliance && item.compliance.badgeVisible === false) {
      complianceWarnings += 1;
    }
  });

  return {
    total: items.length,
    rentables,
    purchasables,
    insuredOnly,
    complianceWarnings
  };
}

export function isSlaBreached(event) {
  if (!event || !event.nextActionAt) {
    return false;
  }
  if (['resolved', 'dismissed'].includes(event.status)) {
    return false;
  }
  const deadline = new Date(event.nextActionAt);
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }
  return deadline.getTime() < Date.now();
}

function buildTimelineAnalytics(events = [], summary = {}) {
  const open = summary?.byStatus?.open ?? 0;
  const investigating = summary?.byStatus?.investigating ?? 0;
  const resolvedToday = events.filter((event) => event.status === 'resolved' && isSameDay(event.updatedAt || event.occurredAt)).length;
  const breachedSla = events.filter((event) => isSlaBreached(event)).length;
  const unassigned = events.filter(
    (event) => !event.assigneeId && !['resolved', 'dismissed'].includes(event.status)
  ).length;
  const highSeverityOpen = (summary?.bySeverity?.high ?? 0) + (summary?.bySeverity?.critical ?? 0);

  return {
    open,
    investigating,
    resolvedToday,
    breachedSla,
    unassigned,
    highSeverityOpen,
    eventTypeBreakdown: summary?.byEventType ?? {},
    topZones: summary?.topZones ?? [],
    topActors: summary?.topActors ?? []
  };
}

function normalisePlacementKey(metadata = {}) {
  if (typeof metadata.placementKey === 'string') {
    return metadata.placementKey.trim().toLowerCase();
  }
  if (typeof metadata.key === 'string') {
    return metadata.key.trim().toLowerCase();
  }
  return '';
}

function extractPlacementZones(metadata = {}) {
  if (Array.isArray(metadata.zones)) {
    return metadata.zones.map((zone) => String(zone));
  }
  if (Array.isArray(metadata.zoneIds)) {
    return metadata.zoneIds.map((zone) => String(zone));
  }
  return [];
}

async function fetchTimelinePlacements({ limit = 5, zoneIds = [] } = {}) {
  const placements = await CampaignPlacement.findAll({
    where: {
      status: { [Op.in]: ['active', 'planned'] }
    },
    include: [
      {
        model: AdCampaign,
        required: true,
        where: { status: { [Op.in]: ['active', 'scheduled'] }, network: 'fixnado' },
        include: [{ model: Company }]
      },
      { model: CampaignFlight, as: 'flight', required: false }
    ],
    order: [['updatedAt', 'DESC']],
    limit: Math.max(limit * 2, limit)
  });

  const filtered = [];
  const uniqueIds = new Set();

  placements.forEach((placement) => {
    const metadata = placement.metadata || {};
    const placementKey = normalisePlacementKey(metadata);
    if (!TIMELINE_PLACEMENT_KEYS.has(placementKey)) {
      return;
    }

    const targetZones = extractPlacementZones(metadata);
    if (zoneIds.length && targetZones.length) {
      const zoneMatch = zoneIds.some((zoneId) => targetZones.includes(zoneId));
      if (!zoneMatch) {
        return;
      }
    }

    if (uniqueIds.has(placement.id)) {
      return;
    }
    uniqueIds.add(placement.id);

    const campaign = placement.AdCampaign || placement.campaign || null;
    const company = campaign?.Company || null;

    filtered.push({
      id: placement.id,
      key: placementKey,
      title: metadata.headline || campaign?.name || 'Sponsored',
      description: metadata.description || campaign?.objective || null,
      ctaLabel: metadata.ctaLabel || campaign?.metadata?.ctaLabel || campaign?.metadata?.cta || null,
      url: metadata.url || campaign?.metadata?.landingPage || null,
      assetUrl:
        metadata.assetUrl || metadata.imageUrl || campaign?.metadata?.assetUrl || campaign?.metadata?.creativeUrl || null,
      sponsor: company
        ? {
            id: company.id,
            name: company.name || company.legalName || null,
            logoUrl: company.logoUrl || company.logo_url || null
          }
        : null,
      pricing: placement.bidAmount
        ? { amount: Number.parseFloat(placement.bidAmount), currency: placement.bidCurrency }
        : null,
      flight: placement.flight
        ? {
            id: placement.flight.id,
            startAt: placement.flight.startAt,
            endAt: placement.flight.endAt
          }
        : null,
      targeting: {
        zones: targetZones,
        persona: metadata.persona || null,
        keywords: Array.isArray(metadata.keywords) ? metadata.keywords : []
      },
      updatedAt: placement.updatedAt
    });
  });

  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return filtered.slice(0, limit);
}

function unwrapOutcome(outcome, fallback, warnings, warningMessage) {
  if (outcome.status === 'fulfilled') {
    return outcome.value;
  }
  if (warningMessage) {
    warnings.push(warningMessage);
  } else if (outcome.reason?.message) {
    warnings.push(outcome.reason.message);
  }
  return fallback;
}

export async function getTimelineHubSnapshot({
  userId = null,
  persona = null,
  zoneIds = [],
  customJobLimit = 20,
  timelineLimit = 20,
  marketplaceLimit = 12,
  includeOutOfZone = true,
  outOfZoneOnly = false
} = {}) {
  const resolvedZoneIds = Array.from(new Set(toArray(zoneIds)));
  const warnings = [];

  const results = await Promise.allSettled([
    listLiveFeedAudits({
      pageSize: timelineLimit,
      statuses: ['open', 'investigating', 'resolved'],
      zoneIds: resolvedZoneIds
    }),
    listLiveFeed({
      zoneIds: resolvedZoneIds,
      includeOutOfZone,
      outOfZoneOnly,
      limit: customJobLimit
    }),
    listMarketplaceFeed({ limit: marketplaceLimit }),
    buildSidebarSuggestions({ userId, limit: 5 }),
    fetchTimelinePlacements({ limit: 5, zoneIds: resolvedZoneIds }),
    getChatwootWidgetConfiguration()
  ]);

  const [auditsOutcome, customJobsOutcome, marketplaceOutcome, suggestionsOutcome, placementsOutcome, chatwootOutcome] = results;

  const auditData = unwrapOutcome(auditsOutcome, DEFAULT_AUDIT_SUMMARY, warnings, 'Timeline analytics unavailable.');
  const customJobs = unwrapOutcome(customJobsOutcome, [], warnings, 'Timeline custom jobs unavailable.');
  const marketplaceItems = unwrapOutcome(marketplaceOutcome, [], warnings, 'Marketplace feed unavailable.');
  const suggestions = unwrapOutcome(suggestionsOutcome, [], warnings, 'Sidebar suggestions unavailable.');
  const placements = unwrapOutcome(placementsOutcome, [], warnings, 'Ad placements unavailable.');
  const chatwoot = unwrapOutcome(chatwootOutcome, { enabled: false }, warnings, 'Chatwoot configuration unavailable.');

  const jobAnalytics = computeJobAnalytics(customJobs);
  const marketplaceAnalytics = buildMarketplaceAnalytics(marketplaceItems);
  const timelineAnalytics = buildTimelineAnalytics(auditData.data, auditData.summary);

  return {
    generatedAt: new Date().toISOString(),
    persona: persona || null,
    filters: {
      zoneIds: resolvedZoneIds,
      includeOutOfZone: Boolean(includeOutOfZone),
      outOfZoneOnly: Boolean(outOfZoneOnly)
    },
    timeline: {
      events: auditData.data,
      summary: auditData.summary,
      analytics: timelineAnalytics
    },
    customJobs: {
      items: customJobs,
      analytics: jobAnalytics
    },
    marketplace: {
      items: marketplaceItems,
      analytics: marketplaceAnalytics
    },
    sidebar: {
      suggestions,
      ads: placements,
      support: {
        chatwoot
      }
    },
    moderation: {
      open: auditData.summary?.byStatus?.open ?? 0,
      investigating: auditData.summary?.byStatus?.investigating ?? 0,
      highSeverityOpen: timelineAnalytics.highSeverityOpen,
      breachedSla: timelineAnalytics.breachedSla
    },
    warnings
  };
}

export async function getTimelineModerationQueue({
  statuses = ['open', 'investigating'],
  severities = ['medium', 'high', 'critical'],
  zoneIds = [],
  limit = 25
} = {}) {
  const resolvedZoneIds = Array.from(new Set(toArray(zoneIds)));
  const audits = await listLiveFeedAudits({
    pageSize: limit,
    statuses,
    severities,
    zoneIds: resolvedZoneIds,
    includeNotes: true,
    sortBy: 'severity',
    sortDirection: 'DESC'
  });

  const metrics = {
    total: audits.summary?.total ?? audits.data.length,
    open: audits.summary?.byStatus?.open ?? 0,
    investigating: audits.summary?.byStatus?.investigating ?? 0,
    breachedSla: audits.data.filter((event) => isSlaBreached(event)).length,
    unassigned: audits.data.filter(
      (event) => !event.assigneeId && !['resolved', 'dismissed'].includes(event.status)
    ).length,
    highSeverity: (audits.summary?.bySeverity?.high ?? 0) + (audits.summary?.bySeverity?.critical ?? 0)
  };

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      statuses,
      severities,
      zoneIds: resolvedZoneIds
    },
    metrics,
    items: audits.data,
    summary: audits.summary
  };
}

export { buildTimelineAnalytics, normalisePlacementKey };
