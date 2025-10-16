import {
  getSecurityPosture,
  upsertSecuritySignal,
  deactivateSecuritySignal,
  upsertAutomationTask,
  removeAutomationTask,
  upsertTelemetryConnector,
  removeTelemetryConnector,
  reorderSecuritySignals
} from '../services/securityPostureService.js';
import { Permissions } from '../constants/permissions.js';

function resolveCapabilities(req) {
  const granted = new Set(req.auth?.grantedPermissions ?? []);
  const canWrite = granted.has(Permissions.ADMIN_SECURITY_POSTURE_WRITE);
  return {
    canManageSignals: canWrite,
    canManageAutomation: canWrite,
    canManageConnectors: canWrite
  };
}

export async function getSecurityPostureHandler(req, res, next) {
  try {
    const timezone = req.query.timezone ?? req.app?.get?.('dashboards:defaultTimezone') ?? 'Europe/London';
    const includeInactive = String(req.query.includeInactive).toLowerCase() === 'true';
    const posture = await getSecurityPosture({ timezone, includeInactive });
    const capabilities = resolveCapabilities(req);
    res.json({ data: { ...posture, capabilities } });
  } catch (error) {
    next(error);
  }
}

export async function upsertSecuritySignalHandler(req, res, next) {
  try {
    const signal = await upsertSecuritySignal({ id: req.params.id, payload: req.body, actorId: req.user?.id });
    res.status(req.method === 'POST' ? 201 : 200).json({ data: signal });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function deactivateSecuritySignalHandler(req, res, next) {
  try {
    const signal = await deactivateSecuritySignal({ id: req.params.id, actorId: req.user?.id });
    res.json({ data: signal });
  } catch (error) {
    next(error);
  }
}

export async function upsertAutomationTaskHandler(req, res, next) {
  try {
    const task = await upsertAutomationTask({ id: req.params.id, payload: req.body, actorId: req.user?.id });
    res.status(req.method === 'POST' ? 201 : 200).json({ data: task });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function removeAutomationTaskHandler(req, res, next) {
  try {
    const result = await removeAutomationTask({ id: req.params.id, actorId: req.user?.id });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function upsertTelemetryConnectorHandler(req, res, next) {
  try {
    const connector = await upsertTelemetryConnector({ id: req.params.id, payload: req.body, actorId: req.user?.id });
    res.status(req.method === 'POST' ? 201 : 200).json({ data: connector });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function removeTelemetryConnectorHandler(req, res, next) {
  try {
    const result = await removeTelemetryConnector({ id: req.params.id, actorId: req.user?.id });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function reorderSecuritySignalsHandler(req, res, next) {
  try {
    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    await reorderSecuritySignals({ orderedIds, actorId: req.user?.id });
    res.status(202).json({ data: { orderedIds } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
}
