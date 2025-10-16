import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import {
  SecuritySignalConfig,
  SecurityAutomationTask,
  TelemetryConnector,
  InventoryAlert,
  AnalyticsPipelineRun,
  User,
  sequelize
} from '../models/index.js';

const numberFormatter = new Intl.NumberFormat('en-GB');

function toNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function evaluateTone(config, rawValue) {
  const numeric = toNumber(rawValue);
  if (numeric == null) {
    return { tone: 'info', label: 'No signal reported' };
  }

  const targetSuccess = toNumber(config.targetSuccess);
  const targetWarning = toNumber(config.targetWarning);

  if (config.lowerIsBetter) {
    if (targetSuccess != null && numeric <= targetSuccess) {
      return { tone: 'success', label: 'On target' };
    }
    if (targetWarning != null && numeric <= targetWarning) {
      return { tone: 'warning', label: 'Monitor closely' };
    }
    return { tone: 'danger', label: 'Escalate' };
  }

  if (targetSuccess != null && numeric >= targetSuccess) {
    return { tone: 'success', label: 'On target' };
  }
  if (targetWarning != null && numeric >= targetWarning) {
    return { tone: 'warning', label: 'Monitor closely' };
  }
  return { tone: 'danger', label: 'Escalate' };
}

async function computeBaseMeasurements(timezone) {
  const since = DateTime.now().setZone(timezone).minus({ hours: 24 }).toJSDate();

  const [activeUsers, usersWithMfa, criticalAlerts, pipelineRuns] = await Promise.all([
    User.count({ where: { type: { [Op.in]: ['company', 'servicemen'] } } }),
    User.count({
      where: {
        type: { [Op.in]: ['company', 'servicemen'] },
        [Op.or]: [{ twoFactorApp: true }, { twoFactorEmail: true }]
      }
    }),
    InventoryAlert.count({
      where: {
        severity: 'critical',
        status: { [Op.ne]: 'resolved' },
        triggeredAt: { [Op.gte]: since }
      }
    }),
    AnalyticsPipelineRun.findAll({
      where: {
        startedAt: {
          [Op.gte]: since
        }
      },
      attributes: ['eventsProcessed', 'eventsFailed']
    })
  ]);

  const totals = pipelineRuns.reduce(
    (acc, run) => {
      acc.processed += toNumber(run.eventsProcessed) ?? 0;
      acc.failed += toNumber(run.eventsFailed) ?? 0;
      return acc;
    },
    { processed: 0, failed: 0 }
  );

  const processed = totals.processed;
  const failed = totals.failed;
  const totalEvents = processed + failed;
  const ingestionRate = totalEvents > 0 ? (processed / totalEvents) * 100 : 100;
  const mfaRate = activeUsers > 0 ? (usersWithMfa / activeUsers) * 100 : 0;

  return {
    mfa_adoption: {
      value: mfaRate,
      label: `${mfaRate.toFixed(1)}%`,
      metadata: { activeUsers, usersWithMfa }
    },
    critical_alerts_open: {
      value: criticalAlerts,
      label: numberFormatter.format(criticalAlerts),
      metadata: { windowHours: 24 }
    },
    audit_ingestion_rate: {
      value: ingestionRate,
      label: `${ingestionRate.toFixed(1)}%`,
      metadata: { processed, failed }
    }
  };
}

function toInteger(value, fallback = null) {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

function serialiseSignal(config, measurement) {
  const isManual = config.valueSource === 'manual';
  const resolvedValue = isManual ? toNumber(config.manualValue) : measurement?.value;
  const resolvedLabel = isManual
    ? config.manualValueLabel ?? (resolvedValue != null ? String(resolvedValue) : '—')
    : measurement?.label ?? '—';

  const { tone, label: statusLabel } = evaluateTone(config, resolvedValue);

  return {
    id: config.id,
    metricKey: config.metricKey,
    label: config.displayName,
    caption: config.description ?? '',
    unit: config.unit ?? null,
    targetSuccess: config.targetSuccess != null ? Number(config.targetSuccess) : null,
    targetWarning: config.targetWarning != null ? Number(config.targetWarning) : null,
    lowerIsBetter: Boolean(config.lowerIsBetter),
    runbookUrl: config.runbookUrl ?? null,
    ownerRole: config.ownerRole ?? null,
    icon: config.icon ?? null,
    valueSource: config.valueSource,
    manualValue: config.valueSource === 'manual' ? (resolvedValue ?? null) : null,
    manualValueLabel: config.valueSource === 'manual' ? resolvedLabel : null,
    valueLabel: resolvedLabel,
    currentValue: resolvedValue,
    tone,
    statusLabel,
    metadata: measurement?.metadata ?? null,
    isActive: config.isActive !== false,
    sortOrder: toInteger(config.sortOrder, 0),
    updatedAt: config.updatedAt?.toISOString?.() ?? null
  };
}

function serialiseTask(task) {
  return {
    id: task.id,
    name: task.name,
    status: task.status,
    owner: task.owner ?? null,
    priority: task.priority,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    runbookUrl: task.runbookUrl ?? null,
    signalKey: task.signalKey ?? null,
    notes: task.notes ?? null,
    isActive: task.isActive !== false,
    updatedAt: task.updatedAt?.toISOString?.() ?? null
  };
}

function serialiseConnector(connector) {
  return {
    id: connector.id,
    name: connector.name,
    connectorType: connector.connectorType,
    region: connector.region ?? null,
    status: connector.status,
    description: connector.description ?? null,
    dashboardUrl: connector.dashboardUrl ?? null,
    ingestionEndpoint: connector.ingestionEndpoint ?? null,
    eventsPerMinuteTarget:
      connector.eventsPerMinuteTarget != null ? Number(connector.eventsPerMinuteTarget) : null,
    eventsPerMinuteActual:
      connector.eventsPerMinuteActual != null ? Number(connector.eventsPerMinuteActual) : null,
    lastHealthCheckAt: connector.lastHealthCheckAt?.toISOString?.() ?? null,
    logoUrl: connector.logoUrl ?? null,
    isActive: connector.isActive !== false,
    updatedAt: connector.updatedAt?.toISOString?.() ?? null
  };
}

export async function getSecurityPosture({ timezone = 'UTC', includeInactive = false } = {}) {
  const connectorWhere = includeInactive ? {} : { isActive: true };
  const taskWhere = includeInactive ? {} : { isActive: true };

  const [configs, connectors, tasks, measurements] = await Promise.all([
    SecuritySignalConfig.findAll({
      where: includeInactive ? {} : { isActive: true },
      order: [
        ['sortOrder', 'ASC'],
        ['displayName', 'ASC']
      ]
    }),
    TelemetryConnector.findAll({
      where: connectorWhere,
      order: [
        ['status', 'ASC'],
        ['name', 'ASC']
      ]
    }),
    SecurityAutomationTask.findAll({
      where: taskWhere,
      order: [
        ['status', 'ASC'],
        ['priority', 'DESC'],
        ['dueAt', 'ASC']
      ]
    }),
    computeBaseMeasurements(timezone)
  ]);

  const signals = configs.map((config) => serialiseSignal(config, measurements[config.metricKey]));
  const automationTasks = tasks.map(serialiseTask);
  const telemetryConnectors = connectors.map(serialiseConnector);

  const activeSignals = includeInactive ? signals.filter((signal) => signal.isActive) : signals;
  const activeTasks = automationTasks.filter((task) => task.isActive !== false);
  const activeConnectors = telemetryConnectors.filter((connector) => connector.isActive !== false);

  const summary = {
    connectorsHealthy: activeConnectors.filter((connector) => connector.status === 'healthy').length,
    connectorsAttention: activeConnectors.filter((connector) => connector.status !== 'healthy').length,
    automationOpen: activeTasks.filter((task) => task.status !== 'completed').length,
    signalsWarning: activeSignals.filter((signal) => signal.tone === 'warning').length,
    signalsDanger: activeSignals.filter((signal) => signal.tone === 'danger').length
  };

  return {
    timezone,
    updatedAt: DateTime.now().setZone(timezone).toISO(),
    signals,
    automationTasks,
    connectors: telemetryConnectors,
    summary
  };
}

function sanitiseString(value, max = 160) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, max);
}

function coerceEnum(value, allowed, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalised = value.trim().toLowerCase();
  return allowed.includes(normalised) ? normalised : fallback;
}

export async function upsertSecuritySignal({ id, payload, actorId }) {
  const displayName = sanitiseString(payload?.displayName ?? payload?.label, 128);
  const metricKey = sanitiseString(payload?.metricKey ?? payload?.key, 64);
  const description = typeof payload?.description === 'string' ? payload.description.trim() : null;
  const valueSource = coerceEnum(payload?.valueSource, ['computed', 'manual'], 'computed');
  const ownerRole = sanitiseString(payload?.ownerRole ?? payload?.owner, 96);
  const runbookUrl = sanitiseString(payload?.runbookUrl ?? payload?.runbook, 512);
  const icon = sanitiseString(payload?.icon, 64);
  const unit = sanitiseString(payload?.unit, 24);
  const manualValue = toNumber(payload?.manualValue);
  const manualValueLabel = sanitiseString(payload?.manualValueLabel, 128);
  const sortOrder = toInteger(payload?.sortOrder);

  if (!displayName) {
    const error = new Error('Display name is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!metricKey) {
    const error = new Error('Metric key is required');
    error.name = 'ValidationError';
    throw error;
  }

  const targetSuccess = toNumber(payload?.targetSuccess);
  const targetWarning = toNumber(payload?.targetWarning);
  const lowerIsBetter = Boolean(payload?.lowerIsBetter);

  const attributes = {
    displayName,
    metricKey,
    description,
    unit,
    valueSource,
    targetSuccess,
    targetWarning,
    lowerIsBetter,
    ownerRole,
    runbookUrl,
    icon,
    updatedBy: actorId ?? null
  };

  if (sortOrder != null) {
    attributes.sortOrder = sortOrder;
  }

  if (typeof payload?.isActive === 'boolean') {
    attributes.isActive = payload.isActive;
  }

  if (valueSource === 'manual') {
    attributes.manualValue = manualValue;
    attributes.manualValueLabel = manualValueLabel ?? (manualValue != null ? String(manualValue) : null);
  } else {
    attributes.manualValue = null;
    attributes.manualValueLabel = null;
  }

  let record;
  if (id) {
    record = await SecuritySignalConfig.findByPk(id);
    if (!record) {
      const error = new Error('Security signal not found');
      error.status = 404;
      throw error;
    }
    await record.update(attributes);
  } else {
    record = await SecuritySignalConfig.create({
      ...attributes,
      createdBy: actorId ?? null,
      isActive: payload?.isActive !== false
    });
  }

  return serialiseSignal(record, null);
}

export async function deactivateSecuritySignal({ id, actorId }) {
  const record = await SecuritySignalConfig.findByPk(id);
  if (!record) {
    const error = new Error('Security signal not found');
    error.status = 404;
    throw error;
  }
  await record.update({ isActive: false, updatedBy: actorId ?? null });
  return serialiseSignal(record, null);
}

export async function upsertAutomationTask({ id, payload, actorId }) {
  const name = sanitiseString(payload?.name, 160);
  if (!name) {
    const error = new Error('Task name is required');
    error.name = 'ValidationError';
    throw error;
  }
  const status = coerceEnum(payload?.status, ['planned', 'in_progress', 'blocked', 'completed'], 'planned');
  const priority = coerceEnum(payload?.priority, ['low', 'medium', 'high', 'urgent'], 'medium');
  const owner = sanitiseString(payload?.owner, 120);
  const dueAt = payload?.dueAt ? new Date(payload.dueAt) : null;
  const runbookUrl = sanitiseString(payload?.runbookUrl, 512);
  const signalKey = sanitiseString(payload?.signalKey, 64);
  const notes = typeof payload?.notes === 'string' ? payload.notes.trim() : null;

  const attributes = {
    name,
    status,
    priority,
    owner,
    dueAt: dueAt && !Number.isNaN(dueAt.valueOf()) ? dueAt : null,
    runbookUrl,
    signalKey,
    notes,
    updatedBy: actorId ?? null
  };

  if (typeof payload?.isActive === 'boolean') {
    attributes.isActive = payload.isActive;
  }

  let record;
  if (id) {
    record = await SecurityAutomationTask.findByPk(id);
    if (!record) {
      const error = new Error('Automation task not found');
      error.status = 404;
      throw error;
    }
    await record.update(attributes);
  } else {
    record = await SecurityAutomationTask.create({
      ...attributes,
      createdBy: actorId ?? null,
      isActive: payload?.isActive !== false
    });
  }

  return serialiseTask(record);
}

export async function removeAutomationTask({ id, actorId }) {
  const record = await SecurityAutomationTask.findByPk(id);
  if (!record) {
    const error = new Error('Automation task not found');
    error.status = 404;
    throw error;
  }
  await record.update({ isActive: false, updatedBy: actorId ?? null });
  return serialiseTask(record);
}

export async function upsertTelemetryConnector({ id, payload, actorId }) {
  const name = sanitiseString(payload?.name, 160);
  if (!name) {
    const error = new Error('Connector name is required');
    error.name = 'ValidationError';
    throw error;
  }
  const connectorType = sanitiseString(payload?.connectorType ?? payload?.type, 64) ?? 'custom';
  const status = coerceEnum(payload?.status, ['healthy', 'warning', 'degraded', 'offline'], 'healthy');
  const region = sanitiseString(payload?.region, 64);
  const description = typeof payload?.description === 'string' ? payload.description.trim() : null;
  const dashboardUrl = sanitiseString(payload?.dashboardUrl, 512);
  const ingestionEndpoint = sanitiseString(payload?.ingestionEndpoint, 256);
  const eventsPerMinuteTarget = Number.isFinite(payload?.eventsPerMinuteTarget)
    ? Number(payload.eventsPerMinuteTarget)
    : toNumber(payload?.eventsPerMinuteTarget);
  const eventsPerMinuteActual = Number.isFinite(payload?.eventsPerMinuteActual)
    ? Number(payload.eventsPerMinuteActual)
    : toNumber(payload?.eventsPerMinuteActual);
  const lastHealthCheckAt = payload?.lastHealthCheckAt ? new Date(payload.lastHealthCheckAt) : null;
  const logoUrl = sanitiseString(payload?.logoUrl, 512);

  const attributes = {
    name,
    connectorType,
    status,
    region,
    description,
    dashboardUrl,
    ingestionEndpoint,
    eventsPerMinuteTarget: eventsPerMinuteTarget ?? null,
    eventsPerMinuteActual: eventsPerMinuteActual ?? null,
    lastHealthCheckAt: lastHealthCheckAt && !Number.isNaN(lastHealthCheckAt.valueOf()) ? lastHealthCheckAt : null,
    logoUrl,
    updatedBy: actorId ?? null
  };

  if (typeof payload?.isActive === 'boolean') {
    attributes.isActive = payload.isActive;
  }

  let record;
  if (id) {
    record = await TelemetryConnector.findByPk(id);
    if (!record) {
      const error = new Error('Telemetry connector not found');
      error.status = 404;
      throw error;
    }
    await record.update(attributes);
  } else {
    record = await TelemetryConnector.create({
      ...attributes,
      createdBy: actorId ?? null,
      isActive: payload?.isActive !== false
    });
  }

  return serialiseConnector(record);
}

export async function removeTelemetryConnector({ id, actorId }) {
  const record = await TelemetryConnector.findByPk(id);
  if (!record) {
    const error = new Error('Telemetry connector not found');
    error.status = 404;
    throw error;
  }
  await record.update({ isActive: false, updatedBy: actorId ?? null });
  return serialiseConnector(record);
}

export async function reorderSecuritySignals({ orderedIds, actorId }) {
  const records = await SecuritySignalConfig.findAll({
    order: [
      ['sortOrder', 'ASC'],
      ['created_at', 'ASC']
    ]
  });

  if (records.length === 0) {
    return [];
  }

  const recordMap = new Map(records.map((record) => [String(record.id), record]));
  const providedOrder = Array.isArray(orderedIds)
    ? orderedIds
        .map((value) => String(value))
        .filter((value) => recordMap.has(value))
        .filter((value, index, array) => array.indexOf(value) === index)
    : [];

  const remainingRecords = records.filter((record) => !providedOrder.includes(String(record.id)));
  const finalSequence = [...providedOrder.map((id) => recordMap.get(id)), ...remainingRecords];

  await sequelize.transaction(async (transaction) => {
    await Promise.all(
      finalSequence.map((record, position) =>
        record.update(
          {
            sortOrder: position,
            updatedBy: actorId ?? record.updatedBy ?? null
          },
          { transaction }
        )
      )
    );
  });

  return finalSequence.map((record) => serialiseSignal(record, null));
}
