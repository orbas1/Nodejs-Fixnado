import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, User, UserSession } = await import('../src/models/index.js');

async function createAdminToken() {
  const admin = await User.create(
    {
      firstName: 'Alicia',
      lastName: 'Ng',
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

  const token = jwt.sign(
    { sub: admin.id, sid: session.id, role: 'admin', persona: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h', audience: 'fixnado:web', issuer: 'fixnado-api' }
  );

  return { token, admin };
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

describe('Admin enterprise management routes', () => {
  it('enforces authentication', async () => {
    await request(app).get('/api/admin/enterprise/accounts').expect(401);
  });

  it('allows administrators to manage enterprise accounts, sites, stakeholders, and playbooks', async () => {
    const { token } = await createAdminToken();
    const authHeader = `Bearer ${token}`;

    const createResponse = await request(app)
      .post('/api/admin/enterprise/accounts')
      .set('Authorization', authHeader)
      .send({
        name: 'Metro Hospitals Group',
        status: 'active',
        priority: 'critical',
        timezone: 'Europe/London',
        supportEmail: 'ops@metrohospitals.test'
      })
      .expect(201);

    const accountId = createResponse.body.data.id;
    expect(createResponse.body.data.slug).toContain('metro-hospitals-group');

    const listResponse = await request(app)
      .get('/api/admin/enterprise/accounts')
      .set('Authorization', authHeader)
      .expect(200);

    expect(listResponse.body.data.accounts).toHaveLength(1);
    expect(listResponse.body.data.summary).toMatchObject({ total: 1, active: 1, critical: 1 });

    const updateResponse = await request(app)
      .put(`/api/admin/enterprise/accounts/${accountId}`)
      .set('Authorization', authHeader)
      .send({ accountManager: 'Dana White', notes: '24/7 coverage with ICU preference.' })
      .expect(200);

    expect(updateResponse.body.data.accountManager).toBe('Dana White');
    expect(updateResponse.body.data.notes).toContain('24/7 coverage');

    const siteResponse = await request(app)
      .post(`/api/admin/enterprise/accounts/${accountId}/sites`)
      .set('Authorization', authHeader)
      .send({
        name: 'Metro Hospital North',
        status: 'operational',
        city: 'Manchester',
        country: 'UK',
        contactName: 'Sarah Patel'
      })
      .expect(201);

    const siteId = siteResponse.body.data.id;
    expect(siteResponse.body.data.contactName).toBe('Sarah Patel');

    const stakeholderResponse = await request(app)
      .post(`/api/admin/enterprise/accounts/${accountId}/stakeholders`)
      .set('Authorization', authHeader)
      .send({
        role: 'Operations Director',
        name: 'Imani Walker',
        email: 'imani.walker@metrohospitals.test',
        isPrimary: true
      })
      .expect(201);

    const stakeholderId = stakeholderResponse.body.data.id;
    expect(stakeholderResponse.body.data.isPrimary).toBe(true);

    const playbookResponse = await request(app)
      .post(`/api/admin/enterprise/accounts/${accountId}/playbooks`)
      .set('Authorization', authHeader)
      .send({
        name: 'Critical Response Runbook',
        status: 'approved',
        owner: 'Dana White',
        documentUrl: 'https://docs.fixnado.test/runbooks/critical-response'
      })
      .expect(201);

    const playbookId = playbookResponse.body.data.id;
    expect(playbookResponse.body.data.status).toBe('approved');

    await request(app)
      .put(`/api/admin/enterprise/accounts/${accountId}/sites/${siteId}`)
      .set('Authorization', authHeader)
      .send({ status: 'maintenance', mapUrl: 'https://maps.test/metro-north' })
      .expect(200);

    await request(app)
      .put(`/api/admin/enterprise/accounts/${accountId}/stakeholders/${stakeholderId}`)
      .set('Authorization', authHeader)
      .send({ isPrimary: false, escalationLevel: 'secondary' })
      .expect(200);

    await request(app)
      .put(`/api/admin/enterprise/accounts/${accountId}/playbooks/${playbookId}`)
      .set('Authorization', authHeader)
      .send({ owner: 'Imani Walker' })
      .expect(200);

    const detailResponse = await request(app)
      .get(`/api/admin/enterprise/accounts/${accountId}`)
      .set('Authorization', authHeader)
      .expect(200);

    expect(detailResponse.body.data.sites).toHaveLength(1);
    expect(detailResponse.body.data.stakeholders).toHaveLength(1);
    expect(detailResponse.body.data.playbooks).toHaveLength(1);
    expect(detailResponse.body.data.sites[0].status).toBe('maintenance');

    await request(app)
      .delete(`/api/admin/enterprise/accounts/${accountId}/sites/${siteId}`)
      .set('Authorization', authHeader)
      .expect(204);

    await request(app)
      .delete(`/api/admin/enterprise/accounts/${accountId}/stakeholders/${stakeholderId}`)
      .set('Authorization', authHeader)
      .expect(204);

    await request(app)
      .delete(`/api/admin/enterprise/accounts/${accountId}/playbooks/${playbookId}`)
      .set('Authorization', authHeader)
      .expect(204);

    await request(app)
      .patch(`/api/admin/enterprise/accounts/${accountId}/archive`)
      .set('Authorization', authHeader)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.archivedAt).toBeTruthy();
      });

    const postArchiveList = await request(app)
      .get('/api/admin/enterprise/accounts')
      .set('Authorization', authHeader)
      .expect(200);

    expect(postArchiveList.body.data.accounts).toHaveLength(0);

    const archivedList = await request(app)
      .get('/api/admin/enterprise/accounts?includeArchived=true')
      .set('Authorization', authHeader)
      .expect(200);

    expect(archivedList.body.data.accounts).toHaveLength(1);
    expect(archivedList.body.data.accounts[0].archivedAt).toBeTruthy();

    await request(app)
      .put(`/api/admin/enterprise/accounts/${accountId}`)
      .set('Authorization', authHeader)
      .send({ accountManager: 'Locked' })
      .expect(409)
      .expect((res) => {
        expect(res.body.message).toContain('read-only');
      });

    await request(app)
      .post(`/api/admin/enterprise/accounts/${accountId}/sites`)
      .set('Authorization', authHeader)
      .send({ name: 'Locked site' })
      .expect(409)
      .expect((res) => {
        expect(res.body.message).toContain('read-only');
      });

    await request(app)
      .delete(`/api/admin/enterprise/accounts/${accountId}/sites/${crypto.randomUUID()}`)
      .set('Authorization', authHeader)
      .expect(409)
      .expect((res) => {
        expect(res.body.message).toContain('read-only');
      });
  });
});
