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
    } catch {
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

  it('manages inbox configuration settings, quick replies, and escalation rules', async () => {
    const settingsResponse = await request(app)
      .get('/api/communications/settings/inbox')
      .set('x-tenant-id', 'tenant-alpha')
      .expect(200);

    expect(settingsResponse.body.configuration.liveRoutingEnabled).toBe(true);
    expect(settingsResponse.body.entryPoints.length).toBeGreaterThanOrEqual(6);

    const firstEntry = settingsResponse.body.entryPoints[0];
    const updateResponse = await request(app)
      .put('/api/communications/settings/inbox')
      .set('x-tenant-id', 'tenant-alpha')
      .set('x-user-id', 'admin-user-1')
      .send({
        liveRoutingEnabled: false,
        defaultGreeting: 'Thanks for contacting the Fixnado team. We will respond shortly.',
        aiAssistDisplayName: 'Fixnado Copilot',
        aiAssistDescription: 'Guided replies and scheduling support for every chat.',
        quietHoursStart: '20:00',
        quietHoursEnd: '07:30'
      })
      .expect(200);

    expect(updateResponse.body.configuration.liveRoutingEnabled).toBe(false);
    expect(updateResponse.body.configuration.aiAssistDisplayName).toBe('Fixnado Copilot');

    const entryCreate = await request(app)
      .post('/api/communications/settings/inbox/entry-points')
      .set('x-tenant-id', 'tenant-alpha')
      .set('x-user-id', 'admin-user-1')
      .send({
        key: 'after-hours-support',
        label: 'After hours support',
        description: 'Route conversations to the evening responders.',
        icon: '🌙',
        defaultMessage: 'Thanks for reaching us overnight. Our on-call team will respond shortly.',
        enabled: true,
        displayOrder: 12
      })
      .expect(201);

    expect(entryCreate.body.key).toBe('after-hours-support');

    const entryUpdate = await request(app)
      .patch(`/api/communications/settings/inbox/entry-points/${firstEntry.id}`)
      .set('x-tenant-id', 'tenant-alpha')
      .set('x-user-id', 'admin-user-2')
      .send({
        label: 'Launch coordination',
        enabled: false,
        displayOrder: 4,
        ctaLabel: 'See launch playbook',
        ctaUrl: '/operations/launch',
        imageUrl: 'https://cdn.fixnado.com/inbox/launch.png'
      })
      .expect(200);

    expect(entryUpdate.body.label).toBe('Launch coordination');
    expect(entryUpdate.body.enabled).toBe(false);

    await request(app)
      .delete(`/api/communications/settings/inbox/entry-points/${entryCreate.body.id}`)
      .set('x-tenant-id', 'tenant-alpha')
      .expect(204);

    const quickReplyResponse = await request(app)
      .post('/api/communications/settings/inbox/quick-replies')
      .set('x-tenant-id', 'tenant-alpha')
      .set('x-user-id', 'support-user-1')
      .send({
        title: 'Standard acknowledgement',
        body: 'Thanks for getting in touch! We have received your note and will follow up in under 15 minutes.',
        allowedRoles: ['support', 'operations']
      })
      .expect(201);

    expect(quickReplyResponse.body.title).toBe('Standard acknowledgement');

    const quickReplyUpdate = await request(app)
      .patch(`/api/communications/settings/inbox/quick-replies/${quickReplyResponse.body.id}`)
      .set('x-tenant-id', 'tenant-alpha')
      .set('x-user-id', 'support-user-2')
      .send({
        body: 'Thank you for reaching out! An operations specialist will review and respond shortly.',
        sortOrder: 5
      })
      .expect(200);

    expect(quickReplyUpdate.body.sortOrder).toBe(5);
    expect(quickReplyUpdate.body.body).toContain('operations specialist');

    const escalationCreate = await request(app)
      .post('/api/communications/settings/inbox/escalations')
      .set('x-tenant-id', 'tenant-alpha')
      .set('x-user-id', 'ops-owner')
      .send({
        name: 'Ops email fallback',
        description: 'Escalate when no reply is sent within SLA.',
        triggerType: 'inactivity',
        triggerMetadata: { minutesWithoutReply: 20 },
        targetType: 'email',
        targetReference: 'ops-alerts@fixnado.com',
        slaMinutes: 20,
        allowedRoles: ['operations']
      })
      .expect(201);

    expect(escalationCreate.body.targetReference).toBe('ops-alerts@fixnado.com');

    const escalationUpdate = await request(app)
      .patch(`/api/communications/settings/inbox/escalations/${escalationCreate.body.id}`)
      .set('x-tenant-id', 'tenant-alpha')
      .set('x-user-id', 'ops-owner')
      .send({ active: false, responseTemplate: 'We escalated this conversation to the operations desk.' })
      .expect(200);

    expect(escalationUpdate.body.active).toBe(false);
    expect(escalationUpdate.body.responseTemplate).toContain('operations desk');

    await request(app)
      .delete(`/api/communications/settings/inbox/quick-replies/${quickReplyResponse.body.id}`)
      .set('x-tenant-id', 'tenant-alpha')
      .expect(204);

    await request(app)
      .delete(`/api/communications/settings/inbox/escalations/${escalationCreate.body.id}`)
      .set('x-tenant-id', 'tenant-alpha')
      .expect(204);

    const refreshed = await request(app)
      .get('/api/communications/settings/inbox')
      .set('x-tenant-id', 'tenant-alpha')
      .expect(200);

    expect(refreshed.body.quickReplies).toHaveLength(0);
    expect(refreshed.body.escalationRules).toHaveLength(0);
    const refreshedEntry = refreshed.body.entryPoints.find((item) => item.id === firstEntry.id);
    expect(refreshedEntry.label).toBe('Launch coordination');
    expect(refreshedEntry.enabled).toBe(false);
    expect(refreshed.body.entryPoints.some((item) => item.id === entryCreate.body.id)).toBe(false);
  });
});
