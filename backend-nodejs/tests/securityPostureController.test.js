import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  sequelize,
  SecuritySignalConfig,
  SecurityAutomationTask,
  TelemetryConnector
} = await import('../src/models/index.js');

const { Permissions } = await import('../src/constants/permissions.js');
const {
  getSecurityPostureHandler,
  upsertSecuritySignalHandler,
  deactivateSecuritySignalHandler,
  reorderSecuritySignalsHandler
} = await import('../src/controllers/securityPostureController.js');

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('securityPostureController', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  it('returns security posture with capability flags', async () => {
    await SecuritySignalConfig.create({
      metricKey: 'mfa_adoption',
      displayName: 'MFA adoption',
      description: 'Test signal'
    });
    await SecurityAutomationTask.create({ name: 'Rotate tokens', status: 'planned', priority: 'medium' });
    await TelemetryConnector.create({ name: 'Splunk', connectorType: 'siem', status: 'healthy' });

    const req = {
      query: {},
      app: { get: vi.fn(() => 'Europe/London') },
      auth: { grantedPermissions: [Permissions.ADMIN_SECURITY_POSTURE_WRITE] }
    };
    const res = mockRes();
    const next = vi.fn();

    await getSecurityPostureHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.signals).toHaveLength(1);
    expect(payload.data.capabilities).toEqual({
      canManageSignals: true,
      canManageAutomation: true,
      canManageConnectors: true
    });
  });

  it('validates signal input and handles errors', async () => {
    const req = {
      params: {},
      body: { metricKey: '', displayName: '' },
      user: { id: 'tester' }
    };
    const res = mockRes();
    const next = vi.fn();

    await upsertSecuritySignalHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Display name is required' });

    const signal = await SecuritySignalConfig.create({
      metricKey: 'api_errors',
      displayName: 'API errors'
    });

    const deleteReq = { params: { id: signal.id }, user: { id: 'tester' } };
    const deleteRes = mockRes();

    await deactivateSecuritySignalHandler(deleteReq, deleteRes, next);
    expect(deleteRes.json).toHaveBeenCalledTimes(1);
  });

  it('reorders signals via the controller handler', async () => {
    const [first, second, third] = await Promise.all([
      SecuritySignalConfig.create({ metricKey: 'signal_a', displayName: 'Signal A', sortOrder: 0 }),
      SecuritySignalConfig.create({ metricKey: 'signal_b', displayName: 'Signal B', sortOrder: 1 }),
      SecuritySignalConfig.create({ metricKey: 'signal_c', displayName: 'Signal C', sortOrder: 2 })
    ]);

    const req = {
      body: { orderedIds: [third.id, first.id] },
      user: { id: 'admin' }
    };
    const res = mockRes();
    const next = vi.fn();

    await reorderSecuritySignalsHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ data: { orderedIds: [third.id, first.id] } });

    const ordered = await SecuritySignalConfig.findAll({ order: [['sortOrder', 'ASC']] });
    expect(ordered.map((item) => item.metricKey).slice(0, 2)).toEqual(['signal_c', 'signal_a']);
    expect(ordered[2].metricKey).toBe('signal_b');
  });
});
