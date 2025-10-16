import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const legalAdminController = await import('../src/controllers/legalAdminController.js');
const { sequelize } = await import('../src/models/index.js');
const {
  getLegalDocumentDetail,
  publishLegalDocumentVersion
} = await import('../src/services/legalDocumentService.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { email: 'admin@example.com' };
    next();
  });

  app.post('/api/admin/legal', (req, res, next) =>
    legalAdminController.createLegalDocumentHandler(req, res, next)
  );
  app.put('/api/admin/legal/:slug', (req, res, next) =>
    legalAdminController.updateLegalDocumentHandler(req, res, next)
  );
  app.delete('/api/admin/legal/:slug', (req, res, next) =>
    legalAdminController.deleteLegalDocumentHandler(req, res, next)
  );

  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  return app;
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

describe('admin legal routes', () => {
  it('creates a legal document via POST /api/admin/legal', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/admin/legal')
      .send({ title: 'Security Policy', slug: 'security-policy', summary: 'Covers security expectations' });

    expect(response.status).toBe(201);
    expect(response.body.document.slug).toBe('security-policy');
    expect(response.body.document.title).toBe('Security Policy');

    const detail = await getLegalDocumentDetail('security-policy');
    expect(detail?.title).toBe('Security Policy');
    expect(detail?.draftVersion?.status).toBe('draft');
  });

  it('updates metadata via PUT /api/admin/legal/:slug', async () => {
    const app = createApp();

    const created = await request(app)
      .post('/api/admin/legal')
      .send({ title: 'Privacy', slug: 'privacy-policy' });

    expect(created.status).toBe(201);
    const slug = created.body.document.slug;

    const update = await request(app)
      .put(`/api/admin/legal/${slug}`)
      .send({ contactEmail: 'privacy@fixnado.test', contactUrl: 'https://fixnado.test/privacy' });

    expect(update.status).toBe(200);
    expect(update.body.document.contactEmail).toBe('privacy@fixnado.test');
    expect(update.body.document.contactUrl).toBe('https://fixnado.test/privacy');
  });

  it('prevents deleting a published document', async () => {
    const app = createApp();

    const created = await request(app)
      .post('/api/admin/legal')
      .send({ title: 'Cookies', slug: 'cookies-policy' });

    const slug = created.body.document.slug;
    const detail = await getLegalDocumentDetail(slug);
    await publishLegalDocumentVersion({
      slug,
      versionId: detail.draftVersion.id,
      effectiveAt: new Date('2024-04-01T09:00:00Z').toISOString(),
      actor: 'admin@example.com'
    });

    const deletion = await request(app).delete(`/api/admin/legal/${slug}`);

    expect(deletion.status).toBe(409);
    expect(deletion.body.message).toBe('Cannot delete published document');
  });
});
