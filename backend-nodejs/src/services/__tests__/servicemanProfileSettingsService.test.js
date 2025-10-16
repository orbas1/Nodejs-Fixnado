import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import sequelize from '../../config/database.js';
import { ServicemanProfileSetting, User } from '../../models/index.js';
import {
  getServicemanProfileSettings,
  updateServicemanProfileSettings
} from '../servicemanProfileSettingsService.js';

async function createTestUser(overrides = {}) {
  const suffix = Math.round(Math.random() * 1e6);
  return User.create(
    {
      firstName: overrides.firstName ?? 'Crew',
      lastName: overrides.lastName ?? 'Member',
      email: overrides.email ?? `crew-${Date.now()}-${suffix}@example.com`,
      passwordHash: overrides.passwordHash ?? 'hashed-password',
      type: overrides.type ?? 'serviceman',
      ...overrides
    },
    { validate: false }
  );
}

describe('servicemanProfileSettingsService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('provisions default settings on first fetch', async () => {
    const user = await createTestUser({ firstName: 'Jordan', lastName: 'Shaw' });

    const snapshot = await getServicemanProfileSettings(user.id);

    expect(snapshot.profile).toMatchObject({
      firstName: 'Jordan',
      lastName: 'Shaw',
      preferredName: '',
      title: '',
      timezone: expect.any(String)
    });
    expect(snapshot.workPreferences).toMatchObject({
      maxJobsPerDay: 5,
      travelRadiusKm: 25
    });
    expect(snapshot.availability.template.monday).toMatchObject({
      available: true,
      start: '08:00',
      end: '17:00'
    });

    const stored = await ServicemanProfileSetting.findOne({ where: { userId: user.id } });
    expect(stored).not.toBeNull();
    expect(stored?.specialties).toEqual([]);
    expect(stored?.metadata).toEqual({});
  });

  it('updates nested sections and sanitises persisted data', async () => {
    const user = await createTestUser({
      firstName: 'Jamie',
      lastName: 'Taylor',
      email: 'crew.initial@example.com'
    });

    const payload = {
      profile: {
        firstName: '  Jamie  ',
        lastName: 'Taylor',
        preferredName: 'JT',
        title: ' Field Lead ',
        badgeId: ' B-0099 ',
        region: 'South London',
        summary: '  Lead installer for commercial HVAC ',
        bio: 'Focused on rapid diagnostics and safety leadership.',
        avatarUrl: 'https://cdn.fixnado.example/avatars/jt.png',
        timezone: 'Europe/London',
        language: 'en-GB',
        email: ' field.team+ops@example.com '
      },
      contact: {
        phoneNumber: ' +44 20 7946 0958 ',
        email: 'jt.primary@example.com',
        emergencyContacts: [
          {
            id: 'contact-1',
            name: '  Ops Manager  ',
            relationship: 'Supervisor',
            phoneNumber: '+44 20 7000 0000',
            email: 'manager@example.com'
          }
        ]
      },
      work: {
        preferredShiftStart: '07:30',
        preferredShiftEnd: '16:00',
        maxJobsPerDay: 6,
        travelRadiusKm: 45,
        crewLeadEligible: true,
        mentorEligible: 'true',
        remoteSupport: 'yes'
      },
      skills: {
        specialties: ['Heat pumps', '  Heat pumps  ', ''],
        certifications: [
          {
            id: 'cert-1',
            name: 'Gas Safe Technician',
            issuer: '  UK Gas Board  ',
            issuedOn: '2024-01-12',
            expiresOn: '2025-01-11',
            credentialUrl: 'https://certs.fixnado.example/gas-safe'
          },
          {
            name: '  ',
            issuer: 'Incomplete'
          }
        ]
      },
      availability: {
        template: {
          monday: { available: true, start: '07:30', end: '16:00' },
          sunday: { available: false }
        }
      },
      equipment: [
        {
          id: 'eq-1',
          name: 'iPad Mini',
          status: 'Assigned',
          serialNumber: 'IPAD-2210',
          assignedOn: '2024-02-01',
          notes: 'LTE enabled'
        }
      ],
      documents: [
        {
          id: 'doc-1',
          name: 'Liability Insurance',
          type: 'Insurance',
          url: 'https://docs.fixnado.example/liability.pdf',
          expiresOn: '2025-12-31',
          notes: 'Renew annually'
        }
      ]
    };

    const updated = await updateServicemanProfileSettings(user.id, payload, user.id);

    expect(updated.profile).toMatchObject({
      firstName: 'Jamie',
      preferredName: 'JT',
      title: 'Field Lead',
      badgeId: 'B-0099',
      email: 'field.team+ops@example.com'
    });
    expect(updated.contact.emergencyContacts).toHaveLength(1);
    expect(updated.skills.specialties).toEqual(['Heat pumps']);
    expect(updated.skills.certifications).toHaveLength(1);
    expect(updated.skills.certifications[0]).toMatchObject({
      id: 'cert-1',
      issuer: 'UK Gas Board'
    });
    expect(updated.availability.template.sunday.available).toBe(false);
    expect(updated.equipment[0]).toMatchObject({ name: 'iPad Mini', serialNumber: 'IPAD-2210' });
    expect(updated.metadata.lastUpdatedBy).toBe(user.id);

    const persistedUser = await User.findByPk(user.id);
    expect(persistedUser?.email).toBe('field.team+ops@example.com');

    const storedSettings = await ServicemanProfileSetting.findOne({ where: { userId: user.id } });
    expect(storedSettings?.specialties).toEqual(['Heat pumps']);
    expect(storedSettings?.equipment).toHaveLength(1);
    expect(storedSettings?.documents[0].name).toBe('Liability Insurance');
  });

  it('rejects invalid payloads with validation details', async () => {
    const user = await createTestUser();

    await expect(
      updateServicemanProfileSettings(user.id, {
        contact: {
          email: 'not-an-email',
          emergencyContacts: [
            { name: '', relationship: '', phoneNumber: '123', email: 'invalid' }
          ]
        }
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
      details: expect.any(Array)
    });
  });
});
