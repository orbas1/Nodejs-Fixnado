import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const {
  sequelize,
  Region,
  ServiceZone,
  Service
} = await import('../src/models/index.js');

const {
  listProviders,
  createProvider,
  getProvider,
  updateProvider,
  archiveProvider,
  upsertProviderContact,
  deleteProviderContact,
  upsertProviderCoverage,
  deleteProviderCoverage
} = await import('../src/services/adminProviderService.js');

function polygon() {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-0.2, 51.45],
        [-0.1, 51.45],
        [-0.1, 51.5],
        [-0.2, 51.5],
        [-0.2, 51.45]
      ]
    ]
  };
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

describe('adminProviderService', () => {
  it('creates, lists, updates, and manages provider contacts and coverage', async () => {
    const region = await Region.create({ code: 'LDN', name: 'London', residencyTier: 'standard' });

    const created = await createProvider({
      owner: {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan.miles@example.com',
        temporaryPassword: 'TempPassword1234',
        phone: '+442079460001',
        regionId: region.id
      },
      company: {
        legalStructure: 'Ltd',
        regionId: region.id,
        serviceRegions: 'London, South East'
      },
      profile: {
        displayName: 'Metro Power Services',
        tradingName: 'Metro Power',
        status: 'onboarding',
        onboardingStage: 'documents',
        tier: 'preferred',
        riskRating: 'medium',
        supportEmail: 'support@metro-power.test'
      }
    });

    const companyId = created.company.id;

    const zone = await ServiceZone.create({
      companyId,
      name: 'Central District',
      boundary: polygon(),
      centroid: { type: 'Point', coordinates: [-0.15, 51.475] },
      boundingBox: polygon(),
      metadata: {},
      demandLevel: 'high'
    });

    await Service.create({
      companyId,
      providerId: null,
      title: 'Electrical maintenance',
      description: '24/7 on-call service',
      category: 'Facilities',
      price: 480,
      currency: 'GBP'
    });

    const directory = await listProviders();
    expect(directory.summary.total).toBe(1);
    expect(directory.providers[0].displayName).toBe('Metro Power Services');
    expect(directory.providers[0].status).toBe('onboarding');

    const detail = await getProvider(companyId);
    expect(detail.profile.displayName).toBe('Metro Power Services');
    expect(detail.company.region?.id).toBe(region.id);
    expect(detail.services).toHaveLength(1);

    const updated = await updateProvider(companyId, {
      profile: { status: 'active', onboardingStage: 'live', tier: 'strategic' },
      company: { verified: true, complianceScore: 92.5 }
    });
    expect(updated.profile.status).toBe('active');
    expect(updated.company.verified).toBe(true);
    expect(updated.company.complianceScore).toBeCloseTo(92.5);

    const contact = await upsertProviderContact(companyId, null, {
      name: 'Amelia Roberts',
      email: 'amelia.roberts@example.com',
      type: 'operations',
      isPrimary: false
    });
    expect(contact.name).toBe('Amelia Roberts');
    expect(contact.isPrimary).toBe(false);

    const primaryContact = await upsertProviderContact(companyId, contact.id, {
      name: 'Amelia Roberts',
      isPrimary: true
    });
    expect(primaryContact.isPrimary).toBe(true);

    await deleteProviderContact(companyId, contact.id);
    const afterContactRemoval = await getProvider(companyId);
    expect(afterContactRemoval.contacts.some((item) => item.id === contact.id)).toBe(false);

    const coverage = await upsertProviderCoverage(companyId, null, {
      zoneId: zone.id,
      coverageType: 'primary',
      slaMinutes: 180,
      maxCapacity: 6,
      notes: 'Supports emergency call-outs'
    });
    expect(coverage.zoneId).toBe(zone.id);
    expect(coverage.slaMinutes).toBe(180);

    const coverageUpdate = await upsertProviderCoverage(companyId, coverage.id, {
      maxCapacity: 12,
      coverageType: 'secondary'
    });
    expect(coverageUpdate.maxCapacity).toBe(12);
    expect(coverageUpdate.coverageType).toBe('secondary');

    await deleteProviderCoverage(companyId, coverage.id);
    const afterCoverageRemoval = await getProvider(companyId);
    expect(afterCoverageRemoval.coverage).toHaveLength(0);

    const archived = await archiveProvider(companyId, {
      reason: 'Merged with Metro Power Holdings',
      actor: 'ops@fixnado.test'
    });
    expect(archived.profile.status).toBe('archived');
    expect(archived.profile.operationsNotes).toContain('Merged with Metro Power Holdings');
    expect(archived.company.verified).toBe(false);
    expect(archived.company.insuredSellerBadgeVisible).toBe(false);
  });
});
