import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  ServicemanMetricSetting,
  ServicemanMetricCard
} = await import('../src/models/index.js');

function withCrewAuth(builder) {
  return builder.set('x-fixnado-role', 'serviceman').set('x-fixnado-persona', 'serviceman');
}

describe('servicemanMetricsRoutes', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  beforeEach(async () => {
    await ServicemanMetricSetting.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true
    });
    await ServicemanMetricCard.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true
    });
  });

  it('requires authentication to access the configuration', async () => {
    const response = await request(app).get('/api/serviceman/metrics/config');
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/authorization/i);
  });

  it('returns the default snapshot for crew members', async () => {
    const response = await withCrewAuth(request(app).get('/api/serviceman/metrics/config'));

    expect(response.status).toBe(200);
    expect(response.body.data.settings.summary.highlightNotes).toEqual(['']);
    expect(Array.isArray(response.body.data.cards)).toBe(true);
  });

  it('allows crew leads to persist settings and manage cards', async () => {
    const settingsPayload = {
      summary: { ownerName: 'Dana Crew', highlightNotes: ['Keep backlog below 12'] },
      productivity: { targetBillableHours: 40 },
      quality: { targetSla: 96 },
      logistics: { travelBufferMinutes: 30 },
      training: { requiredModules: ['Safety induction'] },
      wellness: { wellbeingCheckCadence: 'Monthly' },
      operations: {
        crewLeaderboard: [
          { name: 'Jordan', completedJobs: 8, utilisation: 75, qualityScore: 98, rating: 4.5 }
        ],
        checklists: [{ label: 'Vehicle check', owner: 'Shift lead' }],
        automation: { autoAssignEnabled: true, escalateWhen: 'Backlog > 10', escalationChannel: '#crew-alerts' }
      }
    };

    const saveResponse = await withCrewAuth(
      request(app).put('/api/serviceman/metrics/settings').send(settingsPayload)
    );

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.data.settings.productivity.targetBillableHours).toBe(40);
    expect(saveResponse.body.data.settings.operations.crewLeaderboard).toHaveLength(1);

    const createCardResponse = await withCrewAuth(
      request(app)
        .post('/api/serviceman/metrics/cards')
        .send({ title: 'Travel buffer watch', tone: 'info', details: ['Monitor high-traffic zones'] })
    );

    expect(createCardResponse.status).toBe(201);
    const cardId = createCardResponse.body.data.id;
    expect(cardId).toBeTruthy();

    const updateResponse = await withCrewAuth(
      request(app)
        .patch(`/api/serviceman/metrics/cards/${cardId}`)
        .send({
          title: 'Travel buffer alerts',
          tone: 'success',
          details: ['Buffers within target'],
          displayOrder: 110,
          isActive: false
        })
    );

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.isActive).toBe(false);
    expect(updateResponse.body.data.displayOrder).toBe(110);

    const deleteResponse = await withCrewAuth(
      request(app).delete(`/api/serviceman/metrics/cards/${cardId}`)
    );

    expect(deleteResponse.status).toBe(204);
    const deleted = await ServicemanMetricCard.findByPk(cardId);
    expect(deleted).toBeNull();
  });

  it('surfaces validation errors for invalid card payloads', async () => {
    const response = await withCrewAuth(
      request(app)
        .post('/api/serviceman/metrics/cards')
        .send({ title: 'Invalid', tone: 'info', details: [] })
    );

    expect(response.status).toBe(422);
    expect(response.body.message).toMatch(/detail/i);
  });
});
