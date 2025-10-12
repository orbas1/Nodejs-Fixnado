import request from 'supertest';
import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, User, Company, AnalyticsEvent } = await import('../src/models/index.js');

describe('communications API', () => {
  beforeAll(async () => {
    process.env.AGORA_APP_ID = 'test-app-id';
    process.env.AGORA_APP_CERTIFICATE = 'test-app-cert';
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    vi.useRealTimers();
    try {
      await sequelize.close();
    } catch (error) {
      // ignore double close when watch mode restarts tests
    }
  });

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-10T22:15:00Z'));
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createActors() {
    const customer = await User.create({
      firstName: 'Amelia',
      lastName: 'Burns',
      email: `amelia-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'user'
    });

    const providerUser = await User.create({
      firstName: 'Liam',
      lastName: 'Patel',
      email: `liam-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    const company = await Company.create({
      userId: providerUser.id,
      legalStructure: 'Ltd',
      contactName: 'Liam Patel',
      contactEmail: providerUser.email,
      serviceRegions: 'London',
      marketplaceIntent: 'services'
    });

    return { customer, providerUser, company };
  }

  it('creates a conversation, delivers messages with quiet hours, and generates AI assistance', async () => {
    const { customer, providerUser } = await createActors();

    const createResponse = await request(app)
      .post('/api/communications')
      .send({
        subject: 'Emergency boiler restart',
        createdBy: {
          id: customer.id,
          type: 'user'
        },
        participants: [
          {
            participantType: 'user',
            participantReferenceId: customer.id,
            displayName: 'Amelia Burns',
            role: 'customer',
            timezone: 'Europe/London'
          },
          {
            participantType: 'serviceman',
            participantReferenceId: providerUser.id,
            displayName: 'Liam Patel',
            role: 'provider',
            timezone: 'Europe/London',
            quietHoursStart: '21:00',
            quietHoursEnd: '06:30'
          }
        ],
        metadata: {
          bookingId: 'booking-123',
          priority: 'critical'
        },
        aiAssist: {
          defaultEnabled: true
        }
      })
      .expect(201);

    expect(createResponse.body.id).toBeTruthy();
    expect(createResponse.body.participants).toHaveLength(3);
    const customerParticipant = createResponse.body.participants.find((item) => item.participantType === 'user');
    const providerParticipant = createResponse.body.participants.find((item) => item.participantType === 'serviceman');
    const aiParticipant = createResponse.body.participants.find((item) => item.role === 'ai_assistant');

    expect(customerParticipant).toBeTruthy();
    expect(providerParticipant).toBeTruthy();
    expect(aiParticipant).toBeTruthy();

    const messageResponse = await request(app)
      .post(`/api/communications/${createResponse.body.id}/messages`)
      .send({
        senderParticipantId: customerParticipant.id,
        body: 'Can you share an updated quote and join an Agora call tonight? I need confirmation for compliance.',
        requestAiAssist: true
      })
      .expect(201);

    expect(messageResponse.body).toHaveLength(2);
    const humanMessage = messageResponse.body.find((item) => item.messageType === 'user');
    const assistantMessage = messageResponse.body.find((item) => item.messageType === 'assistant');

    expect(humanMessage.deliveries).toBeDefined();
    const providerDelivery = humanMessage.deliveries.find((delivery) => delivery.participantId === providerParticipant.id);
    expect(providerDelivery?.status).toBe('suppressed');
    expect(providerDelivery?.suppressedReason).toBe('quiet_hours');

    expect(assistantMessage).toBeTruthy();
    expect(assistantMessage.aiAssistUsed).toBe(true);
    expect(assistantMessage.metadata.provider).toBeDefined();

    const listResponse = await request(app)
      .get('/api/communications')
      .query({ participantId: providerParticipant.id })
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].metadata.bookingId).toBe('booking-123');

    const events = await AnalyticsEvent.findAll({ where: { domain: 'communications' }, order: [['occurred_at', 'ASC']] });
    const messageEvents = events.filter((event) => event.eventName === 'communications.message.sent');
    expect(messageEvents).toHaveLength(2);
    const suppressedEvents = events.filter((event) => event.eventName === 'communications.delivery.suppressed');
    expect(suppressedEvents.some((event) => event.metadata.reason === 'quiet_hours')).toBe(true);
  });

  it('updates participant preferences and issues Agora session tokens', async () => {
    const { customer, providerUser } = await createActors();

    const createResponse = await request(app)
      .post('/api/communications')
      .send({
        subject: 'Rental inspection follow-up',
        createdBy: { id: customer.id, type: 'user' },
        participants: [
          {
            participantType: 'user',
            participantReferenceId: customer.id,
            displayName: 'Amelia Burns',
            role: 'customer',
            timezone: 'Europe/London'
          },
          {
            participantType: 'serviceman',
            participantReferenceId: providerUser.id,
            displayName: 'Liam Patel',
            role: 'provider',
            timezone: 'Europe/London'
          }
        ],
        aiAssist: {
          defaultEnabled: true
        }
      })
      .expect(201);

    const providerParticipant = createResponse.body.participants.find((item) => item.participantType === 'serviceman');

    const patchResponse = await request(app)
      .patch(`/api/communications/${createResponse.body.id}/participants/${providerParticipant.id}`)
      .send({
        notificationsEnabled: false,
        quietHoursStart: '19:00',
        quietHoursEnd: '07:00',
        metadata: { quietHoursOverride: true }
      })
      .expect(200);

    expect(patchResponse.body.notificationsEnabled).toBe(false);
    expect(patchResponse.body.quietHoursStart).toBe('19:00');
    expect(patchResponse.body.metadata.quietHoursOverride).toBe(true);

    const sessionResponse = await request(app)
      .post(`/api/communications/${createResponse.body.id}/video-session`)
      .send({ participantId: providerParticipant.id })
      .expect(201);

    expect(sessionResponse.body.token).toBeTruthy();
    expect(sessionResponse.body.channelName).toContain('conversation_');
    expect(sessionResponse.body.appId).toBe('test-app-id');
  });
});
