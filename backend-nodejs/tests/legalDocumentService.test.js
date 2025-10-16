import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { sequelize } = await import('../src/models/index.js');
const {
  createLegalDocument,
  updateLegalDocumentMetadata,
  publishLegalDocumentVersion,
  deleteLegalDocument,
  getLegalDocumentDetail
} = await import('../src/services/legalDocumentService.js');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('legalDocumentService', () => {
  it('generates unique slugs when duplicates are requested', async () => {
    const first = await createLegalDocument({
      payload: { title: 'Terms of Service', slug: 'terms' },
      actor: 'alice@example.com'
    });

    const second = await createLegalDocument({
      payload: { title: 'Terms of Service', slug: 'terms' },
      actor: 'bob@example.com'
    });

    expect(first.slug).toBe('terms');
    expect(second.slug).toBe('terms-2');
  });

  it('syncs metadata updates and preserves existing slug', async () => {
    const created = await createLegalDocument({
      payload: {
        title: 'Privacy Policy',
        slug: 'privacy',
        summary: 'Initial summary'
      },
      actor: 'writer@example.com'
    });

    const updated = await updateLegalDocumentMetadata({
      slug: created.slug,
      actor: 'reviewer@example.com',
      payload: {
        summary: 'Updated privacy overview',
        contactEmail: 'privacy@fixnado.test',
        contactPhone: '+441234567890',
        contactUrl: 'https://fixnado.test/legal/privacy',
        reviewCadence: 'Quarterly'
      }
    });

    expect(updated.slug).toBe('privacy');
    expect(updated.summary).toBe('Updated privacy overview');
    expect(updated.contactEmail).toBe('privacy@fixnado.test');
    expect(updated.contactPhone).toBe('+441234567890');
    expect(updated.contactUrl).toBe('https://fixnado.test/legal/privacy');
    expect(updated.reviewCadence).toBe('Quarterly');
  });

  it('blocks deletion when a published version exists', async () => {
    const created = await createLegalDocument({
      payload: { title: 'Cookie Policy', slug: 'cookies' },
      actor: 'legal@example.com'
    });

    const detail = await getLegalDocumentDetail(created.slug);
    expect(detail?.draftVersion).toBeTruthy();

    await publishLegalDocumentVersion({
      slug: created.slug,
      versionId: detail.draftVersion.id,
      effectiveAt: new Date('2024-03-01T10:00:00Z').toISOString(),
      actor: 'legal@example.com'
    });

    await expect(deleteLegalDocument({ slug: created.slug })).rejects.toThrow('Cannot delete published document');
  });
});
