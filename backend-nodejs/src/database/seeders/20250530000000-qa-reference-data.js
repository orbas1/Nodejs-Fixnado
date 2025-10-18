import { createHash } from 'node:crypto';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = uuidv5('fixnado:qa-reference-seed', uuidv5.URL);

function idFor(token) {
  return uuidv5(token, NAMESPACE);
}

function hashPayload(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

const COMMUNICATION_CONFIG_ID = idFor('communications:config:qa');
const ENTRY_SUPPORT_ID = idFor('communications:entry:support');
const ENTRY_SALES_ID = idFor('communications:entry:sales');
const QUICK_REPLY_WELCOME_ID = idFor('communications:quickreply:welcome');
const QUICK_REPLY_ESCALATE_ID = idFor('communications:quickreply:escalate');
const ESCALATION_RULE_ID = idFor('communications:escalation:vip-handback');
const FINANCE_WEBHOOK_EVENT_ID = idFor('finance:webhook:stripe-payment-intent');
const FINANCE_WEBHOOK_ATTEMPT_ID = idFor('finance:webhook:stripe-payment-intent:attempt-1');
const SERVICE_ZONE_ID = idFor('service-zone:qa:central-london');
const QA_COMPANY_ID = '33333333-3333-3333-3333-333333333333';

export async function up({ context: queryInterface, Sequelize }) {
  const now = new Date();

  await queryInterface.bulkInsert('CommunicationsInboxConfiguration', [
    {
      id: COMMUNICATION_CONFIG_ID,
      tenant_id: 'qa-suite',
      region_code: 'eu-west-2',
      environment_key: 'staging',
      live_routing_enabled: true,
      default_greeting: 'Hi there! A member of the QA launch team will reply within a few minutes.',
      ai_assist_display_name: 'QA Copilot',
      ai_assist_description: 'Summarises regression context and auto-tags defects.',
      timezone: 'Europe/London',
      quiet_hours_start: '22:00',
      quiet_hours_end: '06:00',
      retention_expires_at: null,
      created_by: 'qa.release@fixnado.com',
      updated_by: 'qa.release@fixnado.com',
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('CommunicationsEntryPoint', [
    {
      id: ENTRY_SUPPORT_ID,
      configuration_id: COMMUNICATION_CONFIG_ID,
      key: 'support',
      label: 'Support inbox',
      description: 'Raise launch blockers, regression defects, and escalations.',
      default_message: 'Thanks for flagging the issue. We will acknowledge within 10 minutes.',
      icon: 'lifebuoy',
      image_url: null,
      enabled: true,
      display_order: 1,
      cta_label: 'View runbook',
      cta_url: 'https://wiki.fixnado.internal/runbooks/qa-support',
      retention_expires_at: null,
      created_by: 'qa.release@fixnado.com',
      updated_by: 'qa.release@fixnado.com',
      created_at: now,
      updated_at: now
    },
    {
      id: ENTRY_SALES_ID,
      configuration_id: COMMUNICATION_CONFIG_ID,
      key: 'sales',
      label: 'Sales enablement',
      description: 'Product specialists sharing collateral for enterprise demos.',
      default_message: 'Drop your request and we will curate a tailored deck.',
      icon: 'presentation-chart-line',
      image_url: null,
      enabled: true,
      display_order: 2,
      cta_label: 'Browse collateral',
      cta_url: 'https://wiki.fixnado.internal/sales/collateral',
      retention_expires_at: null,
      created_by: 'qa.release@fixnado.com',
      updated_by: 'qa.release@fixnado.com',
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('CommunicationsQuickReply', [
    {
      id: QUICK_REPLY_WELCOME_ID,
      configuration_id: COMMUNICATION_CONFIG_ID,
      title: 'Welcome new learners',
      body: 'Thanks for joining Fixnado Academy! Check the launch checklist pinned in #timeline-upgrades.',
      category: 'onboarding',
      sort_order: 1,
      allowed_roles: JSON.stringify(['support', 'moderator']),
      created_by: 'qa.release@fixnado.com',
      updated_by: 'qa.release@fixnado.com',
      retention_expires_at: null,
      created_at: now,
      updated_at: now
    },
    {
      id: QUICK_REPLY_ESCALATE_ID,
      configuration_id: COMMUNICATION_CONFIG_ID,
      title: 'Escalate to war room',
      body: 'We have moved your report to the release war room and opened a PagerDuty incident.',
      category: 'incident',
      sort_order: 2,
      allowed_roles: JSON.stringify(['support', 'admin']),
      created_by: 'qa.release@fixnado.com',
      updated_by: 'qa.release@fixnado.com',
      retention_expires_at: null,
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('CommunicationsEscalationRule', [
    {
      id: ESCALATION_RULE_ID,
      configuration_id: COMMUNICATION_CONFIG_ID,
      name: 'VIP timeline outage',
      description: 'Escalate VIP learner reports when the timeline feed is degraded.',
      trigger_type: 'keyword',
      trigger_metadata: JSON.stringify({ keywords: ['vip', 'timeline', 'outage'] }),
      target_type: 'team',
      target_reference: 'release-captains',
      target_label: 'Release captains',
      active: true,
      sla_minutes: 10,
      allowed_roles: JSON.stringify(['admin', 'support']),
      response_template: 'The release captains have been paged and will update you shortly.',
      created_by: 'qa.release@fixnado.com',
      updated_by: 'qa.release@fixnado.com',
      retention_expires_at: null,
      created_at: now,
      updated_at: now
    }
  ]);

  const financePayload = {
    type: 'payment_intent.succeeded',
    id: 'pi_3QaLaunch123',
    livemode: false,
    data: {
      object: {
        amount: 2499,
        currency: 'gbp',
        metadata: { checkout_flow: 'qa-reference' }
      }
    }
  };

  await queryInterface.bulkInsert('finance_webhook_events', [
    {
      id: FINANCE_WEBHOOK_EVENT_ID,
      provider: 'stripe',
      event_type: 'payment_intent.succeeded',
      payload_digest: hashPayload(financePayload),
      payload: JSON.stringify(financePayload),
      status: 'succeeded',
      attempts: 1,
      last_error: null,
      last_error_code: null,
      next_retry_at: null,
      order_id: null,
      payment_id: null,
      escrow_id: null,
      retention_expires_at: null,
      created_by: 'qa.release@fixnado.com',
      updated_by: 'qa.release@fixnado.com',
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('finance_webhook_event_attempts', [
    {
      id: FINANCE_WEBHOOK_ATTEMPT_ID,
      event_id: FINANCE_WEBHOOK_EVENT_ID,
      attempt_number: 1,
      status: 'delivered',
      response_code: 200,
      duration_ms: 245,
      payload_excerpt: JSON.stringify({ amount: 2499, currency: 'gbp' }),
      error: null,
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('ServiceZone', [
    {
      id: SERVICE_ZONE_ID,
      company_id: QA_COMPANY_ID,
      name: 'QA Central London',
      description: 'Regression coverage zone for Canary Wharf and City of London.',
      demand_level: 'high',
      boundary: JSON.stringify({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-0.115, 51.515],
              [-0.115, 51.535],
              [-0.045, 51.535],
              [-0.045, 51.515],
              [-0.115, 51.515]
            ]
          ]
        ]
      }),
      centroid: JSON.stringify({ type: 'Point', coordinates: [-0.08, 51.525] }),
      bounding_box: JSON.stringify({ west: -0.115, south: 51.515, east: -0.045, north: 51.535 }),
      metadata: JSON.stringify({ seeded: true, release: '1.00', qaOwner: 'qa.release@fixnado.com' }),
      created_at: now,
      updated_at: now
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.bulkDelete('ServiceZone', { id: SERVICE_ZONE_ID });
  await queryInterface.bulkDelete('finance_webhook_event_attempts', { id: FINANCE_WEBHOOK_ATTEMPT_ID });
  await queryInterface.bulkDelete('finance_webhook_events', { id: FINANCE_WEBHOOK_EVENT_ID });
  await queryInterface.bulkDelete('CommunicationsEscalationRule', { id: ESCALATION_RULE_ID });
  await queryInterface.bulkDelete('CommunicationsQuickReply', {
    id: [QUICK_REPLY_WELCOME_ID, QUICK_REPLY_ESCALATE_ID]
  });
  await queryInterface.bulkDelete('CommunicationsEntryPoint', {
    id: [ENTRY_SUPPORT_ID, ENTRY_SALES_ID]
  });
  await queryInterface.bulkDelete('CommunicationsInboxConfiguration', { id: COMMUNICATION_CONFIG_ID });
}
