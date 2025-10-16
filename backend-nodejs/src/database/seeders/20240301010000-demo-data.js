import { randomUUID } from 'node:crypto';

const identityId = '99999999-9999-4999-9999-999999999999';
const passportDocumentId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const licenceDocumentId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const permitDocumentId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const backgroundCheckId = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
const safetyBriefingCheckId = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
const watcherOpsId = 'ffffffff-ffff-4fff-ffff-ffffffffffff';
const watcherSafetyId = '11111111-aaaa-4aaa-aaaa-111111111111';
const statusEventId = '22222222-bbbb-4bbb-bbbb-222222222222';
const documentEventId = '33333333-cccc-4ccc-cccc-333333333333';

export async function up({ context: queryInterface }) {
  const userId = '11111111-1111-1111-1111-111111111111';
  const providerId = '22222222-2222-2222-2222-222222222222';
  const companyId = '33333333-3333-3333-3333-333333333333';

  await queryInterface.bulkInsert('User', [
    {
      id: userId,
      first_name: 'Avery',
      last_name: 'Stone',
      email: 'avery@fixnado.com',
      password_hash: '$2b$10$5eB0j3M0uD8M8tZq9nK6xexm3nXrCk6GUAn6gHgNsx3Rp3XIanFk2',
      type: 'user',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: providerId,
      first_name: 'Jordan',
      last_name: 'Miles',
      email: 'jordan@fixnado.com',
      password_hash: '$2b$10$5eB0j3M0uD8M8tZq9nK6xexm3nXrCk6GUAn6gHgNsx3Rp3XIanFk2',
      type: 'servicemen',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  const now = new Date();
  const requestedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const submittedAt = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await queryInterface.bulkInsert('ServicemanIdentity', [
    {
      id: identityId,
      serviceman_id: providerId,
      status: 'in_review',
      risk_rating: 'medium',
      verification_level: 'enhanced',
      reviewer_id: userId,
      requested_at: requestedAt,
      submitted_at: submittedAt,
      approved_at: null,
      expires_at: expiresAt,
      notes: 'Awaiting utility clearance confirmation before final approval.',
      metadata: JSON.stringify({ seeded: true }),
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('ServicemanIdentityDocument', [
    {
      id: passportDocumentId,
      identity_id: identityId,
      document_type: 'passport',
      status: 'approved',
      document_number: '502993741',
      issuing_country: 'United Kingdom',
      issued_at: new Date('2021-04-14T00:00:00Z'),
      expires_at: new Date('2031-04-13T00:00:00Z'),
      file_url: 'https://cdn.fixnado.example/documents/passport-jordan-miles.pdf',
      notes: 'Verified against original by compliance on 12 Feb 2025.',
      created_at: now,
      updated_at: now
    },
    {
      id: licenceDocumentId,
      identity_id: identityId,
      document_type: 'driving_license',
      status: 'in_review',
      document_number: 'MILEJ8021985A99',
      issuing_country: 'United Kingdom',
      issued_at: new Date('2022-08-01T00:00:00Z'),
      expires_at: new Date('2032-07-31T00:00:00Z'),
      file_url: 'https://cdn.fixnado.example/documents/licence-jordan-miles.pdf',
      notes: 'DVLA status refresh scheduled for 18 Feb 2025.',
      created_at: now,
      updated_at: now
    },
    {
      id: permitDocumentId,
      identity_id: identityId,
      document_type: 'work_permit',
      status: 'pending',
      document_number: 'UK-WP-77421',
      issuing_country: 'United Kingdom',
      issued_at: new Date('2023-03-01T00:00:00Z'),
      expires_at: new Date('2026-03-01T00:00:00Z'),
      file_url: 'https://cdn.fixnado.example/documents/work-permit-jordan-miles.pdf',
      notes: 'Awaiting client sponsor acknowledgement.',
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('ServicemanIdentityCheck', [
    {
      id: backgroundCheckId,
      identity_id: identityId,
      label: 'Enhanced DBS refresh',
      status: 'in_progress',
      owner: 'Compliance team',
      due_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      completed_at: null,
      created_at: now,
      updated_at: now
    },
    {
      id: safetyBriefingCheckId,
      identity_id: identityId,
      label: 'Hospital infection control briefing sign-off',
      status: 'not_started',
      owner: 'Safety manager',
      due_at: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      completed_at: null,
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('ServicemanIdentityWatcher', [
    {
      id: watcherOpsId,
      identity_id: identityId,
      email: 'ops.lead@fixnado.example',
      name: 'Clara Benton',
      role: 'operations_lead',
      notified_at: submittedAt,
      last_seen_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      created_at: now,
      updated_at: now
    },
    {
      id: watcherSafetyId,
      identity_id: identityId,
      email: 'safety.manager@fixnado.example',
      name: 'Isaac Morley',
      role: 'safety_manager',
      notified_at: submittedAt,
      last_seen_at: null,
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('ServicemanIdentityEvent', [
    {
      id: statusEventId,
      identity_id: identityId,
      event_type: 'status_change',
      title: 'Verification moved to in-review',
      description: 'Operations assigned Clara Benton as reviewer.',
      occurred_at: submittedAt,
      actor_id: userId,
      metadata: JSON.stringify({ previousStatus: 'pending', newStatus: 'in_review' }),
      created_at: submittedAt,
      updated_at: submittedAt
    },
    {
      id: documentEventId,
      identity_id: identityId,
      event_type: 'document_update',
      title: 'Driving licence uploaded',
      description: 'Awaiting DVLA verification response.',
      occurred_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      actor_id: userId,
      metadata: JSON.stringify({ documentId: licenceDocumentId }),
      created_at: now,
      updated_at: now
    }
  ]);

  await queryInterface.bulkInsert('Company', [
    {
      id: companyId,
      user_id: providerId,
      legal_structure: 'sole trader',
      contact_name: 'Jordan Miles',
      contact_email: 'jordan@fixnado.com',
      service_regions: 'Downtown, Coastal',
      marketplace_intent: 'Smart home equipment rentals',
      verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('Service', [
    {
      id: '44444444-4444-4444-4444-444444444444',
      provider_id: providerId,
      company_id: companyId,
      title: 'Smart home installation',
      description: 'Full installation and configuration for smart home devices',
      category: 'Home services',
      price: 180.0,
      currency: 'USD',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('user_preferences', [
    {
      id: '88888888-8888-4888-8888-888888888888',
      user_id: userId,
      timezone: 'Europe/London',
      locale: 'en-GB',
      organisation_name: 'Fixnado',
      job_title: 'Operations Lead',
      team_name: 'Dispatch',
      avatar_url: 'https://cdn.fixnado.com/profiles/avery-stone.png',
      signature: 'Avery Stone\\nOperations Lead',
      digest_frequency: 'daily',
      email_alerts: true,
      sms_alerts: true,
      push_alerts: false,
      marketing_opt_in: false,
      primary_phone_encrypted: null,
      workspace_shortcuts: ['provider', 'finance', 'enterprise'],
      role_assignments: [
        { id: 'role-provider', role: 'provider', allowCreate: true, dashboards: ['provider', 'finance'], notes: 'Manage crews' }
      ],
      notification_channels: [
        { id: 'channel-ops', type: 'email', label: 'Operations mailbox', value: 'ops@fixnado.com' }
      ],
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('Post', [
    {
      id: '55555555-5555-5555-5555-555555555555',
      user_id: userId,
      title: 'Need urgent plumbing fix',
      description: 'Pipe burst in kitchen, need help within 2 hours',
      budget: '$200',
      budget_amount: 200,
      budget_currency: 'USD',
      category: 'Plumbing',
      images: JSON.stringify([
        'https://cdn.fixnado.com/jobs/55555555-5555-5555-5555-555555555555/1.jpg',
        'https://cdn.fixnado.com/jobs/55555555-5555-5555-5555-555555555555/2.jpg'
      ]),
      metadata: JSON.stringify({
        scope: 'Kitchen burst pipe',
        accessNotes: 'Concierge will provide access, parking available at rear entrance.'
      }),
      location: 'San Francisco, CA',
      zone_id: '77777777-7777-7777-7777-777777777777',
      allow_out_of_zone: true,
      status: 'open',
      bid_deadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('MarketplaceItem', [
    {
      id: '66666666-6666-6666-6666-666666666666',
      company_id: companyId,
      title: 'Thermal imaging camera',
      description: 'Weekend rental with training session',
      price_per_day: 95.0,
      purchase_price: 1200.0,
      location: 'San Diego, CA',
      availability: 'rent',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('ServiceZone', [
    {
      id: '77777777-7777-7777-7777-777777777777',
      company_id: companyId,
      name: 'Downtown Core',
      boundary: JSON.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [-122.402, 37.792],
            [-122.405, 37.784],
            [-122.394, 37.782],
            [-122.389, 37.789],
            [-122.402, 37.792]
          ]
        ]
      }),
      centroid: JSON.stringify({ type: 'Point', coordinates: [-122.3975, 37.7875] }),
      bounding_box: JSON.stringify({
        west: -122.405,
        south: 37.782,
        east: -122.389,
        north: 37.792
      }),
      metadata: JSON.stringify({ municipality: 'San Francisco', zoneCode: 'DTC-01' }),
      demand_level: 'high',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkDelete('PlatformSetting', { key: 'admin_preferences' });
  await queryInterface.bulkInsert('PlatformSetting', [
    {
      id: randomUUID(),
      key: 'admin_preferences',
      value: JSON.stringify({
        general: {
          platformName: 'Fixnado',
          supportEmail: 'support@fixnado.com',
          defaultLocale: 'en-GB',
          defaultTimezone: 'Europe/London',
          brandColor: '#1D4ED8',
          loginUrl: 'https://app.fixnado.com/admin'
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          dailyDigestHour: 8,
          digestTimezone: 'Europe/London',
          escalationEmails: ['security@fixnado.com'],
          incidentWebhookUrl: ''
        },
        security: {
          requireMfa: true,
          sessionTimeoutMinutes: 30,
          passwordRotationDays: 90,
          allowPasswordless: false,
          ipAllowlist: [],
          loginAlertEmails: ['security@fixnado.com']
        },
        workspace: {
          maintenanceMode: false,
          maintenanceMessage: '',
          defaultLandingPage: '/admin/dashboard',
          theme: 'system',
          enableBetaFeatures: false,
          allowedAdminRoles: ['admin', 'operations'],
          quickLinks: [
            { label: 'Security centre', href: '/admin/dashboard#security-posture' },
            { label: 'Monetisation controls', href: '/admin/monetisation' }
          ]
        },
        __meta: {
          changedSections: [],
          version: 0
        }
      }),
      updated_by: 'system-bootstrap',
      created_at: now,
      updated_at: now
  await queryInterface.bulkInsert('ComplianceControl', [
    {
      id: '88888888-8888-8888-8888-888888888888',
      company_id: companyId,
      owner_team: 'Compliance Ops',
      title: 'Vendor security review',
      category: 'vendor',
      control_type: 'detective',
      status: 'monitoring',
      review_frequency: 'quarterly',
      next_review_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      last_review_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      owner_email: 'governance@fixnado.com',
      evidence_required: true,
      evidence_location: 's3://fixnado-compliance/vendor-security',
      documentation_url: 'https://docs.fixnado.com/compliance/vendor-security',
      escalation_policy: 'Escalate to compliance director after 48h overdue',
      notes: 'Ensure SOC 2 Type II letters are collected before renewal.',
      tags: ['vendor', 'security', 'soc2'],
      watchers: ['ciso@fixnado.com', 'governance@fixnado.com'],
      metadata: {
        evidenceCheckpoints: [
          {
            id: 'evidence-soc2',
            name: 'SOC 2 report upload',
            requirement: 'Upload SOC 2 Type II letter',
            dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            owner: 'Vendor success',
            status: 'pending'
          }
        ],
        exceptionReviews: [
          {
            id: 'exception-vendor',
            summary: 'Legacy supplier with compensating control',
            owner: 'Compliance Ops',
            status: 'monitoring',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      company_id: companyId,
      owner_team: 'Compliance Ops',
      title: 'Incident response plan drill',
      category: 'procedure',
      control_type: 'corrective',
      status: 'active',
      review_frequency: 'semiannual',
      next_review_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      last_review_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      owner_email: 'ir@fixnado.com',
      evidence_required: true,
      evidence_location: 's3://fixnado-compliance/ir-drills',
      documentation_url: 'https://docs.fixnado.com/compliance/incident-response',
      escalation_policy: 'Notify security leadership when drill is overdue',
      notes: 'Rotate drill facilitators per half to broaden ownership.',
      tags: ['security', 'training'],
      watchers: ['securitylead@fixnado.com'],
      metadata: {
        evidenceCheckpoints: [
          {
            id: 'evidence-report',
            name: 'Drill report uploaded',
            requirement: 'Attach post-mortem PDF',
            owner: 'Security ops',
            status: 'pending'
          }
        ],
        exceptionReviews: []
      },
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.bulkDelete('ServicemanIdentityEvent', { identity_id: identityId });
  await queryInterface.bulkDelete('ServicemanIdentityWatcher', { identity_id: identityId });
  await queryInterface.bulkDelete('ServicemanIdentityCheck', { identity_id: identityId });
  await queryInterface.bulkDelete('ServicemanIdentityDocument', { identity_id: identityId });
  await queryInterface.bulkDelete('ServicemanIdentity', { id: identityId });
  await queryInterface.bulkDelete('ComplianceControl', null, {});
  await queryInterface.bulkDelete('ServiceZone', null, {});
  await queryInterface.bulkDelete('MarketplaceItem', null, {});
  await queryInterface.bulkDelete('Post', null, {});
  await queryInterface.bulkDelete('Service', null, {});
  await queryInterface.bulkDelete('Company', null, {});
  await queryInterface.bulkDelete('User', null, {});
  await queryInterface.bulkDelete('PlatformSetting', { key: 'admin_preferences' });
}
