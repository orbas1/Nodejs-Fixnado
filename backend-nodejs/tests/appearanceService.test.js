import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { sequelize, AppearanceAsset, AppearanceVariant } = await import('../src/models/index.js');
const {
  listAppearanceProfiles,
  getAppearanceProfileById,
  saveAppearanceProfile,
  archiveAppearanceProfile
} = await import('../src/services/appearanceService.js');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('appearanceService', () => {
  it('creates and sanitises appearance payloads end-to-end', async () => {
    const created = await saveAppearanceProfile({
      payload: {
        name: 'Operator Suite',
        slug: 'Operator Suite',
        description: 'Primary theming used by the operations control centre.',
        allowedRoles: ['Admin', 'provider', 'invalid-role'],
        colorPalette: {
          primary: '#112233',
          accent: '#ddeeff',
          text: '  '
        },
        governance: {
          lastReviewedBy: '  Alice Ops  ',
          lastReviewedAt: '2024-03-01T12:00:00Z',
          notes: 'Refresh hero imagery quarterly'
        },
        assets: [
          {
            assetType: 'pattern',
            label: 'Background grid',
            url: 'https://cdn.fixnado.test/background.png',
            sortOrder: 0
          },
          {
            assetType: 'logo',
            label: '  Primary logo  ',
            description: 'Used on the admin masthead',
            url: ' https://cdn.fixnado.test/logo.svg ',
            altText: 'Fixnado admin logo',
            metadata: { usage: 'masthead' },
            sortOrder: 2
          },
          {
            assetType: 'logo',
            label: '',
            url: ''
          }
        ],
        variants: [
          {
            name: 'Hero Variation A',
            headline: 'Accelerate every fix order',
            publishState: 'LIVE',
            marketingCopy: {
              audience: 'Ops leads',
              keywords: ['operations, dispatch']
            }
          },
          {
            name: 'Hero Variation B',
            variantKey: '  custom-key  ',
            publishState: 'review',
            marketingCopy: {
              keywords: ['beta']
            },
            sortOrder: 5
          },
          {
            name: '',
            publishState: 'live'
          }
        ]
      },
      actorId: 'appearance-admin'
    });

    expect(created.name).toBe('Operator Suite');
    expect(created.slug).toBe('operator-suite');
    expect(created.allowedRoles).toEqual(['admin', 'provider']);
    expect(created.colorPalette.primary).toBe('#112233');
    expect(created.colorPalette.text).toBe('#111827');

    expect(created.governance.lastReviewedBy).toBe('Alice Ops');
    expect(created.governance.lastReviewedAt).toBe('2024-03-01T12:00:00.000Z');

    expect(created.assets).toHaveLength(2);
    expect(created.assets[0]).toMatchObject({
      assetType: 'pattern',
      label: 'Background grid',
      sortOrder: 0
    });
    expect(created.assets[1]).toMatchObject({
      assetType: 'logo',
      label: 'Primary logo',
      sortOrder: 2,
      url: 'https://cdn.fixnado.test/logo.svg'
    });

    expect(created.variants).toHaveLength(2);
    expect(created.variants[0]).toMatchObject({
      name: 'Hero Variation A',
      variantKey: 'hero-variation-a',
      publishState: 'live'
    });
    expect(created.variants[0].marketingCopy.keywords).toEqual(['operations', 'dispatch']);
    expect(created.variants[1]).toMatchObject({
      name: 'Hero Variation B',
      variantKey: 'custom-key',
      publishState: 'review',
      sortOrder: 5
    });
  });

  it('keeps slugs unique and default profile exclusive', async () => {
    const first = await saveAppearanceProfile({
      payload: {
        name: 'Primary Theme',
        isDefault: true
      },
      actorId: 'appearance-admin'
    });

    const duplicateSlug = await saveAppearanceProfile({
      payload: {
        name: 'Primary Theme',
        slug: 'Primary Theme'
      },
      actorId: 'appearance-admin'
    });

    expect(duplicateSlug.slug).toBe('primary-theme-2');

    const secondDefault = await saveAppearanceProfile({
      payload: {
        name: 'Enterprise Theme',
        isDefault: true
      },
      actorId: 'appearance-admin'
    });

    const reloadedFirst = await getAppearanceProfileById(first.id);
    const reloadedSecond = await getAppearanceProfileById(secondDefault.id);

    expect(reloadedFirst.isDefault).toBe(false);
    expect(reloadedSecond.isDefault).toBe(true);
  });

  it('archives profiles and cascades to assets and variants', async () => {
    const profile = await saveAppearanceProfile({
      payload: {
        name: 'Archive Theme',
        assets: [
          { assetType: 'logo', label: 'Archive logo', url: 'https://cdn.fixnado.test/archive.svg' }
        ],
        variants: [
          { name: 'Archive variant', publishState: 'review' }
        ]
      },
      actorId: 'appearance-admin'
    });

    const archived = await archiveAppearanceProfile({ id: profile.id, actorId: 'appearance-admin' });

    expect(archived.archivedAt).toBeTruthy();

    await expect(getAppearanceProfileById(profile.id)).rejects.toMatchObject({ statusCode: 404 });

    const storedAssets = await AppearanceAsset.findAll({ where: { profileId: profile.id } });
    expect(storedAssets).toHaveLength(1);
    expect(storedAssets[0].archivedAt).toBeTruthy();

    const storedVariants = await AppearanceVariant.findAll({ where: { profileId: profile.id } });
    expect(storedVariants).toHaveLength(1);
    expect(storedVariants[0].archivedAt).toBeTruthy();

    const remaining = await listAppearanceProfiles();
    expect(remaining).toHaveLength(0);
  });
});
