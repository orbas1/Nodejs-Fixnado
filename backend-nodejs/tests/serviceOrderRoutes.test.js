import crypto from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  UserSession,
  Service,
  Order,
  OrderNote
} = await import('../src/models/index.js');

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

async function createSessionToken(user, { role = 'user', persona = null } = {}) {
  const session = await UserSession.create({
    userId: user.id,
    refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    sessionFingerprint: crypto.randomBytes(16).toString('hex'),
    clientType: 'web',
    clientVersion: 'vitest',
    deviceLabel: 'vitest',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: { persona },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date()
  });

  const token = jwt.sign(
    {
      sub: user.id,
      sid: session.id,
      role,
      persona
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h', audience: 'fixnado:web', issuer: 'fixnado-api' }
  );

  return token;
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

describe('Service order routes', () => {
  it('allows customers to manage end-to-end service order workflows', async () => {
    const provider = await User.create(
      {
        firstName: 'Provider',
        lastName: 'Ops',
        email: `provider-${crypto.randomUUID()}@example.com`,
        passwordHash: 'hash',
        type: 'servicemen'
      },
      { validate: false }
    );

    const service = await Service.create({
      providerId: provider.id,
      title: 'Rapid response repairs',
      description: 'Certified technicians on standby for emergency jobs.',
      category: 'Facilities',
      price: 540,
      currency: 'GBP'
    });

    const customer = await User.create(
      {
        firstName: 'Casey',
        lastName: 'Coordinator',
        email: `customer-${crypto.randomUUID()}@example.com`,
        passwordHash: 'hash',
        type: 'user'
      },
      { validate: false }
    );

    const token = await createSessionToken(customer, { role: 'user' });

    const scheduledFor = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const createResponse = await request(app)
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        serviceId: service.id,
        title: 'Emergency lobby repair',
        summary: 'Repair water ingress and replace damaged tiles.',
        priority: 'high',
        totalAmount: 2150.75,
        currency: 'GBP',
        scheduledFor,
        tags: ['urgent', 'safety'],
        metadata: {
          siteAddress: '101 Market Street',
          contactName: 'Jordan Blake',
          contactPhone: '+44 20 7946 0958',
          approvalStatus: 'pending'
        }
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      title: 'Emergency lobby repair',
      status: 'draft',
      priority: 'high',
      serviceId: service.id
    });

    const orderId = createResponse.body.id;
    expect(orderId).toBeTruthy();

    const listResponse = await request(app)
      .get('/api/service-orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body.orders).toHaveLength(1);
    expect(listResponse.body.meta).toMatchObject({ total: 1, offset: 0 });
    expect(listResponse.body.meta.statusCounts).toMatchObject({
      draft: 1,
      funded: 0,
      in_progress: 0,
      completed: 0,
      disputed: 0
    });

    const detailResponse = await request(app)
      .get(`/api/service-orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detailResponse.body).toMatchObject({
      id: orderId,
      notes: []
    });

    await request(app)
      .put(`/api/service-orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        summary: 'Repair water ingress, replace tiles, and confirm moisture readings.',
        priority: 'urgent',
        attachments: [
          {
            label: 'Scope of works',
            url: 'https://files.fixnado.test/scope.pdf',
            type: 'document'
          }
        ],
        tags: ['urgent', 'remediation'],
        metadata: {
          siteAddress: '101 Market Street',
          contactName: 'Jordan Blake',
          contactPhone: '+44 20 7946 0958',
          approvalStatus: 'approved'
        }
      })
      .expect(200);

    const statusResponse = await request(app)
      .patch(`/api/service-orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })
      .expect(200);

    expect(statusResponse.body).toMatchObject({ status: 'in_progress' });

    const noteResponse = await request(app)
      .post(`/api/service-orders/${orderId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: 'Crew dispatched and on-site within 25 minutes.',
        attachments: [
          {
            id: 'dispatch-photo',
            url: 'https://files.fixnado.test/site.jpg',
            label: 'Arrival photo',
            type: 'image'
          }
        ]
      })
      .expect(201);

    expect(noteResponse.body).toMatchObject({ body: 'Crew dispatched and on-site within 25 minutes.' });

    const noteId = noteResponse.body.id;
    expect(noteId).toBeTruthy();

    await request(app)
      .delete(`/api/service-orders/${orderId}/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const refreshedDetail = await request(app)
      .get(`/api/service-orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(refreshedDetail.body.notes).toHaveLength(0);

    const storedOrder = await Order.findByPk(orderId, {
      include: [{ model: OrderNote, as: 'notes' }]
    });
    expect(storedOrder).not.toBeNull();
    expect(storedOrder.status).toBe('in_progress');
    expect(storedOrder.priority).toBe('urgent');
    expect(storedOrder.attachments).toHaveLength(1);
    expect(await OrderNote.count({ where: { orderId } })).toBe(0);
  });

  it('filters service orders by status, priority, and search with accurate metadata', async () => {
    const provider = await User.create(
      {
        firstName: 'Provider',
        lastName: 'Ops',
        email: `provider-${crypto.randomUUID()}@example.com`,
        passwordHash: 'hash',
        type: 'servicemen'
      },
      { validate: false }
    );

    const service = await Service.create({
      providerId: provider.id,
      title: 'Concierge maintenance',
      description: 'Rapid response facilities maintenance for enterprise tenants.',
      category: 'Facilities',
      price: 420,
      currency: 'GBP'
    });

    const customer = await User.create(
      {
        firstName: 'Riley',
        lastName: 'Coordinator',
        email: `customer-${crypto.randomUUID()}@example.com`,
        passwordHash: 'hash',
        type: 'user'
      },
      { validate: false }
    );

    const token = await createSessionToken(customer, { role: 'user' });
    const now = Date.now();

    const createOrder = async (payload) =>
      request(app)
        .post('/api/service-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceId: service.id,
          totalAmount: 1200,
          currency: 'GBP',
          scheduledFor: new Date(now + 60 * 60 * 1000).toISOString(),
          ...payload
        })
        .expect(201);

    const draftOrder = await createOrder({
      title: 'Lobby lighting upgrade',
      summary: 'Swap to LED units before quarterly inspection.',
      priority: 'medium',
      tags: ['lighting']
    });

    const inProgressOrder = await createOrder({
      title: 'Thermostat calibration',
      summary: 'Balance temperature variance across floors.',
      priority: 'urgent',
      tags: ['hvac']
    });

    const fundedOrder = await createOrder({
      title: 'Roof drainage review',
      summary: 'Inspect and clear roof drainage ahead of storm season.',
      priority: 'high',
      tags: ['roof']
    });

    await request(app)
      .patch(`/api/service-orders/${inProgressOrder.body.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })
      .expect(200);

    await request(app)
      .patch(`/api/service-orders/${fundedOrder.body.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'funded' })
      .expect(200);

    const statusFiltered = await request(app)
      .get('/api/service-orders?status=in_progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(statusFiltered.body.orders).toHaveLength(1);
    expect(statusFiltered.body.orders[0].id).toBe(inProgressOrder.body.id);
    expect(statusFiltered.body.meta.total).toBe(1);
    expect(statusFiltered.body.meta.statusCounts).toMatchObject({
      in_progress: 1,
      draft: 0,
      funded: 0,
      completed: 0,
      disputed: 0
    });

    const priorityFiltered = await request(app)
      .get('/api/service-orders?priority=urgent')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(priorityFiltered.body.orders).toHaveLength(1);
    expect(priorityFiltered.body.orders[0].id).toBe(inProgressOrder.body.id);
    expect(priorityFiltered.body.meta.total).toBe(1);
    expect(priorityFiltered.body.meta.statusCounts).toMatchObject({
      in_progress: 1,
      draft: 0,
      funded: 0
    });

    const searchFiltered = await request(app)
      .get('/api/service-orders?search=Roof')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(searchFiltered.body.orders).toHaveLength(1);
    expect(searchFiltered.body.orders[0].id).toBe(fundedOrder.body.id);
    expect(searchFiltered.body.meta.total).toBe(1);
    expect(searchFiltered.body.meta.statusCounts).toMatchObject({
      funded: 1,
      draft: 0,
      in_progress: 0
    });

    const mediumPriority = await request(app)
      .get('/api/service-orders?priority=medium')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(mediumPriority.body.orders).toHaveLength(1);
    expect(mediumPriority.body.orders[0].id).toBe(draftOrder.body.id);
    expect(mediumPriority.body.meta.total).toBe(1);
    expect(mediumPriority.body.meta.statusCounts).toMatchObject({
      draft: 1,
      funded: 0,
      in_progress: 0
    });
  });
});
