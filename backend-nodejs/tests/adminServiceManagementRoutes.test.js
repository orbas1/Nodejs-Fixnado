import crypto from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  Service,
  ServiceCategory,
  UserSession
} = await import('../src/models/index.js');

function createToken(userId, extra = {}) {
  return jwt.sign({ sub: userId, ...extra }, process.env.JWT_SECRET, {
    expiresIn: '1h',
    audience: 'fixnado:web',
    issuer: 'fixnado-api'
  });
}

async function createSessionToken(user, extra = {}) {
  const session = await UserSession.create({
    userId: user.id,
    refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    sessionFingerprint: crypto.randomBytes(16).toString('hex'),
    clientType: 'test',
    clientVersion: 'vitest',
    deviceLabel: 'vitest',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: { persona: extra.persona ?? null },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date()
  });

  const token = createToken(user.id, { sid: session.id, ...extra });
  return { token, session };
}

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Admin service management routes', () => {
  it('supports CRUD operations for categories and listings with role enforcement', async () => {
    const admin = await User.create(
      {
        firstName: 'Ada',
        lastName: 'Admin',
        email: 'ada.admin@example.com',
        passwordHash: 'hashed',
        type: 'admin'
      },
      { validate: false }
    );

    const provider = await User.create(
      {
        firstName: 'Luca',
        lastName: 'Provider',
        email: 'luca.provider@example.com',
        passwordHash: 'hashed',
        type: 'servicemen'
      },
      { validate: false }
    );

    const company = await Company.create({
      userId: provider.id,
      legalStructure: 'limited',
      contactName: 'Luca Provider',
      contactEmail: 'ops@provider.test',
      serviceRegions: 'London, Essex',
      verified: true
    });

    const { token } = await createSessionToken(admin, { role: 'admin' });

    const createCategoryResponse = await request(app)
      .post('/api/admin/services/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Critical Power',
        slug: 'critical-power',
        description: 'Generator deployments, emergency electrical response.',
        icon: 'heroicon-outline:bolt',
        accentColour: '#f97316',
        metadata: { owner: 'ops-team' },
        ordering: 2,
        isActive: true
      })
      .expect(201);

    expect(createCategoryResponse.body.category).toMatchObject({
      name: 'Critical Power',
      slug: 'critical-power',
      isActive: true,
      metadata: { owner: 'ops-team' }
    });

    const categoryId = createCategoryResponse.body.category.id;

    const createListingResponse = await request(app)
      .post('/api/admin/services/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Emergency generator deployment',
        slug: 'emergency-generator-deployment',
        description: 'Rapid deployment of critical power infrastructure for incident response.',
        price: 1450,
        currency: 'GBP',
        companyId: company.id,
        providerId: provider.id,
        categoryId,
        coverage: ['London', 'Essex'],
        tags: ['generator', 'emergency'],
        heroImageUrl: 'https://example.com/hero.jpg',
        gallery: [
          { url: 'https://example.com/hero.jpg', altText: 'Generator staging area' }
        ],
        metadata: { responseTimeHours: 4 }
      })
      .expect(201);

    expect(createListingResponse.body.listing).toMatchObject({
      title: 'Emergency generator deployment',
      status: 'draft',
      visibility: 'restricted'
    });

    const listingId = createListingResponse.body.listing.id;

    const updateListingResponse = await request(app)
      .put(`/api/admin/services/listings/${listingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        price: 1600,
        status: 'published',
        tags: ['generator', 'standby'],
        kind: 'package',
        description: 'Published emergency response service with generator standby.',
        gallery: [
          { url: 'https://example.com/hero.jpg', altText: 'Generator staging area' },
          { url: 'https://example.com/crew.jpg', altText: 'Response crew' }
        ],
        metadata: { escalationContact: 'duty-manager@example.com', responseTimeHours: 2 }
      })
      .expect(200);

    expect(updateListingResponse.body.listing).toMatchObject({
      id: listingId,
      price: 1600,
      status: 'published',
      kind: 'package',
      tags: ['generator', 'standby']
    });

    expect(updateListingResponse.body.listing.gallery).toHaveLength(2);

    await request(app)
      .patch(`/api/admin/services/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'paused' })
      .expect(200)
      .expect((response) => {
        expect(response.body.listing.status).toBe('paused');
      });

    const listingsResponse = await request(app)
      .get('/api/admin/services/listings')
      .set('Authorization', `Bearer ${token}`)
      .query({ statuses: 'paused' })
      .expect(200);

    expect(listingsResponse.body.results).toHaveLength(1);
    expect(listingsResponse.body.summary.paused).toBe(1);
    expect(listingsResponse.body.results[0]).toMatchObject({ slug: 'emergency-generator-deployment' });

    const summaryResponse = await request(app)
      .get('/api/admin/services/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(summaryResponse.body.health[0]).toMatchObject({ id: 'published' });
    expect(summaryResponse.body.catalogue.length).toBeGreaterThan(0);
    expect(summaryResponse.body.packages[0]).toMatchObject({ serviceId: listingId });

    await request(app)
      .delete(`/api/admin/services/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.category.isActive).toBe(false);
      });

    const storedListing = await Service.findByPk(listingId);
    expect(storedListing.status).toBe('paused');

    const storedCategory = await ServiceCategory.findByPk(categoryId);
    expect(storedCategory.isActive).toBe(false);
  });
});
