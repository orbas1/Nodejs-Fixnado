import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  UserSession,
  ServicemanProfileSetting
} = await import('../src/models/index.js');

async function createServicemanToken(user) {
  const session = await UserSession.create({
    userId: user.id,
    refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    sessionFingerprint: crypto.randomBytes(16).toString('hex'),
    clientType: 'web',
    clientVersion: 'vitest',
    deviceLabel: 'vitest-suite',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: { persona: 'serviceman' },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date()
  });

  const token = jwt.sign(
    {
      sub: user.id,
      sid: session.id,
      role: 'serviceman',
      persona: 'serviceman'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h', audience: 'fixnado:web', issuer: 'fixnado-api' }
  );

  return { token, session };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Serviceman profile settings API', () => {
  it('returns default settings for a serviceman profile', async () => {
    const serviceman = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan@example.com',
        passwordHash: 'hash',
        type: 'serviceman'
      },
      { validate: false }
    );

    const { token } = await createServicemanToken(serviceman);

    const response = await request(app)
      .get('/api/servicemen/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    const { data } = response.body;
    expect(data.profile.firstName).toBe('Jordan');
    expect(data.workPreferences.maxJobsPerDay).toBe(5);
    expect(Array.isArray(data.skills.specialties)).toBe(true);

    const stored = await ServicemanProfileSetting.findOne({ where: { userId: serviceman.id } });
    expect(stored).not.toBeNull();
    expect(stored.maxJobsPerDay).toBe(5);
  });

  it('persists profile, contact, work, skills, availability, equipment, and documents', async () => {
    const serviceman = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan@fixnado.dev',
        passwordHash: 'hash',
        type: 'serviceman'
      },
      { validate: false }
    );

    const { token } = await createServicemanToken(serviceman);

    const payload = {
      profile: {
        firstName: 'Avery',
        lastName: 'Stone',
        preferredName: 'Ave',
        title: 'Lead Technician',
        badgeId: 'SRV-2210',
        region: 'Metro North',
        summary: 'Lead tech for rapid response',
        bio: 'Oversees HVAC, access control, and decontamination crews.',
        email: 'avery.stone@fixnado.dev',
        timezone: 'Europe/London',
        language: 'en-GB'
      },
      contact: {
        phoneNumber: '+44 7700 900234',
        email: 'avery.stone@fixnado.dev',
        emergencyContacts: [
          { id: 'contact-primary', name: 'Eden Clarke', relationship: 'Crew partner', phoneNumber: '+44 7700 900678' }
        ]
      },
      work: {
        preferredShiftStart: '07:30',
        preferredShiftEnd: '17:30',
        maxJobsPerDay: 6,
        travelRadiusKm: 40,
        crewLeadEligible: true,
        mentorEligible: true,
        remoteSupport: true
      },
      skills: {
        specialties: ['Emergency HVAC', 'Hospital compliance'],
        certifications: [
          {
            id: 'cert-ipaf',
            name: 'IPAF Mobile Elevating Work Platform',
            issuer: 'IPAF',
            issuedOn: '2024-02-12',
            expiresOn: '2026-02-11',
            credentialUrl: 'https://certificates.ipaf.org/verify/ipaf-12345'
          }
        ]
      },
      availability: {
        template: {
          monday: { available: true, start: '07:30', end: '17:30' },
          tuesday: { available: true, start: '07:30', end: '17:30' },
          wednesday: { available: true, start: '08:00', end: '18:00' },
          thursday: { available: true, start: '08:00', end: '18:00' },
          friday: { available: true, start: '07:30', end: '16:00' },
          saturday: { available: false, start: null, end: null },
          sunday: { available: false, start: null, end: null }
        }
      },
      equipment: [
        {
          id: 'equip-thermal-camera',
          name: 'Thermal Imaging Camera',
          status: 'In field',
          serialNumber: 'TIC-22-7711',
          assignedOn: '2024-01-05'
        }
      ],
      documents: [
        {
          id: 'doc-passport',
          name: 'Passport ID',
          type: 'Identity',
          url: 'https://files.fixnado.com/crew/jordan/passport.pdf',
          expiresOn: '2029-08-30'
        }
      ]
    };

    const response = await request(app)
      .put('/api/servicemen/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    const { data } = response.body;
    expect(data.profile.firstName).toBe('Avery');
    expect(data.contact.emergencyContacts).toHaveLength(1);
    expect(data.workPreferences.maxJobsPerDay).toBe(6);
    expect(data.skills.specialties).toContain('Emergency HVAC');
    expect(data.equipment).toHaveLength(1);
    expect(data.documents).toHaveLength(1);

    await serviceman.reload();
    expect(serviceman.firstName).toBe('Avery');
    expect(serviceman.email).toBe('avery.stone@fixnado.dev');

    const stored = await ServicemanProfileSetting.findOne({ where: { userId: serviceman.id } });
    expect(stored).not.toBeNull();
    expect(stored.maxJobsPerDay).toBe(6);
    expect(Array.isArray(stored.emergencyContacts)).toBe(true);
    expect(stored.specialties).toContain('Emergency HVAC');
    expect(stored.availabilityTemplate.monday.start).toBe('07:30');
  });

  it('returns validation errors for invalid updates', async () => {
    const serviceman = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan@fixnado.dev',
        passwordHash: 'hash',
        type: 'serviceman'
      },
      { validate: false }
    );

    const { token } = await createServicemanToken(serviceman);

    const result = await request(app)
      .put('/api/servicemen/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ profile: { email: 'not-an-email' } })
      .expect(422);

    expect(result.body).toHaveProperty('details');
    expect(result.body.details[0].field).toBe('profile.email');
    await serviceman.reload();
    expect(serviceman.email).toBe('jordan@fixnado.dev');
  });
});
