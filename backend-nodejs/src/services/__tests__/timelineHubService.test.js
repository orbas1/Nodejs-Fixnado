import { describe, it, expect, beforeEach, vi } from 'vitest';

let listLiveFeedMock;
let listMarketplaceFeedMock;
let buildSidebarSuggestionsMock;
let listLiveFeedAuditsMock;
let getChatwootWidgetConfigurationMock;
let campaignPlacementFindAllMock;

let samplePosts;
let sampleItems;
let sampleAuditEvent;

vi.mock('../feedService.js', () => {
  listLiveFeedMock = vi.fn();
  listMarketplaceFeedMock = vi.fn();
  buildSidebarSuggestionsMock = vi.fn();
  return {
    listLiveFeed: (...args) => listLiveFeedMock(...args),
    listMarketplaceFeed: (...args) => listMarketplaceFeedMock(...args),
    buildSidebarSuggestions: (...args) => buildSidebarSuggestionsMock(...args)
  };
});

vi.mock('../liveFeedAuditService.js', () => {
  listLiveFeedAuditsMock = vi.fn();
  return {
    listLiveFeedAudits: (...args) => listLiveFeedAuditsMock(...args),
    updateLiveFeedAudit: vi.fn(),
    createLiveFeedAuditNote: vi.fn()
  };
});

vi.mock('../chatwootService.js', () => {
  getChatwootWidgetConfigurationMock = vi.fn();
  return {
    getChatwootWidgetConfiguration: (...args) => getChatwootWidgetConfigurationMock(...args)
  };
});

vi.mock('../../models/index.js', () => {
  campaignPlacementFindAllMock = vi.fn();
  return {
    CampaignPlacement: { findAll: (...args) => campaignPlacementFindAllMock(...args) },
    CampaignFlight: {},
    AdCampaign: {},
    Company: {}
  };
});

import {
  getTimelineHubSnapshot,
  getTimelineModerationQueue,
  isPostUrgent,
  computeJobAnalytics,
  buildMarketplaceAnalytics,
  isSlaBreached
} from '../timelineHubService.js';

function buildAuditEvent(overrides = {}) {
  return {
    id: 'audit-1',
    status: 'open',
    severity: 'high',
    occurredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextActionAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    assigneeId: null,
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  samplePosts = [
    {
      id: 'job-1',
      title: 'Emergency lighting repair',
      status: 'open',
      bidDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      metadata: { urgencyScore: 90 },
      bids: [
        { id: 'bid-1', createdAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date().toISOString(),
      zone: { name: 'Central' }
    }
  ];

  sampleItems = [
    {
      id: 'item-1',
      title: 'Tower lighting rig',
      availability: 'rent',
      insuredOnly: true,
      compliance: { badgeVisible: true }
    }
  ];

  sampleAuditEvent = buildAuditEvent();

  listLiveFeedMock.mockResolvedValue(samplePosts);
  listMarketplaceFeedMock.mockResolvedValue(sampleItems);

  buildSidebarSuggestionsMock.mockResolvedValue([
    { id: 'suggestion-1', title: 'Crew scheduling automation' }
  ]);

  listLiveFeedAuditsMock.mockResolvedValue({
    data: [sampleAuditEvent],
    summary: {
      total: 1,
      byStatus: { open: 1 },
      bySeverity: { high: 1 },
      byEventType: { 'timeline.alert': 1 },
      topZones: [],
      topActors: []
    },
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 }
  });

  getChatwootWidgetConfigurationMock.mockResolvedValue({
    enabled: true,
    baseUrl: 'https://chatwoot.example',
    websiteToken: 'token',
    inboxIdentifier: 'support'
  });

  campaignPlacementFindAllMock.mockResolvedValue([
    {
      id: 'placement-1',
      metadata: {
        placementKey: 'timeline-hub',
        headline: 'Sponsored maintenance cover',
        url: 'https://example.com',
        persona: 'operations',
        keywords: ['maintenance']
      },
      updatedAt: new Date().toISOString(),
      AdCampaign: {
        name: 'Ops cover',
        objective: 'Awareness',
        metadata: {},
        Company: { id: 'company-1', name: 'Fixnado Ops', logoUrl: null }
      },
      flight: null
    }
  ]);
});

describe('timelineHubService helpers', () => {
  it('detects urgent posts by deadline and metadata', () => {
    expect(
      isPostUrgent({ bidDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(), metadata: {} })
    ).toBe(true);
    expect(isPostUrgent({ metadata: { urgencyScore: 95 } })).toBe(true);
    expect(isPostUrgent({ metadata: {}, bidDeadline: null })).toBe(false);
  });

  it('computes job analytics metrics', () => {
    const analytics = computeJobAnalytics(samplePosts);
    expect(analytics.total).toBe(1);
    expect(analytics.urgent).toBe(1);
    expect(analytics.respondedPercent).toBe(100);
  });

  it('builds marketplace analytics summary', () => {
    const analytics = buildMarketplaceAnalytics(sampleItems);
    expect(analytics.total).toBe(1);
    expect(analytics.rentables).toBe(1);
    expect(analytics.insuredOnly).toBe(1);
  });

  it('identifies SLA breaches when next action expired', () => {
    expect(isSlaBreached(buildAuditEvent())).toBe(true);
    expect(isSlaBreached(buildAuditEvent({ nextActionAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() }))).toBe(false);
  });
});

describe('timelineHubService aggregation', () => {
  it('returns a composed snapshot with analytics and support config', async () => {
    const snapshot = await getTimelineHubSnapshot({ zoneIds: ['zone-1'] });

    expect(snapshot.timeline.analytics.open).toBe(1);
    expect(snapshot.customJobs.analytics.total).toBe(1);
    expect(snapshot.marketplace.analytics.total).toBe(1);
    expect(snapshot.sidebar.support.chatwoot.enabled).toBe(true);
    expect(snapshot.sidebar.ads).toHaveLength(1);
    expect(snapshot.warnings).toHaveLength(0);
  });

  it('produces moderation queue metrics', async () => {
    const queue = await getTimelineModerationQueue({ limit: 10 });
    expect(queue.metrics.open).toBe(1);
    expect(queue.metrics.breachedSla).toBe(1);
    expect(queue.metrics.unassigned).toBe(1);
  });
});
