import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  ComplianceDocument,
  MarketplaceItem
} = await import('../src/models/index.js');

function futureDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch {
    // ignore double close in watch mode
  }
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Insured seller compliance and marketplace moderation', () => {
  it('blocks unverified sellers, processes compliance review, and moderates listings', async () => {
    const provider = await User.create({
      firstName: 'Provider',
      lastName: 'Owner',
      email: 'provider@example.com',
      passwordHash: 'hash',
      type: 'provider_admin'
    });

    const reviewer = await User.create({
      firstName: 'Compliance',
      lastName: 'Officer',
      email: 'compliance@example.com',
      passwordHash: 'hash',
      type: 'admin'
    });

    const company = await Company.create({
      userId: provider.id,
      legalStructure: 'Ltd',
      contactName: 'Provider Owner',
      contactEmail: 'provider@example.com',
      serviceRegions: 'London',
      marketplaceIntent: 'Equipment rentals'
    });

    await request(app)
      .post('/api/marketplace/items')
      .send({
        companyId: company.id,
        title: 'Thermal Camera',
        availability: 'rent',
        pricePerDay: 125,
        description: 'FLIR thermal imaging camera'
      })
      .expect(409);

    async function submitAndApprove(type) {
      const submission = await request(app)
        .post('/api/compliance/documents')
        .send({
          companyId: company.id,
          uploadedBy: provider.id,
          type,
          storageKey: `s3://compliance/${type}.pdf`,
          fileName: `${type}.pdf`,
          fileSizeBytes: 102400,
          mimeType: 'application/pdf',
          expiryAt: futureDate(120)
        })
        .expect(201);

      const documentId = submission.body.id;
      await request(app)
        .post(`/api/compliance/documents/${documentId}/review`)
        .send({ decision: 'approve', reviewerId: reviewer.id })
        .expect(200);
      return documentId;
    }

    const insuranceDocId = await submitAndApprove('insurance_certificate');
    await submitAndApprove('public_liability');
    await submitAndApprove('identity_verification');

    const evaluationResponse = await request(app)
      .post(`/api/compliance/companies/${company.id}/evaluate`)
      .send({})
      .expect(200);

    expect(evaluationResponse.body.status).toBe('approved');

    await request(app)
      .post(`/api/compliance/companies/${company.id}/badge`)
      .send({ visible: true, actorId: reviewer.id })
      .expect(200);

    await company.reload();
    expect(company.insuredSellerStatus).toBe('approved');
    expect(company.insuredSellerBadgeVisible).toBe(true);

    const createListingResponse = await request(app)
      .post('/api/marketplace/items')
      .send({
        companyId: company.id,
        title: 'Thermal Camera Pro X',
        description: 'High resolution thermal camera with hard case',
        availability: 'rent',
        pricePerDay: 140,
        insuredOnly: true,
        actorId: provider.id
      })
      .expect(201);

    expect(createListingResponse.body.status).toBe('pending_review');

    const moderationQueue = await request(app)
      .get('/api/marketplace/moderation/queue')
      .expect(200);

    expect(moderationQueue.body).toHaveLength(1);
    expect(moderationQueue.body[0].Company.insuredSellerStatus).toBe('approved');

    const itemId = createListingResponse.body.id;

    await request(app)
      .post(`/api/marketplace/items/${itemId}/moderate`)
      .send({ decision: 'approve', reviewerId: reviewer.id })
      .expect(200);

    const feedResponse = await request(app).get('/api/feed/marketplace').expect(200);
    expect(feedResponse.body).toHaveLength(1);
    expect(feedResponse.body[0].compliance.status).toBe('approved');
    expect(feedResponse.body[0].compliance.badgeVisible).toBe(true);

    await ComplianceDocument.update(
      { expiryAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { where: { id: insuranceDocId } }
    );

    await request(app)
      .post(`/api/compliance/companies/${company.id}/evaluate`)
      .send({})
      .expect(200);

    await company.reload();
    expect(company.insuredSellerStatus).toBe('pending_documents');
    expect(company.insuredSellerBadgeVisible).toBe(false);

    const feedAfterExpiry = await request(app).get('/api/feed/marketplace').expect(200);
    expect(feedAfterExpiry.body).toHaveLength(0);

    await ComplianceDocument.update(
      { expiryAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
      { where: { id: insuranceDocId } }
    );

    await request(app)
      .post(`/api/compliance/documents/${insuranceDocId}/review`)
      .send({ decision: 'approve', reviewerId: reviewer.id })
      .expect(200);

    await request(app)
      .post(`/api/compliance/companies/${company.id}/evaluate`)
      .send({ overrideSuspended: true })
      .expect(200);

    await request(app)
      .post(`/api/compliance/companies/${company.id}/badge`)
      .send({ visible: true, actorId: reviewer.id })
      .expect(200);

    await request(app)
      .post(`/api/compliance/companies/${company.id}/suspend`)
      .send({ actorId: reviewer.id, reason: 'Insurance investigation' })
      .expect(200);

    await company.reload();
    expect(company.insuredSellerStatus).toBe('suspended');
    expect(company.insuredSellerBadgeVisible).toBe(false);

    await request(app)
      .post('/api/marketplace/items')
      .send({
        companyId: company.id,
        title: 'Backup Generator',
        availability: 'rent',
        pricePerDay: 90
      })
      .expect(409);

    const moderatedItem = await MarketplaceItem.findByPk(itemId);
    expect(moderatedItem.status).toBe('approved');
  });
});
