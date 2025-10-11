import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, User, Service, Order, Escrow } = await import('../src/models/index.js');

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

describe('POST /api/services', () => {
  it('allows authorised providers to create a service and persists ownership metadata', async () => {
    const provider = await User.create({
      firstName: 'Alex',
      lastName: 'Griffin',
      email: 'alex.provider@example.com',
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    const response = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${createToken(provider.id)}`)
      .send({
        title: 'Emergency plumbing repair',
        description: 'Dispatch a certified engineer with isolation valves stocked.',
        category: 'Plumbing',
        price: 185.5,
        currency: 'GBP'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      title: 'Emergency plumbing repair',
      providerId: provider.id,
      currency: 'GBP'
    });

    const stored = await Service.findByPk(response.body.id);
    expect(stored).not.toBeNull();
    expect(stored.providerId).toEqual(provider.id);
  });

  it('rejects authenticated users without provider permissions', async () => {
    const user = await User.create({
      firstName: 'Nora',
      lastName: 'Miles',
      email: 'nora@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const response = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${createToken(user.id)}`)
      .send({ title: 'Invalid post', price: 99.99 })
      .expect(403);

    expect(response.body).toMatchObject({ message: 'Forbidden' });
    expect(await Service.count()).toBe(0);
  });
});

describe('POST /api/services/:id/purchase', () => {
  it('processes a purchase inside a transaction and returns escrow metadata', async () => {
    const provider = await User.create({
      firstName: 'Kai',
      lastName: 'Jordan',
      email: 'kai@example.com',
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    const buyer = await User.create({
      firstName: 'Morgan',
      lastName: 'Stone',
      email: 'morgan@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const service = await Service.create({
      providerId: provider.id,
      title: 'Commercial HVAC diagnostics',
      description: 'Includes load calculations and uptime risk scoring.',
      category: 'HVAC',
      price: 480,
      currency: 'GBP'
    });

    const response = await request(app)
      .post(`/api/services/${service.id}/purchase`)
      .set('Authorization', `Bearer ${createToken(buyer.id)}`)
      .send({ scheduledFor: new Date().toISOString() })
      .expect(201);

    expect(response.body.order).toMatchObject({
      serviceId: service.id,
      buyerId: buyer.id,
      status: 'funded'
    });

    expect(response.body.escrow).toMatchObject({
      orderId: response.body.order.id,
      status: 'funded'
    });

    const orderRecord = await Order.findByPk(response.body.order.id, { include: Escrow });
    expect(orderRecord).not.toBeNull();
    expect(orderRecord.Escrow).not.toBeNull();
  });

  it('rolls back order creation when escrow persistence fails', async () => {
    const provider = await User.create({
      firstName: 'Olivia',
      lastName: 'Chen',
      email: 'olivia@example.com',
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    const buyer = await User.create({
      firstName: 'Harper',
      lastName: 'Cole',
      email: 'harper@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const service = await Service.create({
      providerId: provider.id,
      title: 'High-risk electrical remediation',
      description: 'Deploy NICEIC-certified engineer with surge remediation plan.',
      category: 'Electrical',
      price: 640,
      currency: 'GBP'
    });

    const escrowSpy = vi.spyOn(Escrow, 'create').mockRejectedValue(new Error('database outage'));

    const response = await request(app)
      .post(`/api/services/${service.id}/purchase`)
      .set('Authorization', `Bearer ${createToken(buyer.id)}`)
      .send({})
      .expect(500);

    expect(response.body).toMatchObject({ message: 'Internal server error' });
    expect(await Order.count()).toBe(0);
    expect(await Escrow.count()).toBe(0);

    escrowSpy.mockRestore();
  });
});
