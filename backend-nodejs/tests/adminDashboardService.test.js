import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

const {
  sequelize,
  User,
  Company,
  Service,
  ServiceZone,
  Order,
  Escrow,
  Dispute,
  Booking,
  ComplianceDocument,
  InsuredSellerApplication,
  InventoryItem,
  InventoryAlert,
  AnalyticsPipelineRun,
  SecuritySignalConfig,
  SecurityAutomationTask,
  TelemetryConnector
} = await import('../src/models/index.js');

const { buildAdminDashboard } = await import('../src/services/adminDashboardService.js');
const {
  updateOverviewSettings,
  __resetOverviewSettingsCache
} = await import('../src/services/adminDashboardSettingsService.js');

const TIMEZONE = 'Europe/London';

function polygon() {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-0.2, 51.45],
        [-0.12, 51.45],
        [-0.12, 51.5],
        [-0.2, 51.5],
        [-0.2, 51.45]
      ]
    ]
  };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  __resetOverviewSettingsCache();
});

describe('buildAdminDashboard', () => {
  it('aggregates metrics, trends, and queues for admin reporting', async () => {
    const now = DateTime.now().setZone(TIMEZONE);

    const buyer = await User.create(
      {
        firstName: 'Buyer',
        lastName: 'One',
        email: `buyer-${Date.now()}@example.com`,
        passwordHash: 'hashed',
        type: 'user'
      },
      { validate: false }
    );

    const provider = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: `provider-${Date.now()}@example.com`,
        passwordHash: 'hashed',
        type: 'servicemen',
        twoFactorApp: true
      },
      { validate: false }
    );

    const companyOwner = await User.create(
      {
        firstName: 'Company',
        lastName: 'Admin',
        email: `company-${Date.now()}@example.com`,
        passwordHash: 'hashed',
        type: 'company',
        twoFactorEmail: true
      },
      { validate: false }
    );

    const company = await Company.create({
      userId: companyOwner.id,
      legalStructure: 'Ltd',
      contactName: 'Company Admin',
      contactEmail: companyOwner.email,
      serviceRegions: 'London',
      marketplaceIntent: 'Repairs'
    });

    const service = await Service.create({
      providerId: provider.id,
      companyId: company.id,
      title: 'Critical response',
      description: '24/7 coverage',
      category: 'Facilities',
      price: 480,
      currency: 'GBP'
    });

    const zone = await ServiceZone.create({
      companyId: company.id,
      name: 'Central District',
      boundary: polygon(),
      centroid: { type: 'Point', coordinates: [-0.15, 51.48] },
      boundingBox: polygon(),
      metadata: {},
      demandLevel: 'high'
    });

    const order = await Order.create({
      buyerId: buyer.id,
      serviceId: service.id,
      status: 'in_progress',
      totalAmount: 85000,
      currency: 'GBP',
      scheduledFor: now.plus({ days: 1 }).toJSDate()
    });

    const escrow = await Escrow.create({
      orderId: order.id,
      status: 'funded',
      fundedAt: now.minus({ days: 1 }).toJSDate()
    });

    await Dispute.create({
      escrowId: escrow.id,
      openedBy: buyer.id,
      status: 'under_review',
      reason: 'Damaged equipment',
      createdAt: now.minus({ days: 2 }).toJSDate(),
      updatedAt: now.minus({ hours: 6 }).toJSDate()
    });

    await Dispute.create({
      escrowId: escrow.id,
      openedBy: buyer.id,
      status: 'resolved',
      reason: 'Issue resolved',
      createdAt: now.minus({ days: 5 }).toJSDate(),
      updatedAt: now.minus({ hours: 3 }).toJSDate()
    });

    await Booking.create({
      customerId: buyer.id,
      companyId: company.id,
      zoneId: zone.id,
      status: 'completed',
      type: 'scheduled',
      scheduledStart: now.minus({ days: 2 }).toJSDate(),
      scheduledEnd: now.minus({ days: 2 }).plus({ hours: 2 }).toJSDate(),
      slaExpiresAt: now.minus({ days: 2 }).plus({ hours: 3 }).toJSDate(),
      baseAmount: 180,
      currency: 'GBP',
      totalAmount: 220,
      commissionAmount: 18,
      taxAmount: 22,
      meta: {},
      lastStatusTransitionAt: now.minus({ days: 2 }).plus({ hours: 2 }).toJSDate()
    });

    await Booking.create({
      customerId: buyer.id,
      companyId: company.id,
      zoneId: zone.id,
      status: 'completed',
      type: 'scheduled',
      scheduledStart: now.minus({ days: 4 }).toJSDate(),
      scheduledEnd: now.minus({ days: 4 }).plus({ hours: 2 }).toJSDate(),
      slaExpiresAt: now.minus({ days: 4 }).plus({ hours: 1 }).toJSDate(),
      baseAmount: 140,
      currency: 'GBP',
      totalAmount: 180,
      commissionAmount: 14,
      taxAmount: 26,
      meta: {},
      lastStatusTransitionAt: now.minus({ days: 4 }).plus({ hours: 3 }).toJSDate()
    });

    await Booking.create({
      customerId: buyer.id,
      companyId: company.id,
      zoneId: zone.id,
      status: 'in_progress',
      type: 'scheduled',
      scheduledStart: now.minus({ hours: 1 }).toJSDate(),
      scheduledEnd: now.plus({ hours: 1 }).toJSDate(),
      slaExpiresAt: now.plus({ hours: 3 }).toJSDate(),
      baseAmount: 210,
      currency: 'GBP',
      totalAmount: 260,
      commissionAmount: 21,
      taxAmount: 29,
      meta: {},
      lastStatusTransitionAt: now.minus({ minutes: 30 }).toJSDate()
    });

    await ComplianceDocument.create({
      companyId: company.id,
      type: 'Insurance certificate',
      status: 'under_review',
      storageKey: 's3://docs/insurance.pdf',
      fileName: 'insurance.pdf',
      fileSizeBytes: 128000,
      mimeType: 'application/pdf',
      issuedAt: now.minus({ months: 6 }).toJSDate(),
      expiryAt: now.plus({ days: 2 }).toJSDate(),
      submittedAt: now.minus({ days: 1 }).toJSDate(),
      metadata: {}
    });

    await ComplianceDocument.create({
      companyId: company.id,
      type: 'DBS check',
      status: 'submitted',
      storageKey: 's3://docs/dbs.pdf',
      fileName: 'dbs.pdf',
      fileSizeBytes: 64000,
      mimeType: 'application/pdf',
      issuedAt: now.minus({ months: 3 }).toJSDate(),
      expiryAt: now.plus({ days: 6 }).toJSDate(),
      submittedAt: now.minus({ hours: 12 }).toJSDate(),
      metadata: {}
    });

    await InsuredSellerApplication.create({
      companyId: company.id,
      status: 'in_review',
      complianceScore: 82.5,
      submittedAt: now.minus({ days: 3 }).toJSDate(),
      lastEvaluatedAt: now.minus({ hours: 5 }).toJSDate(),
      badgeEnabled: false
    });

    const item = await InventoryItem.create({
      companyId: company.id,
      name: 'Thermal camera',
      sku: `THERM-${Date.now()}`,
      category: 'Equipment',
      unitType: 'unit',
      quantityOnHand: 5,
      quantityReserved: 1,
      safetyStock: 1,
      rentalRate: 95,
      rentalRateCurrency: 'GBP',
      depositAmount: 250,
      depositCurrency: 'GBP',
      replacementCost: 1200,
      insuranceRequired: true,
      conditionRating: 'good',
      metadata: {}
    });

    await InventoryAlert.create({
      itemId: item.id,
      type: 'damage_reported',
      severity: 'critical',
      status: 'active',
      triggeredAt: now.minus({ hours: 4 }).toJSDate(),
      metadata: { reportedBy: 'Ops' }
    });

    await AnalyticsPipelineRun.create({
      status: 'success',
      startedAt: now.minus({ hours: 4 }).toJSDate(),
      finishedAt: now.minus({ hours: 3, minutes: 30 }).toJSDate(),
      eventsProcessed: 14400,
      eventsFailed: 36,
      batchesDelivered: 320,
      purgedEvents: 24,
      triggeredBy: 'scheduler',
      metadata: {}
    });

    await updateOverviewSettings({
      metrics: {
        escrow: { label: 'Escrow readiness', caption: 'Manual override for {{count}} engagements' }
      },
      insights: {
        manual: ['Ops review scheduled']
      },
      timeline: {
        manual: [{ title: 'Ops briefing', when: 'Next 48 hours', status: 'Operations' }]
      },
      security: {
        manualSignals: [{ label: 'Manual MFA signal', valueLabel: '93%', caption: 'Override', tone: 'info' }]
      },
      automation: {
        manualBacklog: [{ name: 'Manual automation', status: 'Pilot', notes: 'Ops configured', tone: 'success' }]
      },
      queues: {
        manualBoards: [
          {
            title: 'Manual operations board',
            summary: 'Manual summary',
            owner: 'Ops',
            updates: ['Manual update']
          }
        ],
        manualComplianceControls: [
          {
            name: 'Manual compliance',
            detail: 'Manual detail',
            due: 'Soon',
            owner: 'Compliance',
            tone: 'warning'
          }
        ]
      },
      audit: {
        manualTimeline: [{ time: '08:00', event: 'Manual audit', owner: 'Ops', status: 'Queued' }]
      }
    });
    await SecuritySignalConfig.bulkCreate([
      {
        metricKey: 'mfa_adoption',
        displayName: 'MFA adoption',
        description: 'Enterprise portals',
        targetSuccess: 95,
        targetWarning: 85,
        lowerIsBetter: false
      },
      {
        metricKey: 'critical_alerts_open',
        displayName: 'Critical alerts',
        description: 'Open high severity alerts',
        targetSuccess: 0,
        targetWarning: 2,
        lowerIsBetter: true
      },
      {
        metricKey: 'manual_review',
        displayName: 'Manual override',
        description: 'Control room entered',
        valueSource: 'manual',
        manualValue: 12,
        manualValueLabel: '12 open actions',
        targetSuccess: 5,
        targetWarning: 10,
        lowerIsBetter: true
      }
    ]);

    await SecurityAutomationTask.bulkCreate([
      {
        name: 'Escrow ledger reconciliation',
        status: 'in_progress',
        owner: 'Automation Guild',
        priority: 'high',
        dueAt: now.plus({ days: 1 }).toJSDate()
      },
      {
        name: 'Compliance webhook retries',
        status: 'blocked',
        owner: 'Compliance Ops',
        priority: 'urgent',
        dueAt: now.minus({ days: 1 }).toJSDate()
      },
      {
        name: 'Audit pipeline hardening',
        status: 'planned',
        owner: 'Security Engineering',
        priority: 'medium'
      }
    ]);

    await TelemetryConnector.bulkCreate([
      {
        name: 'Splunk Observability',
        connectorType: 'siem',
        region: 'eu-west-2',
        status: 'healthy',
        eventsPerMinuteTarget: 5000,
        eventsPerMinuteActual: 5200
      },
      {
        name: 'Azure Sentinel',
        connectorType: 'siem',
        region: 'ap-southeast-2',
        status: 'warning',
        eventsPerMinuteTarget: 2000,
        eventsPerMinuteActual: 1500
      }
    ]);

    const dashboard = await buildAdminDashboard({ timeframe: '7d', timezone: TIMEZONE });

    expect(dashboard.timeframe).toBe('7d');
    expect(dashboard.metrics.command.tiles).toHaveLength(4);

    const escrowMetric = dashboard.metrics.command.tiles.find((tile) => tile.id === 'escrow');
    expect(escrowMetric.label).toBe('Escrow readiness');
    expect(escrowMetric.value.amount).toBeGreaterThan(0);
    expect(escrowMetric.valueLabel).toContain('£');

    const disputeMetric = dashboard.metrics.command.tiles.find((tile) => tile.id === 'disputes');
    expect(disputeMetric.value.amount).toBeGreaterThan(0);
    expect(typeof disputeMetric.delta).toBe('string');

    expect(dashboard.charts.escrowTrend.buckets.length).toBeGreaterThan(0);
    expect(dashboard.charts.disputeBreakdown.buckets.length).toBeGreaterThan(0);

    expect(dashboard.security.signals.length).toBeGreaterThanOrEqual(4);
    expect(dashboard.security.automationBacklog.length).toBeGreaterThanOrEqual(3);
    expect(dashboard.security.signals.some((signal) => signal.label === 'Manual MFA signal')).toBe(true);
    expect(dashboard.security.automationBacklog.some((item) => item.name === 'Manual automation')).toBe(true);
    expect(dashboard.security.capabilities).toEqual({
      canManageSignals: false,
      canManageAutomation: false,
      canManageConnectors: false
    });

    expect(dashboard.queues.complianceControls.length).toBeGreaterThan(0);
    expect(dashboard.queues.boards.length).toBeGreaterThanOrEqual(3);
    expect(dashboard.queues.boards.some((board) => board.title === 'Manual operations board')).toBe(true);
    expect(dashboard.queues.complianceControls.some((control) => control.name === 'Manual compliance')).toBe(true);

    expect(dashboard.audit.timeline.length).toBeGreaterThan(0);
    expect(dashboard.audit.timeline.some((entry) => entry.event === 'Manual audit')).toBe(true);
    expect(dashboard.metrics.command.summary.escrowTotal).toBeGreaterThan(0);
    expect(dashboard.overview.manualInsights).toEqual(['Ops review scheduled']);
    expect(dashboard.overview.manualUpcoming[0]).toMatchObject({
      title: 'Ops briefing',
      when: 'Next 48 hours',
      status: 'Operations'
    });
  });

  it('embeds provided security capabilities in the payload', async () => {
    const dashboard = await buildAdminDashboard({
      timeframe: '7d',
      timezone: TIMEZONE,
      securityCapabilities: {
        canManageSignals: true,
        canManageAutomation: true,
        canManageConnectors: false
      }
    });

    expect(dashboard.security.capabilities).toEqual({
      canManageSignals: true,
      canManageAutomation: true,
      canManageConnectors: false
    });
  });
});
