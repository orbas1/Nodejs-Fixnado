import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, User, UserSession } = await import('../src/models/index.js');
const { __resetOverviewSettingsCache } = await import('../src/services/adminDashboardSettingsService.js');

async function createAdminToken() {
  const admin = await User.create(
    {
      firstName: 'Ada',
      lastName: 'Admin',
      email: `admin-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'admin'
    },
    { validate: false }
  );

  const session = await UserSession.create({
    userId: admin.id,
    refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    sessionFingerprint: crypto.randomBytes(16).toString('hex'),
    clientType: 'web',
    clientVersion: 'vitest',
    deviceLabel: 'vitest',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: { persona: 'admin' },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date()
  });

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  const token = jwt.sign(
    {
      sub: admin.id,
      sid: session.id,
      role: 'admin',
      persona: 'admin'
    },
    secret,
    { expiresIn: '1h', audience: 'fixnado:web', issuer: 'fixnado-api' }
  );

  return token;
}

describe('Admin dashboard overview settings routes', () => {
  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-key';
    }
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
    __resetOverviewSettingsCache();
  });

  it('returns default overview settings for admin', async () => {
    const token = await createAdminToken();

    const response = await request(app)
      .get('/api/admin/dashboard/overview-settings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.settings.metrics.escrow.label).toBeTruthy();
    expect(Array.isArray(response.body.settings.insights.manual)).toBe(true);
  });

  it('updates overview settings for admin actors', async () => {
    const token = await createAdminToken();

    const updateResponse = await request(app)
      .put('/api/admin/dashboard/overview-settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        insights: { manual: ['Manual insight'] },
        security: { manualSignals: [{ label: 'Manual signal', valueLabel: '99%', tone: 'success' }] },
        automation: { manualBacklog: [{ name: 'Manual automation', status: 'Pilot', tone: 'info' }] },
        queues: {
          manualBoards: [
            { title: 'Manual board', summary: 'Summary', owner: 'Ops', updates: ['Bullet'] }
          ],
          manualComplianceControls: [
            { name: 'Manual control', detail: 'Detail', due: 'Soon', owner: 'Compliance', tone: 'warning' }
          ]
        },
        audit: { manualTimeline: [{ time: 'Now', event: 'Manual audit', owner: 'Ops', status: 'Done' }] }
      })
      .expect(200);

    expect(updateResponse.body.settings.insights.manual).toEqual(['Manual insight']);
    expect(updateResponse.body.settings.security.manualSignals).toEqual([
      { label: 'Manual signal', valueLabel: '99%', caption: '', tone: 'success' }
    ]);
    expect(updateResponse.body.settings.queues.manualBoards[0]).toMatchObject({
      title: 'Manual board',
      summary: 'Summary',
      owner: 'Ops'
    });
    expect(updateResponse.body.settings.audit.manualTimeline).toEqual([
      { time: 'Now', event: 'Manual audit', owner: 'Ops', status: 'Done' }
    ]);

    const fetchResponse = await request(app)
      .get('/api/admin/dashboard/overview-settings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(fetchResponse.body.settings.insights.manual).toEqual(['Manual insight']);
    expect(fetchResponse.body.settings.security.manualSignals[0].label).toBe('Manual signal');
  });
});
