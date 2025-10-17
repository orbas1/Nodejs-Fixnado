import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  ServicemanProfile,
  ServicemanShiftRule,
  ServicemanCertification,
  ServicemanEquipmentItem
} = await import('../src/models/index.js');

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Serviceman control centre routes', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  async function createServiceman() {
    const user = await User.create({
      firstName: 'Jordan',
      lastName: 'Miles',
      email: 'jordan@example.com',
      passwordHash: 'hashed-password',
      type: 'servicemen'
    });
    return { user, token: createToken(user.id) };
  }

  it('returns overview for authenticated servicemen and seeds defaults', async () => {
    const { token, user } = await createServiceman();

    const response = await request(app)
      .get('/api/serviceman/control-centre/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      profile: {
        userId: user.id,
        status: 'active',
        travelBufferMinutes: 30,
        autoAcceptAssignments: true
      },
      availability: [],
      certifications: [],
      equipment: [],
      permissions: expect.objectContaining({ canEditProfile: true })
    });

    const storedProfile = await ServicemanProfile.findOne({ where: { userId: user.id } });
    expect(storedProfile).not.toBeNull();
  });

  it('updates profile preferences and persists values', async () => {
    const { token, user } = await createServiceman();

    const response = await request(app)
      .put('/api/serviceman/control-centre/overview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profile: {
          displayName: 'Jordan Miles',
          status: 'standby',
          travelBufferMinutes: 45,
          coverageRadiusKm: 75,
          autoAcceptAssignments: false,
          allowAfterHours: true,
          notifyOpsTeam: false,
          primaryRegion: 'Metro North'
        }
      })
      .expect(200);

    expect(response.body.profile).toMatchObject({
      displayName: 'Jordan Miles',
      status: 'standby',
      travelBufferMinutes: 45,
      coverageRadiusKm: 75,
      autoAcceptAssignments: false,
      allowAfterHours: true,
      notifyOpsTeam: false,
      primaryRegion: 'Metro North'
    });

    const stored = await ServicemanProfile.findOne({ where: { userId: user.id } });
    expect(stored.travelBufferMinutes).toBe(45);
    expect(stored.autoAcceptAssignments).toBe(false);
    expect(stored.allowAfterHours).toBe(true);
  });

  it('manages availability rules end-to-end', async () => {
    const { token, user } = await createServiceman();

    const createResponse = await request(app)
      .post('/api/serviceman/control-centre/overview/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '16:30',
        status: 'available',
        locationLabel: 'Metro North'
      })
      .expect(201);

    const ruleId = createResponse.body.availability.id;
    expect(ruleId).toBeTruthy();

    const updateResponse = await request(app)
      .put(`/api/serviceman/control-centre/overview/availability/${ruleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ endTime: '17:15', status: 'standby' })
      .expect(200);

    expect(updateResponse.body.availability).toMatchObject({
      status: 'standby',
      endTime: '17:15'
    });

    await request(app)
      .delete(`/api/serviceman/control-centre/overview/availability/${ruleId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const profile = await ServicemanProfile.findOne({ where: { userId: user.id } });
    const remaining = await ServicemanShiftRule.count({ where: { profileId: profile.id } });
    expect(remaining).toBe(0);
  });

  it('manages certifications CRUD lifecycle', async () => {
    const { token } = await createServiceman();

    const createResponse = await request(app)
      .post('/api/serviceman/control-centre/overview/certifications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'IOSH Safety Passport',
        issuer: 'IOSH',
        credentialId: 'IOSH-2211',
        issuedOn: '2024-01-12',
        expiresOn: '2026-01-11'
      })
      .expect(201);

    const certificationId = createResponse.body.certification.id;

    const updateResponse = await request(app)
      .put(`/api/serviceman/control-centre/overview/certifications/${certificationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ issuer: 'IOSH UK', attachmentUrl: 'https://example.com/certs/iosh.pdf' })
      .expect(200);

    expect(updateResponse.body.certification).toMatchObject({ issuer: 'IOSH UK', attachmentUrl: 'https://example.com/certs/iosh.pdf' });

    await request(app)
      .delete(`/api/serviceman/control-centre/overview/certifications/${certificationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await ServicemanCertification.count()).toBe(0);
  });

  it('manages equipment inventory records', async () => {
    const { token } = await createServiceman();

    const createResponse = await request(app)
      .post('/api/serviceman/control-centre/overview/equipment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Thermal imaging camera',
        serialNumber: 'TIC-8891',
        status: 'ready',
        maintenanceDueOn: '2025-07-01'
      })
      .expect(201);

    const itemId = createResponse.body.equipment.id;

    const updateResponse = await request(app)
      .put(`/api/serviceman/control-centre/overview/equipment/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'maintenance', notes: 'Calibration scheduled' })
      .expect(200);

    expect(updateResponse.body.equipment).toMatchObject({ status: 'maintenance', notes: 'Calibration scheduled' });

    await request(app)
      .delete(`/api/serviceman/control-centre/overview/equipment/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await ServicemanEquipmentItem.count()).toBe(0);
  });

  it('rejects access for non-servicemen users', async () => {
    const user = await User.create({
      firstName: 'Avery',
      lastName: 'Stone',
      email: 'avery@example.com',
      passwordHash: 'hashed-password',
      type: 'user'
    });

    await request(app)
      .get('/api/serviceman/control-centre/overview')
      .set('Authorization', `Bearer ${createToken(user.id)}`)
      .expect(403);
  });
});
