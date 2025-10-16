import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

const {
  sequelize,
  User,
  InventoryAlert,
  InventoryItem,
  Company,
  AnalyticsPipelineRun,
  SecuritySignalConfig,
  SecurityAutomationTask,
  TelemetryConnector
} = await import('../src/models/index.js');

const {
  getSecurityPosture,
  upsertSecuritySignal,
  deactivateSecuritySignal,
  upsertAutomationTask,
  removeAutomationTask,
  upsertTelemetryConnector,
  removeTelemetryConnector,
  reorderSecuritySignals
} = await import('../src/services/securityPostureService.js');

const TIMEZONE = 'Europe/London';

describe('securityPostureService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  it('builds a posture snapshot with computed metrics, automation, and connectors', async () => {
    const now = DateTime.now().setZone(TIMEZONE);

    await User.bulkCreate([
      { firstName: 'Ops', lastName: 'One', email: 'ops1@example.com', passwordHash: 'hash', type: 'company', twoFactorApp: true },
      { firstName: 'Ops', lastName: 'Two', email: 'ops2@example.com', passwordHash: 'hash', type: 'company', twoFactorEmail: true },
      {
        firstName: 'Provider',
        lastName: 'Mfa',
        email: 'provider@example.com',
        passwordHash: 'hash',
        type: 'servicemen',
        twoFactorApp: true
      }
    ]);

    const companyUser = await User.findOne({ where: { type: 'company' } });
    const company = await Company.create({
      userId: companyUser.id,
      legalStructure: 'llc',
      contactName: 'Ops One',
      contactEmail: 'ops1@example.com',
      serviceRegions: 'UK',
      marketplaceIntent: 'Telemetry'
    });

    const inventoryItem = await InventoryItem.create({
      companyId: company.id,
      name: 'Audit appliance',
      sku: 'AUDIT-001',
      category: 'sensors',
      quantityOnHand: 10,
      quantityReserved: 1,
      safetyStock: 2,
      metadata: {}
    });

    await InventoryAlert.create({
      severity: 'critical',
      status: 'active',
      type: 'manual',
      itemId: inventoryItem.id,
      triggeredAt: now.minus({ hours: 2 }).toJSDate(),
      metadata: {}
    });

    await AnalyticsPipelineRun.create({
      status: 'success',
      startedAt: now.minus({ hours: 3 }).toJSDate(),
      finishedAt: now.minus({ hours: 2 }).toJSDate(),
      eventsProcessed: 12000,
      eventsFailed: 120,
      batchesDelivered: 12,
      purgedEvents: 0,
      triggeredBy: 'scheduler',
      metadata: {}
    });

    await SecuritySignalConfig.bulkCreate([
      {
        metricKey: 'mfa_adoption',
        displayName: 'MFA adoption',
        description: 'Enterprise + provider portals',
        targetSuccess: 95,
        targetWarning: 85,
        lowerIsBetter: false,
        sortOrder: 2
      },
      {
        metricKey: 'critical_alerts_open',
        displayName: 'Critical alerts',
        description: 'Security operations center',
        targetSuccess: 0,
        targetWarning: 2,
        lowerIsBetter: true,
        sortOrder: 1
      },
      {
        metricKey: 'manual_review',
        displayName: 'Manual override',
        description: 'Config-driven metric',
        valueSource: 'manual',
        manualValue: 12,
        manualValueLabel: '12 open actions',
        targetSuccess: 5,
        targetWarning: 10,
        lowerIsBetter: true,
        sortOrder: 4
      }
    ]);

    await SecurityAutomationTask.bulkCreate([
      {
        name: 'Escrow ledger reconciliation',
        status: 'in_progress',
        owner: 'Automation Guild',
        priority: 'high',
        dueAt: now.plus({ days: 1 }).toJSDate(),
        notes: 'Extends double-entry validation',
        runbookUrl: 'https://confluence.example.com/runbooks/escrow'
      },
      {
        name: 'Compliance webhook retries',
        status: 'blocked',
        owner: 'Compliance Ops',
        priority: 'urgent',
        dueAt: now.minus({ days: 1 }).toJSDate(),
        notes: 'Awaiting credentials'
      }
    ]);

    await TelemetryConnector.bulkCreate([
      {
        name: 'Splunk Observability',
        connectorType: 'siem',
        region: 'eu-west-2',
        status: 'healthy',
        description: 'Primary SIEM connector',
        dashboardUrl: 'https://splunk.example.com',
        ingestionEndpoint: 'kinesis://splunk-audit',
        eventsPerMinuteTarget: 5000,
        eventsPerMinuteActual: 5200,
        lastHealthCheckAt: now.minus({ minutes: 5 }).toJSDate(),
        logoUrl: 'https://cdn.example.com/splunk.svg'
      },
      {
        name: 'Azure Sentinel',
        connectorType: 'siem',
        region: 'ap-southeast-2',
        status: 'warning',
        description: 'Regional SOC handoff',
        dashboardUrl: 'https://azure.example.com',
        ingestionEndpoint: 'eventhub://sentinel-apac',
        eventsPerMinuteTarget: 2000,
        eventsPerMinuteActual: 1500
      }
    ]);

    const posture = await getSecurityPosture({ timezone: TIMEZONE });

    expect(posture.signals).toHaveLength(3);
    const mfaSignal = posture.signals.find((signal) => signal.metricKey === 'mfa_adoption');
    expect(mfaSignal.valueLabel).toMatch(/%$/);
    expect(mfaSignal.tone).toBe('success');

    const manualSignal = posture.signals.find((signal) => signal.metricKey === 'manual_review');
    expect(manualSignal.valueLabel).toBe('12 open actions');
    expect(manualSignal.tone).toBe('danger');
    expect(manualSignal.sortOrder).toBe(4);

    expect(posture.automationTasks).toHaveLength(2);
    const blockedTask = posture.automationTasks.find((task) => task.status === 'blocked');
    expect(blockedTask).toBeDefined();

    expect(posture.connectors).toHaveLength(2);
    expect(posture.summary.connectorsHealthy).toBe(1);
    expect(posture.summary.connectorsAttention).toBe(1);
    expect(posture.summary.automationOpen).toBe(2);
  });

  it('supports CRUD operations for signals, automation tasks, and connectors', async () => {
    const signal = await upsertSecuritySignal({
      payload: {
        displayName: 'API Errors',
        metricKey: 'api_errors',
        ownerRole: 'Platform',
        targetSuccess: 2,
        targetWarning: 5,
        lowerIsBetter: true,
        sortOrder: 3
      }
    });
    expect(signal.metricKey).toBe('api_errors');
    expect(signal.sortOrder).toBe(3);

    const updatedSignal = await upsertSecuritySignal({
      id: signal.id,
      payload: {
        displayName: 'API Error Rate',
        metricKey: 'api_errors',
        ownerRole: 'SRE',
        valueSource: 'manual',
        manualValue: 1.2,
        manualValueLabel: '1.2%'
      }
    });
    expect(updatedSignal.manualValueLabel).toBe('1.2%');
    expect(updatedSignal.sortOrder).toBe(3);

    const reorderedSignal = await upsertSecuritySignal({
      id: signal.id,
      payload: {
        displayName: 'API Error Rate',
        metricKey: 'api_errors',
        ownerRole: 'SRE',
        valueSource: 'manual',
        manualValue: 1.2,
        manualValueLabel: '1.2%',
        sortOrder: '7'
      }
    });
    expect(reorderedSignal.sortOrder).toBe(7);

    const deactivated = await deactivateSecuritySignal({ id: signal.id });
    expect(deactivated).toBeDefined();

    const automation = await upsertAutomationTask({
      payload: {
        name: 'Rotate credentials',
        status: 'planned',
        priority: 'medium'
      }
    });
    expect(automation.name).toBe('Rotate credentials');

    const updatedAutomation = await upsertAutomationTask({
      id: automation.id,
      payload: { name: 'Rotate secrets', status: 'in_progress', priority: 'high' }
    });
    expect(updatedAutomation.status).toBe('in_progress');

    const removedTask = await removeAutomationTask({ id: automation.id, actorId: 'actor-1' });
    expect(removedTask.isActive).toBe(false);

    const postureAfterTaskRemoval = await getSecurityPosture({ timezone: TIMEZONE });
    expect(postureAfterTaskRemoval.automationTasks.find((task) => task.id === automation.id)).toBeUndefined();

    const connector = await upsertTelemetryConnector({
      payload: {
        name: 'Data Lake Mirror',
        connectorType: 'data-lake',
        status: 'healthy'
      }
    });
    expect(connector.name).toBe('Data Lake Mirror');

    const updatedConnector = await upsertTelemetryConnector({
      id: connector.id,
      payload: { name: 'Data Lake Mirror', status: 'warning', eventsPerMinuteTarget: 800 }
    });
    expect(updatedConnector.status).toBe('warning');

    const removedConnector = await removeTelemetryConnector({ id: connector.id, actorId: 'actor-1' });
    expect(removedConnector.isActive).toBe(false);

    const postureAfterConnectorRemoval = await getSecurityPosture({ timezone: TIMEZONE });
    expect(postureAfterConnectorRemoval.connectors.find((item) => item.id === connector.id)).toBeUndefined();
  });

  it('reorders signals based on an ordered id list while preserving unspecified ordering', async () => {
    const [first, second, third] = await Promise.all([
      upsertSecuritySignal({ payload: { displayName: 'Signal A', metricKey: 'signal_a', sortOrder: 0 } }),
      upsertSecuritySignal({ payload: { displayName: 'Signal B', metricKey: 'signal_b', sortOrder: 1 } }),
      upsertSecuritySignal({ payload: { displayName: 'Signal C', metricKey: 'signal_c', sortOrder: 2 } })
    ]);

    await reorderSecuritySignals({ orderedIds: [third.id, first.id], actorId: 'actor' });

    const refreshed = await getSecurityPosture({ timezone: TIMEZONE });
    const order = refreshed.signals.map((signal) => signal.metricKey);
    expect(order.slice(0, 2)).toEqual(['signal_c', 'signal_a']);
    expect(order[2]).toBe('signal_b');
  });

  it('includes inactive posture entities when requested explicitly', async () => {
    const [signal] = await Promise.all([
      SecuritySignalConfig.create({
        metricKey: 'synthetic_latency',
        displayName: 'Synthetic latency',
        isActive: false
      }),
      SecurityAutomationTask.create({
        name: 'Archive old exports',
        status: 'completed',
        isActive: false
      }),
      TelemetryConnector.create({
        name: 'Legacy S3 bridge',
        connectorType: 'object-store',
        status: 'offline',
        isActive: false
      })
    ]);

    const standardPosture = await getSecurityPosture({ timezone: TIMEZONE });
    expect(standardPosture.signals.find((item) => item.metricKey === signal.metricKey)).toBeUndefined();
    expect(standardPosture.automationTasks).toHaveLength(0);
    expect(standardPosture.connectors).toHaveLength(0);

    const postureWithInactive = await getSecurityPosture({ timezone: TIMEZONE, includeInactive: true });
    expect(postureWithInactive.signals.find((item) => item.metricKey === signal.metricKey)).toBeDefined();
    expect(postureWithInactive.automationTasks.find((item) => item.name === 'Archive old exports')).toBeDefined();
    expect(postureWithInactive.connectors.find((item) => item.name === 'Legacy S3 bridge')).toBeDefined();
  });
});
