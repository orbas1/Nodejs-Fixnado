import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

const { default: app } = await import('../src/app.js');
const { sequelize, Service, User } = await import('../src/models/index.js');

const serviceSchema = z.object({
  id: z.string().uuid(),
  providerId: z.string().uuid().nullable(),
  companyId: z.string().uuid().nullable(),
  title: z.string().min(3),
  description: z.string().nullable(),
  category: z.string().nullable(),
  price: z.union([z.string(), z.number()]),
  currency: z.string().length(3),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date())
});

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('GET /api/services contract', () => {
  it('returns services that conform to the consumer contract schema', async () => {
    const provider = await User.create({
      firstName: 'Contract',
      lastName: 'Provider',
      email: 'contract.provider@example.com',
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    await Service.create({
      providerId: provider.id,
      title: 'Disaster recovery planning',
      description: 'Create geo-resilient runbooks and failover simulations.',
      category: 'Operations',
      price: 950.75,
      currency: 'USD'
    });

    const response = await request(app).get('/api/services').expect(200);

    const parseResult = z.array(serviceSchema).safeParse(response.body);
    expect(parseResult.success).toBe(true);

    const [service] = response.body;
    expect(service.title).toBe('Disaster recovery planning');
    expect(service.currency).toBe('USD');
  });
});
