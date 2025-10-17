import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sequelize from '../../config/database.js';
import { Company, ProviderWebsitePreference, User } from '../../models/index.js';
import {
  getProviderWebsitePreferences,
  updateProviderWebsitePreferences
} from '../providerWebsitePreferencesService.js';

async function createTestUser(overrides = {}) {
  const timestamp = Date.now();
  return User.create(
    {
      firstName: overrides.firstName ?? 'Provider',
      lastName: overrides.lastName ?? 'Owner',
      email: overrides.email ?? `provider-${timestamp}-${Math.round(Math.random() * 10000)}@example.com`,
      passwordHash: overrides.passwordHash ?? 'hashed-password',
      type: overrides.type ?? 'company',
      ...overrides
    },
    { validate: false }
  );
}

async function createTestCompany(owner, overrides = {}) {
  return Company.create({
    userId: owner.id,
    legalStructure: overrides.legalStructure ?? 'llc',
    contactName: overrides.contactName ?? 'Metro Power Services',
    contactEmail:
      overrides.contactEmail ?? `metro-${Date.now()}-${Math.round(Math.random() * 10000)}@example.com`,
    contactPhone: overrides.contactPhone ?? '+44 20 7946 0000',
    serviceRegions: overrides.serviceRegions ?? 'London, Essex',
    marketplaceIntent: overrides.marketplaceIntent ?? 'enterprise',
    verified: overrides.verified ?? true,
    complianceScore: overrides.complianceScore ?? 96.4,
    ...overrides
  });
}

describe('providerWebsitePreferencesService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await ProviderWebsitePreference.destroy({ where: {} });
    await Company.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('returns sensible defaults when no preferences stored', async () => {
    const owner = await createTestUser();
    const company = await createTestCompany(owner);

    const preferences = await getProviderWebsitePreferences({
      companyId: company.id,
      actor: { id: owner.id }
    });

    expect(preferences.slug).toMatch(/metro-power/);
    expect(preferences.previewUrl).toMatch(preferences.slug);
    expect(preferences.hero.heading).toContain('Showcase');
    expect(preferences.branding.theme).toBe('light');
    expect(preferences.support.email).toEqual(company.contactEmail);
    expect(preferences.modules.showProjects).toBe(true);
    expect(preferences.socialLinks).toEqual([]);
  });

  it('creates and updates preferences with normalised values', async () => {
    const owner = await createTestUser();
    const company = await createTestCompany(owner, { contactName: 'Metro Engineering Guild' });

    const payload = {
      slug: 'Metro Engineering HQ ',
      customDomain: ' https://metro-engineering.example ',
      hero: {
        heading: 'Metro Engineering hero copy',
        primaryCta: { label: 'Talk to us', url: 'metro-engineering.example/contact' },
        secondaryCta: { label: 'Download capability deck', url: '/downloads/metro.pdf', behaviour: 'download' },
        highlights: ['Critical response', 'Telemetry enabled']
      },
      branding: {
        theme: 'dark',
        brandColor: '#1e293b',
        accentColor: '#38bdf8',
        backgroundColor: '#020617',
        textTone: 'light'
      },
      media: {
        logoUrl: 'https://cdn.fixnado.example/metro/logo.svg',
        heroImageUrl: 'https://cdn.fixnado.example/metro/hero.jpg',
        gallery: [
          { title: 'Tier 3 data hall retrofit', imageUrl: 'https://cdn.fixnado.example/metro/project-1.jpg' },
          { imageUrl: '' }
        ]
      },
      support: {
        email: 'support@metro-engineering.example',
        phone: '+44 20 8123 4500',
        hours: 'Mon-Fri, 07:00-19:00',
        channels: [
          { type: 'phone', destination: '+44 20 8123 4500', label: 'Operations desk' },
          { type: 'chat', destination: '', label: 'Broken' }
        ]
      },
      seo: {
        title: 'Metro Engineering • Enterprise retrofits',
        description: 'Escrow-backed retrofits with telemetry and compliance automation.',
        keywords: 'retrofit, telemetry, engineering'
      },
      socialLinks: [
        { label: 'LinkedIn', url: 'linkedin.com/company/metro-engineering' },
        { label: 'Docs', url: '' }
      ],
      trust: {
        badges: [{ label: 'ISO 27001', iconUrl: 'https://cdn.fixnado.example/badges/iso27001.svg' }],
        testimonials: [{ quote: 'Metro are best-in-class', author: 'Facilities Director' }],
        metrics: [{ label: 'Escrow programmes delivered', value: '164', format: 'number' }]
      },
      modules: {
        enableLiveChat: true,
        showCertifications: false
      },
      featuredProjects: [
        {
          title: 'Canary Wharf telemetry upgrade',
          summary: 'Zero downtime retrofit with IoT sensor mesh.',
          imageUrl: 'https://cdn.fixnado.example/metro/project-2.jpg',
          ctaUrl: 'https://metro-engineering.example/case-studies/canary-wharf'
        }
      ],
      metadata: {
        notes: 'Published for Q1 campaigns',
        lastPublishedAt: '2024-09-01T10:30:00Z'
      }
    };

    const updated = await updateProviderWebsitePreferences({
      companyId: company.id,
      actor: { id: owner.id },
      payload
    });

    expect(updated.slug).toBe('metro-engineering-hq');
    expect(updated.customDomain).toBe('metro-engineering.example');
    expect(updated.previewUrl).toBe('https://metro-engineering.example');
    expect(updated.hero.primaryCta.url).toBe('https://metro-engineering.example/contact');
    expect(updated.hero.secondaryCta.url).toBe('/downloads/metro.pdf');
    expect(updated.branding.theme).toBe('dark');
    expect(updated.media.gallery).toHaveLength(1);
    expect(updated.socialLinks).toHaveLength(1);
    expect(updated.trust.badges[0].label).toBe('ISO 27001');
    expect(updated.modules.enableLiveChat).toBe(true);
    expect(updated.modules.showCertifications).toBe(false);
    expect(updated.featuredProjects[0].title).toBe('Canary Wharf telemetry upgrade');
    expect(updated.metadata.notes).toBe('Published for Q1 campaigns');
    expect(updated.metadata.updatedBy).toBe(owner.email);

    const fetched = await getProviderWebsitePreferences({
      companyId: company.id,
      actor: { id: owner.id }
    });

    expect(fetched.slug).toBe(updated.slug);
    expect(fetched.support.channels).toHaveLength(1);
    expect(fetched.support.channels[0].type).toBe('phone');
    expect(fetched.socialLinks[0].url).toBe('https://linkedin.com/company/metro-engineering');
  });
});
