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
  AnalyticsPipelineRun
} = await import('../src/models/index.js');

const { buildAdminDashboard } = await import('../src/services/adminDashboardService.js');

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
});

describe('buildAdminDashboard', () => {
  it('aggregates metrics, trends, and queues for admin reporting', async () => {
    const now = DateTime.now().setZone(TIMEZONE);

    const buyer = await User.create({
      firstName: 'Buyer',
      lastName: 'One',
      email: `buyer-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'user'
    });

    const provider = await User.create({
      firstName: 'Jordan',
      lastName: 'Miles',
      email: `provider-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'servicemen',
      twoFactorApp: true
    });

    const companyOwner = await User.create({
      firstName: 'Company',
      lastName: 'Admin',
      email: `company-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'company',
      twoFactorEmail: true
    });

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

    const dashboard = await buildAdminDashboard({ timeframe: '7d', timezone: TIMEZONE });

    expect(dashboard.timeframe).toBe('7d');
    expect(dashboard.metrics.command.tiles).toHaveLength(4);

    const escrowMetric = dashboard.metrics.command.tiles.find((tile) => tile.id === 'escrow');
    expect(escrowMetric.value.amount).toBeGreaterThan(0);
    expect(escrowMetric.valueLabel).toContain('£');

    const disputeMetric = dashboard.metrics.command.tiles.find((tile) => tile.id === 'disputes');
    expect(disputeMetric.value.amount).toBeGreaterThan(0);
    expect(typeof disputeMetric.delta).toBe('string');

    expect(dashboard.charts.escrowTrend.buckets.length).toBeGreaterThan(0);
    expect(dashboard.charts.disputeBreakdown.buckets.length).toBeGreaterThan(0);

    expect(dashboard.security.signals).toHaveLength(3);
    expect(dashboard.security.automationBacklog.length).toBeGreaterThanOrEqual(3);

    expect(dashboard.queues.complianceControls.length).toBeGreaterThan(0);
    expect(dashboard.queues.boards.length).toBeGreaterThanOrEqual(3);

    expect(dashboard.audit.timeline.length).toBeGreaterThan(0);
    expect(dashboard.metrics.command.summary.escrowTotal).toBeGreaterThan(0);
  });
});
