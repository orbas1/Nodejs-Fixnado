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

  it('exposes acknowledgement, audience, and health metadata on published documents', async () => {
    const created = await createLegalDocument({
      payload: {
        title: 'Community Guidelines',
        slug: 'community-guidelines',
        summary: 'Rules for respectful participation.',
        acknowledgement: {
          required: true,
          frequency: 'Annual attestation',
          channel: 'Compliance LMS',
          dueWithinHours: 72,
          reminderCadence: 'Weekly until completed',
          evidencePath: 's3://compliance-artifacts/guidelines/attestations/'
        },
        audience: [
          { id: 'providers', label: 'Providers', description: 'Business accounts publishing listings', mandatory: true },
          'Servicemen'
        ],
        governance: {
          policyStore: 'https://governance.fixnado.com/policies/community-guidelines.pdf',
          nextReviewDue: '2024-12-01',
          reviewOwners: ['Legal Operations', { label: 'Trust & Safety Board', mandatory: true }],
          escalationContacts: [
            {
              id: 'incident-response',
              label: 'Incident response duty officer',
              description: 'Escalate critical moderation issues'
            }
          ],
          auditTrail: [
            {
              id: 'moderation-fire-drill',
              label: 'Moderation fire drill playback',
              url: 'https://governance.fixnado.com/audits/moderation-fire-drill',
              capturedAt: '2024-04-12T09:00:00Z'
            }
          ]
        },
        tags: ['community', 'moderation', 'trust-safety'],
        sections: [
          {
            id: 'conduct',
            title: 'Professional conduct',
            body: [
              'Treat all clients, crew members, and partners with courtesy. Abusive behaviour results in suspension.',
              'Publish accurate availability, qualifications, and pricing. Misrepresentation is grounds for removal.'
            ]
          }
        ]
      },
      actor: 'compliance.manager@fixnado.test'
    });

    const draft = created.draftVersion;
    expect(draft.content.metadata.audience).toHaveLength(2);
    expect(draft.content.metadata.acknowledgement.required).toBe(true);
    expect(draft.content.metadata.tags).toEqual(['community', 'moderation', 'trust-safety']);

    await publishLegalDocumentVersion({
      slug: created.slug,
      versionId: draft.id,
      effectiveAt: '2024-05-30T10:00:00Z',
      actor: 'compliance.director@fixnado.test'
    });

    const detail = await getLegalDocumentDetail(created.slug);
    expect(detail.statusLabel).toBe('Published v1');
    expect(detail.health.lastPublished).toBe('2024-05-30T10:00:00.000Z');
    expect(detail.acknowledgement).toMatchObject({ required: true, channel: 'Compliance LMS' });
    expect(detail.audience.map((entry) => entry.id)).toEqual(['providers', 'servicemen']);
    expect(detail.metadata.tags).toEqual(['community', 'moderation', 'trust-safety']);
  });
});
